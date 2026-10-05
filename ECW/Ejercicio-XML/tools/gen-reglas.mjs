/**
 * gen-reglas.mjs
 * ---------------------------------------------------------------------------
 * Genera packages/impl-wasm/src/reglas_gen.rs a partir de packages/core/
 * reglas.json (la FUENTE UNICA DE VERDAD del catalogo de reglas).
 *
 * La implementacion de WebAssembly no puede importar el JSON ni el modulo JS
 * compartido, asi que se la embebe el mismo catalogo como constantes Rust.
 * Regenerar con `npm run gen:reglas` tras editar reglas.json.
 * ---------------------------------------------------------------------------
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const aqui = dirname(fileURLToPath(import.meta.url));
const catalog = JSON.parse(readFileSync(join(aqui, "..", "packages", "core", "reglas.json"), "utf8"));

/** Escapa una cadena como literal Rust. */
function escRust(s) {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t");
}

const lineas = [];
lineas.push("// =====================================================================");
lineas.push("// reglas_gen.rs -- GENERADO por tools/gen-reglas.mjs a partir de reglas.json.");
lineas.push("// NO EDITAR A MANO: cualquier cambio se pierde al regenerar.");
lineas.push(`// Fuente: ${escRust(catalog.version)} -- ${catalog.reglas.length} reglas.`);
lineas.push("// =====================================================================");
lineas.push("");
lineas.push(`pub const NUM_REGLAS: usize = ${catalog.reglas.length};`);
lineas.push("");
lineas.push("#[derive(Clone, Copy)]");
lineas.push("pub struct Regla {");
lineas.push("  pub id: &'static str,");
lineas.push("  pub gravedad: &'static str,");
lineas.push("  pub mensaje: &'static str,");
lineas.push("}");
lineas.push("");
lineas.push("pub const REGLAS: [Regla; NUM_REGLAS] = [");
for (const r of catalog.reglas) {
  lineas.push(`  Regla { id: "${escRust(r.id)}",`);
  lineas.push(`         gravedad: "${escRust(r.gravedad)}", mensaje: "${escRust(r.mensaje)}" },`);
}
lineas.push("];");
lineas.push("");
lineas.push("/// Busca una regla por su NOMBRE (el identificador interno que usa el motor).");
lineas.push("/// El nombre solo hace falta para buscar, asi que no se guarda en Regla.");
lineas.push("pub fn regla_por_nombre(nombre: &str) -> Option<&'static Regla> {");
lineas.push("  match nombre {");
for (const r of catalog.reglas) {
  lineas.push(`    "${escRust(r.nombre)}" => Some(&REGLAS[${catalog.reglas.indexOf(r)}]),`);
}
lineas.push("    _ => None,");
lineas.push("  }");
lineas.push("}");
lineas.push("");

const destino = join(aqui, "..", "packages", "impl-wasm", "src", "reglas_gen.rs");
writeFileSync(destino, lineas.join("\n"), "utf8");
console.log(`reglas_gen.rs escrito (${catalog.reglas.length} reglas) en ${destino}`);