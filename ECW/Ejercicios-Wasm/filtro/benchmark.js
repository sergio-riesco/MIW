// ================================================================
// Banco de pruebas: WebAssembly contra JavaScript
// ================================================================

// Objetivo: que cada implementación se mida durante más o menos este
// tiempo. Así el resultado no depende de la resolución del reloj
// (performance.now() puede redondear a 0,1 ms o más).
const TARGET_MS = 60;

// Tope de pasadas por implementación, por si una vuelta es lentísima.
const MAX_ITERATIONS = 2000;

/**
 * Estima cuántas veces hay que repetir `fn` para llenar TARGET_MS.
 *
 * Cada implementación se calibra por separado, porque no tienen por
 * qué tardar lo mismo. Con un número de pasadas fijo, la más rápida
 * podría medirse en menos de un tic del reloj y el resultado no
 * valdría.
 */
function calibrate(fn) {
    fn(); // calentamiento, para no pagar la compilación en la medición

    const start = performance.now();
    fn();
    const one = performance.now() - start;

    // Mínimo de 0.001 ms, porque `one` puede dar 0 si la función ha
    // tardado menos que la resolución del reloj.
    const safe = Math.max(one, 0.001);

    return Math.min(MAX_ITERATIONS, Math.max(1, Math.round(TARGET_MS / safe)));
}

/**
 * Ejecuta `fn` `iterations` veces y mide cuánto tarda en total y de
 * media por pasada.
 */
export function measure(fn, iterations) {
    const start = performance.now();
    for (let i = 0; i < iterations; i++) fn();
    const total = performance.now() - start;

    return { total, avg: total / iterations };
}

/**
 * Mide varias implementaciones del mismo filtro y devuelve una fila por
 * cada una, con las diferencias ya calculadas.
 *
 * @param {Array<{label: string, run: Function, nodes: number}>} entries
 *        `nodes` es cuántos píxeles toca el algoritmo, para poder
 *        mostrar el caudal en megapíxeles por segundo.
 */
export function compare(entries) {
    const rows = entries.map((e) => {
        const iterations = calibrate(e.run);
        const { total, avg } = measure(e.run, iterations);

        return {
            label: e.label,
            iterations,
            total,
            avg,
            // Megapíxeles por segundo: (píxeles / ms) / 1000.
            throughput: avg > 0 ? (e.nodes / avg) / 1000 : Infinity
        };
    });

    // La primera entrada es la referencia (WASM). Para cada fila se
    // calcula cuántas veces tarda lo que la referencia: más de 1 es
    // más lenta y menos de 1 es más rápida.
    const base = rows[0];

    for (const row of rows) {
        row.slowerThan = base.avg > 0 ? row.avg / base.avg : Infinity;
    }

    return { rows };
}

/** Formatea milisegundos con los decimales que tocan. */
export function formatMs(ms) {
    if (ms >= 100) return ms.toFixed(0);
    if (ms >= 10) return ms.toFixed(1);
    return ms.toFixed(2);
}

/** Formatea una razón, tipo "88x". */
export function formatRatio(x) {
    if (!isFinite(x)) return '-';
    if (x >= 100) return Math.round(x) + 'x';
    if (x >= 10) return x.toFixed(0) + 'x';
    return x.toFixed(1) + 'x';
}