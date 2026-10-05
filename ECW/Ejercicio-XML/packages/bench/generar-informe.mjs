// generar-informe.mjs -- genera informe.html a partir de resultados.json.
// Es un HTML sin dependencias, se puede abrir o imprimir directamente.

import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const aqui = dirname(fileURLToPath(import.meta.url));
const r = JSON.parse(readFileSync(join(aqui, "resultados.json"), "utf8"));

const MOTORES = [
  { id: "js", nombre: "JavaScript (referencia)" },
  { id: "ts", nombre: "TypeScript" },
  { id: "wasm", nombre: "WebAssembly (Rust)" },
];

const fmt = (n, d = 1) => (typeof n === "number" ? n.toFixed(d) : "–");
const med = (p) => p.medianaMs;

// el mas rapido es la referencia de la columna "x veces"
const masRapido = Math.min(...MOTORES.map((m) => med(r.porImplementacion[m.id])));
// y el mas lento marca el 100 % de las barras
const masLento = Math.max(...MOTORES.map((m) => med(r.porImplementacion[m.id])));
const ratio = (ms) => (ms / masRapido).toFixed(2) + "×";

const fecha = new Date(r.fecha).toLocaleString("es-ES", { dateStyle: "long", timeStyle: "short" });

// documentos de mayor a menor
const ficheros = Object.entries(r.porFichero).sort((a, b) => b[1].bytes - a[1].bytes);

// --- HTML ---
const bar = (ms, max) => {
  const w = Math.max(2, Math.round((ms / max) * 100));
  return `<div class="bar" style="width:${w}%"></div>`;
};

const filasResumen = MOTORES.map((m) => {
  const p = r.porImplementacion[m.id];
  return `<tr>
    <td class="nombre">${m.nombre}</td>
    <td><div class="celda-barra">${bar(med(p), masLento)}<span>${fmt(med(p))} ms</span></div></td>
    <td>${fmt(p.minMs)}</td>
    <td>${fmt(p.maxMs)}</td>
    <td class="fuerte">${fmt(p.mibS)}</td>
    <td>${ratio(med(p))}</td>
    <td>${fmt(r.arranque[m.id], 2)}</td>
    <td>${fmt(r.primer[m.id], 2)}</td>
  </tr>`;
}).join("\n");

const maxFichero = Math.max(...ficheros.map(([, d]) => Math.max(d.js, d.ts, d.wasm)));
const filasFichero = ficheros.map(([f, d]) => {
  const celda = (ms) =>
    `<div class="celda-barra">${bar(ms, maxFichero)}<span>${fmt(ms)}</span></div>`;
  return `<tr>
    <td class="nombre">${f}</td>
    <td class="bytes">${d.bytes}</td>
    <td>${celda(d.js)}</td>
    <td>${celda(d.ts)}</td>
    <td>${celda(d.wasm)}</td>
  </tr>`;
}).join("\n");

// para la frase de la cabecera
const aceleracion = (r.porImplementacion.js.medianaMs / r.porImplementacion.wasm.medianaMs).toFixed(2);

const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Informe del banco de pruebas — VXML Doctor</title>
<style>
  :root { --tinta:#1c2733; --tenue:#5b6b7b; --linea:#e2e8f0; --accent:#0f766e; }
  * { box-sizing: border-box; }
  body { font-family: "Segoe UI", system-ui, sans-serif; color: var(--tinta);
         max-width: 980px; margin: 2rem auto; padding: 0 1.25rem; line-height: 1.5; }
  h1 { font-size: 1.5rem; margin-bottom: .25rem; }
  h2 { font-size: 1.15rem; margin-top: 2.25rem; border-bottom: 1px solid var(--linea); padding-bottom: .35rem; }
  .meta { color: var(--tenue); font-size: .9rem; margin-bottom: 1.75rem; }
  table { width: 100%; border-collapse: collapse; font-size: .9rem; margin: 1rem 0 2rem; }
  th, td { padding: .5rem .6rem; border-bottom: 1px solid var(--linea); text-align: right; white-space: nowrap; }
  th { background: #f6f8fa; font-weight: 600; }
  td.nombre, th:first-child { text-align: left; }
  td.bytes { color: var(--tenue); font-variant-numeric: tabular-nums; }
  .celda-barra { display: flex; align-items: center; gap: .5rem; min-width: 130px; }
  .bar { background: var(--accent); height: 12px; border-radius: 3px; opacity: .85; }
  .fuerte { font-weight: 600; color: var(--accent); }
  .destacado { background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px;
               padding: .9rem 1rem; margin: 1.25rem 0; font-size: .95rem; }
  .pie { color: var(--tenue); font-size: .8rem; margin-top: 2.5rem; }
  @media print { body { margin: 0; } .bar { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
</style>
</head>
<body>
  <h1>Informe del banco de pruebas — VXML Doctor</h1>
  <p class="meta">${fecha} · Node ${r.entorno.node} · ${r.entorno.plataforma}/${r.entorno.arquitectura} · ${r.entorno.cpu} · ${r.entorno.nucleos} núcleos · ${r.entorno.memoriaGb} GiB RAM<br>
  Corpus: ${r.corpus.ficheros} documentos, ${(r.corpus.bytes / 1024 ** 2).toFixed(2)} MiB, ${r.corpus.pasadas} pasadas medidas por motor con gc() entre pasadas.</p>

  <div class="destacado">El motor WebAssembly es <strong>${aceleracion}× más rápido</strong> que el JavaScript de referencia con el corpus completo analizado (mediana de pasadas).</div>

  <h2>Resumen</h2>
  <table>
    <thead><tr>
      <th>Implementación</th><th>Mediana (ms)</th><th>Mínimo</th><th>Máximo</th>
      <th>MiB/s</th><th>vs. más rápido</th><th>Arranque (ms)</th><th>Primer análisis (ms)</th>
    </tr></thead>
    <tbody>
${filasResumen}
    </tbody>
  </table>

  <h2>Mediana por documento (ms)</h2>
  <p class="meta">Ordenados de mayor a menor tamaño. Barras normalizadas al documento más lento.</p>
  <table>
    <thead><tr><th>Documento</th><th>Bytes</th><th>JS</th><th>TS</th><th>WASM</th></tr></thead>
    <tbody>
${filasFichero}
    </tbody>
  </table>

  <p class="pie">Generado por packages/bench/generar-informe.mjs a partir de packages/bench/resultados.json.
  Las tres implementaciones emiten informes JSON byte a byte idénticos (comprobado por tools/test-diferencial.mjs).</p>
</body>
</html>
`;

writeFileSync(join(aqui, "informe.html"), html);
console.log("packages/bench/informe.html escrito.");