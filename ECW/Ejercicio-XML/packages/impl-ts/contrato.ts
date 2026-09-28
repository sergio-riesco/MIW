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

// ---------------------------------------------------------------------------
// Tipos del contrato
// ---------------------------------------------------------------------------

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

/** Catalogo canonico de reglas (id, nombre, gravedad, mensaje, ...). */
export const CATALOGO: Catalogo = base.CATALOGO;

/** indice nombre -> posicion en el catalogo. */
export const INDICE_NOMBRE: Map<string, number> = base.INDICE_NOMBRE;

/** Conjuntos compartidos que alimentan las reglas. */
export const TIPOS_FIELD: Set<string> = base.TIPOS_FIELD;
export const SIMBOLOS_TTS: Set<string> = base.SIMBOLOS_TTS;
export const INTEGRADOS_VOICEXML: Set<string> = base.INTEGRADOS_VOICEXML;
export const PALABRAS_CLAVE_EXPRESION: Set<string> = base.PALABRAS_CLAVE_EXPRESION;
export const ELEMENTOS_SALIDA: Set<string> = base.ELEMENTOS_SALIDA;

/** Serializador canonico: LA salida del ejercicio, identica en los 3. */
export const serializarInforme: (m: Informe) => string = base.serializarInforme;

/** Orden canonico de diagnosticos: (linea, columna, regla, detalle). */
export const ordenarDiagnosticos: (ds: Diagnostico[]) => Diagnostico[] = base.ordenarDiagnosticos;

/** Conversion de columna provisional (UTF-16) a bytes UTF-8. */
export const crearColumnas: (bytes: Uint8Array, texto: string) => Columnas = base.crearColumnas;