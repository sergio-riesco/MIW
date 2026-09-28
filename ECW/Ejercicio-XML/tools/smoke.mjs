/**
 * smoke.mjs -- Prueba rapida de la implementacion JavaScript.
 * Imprime el informe de cada fichero del corpus y comprueba que no revienta.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { analizarDocumento, analizarTexto } from "../packages/impl-js/vxml-lint.mjs";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..", "corpus");
const ficheros = readdirSync(raiz).filter((f) => f.endsWith(".vxml")).sort();

for (const f of ficheros) {
  const ruta = join(raiz, f);
  const buf = readFileSync(ruta);
  const texto = buf.toString("utf8");
  const t0 = process.hrtime.bigint();
  const inf = analizarDocumento(texto, f, new Uint8Array(buf));
  const json = analizarTexto(texto, f, new Uint8Array(buf));
  const t1 = process.hrtime.bigint();
  const ms = Number(t1 - t0) / 1e6;

  console.log("\n=== " + f + " (" + inf.bytes + " bytes, " + inf.lineas + " lineas) ===");
  console.log("   elementos=" + inf.elementos + "  forms=" + inf.formularios.length +
    "  campos=" + inf.estadisticas.campos + "  prompts=" + inf.estadisticas.prompts +
    "  saltos=" + inf.estadisticas.saltos);
  console.log("   grafo: nodos=" + inf.grafo.nodos + " aristas=" + inf.grafo.aristas +
    " ciclos=" + inf.grafo.ciclos + " inalcanzables=[" + inf.grafo.inalcanzables.join(", ") + "]");
  for (const d of inf.diagnosticos) {
    console.log("   " + d.linea + ":" + d.columna + "  " + d.gravedad.padEnd(7) +
      " " + d.regla + "  <" + d.elemento + ">" +
      (d.detalle ? "  [" + d.detalle + "]" : ""));
  }
  for (const n of inf.notas) {
    console.log("   nota " + n.linea + ":" + n.col + "  " + n.msg);
  }
  console.log("   JSON canonico: " + json.length + " bytes, " + ms.toFixed(2) + " ms");
}
