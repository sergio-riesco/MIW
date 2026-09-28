# Propuesta — VXML Doctor: analizador estático de VoiceXML 2.1

**Asignatura:** ECW · **Máster:** Ingeniería Web (MIW)
**Lenguaje analizado:** VoiceXML 2.1
**Implementaciones:** JavaScript · TypeScript · WebAssembly (compilado desde Rust)
**Repositorio:** `ECW/Ejercicio-XML`

> Este documento describe qué se construye, por qué VoiceXML, cómo se garantiza que las
> tres implementaciones son equivalentes y qué resultados se entregan. Su objetivo es
> fijar el alcance con el profesor antes de cerrar la práctica.

---

## 1. Objetivo

Construir un **analizador estático (linter)** de documentos VoiceXML que detecta 18
defectos de calidad (VXML001–VXML018) clasificados en `error`, `warning` e `info`, y que
produce un informe JSON **canónico** con estadísticas, diagnóstico por diagnóstico, grafo de
navegación entre formularios y métricas globales.

El mismo analizador se implementa **tres veces**, en tres tecnologías distintas:

| Implementación | Carpeta | Estrategia |
|---|---|---|
| JavaScript | `packages/impl-js` | flujo de eventos plano + hashes FNV-1a + contadores incrementales |
| TypeScript | `packages/impl-ts` | árbol de nodos tipado + `switch` exhaustivo, compilado a ESM |
| WebAssembly | `packages/impl-wasm` | Rust compilado a `wasm32-unknown-unknown`, eventos SoA sobre bytes, Tarjan iterativo |

Las tres comparten el **mismo contrato** (`packages/core/contrato.mjs`): catálogo de reglas,
serializador del informe, orden de los diagnósticos y conversión de columnas. Lo que cada
una implementa por libre es **solo el trabajo de análisis**, que es justamente lo que se
quiere comparar.

## 2. Por qué VoiceXML 2.1

- Es un dialecto XML con **norma pública** (W3C Recommendation, VoiceXML 2.0/2.1) que
  permite justificar cada regla con una sección concreta de la especificación.
- Tiene un modelo de ejecución **real**: flujo entre `form`, `goto`, manejadores de evento
  (`nomatch`, `noinput`, `catch`, `filled`), *prompts* SSML y expresiones ECMAScript. Eso da
  reglas con semántica (no solo sintaxis): ciclos sin salida, campos inutilizados, prompts
  ilegibles para el TTS.
- Es **auto-contenido**: un solo fichero `.vxml` basta para demostrar las 18 reglas, sin
  infraestructura externa.
- El corpus generado es **determinista** (PRNG mulberry32), ASCII en su mayoría con un caso
  específico de acentos/emoji para probar el contrato de columnas byte a byte.

## 3. Las 18 reglas (VXML001–VXML018)

| Grupo | Reglas |
|---|---|
| Navegación y flujo | VXML001 goto inexistente · VXML002 form inaccesible · VXML003 ciclo sin salida · VXML017 auto-goto |
| Formularios y campos | VXML004 field sin prompt · VXML005 campo sin consumidor · VXML009 type inválido · VXML016 sin manejador de error |
| Manejo de eventos | VXML006 nomatch sin reprompt |
| Declaración del documento | VXML007 sin xml:lang · VXML018 sin version · VXML012 id duplicado |
| Elementos individuales | VXML008 goto sin destino · VXML010 break-time inválido · VXML011 if sin cond · VXML013 audio sin fuente |
| Voz (SSML/TTS) | VXML014 símbolos ilegibles para el TTS |
| Expresiones | VXML015 identificador no declarado |

El catálogo completo, con norma y explicación, está en [`docs/reglas.md`](reglas.md).

## 4. Contrato de informe y equivalencia byte a byte

Las tres implementaciones deben emitir **exactamente la misma cadena JSON**. El contrato
fija:

