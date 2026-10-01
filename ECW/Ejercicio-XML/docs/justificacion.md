# Importancia del lenguaje elegido y utilidad de la aplicación

**Proyecto:** VXML Doctor — analizador estático de VoiceXML 2.1
**Asignatura:** ECW · **Máster:** Ingeniería Web (MIW)
**Lenguaje derivado de XML analizado:** VoiceXML 2.1

---

## 1. Por qué VoiceXML 2.1 es un buen lenguaje derivado de XML para este trabajo

VoiceXML es un dialecto de XML, no un formato cualquiera. Eso convierte un ejercicio de
análisis de documentos en un problema con contenido real, y esa es la razón principal de la
elección.

**1.1 Es un estándar con norma pública y citable (W3C Recommendation 2.0/2.1).**
Cada una de las 18 reglas del analizador se apoya en una sección concreta de la
especificación, no en una convención inventada. Por ejemplo:

| Regla | Base normativa |
|---|---|
| VXML004 `field` sin prompt | VoiceXML 2.0 §2.3.2 |
| VXML009 `type` inválido | VoiceXML 2.0 §2.3.2 (lista cerrada de tipos) |
| VXML010 `break time` inválido | SSML 1.0 §2.3.3 |
| VXML015 identificador no declarado | VoiceXML 2.0 §5.2.2, §5.2.3 |

Un analizador de XML genérico (por ejemplo, validar que las etiquetas estén balanceadas) no
puede apoyarse en nada: el XML no dice qué está bien o mal. VoiceXML sí.

**1.2 Hereda de XML la estructura que hace interesante el análisis léxico.**
El documento tiene jerarquía (`vxml > form > block > field > prompt`), atributos con semántica
(`href`, `next`, `event`, `cond`, `expr`, `type`, `time`), espacios de nombres
(`xmlns="http://www.w3.org/2001/vxml"`, `xml:lang`, `xsi:schemaLocation`) y entidades. Eso
permite escribir un escáner propio sobre los bytes, sin DOM ni biblioteca, y calcular
líneas y columnas midiendo sobre UTF-8. El caso 04 del corpus (acentos y emoji en prompts e
`id`) existe precisamente para poner a prueba ese cálculo de columnas byte a byte.

**1.3 Añade un modelo de ejecución, y por tanto reglas semánticas, no solo sintácticas.**
Este es el argumento de mayor peso. VoiceXML no es un documento de marcado pasivo: el
intérprete recorre los `form`, resuelve los `goto`, dispara los manejadores de evento
(`nomatch`, `noinput`, `catch`, `filled`), sintetiza los prompts con SSML y evalúa las
expresiones ECMAScript de `cond`/`expr`. De ahí salen defectos que no se pueden detectar
mirando la sintaxis:

- **Grafo de navegación.** Los `form` son nodos y los `<goto href="#id">` son aristas. Eso
  permite calcular alcanzabilidad (VXML002, código muerto) y componentes fuertemente conexas
  sobre los forms sin salida, con Tarjan iterativo, para avisar de ciclos infinitos
  (VXML003) y de auto-saltos (VXML017).
- **Análisis de flujo de datos.** Una expresión como `assign name="fecha" expr="dia"` permite
  saber que `dia` está declarado y que `fecha` se consume. De ahí VXML015 (identificador no
  declarado) y VXML005 (campo recogido que nadie usa).
- **Legibilidad para el TTS.** El texto de un prompt acaba en un sintetizador de voz, no en
  una pantalla. Símbolos como `& % # $ / @ | + =` se pronuncian mal; VXML014 los detecta.
- **Robustez de la interacción.** Un `nomatch` sin `reprompt` ni salida bloquea el diálogo
  (VXML006) y un formulario de voz sin manejador de error es frágil (VXML016).

Es decir: la mitad del catálogo de reglas **no existiría** sin el modelo de ejecución
propio de VoiceXML. Un dialecto como MathML o SVG solo daría reglas estructurales.

**1.4 Es un dominio con coste real de los errores.**
El de los IVR, los voicebots, la banca por teléfono, la reserva de líneas o los
agentes de confirmación. Un `goto` a un `form` inexistente, un campo sin `prompt` o un ciclo
sin salida no son marcas de estilo: son llamadas que fallan en producción, con el usuario
escuchando silencio. Eso da valor real a un linter estático, que los detecta **antes** de
desplegar y sin necesidad de un intérprete de voz.

**1.5 Es autocontenido y verificable.**
Cada caso es un único fichero `.vxml`. No hace falta un motor de reconocimiento de voz, un
ASR ni gramáticas externas para demostrar las 18 reglas. Y el corpus se genera de forma
determinista con un PRNG (`mulberry32`), así que cualquier resultado es reproducible.

**1.6 Permite un ejercicio de comparación de lenguajes con verificación objetiva.**
Al ser un lenguaje acotado y con norma, el mismo analizador se puede implementar en
JavaScript, TypeScript y WebAssembly (Rust) y exigir que los tres informes sean **idénticos
byte a byte**. Esa equivalencia no admite matices: si divergen, hay un bug. Con un lenguaje
libre (`html` mal formado) el objetivo no sería verificable.

---

## 2. Utilidad de la aplicación desarrollada

### 2.1 Qué es

VXML Doctor es un **analizador estático (linter)** de documentos VoiceXML 2.1 que emite un
informe JSON canónico con:

- **18 reglas** (VXML001–VXML018) clasificadas en `error`, `warning` e `info`, con mensaje,
  línea, columna, elemento afectado y detalle.
