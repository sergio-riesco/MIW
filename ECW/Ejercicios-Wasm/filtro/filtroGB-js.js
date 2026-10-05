// ================================================================
// El mismo filtro, pero escrito en JavaScript puro
// ================================================================
//
// Esto es una traducción literal de filtroGB.wat. Mismos colores de
// paleta, misma búsqueda del color más cercano y mismo bucle de píxeles.
//
// El objetivo no es escribir el JavaScript más rápido del mundo, sino
// ejecutar EXACTAMENTE el mismo algoritmo fuera de WebAssembly. Así
// la comparación mide al runtime (WASM contra el motor de JavaScript)
// y no a dos algoritmos distintos.
//
// Si el JavaScript estuviera escrito de otra forma la comparación no
// valdría para nada, porque la diferencia se podría deber al código y
// no a la compilación.

// ------------------------------------------------------------
// Paleta de 4 colores de Game Boy
// ------------------------------------------------------------
//
// Del más oscuro al más claro, en el mismo orden que en el .wat.

export function paletteJS(index) {
    if (index === 0) return 0x0f380f; // #0F380F, el más oscuro
    if (index === 1) return 0x306230; // #306230
    if (index === 2) return 0x8bac0f; // #8BAC0F
    return 0x9bbc0f;                 // #9BBC0F, el más claro
}

// ------------------------------------------------------------
// Color de la paleta más cercano por distancia de color
// ------------------------------------------------------------
//
// Distancia euclídea al cuadrado, sin ponderación ni nada:
//   (r - pr)² + (g - pg)² + (b - pb)²

export function nearestJS(r, g, b) {
    let bestDistance = 0x7fffffff;
    let best = 0;

    for (let i = 0; i < 4; i++) {
        const color = paletteJS(i);

        // 0xRRGGBB -> R, G, B
        const pr = color >>> 16;
        const pg = (color >>> 8) & 255;
        const pb = color & 255;

        const dr = r - pr;
        const dg = g - pg;
        const db = b - pb;

        const distance = dr * dr + dg * dg + db * db;

        if (distance < bestDistance) {
            bestDistance = distance;
            best = i;
        }
    }

    return best;
}

// Escribe un color 0xRRGGBB en un píxel RGBA, y conserva el alfa.
function writePixel(dst, offset, color, a) {
    dst[offset] = color >>> 16;
    dst[offset + 1] = (color >>> 8) & 255;
    dst[offset + 2] = color & 255;
    dst[offset + 3] = a;
}

// ------------------------------------------------------------
// Filtro de color: un píxel de salida por cada píxel de entrada
// ------------------------------------------------------------

export function processPixelsJS(src, dst, count) {
    for (let i = 0; i < count; i++) {
        const offset = i << 2;

        const color = paletteJS(nearestJS(src[offset], src[offset + 1], src[offset + 2]));

        writePixel(dst, offset, color, src[offset + 3]);
    }
}

export function processImageJS(imageData) {
    const { width, height, data } = imageData;
    const count = width * height;
    const dst = new Uint8ClampedArray(count * 4);

    processPixelsJS(data, dst, count);

    return new ImageData(dst, width, height);
}
