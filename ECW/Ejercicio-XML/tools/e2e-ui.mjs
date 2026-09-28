/**
 * e2e-ui.mjs -- Prueba de extremo a extremo de la interfaz web en un NAVEGADOR REAL.
 * -----------------------------------------------------------------------------
 * 1. Arranca el servidor estatico en un puerto libre.
 * 2. Lanza Chrome/Edge headless contra tools/e2e.html, que carga
 *    packages/ui/app.mjs de verdad y ejecuta:
 *      - arranque de app.mjs (catalogo inyectado por HTTP)
 *      - analisis con el motor WebAssembly dentro del navegador
 *      - comparativa de los tres motores -> 3/3 identicos byte a byte
 *      - analisis con JavaScript de un fichero con acentos (contrato de columnas)
 * 3. La pagina ENTREGA el veredicto al servidor (POST /api/e2e-resultado);
 *    este script lo consulta por GET hasta que llega (max 60 s) y despues
 *    cierra el navegador. Termina con codigo != 0 si falla.
 *
 * Uso:  npm run test:ui    (o  node tools/e2e-ui.mjs)
 * Chrome se busca en CHROME_PATH o en las rutas habituales.
 * -----------------------------------------------------------------------------
 */
import { spawn, execFile } from "node:child_process";
import { rmSync, mkdtempSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { platform, tmpdir } from "node:os";
import { arrancar } from "./serve.mjs";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");

// --- Localizacion del navegador -------------------------------------------------
// Se busca por EXISTENCIA del ejecutable (no se ejecuta: lanzar chrome.exe
// --version desde un spawn sincrono puede levantar un arbol de procesos que
// nunca termina y dejar el runner bloqueado para siempre).
function navegador() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const candidatos = [];
  if (platform() === "win32") {
    const pf = process.env["ProgramFiles"] || "C:\\Program Files";
    const pf86 = process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)";
    candidatos.push(
      join(pf, "Google", "Chrome", "Application", "chrome.exe"),
      join(pf86, "Google", "Chrome", "Application", "chrome.exe"),
      join(pf86, "Microsoft", "Edge", "Application", "msedge.exe"),
      join(pf, "Microsoft", "Edge", "Application", "msedge.exe")
    );
  } else {
    candidatos.push(
      "/usr/bin/google-chrome", "/usr/bin/google-chrome-stable",
      "/usr/bin/chromium", "/usr/bin/chromium-browser", "/opt/google/chrome/chrome"
    );
  }
  return candidatos.find((c) => existsSync(c)) || null;
}

/** Mata el arbol de procesos del navegador (hijo.kill() solo toca el padre). */
function matarArbol(pid) {
  try {
    execFile("taskkill", ["/F", "/T", "/PID", String(pid)], { windowsHide: true });
  } catch {
    /* ya no existia */
  }
}

const chrome = navegador();
if (!chrome) {
  console.error("No se encontro Chrome/Edge. Define CHROME_PATH con la ruta del ejecutable.");
  process.exit(3);
}

// --- Arrancar servidor + navegador ----------------------------------------------
const { servidor, puerto } = await arrancar(raiz, 0);
const perfil = mkdtempSync(join(tmpdir(), "vxml-e2e-"));
const url = `http://localhost:${puerto}/tools/e2e.html`;

console.log(`Servidor en http://localhost:${puerto}/  · navegador: ${chrome}`);
console.log("E2E: lanzando chrome…");
const hijo = spawn(chrome, [
  "--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check",
  `--user-data-dir=${perfil}`, url,
], { stdio: "ignore" });

try {
  // Espera el veredicto que la pagina entrega por HTTP.
  const tope = Date.now() + 60_000;
  let texto = "";
  while (Date.now() < tope) {
    try {
      const ctrl = new AbortController();
      const crono = setTimeout(() => ctrl.abort(), 5_000);
      const r = await fetch(`http://localhost:${puerto}/api/e2e-resultado`, { signal: ctrl.signal });
      clearTimeout(crono);
      const t = await r.text();
      if (t) { texto = t; break; }
    } catch (e) {
      console.log("E2E: poll fallo (" + e.message + "), reintento…");
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  matarArbol(hijo.pid);
  console.log("E2E: chrome cerrado, veredicto " + (texto ? "recibido" : "AUSENTE"));

  if (!texto) {
    console.error("E2E FALLO: la pagina no entrego el veredicto en 60 s.");
    process.exit(1);
  }
  console.log(texto);
  process.exit(/^E2E OK/.test(texto.trim()) ? 0 : 1);
} finally {
  servidor.closeAllConnections?.();
  servidor.close();
  rmSync(perfil, { recursive: true, force: true });
}