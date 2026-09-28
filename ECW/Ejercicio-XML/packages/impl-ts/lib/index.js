/**
 * index.ts -- Punto de entrada de la implementacion TypeScript.
 * La API es identica a la de JavaScript y a la de WebAssembly/Rust, para que
 * el banco de pruebas comparta el mismo contrato de llamada.
 */
export { analizarTexto, analizarDocumento } from "./vxml-lint.js";
export { escanearArbol, h } from "./scanner.js";
export { CATALOGO, serializarInforme, ordenarDiagnosticos, crearColumnas } from "./contrato.js";
