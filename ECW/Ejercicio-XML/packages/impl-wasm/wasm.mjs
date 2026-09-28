/**
 * wasm.mjs -- Envoltura Node para la implementacion WebAssembly/Rust.
 * ---------------------------------------------------------------------------
 * Carga packages/impl-wasm/lib/vxml_doctor.wasm y expone la misma API que las
 * otras dos implementaciones:
 *
 *   await cargarMotorWasm()        -> carga el modulo una sola vez
 *   analizarTextoWasm(bytes, nombre) -> informe JSON canonico (string)
 *
 * La ABI de Rust es:
 *   vxml_alloc(n)          -> ptr          (heap de Rust, hay que liberarlo)
 *   vxml_dealloc(ptr, n)   -> void
 *   vxml_analizar(data,len,nombre,lenNombre,out,cap) -> usize (tamano del JSON)
 *
 * Se usa el protocolo de dos llamadas: primero con out nulo para conocer el
 * tamano, despues con un buffer hecho a medida. Todo lo que se reserva con
 * vxml_alloc se libera con vxml_dealloc al terminar.
 * ---------------------------------------------------------------------------
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const aqui = dirname(fileURLToPath(import.meta.url));

/** @type {WebAssembly.Instance | null} */
let instancia = null;

export function rutaWasm() {
  return join(aqui, "lib", "vxml_doctor.wasm");
}

export async function cargarMotorWasm() {
  if (instancia) return instancia;
  const bytes = readFileSync(rutaWasm());
  const mod = await WebAssembly.compile(bytes);
  instancia = new WebAssembly.Instance(mod, {});
  return instancia;
}

/** Escribe `datos` en el heap de Rust y devuelve su puntero. */
function escribirEnRust(datos) {
  const mem = instancia.exports.memory;
  const n = datos.length;
  const p = instancia.exports.vxml_alloc(n);
  const vista = new Uint8Array(mem.buffer, p, n);
  vista.set(datos);
  return p;
}

function liberar(p, n) {
  if (p !== 0 && n > 0) instancia.exports.vxml_dealloc(p, n);
}

/** El informe JSON canonico de `bytes` (Uint8Array) con nombre `nombre`. */
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
    const vista = new Uint8Array(mem.buffer, pOut, tam);
    json = new TextDecoder().decode(vista);
    liberar(pOut, tam);
  }
  liberar(pDoc, bytes.length);
  liberar(pNom, nomBytes.length);
  return json;
}

/** Igual que analizarTextoWasm pero admite un string y lo codifica. */
export function analizarTexto(texto, nombre) {
  return analizarTextoWasm(new TextEncoder().encode(texto), nombre);
}