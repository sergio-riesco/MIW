// contrato.ts -- tipos para usar desde TS el contrato comun (contrato.mjs).
// JS lo importa tal cual; Rust no puede, asi que tools/gen-reglas.mjs le
// genera las reglas en Rust. El serializador es el mismo para JS y TS: lo que
// se compara entre versiones es el analisis, no el volcado a JSON.
//
// La ruta es ../../core porque tsc deja este archivo en packages/impl-ts/lib/.
// @ts-expect-error 7016 -- el modulo compartido es JavaScript plano sin declaraciones
import * as base from "../../core/contrato.mjs";
// catalogo de reglas
export const CATALOGO = base.CATALOGO;
// nombre -> posicion en el catalogo
export const INDICE_NOMBRE = base.INDICE_NOMBRE;
// listas que usan las reglas
export const TIPOS_FIELD = base.TIPOS_FIELD;
export const SIMBOLOS_TTS = base.SIMBOLOS_TTS;
export const INTEGRADOS_VOICEXML = base.INTEGRADOS_VOICEXML;
export const PALABRAS_CLAVE_EXPRESION = base.PALABRAS_CLAVE_EXPRESION;
export const ELEMENTOS_SALIDA = base.ELEMENTOS_SALIDA;
// el JSON del informe
export const serializarInforme = base.serializarInforme;
// orden: linea, columna, regla, detalle
export const ordenarDiagnosticos = base.ordenarDiagnosticos;
// columnas de UTF-16 a bytes UTF-8
export const crearColumnas = base.crearColumnas;
