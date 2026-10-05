// test-diferencial.mjs -- comprueba que las tres versiones dan el mismo informe.
//
// Analiza todo el corpus (casos manuales y corpus/grande) con JS, TS y WASM y
// compara los JSON byte a byte. El nombre de archivo se pasa vacio en las tres.
// Si hay alguna diferencia, sale con codigo distinto de 0.

import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { analizarTexto as jsAnalizar } from "../packages/impl-js/vxml-lint.mjs";
import { analizarTexto as tsAnalizar } from "../packages/impl-ts/lib/vxml-lint.js";
import { cargarMotorWasm, analizarTextoWasm } from "../packages/impl-wasm/wasm.mjs";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..", "corpus");

// .vxml de una carpeta, ordenados
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

  // JS y TS reciben (texto, "", bytes); WASM recibe (bytes, "")
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

// primera posicion en la que difieren
function primerOffset(a, b) {
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) if (a.charCodeAt(i) !== b.charCodeAt(i)) return i;
  return n;
}