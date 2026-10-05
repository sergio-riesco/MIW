// contrato.mjs
// Lo que comparten las tres implementaciones para que sus informes salgan
// iguales byte a byte: catalogo de reglas, listas de elementos y simbolos,
// orden de los diagnosticos, columnas y serializacion del JSON.
// El analisis en si no esta aqui: cada implementacion hace el suyo.

// Catalogo de reglas (reglas.json). En Node se lee del disco; en el navegador
// la UI lo descarga y lo deja en globalThis.__VXML_CATALOGO antes de importar
// los motores. Los import de node:* son dinamicos para que el navegador no
// intente resolverlos.
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

// id -> posicion en el catalogo
export const INDICE_REGLA = new Map(CATALOGO.reglas.map((r, i) => [r.id, i]));

// nombre -> posicion en el catalogo
export const INDICE_NOMBRE = new Map(CATALOGO.reglas.map((r, i) => [r.nombre, i]));

// nombre -> gravedad
export const GRAVEDAD = new Map(CATALOGO.reglas.map((r) => [r.nombre, r.gravedad]));

// --- Clasificacion de elementos ---

// Elementos que controlan el flujo (VoiceXML 2.0, 2.1).
export const ELEMENTOS_FLUJO = new Set([
  "vxml", "form", "goto", "link", "menu", "record", "initial", "field",
  "block", "transfer", "subdialog", "exit", "disconnect", "return", "choice",
]);

// Elementos que acaban o transfieren la llamada.
export const ELEMENTOS_SALIDA = new Set(["exit", "disconnect", "return", "transfer"]);

// Manejadores de evento (hijos de field, form, initial, link, menu...).
export const MANEJADORES_EVENTO = new Set([
  "filled", "nomatch", "noinput", "error", "help",
]);

// <catch> es el manejador generico.
export const MANEJADOR_CATCH = "catch";

// Lo que puede ir dentro de <prompt> (VoiceXML 2.0, 3.3.1). Su texto lo lee
// el sintetizador, por eso lo revisa VXML014.
export const CONTENIDO_PROMPT = new Set([
  "prompt", "audio", "value", "s", "p", "w", "token", "break", "emphasis",
  "mark", "say-as", "prosody", "voice", "sub", "desc", "enumerate", "lang",
  "stress", "phoneme",
]);

// El name de estos declara una variable.
export const DECLARAN_VARIABLE = new Set([
  "var", "assign", "param",
]);

// Estos tambien declaran variable por su name.
export const DECLARAN_POR_NAME = new Set([
  "field", "initial", "menu", "link", "record", "data", "counter", "foreach",
]);

// Elementos que pueden llevar next/href a otro form.
export const ELEMENTOS_CON_NEXT = new Set([
  "form", "field", "initial", "block", "link", "menu", "subdialog", "record",
  "goto", "data", "script",
]);

// --- Datos que usan las reglas ---

// Valores validos de type en <field> (VoiceXML 2.0, 2.3.2).
export const TIPOS_FIELD = new Set(CATALOGO.tiposFieldValidos);

// Simbolos que el sintetizador suele leer mal. Se buscan en el texto ya con
// las entidades resueltas (el & real, no &amp;).
export const SIMBOLOS_TTS = new Set(["&", "%", "#", "$", "/", "@", "|", "+", "="]);

// Identificadores que siempre existen y que VXML015 no debe marcar.
export const INTEGRADOS_VOICEXML = new Set([
  // objetos del interprete
  "application", "session", "document", "connection", "phone", "system",
  // ECMAScript
  "Math", "String", "Number", "Boolean", "Array", "Object", "Date",
  "parseInt", "parseFloat", "isNaN", "isFinite", "typeof", "void",
  "escape", "unescape", "encodeURI", "decodeURI", "eval", "NaN", "Infinity",
  "undefined", "true", "false", "null",
  // palabras clave
  "new", "delete", "in", "instanceof", "this", "function", "return", "var",
  "if", "else", "for", "while", "do", "break", "continue", "switch", "case",
  "default", "try", "catch", "finally", "throw", "with", "class", "const",
  "let", "yield", "await", "async", "import", "export", "extends", "super",
  "static", "get", "set", "of", "enum", "interface", "package", "private",
  "protected", "public", "implements",
  // variables implicitas
  "application.lastresult$", "length", "arguments", "callee", "caller",
]);

