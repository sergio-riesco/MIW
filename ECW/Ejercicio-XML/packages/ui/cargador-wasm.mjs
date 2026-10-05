// cargador-wasm.mjs -- como impl-wasm/wasm.mjs pero para el navegador: el
// .wasm se descarga con fetch en vez de leerlo del disco. Las funciones y la
// doble llamada a vxml_analizar son las mismas.

const urlWasm = new URL("../impl-wasm/lib/vxml_doctor.wasm", import.meta.url);
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
    json = new TextDecoder().decode(new Uint8Array(mem.buffer, pOut, tam));
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