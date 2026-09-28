/**
 * vxml-lint.mjs -- Motor de analisis de VXML Doctor (implementacion JavaScript).
 *
 * ESTRATEGIA (JavaScript):
 *   - Una sola pasada sobre el texto para el escaneo (ver scanner.mjs).
 *   - Una sola pasada sobre la lista de eventos para construir el modelo.
 *   - Nombres comparados por hash FNV-1a: nunca se comparan subcadenas, y solo
 *     se materializa un string cuando su valor hace falta de verdad.
 *   - El subarbol de cada elemento se mide con contadores incrementales
 *     (diferencia entre el valor al abrir y al cerrar), sin recorrer el arbol.
 *   - Sin recursividad: Tarjan es iterativo, para no depender del limite de la
 *     pila de llamadas de V8.
 *
 * La columna publicada es un desplazamiento en BYTES UTF-8 desde el inicio de
 * la linea (ver `columnaByte`), no una columna en unidades UTF-16. Es una
 * decision del contrato compartido para que el informe sea comparable con las
 * implementaciones de TypeScript y WebAssembly.
 */

import { escanear, resolverEntidades, T, h } from "./scanner.mjs";
import {
  CATALOGO, INDICE_NOMBRE,
  ELEMENTOS_SALIDA, TIPOS_FIELD, SIMBOLOS_TTS,
  INTEGRADOS_VOICEXML, PALABRAS_CLAVE_EXPRESION,
  serializarInforme, ordenarDiagnosticos, crearColumnas,
} from "../core/contrato.mjs";

// --- Hashes de elementos usados en el camino caliente ----------------------
const EL_VXML = h("vxml");
const EL_FORM = h("form");
const EL_FIELD = h("field");
const EL_GOTO = h("goto");
const EL_PROMPT = h("prompt");
const EL_NOMATCH = h("nomatch");
const EL_NOINPUT = h("noinput");
const EL_FILLED = h("filled");
const EL_REPROMPT = h("reprompt");
const EL_CATCH = h("catch");
const EL_IF = h("if");
const EL_ELSEIF = h("elseif");
const EL_ELSE = h("else");
const EL_BREAK = h("break");
const EL_AUDIO = h("audio");
const EL_SCRIPT = h("script");

// --- Hashes de atributos ----------------------------------------------------
const AT_ID = h("id");
const AT_HREF = h("href");
const AT_NEXT = h("next");
const AT_EVENT = h("event");
const AT_COND = h("cond");
const AT_EXPR = h("expr");
const AT_SRCEXPR = h("srcexpr");
const AT_TYPE = h("type");
const AT_NAME = h("name");
const AT_TIME = h("time");
const AT_SRC = h("src");
const AT_PROMPT = h("prompt");
const AT_VERSION = h("version");
const AT_XMLLANG = h("xml:lang");

/** Atributos cuyo valor es codigo ECMAScript (se inspecciona con VXML015). */
const AT_EXPRESION = new Set([AT_COND, AT_EXPR, AT_SRCEXPR]);

/** Nombres de contadores que definen el subarbol de un elemento. */
const CONTADORES = [
  "salida", "reprompt", "catch", "nomatch", "noinput", "filled", "goto", "prompt",
];

// ===========================================================================
// API PUBLICA
// ===========================================================================

/**
 * Analiza un documento VoiceXML y devuelve el informe canonico en JSON.
 *
 * @param {string} texto           Contenido del documento.
 * @param {string} nombreArchivo   Nombre que aparece en el informe.
 * @param {Uint8Array|null} [src]  Bytes originales. Si se pasan, la columna se
 *   mide sobre ellos; si no, se codifica `texto` en UTF-8.
 * @returns {string} Informe JSON canonico.
 */
export function analizarTexto(texto, nombreArchivo, src) {
  return serializarInforme(analizarDocumento(texto, nombreArchivo, src));
}

/**
 * Igual que `analizarTexto` pero devuelve el objeto ya deserializado.
 * Lo usa la interfaz web; el banco de pruebas usa la version canonica, que es
 * la que debe coincidir byte a byte entre las tres implementaciones.
 *
 * @param {string} texto
 * @param {string} nombreArchivo
 * @param {Uint8Array|null} [src]
 */
