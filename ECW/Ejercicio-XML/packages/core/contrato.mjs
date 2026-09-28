/**
 * contrato.mjs
 * ---------------------------------------------------------------------------
 * CONTRATO COMPARTIDO por las tres implementaciones (JavaScript, TypeScript y
 * WebAssembly/Rust).
 *
 * Aqui viven SOLO las decisiones que las tres implementaciones deben respetar
 * para poder producir informes identicos byte a byte:
 *
 *   1. Clasificacion de nombres de elemento VoiceXML / SSML.
 *   2. Los conjuntos de datos que alimentan las reglas (tipos validos de
 *      <field>, simbolos problematicos para TTS, identificadores integrados).
 *   3. La serializacion canonica del informe JSON.
 *   4. El calculo de columnas (basado en puntos de codigo Unicode, no en
 *      unidades de UTF-16 ni en bytes UTF-8).
 *
 * Deliberadamente NO vive aqui la logica de analisis: cada implementacion
 * resuelve el analisis con su propio lenguaje, que es justamente lo que se
 * quiere medir y comparar.
 * ---------------------------------------------------------------------------
 */

/**
 * Catalogo canonico de reglas (fuente unica de verdad).
 *
 * En Node se lee de packages/core/reglas.json. En el NAVEGADOR no hay sistema
 * de ficheros: la aplicacion web (packages/ui/app.mjs) descarga reglas.json
 * por HTTP y lo inyecta en globalThis.__VXML_CATALOGO ANTES de importar
 * cualquier motor. El contenido es el mismo; solo cambia el canal.
 *
 * Los import de node:fs, node:url y node:path son DINAMICOS y solo se ejecutan
 * en la rama de Node: un navegador nunca los resuelve.
 */
export let CATALOGO;

if (typeof process !== "undefined" && process.versions && process.versions.node) {
  const { readFileSync } = await import("node:fs");
  const { dirname, join } = await import("node:path");
  const { fileURLToPath } = await import("node:url");
  const aqui = dirname(fileURLToPath(import.meta.url));
  CATALOGO = JSON.parse(readFileSync(join(aqui, "reglas.json"), "utf8"));
} else {
  const c = typeof globalThis !== "undefined" && globalThis.__VXML_CATALOGO;
  if (!c) {
    throw new Error(
      "contrato.mjs: en navegador se requiere globalThis.__VXML_CATALOGO " +
        "(cargar packages/core/reglas.json antes de importar los motores)"
    );
  }
  CATALOGO = c;
}

export const VERSION_INFORME = 1;

/** indice rapido id -> indice, usado por la implementacion de WASM */
export const INDICE_REGLA = new Map(CATALOGO.reglas.map((r, i) => [r.id, i]));

/** indice rapido nombre -> indice, para llamar a las reglas por su nombre */
export const INDICE_NOMBRE = new Map(CATALOGO.reglas.map((r, i) => [r.nombre, i]));

/** indice rapido nombre -> gravedad */
export const GRAVEDAD = new Map(CATALOGO.reglas.map((r) => [r.nombre, r.gravedad]));

// ===========================================================================
// 1. CLASIFICACION DE ELEMENTOS
// ===========================================================================

/**
 * Elementos que mantienen el control del flujo y por tanto aparecen en el
 * grafo de navegacion entre forms (VoiceXML 2.0 seccion 2.1).
 */
export const ELEMENTOS_FLUJO = new Set([
  "vxml", "form", "goto", "link", "menu", "record", "initial", "field",
  "block", "transfer", "subdialog", "exit", "disconnect", "return", "choice",
]);

/** Elementos que terminan o transfieren el control de forma definitiva. */
export const ELEMENTOS_SALIDA = new Set(["exit", "disconnect", "return", "transfer"]);

/**
 * Manejadores de evento. Como elementos, son hijos de field/form/initial/link/
 * menu/record/subdialog. Su contenido es contenido ejecutable.
 */
export const MANEJADORES_EVENTO = new Set([
  "filled", "nomatch", "noinput", "error", "help",
]);

/** <catch> es el manejador global; cuelga de vxml, form, block o field. */
export const MANEJADOR_CATCH = "catch";

