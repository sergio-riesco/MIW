/**
 * dtd-a-xsd.mjs -- Genera esquema/sitio.xsd a partir de esquema/sitio.dtd.
 *
 * El DTD es la definición de partida del lenguaje; el XML Schema se obtiene
 * de él de forma automática:
 *
 *   <!ELEMENT x (a, b?, c*)>    ->  xs:sequence con minOccurs / maxOccurs
 *   <!ELEMENT x (a | b)>        ->  xs:choice
 *   <!ELEMENT x (#PCDATA)>      ->  texto (xs:simpleContent si tiene atributos)
 *   <!ELEMENT x EMPTY>          ->  tipo complejo solo con atributos
 *   CDATA #REQUIRED / #IMPLIED  ->  use="required" / use="optional"
 *   CDATA "valor"               ->  default="valor"
 *   (a|b) "valor"               ->  xs:restriction con xs:enumeration
 *
 * Un DTD no tiene tipos de datos: todo atributo es texto. El XSD sí, así que
 * al convertir se aplican los tipos de la tabla TIPOS según el nombre del
 * atributo (un año, una URL, un idioma...). Es lo que el XSD aporta frente
 * al DTD.
 *
 * Los atributos xmlns:xsi y xsi:* se declaran en el DTD solo para que los
 * documentos sean válidos también contra él; en XSD son implícitos y se
 * omiten.
 *
 * Uso: node tools/dtd-a-xsd.mjs   (o npm run xsd)
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const RUTA_DTD = join(raiz, "esquema", "sitio.dtd");
const RUTA_XSD = join(raiz, "esquema", "sitio.xsd");

/** Tipo XSD que se da a cada atributo CDATA según su nombre. */
const TIPOS = {
  idioma: "xs:language",
  anio: "xs:gYear",
  foto: "xs:anyURI",
  imagen: "xs:anyURI",
  trailer: "xs:anyURI",
  fragmento: "xs:anyURI",
  enlace: "xs:anyURI",
};

// ----------------------------------------------------------------------------
// Lectura del DTD
// ----------------------------------------------------------------------------

const dtd = readFileSync(RUTA_DTD, "utf8").replace(/<!--[\s\S]*?-->/g, " ");

/** Elementos en orden de aparición: nombre -> modelo de contenido (texto). */
const elementos = new Map();
for (const m of dtd.matchAll(/<!ELEMENT\s+([\w:.-]+)\s+([^>]+)>/g)) {
  elementos.set(m[1], m[2].trim());
}

/** Atributos de cada elemento: nombre -> [{nombre, tipo, valores, uso, defecto}]. */
const atributos = new Map();
for (const m of dtd.matchAll(/<!ATTLIST\s+([\w:.-]+)([^>]*)>/g)) {
  const lista = atributos.get(m[1]) ?? [];
  // nombre  (tipo | (enumeración))  (#REQUIRED | #IMPLIED | #FIXED "v" | "v")
  const re = /([\w:.-]+)\s+(CDATA|ID|IDREF|NMTOKEN|\([^)]*\))\s+(#REQUIRED|#IMPLIED|#FIXED\s+"[^"]*"|"[^"]*")/g;
  for (const a of m[2].matchAll(re)) {
    const [, nombre, tipo, uso] = a;
    lista.push({
      nombre,
      tipo: tipo.startsWith("(") ? "enumeracion" : tipo,
      valores: tipo.startsWith("(") ? tipo.slice(1, -1).split("|").map((v) => v.trim()) : [],
      uso: uso.startsWith('"') ? "defecto" : uso.split(/\s/)[0],
      defecto: uso.includes('"') ? uso.slice(uso.indexOf('"') + 1, -1) : null,
    });
  }
  atributos.set(m[1], lista);
}

// ----------------------------------------------------------------------------
// Modelo de contenido: (a, (b | c)*, d?) -> árbol
// ----------------------------------------------------------------------------

