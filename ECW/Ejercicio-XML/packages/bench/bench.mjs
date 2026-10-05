// bench.mjs -- mide las tres versiones sobre el corpus grande.
// Se ejecuta con node --expose-gc (npm run bench ya lo hace).
//
// Guarda en resultados.json:
//   arranqueMs  cargar el motor (import, o compilar e instanciar el wasm)
//   primerMs    primer analisis despues de cargar (sin JIT caliente)
//   pasadasMs   N pasadas sobre todo corpus/grande, con gc() entre medias
//   porFichero  mediana de cada documento
// y de ahi saca mediana, minimo, maximo y MiB/s.
//
// Antes de medir comprueba que las tres sacan el mismo JSON; si no, para.
// El orden de las versiones va rotando en cada pasada para repartir efectos
// como el calentamiento de V8.

import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { platform, arch, cpus, totalmem } from "node:os";

const aqui = dirname(fileURLToPath(import.meta.url));
const raiz = join(aqui, "..", "..");
const corpusDir = join(raiz, "corpus", "grande");

// --- Carga de motores (el import cuenta como arranque) ---
const t0 = process.hrtime.bigint();
const { analizarTexto: jsAnalizar } = await import("../impl-js/vxml-lint.mjs");
const t1 = process.hrtime.bigint();
const { analizarTexto: tsAnalizar } = await import("../impl-ts/lib/vxml-lint.js");
const t2 = process.hrtime.bigint();
const wasmMod = await import("../impl-wasm/wasm.mjs");
const t3 = process.hrtime.bigint();
const { cargarMotorWasm, analizarTextoWasm } = wasmMod;
await cargarMotorWasm();
const t4 = process.hrtime.bigint();

const ms = (a, b) => Number(b - a) / 1e6;

const motor = [
  { id: "js", nombre: "JavaScript", analizar: (texto, bytes) => jsAnalizar(texto, "", bytes) },
  { id: "ts", nombre: "TypeScript", analizar: (texto, bytes) => tsAnalizar(texto, "", bytes) },
  { id: "wasm", nombre: "WebAssembly/Rust", analizar: (texto, bytes) => analizarTextoWasm(bytes, "") },
];

const arranque = {
  js: ms(t0, t1),
  ts: ms(t1, t2),
  wasm: ms(t2, t4), // import de la envoltura + compile/instantiate del .wasm
};

// --- Corpus ---
const ficheros = readdirSync(corpusDir).filter((f) => f.endsWith(".vxml")).sort();
const documentos = ficheros.map((f) => {
  const buf = readFileSync(join(corpusDir, f));
  return { nombre: f, texto: buf.toString("utf8"), bytes: new Uint8Array(buf), nBytes: buf.length };
});
const bytesTotales = documentos.reduce((a, d) => a + d.nBytes, 0);

const PASADAS = 9;

// --- Primer analisis y calentamiento ---
const primer = {};
for (const m of motor) {
  const d = documentos[0];
  const t = process.hrtime.bigint();
  m.analizar(d.texto, d.bytes);
  primer[m.id] = ms(t, process.hrtime.bigint());
}

// el de JS es la referencia para comparar
const refPorFichero = documentos.map((d) => motor[0].analizar(d.texto, d.bytes));

for (let p = 0; p < 2; p++) {
  for (const m of motor) {
    for (let i = 0; i < documentos.length; i++) {
      const d = documentos[i];
      const salida = m.analizar(d.texto, d.bytes);
      if (salida !== refPorFichero[i]) {
        console.error(`FALLO DE CONFORMIDAD en ${m.id} / ${d.nombre} durante el calentamiento.`);
        process.exit(2);
      }
    }
  }
}

// --- Pasadas (rotando el orden de los motores) ---
const pasadas = { js: [], ts: [], wasm: [] };
const porFichero = documentos.map(() => ({ js: [], ts: [], wasm: [] }));

for (let p = 0; p < PASADAS; p++) {
  const orden = p % 2 === 0 ? motor : [motor[1], motor[2], motor[0]];
  for (const m of orden) {
    globalThis.gc?.();
    const t = process.hrtime.bigint();
    for (let i = 0; i < documentos.length; i++) {
      const d = documentos[i];
      const t0f = process.hrtime.bigint();
      m.analizar(d.texto, d.bytes);
      porFichero[i][m.id].push(ms(t0f, process.hrtime.bigint()));
    }
    pasadas[m.id].push(ms(t, process.hrtime.bigint()));
  }
}

const mediana = (arr) => {
  const a = [...arr].sort((x, y) => x - y);
  const n = a.length;
  return n % 2 ? a[(n - 1) / 2] : (a[n / 2 - 1] + a[n / 2]) / 2;
};

const informe = {
  fecha: new Date().toISOString(),
  entorno: {
    node: process.version,
    plataforma: platform(),
    arquitectura: arch(),
    nucleos: cpus().length,
    cpu: cpus()[0]?.model?.trim() || "",
    memoriaGb: +(totalmem() / 1024 ** 3).toFixed(1),
  },
  corpus: { ficheros: documentos.length, bytes: bytesTotales, pasadas: PASADAS },
  arranque,
  primer,
  porImplementacion: Object.fromEntries(
    motor.map((m) => [
      m.id,
      {
        nombre: m.nombre,
        pasadasMs: pasadas[m.id],
        medianaMs: mediana(pasadas[m.id]),
        minMs: Math.min(...pasadas[m.id]),
        maxMs: Math.max(...pasadas[m.id]),
        mibS: (bytesTotales / (mediana(pasadas[m.id]) / 1000)) / 1024 ** 2,
      },
    ])
  ),
  porFichero: Object.fromEntries(
    ficheros.map((f, i) => [
      f,
      {
        bytes: documentos[i].nBytes,
        js: mediana(porFichero[i].js),
        ts: mediana(porFichero[i].ts),
        wasm: mediana(porFichero[i].wasm),
      },
    ])
  ),
};

const salida = join(aqui, "resultados.json");
writeFileSync(salida, JSON.stringify(informe, null, 2));

// --- Resumen ---
console.log(`Motor JS/TS cargados; WASM compile+instantiate OK (${arranque.wasm.toFixed(1)} ms).`);
console.log(`Corpus: ${documentos.length} ficheros, ${(bytesTotales / 1024 ** 2).toFixed(2)} MiB, ${PASADAS} pasadas medidas.\n`);
for (const m of motor) {
  const r = informe.porImplementacion[m.id];
  console.log(
    `${m.nombre.padEnd(18)} mediana ${r.medianaMs.toFixed(1).padStart(7)} ms` +
    `   min ${r.minMs.toFixed(1)} max ${r.maxMs.toFixed(1)}   ${r.mibS.toFixed(1)} MiB/s` +
    `   primer analisis ${primer[m.id].toFixed(2)} ms`
  );
}
console.log(`\nResultados guardados en ${salida}`);