export function analizarDocumento(texto, nombreArchivo, src) {
  const bytes = src || new TextEncoder().encode(texto);
  const utf8 = crearColumnas(bytes, texto);

  /** @type {{msg: string, linea: number, col: number}[]} */
  const notas = [];
  const eventos = escanear(texto, (msg, linea, colU16) => {
    notas.push({ msg, linea, col: utf8.columnaByte(colU16, linea) });
  });

  /** @type {any[]} */
  const ds = [];
  const empuja = (nombre, ev, detalle) => {
    const idx = INDICE_NOMBRE.get(nombre);
    if (idx === undefined) throw new Error("Regla desconocida en el catalogo: " + nombre);
    const r = CATALOGO.reglas[idx];
    ds.push({
      regla: r.id, gravedad: r.gravedad,
      linea: ev.linea, elemento: ev.nombre,
      detalle: detalle || "", mensaje: r.mensaje,
      _colU16: ev.colU16,
    });
  };

  // ---------------------------------------------------------------------
  // PASADA 2: construir el modelo
  // ---------------------------------------------------------------------
  const C = {
    salida: 0, reprompt: 0, catch: 0, nomatch: 0, noinput: 0, filled: 0,
    goto: 0, prompt: 0,
  };
  /** @type {any[]} */
  const pila = [];
  /** @type {any[]} */
  const formularios = [];
  /** @type {any[]} */
  const saltos = [];
  const declarados = new Set();
  const alertas = new Set(); // evita repetir VXML015 por atributo

  let raizVista = 0;
  let nElementos = 0, nAtributos = 0, nTextos = 0, nPrompts = 0, nScripts = 0;
  let profundidadPrompt = 0;
  let ordenElemento = 0;
  /** Indice del form abierto mas interno, o -1. */
  let idxForm = -1;

  for (let ei = 0; ei < eventos.length; ei++) {
    const ev = eventos[ei];

    // --- Texto entre elementos -----------------------------------------
    if (ev.t === T.TEXTO) {
      nTextos++;
      if (profundidadPrompt > 0) {
        const cuerpo = resolverEntidades(texto, ev.ini, ev.fin);
        const hallados = [];
        for (const s of SIMBOLOS_TTS) if (cuerpo.indexOf(s) >= 0) hallados.push(s);
        if (hallados.length) {
          // El texto vive en el elemento mas interno abierto, que no siempre
          // es el <prompt> (puede ser un <s>, un <value> o un <audio>).
          const marco = pila.length ? pila[pila.length - 1] : null;
          empuja("simbolo-tts-ilegible",
            { linea: ev.linea, colU16: ev.colU16, nombre: marco ? marco.ev.nombre : "prompt" },
            hallados.join(","));
        }
      }
      continue;
    }

    // --- Cierre de un elemento ------------------------------------------
    if (ev.t === T.CIERRE) {
      // VoiceXML cierra la cadena <if>/<elseif>/<else> con una sola etiqueta:
      // un </if> desapila los <elseif>/<else> abiertos Y el <if> original.
      // El scanner ya hace lo mismo con su pila de nombres (scanner.mjs); aqui
      // la pila de marcos debe comportarse igual, o un <form> cuya cadena <if>
      // no este mediada por <filled> nunca se cerraria y se perderian las
      // reglas de formulario.
      if (ev.nombre === "if") {
        while (
          pila.length &&
          (pila[pila.length - 1].hash === EL_ELSEIF || pila[pila.length - 1].hash === EL_ELSE)
        ) {
          const m = pila.pop();
          if (m && m.esPrompt) profundidadPrompt--;
        }
      }
      const marco = pila.pop();
      if (!marco) continue;
      const sub = subarbol(marco, C);

      if (marco.esPrompt) profundidadPrompt--;

      if (marco.hash === EL_NOMATCH) {
        if (sub.reprompt === 0 && sub.salida === 0 && sub.goto === 0) {
          empuja("nomatch-sin-reprompt", marco.ev);
        }
      } else if (marco.hash === EL_FIELD) {
        if (sub.prompt === 0 && !marco.promptAttr) empuja("field-sin-prompt", marco.ev);
        if (marco.idxForm >= 0) {
          formularios[marco.idxForm].campos.push({
            ev: marco.ev,
            consume: sub.filled > 0 || marco.nextAttr,
          });
        }
        idxForm = marco.idxFormPadre;
      } else if (marco.hash === EL_FORM) {
        cerrarFormulario(marco, sub, formularios, empuja);
        idxForm = marco.idxFormPadre;
      }
      continue;
    }

    // --- Apertura de un elemento ----------------------------------------
    nElementos++;
    ordenElemento++;
    nAtributos += ev.n;

    // Atributos de interes, localizados por hash.
    let vId = null, vHref = null, vNext = null, vEvent = null, vType = null;
    let vName = null, vTime = null, vSrc = null, vExpr = null;
    let vPrompt = null, vLang = null, vVersion = null;
    for (let a = 0; a < ev.n; a++) {
      const ini = ev.aPos[a], fin = ini + ev.aLen[a];
      switch (ev.aH[a]) {
        case AT_ID: vId = resolverEntidades(texto, ini, fin); break;
        case AT_HREF: vHref = resolverEntidades(texto, ini, fin); break;
        case AT_NEXT: vNext = resolverEntidades(texto, ini, fin); break;
        case AT_EVENT: vEvent = resolverEntidades(texto, ini, fin); break;
        case AT_TYPE: vType = resolverEntidades(texto, ini, fin); break;
        case AT_NAME: vName = resolverEntidades(texto, ini, fin); break;
        case AT_TIME: vTime = resolverEntidades(texto, ini, fin); break;
        case AT_SRC: vSrc = resolverEntidades(texto, ini, fin); break;
        case AT_EXPR: vExpr = resolverEntidades(texto, ini, fin); break;
        case AT_PROMPT: vPrompt = resolverEntidades(texto, ini, fin); break;
        case AT_VERSION: vVersion = resolverEntidades(texto, ini, fin); break;
        case AT_XMLLANG: vLang = resolverEntidades(texto, ini, fin); break;
        default: break;
      }
    }

    // Expresiones ECMAScript (VXML015). Se hace aqui, antes de anadir `vName`
    // a los declarados, para no auto-confirmar una lectura.
    for (let a = 0; a < ev.n; a++) {
      if (!AT_EXPRESION.has(ev.aH[a])) continue;
      const expr = resolverEntidades(texto, ev.aPos[a], ev.aPos[a] + ev.aLen[a]);
      revisarExpresion(expr, ev, declarados, alertas, empuja);
    }

    if (vName !== null) declarados.add(vName);

    if (ev.hash === EL_VXML) {
      raizVista++;
      if (raizVista === 1) {
        if (vLang === null) empuja("sin-xml-lang", ev);
        if (vVersion === null) empuja("sin-version", ev);
      }
    }
    if (ev.hash === EL_SCRIPT) nScripts++;
    if (ev.hash === EL_PROMPT) nPrompts++;

    // Contadores de subarbol.
    if (ELEMENTOS_SALIDA.has(ev.nombre)) C.salida++;
    if (ev.hash === EL_REPROMPT) C.reprompt++;
    if (ev.hash === EL_CATCH) C.catch++;
    if (ev.hash === EL_NOMATCH) C.nomatch++;
    if (ev.hash === EL_NOINPUT) C.noinput++;
    if (ev.hash === EL_FILLED) C.filled++;
    if (ev.hash === EL_PROMPT) C.prompt++;

    if (ev.hash === EL_GOTO) {
      C.goto++;
      const destino = (vHref && vHref.trim()) || (vNext && vNext.trim()) || "";
      const evento = vEvent && vEvent.trim();
      if (destino === "" && !evento) empuja("goto-sin-destino", ev);
      saltos.push({ destino, ev, form: idxForm });
    }

    if (ev.hash === EL_IF || ev.hash === EL_ELSEIF) {
      if (!atributoNoVacio(texto, ev, AT_COND)) empuja("if-sin-cond", ev);
    }
    if (ev.hash === EL_BREAK && vTime !== null) {
      if (!esTiempoSSML(vTime)) empuja("break-time-invalido", ev, vTime);
    }
    if (ev.hash === EL_AUDIO) {
      const haySrc = vSrc !== null && vSrc.trim() !== "";
      const hayExpr = vExpr !== null && vExpr.trim() !== "";
      if (!haySrc && !hayExpr) empuja("audio-sin-fuente", ev);
    }
    if (ev.hash === EL_FIELD && vType !== null) {
      if (!TIPOS_FIELD.has(vType.trim().toLowerCase())) {
        empuja("tipo-field-invalido", ev, vType);
      }
    }

    // --- Abrir marco (solo si no es autocerrado) ---
    if (ev.t === T.INICIO) {
      const marco = { hash: ev.hash, ev, esPrompt: false, promptAttr: false, nextAttr: false, idxForm: -1, idxFormPadre: -1 };
      for (const k of CONTADORES) marco[k] = C[k];

      if (ev.hash === EL_PROMPT) {
        profundidadPrompt++;
        marco.esPrompt = true;
      }
      if (ev.hash === EL_FIELD) {
        // Un field no puede contener forms, asi que el form abierto sigue
        // siendo el vigente: los <goto> de su interior deben atribuirse a el.
        marco.idxForm = idxForm;
        marco.idxFormPadre = idxForm;
        marco.promptAttr = vPrompt !== null && vPrompt.trim() !== "";
        marco.nextAttr = vNext !== null && vNext.trim() !== "";
      }
      if (ev.hash === EL_FORM) {
        marco.idxForm = formularios.length;
        marco.idxFormPadre = idxForm;
        idxForm = formularios.length;
        formularios.push({
          id: vId === null ? "" : vId,
          linea: ev.linea, colU16: ev.colU16, orden: ordenElemento,
          campos: [], tieneSalida: false,
        });
      }
      pila.push(marco);
    }
  }

  // ---------------------------------------------------------------------
  // PASADA 3: grafo de flujo entre forms
  // ---------------------------------------------------------------------
  const grafo = resolverGrafo(formularios, saltos, empuja);

  // ---------------------------------------------------------------------
  // Cierre del informe
  // ---------------------------------------------------------------------
  for (const d of ds) {
    d.columna = utf8.columnaByte(d._colU16, d.linea);
    delete d._colU16;
  }
  ordenarDiagnosticos(ds);

  const informe = {
    archivo: nombreArchivo,
    bytes: bytes.length,
    lineas: contarLineas(texto),
    elementos: nElementos,
    formularios: formularios.map((f, i) => ({
      id: f.id, linea: f.linea, campos: f.campos.length, accesible: !!grafo.alcanzable[i],
    })),
    diagnosticos: ds,
    grafo: {
      nodos: grafo.nodos, aristas: grafo.aristas,
      ciclos: grafo.ciclos, inalcanzables: grafo.inalcanzables,
    },
    estadisticas: {
      elementos: nElementos,
      atributos: nAtributos,
      formularios: formularios.length,
      campos: contarCampos(formularios),
      prompts: nPrompts,
      textos: nTextos,
      saltos: saltos.length,
      scripts: nScripts,
      bytes: bytes.length,
    },
  };
  informe.notas = notas;
  return informe;
}

