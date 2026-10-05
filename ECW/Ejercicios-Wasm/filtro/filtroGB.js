// Carga filtroGB.wasm y lo usa para filtrar ImageData.
// Todo el filtro está en el .wat; aquí solo se copia la imagen a la
// memoria del módulo, se llama a process y se recoge el resultado.
//
// Memoria en cada llamada:
//   [0, count*4)          píxeles de entrada (RGBA)
//   [count*4, count*8)    píxeles de salida

const WASM_URL = './filtroGB.wasm';

const PAGE_SIZE = 65536; // página de memoria de wasm

let wasmExports = null;

// Carga el módulo una sola vez. instantiateStreaming compila mientras
// descarga, pero solo funciona si el servidor manda el .wasm como
// application/wasm; si falla, se descarga entero y se usa instantiate.
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

// Versión síncrona, para el benchmark (medir la async solo mediría lo que
// tarda en devolver la promesa). Requiere haber llamado antes a initWasm().
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

    // Si la imagen no cabe, se amplía la memoria
    const totalBytes = dstOffset + byteLength;
    if (totalBytes > memory.buffer.byteLength) {
        const pagesNeeded = Math.ceil((totalBytes - memory.buffer.byteLength) / PAGE_SIZE);
        memory.grow(pagesNeeded);
    }

    // La vista se crea después del grow(): las anteriores se quedan
    // apuntando a un buffer vacío cuando la memoria crece.
    new Uint8Array(memory.buffer).set(imageData.data, srcOffset);

    process(srcOffset, dstOffset, count);

    // slice() para copiarlo: si no, el ImageData compartiría la memoria del
    // módulo y la siguiente llamada lo machacaría.
    const output = new Uint8ClampedArray(memory.buffer, dstOffset, byteLength).slice();

    return new ImageData(output, width, height);
}

// Lo mismo, pero esperando a que el módulo esté cargado.
export async function processImage(imageData) {
    await initWasm();
    return processImageSync(imageData);
}
