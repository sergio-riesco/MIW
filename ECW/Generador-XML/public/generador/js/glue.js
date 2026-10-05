// JavaScript: carga del módulo WebAssembly, creación de ZIP (sin dependencias) y descarga.
let generar = null;
/** Carga e inicializa el WASM compilado desde Rust (una sola vez). */
export async function iniciarWasm() {
    if (generar)
        return generar;
    const modulo = await import(new URL('../pkg/generador_wasm.js', import.meta.url).href);
    await modulo.default();
    generar = modulo.generar;
    return generar;
}
const TABLA = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++)
            c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        t[n] = c >>> 0;
    }
    return t;
})();
function crc32(b) {
    let c = 0xffffffff;
    for (let i = 0; i < b.length; i++)
        c = TABLA[(c ^ b[i]) & 255] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
}
/** ZIP "store" (sin compresión). archivos: [{ nombre, datos: Uint8Array }] */
export function crearZip(archivos) {
    const enc = new TextEncoder();
    const partes = [];
    const central = [];
    let offset = 0;
    for (const { nombre, datos } of archivos) {
        const n = enc.encode(nombre);
        const crc = crc32(datos);
        const loc = new DataView(new ArrayBuffer(30));
        loc.setUint32(0, 0x04034b50, true);
        loc.setUint16(4, 20, true);
        loc.setUint16(6, 0x0800, true); // nombres UTF-8
        loc.setUint16(12, 0x21, true); // fecha 1980-01-01
        loc.setUint32(14, crc, true);
        loc.setUint32(18, datos.length, true);
        loc.setUint32(22, datos.length, true);
        loc.setUint16(26, n.length, true);
        partes.push(new Uint8Array(loc.buffer), n, datos);
        const cen = new DataView(new ArrayBuffer(46));
        cen.setUint32(0, 0x02014b50, true);
        cen.setUint16(4, 20, true);
        cen.setUint16(6, 20, true);
        cen.setUint16(8, 0x0800, true);
        cen.setUint16(14, 0x21, true);
        cen.setUint32(16, crc, true);
        cen.setUint32(20, datos.length, true);
        cen.setUint32(24, datos.length, true);
        cen.setUint16(28, n.length, true);
        cen.setUint32(42, offset, true);
        central.push(new Uint8Array(cen.buffer), n);
        offset += 30 + n.length + datos.length;
    }
    const tamCentral = central.reduce((s, p) => s + p.length, 0);
    const fin = new DataView(new ArrayBuffer(22));
    fin.setUint32(0, 0x06054b50, true);
    fin.setUint16(8, archivos.length, true);
    fin.setUint16(10, archivos.length, true);
    fin.setUint32(12, tamCentral, true);
    fin.setUint32(16, offset, true);
    return new Blob([...partes, ...central, new Uint8Array(fin.buffer)], { type: 'application/zip' });
}
export function descargar(blob, nombre) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = nombre;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