// ===========================================================================
// SUBPASADAS
// ===========================================================================

/** Diferencia de contadores entre la apertura de un marco y su cierre. */
function subarbol(marco, C) {
  const s = {};
  for (const k of CONTADORES) s[k] = C[k] - marco[k];
  // El prompt cuenta como subarbol de si mismo para la deteccion de
  // field-sin-prompt, asi que no se ha descontado (marco.prompt = -1).
  return s;
}

/** Al cerrar un <form>: aplica VXML005 y VXML016 a sus campos. */
function cerrarFormulario(marco, sub, formularios, empuja) {
  const f = formularios[marco.idxForm];
  f.tieneSalida = sub.salida > 0;

  for (const campo of f.campos) {
    if (!campo.consume && !f.tieneSalida) {
      empuja("field-sin-consumidor", campo.ev);
    }
  }
  if (f.campos.length > 0 && sub.nomatch === 0 && sub.noinput === 0 && sub.catch === 0) {
    empuja("form-sin-manejador-error", marco.ev, f.id);
  }
}

/** El atributo existe y no esta vacio ni en blanco. */
function atributoNoVacio(texto, ev, hashBuscado) {
  for (let a = 0; a < ev.n; a++) {
    if (ev.aH[a] !== hashBuscado) continue;
    for (let i = ev.aPos[a]; i < ev.aPos[a] + ev.aLen[a]; i++) {
      const c = texto.charCodeAt(i);
      if (c !== 32 && c !== 9 && c !== 10 && c !== 13) return true;
    }
    return false;
  }
  return false;
}

