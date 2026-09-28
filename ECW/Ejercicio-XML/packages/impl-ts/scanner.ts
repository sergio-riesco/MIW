/**
 * scanner.ts -- Construye un ARBOL de nodos tipados en una sola pasada.
 * ---------------------------------------------------------------------------
 * La diferencia de diseno con la implementacion en JavaScript:
 *
 *   JavaScript (impl-js/scanner.mjs)  -> una lista PLANA de eventos con
 *   offsets y hashes FNV-1a, sin asignar un solo objeto por etiqueta.
 *
 *   TypeScript (este fichero)        -> un arbol de NODOS TIPADOS
 *   (NodoElemento | NodoTexto) con los atributos ya materializados en un Map.
 *   TS tira del tipado: el motor de analisis hace matching exhaustivo con
 *   `switch` sobre nombres, sin memorizar ningun hash. Se asigna mas memoria
 *   por etiqueta (un nodo por elemento), que es justamente lo que se quiere
 *   comparar con Rust.
 *
 * Las POSICIONES (linea y columna provisional en unidades UTF-16) y la
 * agrupacion de texto son identicas a las de JavaScript: el contrato del
 * informe necesita que cada diagnostico salga en el mismo sitio.
 *
 * Cadena <if>/<elseif>/<else>: igual que en el scanner de JS, un unico </if>
 * cierra la cadena entera (elseif/else abiertos y el if original).
 * ---------------------------------------------------------------------------
 */

/** Hash FNV-1a de 32 bits sobre los codigos UTF-16 del nombre. */
export function h(s: string): number {
  let x = 0x811c9dc5 | 0;
  for (let i = 0; i < s.length; i++) x = Math.imul(x ^ s.charCodeAt(i), 0x01000193);
  return x >>> 0;
}

/** Resuelve entidades identico al contrato (solo las 5 predefinidas). */
function resolverEntidades(texto: string, ini: number, fin: number): string {
  let hayAmp = false;
  for (let i = ini; i < fin; i++) {
    if (texto.charCodeAt(i) === 38 /* & */) { hayAmp = true; break; }
  }
  if (!hayAmp) return texto.slice(ini, fin);
  let r = "";
  let ultimo = ini;
  let i = ini;
  while (i < fin) {
    if (texto.charCodeAt(i) !== 38) { i++; continue; }
    const semi = texto.indexOf(";", i + 1);
    if (semi < 0 || semi >= fin) { r += texto.slice(ultimo, i + 1); i = ultimo = i + 1; continue; }
    r += texto.slice(ultimo, i);
    const ent = texto.slice(i + 1, semi);
    switch (ent) {
      case "amp": r += "&"; break;
      case "lt": r += "<"; break;
      case "gt": r += ">"; break;
      case "quot": r += '"'; break;
      case "apos": r += "'"; break;
      default: r += "&" + ent + ";"; break;
    }
    i = semi + 1;
    ultimo = i;
  }
  return r + texto.slice(ultimo, fin);
}

// ===========================================================================
// Modelo tipado del arbol
// ===========================================================================

export interface NodoTexto {
  readonly tipo: "texto";
  /** Entidades resueltas; el trozo [ini, fin) sin ningun '<'. */
  readonly texto: string;
  readonly linea: number;
  readonly colU16: number;
  padre: NodoElemento | null;
}

export interface NodoElemento {
  readonly tipo: "elemento";
  readonly nombre: string;
  readonly hash: number;
  readonly linea: number;
  readonly colU16: number;
  /** Orden global de apertura (distingue dos forms en la misma linea). */
  readonly orden: number;
  readonly autocerrado: boolean;
  /** Atributos en orden de aparicion, valor con entidades resueltas. */
  readonly atributos: Map<string, string>;
  /** Numero de atributos tal como aparecieron (sin deduplicar). */
  readonly nAtributos: number;
  readonly hijos: Nodo[];
  padre: NodoElemento | null;
}

export type Nodo = NodoTexto | NodoElemento;

export interface NodoDocumento {
  readonly tipo: "documento";
  readonly hijos: Nodo[];
}

export interface NotaEscaneo {
  msg: string;
  linea: number;
  col: number;
}

const ASCII_LT = 60, ASCII_GT = 62, ASCII_SLASH = 47, ASCII_EQ = 61;
const ASCII_QUOT = 34, ASCII_APOS = 39, ASCII_NL = 10;
const ASCII_BANG = 33, ASCII_QUESTION = 63, ASCII_LBRACKET = 91;
const ASCII_RBRACKET = 93;

function esNombre(c: number): boolean {
  return (c >= 65 && c <= 90) || (c >= 97 && c <= 122) ||
    (c >= 48 && c <= 57) || c === 95 || c === 58 || c === 46 || c === 45 || c === 35;
}

function esEspacio(c: number): boolean {
  return c === 32 || c === 10 || c === 9 || c === 13;
}

function esBlanco(texto: string, a: number, b: number): boolean {
  for (let i = a; i < b; i++) if (!esEspacio(texto.charCodeAt(i))) return false;
  return true;
}

