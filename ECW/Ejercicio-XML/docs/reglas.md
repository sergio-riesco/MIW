# Catálogo de reglas — VXML Doctor (VXML001–VXML018)

Las 18 reglas del analizador están definidas en `packages/core/reglas.json`, que es la
**fuente única de verdad**. De ahí se re-exportan a TypeScript en tiempo de ejecución y se
regeneran como constantes Rust (`packages/impl-wasm/src/reglas_gen.rs`) mediante
`tools/gen-reglas.mjs`. Las tres implementaciones aplican exactamente las mismas reglas
con la misma gravedad, mensaje y detalle.

Gravedades: `error` → fallo seguro de ejecución o de usabilidad; `warning` → riesgo de
comportamiento incorrecto; `info` → recomendación de estilo/robustez.

## Tabla resumen

| Regla | Gravedad | Nombre | Resumen |
|---|---|---|---|
| VXML001 | error | goto-a-form-inexistente | Un `<goto>` apunta a un fragmento que no corresponde a ningún `<form>`. |
| VXML002 | warning | form-inaccesible | Un `<form>` no es alcanzable: nadie le hace `goto` y no es el primero. |
| VXML003 | error | ciclo-goto-sin-salida | Ciclo de `goto` sin salida: bucle infinito posible. |
| VXML004 | error | field-sin-prompt | Un `<field>` no tiene `<prompt>` ni atributo `prompt`. |
| VXML005 | warning | field-sin-consumidor | El `<field>` recoge un valor que nadie usa (sin `<filled>`, `next` ni salida). |
| VXML006 | warning | nomatch-sin-reprompt | El manejador `<nomatch>` no hace `reprompt` ni sale. |
| VXML007 | warning | sin-xml-lang | Falta `xml:lang` en el elemento raíz `<vxml>`. |
| VXML008 | error | goto-sin-destino | Un `<goto>` no tiene `href`, `next` ni `event` válidos. |
| VXML009 | error | tipo-field-invalido | El atributo `type` del `<field>` no está en la lista cerrada de la especificación. |
| VXML010 | warning | break-time-invalido | El atributo `time` de `<break>` no es un valor temporal SSML. |
| VXML011 | error | if-sin-cond | Un `<if>`/`<elseif>` no tiene atributo `cond`. |
| VXML012 | error | id-form-duplicado | Dos o más `<form>` declaran el mismo `id`. |
| VXML013 | warning | audio-sin-fuente | Un `<audio>` no indica `src` ni `expr`. |
| VXML014 | info | simbolo-tts-ilegible | El texto de un prompt contiene símbolos que el TTS lee mal. |
| VXML015 | info | identificador-no-declarado | Una expresión ECMAScript referencia un identificador no declarado. |
| VXML016 | info | form-sin-manejador-error | Formulario con campos de voz sin `<nomatch>` ni `<noinput>`. |
| VXML017 | error | goto-a-si-mismo | Un `<goto>` apunta al form que lo contiene: bucle inmediato. |
| VXML018 | warning | sin-version | Falta el atributo `version` en el elemento raíz `<vxml>`. |

## Detalle por regla

### VXML001 — goto-a-form-inexistente  *(error)*
> El fragmento del goto no corresponde a ningún form del documento.

Al ejecutar el `<goto>`, el intérprete busca el form cuyo `id` coincida con el fragmento.
Si no existe, la ejecución falla en tiempo de ejecución. La regla lo detecta en tiempo de
compilación. *(VoiceXML 2.0 §2.3.1, §5.3.9)*

### VXML002 — form-inaccesible  *(warning)*
> Este form no es alcanzable: nadie hace goto a él y no es el primero.

El primer `<form>` del documento se ejecuta al entrar; los demás solo se alcanzan mediante
`<goto>`. Un form sin entradas es código muerto. *(VoiceXML 2.0 §2.1)*

### VXML003 — ciclo-goto-sin-salida  *(error)*
> Ciclo de goto sin salida: es posible quedar atrapado en un bucle infinito.

Se calculan las componentes fuertemente conexas del grafo de navegación entre forms
(Tarjan iterativo) y se marcan las que no contienen ninguna salida (`exit`, `disconnect`,
`return`, `transfer`) ni salto a un form seguro. *(VoiceXML 2.0 §2.1, §5.3.9)*

### VXML004 — field-sin-prompt  *(error)*
> El field no tiene prompt: el usuario nunca oye la pregunta.

Se comprueba el subárbol del `<field>` (contadores de `prompt`) y el atributo `prompt`.
*(VoiceXML 2.0 §2.3.2)*

### VXML005 — field-sin-consumidor  *(warning)*
> El field recoge un valor pero nadie lo consume: no hay filled, next ni salida del form.