/**
 * Contenido permitido dentro de <prompt> (VoiceXML 2.0 seccion 3.3.1).
 * El texto de estos elementos es locucion sintetica, y por eso se inspecciona
 * con la regla VXML014.
 */
export const CONTENIDO_PROMPT = new Set([
  "prompt", "audio", "value", "s", "p", "w", "token", "break", "emphasis",
  "mark", "say-as", "prosody", "voice", "sub", "desc", "enumerate", "lang",
  "stress", "phoneme",
]);

/** Elementos cuyo atributo name declara una variable ECMAScript. */
export const DECLARAN_VARIABLE = new Set([
  "var", "assign", "param",
]);

/** Elementos que declaran una variable por su atributo name. */
export const DECLARAN_POR_NAME = new Set([
  "field", "initial", "menu", "link", "record", "data", "counter", "foreach",
]);

/** Elementos cuyo atributo href/next apunta a otro form. */
export const ELEMENTOS_CON_NEXT = new Set([
  "form", "field", "initial", "block", "link", "menu", "subdialog", "record",
  "goto", "data", "script",
]);

// ===========================================================================
// 2. CONJUNTOS DE DATOS DE LAS REGLAS
// ===========================================================================

/** tipos admitidos por el atributo type de <field> (VoiceXML 2.0 2.3.2) */
export const TIPOS_FIELD = new Set(CATALOGO.tiposFieldValidos);

/**
 * Simbolos que un motor TTS suele pronunciar de forma poco intuitiva.
 * Se prueban sobre el TEXTO de un prompt, ya con las entidades XML resueltas
 * (es decir, se busca el caracter real, no la entidad &amp;).
 */
export const SIMBOLOS_TTS = new Set(["&", "%", "#", "$", "/", "@", "|", "+", "="]);

/**
 * Identificadores que el motor VoiceXML expone siempre y que por tanto NUNCA
 * deben marcarse como no declarados (regla VXML015).
 */
export const INTEGRADOS_VOICEXML = new Set([
  //Objetos del motor
  "application", "session", "document", "connection", "phone", "system",
  //Funciones y objetos de ECMAScript que el perfil de VXML permite
  "Math", "String", "Number", "Boolean", "Array", "Object", "Date",
  "parseInt", "parseFloat", "isNaN", "isFinite", "typeof", "void",
  "escape", "unescape", "encodeURI", "decodeURI", "eval", "NaN", "Infinity",
  "undefined", "true", "false", "null",
  //Palabras clave de ECMAScript
  "new", "delete", "in", "instanceof", "this", "function", "return", "var",
  "if", "else", "for", "while", "do", "break", "continue", "switch", "case",
  "default", "try", "catch", "finally", "throw", "with", "class", "const",
  "let", "yield", "await", "async", "import", "export", "extends", "super",
  "static", "get", "set", "of", "enum", "interface", "package", "private",
  "protected", "public", "implements",
  //Propiedades implicitas (shadow variables) que se leen sin haberlas leido
  "application.lastresult$", "length", "arguments", "callee", "caller",
]);

/**
 * Nombres que aparecen en una expresion y que no son identificadores de
 * usuario sino palabras de la sintaxis (se filtran antes de VXML015).
 */
export const PALABRAS_CLAVE_EXPRESION = new Set([
  "var", "new", "delete", "typeof", "void", "instanceof", "in", "this", "true",
  "false", "null", "undefined", "NaN", "Infinity", "if", "else", "return",
  "function", "do", "while", "for", "switch", "case", "default", "break",
  "continue", "with", "try", "catch", "finally", "throw", "class", "const",
  "let", "yield", "await", "async", "import", "export", "extends", "super",
  "static", "get", "set", "of", "enum", "interface", "package", "private",
  "protected", "public", "implements", "typeof",
]);

/** Sufijo de las shadow variables (campo$.markname, etc.) */
export const SUFIJO_SHADOW = "$";

