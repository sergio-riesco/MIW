// Paleta clásica de 4 colores de Game Boy
// Index 0: #9bbc0f (Más claro)
// Index 1: #8bac0f (Claro)
// Index 2: #306230 (Oscuro)
// Index 3: #0f380f (Más oscuro)
const PALETTE_RGB = [
    [155, 188, 15],
    [139, 172, 15],
    [48, 98, 48],
    [15, 56, 15]
];

// Precalcula colores en entero de 24 bits (0xRRGGBB)
const PALETTE_PACKED = PALETTE_RGB.map(([r, g, b]) => (r << 16) | (g << 8) | b);

// Función $nearest: Encuentra el índice del color más cercano por distancia de color
function nearest(r, g, b) {
    let minDistance = Infinity;
    let closestIndex = 0;

    for (let i = 0; i < PALETTE_RGB.length; i++) {
        const [pr, pg, pb] = PALETTE_RGB[i];
        const dr = r - pr;
        const dg = g - pg;
        const db = b - pb;
        const dist = dr * dr + dg * dg + db * db;

        if (dist < minDistance) {
            minDistance = dist;
            closestIndex = i;
        }
    }
    return closestIndex;
}

// Función $palette: Devuelve el entero de color según el índice
function palette(index) {
    return PALETTE_PACKED[index & 3];
}

let wasmExports = null;
let wasmMemory = null;

export async function initWasm() {
    if (wasmExports) return { exports: wasmExports, memory: wasmMemory };

    const filtroGB = './filtroGB.wasm';

    const importObject = {
        env: {
            nearest: nearest,
            palette: palette
        }
    };

    // Descargar el binario
    const resp = await fetch(filtroGB);
    if (!resp.ok) {
        throw new Error(`No se pudo cargar ${filtroGB}: ${resp.status} ${resp.statusText}`);
    }

    const bytes = await resp.arrayBuffer();

    // Instanciar (primero sin memoria importada).
    let result;
    try {
        result = await WebAssembly.instantiate(bytes, importObject);
    } catch (e) {
        console.error('Fallo al instanciar WASM en primer intento:', e);
        throw e;
    }

    const instance = (result instanceof WebAssembly.Instance) ? result : result?.instance;
    if (!instance || !instance.exports) {
        throw new Error('La instancia WASM no es válida o no tiene exports.');
    }

    // Si el módulo exporta su propia memoria, úsala. De lo contrario,
    // crea una memoria y re-instancia pasando `env.memory`.
    if (instance.exports.memory) {
        wasmMemory = instance.exports.memory;
        wasmExports = instance.exports;
        return { exports: wasmExports, memory: wasmMemory };
    }

    // Re-instanciar con memoria importada si no había memoria exportada
    wasmMemory = new WebAssembly.Memory({ initial: 160 });
    importObject.env.memory = wasmMemory;

    let result2;
    try {
        result2 = await WebAssembly.instantiate(bytes, importObject);
    } catch (e) {
        console.error('Fallo al instanciar WASM con memoria importada:', e);
        throw e;
    }

    const instance2 = (result2 instanceof WebAssembly.Instance) ? result2 : result2?.instance;
    if (!instance2 || !instance2.exports) {
        throw new Error('La segunda instancia WASM no es válida o no tiene exports.');
    }

    wasmExports = instance2.exports;
    // Preferir la memoria exportada si ahora existe, sino usar la creada.
    wasmMemory = instance2.exports.memory || wasmMemory;

    return { exports: wasmExports, memory: wasmMemory };
}

/**
 * Núcleo síncrono del filtro de color.
 *
 * No espera a nada, así que solo sirve si el módulo ya está
 * inicializado (ver `initWasm`). Es la versión que usa el banco de
 * pruebas, porque medir un `async` midiendo lo que tarda en devolver
 * la promesa en vez de lo que tarda en filtrar la imagen.
 *
 * Escribe un píxel de salida por cada píxel de entrada: el resultado
 * mide exactamente lo mismo que la imagen de entrada.
 */
export function processImageSync(imageData) {
    if (!wasmExports) {
        throw new Error('initWasm() tiene que awaited antes de usar processImageSync.');
    }

    const { exports, memory } = { exports: wasmExports, memory: wasmMemory };

    const fn = exports.process ?? exports._process;
    if (typeof fn !== 'function') {
        throw new Error('El WASM no exporta la función "process".');
    }

    const width = imageData.width;
    const height = imageData.height;
    const count = width * height;
    const byteLength = count * 4;

    const srcOffset = 0;
    const dstOffset = byteLength;

    // Asegurar suficiente memoria WASM
    const totalBytes = dstOffset + byteLength;
    if (totalBytes > memory.buffer.byteLength) {
        const pagesNeeded = Math.ceil((totalBytes - memory.buffer.byteLength) / 65536);
        memory.grow(pagesNeeded);
    }

    // 1. Copiar bytes de entrada a la memoria lineal de WASM
    const heapU8 = new Uint8Array(memory.buffer);
    heapU8.set(imageData.data, srcOffset);

    // 2. Ejecutar la función procesar en WASM
    fn(srcOffset, dstOffset, count);

    // 3. Leer bytes procesados desde la memoria lineal
    const outputBytes = new Uint8ClampedArray(memory.buffer, dstOffset, byteLength);
    return new ImageData(outputBytes, width, height);
}

/** Filtro de color. Espera a que el módulo esté cargado y delega. */
export async function processImage(imageData) {
    await initWasm();
    return processImageSync(imageData);
}