function contarCampos(formularios) {
  let t = 0;
  for (const f of formularios) t += f.campos.length;
  return t;
}

/**
 * Construye y valida el grafo de navegacion entre forms.
 * Aplica VXML001, VXML002, VXML003, VXML012 y VXML017.
 */
function resolverGrafo(formularios, saltos, empuja) {
  const n = formularios.length;

  /** @type {Map<string, number[]>} */
  const porId = new Map();
  for (let i = 0; i < n; i++) {
    const id = formularios[i].id;
    if (id === "") continue;
    let l = porId.get(id);
    if (!l) { l = []; porId.set(id, l); }
    l.push(i);
  }

  // VXML012 -- ids de form duplicados.
  for (const [id, lista] of porId) {
    if (lista.length < 2) continue;
    for (let k = 1; k < lista.length; k++) {
      const f = formularios[lista[k]];
      empuja("id-form-duplicado", evDeForm(f), id);
    }
  }

  const adyac = Array.from({ length: n }, () => []);
  let nAristas = 0;

  for (const s of saltos) {
    const dest = s.destino;
    if (dest.charCodeAt(0) !== 35 /* '#' */) continue;
    const id = dest.slice(1);
    const candidatos = porId.get(id);
    if (!candidatos) {
      empuja("goto-a-form-inexistente", s.ev, id);
      continue;
    }
    const destino = candidatos[0];
    nAristas++;
    if (s.form >= 0 && s.form < n) {
      adyac[s.form].push(destino);
      // VXML017 -- salto al propio form.
      if (s.form === destino) empuja("goto-a-si-mismo", s.ev, id);
    }
  }

  // VXML002 -- forms no alcanzables. El primer form se ejecuta al entrar.
  const alcanzable = new Uint8Array(n);
  for (let i = 0; i < n; i++) for (const d of adyac[i]) alcanzable[d] = 1;
  const inalcanzables = [];
  const visto = new Set();
  for (let i = 0; i < n; i++) {
    if (i === 0) alcanzable[i] = 1;
    if (alcanzable[i]) continue;
    const f = formularios[i];
    if (!visto.has(f.id)) { visto.add(f.id); inalcanzables.push(f.id); }
    empuja("form-inaccesible", evDeForm(f), f.id);
  }

  // --- VXML003 -- ciclos sin salida ---------------------------------------
  // 1) Punto fijo: un form es "seguro" si su subarbol contiene una salida
  //    (exit, return, disconnect, transfer) o salta a otro form seguro.
  const seguro = new Uint8Array(n);
  const trabajo = [];
  for (let i = 0; i < n; i++) if (formularios[i].tieneSalida) { seguro[i] = 1; trabajo.push(i); }
  while (trabajo.length) {
    const i = trabajo.pop();
    for (let j = 0; j < n; j++) {
      if (seguro[j]) continue;
      for (const d of adyac[j]) {
        if (d === i) { seguro[j] = 1; trabajo.push(j); break; }
      }
    }
  }

  // 2) Componentes fuertemente conexas del subgrafo de forms inseguros.
  const componentes = tarjan(adyac, n, (i) => seguro[i] === 0);
  const ciclos = componentes.filter((c) => c.length > 1 || tieneAutoBucle(adyac, c));
  for (const comp of ciclos) comp.sort((a, b) => formularios[a].orden - formularios[b].orden);
  ciclos.sort((a, b) => formularios[a[0]].orden - formularios[b[0]].orden);
  for (const comp of ciclos) {
    const ancla = formularios[comp[0]];
    const cadena = comp.map((i) => formularios[i].id).join(" -> ") + " -> " + ancla.id;
    empuja("ciclo-goto-sin-salida", evDeForm(ancla), cadena);
  }

  return { nodos: n, aristas: nAristas, ciclos: ciclos.length, inalcanzables, alcanzable };
}

