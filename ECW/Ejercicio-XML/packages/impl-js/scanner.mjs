/**
 * scanner.mjs -- Analizador XML de un solo paso, sin arbol DOM.
 *
 * ESTRATEGIA (JavaScript):
 *   Se trabaja directamente sobre el string con `charCodeAt`, sin construir
 *   ninguna estructura intermedia de XML. El objetivo es NO asignar objetos
 *   por etiqueta: los atributos se acumulan en arrays tipados indices por el
 *   hash FNV-1a del nombre. El segundo paso de `analizar` consulta esos hashes
 *   y solo entonces materializa strings, y solo para los atributos que de
 *   verdad necesita.
 *
 *   Este es el punto fuerte de JavaScript en este problema: recorrer un string
 *   UTF-16 con la tabla de codigos es una operacion JIT-friendly sobre datos
 *   primitivos, y los strings de JavaScript ya viven en UTF-16 en memoria,
 *   mientras que un lenguaje con cadenas UTF-8 tiene que convertirlos.
 *
 * Especificacion XML 1.0 (Fifth Edition) seguida en lo esencial:
 *   - Se ignoran comentarios (<!-- -->), instrucciones de proceso (<? ?>) y
 *     DOCTYPE.
 *   - Las entidades se resuelven al construir el valor del atributo o el texto.
 *   - Un DTD interno con <!ENTITY se rechaza (billion laughs / expansion
 *     recursiva) y se reporta como aviso, no como excepcion.
 *   - No se admiten prefijos de espacio de nombres: VoiceXML esta registrado en
 *     el espacio por defecto http://www.w3.org/2001/vxml y las versiones 2.0 y
 *     2.1 no permiten reasignarlo, de modo que un elemento con prefijo se
 *     reporta como no reconocido, que es lo que hace un motor real.
 *
 * NOTA SOBRE COLUMNAS: el scanner acumula columnas en UNIDADES UTF-16 porque
 * es lo que resulta natural en un string de JavaScript. La columna definitiva
 * que aparece en el informe se calcula despues en bytes UTF-8 (ver
 * `resolverColumnaByte` en vxml-lint.mjs) para que sea comparable con las
 * otras dos implementaciones. Aqui se llama `colU16` para que no se confunda.
 */

const ASCII_LT = 60, ASCII_GT = 62, ASCII_SLASH = 47, ASCII_EQ = 61;
const ASCII_QUOT = 34, ASCII_APOS = 39, ASCII_AMP = 38, ASCII_NL = 10;
const ASCII_CR = 13, ASCII_TAB = 9, ASCII_SPACE = 32, ASCII_HYPHEN = 45;
const ASCII_BANG = 33, ASCII_QUESTION = 63, ASCII_LBRACKET = 91;
const ASCII_RBRACKET = 93, ASCII_COLON = 58, ASCII_HASH = 35;
const ASCII_A = 65, ASCII_Z = 90, ASCII_0 = 48, ASCII_9 = 57;
const ASCII_UNDERSCORE = 95, ASCII_DOT = 46;

/** Tokens */
export const T = { INICIO: 1, AUTO: 2, CIERRE: 3, TEXTO: 4 };

/** Hash FNV-1a de 32 bits sobre los codigos UTF-16 del nombre. */
export function h(s) {
  let x = 0x811c9dc5 | 0;
  for (let i = 0; i < s.length; i++) x = Math.imul(x ^ s.charCodeAt(i), 0x01000193);
  return x >>> 0;
}

/** Hashes de nombres de elemento usados con frecuencia. */
export const EL = {
  vxml: h("vxml"), form: h("form"), field: h("field"), goto: h("goto"),
  prompt: h("prompt"), nomatch: h("nomatch"), noinput: h("noinput"),
  filled: h("filled"), block: h("block"), initial: h("initial"),
};

