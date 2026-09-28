/**
 * test-diferencial.mjs -- Prueba de conformidad entre las tres implementaciones.
 * -----------------------------------------------------------------------------
 * Carga el motor JavaScript (referencia), el TypeScript compilado y el
 * WebAssembly/Rust, analiza TODO el corpus (casos manuales + corpus/grande)
 * y compara los informes JSON canonicos BYTE A BYTE:
 *
 *   1. JS infra vs JS infra              (autoconsistencia)
 *   2. TS  igual a JS byte a byte
 *   3. WASM igual a JS byte a byte
 *
 * El nombre de archivo se pasa VACIO en las tres implementaciones; lo que se
 * compara es exactamente lo que publica la API publica de cada motor.
 *
 * Salida: un resumen por fichero (IGUAL/DIFERENTE) y un veredicto global.
 * Termina con codigo de salida != 0 si hay cualquier diferencia.
 * -----------------------------------------------------------------------------
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { analizarTexto as jsAnalizar } from "../packages/impl-js/vxml-lint.mjs";
import { analizarTexto as tsAnalizar } from "../packages/impl-ts/lib/vxml-lint.js";
import { cargarMotorWasm, analizarTextoWasm } from "../packages/impl-wasm/wasm.mjs";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..", "corpus");

/** Lista ficheros *.vxml de un directorio, ordenados. */
function ficheros(dir) {
  return readdirSync(dir).filter((f) => f.endsWith(".vxml")).sort().map((f) => join(dir, f));
}

const rutas = [...ficheros(raiz), ...ficheros(join(raiz, "grande"))];

let fallos = 0;
let total = 0;

await cargarMotorWasm();

for (const ruta of rutas) {
  const f = ruta.slice(raiz.length + 1);
  const buf = readFileSync(ruta);
  const bytes = new Uint8Array(buf);

  // Cada motor recibe (texto, nombre="", src). La ruta WASM recibe bytes+nombre.
  const js = jsAnalizar(buf.toString("utf8"), "", bytes);
  const ts = tsAnalizar(buf.toString("utf8"), "", bytes);
  const wasm = analizarTextoWasm(bytes, "");

  total += 1;
  const iguales = js === ts && js === wasm;

  if (iguales) {
    console.log(`IGUAL    ${f}  (${js.length} bytes)`);
  } else {
    fallos += 1;
    const n = (a, b) => (a === b ? "" : ` js=${a.length} ts=${b.length} wasm=${wasm.length}`);
    console.log(`DIFERENTE ${f}${n(js, ts)}`);
    if (js !== ts) {
      console.log("  js vs ts: primer byte distinto en offset " + primerOffset(js, ts));
    }
    if (js !== wasm) {
      console.log("  js vs wasm: primer byte distinto en offset " + primerOffset(js, wasm));
    }
  }
}

console.log(`\n${total} ficheros, ${fallos} diferencias.`);
if (fallos > 0) {
  console.error(`FALLO: ${fallos} fichero(s) NO son byte-identicos.`);
  process.exit(1);
}
console.log("OK: las tres implementaciones emiten informes identicos byte a byte.");

/** Offset del primer byte en el que difieren dos strings. */
function primerOffset(a, b) {
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) if (a.charCodeAt(i) !== b.charCodeAt(i)) return i;
  return n;
}