/** Formatos de URL de medios aceptados (VXML 2.0 apendice E) */
export const FORMATOS_AUDIO = new Set([
  "audio/basic", "audio/mpeg", "audio/mp3", "audio/x-mpeg", "audio/x-mpegurl",
  "audio/mpegurl", "audio/ogg", "audio/wav", "audio/x-wav", "audio/vnd.wave",
  "audio/aiff", "audio/x-aiff", "audio/webm", "audio/mp4", "audio/m4a",
  "audio/x-m4a", "audio/amr", "audio/3gpp",
]);

// ===========================================================================
// 3. COLUMNAS: BYTES UTF-8 DESDE EL INICIO DE LA LINEA
// ===========================================================================
// JavaScript indexa cadenas en unidades UTF-16 y Rust (que lee el fichero como
// bytes) indexa en bytes UTF-8. Para que la columna de un diagnostico
// signifique lo mismo en las tres implementaciones se define SIEMPRE como el
// numero de BYTES UTF-8 que hay desde el inicio de la linea hasta la posicion.
// Es la convencion que usan los editores y las herramientas de linea de
// comandos, de modo que ademas coincide con `byte:columna` de `grep`.
//
// En el corpus habitual (ASCII) las tres medidas coinciden y la conversion es
// la identidad. Aun asi se calcula de forma explicita, para que el contrato se
// cumpla tambien con acentos,CJK o emojis.

// ===========================================================================
// 4. SERIALIZACION CANONICA DEL INFORME
// ===========================================================================

/**
 * Escapa una cadena para JSON sin comillas. Subconjunto de las reglas de JSON
 * mas las entidades XML que se expanden para que el informe sea legible
 * (\u00e1 en lugar de "a" acentuada, para no depender de la codificacion de
 * salida de ninguna de las tres implementaciones).
 */
export function escJSON(s) {
  let r = "";
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    switch (c) {
      case 0x22: r += '\\"'; break;
      case 0x5c: r += "\\\\"; break;
      case 0x08: r += "\\b"; break;
      case 0x0c: r += "\\f"; break;
      case 0x0a: r += "\\n"; break;
      case 0x0d: r += "\\r"; break;
      case 0x09: r += "\\t"; break;
      default:
        if (c < 0x20 || c > 0x7e) {
          if (c >= 0xd800 && c <= 0xdbff && i + 1 < s.length) {
            const cp = (c - 0xd800) * 0x400 + (s.charCodeAt(++i) - 0xdc00) + 0x10000;
            r += codigoAUnicode(cp);
          } else {
            r += codigoAUnicode(c);
          }
        } else {
          r += String.fromCharCode(c);
        }
    }
  }
  return r;
}

/** Representacion \\uXXXX en mayusculas, estable entre lenguajes. */
export function codigoAUnicode(cp) {
  const h = cp.toString(16).toUpperCase();
  return "\\u" + "0".repeat(4 - h.length) + h;
}

/** Entero sin signo en decimal. */
function u32(n) {
  return String(n >>> 0);
}

/**
 * Orden canonico de los diagnosticos: por linea, luego columna, luego id de
 * regla y finalmente por el detalle. Determinista en los tres lenguajes.
 */
export function ordenarDiagnosticos(ds) {
  ds.sort((a, b) =>
    a.linea - b.linea ||
    a.columna - b.columna ||
    (a.regla < b.regla ? -1 : a.regla > b.regla ? 1 : 0) ||
    (a.detalle < b.detalle ? -1 : a.detalle > b.detalle ? 1 : 0)
  );
  return ds;
}

/**
 * Serializa el informe. Este es EL formato de salida del ejercicio: las tres
 * implementaciones deben producir exactamente esta cadena.
 *
 * @param {object} m
 * @param {string} m.archivo
 * @param {number} m.bytes
 * @param {number} m.lineas
 * @param {{id:string,linea:number,campos:number,accesible:boolean}[]} m.formularios
 * @param {object[]} m.diagnosticos  ya ordenados con ordenarDiagnosticos
 * @param {{nodos:number,aristas:number,ciclos:number,inalcanzables:string[]}} m.grafo
 * @param {Record<string,number>} m.estadisticas
 * @returns {string}
 */