/** Envoltura de evento para un form (los forms se analizan en la pasada 3). */
function evDeForm(f) {
  return { linea: f.linea, colU16: f.colU16, nombre: "form" };
}

/**
 * Algoritmo de Tarjan iterativo, restringido a los nodos que pasan `filtro`.
 *
 * Se usan dos pilas paralelas (nodo y cursor de aristas) en lugar de un marco
 * con pares intercalados: evita por completo el error de leer en la posicion
 * equivocada y hace el algoritmo legible.
 *
 * @param {number[][]} adyac
 * @param {number} n
 * @param {(i: number) => boolean} filtro
 * @returns {number[][]}
 */
function tarjan(adyac, n, filtro) {
  const idx = new Int32Array(n).fill(-1);
  const bajo = new Int32Array(n);
  const enPila = new Uint8Array(n);
  const pilaT = [];
  const pilaNodos = [];
  const pilaCursors = new Int32Array(n + 1);
  const componentes = [];
  let contador = 0;

  for (let raiz = 0; raiz < n; raiz++) {
    if (idx[raiz] !== -1 || !filtro(raiz)) continue;

    idx[raiz] = bajo[raiz] = contador++;
    pilaT.push(raiz);
    enPila[raiz] = 1;
    pilaNodos.push(raiz);
    pilaCursors[0] = 0;

    while (pilaNodos.length) {
      const prof = pilaNodos.length - 1;
      const v = pilaNodos[prof];
      const vecinos = adyac[v];

      if (pilaCursors[prof] < vecinos.length) {
        const w = vecinos[pilaCursors[prof]++];
        if (!filtro(w)) continue;
        if (idx[w] === -1) {
          idx[w] = bajo[w] = contador++;
          pilaT.push(w);
          enPila[w] = 1;
          pilaNodos.push(w);
          pilaCursors[prof + 1] = 0;
        } else if (enPila[w] && idx[w] < bajo[v]) {
          bajo[v] = idx[w];
        }
        continue;
      }

      // Todas las aristas de v procesadas: sale del marco y propaga a su padre.
      pilaNodos.pop();
      if (pilaNodos.length) {
        const padre = pilaNodos[pilaNodos.length - 1];
        if (bajo[v] < bajo[padre]) bajo[padre] = bajo[v];
      }
      if (bajo[v] === idx[v]) {
        const comp = [];
        for (;;) {
          const w = pilaT.pop();
          enPila[w] = 0;
          comp.push(w);
          if (w === v) break;
        }
        componentes.push(comp);
      }
    }
  }
  return componentes;
}

