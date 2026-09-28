# Arquitectura — VXML Doctor

Tres implementaciones del mismo analizador estático de VoiceXML 2.1 que producen informes
JSON idénticos byte a byte. Este documento explica las decisiones de diseño por capas.

```
                          packages/core/contrato.mjs  (contrato compartido)
                        ┌──────────────┴───────────────┐
   reglas.json ───────► │ CATALOGO · serializarInforme │      (una sola fuente de verdad)
                        │ ordenarDiagnosticos · columnas│
                        └──────┬───────────────┬────────┘
                               ▼               ▼
                 packages/impl-js         packages/impl-ts         packages/impl-wasm
                 (referencia)            (tipado, compilado)      (Rust → wasm32)
```

## 1. El contrato compartido (`packages/core/contrato.mjs`)

Decide **solo** aquello que las tres implementaciones deben respetar para emitir informes
idénticos:

1. **Catálogo de reglas** (`reglas.json`): las 18 reglas con id, nombre, gravedad, mensaje y
   metadatos (norma, explicación). Es la fuente única de verdad.
2. **Conjuntos de datos** que alimentan las reglas: tipos válidos de `field`, símbolos TTS
   problemáticos, identificadores integrados de VoiceXML/ECMAScript, palabras clave de
   expresiones.
3. **Serialización canónica** (`serializarInforme`): orden de claves fijo, escape `\uXXXX`
   en mayúsculas con puntos de código reales, `detalle` omitido si está vacío, números sin
   signo.
4. **Orden de diagnósticos** (`ordenarDiagnosticos`): `(línea, columna, regla, detalle)`.
5. **Cálculo de columnas** (`crearColumnas`): `1 + bytes UTF-8 desde el inicio de línea`.

El contrato carga el catálogo desde `reglas.json` en Node; en el navegador recibe el JSON
inyectado en `globalThis.__VXML_CATALOGO` (Ver §6). El contenido es el mismo.

**JavaScript y TypeScript importan el contrato en tiempo de ejecución.** Rust **no puede**
importar JS: `tools/gen-reglas.mjs` regenera `packages/impl-wasm/src/reglas_gen.rs` con el
catálogo como constantes y los mismos hashes FNV-1a. Así el banco de pruebas mide solo el
análisis: la serialización (compartida por JS/TS) queda fuera de la comparación de Rust.

## 2. El informe canónico

```json
{"v":1,"archivo":"","bytes":N,"lineas":N,"elementos":N,
 "formularios":[{"id":"","linea":N,"campos":N,"accesible":true}],
 "diagnosticos":[{"regla":"VXML001","gravedad":"error","linea":N,"columna":N,
                  "elemento":"goto","detalle":"","mensaje":"…"}],
 "grafo":{"nodos":N,"aristas":N,"ciclos":N,"inalcanzables":[""]},
 "estadisticas":{"elementos":N,"atributos":N,"formularios":N,"campos":N,"prompts":N,
                 "textos":N,"saltos":N,"scripts":N,"bytes":N}}
```

- `detalle` se omite cuando está vacío.
- `estadisticas` en orden fijo (el objeto se serializa por las claves que devuelve cada
  implementación, que coinciden).
- `grafo.inalcanzables` incluye solo ids de forms inaccesibles; por eso también se emite un
  diagnóstico VXML002 por cada uno.

## 3. Estrategias de análisis por implementación

### 3.1 JavaScript (`packages/impl-js`) — referencia

- **Escáner** (`scanner.mjs`): una sola pasada sobre el string con `charCodeAt`, sin árbol
  DOM. Emite un flujo plano de eventos `{t, hash, linea, colU16, nombre, n, aPos, aLen, aH,
  ini, fin}`; los nombres de atributos se acumulan como hashes FNV-1a.
- **Modelo** (`vxml-lint.mjs`): segunda pasada sobre los eventos. Los subárboles se miden con
  **contadores incrementales** (diferencia entre abrir y cerrar el elemento), sin recorrer el
  árbol. Los strings se materializan solo para los atributos que las reglas necesitan.
- **Grafo**: Tarjan iterativo con dos pilas paralelas (nodo, cursor de aristas), restringido
  a los nodos «inseguros» (sin salida), sobre el subgrafo de `form`s.