export function serializarInforme(m) {
  const p = [];
  p.push('{"v":', u32(VERSION_INFORME));
  p.push(',"archivo":"', escJSON(m.archivo), '"');
  p.push(',"bytes":', u32(m.bytes));
  p.push(',"lineas":', u32(m.lineas));
  p.push(',"elementos":', u32(m.elementos));

  p.push(',"formularios":[');
  for (let i = 0; i < m.formularios.length; i++) {
    const f = m.formularios[i];
    if (i) p.push(",");
    p.push('{"id":"', escJSON(f.id), '","linea":', u32(f.linea),
      ',"campos":', u32(f.campos), ',"accesible":', f.accesible ? "true" : "false", "}");
  }
  p.push("]");

  p.push(',"diagnosticos":[');
  for (let i = 0; i < m.diagnosticos.length; i++) {
    const d = m.diagnosticos[i];
    if (i) p.push(",");
    p.push('{"regla":"', d.regla, '","gravedad":"', d.gravedad,
      '","linea":', u32(d.linea), ',"columna":', u32(d.columna),
      ',"elemento":"', escJSON(d.elemento), '"');
    if (d.detalle) p.push(',"detalle":"', escJSON(d.detalle), '"');
    p.push(',"mensaje":"', escJSON(d.mensaje), '"}');
  }
  p.push("]");

  p.push(',"grafo":{"nodos":', u32(m.grafo.nodos),
    ',"aristas":', u32(m.grafo.aristas),
    ',"ciclos":', u32(m.grafo.ciclos),
    ',"inalcanzables":[');
  for (let i = 0; i < m.grafo.inalcanzables.length; i++) {
    if (i) p.push(",");
    p.push('"', escJSON(m.grafo.inalcanzables[i]), '"');
  }
  p.push("]}");

  p.push(',"estadisticas":{');
  const claves = Object.keys(m.estadisticas);
  for (let i = 0; i < claves.length; i++) {
    if (i) p.push(",");
    p.push('"', escJSON(claves[i]), '":', u32(m.estadisticas[claves[i]]));
  }
  p.push("}}");
  return p.join("");
}

/** Resumen de un texto de diagnostico: capitalizacion neutra para la UI. */
export function resumen(mensaje) {
  return mensaje.charAt(0).toUpperCase() + mensaje.slice(1);
}

// ===========================================================================
// 3b. CONVERSION DE COLUMNA UTF-16 -> BYTES UTF-8 (compartida JS + TS)
// ===========================================================================
// JavaScript indexa las cadenas en unidades UTF-16 y Rust lee el fichero como
// bytes. `columnaByte` traduce la columna provisional (unidades UTF-16,
// 1-based) a la columna definitiva del informe: 1 + numero de bytes UTF-8
// desde el inicio de la linea. Para documentos ASCII --el caso normal-- la
// conversion es la identidad y no se recorre nada.

function esAscii(s) {
  for (let i = 0; i < s.length; i++) if (s.charCodeAt(i) > 0x7f) return false;
  return true;
}

/** Desplazamiento UTF-16 del primer caracter de cada linea. */
function iniciosDeLinea(texto) {
  const u16 = [0];
  for (let i = 0; i < texto.length; i++) {
    if (texto.charCodeAt(i) === 10) u16.push(i + 1);
  }
  return u16;
}

/**
 * Devuelve un conversor de columnas para un documento concreto.
 *
 * @param {Uint8Array} bytes   bytes UTF-8 originales del documento
 * @param {string} texto       el mismo documento como string
 */
export function crearColumnas(bytes, texto) {
  const ascii = esAscii(texto);
  let inicios = null;
  return {
    /**
     * @param {number} colU16  columna 1-based en unidades UTF-16
     * @param {number} linea   linea 1-based
     */
    columnaByte(colU16, linea) {
      if (ascii) return colU16;
      if (inicios === null) inicios = iniciosDeLinea(texto);
      const iniU16 = inicios[linea - 1] || 0;
      const fin = iniU16 + colU16 - 1;
      let b = 0;
      for (let i = iniU16; i < fin && i < texto.length; i++) {
        const c = texto.charCodeAt(i);
        if (c < 0x80) b += 1;
        else if (c < 0x800) b += 2;
        else if (c >= 0xd800 && c <= 0xdbff) { b += 4; i++; }
        else b += 3;
      }
      return b + 1;
    },
  };
}
