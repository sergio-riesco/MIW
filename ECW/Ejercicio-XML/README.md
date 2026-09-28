# VXML Doctor

Analizador estático (linter) de **VoiceXML 2.1** implementado **tres veces** — en
JavaScript, TypeScript y WebAssembly (compilado desde Rust) — de forma que las tres
implementaciones emiten **el mismo informe JSON, byte a byte**.

Detecta 18 defectos (VXML001–VXML018) de `error`/`warning`/`info` con base normativa en las
recomendaciones W3C de VoiceXML 2.0/2.1 y SSML 1.0, calcula estadísticas y valida el grafo
de navegación entre formularios (alcanzabilidad, ciclos sin salida, destinos inexistentes).

## Inicio rápido

```powershell
npm install            # dependencias (solo typescript)
npm run build          # catálogo Rust + TS compilado + WASM
npm test               # equivalencia byte a byte (JS vs TS vs WASM) sobre todo el corpus
npm run test:ui        # prueba de extremo a extremo: la UI funciona en Chrome/Edge real
npm run bench          # banco de pruebas (mediana de pasadas, MiB/s)
npm run bench:html     # informe HTML + docs/benchmark.md
npm run serve          # interfaz web -> http://localhost:8080
```

La primera ejecución de `npm test` necesita el corpus grande (gitignored): regenerarlo con

```powershell
npm run corpus
```

o ejecutar el todo incluido: `npm run todo` (corpus + build + test + bench).

> Requisitos: Node ≥ 18 y toolchain Rust 1.98.1 con target `wasm32-unknown-unknown`
> (`rustup target add wasm32-unknown-unknown`).

## Estructura

| Carpeta | Contenido |
|---|---|
| `packages/core/` | **Contrato compartido**: `reglas.json` (fuente única de verdad), serializador canónico, orden de diagnósticos, cálculo de columnas. |
| `packages/impl-js/` | Motor **JavaScript** (referencia): flujo de eventos plano + hashes FNV-1a + contadores. |
| `packages/impl-ts/` | Motor **TypeScript**: árbol de nodos tipado + `switch` exhaustivo, compilado a ESM. |
| `packages/impl-wasm/` | Motor **WebAssembly/Rust**: escáner sobre bytes, eventos SoA, Tarjan iterativo, `reglas_gen.rs` generado. |
| `packages/bench/` | Banco de pruebas y generador de informes (`resultados.json`, `informe.html`). |
| `packages/ui/` | Interfaz web: analiza documentos en los tres motores **dentro del navegador**. |
| `corpus/` | Generador determinista (PRNG mulberry32) y casos manuales; `corpus/grande/` se genera. |
| `tools/` | Compilación WASM, generación de catálogo Rust, test diferencial, servidor de la UI. |
| `docs/` | Propuesta, arquitectura, catálogo de reglas y resultados del banco. |

## Equivalencia garantizada

`tools/test-diferencial.mjs` compara los tres informes **carácter a carácter** sobre los 5
casos manuales y los 66 ficheros del corpus generado (~5,6 MiB, 4531 diagnósticos). El
contrato fija:

- Columna = **1 + bytes UTF-8 desde el inicio de la línea** (coincide con `grep`).
- Diagnósticos ordenados por `(línea, columna, regla, detalle)`.
- Serialización con escape `\uXXXX` en mayúsculas sobre puntos de código reales.

El banco de pruebas además **aborta si los motores divergen** durante el calentamiento:
ningún número se publica sin conformidad previa.

## Documentación

- [`docs/propuesta.md`](docs/propuesta.md) — alcance y decisiones (para acordar con el profesor).
- [`docs/arquitectura.md`](docs/arquitectura.md) — diseño por capas y estrategias por lenguaje.
- [`docs/reglas.md`](docs/reglas.md) — las 18 reglas con norma y explicación.
- [`docs/benchmark.md`](docs/benchmark.md) — resultados del banco de pruebas.

## Interfaz web

`npm run serve` levanta la UI en `http://localhost:8080`: elige un documento del corpus (o
súbelo/pégalo), selecciona motor **JS / TS / WASM** y analiza; o pulsa *«Comparar los tres»*
para ver tiempos y la verificación de identidad en vivo. El WASM se compila y ejecuta
íntegramente en el navegador. Con Chrome o Edge instalado puedes verificarlo de forma
automatizada con `npm run test:ui` (lanza un navegador headless real contra la UI servida).