/** Hashes de nombres de atributo usados con frecuencia. */
export const AT = {
  id: h("id"), href: h("href"), next: h("next"), event: h("event"),
  cond: h("cond"), expr: h("expr"), srcexpr: h("srcexpr"), type: h("type"),
  name: h("name"), time: h("time"), src: h("src"), prompt: h("prompt"),
  count: h("count"), version: h("version"),
};

/**
 * @typedef {Object} Evento
 * @property {number} t
 * @property {string} nombre
 * @property {number} hash
 * @property {number} linea
 * @property {number} colU16
 * @property {number} orden
 * @property {number} ini      offset inicial en UTF-16
 * @property {number} fin      offset final en UTF-16
 * @property {Uint32Array|null} aPos
 * @property {Uint16Array|null} aLen
 * @property {Uint8Array|null}  aQ
 * @property {Uint32Array|null} aH
 * @property {number} n
 */

/**
 * Analiza `texto` en una sola pasada y devuelve la secuencia de eventos.
 *
 * @param {string} texto
 * @param {(msg: string, linea: number, col: number) => void} [alAdvertir]
 * @returns {Evento[]}
 */
export function escanear(texto, alAdvertir) {
  /** @type {Evento[]} */
  const ev = [];
  const n = texto.length;
  const avisa = alAdvertir || NOOP;

  let i = 0;
  let linea = 1;
  let colU16 = 1; // provisional, en unidades UTF-16
  let orden = 0;

  /** @type {string[]} */
  const pila = [];
  let profundidad = 0;

  /** Avanza linea/columna provisional por el tramo [a, b). */
  const avanzar = (a, b) => {
    for (let q = a; q < b; q++) {
      if (texto.charCodeAt(q) === ASCII_NL) { linea++; colU16 = 1; } else { colU16++; }
    }
  };

  while (i < n) {
    const c = texto.charCodeAt(i);

    if (c !== ASCII_LT) {
      // --- Texto. Se agrupa hasta el siguiente '<' y solo se emite si no es
      //     solo espacios en blanco (el XML indentado genera mucho). ---
      let k = i;
      while (k < n && texto.charCodeAt(k) !== ASCII_LT) k++;
      if (!esBlanco(texto, i, k)) {
        ev.push({
          t: T.TEXTO, nombre: "", hash: 0, linea, colU16, orden: orden++,
          ini: i, fin: k, aPos: null, aLen: null, aQ: null, aH: null, n: 0,
        });
      }
      avanzar(i, k);
      i = k;
      continue;
    }

    const sig = i + 1 < n ? texto.charCodeAt(i + 1) : -1;

    // --- <?...?>  (incluye la declaracion <?xml ... ?>) ---
    if (sig === ASCII_QUESTION) {
      const fin = texto.indexOf("?>", i + 2);
      const hasta = fin < 0 ? n : fin;
      avanzar(i, hasta);
      i = Math.min(hasta + 2, n);
      continue;
    }

    // --- <!--...-->  comentario ---
    if (sig === ASCII_BANG && texto.startsWith("<!--", i)) {
      const fin = texto.indexOf("-->", i + 4);
      const hasta = fin < 0 ? n : fin;
      avanzar(i, hasta);
      i = Math.min(hasta + 3, n);
      continue;
    }

    // --- <!DOCTYPE ...>  y  <![CDATA[...]]> ---
    if (sig === ASCII_BANG) {
      if (texto.startsWith("<![CDATA[", i)) {
        const fin = texto.indexOf("]]>", i + 9);
        const hasta = fin < 0 ? n : fin;
        // El contenido CDATA se trata como texto opaco; se ignora para el
        // analisis de prompts porque no es locucion sintetica.
        avanzar(i, hasta);
        i = Math.min(hasta + 3, n);
        continue;
      }
      const etiqueta = texto.slice(i, Math.min(i + 9, n));
      let k = i + 9;
      let nivel = 0;
      while (k < n) {
        const x = texto.charCodeAt(k);
        if (x === ASCII_LBRACKET) nivel++;
        else if (x === ASCII_RBRACKET) nivel--;
        else if (x === ASCII_GT && nivel <= 0) break;
        k++;
      }
      if (etiqueta.toUpperCase().startsWith("<!DOCTYPE") &&
        texto.slice(i, k).toUpperCase().includes("<!ENTITY")) {
        avisa("DTD interno con ENTITY no admitido: se ignora para evitar expansion recursiva.",
          linea, colU16);
      }
      avanzar(i, k);
      i = Math.min(k + 1, n);
      continue;
    }

    // --- </...> ---
    if (sig === ASCII_SLASH) {
      let j = i + 2;
      while (j < n && esNombre(texto.charCodeAt(j))) j++;
      if (j === i + 2) { avanzar(i, j + 1); i = j + 1; continue; }
      const nombre = texto.slice(i + 2, j);
      let k = j;
      while (k < n && texto.charCodeAt(k) !== ASCII_GT) k++;
      if (k >= n) { avisa("Cierre de etiqueta sin '>'.", linea, colU16); break; }
      ev.push({
        t: T.CIERRE, nombre, hash: h(nombre), linea, colU16, orden: orden++,
        ini: i, fin: k + 1, aPos: null, aLen: null, aQ: null, aH: null, n: 0,
      });
      if (profundidad > 0) {
        const abierto = pila[profundidad - 1];
        // VoiceXML cierra la cadena <if>/<elseif>/<else> con una sola etiqueta
        // </if>, y esa etiqueta cierra la CADENA ENTERA:
        //
        //   <if cond="a">A<elseif cond="b"/>B<elseif cond="c">C</if>
        //            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        //
        // Es decir, un unico </if> debe desapilar el <elseif> que quedo
        // abierto Y el <if> original. Un comprobador ingenuo que solo mire el
        // tope de la pila daria aqui un falso positivo de desajuste.
        if (nombre === "if") {
          while (profundidad > 0 &&
                 (pila[profundidad - 1] === "elseif" || pila[profundidad - 1] === "else")) {
            pila.pop();
            profundidad--;
          }
          if (profundidad > 0 && pila[profundidad - 1] === "if") {
            pila.pop();
            profundidad--;
          } else if (profundidad > 0) {
            avisa(`Esperaba </${pila[profundidad - 1]}> pero encontre </if>.`, linea, colU16);
            pila.pop();
            profundidad--;
          }
        } else {
          if (abierto !== nombre) {
            avisa(`Esperaba </${abierto}> pero encontre </${nombre}>.`, linea, colU16);
          }
          pila.pop();
          profundidad--;
        }
      } else {
        avisa(`Cierre </${nombre}> sin etiqueta abierta.`, linea, colU16);
      }
      avanzar(i, k + 1);
      i = k + 1;
      continue;
    }

    // --- '<' que no abre nada: es texto literal ---
    if (sig < 0 || !esNombre(sig)) {
      avanzar(i, i + 1);
      i++;
      continue;
    }

    // --- Elemento normal ---
    const lineaTag = linea, colTag = colU16, offTag = i;
    let j = i + 1;
    let hash = 0x811c9dc5 | 0;
    while (j < n) {
      const x = texto.charCodeAt(j);
      if (!esNombre(x)) break;
      hash = Math.imul(hash ^ x, 0x01000193);
      j++;
    }
    const nombre = texto.slice(i + 1, j);
    // Sin `>>> 0` el hash puede quedar con el bit alto a uno y ser NEGATIVO
    // como entero con signo, con lo que jamas igualaria a las constantes
    // unsigned de h() y los elementos affectedos nunca se reconocerian.
    hash = hash >>> 0;

    let nAt = 0;
    let aPos = null, aLen = null, aQ = null, aH = null;
    let autoCerrado = false;
    let k = j;

    for (;;) {
      while (k < n && esEspacio(texto.charCodeAt(k))) k++;
      if (k >= n) { avisa("Etiqueta sin cerrar.", lineaTag, colTag); break; }
      const x = texto.charCodeAt(k);
      if (x === ASCII_GT) { k++; break; }
      if (x === ASCII_SLASH) {
        if (k + 1 < n && texto.charCodeAt(k + 1) === ASCII_GT) { autoCerrado = true; k += 2; break; }
        k++;
        continue;
      }
      if (!esNombre(x)) { k++; continue; } // caracter inesperado entre atributos

      let ah = 0x811c9dc5 | 0;
      while (k < n) {
        const y = texto.charCodeAt(k);
        if (!esNombre(y)) break;
        ah = Math.imul(ah ^ y, 0x01000193);
        k++;
      }
      ah = ah >>> 0;
      let q = k;
      while (q < n && esEspacio(texto.charCodeAt(q))) q++;
      if (q >= n || texto.charCodeAt(q) !== ASCII_EQ) continue; // atributo sin valor
      q++;
      while (q < n && esEspacio(texto.charCodeAt(q))) q++;
      if (q >= n) { avisa("Atributo sin valor.", lineaTag, colTag); break; }

      const qc = texto.charCodeAt(q);
      let vIni, vFin;
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

      if (aPos === null) {
        aPos = new Uint32Array(8); aLen = new Uint16Array(8);
        aQ = new Uint8Array(8); aH = new Uint32Array(8);
      } else if (nAt === aPos.length) {
        const t = nAt * 2;
        const cP = new Uint32Array(t); cP.set(aPos); aPos = cP;
        const cL = new Uint16Array(t); cL.set(aLen); aLen = cL;
        const cC = new Uint8Array(t); cC.set(aQ); aQ = cC;
        const cH = new Uint32Array(t); cH.set(aH); aH = cH;
      }
      aPos[nAt] = vIni;
      aLen[nAt] = vFin - vIni;
      aQ[nAt] = qc;
      aH[nAt] = ah;
      nAt++;
    }

    ev.push({
      t: autoCerrado ? T.AUTO : T.INICIO, nombre, hash,
      linea: lineaTag, colU16: colTag, orden: orden++,
      ini: offTag, fin: k, aPos, aLen, aQ, aH, n: nAt,
    });

    if (!autoCerrado) { pila[profundidad++] = nombre; }
    avanzar(offTag, k);
    i = k;
  }

  if (profundidad > 0) {
    avisa(`Quedan ${profundidad} etiqueta(s) sin cerrar: ${pila.slice(0, profundidad).join(", ")}.`,
      linea, colU16);
  }
  return ev;
}

