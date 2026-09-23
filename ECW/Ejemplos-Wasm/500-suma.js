
// 500-suma.js
// Versión 1.2 10/12/2025 Juan Manuel Cueva Lovelle. Universidad de Oviedo

let wasmExports = null;

async function initWasm() {
    if (wasmExports) return wasmExports;

    const wasmUrl = './500-suma.wasm';

    // Descargar el binario
    const resp = await fetch(wasmUrl);
    if (!resp.ok) {
        throw new Error(`No se pudo cargar ${wasmUrl}: ${resp.status} ${resp.statusText}`);
    }

    const bytes = await resp.arrayBuffer();

    // Instanciar — manejar ambos posibles retornos (Instance directo o {instance, module})
    let result;
    try {
        result = await WebAssembly.instantiate(bytes, {});
    } catch (e) {
        // Mensaje claro si el binario no es WASM válido
        console.error('Fallo al instanciar WASM. ¿Es un .wasm válido y corresponde al .wat?', e);
        throw e;
    }

    // Compatibilidad: manejar ambas formas
    const instance = (result instanceof WebAssembly.Instance)
        ? result
        : result && result.instance;

    if (!instance) {
        console.error('Resultado de instantiate:', result);
        throw new Error('No se obtuvo una instancia de WebAssembly (instance es undefined).');
    }

    if (!instance.exports) {
        console.error('Instance sin exports:', instance);
        throw new Error('La instancia WASM no tiene exports.');
    }

    wasmExports = instance.exports;
    return wasmExports;
}

export async function suma(a, b) {
    const ex = await initWasm();

    const fn = ex.suma ?? ex._suma;
    if (typeof fn !== 'function') {
        console.error('Exports disponibles:', Object.keys(ex));
        throw new Error('El WASM no exporta "suma" ni "_suma".');
    }

    // Aseguramos enteros 32 bits
    return fn(a | 0, b | 0);
}