/** Convierte un modelo de contenido del DTD en un árbol de grupos. */
function analizarModelo(texto) {
  const tokens = texto.match(/#PCDATA|[\w:.-]+|[(),|?*+]/g);
  let i = 0;

  function particula() {
    let nodo;
    if (tokens[i] === "(") {
      i++;
      const hijos = [particula()];
      let tipo = "sequence";
      while (tokens[i] === "," || tokens[i] === "|") {
        tipo = tokens[i] === "," ? "sequence" : "choice";
        i++;
        hijos.push(particula());
      }
      if (tokens[i++] !== ")") throw new Error(`Falta ")" en el modelo ${texto}`);
      nodo = { grupo: tipo, hijos };
    } else {
      nodo = { nombre: tokens[i++] };
    }
    const ocurrencia = tokens[i];
    if (ocurrencia === "?" || ocurrencia === "*" || ocurrencia === "+") {
      nodo.ocurrencia = ocurrencia;
      i++;
    }
    return nodo;
  }

  return particula();
}

/** minOccurs y maxOccurs según el sufijo ? * + (sin sufijo: exactamente uno). */
function ocurrencias(nodo) {
  switch (nodo.ocurrencia) {
    case "?": return ' minOccurs="0"';
    case "*": return ' minOccurs="0" maxOccurs="unbounded"';
    case "+": return ' maxOccurs="unbounded"';
    default: return "";
  }
}

// ----------------------------------------------------------------------------
// Escritura del XSD
// ----------------------------------------------------------------------------

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

function grupoXsd(nodo, sangria) {
  if (nodo.nombre) {
    return `${sangria}<xs:element ref="${nodo.nombre}"${ocurrencias(nodo)}/>\n`;
  }
  let s = `${sangria}<xs:${nodo.grupo}${ocurrencias(nodo)}>\n`;
  for (const h of nodo.hijos) s += grupoXsd(h, sangria + "  ");
  return s + `${sangria}</xs:${nodo.grupo}>\n`;
}

function atributosXsd(nombreElemento, sangria) {
  let s = "";
  for (const a of atributos.get(nombreElemento) ?? []) {
    if (a.nombre.startsWith("xmlns") || a.nombre.startsWith("xsi:")) continue;

    const uso =
      a.uso === "#REQUIRED" ? ' use="required"'
      : a.defecto !== null ? ` default="${esc(a.defecto)}"`
      : "";

    if (a.tipo === "enumeracion") {
      s += `${sangria}<xs:attribute name="${a.nombre}"${uso}>\n`;
      s += `${sangria}  <xs:simpleType>\n${sangria}    <xs:restriction base="xs:string">\n`;
      for (const v of a.valores) s += `${sangria}      <xs:enumeration value="${esc(v)}"/>\n`;
      s += `${sangria}    </xs:restriction>\n${sangria}  </xs:simpleType>\n`;
      s += `${sangria}</xs:attribute>\n`;
    } else {
      const tipo = TIPOS[a.nombre] ?? "xs:string";
      s += `${sangria}<xs:attribute name="${a.nombre}" type="${tipo}"${uso}/>\n`;
    }
  }
  return s;
}

function elementoXsd(nombre, modelo) {
  const attrs = atributosXsd(nombre, "      ");
  const sangria = "  ";

  // Solo texto
  if (/^\(\s*#PCDATA\s*\)\*?$/.test(modelo)) {
    if (!attrs) return `${sangria}<xs:element name="${nombre}" type="xs:string"/>\n`;
    return (
      `${sangria}<xs:element name="${nombre}">\n` +
      `${sangria}  <xs:complexType>\n` +
      `${sangria}    <xs:simpleContent>\n` +
      `${sangria}      <xs:extension base="xs:string">\n` +
      atributosXsd(nombre, sangria + "        ") +
      `${sangria}      </xs:extension>\n` +
      `${sangria}    </xs:simpleContent>\n` +
      `${sangria}  </xs:complexType>\n` +
      `${sangria}</xs:element>\n`
    );
  }

  // Vacío: solo atributos
  if (modelo === "EMPTY") {
    return (
      `${sangria}<xs:element name="${nombre}">\n` +
      `${sangria}  <xs:complexType>\n` +
      attrs.replace(/^ {6}/gm, sangria + "    ") +
      `${sangria}  </xs:complexType>\n` +
      `${sangria}</xs:element>\n`
    );
  }

  if (modelo.includes("#PCDATA")) {
    throw new Error(`Contenido mixto no soportado en <${nombre}>: ${modelo}`);
  }

  // Elementos hijos
  let arbol = analizarModelo(modelo);
  if (!arbol.hijos) arbol = { grupo: "sequence", hijos: [arbol] };
  return (
    `${sangria}<xs:element name="${nombre}">\n` +
    `${sangria}  <xs:complexType>\n` +
    grupoXsd(arbol, sangria + "    ") +
    attrs.replace(/^ {6}/gm, sangria + "    ") +
    `${sangria}  </xs:complexType>\n` +
    `${sangria}</xs:element>\n`
  );
}

let xsd = `<?xml version="1.0" encoding="UTF-8"?>
<!--
  sitio.xsd - XML Schema del lenguaje de sitios web personales.

  GENERADO por tools/dtd-a-xsd.mjs a partir de sitio.dtd: no editar a mano.
  Para cambiar el lenguaje, editar sitio.dtd y ejecutar "npm run xsd".
-->
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema" elementFormDefault="qualified">

`;
for (const [nombre, modelo] of elementos) xsd += elementoXsd(nombre, modelo) + "\n";
xsd = xsd.trimEnd() + "\n\n</xs:schema>\n";

writeFileSync(RUTA_XSD, xsd);
console.log(`esquema/sitio.xsd generado: ${elementos.size} elementos desde esquema/sitio.dtd.`);
