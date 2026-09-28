/**
 * vxml-lint.ts -- Motor de analisis de VXML Doctor (implementacion TypeScript).
 * ---------------------------------------------------------------------------
 * ESTRATEGIA (TypeScript):
 *   - El scanner construye un ARBOL de nodos tipados (NodoElemento | NodoTexto)
 *     con los atributos materializados en un Map (scanner.ts).
 *   - El analisis camina el arbol en preorden con una pila de marcos y hace
 *     MATCHING EXHAUSTIVO con `switch` sobre los nombres conocidos: el
 *     compilador obliga a tratar cada tipo de elemento que interesa y el
 *     `default` es explicito para los desconocidos.
 *   - Los contadores de subarbol se calculan de forma incremental (snapshot en
 *     la apertura, diferencia en el cierre), igual que en JavaScript, pero
 *     sobre la estructura de arbol: aqui no hay offsets ni hashes que
 *     consultar.
 *   - Tarjan es RECURSIVO (a diferencia del iterativo de JS y del plan SoA de
 *     Rust): el tipado hace el codigo mas legible, y la profundidad del grafo
 *     de un documento VXML real queda muy por debajo del limite de pila.
 *
 * Toda la edicion de estado vive en UNA instancia de `AnalizadorVxml` por
 * documento: nada de mutable global compartido.
 *
 * La serializacion del informe se importa del contrato compartido
 * (packages/core/contrato.mjs): es la garantia de salida identica byte a byte
 * en las tres implementaciones.
 * ---------------------------------------------------------------------------
 */

import { escanearArbol, NodoDocumento, NodoElemento, NodoTexto } from "./scanner.js";
import {
  CATALOGO, INDICE_NOMBRE, TIPOS_FIELD, SIMBOLOS_TTS,
  INTEGRADOS_VOICEXML, PALABRAS_CLAVE_EXPRESION, ELEMENTOS_SALIDA,
  serializarInforme, ordenarDiagnosticos, crearColumnas,
  Informe, Diagnostico,
} from "./contrato.js";

// ---------------------------------------------------------------------------
// Tipos internos
// ---------------------------------------------------------------------------

/** "Evento" minimo para empujar un diagnostico: posicion + nombre. */
interface Ev {
  linea: number;
  colU16: number;
  nombre: string;
}

interface Contadores {
  salida: number; reprompt: number; catch: number; nomatch: number;
  noinput: number; filled: number; goto: number; prompt: number;
}

interface Marco {
  nodo: NodoElemento;
  snap: Contadores;
  esPrompt: boolean;
  promptAttr: boolean;
  nextAttr: boolean;
  idxForm: number;
  idxFormPadre: number;
}

interface Campo {
  nodo: NodoElemento;
  consume: boolean;
}

interface Formulario {
  id: string;
  linea: number;
  colU16: number;
  orden: number;
  campos: Campo[];
  tieneSalida: boolean;
}

interface Salto {
  destino: string;
  nodo: NodoElemento;
  form: number;
}

interface Grafo {
  nodos: number;
  aristas: number;
  ciclos: number;
  inalcanzables: string[];
  alcanzable: Uint8Array;
}

interface ItemDePila {
  nodo: NodoDocumento | NodoElemento | NodoTexto;
  cerrado: boolean;
}

const NUEVOS_CONTADORES = (): Contadores => ({
  salida: 0, reprompt: 0, catch: 0, nomatch: 0,
  noinput: 0, filled: 0, goto: 0, prompt: 0,
});

/** Nombres de reglas usadas por este motor (id canonico en el catalogo). */
const REGLA = {
  gotoInexistente: "goto-a-form-inexistente",
  formInaccesible: "form-inaccesible",
  cicloSinSalida: "ciclo-goto-sin-salida",
  fieldSinPrompt: "field-sin-prompt",
  fieldSinConsumidor: "field-sin-consumidor",
  nomatchSinReprompt: "nomatch-sin-reprompt",
  sinXmlLang: "sin-xml-lang",
  gotoSinDestino: "goto-sin-destino",
  tipoFieldInvalido: "tipo-field-invalido",
  breakTimeInvalido: "break-time-invalido",
  ifSinCond: "if-sin-cond",
  idFormDuplicado: "id-form-duplicado",
  audioSinFuente: "audio-sin-fuente",
  simboloTtsIlegible: "simbolo-tts-ilegible",
  identificadorNoDeclarado: "identificador-no-declarado",
  formSinManejadorError: "form-sin-manejador-error",
  gotoSIMismo: "goto-a-si-mismo",
  sinVersion: "sin-version",
} as const;