/** Avanza linea/columna provisional por el tramo [a, b). */
function avanzar(texto: string, a: number, b: number, pos: { i: number; linea: number; colU16: number }): void {
  for (let q = a; q < b; q++) {
    if (texto.charCodeAt(q) === ASCII_NL) { pos.linea++; pos.colU16 = 1; } else { pos.colU16++; }
  }
}

/**
 * Analiza `texto` y devuelve el documento (arbol de nodos) y las notas de
 * escaneo. Las columnas provisionales van en unidades UTF-16, igual que en
 * la implementacion de JavaScript; la conversion a bytes UTF-8 se hace al
 * serializar, con el contrato compartido.
 */
export function escanearArbol(
  texto: string,
  alAdvertir?: (msg: string, linea: number, col: number) => void,
): { doc: NodoDocumento; notas: NotaEscaneo[] } {
  const notas: NotaEscaneo[] = [];
  const avisa = (msg: string, linea: number, col: number): void => {
    notas.push({ msg, linea, col });
    alAdvertir?.(msg, linea, col);
  };

  const doc: NodoDocumento = { tipo: "documento", hijos: [] };

  // Pila de elementos abiertos (nodos) y sus nombres.
  const pila: NodoElemento[] = [];
  const abiertos: string[] = [];
  let profundidad = 0;

  const pos = { i: 0, linea: 1, colU16: 1 };
  let orden = 0;
  const n = texto.length;

  while (pos.i < n) {
    const c = texto.charCodeAt(pos.i);
    const iniLinea = pos.linea, iniCol = pos.colU16;

    if (c !== ASCII_LT) {
      // --- Texto. Se agrupa hasta el siguiente '<' y solo se crea un nodo
      //     si no es solo espacios en blanco. ---
      let k = pos.i;
      while (k < n && texto.charCodeAt(k) !== ASCII_LT) k++;
      if (!esBlanco(texto, pos.i, k)) {
        const nodo: NodoTexto = {
          tipo: "texto", texto: resolverEntidades(texto, pos.i, k),
          linea: pos.linea, colU16: pos.colU16, padre: pila.length ? pila[pila.length - 1] : null,
        };
        if (pila.length) pila[pila.length - 1].hijos.push(nodo);
        else doc.hijos.push(nodo);
      }
      avanzar(texto, pos.i, k, pos);
      pos.i = k;
      continue;
    }

    const sig = pos.i + 1 < n ? texto.charCodeAt(pos.i + 1) : -1;

    // --- <?...?> ---
    if (sig === ASCII_QUESTION) {
      const fin = texto.indexOf("?>", pos.i + 2);
      const hasta = fin < 0 ? n : fin;
      avanzar(texto, pos.i, hasta, pos);
      pos.i = Math.min(hasta + 2, n);
      continue;
    }

    // --- <!--...--> ---
    if (sig === ASCII_BANG && texto.startsWith("<!--", pos.i)) {
      const fin = texto.indexOf("-->", pos.i + 4);
      const hasta = fin < 0 ? n : fin;
      avanzar(texto, pos.i, hasta, pos);
      pos.i = Math.min(hasta + 3, n);
      continue;
    }

    // --- <!DOCTYPE ...> y <![CDATA[...]]> ---
    if (sig === ASCII_BANG) {
      if (texto.startsWith("<![CDATA[", pos.i)) {
        const fin = texto.indexOf("]]>", pos.i + 9);
        const hasta = fin < 0 ? n : fin;
        avanzar(texto, pos.i, hasta, pos);
        pos.i = Math.min(hasta + 3, n);
        continue;
      }
      let k = pos.i + 9;
      let nivel = 0;
      while (k < n) {
        const x = texto.charCodeAt(k);
        if (x === ASCII_LBRACKET) nivel++;
        else if (x === ASCII_RBRACKET) nivel--;
        else if (x === ASCII_GT && nivel <= 0) break;
        k++;
      }
      const etiqueta = texto.slice(pos.i, Math.min(pos.i + 9, n));
      if (etiqueta.toUpperCase().startsWith("<!DOCTYPE") &&
        texto.slice(pos.i, k).toUpperCase().includes("<!ENTITY")) {
        avisa("DTD interno con ENTITY no admitido: se ignora para evitar expansion recursiva.",
          iniLinea, iniCol);
      }
      avanzar(texto, pos.i, k, pos);
      pos.i = Math.min(k + 1, n);
      continue;
    }

    // --- </...> ---
    if (sig === ASCII_SLASH) {
      let j = pos.i + 2;
      while (j < n && esNombre(texto.charCodeAt(j))) j++;
      if (j === pos.i + 2) { avanzar(texto, pos.i, pos.i + 1, pos); pos.i++; continue; }
      const nombre = texto.slice(pos.i + 2, j);
      let k = j;
      while (k < n && texto.charCodeAt(k) !== ASCII_GT) k++;
      if (k >= n) { avisa("Cierre de etiqueta sin '>'.", iniLinea, iniCol); break; }

      if (profundidad > 0) {
        // VoiceXML cierra la cadena <if>/<elseif>/<else> con una sola </if>:
        // se desapilan los elseif/else abiertos y el if original.
        if (nombre === "if") {
          while (profundidad > 0 &&
                 (abiertos[profundidad - 1] === "elseif" || abiertos[profundidad - 1] === "else")) {
            pila.pop();
            abiertos.pop();
            profundidad--;
          }
          if (profundidad > 0 && abiertos[profundidad - 1] === "if") {
            pila.pop();
            abiertos.pop();
            profundidad--;
          } else if (profundidad > 0) {
            avisa(`Esperaba </${abiertos[profundidad - 1]}> pero encontre </if>.`, iniLinea, iniCol);
            pila.pop();
            abiertos.pop();
            profundidad--;
          }
        } else {
          const abierto = abiertos[profundidad - 1];
          if (abierto !== nombre) {
            avisa(`Esperaba </${abierto}> pero encontre </${nombre}>.`, iniLinea, iniCol);
          }
          pila.pop();
          abiertos.pop();
          profundidad--;
        }
      } else {
        avisa(`Cierre </${nombre}> sin etiqueta abierta.`, iniLinea, iniCol);
      }
      avanzar(texto, pos.i, k + 1, pos);
      pos.i = k + 1;
      continue;
    }

    // --- '<' que no abre nada: es texto literal ---
    if (sig < 0 || !esNombre(sig)) {
      avanzar(texto, pos.i, pos.i + 1, pos);
      pos.i++;
      continue;
    }

    // --- Elemento normal ---
    let j = pos.i + 1;
    let hash = 0x811c9dc5 | 0;
    while (j < n) {
      const x = texto.charCodeAt(j);
      if (!esNombre(x)) break;
      hash = Math.imul(hash ^ x, 0x01000193);
      j++;
    }
    const nombre = texto.slice(pos.i + 1, j);
    hash = hash >>> 0;

    const atributos = new Map<string, string>();
    let nAtributosRaw = 0;
    let autoCerrado = false;
    let k = j;

    for (;;) {
      while (k < n && esEspacio(texto.charCodeAt(k))) k++;
      if (k >= n) { avisa("Etiqueta sin cerrar.", iniLinea, iniCol); break; }
      const x = texto.charCodeAt(k);
      if (x === ASCII_GT) { k++; break; }
      if (x === ASCII_SLASH) {
        if (k + 1 < n && texto.charCodeAt(k + 1) === ASCII_GT) { autoCerrado = true; k += 2; break; }
        k++;
        continue;
      }
      if (!esNombre(x)) { k++; continue; }

      // Nombre del atributo y su hash.
      const aIni = k;
      let ah = 0x811c9dc5 | 0;
      while (k < n) {
        const y = texto.charCodeAt(k);
        if (!esNombre(y)) break;
        ah = Math.imul(ah ^ y, 0x01000193);
        k++;
      }
      ah = ah >>> 0;
      const aNombre = texto.slice(aIni, k);
      void ah;

      // Espacios hasta '='.
      let q = k;
      while (q < n && esEspacio(texto.charCodeAt(q))) q++;
      if (q >= n || texto.charCodeAt(q) !== ASCII_EQ) continue; // atributo sin valor
      q++;
      while (q < n && esEspacio(texto.charCodeAt(q))) q++;
      if (q >= n) { avisa("Atributo sin valor.", iniLinea, iniCol); break; }

      // Valor.
      const qc = texto.charCodeAt(q);
      let vIni: number, vFin: number;
      if (qc === ASCII_QUOT || qc === ASCII_APOS) {
        vIni = q + 1;
        const cierre = texto.indexOf(qc === ASCII_QUOT ? '"' : "'", vIni);
        vFin = cierre < 0 ? n : cierre;
        k = cierre < 0 ? n : cierre + 1;
      } else {
        // XML exige comillas; sin ellas se toma hasta blanco o '>'.
        vIni = q;
        let w = q;
        while (w < n && !esEspacio(texto.charCodeAt(w)) && texto.charCodeAt(w) !== ASCII_GT) w++;
        vFin = w;
        k = w;
      }

      atributos.set(aNombre, resolverEntidades(texto, vIni, vFin));
      nAtributosRaw++;
    }

    const nodo: NodoElemento = {
      tipo: "elemento", nombre, hash, linea: iniLinea, colU16: iniCol, orden: orden++,
      autocerrado: autoCerrado, atributos, nAtributos: nAtributosRaw, hijos: [],
      padre: pila.length ? pila[pila.length - 1] : null,
    };
    if (pila.length) pila[pila.length - 1].hijos.push(nodo);
    else doc.hijos.push(nodo);

    if (!autoCerrado) { pila.push(nodo); abiertos[profundidad++] = nombre; }
    avanzar(texto, pos.i, k, pos);
    pos.i = k;
  }

  if (profundidad > 0) {
    avisa(`Quedan ${profundidad} etiqueta(s) sin cerrar: ${abiertos.slice(0, profundidad).join(", ")}.`,
      pos.linea, pos.colU16);
  }
  return { doc, notas };
}