function NOOP() {}

/** Caracteres validos en un nombre XML (NameChar, subconjunto ASCII). */
function esNombre(c) {
  return (c >= ASCII_A && c <= ASCII_Z) || (c >= 97 && c <= 122) ||
    (c >= ASCII_0 && c <= ASCII_9) || c === ASCII_UNDERSCORE ||
    c === ASCII_COLON || c === ASCII_DOT || c === ASCII_HYPHEN || c === ASCII_HASH;
}

function esEspacio(c) {
  return c === ASCII_SPACE || c === ASCII_NL || c === ASCII_TAB || c === ASCII_CR;
}

/** True si el tramo [a, b) es solo espacios en blanco. */
function esBlanco(texto, a, b) {
  for (let i = a; i < b; i++) {
    if (!esEspacio(texto.charCodeAt(i))) return false;
  }
  return true;
}

/**
 * Resuelve las entidades XML del trozo [ini, fin) de `texto`.
 * Las entidades no reconocidas (numeric references) se dejan tal cual.
 * @param {string} texto
 * @param {number} ini
 * @param {number} fin
 * @returns {string}
 */
export function resolverEntidades(texto, ini, fin) {
  let hayAmp = false;
  for (let i = ini; i < fin; i++) {
    if (texto.charCodeAt(i) === ASCII_AMP) { hayAmp = true; break; }
  }
  if (!hayAmp) return texto.slice(ini, fin);

  let r = "";
  let ultimo = ini;
  let i = ini;
  while (i < fin) {
    if (texto.charCodeAt(i) !== ASCII_AMP) { i++; continue; }
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
