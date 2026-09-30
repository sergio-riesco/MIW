// ================================================================
// El mismo filtro, pero escrito en JavaScript puro
// ================================================================
//
// Esto es una traducción literal de filtroGB.wat. Mismos colores de
// paleta, misma búsqueda del color más cercano, mismo bucle de píxeles
// y hasta la misma separación de la matriz del LCD.
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
// Ojo con el orden: aquí es del más oscuro al más claro, igual que en
// el .wat. (La paleta de filtroGB.js va al revés, pero como esa copia
// no la usa nadie, da igual.)

export const GRID_COLOR = 0x1b2a18;

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

// ------------------------------------------------------------
// Filtro de color + matriz de píxeles del LCD
// ------------------------------------------------------------

export function processPixelsLCDJS(src, dst, width, height, scale, grid) {
    const outWidth = width * scale;
    const outHeight = height * scale;

    // La separación se pega al final de la celda, así que empieza
    // en (scale - grid).
    const cellLimit = scale - grid;

    for (let oy = 0; oy < outHeight; oy++) {
        // Divide y módulo enteros. scale es siempre >= 1.
        const sy = (oy / scale) | 0;
        const fy = oy % scale;

        for (let ox = 0; ox < outWidth; ox++) {
            const sx = (ox / scale) | 0;
            const fx = ox % scale;

            const input = ((sy * width) + sx) << 2;
            const output = ((oy * outWidth) + ox) << 2;

            // El alfa viene siempre del píxel original, también en la
            // separación, para no perder las zonas transparentes.
            const a = src[input + 3];

            let color;
            if (fx >= cellLimit || fy >= cellLimit) {
                color = GRID_COLOR;
            } else {
                color = paletteJS(nearestJS(src[input], src[input + 1], src[input + 2]));
            }

            writePixel(dst, output, color, a);
        }
    }
}

export function processImageLCDJS(imageData, scale, grid) {
    const { width, height, data } = imageData;

    const outWidth = width * scale;
    const outHeight = height * scale;

    const dst = new Uint8ClampedArray(outWidth * outHeight * 4);

    processPixelsLCDJS(data, dst, width, height, scale, grid);

    return new ImageData(dst, outWidth, outHeight);
}