// Palabras de la sintaxis que se descartan antes de mirar VXML015.
export const PALABRAS_CLAVE_EXPRESION = new Set([
  "var", "new", "delete", "typeof", "void", "instanceof", "in", "this", "true",
  "false", "null", "undefined", "NaN", "Infinity", "if", "else", "return",
  "function", "do", "while", "for", "switch", "case", "default", "break",
  "continue", "with", "try", "catch", "finally", "throw", "class", "const",
  "let", "yield", "await", "async", "import", "export", "extends", "super",
  "static", "get", "set", "of", "enum", "interface", "package", "private",
  "protected", "public", "implements", "typeof",
]);

// campo$.markname y similares
export const SUFIJO_SHADOW = "$";

// Tipos de audio aceptados (VoiceXML 2.0, apendice E).
export const FORMATOS_AUDIO = new Set([
  "audio/basic", "audio/mpeg", "audio/mp3", "audio/x-mpeg", "audio/x-mpegurl",
  "audio/mpegurl", "audio/ogg", "audio/wav", "audio/x-wav", "audio/vnd.wave",
  "audio/aiff", "audio/x-aiff", "audio/webm", "audio/mp4", "audio/m4a",
  "audio/x-m4a", "audio/amr", "audio/3gpp",
]);

// --- Serializacion del informe ---

// Escapa para JSON. Lo que no es ASCII sale como \uXXXX, asi el resultado
// no depende de la codificacion de cada lenguaje.
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

// \uXXXX en mayusculas, igual en los tres lenguajes.
export function codigoAUnicode(cp) {
  const h = cp.toString(16).toUpperCase();
  return "\\u" + "0".repeat(4 - h.length) + h;
}

function u32(n) {
  return String(n >>> 0);
}

// Orden: linea, columna, regla y detalle.
export function ordenarDiagnosticos(ds) {
  ds.sort((a, b) =>
    a.linea - b.linea ||
    a.columna - b.columna ||
    (a.regla < b.regla ? -1 : a.regla > b.regla ? 1 : 0) ||
    (a.detalle < b.detalle ? -1 : a.detalle > b.detalle ? 1 : 0)
  );
  return ds;
}

// El JSON del informe, con las claves siempre en este orden. Los
// diagnosticos tienen que llegar ya ordenados.
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

// Primera letra en mayuscula (para la UI).
export function resumen(mensaje) {
  return mensaje.charAt(0).toUpperCase() + mensaje.slice(1);
}

// --- Columnas ---
// La columna del informe es 1 + bytes UTF-8 desde el inicio de la linea (lo
// mismo que da grep). Rust ya cuenta bytes; JS y TS cuentan en UTF-16 y
// convierten aqui. Si el documento es ASCII las dos medidas coinciden.

function esAscii(s) {
  for (let i = 0; i < s.length; i++) if (s.charCodeAt(i) > 0x7f) return false;
  return true;
}

// Posicion (UTF-16) donde empieza cada linea.
function iniciosDeLinea(texto) {
  const u16 = [0];
  for (let i = 0; i < texto.length; i++) {
    if (texto.charCodeAt(i) === 10) u16.push(i + 1);
  }
  return u16;
}

// Conversor de columnas para un documento (sus bytes y su texto).
export function crearColumnas(bytes, texto) {
  const ascii = esAscii(texto);
  let inicios = null;
  return {
    // colU16 y linea empiezan en 1
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