// ===========================================================================
// Analizador por documento
// ===========================================================================

class AnalizadorVxml {
  readonly texto: string;
  readonly nombreArchivo: string;
  readonly bytes: Uint8Array;
  readonly columnas: ReturnType<typeof crearColumnas>;

  readonly C: Contadores = NUEVOS_CONTADORES();
  readonly marcos: Marco[] = [];
  readonly formularios: Formulario[] = [];
  readonly saltos: Salto[] = [];
  readonly declarados = new Set<string>();
  readonly alertas = new Set<string>();
  readonly ds: { regla: string; gravedad: string; linea: number; columna: number; elemento: string; detalle: string; mensaje: string; colU16: number }[] = [];

  raizVista = 0;
  nElementos = 0;
  nAtributos = 0;
  nTextos = 0;
  nPrompts = 0;
  nScripts = 0;
  profundidadPrompt = 0;
  idxForm = -1;

  constructor(texto: string, nombreArchivo: string, src?: Uint8Array | null) {
    this.texto = texto;
    this.nombreArchivo = nombreArchivo;
    this.bytes = src ?? new TextEncoder().encode(texto);
    this.columnas = crearColumnas(this.bytes, texto);
  }

  /** Empuja un diagnostico resolviendo el catalogo. */
  empuja(nombreRegla: string, ev: Ev, detalle: string): void {
    const idx = INDICE_NOMBRE.get(nombreRegla);
    if (idx === undefined) throw new Error("Regla desconocida en el catalogo: " + nombreRegla);
    const r = CATALOGO.reglas[idx];
    this.ds.push({
      regla: r.id, gravedad: r.gravedad,
      linea: ev.linea, columna: 0, elemento: ev.nombre,
      detalle: detalle || "", mensaje: r.mensaje,
      colU16: ev.colU16,
    });
  }

  /** Analiza el documento desde cero. */
  analizar(): Informe {
    const notas: { msg: string; linea: number; col: number }[] = [];
    const { doc } = escanearArbol(this.texto, (msg, linea, colu) => {
      notas.push({ msg, linea, col: this.columnas.columnaByte(colu, linea) });
    });

    // ---------------------------------------------------------------------
    // PASADA 2: caminar el arbol en preorden con marcos.
    // ---------------------------------------------------------------------
    const pilaWalk: ItemDePila[] = [];
    for (let k = doc.hijos.length - 1; k >= 0; k--) pilaWalk.push({ nodo: doc.hijos[k], cerrado: false });

    while (pilaWalk.length) {
      const item = pilaWalk.pop()!;
      if (item.cerrado) {
        this.cerrarNodo(item.nodo as NodoElemento);
        continue;
      }
      if (item.nodo.tipo === "texto") {
        this.procesarTexto(item.nodo);
        continue;
      }
      const nodo = item.nodo as NodoElemento;
      this.abrirNodo(nodo);
      // Un elemento autocerrado (<x/>) no abre marco; tampoco emite evento de
      // cierre, igual que en el scanner flat de JavaScript.
      if (!nodo.autocerrado) pilaWalk.push({ nodo, cerrado: true });
      for (let k = nodo.hijos.length - 1; k >= 0; k--) pilaWalk.push({ nodo: nodo.hijos[k], cerrado: false });
    }

    // ---------------------------------------------------------------------
    // PASADA 3: grafo de flujo entre forms
    // ---------------------------------------------------------------------
    const grafo = this.resolverGrafo();

    // ---------------------------------------------------------------------
    // Cierre del informe
    // ---------------------------------------------------------------------
    const diagnosticos: Diagnostico[] = this.ds.map((d) => ({
      regla: d.regla, gravedad: d.gravedad, linea: d.linea,
      columna: this.columnas.columnaByte(d.colU16, d.linea),
      elemento: d.elemento, detalle: d.detalle, mensaje: d.mensaje,
    }));
    ordenarDiagnosticos(diagnosticos);

    return {
      archivo: this.nombreArchivo,
      bytes: this.bytes.length,
      lineas: contarLineas(this.texto),
      elementos: this.nElementos,
      formularios: this.formularios.map((f, i) => ({
        id: f.id, linea: f.linea, campos: f.campos.length, accesible: !!grafo.alcanzable[i],
      })),
      diagnosticos,
      grafo: {
        nodos: grafo.nodos, aristas: grafo.aristas,
        ciclos: grafo.ciclos, inalcanzables: grafo.inalcanzables,
      },
      estadisticas: {
        elementos: this.nElementos,
        atributos: this.nAtributos,
        formularios: this.formularios.length,
        campos: contarCampos(this.formularios),
        prompts: this.nPrompts,
        textos: this.nTextos,
        saltos: this.saltos.length,
        scripts: this.nScripts,
        bytes: this.bytes.length,
      },
      notas,
    };
  }