- **Notas**: el escáner produce `notas` de depuración (p. ej. DTD con entidades `<!ENTITY`).
  No son parte del JSON canónico.

### 3.2 TypeScript (`packages/impl-ts`)

- Mismo contrato y mismas reglas, pero con **tipos estáticos** (`Nodo`, `Informe`,
  `Diagnostico`, `Catalogo`) y un **árbol de nodos** construido por el escáner, recorrido con
  un `switch` exhaustivo tipado.
- Es la instancia «bridge»: demuestra que el mismo algoritmo se puede expresar con tipos sin
  cambiar el resultado. Compilado con `tsc` a ESM en `packages/impl-ts/lib/`.

### 3.3 WebAssembly / Rust (`packages/impl-wasm`)

- **Sin decodificación**: el escáner trabaja sobre los bytes UTF-8 del documento. Las columnas
  se miden en bytes directamente.
- **SoA (Structure of Arrays)**: los eventos se guardan en `Vec` paralelos tipados
  (`t, hash, linea, col, ini, fin, nAtrib, aPos, aLen, aH`); cero objetos por etiqueta.
- **Lazy strings**: el nombre del elemento es un rango de bytes del documento; solo se
  materializa cuando un diagnóstico lo necesita.
- **Tarjan iterativo** sin recursión, con dos pilas paralelas (`nodo`, `cursor`) — port 1:1
  del JS pero tipado.
- **Sin notas ni balance**: como las notas no salen en el JSON, Rust no mantiene esa pila.
- **Catálogo**: `reglas_gen.rs`, generado. Hash FNV-1a byte-a-byte idéntico al `h()` de JS
  (constantes `u32` en hexa).
- **Serializador**: port 1:1 de `serializarInforme` para garantizar la salida idéntica.

## 4. El grafo de navegación

Los `form` son nodos; los `<goto href="#id">` son aristas (resueltos contra el catálogo de
ids). Con eso se calculan:

- **Alcanzabilidad** (VXML002): el form 0 es el de entrada; el resto se alcanza por aristas.
- **Componentes fuertemente conexas** (VXML003): solo sobre los «inseguros» (sin `exit`,
  `disconnect`, `return` ni `transfer`); cada SCC de tamaño > 1 o con auto-bucle es un ciclo
  sin salida. La cadena del detalle es la ruta `id1 -> id2 -> … -> id1`.
- **Self-loops** (VXML017) e **inexistentes** (VXML001).
- `por_id` usa `BTreeMap` en Rust y `Map` en JS/TS (el orden final de los diagnósticos no
  depende de él gracias al orden canónico).

## 5. Columnas: UTF-8 bytes

| Motor | Cómo mide |
|---|---|
| JS/TS | Scanner en unidades UTF-16 → `columnaByte(colU16, linea)` convierte a bytes |
| Rust | `col = pos_token_inicio - inicio_linea + 1` (bytes) |

En ASCII ambas coinciden; el caso 04 (acentos + emoji) ejercita la conversión explícita.

## 6. Despliegue

- **Node**: `wasm.mjs` carga `lib/vxml_doctor.wasm` desde disco con `readFileSync`.
- **Navegador**: `packages/ui/cargador-wasm.mjs` descarga el módulo con `fetch` y la misma
  ABI de dos llamadas. `contrato.mjs` recibe el catálogo inyectado.
- **Servidor** (`tools/serve.mjs`): estático + `/api/corpus` con MIME correctos (`.mjs`,
  `.wasm`, `.vxml`).

## 7. Calidad

- `tools/test-diferencial.mjs`: JS vs TS vs WASM byte a byte, sobre los 5 casos manuales y
  los 66 ficheros del corpus grande (71 ficheros, ~5,6 MiB, 4531 diagnósticos).
- `packages/bench/bench.mjs`: `node --expose-gc`, pasadas rotadas con `gc()` entre ellas,
  mediana de 9 pasadas + primer análisis (JIT frío) + MiB/s. Verifica la conformidad durante
  el calentamiento: no publica números si los informes difieren.
- Iteración de reglas: el catálogo en `reglas.json` es la única fuente; el resto se
  regenera (`npm run gen:reglas`) de forma que **una regla mal descrita se detecta en el
  test diferencial**, no en el código de cada motor.