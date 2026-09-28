/**
 * serve.mjs -- Servidor estatico de desarrollo para la interfaz web.
 * -----------------------------------------------------------------------------
 * Sirve la raiz del proyecto con tipos MIME correctos (.mjs, .wasm, .vxml…)
 * y dos rutas auxiliares:
 *
 *   GET /            -> packages/ui/index.html
 *   GET /api/corpus  -> JSON con los ficheros *.vxml del corpus
 *
 * Uso:  node tools/serve.mjs [puerto]   (por defecto 8080)
 * Abrir http://localhost:8080/
 * -----------------------------------------------------------------------------
 */
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, dirname, extname, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const puerto = Number(process.argv[2] || process.env.PORT || 8080);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".wasm": "application/wasm",
  ".vxml": "application/voicexml+xml; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
};

/** Lista de ficheros *.vxml del corpus, ordenados, con ruta y tamano. */
async function listaCorpus() {
  const { readdir } = await import("node:fs/promises");
  const salida = [];
  for (const dir of ["corpus", "corpus/grande"]) {
    for (const f of (await readdir(join(raiz, dir))).filter((x) => x.endsWith(".vxml")).sort()) {
      const ruta = dir + "/" + f;
      const s = await stat(join(raiz, ruta));
      salida.push({ nombre: f, ruta, bytes: s.size });
    }
  }
  return salida;
}

async function enviar(res, rutaRel) {
  const ruta = normalize(join(raiz, rutaRel));
  if (!ruta.startsWith(raiz + sep) && ruta !== raiz) {
    res.writeHead(403).end("Fuera de la raiz.");
    return;
  }
  try {
    const data = await readFile(ruta);
    res.writeHead(200, {
      "Content-Type": MIME[extname(ruta).toLowerCase()] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    res.end(data);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("404 — " + rutaRel);
  }
}

const servidor = createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  let ruta = decodeURIComponent(url.pathname);

  if (ruta === "/") ruta = "/packages/ui/index.html";

  if (ruta === "/api/corpus") {
    const ficheros = await listaCorpus();
    const bytes = ficheros.reduce((a, f) => a + f.bytes, 0);
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
    res.end(JSON.stringify({ ficheros, bytes, total: ficheros.length }));
    return;
  }

  if (ruta.startsWith("/api/")) {
    res.writeHead(404, { "Content-Type": "application/json; charset=utf-8" }).end(JSON.stringify({ error: "desconocida" }));
    return;
  }

  await enviar(res, ruta.slice(1));
  console.log(new Date().toISOString().slice(11, 19), req.method, req.url);
});

servidor.listen(puerto, () => {
  console.log(`VXML Doctor UI en http://localhost:${puerto}/  (raiz: ${raiz})`);
});