  // -------------------------------------------------------------------------
  // Apertura / cierre / texto
  // -------------------------------------------------------------------------

  subarbol(marco: Marco): Contadores {
    const s = NUEVOS_CONTADORES();
    (Object.keys(this.C) as (keyof Contadores)[]).forEach((k) => { s[k] = this.C[k] - marco.snap[k]; });
    return s;
  }

  abrirNodo(nodo: NodoElemento): void {
    // Contadores de subarbol: cuentan para TODO elemento abierto, tambien
    // autocerrado.
    if (ELEMENTOS_SALIDA.has(nodo.nombre)) this.C.salida++;
    switch (nodo.nombre) {
      case "reprompt": this.C.reprompt++; break;
      case "catch": this.C.catch++; break;
      case "nomatch": this.C.nomatch++; break;
      case "noinput": this.C.noinput++; break;
      case "filled": this.C.filled++; break;
      case "prompt": this.C.prompt++; break;
      case "goto": this.C.goto++; break;
      default: break;
    }

    this.nElementos++;
    this.nAtributos += nodo.nAtributos;

    // VXML015 -- expresiones ECMAScript, ANTES de declarar el name.
    for (const [nombre, valor] of nodo.atributos) {
      if (nombre === "cond" || nombre === "expr" || nombre === "srcexpr") {
        this.revisarExpresion(valor, nodo);
      }
    }

    const vName = nodo.atributos.get("name");
    if (vName !== undefined) this.declarados.add(vName);

    switch (nodo.nombre) {
      case "vxml": {
        this.raizVista++;
        if (this.raizVista === 1) {
          if (!nodo.atributos.has("xml:lang")) this.empuja(REGLA.sinXmlLang, nodo, "");
          if (!nodo.atributos.has("version")) this.empuja(REGLA.sinVersion, nodo, "");
        }
        break;
      }
      case "script": this.nScripts++; break;
      case "prompt": this.nPrompts++; break;
      case "goto": {
        const vHref = nodo.atributos.get("href");
        const vNext = nodo.atributos.get("next");
        const vEvent = nodo.atributos.get("event");
        const destino = (vHref && vHref.trim()) || (vNext && vNext.trim()) || "";
        const evento = vEvent && vEvent.trim();
        if (destino === "" && !evento) this.empuja(REGLA.gotoSinDestino, nodo, "");
        this.saltos.push({ destino, nodo, form: this.idxForm });
        break;
      }
      case "if":
      case "elseif": {
        if (!this.atributoCondNoVacio(nodo)) this.empuja(REGLA.ifSinCond, nodo, "");
        break;
      }
      case "break": {
        const vTime = nodo.atributos.get("time");
        if (vTime !== undefined && !esTiempoSSML(vTime)) {
          this.empuja(REGLA.breakTimeInvalido, nodo, vTime);
        }
        break;
      }
      case "audio": {
        const vSrc = nodo.atributos.get("src");
        const vExpr = nodo.atributos.get("expr");
        const haySrc = vSrc !== undefined && vSrc.trim() !== "";
        const hayExpr = vExpr !== undefined && vExpr.trim() !== "";
        if (!haySrc && !hayExpr) this.empuja(REGLA.audioSinFuente, nodo, "");
        break;
      }
      case "field": {
        const vType = nodo.atributos.get("type");
        if (vType !== undefined && !TIPOS_FIELD.has(vType.trim().toLowerCase())) {
          this.empuja(REGLA.tipoFieldInvalido, nodo, vType);
        }
        break;
      }
      default: break;
    }

    // --- abrir marco (solo elementos no autocerrados) ---
    if (nodo.autocerrado) return;
    const marco: Marco = {
      nodo,
      snap: { ...this.C },
      esPrompt: false, promptAttr: false, nextAttr: false,
      idxForm: this.idxForm,
      idxFormPadre: this.idxForm,
    };
    switch (nodo.nombre) {
      case "prompt":
        this.profundidadPrompt++;
        marco.esPrompt = true;
        break;
      case "field": {
        const vPrompt = nodo.atributos.get("prompt");
        const vNext = nodo.atributos.get("next");
        marco.promptAttr = vPrompt !== undefined && vPrompt.trim() !== "";
        marco.nextAttr = vNext !== undefined && vNext.trim() !== "";
        break;
      }
      case "form": {
        marco.idxForm = this.formularios.length;
        marco.idxFormPadre = this.idxForm;
        this.idxForm = this.formularios.length;
        this.formularios.push({
          id: nodo.atributos.get("id") ?? "",
          linea: nodo.linea, colU16: nodo.colU16, orden: nodo.orden,
          campos: [], tieneSalida: false,
        });
        break;
      }
      default: break;
    }
    this.marcos.push(marco);
  }

