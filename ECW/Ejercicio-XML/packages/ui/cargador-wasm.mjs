/**
 * cargador-wasm.mjs -- Carga el motor WebAssembly/Rust en el NAVEGADOR.
 * -----------------------------------------------------------------------------
 * Variante de packages/impl-wasm/wasm.mjs para navegador: en lugar de leer el
 * .wasm del disco con node:fs se descarga por HTTP con fetch. La ABI es la
 * misma:
 *
 *   vxml_alloc(n)          -> ptr
 *   vxml_dealloc(ptr, n)   -> void
 *   vxml_analizar(data,len,nombre,lenNombre,out,cap) -> usize
 *
 * al igual que el protocolo de dos llamadas (primero con out nulo para conocer
 * el tamano del JSON, despues con un buffer a medida).
 * -----------------------------------------------------------------------------
 */
const urlWasm = new URL("../impl-wasm/lib/vxml_doctor.wasm", import.meta.url);

/** @type {WebAssembly.Instance | null} */
let instancia = null;

export async function cargarMotorWasm() {
  if (instancia) return instancia;
  const resp = await fetch(urlWasm);
  if (!resp.ok) throw new Error("No se pudo descargar " + urlWasm + " (" + resp.status + ")");
  const bytes = await resp.arrayBuffer();
  const mod = await WebAssembly.compile(bytes);
  instancia = new WebAssembly.Instance(mod, {});
  return instancia;
}

function escribirEnRust(datos) {
  const mem = instancia.exports.memory;
  const n = datos.length;
  const p = instancia.exports.vxml_alloc(n);
  new Uint8Array(mem.buffer, p, n).set(datos);
  return p;
}

function liberar(p, n) {
  if (p !== 0 && n > 0) instancia.exports.vxml_dealloc(p, n);
}

/** Informe JSON canonico de `bytes` (Uint8Array) con nombre `nombre`. */
export function analizarTextoWasm(bytes, nombre) {
  const mem = instancia.exports.memory;
  const pDoc = escribirEnRust(bytes);
  const nomBytes = new TextEncoder().encode(nombre);
  const pNom = escribirEnRust(nomBytes);

  const tam = instancia.exports.vxml_analizar(pDoc, bytes.length, pNom, nomBytes.length, 0, 0);

  let json = "";
  if (tam > 0) {
    const pOut = instancia.exports.vxml_alloc(tam);
    instancia.exports.vxml_analizar(pDoc, bytes.length, pNom, nomBytes.length, pOut, tam);
    json = new TextDecoder().decode(new Uint8Array(mem.buffer, pOut, tam));
    liberar(pOut, tam);
  }
  liberar(pDoc, bytes.length);
  liberar(pNom, nomBytes.length);
  return json;
}

/** Igual que analizarTextoWasm pero admite un string y lo codifica UTF-8. */
export function analizarTexto(texto, nombre) {
  return analizarTextoWasm(new TextEncoder().encode(texto), nombre);
}