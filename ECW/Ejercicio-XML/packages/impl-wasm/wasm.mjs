// wasm.mjs -- carga vxml_doctor.wasm en Node y ofrece la misma API que las
// otras dos versiones: cargarMotorWasm() y analizarTextoWasm(bytes, nombre).
//
// Funciones que exporta el modulo de Rust:
//   vxml_alloc(n) -> ptr
//   vxml_dealloc(ptr, n)
//   vxml_analizar(data, len, nombre, lenNombre, out, cap) -> tamano del JSON
//
// vxml_analizar se llama dos veces: la primera con out = 0 para saber cuanto
// ocupa el JSON y la segunda con un buffer de ese tamano. Todo lo reservado
// con vxml_alloc se libera al final.

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const aqui = dirname(fileURLToPath(import.meta.url));
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

// copia datos a la memoria de Rust y devuelve el puntero
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

// informe JSON de bytes (Uint8Array)
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

// lo mismo, pasando un string
export function analizarTexto(texto, nombre) {
  return analizarTextoWasm(new TextEncoder().encode(texto), nombre);
}