  cerrarNodo(nodo: NodoElemento): void {
    const marco = this.marcos.pop();
    if (!marco) return;
    const sub = this.subarbol(marco);

    if (marco.esPrompt) this.profundidadPrompt--;

    switch (nodo.nombre) {
      case "nomatch": {
        if (sub.reprompt === 0 && sub.salida === 0 && sub.goto === 0) {
          this.empuja(REGLA.nomatchSinReprompt, nodo, "");
        }
        break;
      }
      case "field": {
        if (sub.prompt === 0 && !marco.promptAttr) this.empuja(REGLA.fieldSinPrompt, nodo, "");
        if (marco.idxForm >= 0) {
          this.formularios[marco.idxForm].campos.push({
            nodo,
            consume: sub.filled > 0 || marco.nextAttr,
          });
        }
        this.idxForm = marco.idxFormPadre;
        break;
      }
      case "form": {
        this.cerrarFormulario(nodo, marco, sub);
        this.idxForm = marco.idxFormPadre;
        break;
      }
      default: break;
    }
  }

  cerrarFormulario(nodo: NodoElemento, marco: Marco, sub: Contadores): void {
    const f = this.formularios[marco.idxForm];
    f.tieneSalida = sub.salida > 0;

    for (const campo of f.campos) {
      if (!campo.consume && !f.tieneSalida) {
        this.empuja(REGLA.fieldSinConsumidor, campo.nodo, "");
      }
    }
    if (f.campos.length > 0 && sub.nomatch === 0 && sub.noinput === 0 && sub.catch === 0) {
      this.empuja(REGLA.formSinManejadorError, nodo, f.id);
    }
  }

  /** `cond` presente y con algun caracter que no sea espacio/tab/CR/LF. */
  atributoCondNoVacio(nodo: NodoElemento): boolean {
    const v = nodo.atributos.get("cond");
    if (v === undefined) return false;
    for (let i = 0; i < v.length; i++) {
      const c = v.charCodeAt(i);
      if (c !== 32 && c !== 9 && c !== 10 && c !== 13) return true;
    }
    return false;
  }

  procesarTexto(nodo: NodoTexto): void {
    this.nTextos++;
    if (this.profundidadPrompt > 0) {
      const hallados: string[] = [];
      for (const s of SIMBOLOS_TTS) {
        if (nodo.texto.includes(s)) hallados.push(s);
      }
      if (hallados.length) {
        const marco = this.marcos.length ? this.marcos[this.marcos.length - 1] : null;
        this.empuja(
          REGLA.simboloTtsIlegible,
          { linea: nodo.linea, colU16: nodo.colU16, nombre: marco ? marco.nodo.nombre : "prompt" },
          hallados.join(","),
        );
      }
    }
  }

  // -------------------------------------------------------------------------
  // Grafo de flujo entre forms
  // -------------------------------------------------------------------------

