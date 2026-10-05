// ================================================================
// Puente entre JavaScript y el módulo filtroGB.wasm
// ================================================================
//
// El módulo no importa nada de JavaScript: todo el filtro (paleta,
// búsqueda del color más cercano y bucle de píxeles) está escrito a
// mano en filtroGB.wat. Este archivo solo carga el binario, copia la
// imagen a la memoria lineal, llama a `process` y recoge el resultado.
//
// Diseño de la memoria lineal en cada llamada:
//
//   0                 count*4             count*8
//   | píxeles entrada  | píxeles salida    |
//   | RGBA RGBA ...    | RGBA RGBA ...     |

const WASM_URL = './filtroGB.wasm';

// Tamaño de una página de memoria de WebAssembly.
const PAGE_SIZE = 65536;

let wasmExports = null;

/**
 * Descarga e instancia el módulo una sola vez.
 *
 * Usa `instantiateStreaming`, que compila el binario mientras se
 * descarga. Necesita que el servidor sirva el .wasm con el tipo
 * `application/wasm`; si no lo hace, se descarga entero y se usa
 * `instantiate`.
 */
export async function initWasm() {
    if (wasmExports) return wasmExports;

    let result;

    try {
        result = await WebAssembly.instantiateStreaming(fetch(WASM_URL));
    } catch (e) {
        console.warn('instantiateStreaming no disponible, se usa instantiate:', e);

        const resp = await fetch(WASM_URL);
        if (!resp.ok) {
            throw new Error(`No se pudo cargar ${WASM_URL}: ${resp.status} ${resp.statusText}`);
        }

        result = await WebAssembly.instantiate(await resp.arrayBuffer());
    }

    const { exports } = result.instance;

    if (typeof exports.process !== 'function' || !(exports.memory instanceof WebAssembly.Memory)) {
        throw new Error('El módulo WASM tiene que exportar "process" y "memory".');
    }

    wasmExports = exports;
    return wasmExports;
}

/**
 * Núcleo síncrono del filtro.
 *
 * Solo sirve si el módulo ya está inicializado (ver `initWasm`). Es la
 * versión que usa el banco de pruebas: medir una función `async` solo
 * mediría lo que tarda en devolver la promesa, no lo que tarda en
 * filtrar la imagen.
 *
 * Devuelve un ImageData nuevo del mismo tamaño que el de entrada.
 */
export function processImageSync(imageData) {
    if (!wasmExports) {
        throw new Error('Hay que esperar a initWasm() antes de usar processImageSync.');
    }

    const { process, memory } = wasmExports;

    const { width, height } = imageData;
    const count = width * height;
    const byteLength = count * 4;

    const srcOffset = 0;
    const dstOffset = byteLength;

    // Ampliar la memoria si la imagen no cabe en la que hay.
    const totalBytes = dstOffset + byteLength;
    if (totalBytes > memory.buffer.byteLength) {
        const pagesNeeded = Math.ceil((totalBytes - memory.buffer.byteLength) / PAGE_SIZE);
        memory.grow(pagesNeeded);
    }

    // 1. Copiar la imagen a la memoria lineal.
    //
    // La vista se crea después del grow(): al crecer la memoria, las
    // vistas creadas antes se quedan apuntando a un buffer vacío.
    new Uint8Array(memory.buffer).set(imageData.data, srcOffset);

    // 2. Ejecutar el filtro dentro de WebAssembly.
    process(srcOffset, dstOffset, count);

    // 3. Copiar el resultado fuera de la memoria lineal.
    //
    // slice() hace una copia. Sin ella, el ImageData compartiría la
    // memoria del módulo y la siguiente llamada lo sobrescribiría.
    const output = new Uint8ClampedArray(memory.buffer, dstOffset, byteLength).slice();

    return new ImageData(output, width, height);
}

/** Filtro de color. Espera a que el módulo esté cargado y delega. */
export async function processImage(imageData) {
    await initWasm();
    return processImageSync(imageData);
}
