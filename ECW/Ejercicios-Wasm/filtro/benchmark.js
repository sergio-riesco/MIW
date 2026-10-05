// Medición WASM vs JS.

// Cada implementación se mide unos 60 ms. Con menos, performance.now()
// no tiene resolución suficiente para las imágenes pequeñas.
const TARGET_MS = 60;
const MAX_ITERATIONS = 2000;

// Cuántas pasadas caben en TARGET_MS. Se calcula para cada una por
// separado porque no tardan lo mismo.
function calibrate(fn) {
    fn(); // calentamiento (JIT)

    const start = performance.now();
    fn();
    const one = performance.now() - start;

    // one puede salir 0 si tarda menos que un tic del reloj
    const safe = Math.max(one, 0.001);

    return Math.min(MAX_ITERATIONS, Math.max(1, Math.round(TARGET_MS / safe)));
}

// Tiempo total y medio de ejecutar fn varias veces.
export function measure(fn, iterations) {
    const start = performance.now();
    for (let i = 0; i < iterations; i++) fn();
    const total = performance.now() - start;

    return { total, avg: total / iterations };
}

// Mide cada entrada { label, run, nodes } y devuelve una fila por cada una.
// nodes = número de píxeles, para sacar los megapíxeles por segundo.
export function compare(entries) {
    const rows = entries.map((e) => {
        const iterations = calibrate(e.run);
        const { total, avg } = measure(e.run, iterations);

        return {
            label: e.label,
            iterations,
            total,
            avg,
            // (píxeles / ms) / 1000 = Mpx/s
            throughput: avg > 0 ? (e.nodes / avg) / 1000 : Infinity
        };
    });

    // La primera fila (WASM) es la referencia: >1 es más lento, <1 más rápido.
    const base = rows[0];

    for (const row of rows) {
        row.slowerThan = base.avg > 0 ? row.avg / base.avg : Infinity;
    }

    return { rows };
}

// Menos decimales cuanto más grande es el número.
export function formatMs(ms) {
    if (ms >= 100) return ms.toFixed(0);
    if (ms >= 10) return ms.toFixed(1);
    return ms.toFixed(2);
}

// "2.5x", "88x"...
export function formatRatio(x) {
    if (!isFinite(x)) return '-';
    if (x >= 100) return Math.round(x) + 'x';
    if (x >= 10) return x.toFixed(0) + 'x';
    return x.toFixed(1) + 'x';
}