  /** Aplica VXML001, VXML002, VXML003, VXML012 y VXML017. */
  resolverGrafo(): Grafo {
    const formularios = this.formularios;
    const n = formularios.length;

    const porId = new Map<string, number[]>();
    for (let i = 0; i < n; i++) {
      const id = formularios[i].id;
      if (id === "") continue;
      const l = porId.get(id);
      if (l) l.push(i);
      else porId.set(id, [i]);
    }

    // VXML012 -- ids de form duplicados.
    for (const [id, lista] of porId) {
      if (lista.length < 2) continue;
      for (let k = 1; k < lista.length; k++) {
        const f = formularios[lista[k]];
        this.empuja(REGLA.idFormDuplicado, { linea: f.linea, colU16: f.colU16, nombre: "form" }, id);
      }
    }

    const adyac: number[][] = Array.from({ length: n }, () => []);
    let nAristas = 0;

    for (const s of this.saltos) {
      const dest = s.destino;
      if (dest.charCodeAt(0) !== 35 /* '#' */) continue;
      const id = dest.slice(1);
      const candidatos = porId.get(id);
      if (!candidatos) {
        this.empuja(REGLA.gotoInexistente, s.nodo, id);
        continue;
      }
      const destino = candidatos[0];
      nAristas++;
      if (s.form >= 0 && s.form < n) {
        adyac[s.form].push(destino);
        if (s.form === destino) this.empuja(REGLA.gotoSIMismo, s.nodo, id);
      }
    }

    // VXML002 -- forms no alcanzables. El primer form se ejecuta al entrar.
    const alcanzable = new Uint8Array(n);
    for (let i = 0; i < n; i++) for (const d of adyac[i]) alcanzable[d] = 1;
    const inalcanzables: string[] = [];
    const visto = new Set<string>();
    for (let i = 0; i < n; i++) {
      if (i === 0) alcanzable[i] = 1;
      if (alcanzable[i]) continue;
      const f = formularios[i];
      if (!visto.has(f.id)) { visto.add(f.id); inalcanzables.push(f.id); }
      this.empuja(REGLA.formInaccesible, { linea: f.linea, colU16: f.colU16, nombre: "form" }, f.id);
    }

    // --- VXML003 -- ciclos sin salida ---
    // Punto fijo: un form es "seguro" si su subarbol contiene una salida o
    // salta a otro form seguro.
    const seguro = new Uint8Array(n);
    const trabajo: number[] = [];
    for (let i = 0; i < n; i++) if (formularios[i].tieneSalida) { seguro[i] = 1; trabajo.push(i); }
    while (trabajo.length) {
      const i = trabajo.pop()!;
      for (let j = 0; j < n; j++) {
        if (seguro[j]) continue;
        for (const d of adyac[j]) {
          if (d === i) { seguro[j] = 1; trabajo.push(j); break; }
        }
      }
    }

    // Componentes fuertemente conexas del subgrafo de forms inseguros.
    const componentes = tarjan(adyac, n, (i) => seguro[i] === 0);
    const ciclos = componentes.filter((c) => c.length > 1 || tieneAutoBucle(adyac, c));
    for (const comp of ciclos) comp.sort((a, b) => formularios[a].orden - formularios[b].orden);
    ciclos.sort((a, b) => formularios[a[0]].orden - formularios[b[0]].orden);
    for (const comp of ciclos) {
      const ancla = formularios[comp[0]];
      const cadena = comp.map((i) => formularios[i].id).join(" -> ") + " -> " + ancla.id;
      this.empuja(REGLA.cicloSinSalida, { linea: ancla.linea, colU16: ancla.colU16, nombre: "form" }, cadena);
    }

    return { nodos: n, aristas: nAristas, ciclos: ciclos.length, inalcanzables, alcanzable };
  }

  // -------------------------------------------------------------------------
  // VXML015 -- identificadores no declarados
  // -------------------------------------------------------------------------

  revisarExpresion(expr: string, ev: Ev): void {
    const n = expr.length;
    let i = 0;
    let trasPunto = false;
    while (i < n) {
      const c = expr.charCodeAt(i);

      // Cadena: se salta entera.
      if (c === 34 || c === 39) {
        const q = c;
        i++;
        while (i < n) {
          const d = expr.charCodeAt(i);
          if (d === 92) { i += 2; continue; }
          i++;
          if (d === q) break;
        }
        trasPunto = false;
        continue;
      }

      // Numero: se salta entero.
      if (c >= 48 && c <= 57) {
        i++;
        while (i < n && esDigitoHex(expr.charCodeAt(i))) i++;
        trasPunto = false;
        continue;
      }

      // Identificador.
      if (esIniIdent(c) || c === 36) {
        const ini = i;
        while (i < n && esCuerpoIdent(expr.charCodeAt(i))) i++;
        const ident = expr.slice(ini, i);
        if (trasPunto) { trasPunto = false; continue; }
        if (PALABRAS_CLAVE_EXPRESION.has(ident) || INTEGRADOS_VOICEXML.has(ident)) continue;
        if (this.declarados.has(ident)) continue;
        // Shadow variable: "equipo$" -> "equipo"
        if (ident.charCodeAt(ident.length - 1) === 36) {
          const base = ident.slice(0, ident.length - 1);
          if (this.declarados.has(base) || INTEGRADOS_VOICEXML.has(base)) continue;
        }
        // Clave de objeto literal: "ident :" o llamada "ident ("
        let j = i;
        while (j < n && expr.charCodeAt(j) <= 32) j++;
        const sig = j < n ? expr.charCodeAt(j) : -1;
        if (sig === 58 /* : */ || sig === 40 /* ( */) continue;
        const clave = ev.linea + ":" + ev.colU16 + ":" + ident;
        if (this.alertas.has(clave)) continue;
        this.alertas.add(clave);
        this.empuja(REGLA.identificadorNoDeclarado, ev, ident);
        continue;
      }

      trasPunto = c === 46 /* . */;
      i++;
    }
  }
}

