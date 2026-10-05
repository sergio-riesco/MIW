// contrato.ts -- tipos para usar desde TS el contrato comun (contrato.mjs).
// JS lo importa tal cual; Rust no puede, asi que tools/gen-reglas.mjs le
// genera las reglas en Rust. El serializador es el mismo para JS y TS: lo que
// se compara entre versiones es el analisis, no el volcado a JSON.
//
// La ruta es ../../core porque tsc deja este archivo en packages/impl-ts/lib/.

// @ts-expect-error 7016 -- el modulo compartido es JavaScript plano sin declaraciones
import * as base from "../../core/contrato.mjs";

// --- Tipos del contrato ---

export type Gravedad = "error" | "warning" | "info";

export interface Regla {
  id: string;
  nombre: string;
  gravedad: Gravedad;
  mensaje: string;
  resumen: string;
  norma: string;
  explicacion: string;
}

export interface Catalogo {
  version: string;
  gravedadOrden: string[];
  tiposFieldValidos: string[];
  reglas: Regla[];
}

export interface Columnas {
  columnaByte(colU16: number, linea: number): number;
}

export interface Diagnostico {
  regla: string;
  gravedad: string;
  linea: number;
  columna: number;
  elemento: string;
  detalle: string;
  mensaje: string;
}

export interface Informe {
  archivo: string;
  bytes: number;
  lineas: number;
  elementos: number;
  formularios: { id: string; linea: number; campos: number; accesible: boolean }[];
  diagnosticos: Diagnostico[];
  grafo: { nodos: number; aristas: number; ciclos: number; inalcanzables: string[] };
  estadisticas: Record<string, number>;
  notas: { msg: string; linea: number; col: number }[];
}

// catalogo de reglas
export const CATALOGO: Catalogo = base.CATALOGO;

// nombre -> posicion en el catalogo
export const INDICE_NOMBRE: Map<string, number> = base.INDICE_NOMBRE;

// listas que usan las reglas
export const TIPOS_FIELD: Set<string> = base.TIPOS_FIELD;
export const SIMBOLOS_TTS: Set<string> = base.SIMBOLOS_TTS;
export const INTEGRADOS_VOICEXML: Set<string> = base.INTEGRADOS_VOICEXML;
export const PALABRAS_CLAVE_EXPRESION: Set<string> = base.PALABRAS_CLAVE_EXPRESION;
export const ELEMENTOS_SALIDA: Set<string> = base.ELEMENTOS_SALIDA;

// el JSON del informe
export const serializarInforme: (m: Informe) => string = base.serializarInforme;

// orden: linea, columna, regla, detalle
export const ordenarDiagnosticos: (ds: Diagnostico[]) => Diagnostico[] = base.ordenarDiagnosticos;

// columnas de UTF-16 a bytes UTF-8
export const crearColumnas: (bytes: Uint8Array, texto: string) => Columnas = base.crearColumnas;