- **Columnas**: `columna = 1 + bytes UTF-8 desde el inicio de la línea`. Coincide con
  `byte:columna` de `grep` y con la convención de editores. JavaScript mide en UTF-16 y
  convierte; Rust mide directamente sobre los bytes.
- **Orden de diagnósticos**: `(línea, columna, regla, detalle)` — orden estable y
  determinista en los tres lenguajes.
- **Serialización**: escape `\uXXXX` en mayúsculas, puntos de código reales (los emojis se
  emiten como `\u1F600`), claves en orden fijo, `detalle` omitido si está vacío.
- **Notas internas**: el escáner JS produce «notas» de depuración (p. ej. DTD con
  entidades) que **no forman parte del JSON canónico**, por lo que Rust no las genera.

La verificación es automática: `tools/test-diferencial.mjs` compara byte a byte los tres
informes sobre todo el corpus (71 ficheros, ~5,6 MiB, 4531 diagnósticos) y falla si hay
cualquier diferencia.

## 5. Corpus

Generado con `corpus/generar-corpus.mjs` (PRNG mulberry32 → determinista):

- 5 casos manuales (`caso-01…caso-05`) que cubren reglas específicas, incluyendo acentos y
  emoji en prompts e ids (verificación de columnas no-ASCII).
- 66 documentos generados en `corpus/grande/`: `pequeno` (6 KB), `mediano` (70 KB),
  `grande` (490 KB) y `masivo` (1,1 MB → ~5,6 MB en total).

## 6. Herramientas IA

Se usarán herramientas de IA en **todas** las fases (análisis de la norma, diseño de las
reglas, implementación, depuración, documentación). Todas las afirmaciones de la IA se
comprueban contra el corpus y contra la especificación:

- Todo código generado se valida con pruebas (unitarias Rust y tests diferenciales).
- La equivalencia entre implementaciones se exige **byte a byte**, no «semánticamente».
- La literatura técnica (comportamiento de Tarjan, formato de columnas, etc.) se contrasta
  con fuentes primarias (W3C, RFC 3987, documentación de Rust).

## 7. Entregables

1. Tres implementaciones equivalentes (JS, TS, WASM) — ver `packages/`.
2. Banco de pruebas (`packages/bench`): mediana de pasadas con `gc()`, MiB/s, informe HTML
   y Markdown.
3. Interfaz web (`packages/ui` + `tools/serve.mjs`): analiza cualquier fichero en los tres
   motores **dentro del navegador** y compara sus tiempos e informes.
4. Documentación académica en `docs/`: esta propuesta, arquitectura (arquitectura.md),
   catálogo de reglas (reglas.md) y resultados del banco (benchmark.md).

## 8. Decisiones técnicas relevantes

- **Rust toolchain 1.98.1** con target `wasm32-unknown-unknown`. El WASM se produce
  **exclusivamente con Rust** (`cargo build --release --target wasm32-unknown-unknown`);
  no se usa WABT ni wat2wasm.
- **ABI WASM**: `vxml_analizar(data, len, nombre, lenNombre, out, cap) -> usize` con
  protocolo de dos llamadas, `vxml_alloc`/`vxml_dealloc` y exportación de `memory`.
  Envoltura Node en `packages/impl-wasm/wasm.mjs` y navegador en
  `packages/ui/cargador-wasm.mjs`.
- **Rust no importa el contrato JS**: el catálogo se re-embebe como constantes
  (`reglas_gen.rs`) calculadas con el mismo hash FNV-1a que el JS (`hash_nombre`), de modo
  que el banco mide solo el análisis, no la serialización (que comparten JS y TS).
- **Tarjan iterativo** en las tres implementaciones para no depender del tamaño de pila de
  ninguna VM.
- Los hashes FNV-1a de los nombres se calcularon con el `h()` de JavaScript y se incrustaron
  como constantes `u32` en Rust; todo el corpus es ASCII salvo el caso 04 (byte-based FNV:
  sin divergencias).