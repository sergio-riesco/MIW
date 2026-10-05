// generar-corpus.mjs -- genera el corpus grande para el banco de pruebas.
//
// Lo genero en vez de bajar documentos de internet porque asi siempre sale el
// mismo (misma semilla, mismos ficheros), puedo meter los defectos que quiera
// y no hay problemas de licencias. Por eso uso un PRNG propio (mulberry32) y
// no Math.random.
//
// Uso: node corpus/generar-corpus.mjs [carpetaDestino]

import { mkdirSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const aqui = dirname(fileURLToPath(import.meta.url));
const destino = process.argv[2] || join(aqui, "grande");

// mulberry32
function mulberry32(semilla) {
  let a = semilla >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NOMBRES = [
  "reserva", "facturacion", "cancelacion", "reclamo", "soporte", "domicilio",
  "factura", "reintegro", "alta", "baja", "cambio", "consulta", "urgencia",
  "pedido", "envio", "seguimiento", "opinion", "encuesta", "perfil", "acceso",
];
const CAMPOS = [
  "dni", "telefono", "codigoPostal", "importe", "fecha", "hora", "correo",
  "direccion", "ciudad", "provincia", "referencia", "canal", "motivo", "tipo",
];
const PROMPTS = [
  "Diga su numero de identidad.",
  "Indique el codigo postal.",
  "A que hora prefiere pasar?",
  "Elija una de las opciones.",
  "Confirme los datos, por favor.",
  "Espere un momento, por favor.",
  "Puede repetir la informacion?",
];
const SIMBOLOS = ["&amp;", "20%", "3 &lt; 5", "50/50", "user@example.com", "EUR 12,50"];
const TTS_LIMPIO = [
  "Diga su numero de identidad.",
  "Indique el codigo postal.",
  "Gracias por su llamada.",
  "Le quedan dos intentos.",
];

// --- Generador ---

/**
 * @param {object} cfg
 * @param {number} cfg.semilla
 * @param {number} cfg.forms        numero de forms por documento
 * @param {number} cfg.camposMin
 * @param {number} cfg.camposMax
 * @param {number} cfg.defectos     0..1, probabilidad de inyectar un defecto
 * @param {boolean} cfg.simbolos    incluir simbolos molestos en los prompts
 * @param {boolean} cfg.lang        declarar xml:lang y version
 * @param {number} cfg.listaCiclos  cuantos ciclos de goto sembrar
 */
function generarDocumento(cfg) {
  const rnd = mulberry32(cfg.semilla);
  const entero = (min, max) => min + Math.floor(rnd() * (max - min + 1));
  const defecto = () => rnd() < cfg.defectos;

  const usados = new Set();
  const nombreForm = (base) => {
    let id = `${base}_${entero(100, 999)}`;
    while (usados.has(id)) id = `${base}_${entero(100, 999)}`;
    usados.add(id);
    return id;
  };

  const ids = Array.from({ length: cfg.forms }, (_, i) =>
    nombreForm(NOMBRES[i % NOMBRES.length] + (i >= NOMBRES.length ? Math.floor(i / NOMBRES.length) : "")));

  const L = [];
  L.push('<?xml version="1.0" encoding="UTF-8"?>');
  L.push("<!-- Documento generado por corpus/generar-corpus.mjs. Semilla " + cfg.semilla + " -->");
  L.push('<vxml xmlns="http://www.w3.org/2001/vxml"' + (cfg.lang ? ' version="2.1" xml:lang="es-ES"' : "") + ">");

  let esperado = [];
  for (let f = 0; f < cfg.forms; f++) {
    const id = ids[f];
    const rotulo = `<form id="${id}">`;
    L.push("  " + rotulo);
    L.push("    <block>");
    L.push("      <prompt>");
    if (cfg.simbolos && defecto()) {
      L.push("        " + SIMBOLOS[entero(0, SIMBOLOS.length - 1)] + " " +
        PROMPTS[entero(0, PROMPTS.length - 1)]);
      esperado.push("VXML014");
    } else {
      L.push("        " + TTS_LIMPIO[entero(0, TTS_LIMPIO.length - 1)]);
    }
    L.push("        <break time=\"300ms\"/>");
    L.push("      </prompt>");

    const nCampos = entero(cfg.camposMin, cfg.camposMax);
    for (let c = 0; c < nCampos; c++) {
      const campo = CAMPOS[(f * 3 + c) % CAMPOS.length];
      const tipo = ["string", "number", "boolean", "digits", "date"][entero(0, 4)];
      L.push(`      <field name="${campo}" type="${tipo}">`);

      if (defecto()) {
        // field sin prompt (VXML004)
        L.push(`        <grammar type="application/srgs+xml" src="${campo}.grxml"/>`);
        L.push("        <filled>");
        L.push(`          <goto next="#${ids[Math.min(f + 1, cfg.forms - 1)]}"/>`);
        L.push("        </filled>");
        esperado.push("VXML004");
      } else {
        L.push(`        <grammar type="application/srgs+xml" src="${campo}.grxml"/>`);
        L.push(`        <prompt>${PROMPTS[entero(0, PROMPTS.length - 1)]}</prompt>`);
        L.push("        <filled>");
        L.push(`          <if cond="${campo} != ''">`);
        L.push(`            <audio src="ok_${campo}.wav">Correcto.</audio>`);
        L.push("          </if>");
        L.push(`          <goto next="#${ids[Math.min(f + 1, cfg.forms - 1)]}"/>`);
        L.push("        </filled>");
        if (defecto()) {
          // nomatch sin reprompt ni salida (VXML006)
          L.push("        <nomatch>");
          L.push("          No le he entendido.");
          L.push("        </nomatch>");
          esperado.push("VXML006");
        } else {
          L.push("        <nomatch>");
          L.push("          Repita, por favor.");
          L.push("          <reprompt/>");
          L.push("        </nomatch>");
        }
      }
      L.push("      </field>");
    }

    // saltos: ciclo, destino que no existe o destino bueno
    const claseSalto = rnd();
    if (claseSalto < 0.08) {
      L.push("      <goto next=\"#form_que_no_existe\"/>");
      esperado.push("VXML001");
    } else if (claseSalto < 0.10 + cfg.listaCiclos * 0.05) {
      L.push(`      <goto next="#${id}"/>`);
      esperado.push("VXML017");
    } else if (f + 1 < cfg.forms) {
      L.push(`      <goto next="#${ids[f + 1]}"/>`);
    }

    if (f === cfg.forms - 1 || rnd() < 0.2) {
      L.push("      <exit/>");
    }

    L.push("    </block>");
    L.push("  </form>");
  }

  L.push("</vxml>");
  L.push("");
  return { texto: L.join("\n"), esperado };
}

// --- Plan del corpus ---

// Perfiles: nombre, cuantos documentos y parametros. En total unos 6 MB:
// suficiente para que se note la diferencia sin que el banco tarde minutos.
// Hay menos documentos de los perfiles grandes para que cada perfil pese
// mas o menos lo mismo en el tiempo total.
const PERFILES = [
  { nombre: "pequeno", docs: 40, forms: 6, camposMin: 1, camposMax: 3, semilla: 1001, desc: "Dialogos pequenos, carga tipica de un IVR real." },
  { nombre: "mediano", docs: 20, forms: 40, camposMin: 2, camposMax: 6, semilla: 2002, desc: "Dialogos medianos, el perfil mas cercano a produccion." },
  { nombre: "grande", docs: 4, forms: 200, camposMin: 3, camposMax: 8, semilla: 3003, desc: "Documentos muy grandes, para medir throughput." },
  { nombre: "masivo", docs: 2, forms: 600, camposMin: 2, camposMax: 6, semilla: 4004, desc: "Pocos documentos pero enormes: caso limite de la memoria." },
];

for (const p of PERFILES) {
  p.defectos = 0.15;
  p.simbolos = true;
  p.lang = true;
  p.listaCiclos = 1;
}

if (existsSync(destino)) rmSync(destino, { recursive: true, force: true });
mkdirSync(destino, { recursive: true });

const indice = [];
for (const p of PERFILES) {
  let bytes = 0, esperado = 0;
  for (let i = 0; i < p.docs; i++) {
    const { texto } = generarDocumento({ ...p, semilla: p.semilla + i * 7919 });
    const nombre = `${p.nombre}-${String(i).padStart(3, "0")}.vxml`;
    writeFileSync(join(destino, nombre), texto, "utf8");
    bytes += Buffer.byteLength(texto, "utf8");
  }
  indice.push({ ...p, bytes });
  console.log(
    `${p.nombre.padEnd(9)} ${String(p.docs).padStart(4)} documentos  ` +
    `${String(Math.round(bytes / 1024)).padStart(7)} KiB  ` +
    `~${Math.round(bytes / p.docs)} B/doc  ${p.desc}`
  );
}

writeFileSync(join(destino, "indice.json"), JSON.stringify(indice, null, 2) + "\n", "utf8");
console.log("\nCorpus escrito en " + destino);
console.log("Nota: los ficheros usan solo ASCII a proposito, para que la columna");
console.log("en bytes y la columna en unidades coincidan en las tres");
console.log("implementaciones y el test diferencial no se confunda con eso.");
