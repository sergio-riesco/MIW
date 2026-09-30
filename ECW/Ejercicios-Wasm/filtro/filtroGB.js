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

// Resolución de la pantalla original de Game Boy: 160 x 144 píxeles.
export const GB_SCREEN_WIDTH = 160;
export const GB_SCREEN_HEIGHT = 144;

// Zoom por defecto de cada píxel del LCD, y grosor de la separación
// que hay entre ellos. Con scale = 2 y grid = 1 cada píxel se pinta
// como un bloque de 1x1 px dejando un hueco oscuro de 1 px, que es
// exactamente como se ve la matriz de píxeles del hardware real.
//
// El zoom es fijo a propósito. La pantalla de Game Boy es de 160 x 144,
// así que a x2 el canvas del resultado mide 320 px de ancho, que entra
// en la tarjeta sin que el navegador lo reduzca. Al subir el zoom el
// navegador escala el canvas por un factor no entero y con
// `image-rendering: pixelated` la cuadrícula sale irregular.
export const GB_DEFAULT_SCALE = 2;
export const GB_DEFAULT_GRID = 1;

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

/**
 * Núcleo síncrono del filtro de color con matriz de píxeles.
 *
 * Igual que `processImageSync`, no espera a nada.
 */
export function processImageLCDSync(
    imageData,
    scale = GB_DEFAULT_SCALE,
    grid = GB_DEFAULT_GRID
) {
    if (!wasmExports) {
        throw new Error('initWasm() tiene que awaited antes de usar processImageLCDSync.');
    }

    const { exports, memory } = { exports: wasmExports, memory: wasmMemory };

    const fn = exports.process_lcd;
    if (typeof fn !== 'function') {
        throw new Error('El WASM no exporta la función "process_lcd".');
    }

    const width = imageData.width;
    const height = imageData.height;
    const srcBytes = width * height * 4;

    // Cada píxel de entrada se convierte en una celda scale x scale.
    const outWidth = width * scale;
    const outHeight = height * scale;
    const dstBytes = outWidth * outHeight * 4;

    const srcOffset = 0;
    const dstOffset = srcBytes;

    // Asegurar suficiente memoria WASM
    const totalBytes = dstOffset + dstBytes;
    if (totalBytes > memory.buffer.byteLength) {
        const pagesNeeded = Math.ceil((totalBytes - memory.buffer.byteLength) / 65536);
        memory.grow(pagesNeeded);
    }

    // 1. Copiar bytes de entrada a la memoria lineal de WASM
    const heapU8 = new Uint8Array(memory.buffer);
    heapU8.set(imageData.data, srcOffset);

    // La separación no puede tapar la celda entera, así que se
    // limita a como mucho un píxel menos que el lado de la celda.
    const safeScale = Math.max(1, scale | 0);
    const safeGrid = Math.min(Math.max(grid | 0, 0), safeScale - 1);

    // 2. Ejecutar la función en WASM
    fn(srcOffset, dstOffset, width, height, safeScale, safeGrid);

    // 3. Leer y copiar el resultado. Aquí sí se copia, porque el
    //    canvas de origen se reutiliza para el siguiente renderizado.
    const result = new Uint8ClampedArray(dstBytes);
    result.set(new Uint8Array(memory.buffer, dstOffset, dstBytes));

    return new ImageData(result, outWidth, outHeight);
}

/**
 * Procesa una imagen aplicando el filtro de color de Game Boy Y la
 * matriz de píxeles de la pantalla original.
 *
 * Cada píxel de la imagen de entrada se convierte en una celda de
 * `scale` x `scale` píxeles, con la separación oscura que el LCD de
 * la Game Boy original tiene entre sus píxeles físicos. La imagen de
 * entrada debería venir ya reducida a la resolución de la pantalla
 * (160 x 144) para que el resultado sea creíble.
 *
 * @param {ImageData} imageData Imagen de entrada a baja resolución.
 * @param {number} scale Lado de la celda de cada píxel.
 * @param {number} grid Grosor de la separación entre celdas.
 * @returns {ImageData} Resultado de (width * scale) x (height * scale).
 */
export async function processImageLCD(
    imageData,
    scale = GB_DEFAULT_SCALE,
    grid = GB_DEFAULT_GRID
) {
    await initWasm();
    return processImageLCDSync(imageData, scale, grid);
}