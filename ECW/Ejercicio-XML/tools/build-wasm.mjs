/**
 * build-wasm.mjs
 * ---------------------------------------------------------------------------
 * Compila la implementacion de WebAssembly con cargo (target
 * wasm32-unknown-unknown) y copia el .wasm a packages/impl-wasm/lib/.
 *
 * Requiere el toolchain de Rust con el target wasm32-unknown-unknown
 * instalado (`rustup target add wasm32-unknown-unknown`).
 *
 * Uso:  npm run build:wasm
 * ---------------------------------------------------------------------------
 */
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const aqui = dirname(fileURLToPath(import.meta.url));
const raiz = join(aqui, "..");
const dirWasm = join(raiz, "packages", "impl-wasm");

// En Windows cargo no esta en el PATH por defecto de la shell de Node.
const cargoBin = join(process.env.USERPROFILE || "", ".cargo", "bin");
process.env.PATH = cargoBin + ";" + (process.env.PATH || "");

execFileSync("cargo", ["build", "--release", "--target", "wasm32-unknown-unknown"], {
  cwd: dirWasm,
  stdio: "inherit",
});

const origen = join(dirWasm, "target", "wasm32-unknown-unknown", "release", "vxml_doctor.wasm");
const destino = join(dirWasm, "lib");
mkdirSync(destino, { recursive: true });
copyFileSync(origen, join(destino, "vxml_doctor.wasm"));
console.log("WASM copiado a " + join(destino, "vxml_doctor.wasm"));