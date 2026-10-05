#!/bin/sh
# Requisitos: Rust + wasm-pack, y `npm i -D typescript` en web-personal.
set -e
cd "$(dirname "$0")"
# 1) Rust -> WebAssembly (public/generador/pkg)
wasm-pack build rust --release --target web --out-dir ../../public/generador/pkg --out-name generador_wasm
# 2) TypeScript (+ glue.js) -> public/generador/js
npx tsc -p tsconfig.json
# 3) Página, estilos y ejemplos
mkdir -p ../public/generador/ejemplos
cp web/* ../public/generador/
cp ejemplos/*.xml ../public/generador/ejemplos/
echo "Listo: abre /generador/index.html (npm run dev)"