El valor capturado no se usa (`<filled>` ausente, sin `next`) y el form no tiene ninguna
salida en su subárbol. *(VoiceXML 2.0 §2.3.2, §5.3.5)*

### VXML006 — nomatch-sin-reprompt  *(warning)*
> El manejador nomatch no hace reprompt ni sale.

El subárbol del `<nomatch>` no contiene `<reprompt>`, `goto` ni salida: tras un fallo de
reconocimiento el diálogo queda bloqueado. *(VoiceXML 2.0 §2.3.2, §5.3.5)*

### VXML007 — sin-xml-lang  *(warning)*
> Falta xml:lang en el elemento raíz vxml: la síntesis de voz elegirá un idioma por defecto.

Se comprueba solo en la **primera** aparición de `<vxml>`. *(VoiceXML 2.0 §3.1, SSML §2.1)*

### VXML008 — goto-sin-destino  *(error)*
> El goto no tiene ningún destino válido: href, next y event están ausentes o vacíos.

`href` y `next` se consideran tras resolver entidades y recortar espacios. *(VoiceXML 2.0 §2.3.1)*

### VXML009 — tipo-field-invalido  *(error)*
> El atributo type del field no es uno de los tipos permitidos por la especificación.

Tipos válidos (lista cerrada): `string, number, boolean, currency, date, digits,
phonenumber, time, telephone`. La comparación es insensible a mayúsculas. *(VoiceXML 2.0 §2.3.2)*

### VXML010 — break-time-invalido  *(warning)*
> El atributo time del break no es un número de segundos ni un valor temporal de SSML.

Formato admitido: número de segundos (`1`, `1.5`) o número con unidad (`500ms`, `2s`, `1m`,
`1h`). *(SSML 1.0 §2.3.3)*

### VXML011 — if-sin-cond  *(error)*
> El elemento if o elseif no tiene atributo cond, que es obligatorio.

Se aplica a `<if>` y `<elseif>`; `<else>` no lleva `cond`. *(VoiceXML 2.0 §5.3.2)*

### VXML012 — id-form-duplicado  *(error)*
> El id de este form está duplicado en el documento.

Con ids duplicados, un `goto` a ese id tiene destino ambiguo. Se marca cada aparición a
partir de la segunda. *(VoiceXML 2.0 §2.1)*

### VXML013 — audio-sin-fuente  *(warning)*
> El elemento audio no indica src ni expr.

Sin fuente, el `<audio>` reproduce su contenido de texto; si no tiene texto útil produce
silencio. *(VoiceXML 2.0 §3.3.2)*

### VXML014 — simbolo-tts-ilegible  *(info)*
> El texto del prompt contiene símbolos que el motor TTS suele leer de forma incorrecta.

Se buscan `& % # $ / @ | + =` en el **texto** de un prompt (ya con entidades resueltas),
incluyendo `audio`, `value`, `s`, `emphasis`, etc. El detalle lista los símbolos hallados.
*(SSML 1.0 §2.1, VoiceXML 2.0 §3.3)*

### VXML015 — identificador-no-declarado  *(info)*
> La expresión referencia un identificador que no está declarado en el documento.

Análisis léxico conservador de las expresiones de `cond`, `expr` y `srcexpr`:

- Declaran variable: `var`, `assign`, `param` (atributo `name`) y `field`, `initial`, `menu`,
  `link`, `record`, `data`, `counter`, `foreach` (por su atributo `name`).
- Se ignoran identificadores tras `.` (propiedades), palabras clave de ECMAScript, los
  integrados de VoiceXML/ECMAScript y las claves de objetos literales.
- Las *shadow variables* (`campo$`) se resuelven contra su base (`campo`).
- Ante un mismo atributo se emite un solo diagnóstico (deduplicación por `linea:col:ident`).

Puede producir falsos positivos ante parámetros externos no declarados; es una decisión
conservadora documentada. *(VoiceXML 2.0 §5.2.2, §5.2.3)*

### VXML016 — form-sin-manejador-error  *(info)*
> El form tiene fields que reconocen voz pero no define nomatch ni noinput.

Se emite solo si el form tiene al menos un campo **y** ninguna rama de manejo de error
(`nomatch`, `noinput` o `catch`). *(VoiceXML 2.0 §2.3.2, §6.2)*

### VXML017 — goto-a-si-mismo  *(error)*
> El goto apunta al form que lo contiene: bucle infinito inmediato.

Salto incondicional al propio form → la llamada no progresa nunca. *(VoiceXML 2.0 §2.3.1)*

### VXML018 — sin-version  *(warning)*
> Falta el atributo version en el elemento raíz vxml.

Solo se comprueba en la primera aparición de `<vxml>`. *(VoiceXML 2.0 §3.1)*