// ===========================================================================
// API PUBLICA
// ===========================================================================

/**
 * Analiza un documento VoiceXML y devuelve el informe canonico en JSON.
 * Identico al de las implementaciones de JavaScript y WebAssembly.
 */
export function analizarTexto(texto: string, nombreArchivo: string, src?: Uint8Array | null): string {
  return serializarInforme(analizarDocumento(texto, nombreArchivo, src));
}

/** Igual que `analizarTexto` pero devuelve el objeto deserializado. */
export function analizarDocumento(
  texto: string,
  nombreArchivo: string,
  src?: Uint8Array | null,
): Informe {
  return new AnalizadorVxml(texto, nombreArchivo, src).analizar();
}

// ===========================================================================
// Utilidades
// ===========================================================================

/** `time` de SSML: numero de segundos, o numero seguido de unidad. */
function esTiempoSSML(s: string): boolean {
  const t = s.trim();
  if (/^[0-9]+(\.[0-9]+)?$/.test(t)) return true;
  return /^[0-9]+(\.[0-9]+)?(ms|s|m|h)$/.test(t);
}

/** Numero de lineas: separadores + la ultima, si no termina en salto. */
function contarLineas(texto: string): number {
  if (texto.length === 0) return 0;
  let l = 0;
  for (let i = 0; i < texto.length; i++) if (texto.charCodeAt(i) === 10) l++;
  return texto.charCodeAt(texto.length - 1) === 10 ? l : l + 1;
}

function contarCampos(formularios: Formulario[]): number {
  let t = 0;
  for (const f of formularios) t += f.campos.length;
  return t;
}

function esIniIdent(c: number): boolean {
  return (c >= 65 && c <= 90) || (c >= 97 && c <= 122) || c === 95 /* _ */;
}
function esCuerpoIdent(c: number): boolean {
  return (c >= 65 && c <= 90) || (c >= 97 && c <= 122) ||
    (c >= 48 && c <= 57) || c === 95 || c === 36 /* $ */;
}
function esDigitoHex(c: number): boolean {
  return (c >= 48 && c <= 57) || (c >= 97 && c <= 102) || (c >= 65 && c <= 70) ||
    c === 46 /* . */ || c === 120 || c === 88 /* x X */;
}

/**
 * Tarjan recursivo restringido a los nodos que pasan `filtro`. Los
 * componentes fuertemente conexos son un invariante del grafo, asi que la
 * lista ordenada de ciclos coincide con la de las otras implementaciones.
 */
function tarjan(adyac: number[][], n: number, filtro: (i: number) => boolean): number[][] {
  const idx = new Int32Array(n).fill(-1);
  const bajo = new Int32Array(n);
  const enPila = new Uint8Array(n);
  const pilaT: number[] = [];
  const componentes: number[][] = [];
  let contador = 0;

  const visitar = (v: number): void => {
    idx[v] = bajo[v] = contador++;
    pilaT.push(v);
    enPila[v] = 1;
    for (const w of adyac[v]) {
      if (!filtro(w)) continue;
      if (idx[w] === -1) {
        visitar(w);
        bajo[v] = Math.min(bajo[v], bajo[w]);
      } else if (enPila[w]) {
        bajo[v] = Math.min(bajo[v], idx[w]);
      }
    }
    if (bajo[v] === idx[v]) {
      const comp: number[] = [];
      for (;;) {
        const w = pilaT.pop()!;
        enPila[w] = 0;
        comp.push(w);
        if (w === v) break;
      }
      componentes.push(comp);
    }
  };

  for (let raiz = 0; raiz < n; raiz++) {
    if (idx[raiz] === -1 && filtro(raiz)) visitar(raiz);
  }
  return componentes;
}

function tieneAutoBucle(adyac: number[][], comp: number[]): boolean {
  if (comp.length !== 1) return false;
  for (const d of adyac[comp[0]]) if (d === comp[0]) return true;
  return false;
}