function tieneAutoBucle(adyac, comp) {
  if (comp.length !== 1) return false;
  for (const d of adyac[comp[0]]) if (d === comp[0]) return true;
  return false;
}

// ===========================================================================
// VXML015 -- identificadores no declarados
// ===========================================================================

function revisarExpresion(expr, ev, declarados, alertas, empuja) {
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
      if (declarados.has(ident)) continue;
      // Shadow variable: "equipo$" -> "equipo"
      if (ident.charCodeAt(ident.length - 1) === 36) {
        const base = ident.slice(0, ident.length - 1);
        if (declarados.has(base) || INTEGRADOS_VOICEXML.has(base)) continue;
      }
      // Clave de objeto literal: "ident :"
      let j = i;
      while (j < n && expr.charCodeAt(j) <= 32) j++;
      const sig = j < n ? expr.charCodeAt(j) : -1;
      if (sig === 58 /* : */ || sig === 40 /* ( */) continue;
      const clave = ev.linea + ":" + ev.colU16 + ":" + ident;
      if (alertas.has(clave)) continue;
      alertas.add(clave);
      empuja("identificador-no-declarado", ev, ident);
      continue;
    }

    trasPunto = c === 46 /* . */;
    i++;
  }
}

function esIniIdent(c) {
  return (c >= 65 && c <= 90) || (c >= 97 && c <= 122) || c === 95 /* _ */;
}
function esCuerpoIdent(c) {
  return (c >= 65 && c <= 90) || (c >= 97 && c <= 122) ||
    (c >= 48 && c <= 57) || c === 95 || c === 36 /* $ */;
}
function esDigitoHex(c) {
  return (c >= 48 && c <= 57) || (c >= 97 && c <= 102) || (c >= 65 && c <= 70) ||
    c === 46 /* . */ || c === 120 || c === 88 /* x X */;
}

// ===========================================================================
// Utilidades
// ===========================================================================

/** `time` de SSML: numero de segundos, o numero seguido de unidad. */
function esTiempoSSML(s) {
  const t = s.trim();
  if (/^[0-9]+(\.[0-9]+)?$/.test(t)) return true;
  return /^[0-9]+(\.[0-9]+)?(ms|s|m|h)$/.test(t);
}

/** Numero de lineas: separadores + la ultima, si no termina en salto. */
function contarLineas(texto) {
  if (texto.length === 0) return 0;
  let l = 0;
  for (let i = 0; i < texto.length; i++) if (texto.charCodeAt(i) === 10) l++;
  return texto.charCodeAt(texto.length - 1) === 10 ? l : l + 1;
}

function esAscii(s) {
  for (let i = 0; i < s.length; i++) if (s.charCodeAt(i) > 0x7f) return false;
  return true;
}
