/**
 * generar.mjs -- Genera los sitios web de los ejemplos desde la consola.
 *
 * Usa el mismo módulo WebAssembly que la interfaz web (app/pkg): lee cada
 * ejemplos/<nombre>.xml y escribe el sitio en sitios/<nombre>/.
 *
 * Las imágenes, vídeos y audios de cada sitio ya están en su carpeta de
 * sitios/ (las rutas del XML son relativas a ella); aquí solo se comprueba
 * que existen.
 *
 * Uso: node tools/generar.mjs [nombre...]   (sin nombres: todos los ejemplos)
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = join(raiz, "app", "pkg");

if (!existsSync(join(pkg, "generador_wasm_bg.wasm"))) {
  console.error("Falta app/pkg: compila primero el generador con npm run build.");
  process.exit(1);
}

// wasm-pack genera el envoltorio para el navegador (--target web); en Node se
// le pasan los bytes del .wasm en vez de descargarlo con fetch.
const modulo = await import(pathToFileURL(join(pkg, "generador_wasm.js")).href);
await modulo.default({ module_or_path: readFileSync(join(pkg, "generador_wasm_bg.wasm")) });

const pedidos = process.argv.slice(2);
const ejemplos = readdirSync(join(raiz, "ejemplos"))
  .filter((f) => f.endsWith(".xml"))
  .map((f) => basename(f, ".xml"))
  .filter((n) => pedidos.length === 0 || pedidos.includes(n))
  .sort();

let errores = 0;
for (const nombre of ejemplos) {
  const xml = readFileSync(join(raiz, "ejemplos", `${nombre}.xml`), "utf8");
  const destino = join(raiz, "sitios", nombre);

  let salida;
  try {
    salida = modulo.generar(xml);
  } catch (e) {
    console.error(`${nombre}: ${e.message ?? e}`);
    errores++;
    continue;
  }

  mkdirSync(destino, { recursive: true });
  const paginas = [];
  for (let i = 0; i < salida.length; i += 2) {
    writeFileSync(join(destino, salida[i]), salida[i + 1]);
    if (salida[i].endsWith(".html")) paginas.push(salida[i]);
  }

  // Recursos que el XML usa y no están en la carpeta del sitio.
  const faltan = [...xml.matchAll(/\b(?:foto|imagen|trailer|fragmento)="([^"]+)"/g)]
    .map((m) => m[1].replace(/&amp;/g, "&"))
    .filter((r) => !/^(https?:|data:)/i.test(r) && !existsSync(join(destino, r)));

  console.log(`sitios/${nombre}/  ${paginas.length} páginas: ${paginas.join(", ")}`);
  for (const r of faltan) console.warn(`    aviso: falta ${r}`);
}

if (errores) process.exit(1);
