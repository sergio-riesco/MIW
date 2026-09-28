/**
 * contrato.ts -- Vista TIPADA del modulo compartido packages/core/contrato.mjs.
 * ---------------------------------------------------------------------------
 * Las tres implementaciones comparten el serializador canonico del informe y
 * los catalogos de reglas (reglas.json). JavaScript lo importa directamente;
 * TypeScript lo re-exporta aqui con tipos. WebAssembly/ Rust no puede
 * importar JS y por eso lo regenera en Rust (tools/gen-reglas.mjs), con el
 * mismo contrato.
 *
 * Compartir el serializador es intencionado: lo que se mide al comparar las
 * tres implementaciones es SOLO el trabajo de analisis, no el volcado JSON.
 *
 * NOTA: el import usa `../../core/...` porque el compilador emite este modulo
 * en packages/impl-ts/lib/, dos niveles por debajo de packages/core.
 */
// @ts-expect-error 7016 -- el modulo compartido es JavaScript plano sin declaraciones
import * as base from "../../core/contrato.mjs";
/** Catalogo canonico de reglas (id, nombre, gravedad, mensaje, ...). */
export const CATALOGO = base.CATALOGO;
/** indice nombre -> posicion en el catalogo. */
export const INDICE_NOMBRE = base.INDICE_NOMBRE;
/** Conjuntos compartidos que alimentan las reglas. */
export const TIPOS_FIELD = base.TIPOS_FIELD;
export const SIMBOLOS_TTS = base.SIMBOLOS_TTS;
export const INTEGRADOS_VOICEXML = base.INTEGRADOS_VOICEXML;
export const PALABRAS_CLAVE_EXPRESION = base.PALABRAS_CLAVE_EXPRESION;
export const ELEMENTOS_SALIDA = base.ELEMENTOS_SALIDA;
/** Serializador canonico: LA salida del ejercicio, identica en los 3. */
export const serializarInforme = base.serializarInforme;
/** Orden canonico de diagnosticos: (linea, columna, regla, detalle). */
export const ordenarDiagnosticos = base.ordenarDiagnosticos;
/** Conversion de columna provisional (UTF-16) a bytes UTF-8. */
export const crearColumnas = base.crearColumnas;