- **Estadísticas** del documento: elementos, atributos, formularios, campos, prompts, textos,
  saltos, scripts y bytes.
- **Tabla de formularios** con su `id`, línea, número de campos y si son alcanzables.
- **Grafo de navegación** con número de nodos, aristas, ciclos detectados y forms
  inalcanzables.

Está disponible en tres motores, en el mismo navegador:

```powershell
npm run serve   # http://localhost:5173
```

Se elige un documento del corpus (o se sube / pega uno), se selecciona motor **JS / TS /
WASM** y se pulsa «Analizar»; o «Comparar los tres» para ver los tiempos de los tres motores
y la **verificación de identidad** del JSON canónico en vivo. El WASM se compila y ejecuta
íntegramente en el navegador.

### 2.2 Utilidad práctica

**Para el desarrollador de la aplicación de voz.** Es la razón de ser. Los errores de
navegación y de flujo solo se manifiestan cuando un usuario concreto recorre un camino
concreto del diálogo. El analizador los detecta en los cinco casos del corpus, sin ejecutar
nada, y con línea y columna exactas. Convierte el «esto no suena» en «falta el `prompt` en
el `field` de la línea 26».

**Como puerta de calidad en integración continua.** El informe es JSON canónico y
determinista, así que sirve como criterio automático: si el número de `error` sube, el
`build` falla. No depende del servidor, no necesita entorno ni credenciales.

**Como linter en el navegador.** Al no depender de Node ni de un servidor de análisis,
funciona en la máquina de quien escribe la aplicación, sobre documentos que no están
publicados. Los tres motores se ejecutan en local: nada sale del equipo.

**Como material didáctico.** El catálogo de reglas (`docs/reglas.md`) documenta, regla por
regla, qué está mal, por qué está mal y en qué apartado de la norma está recogido. Sirve
tanto para aprender VoiceXML como para documentar el criterio del proyecto.

**Como banco de pruebas de herramientas y lenguajes.** Las tres implementaciones
(JS, TS, WASM/Rust) producen el mismo informe, lo que permite comparar estrategias de
análisis con un criterio de corrección objetivo. Resultados medidos sobre 5,58 MiB y 9
pasadas por motor:

| Implementación | Mediana | MiB/s | Respecto a la más rápida |
|---|---:|---:|---:|
| JavaScript (referencia) | 121,4 ms | 46,0 | 2,76× |
| TypeScript | 112,3 ms | 49,7 | 2,55× |
| WebAssembly (Rust) | 44,0 ms | 126,8 | 1,00× |

Cada motor aplica una estrategia distinta — flujo de eventos plano con hashes FNV-1a en JS;
árbol de nodos tipado con `switch` exhaustivo en TS; bytes UTF-8 con eventos SoA y Tarjan
iterativo en Rust — y aun así coinciden carácter a carácter sobre 71 ficheros y 4531
diagnósticos. Esa equivalencia es, en sí misma, la demostración de que la herramienta
funciona: no hay un único «resultado bueno», hay uno verificable.

### 2.3 Lo que aporta frente a las alternativas

- **Frente a un validador de esquema XSD:** XSD comprueba que el documento está bien formado
  y que los elementos existen; no dice si un `goto` apunta a un form que no existe, ni si
  hay un ciclo, ni si un prompt es inteligible por el TTS. Aquí las tres cosas se comprueban.
- **Frente a revisar a mano:** los forms inaccesibles y los ciclos sin salida son
  propiedades estructurales del grafo; a escala de un IVR de producción es imposible
  revisarlos todos.
- **Frente a ejecutar la aplicación con un intérprete real:** no requiere ASR, TTS ni
  gramáticas, funciona sobre documentos incompletos y el resultado es reproducible.

### 2.4 Limitaciones conocidas

- VXML015 es un análisis léxico conservador: puede marcar como error un identificador
  recibido de un parámetro externo no declarado. Está documentado en `docs/reglas.md`.
- La base normativa citada en las reglas es la Recomendación W3C de VoiceXML 2.0 junto con
  SSML 1.0, que es la referencia estable usada al redactar el catálogo; el dialecto
  analizado es VoiceXML 2.1.
- El grafo se construye sobre los `form` del propio documento; no resuelve `goto` a
  documentos externos.
- La tabla de tipos de `field` y el análisis de símbolos TTS son listas cerradas definidas en
  el catálogo, no derivados de la especificación en tiempo de ejecución.

---

## 3. Conclusión

La elección de VoiceXML 2.1 no es un capricho temático: es el lenguaje que reúne las tres
condiciones que el trabajo necesitaba a la vez. Una **norma citable** (para que cada
diagnóstico tenga fundamento), una **estructura XML real** (para que el análisis léxico y el
cálculo de columnas en UTF-8 tengan contenido) y un **modelo de ejecución** (para que existan
reglas semánticas: alcanzabilidad, ciclos, datos sin consumir, manejo de errores y calidad
del texto para el TTS). Además, al ser autocontenido y determinista, permite la verificación
objetiva que da valor al resto de la práctica: tres motores, un mismo informe, byte a byte.

La utilidad de la aplicación es doble. La **práctica**: un linter que detecta 18 tipos de
defecto antes del despliegue y que puede ejecutarse en un navegador, sin infraestructura,
tanto sobre el corpus como sobre el documento que el usuario tenga delante. Y la **técnica**:
el banco de pruebas sobre las tres implementaciones, con el test diferencial como criterio de
corrección y las diferencias de rendimiento medidas con rigor (mediana de 9 pasadas,
`gc()` entre pasadas, verificación de conformidad antes de publicar cualquier número).
