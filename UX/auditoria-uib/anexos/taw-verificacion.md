# Verificación del análisis de TAW

Notas de trabajo para el Anexo B. TAW online (tawdis.net), WCAG 2.1 nivel AA. El informe detallado llega por correo (.eml).

## Resumen final

Solo dos análisis fueron válidos. El resto devolvió la página de error `502 Bad Gateway` del servidor de la UIB en lugar de la página (comprobado en el «Código fuente» de cada informe), incluso repitiendo con las versiones .cat.

| Página | Recurso analizado | Problemas | Advertencias | No verificados | Válido |
|---|---|---|---|---|---|
| 1. Portada | https://www.uib.cat/ (versión catalana) | 11 | 125 | 17 | Sí |
| 1. Portada | https://www.uib.es/inici | – | – | – | No (502) |
| 2. Listado de grados | https://estudis.uib.es/estudis-de-grau/grau/ | 27 | 144 | 16 | Sí |
| 3. Plan de estudios | .es y .cat | – | – | – | No (502) |
| 4. Ficha de la 21724 | .es y .cat | – | – | – | No (502) |
| 5. Portal de transparencia | – | – | – | – | Bloqueado |

Conclusiones:
- TAW sí detecta como **fallo** algo que WAVE solo dejaba pasar: las 24 imágenes de sellos sin `alt` del listado de grados (WCAG 1.1.1). Usar dos herramientas da resultados distintos y complementarios.
- El resto de problemas son menores (logo enlazado dos veces, encabezados seguidos sin contenido, una lista vacía que es un falso positivo).
- Los «no verificados» coinciden con lo que ya se revisó a mano: fallan 1.4.5 (banner con texto en imagen), 3.1.2 (idioma de las partes) y 4.1.2 (controles sin rol: carrusel, pestañas, botones «OPEN/CLOSE»).
- El bloqueo de TAW es la tercera herramienta online que no puede acceder a la UIB (junto con WAVE online y el validador del W3C).

## Análisis de https://www.uib.es/inici: NO VÁLIDO

TAW devolvió 1 problema, 3 advertencias y 19 no verificados, pero el informe no corresponde a la portada. En la sección «Código fuente» del informe se ve que TAW no recibió la página, sino un error del servidor:

```html
<html><head><title>502 Bad Gateway</title></head>
<body bgcolor="white"><center><h1>502 Bad Gateway</h1></center>
<hr><center>nginx/1.13.8</center></body></html>
```

Por eso el único «problema» es 3.1.1 (la página de error no declara idioma) y las advertencias apuntan a las líneas 1-4. Desde un navegador o con curl la misma URL responde 200 con la portada completa (7.301 líneas, `lang="es-ES"`), así que el fallo está en el acceso de TAW a uib.es. Es la misma limitación que con WAVE online y el validador online del W3C.

## Página 1 – Portada (análisis válido sobre https://www.uib.cat/)

El análisis que sí funcionó se hizo sobre **https://www.uib.cat/**, la misma portada en catalán (`lang="ca-ES"`). Tiene la misma plantilla y estructura que la versión en castellano, así que sus resultados sirven para la portada, aunque los textos estén en catalán.

Resumen TAW: **11 problemas** en 2 criterios · **125 advertencias** en 12 criterios · **17 no verificados** en 17 criterios.

| Principio | Problemas | Advertencias | No verificados |
|---|---|---|---|
| Perceptible | 11 | 57 | 4 |
| Operable | 0 | 56 | 7 |
| Comprensible | 0 | 12 | 5 |
| Robusto | 0 | 0 | 1 |

En el informe detallado los resultados aparecen como «Falla» (problema), «Desconocido» (advertencia) y «Sin revisar» (no verificado).

### Problemas (11) – verificados

| Criterio | Comprobación | Nº | Qué es en realidad | Resultado |
|---|---|---|---|---|
| 1.1.1 Contenido no textual (A) | Enlaces consecutivos de texto e imagen al mismo recurso (H2) | 1 | El logo de la cabecera (`<a id="logoEnterprise">` con la imagen «Logotipus de la Universitat de les Illes Balears») y justo después el enlace de texto «Universitat de les Illes Balears (UIB)», los dos a la portada. Entre ellos hay un tercer enlace del logo para móvil, oculto | Fallo real pero menor: deberían ser un único enlace. Es el mismo «Redundant link» del logo que marca WAVE |
| 1.3.1 Información y relaciones (A) | Dos encabezados del mismo nivel seguidos sin contenido entre ellos (H42) | 10 | 7 en las tarjetas de accesos (h2 «Hola! Guia de benvinguda» → «Cita prèvia» → «Sindicatura de Greuges» → «Cultura a la UIB» → «Campus Digital» → «Portal de transparència» → «Preguntes freqüents» → «Taulers d'anuncis») y 3 en la sección final (h2 «El supercomputador de les Illes Balears: TalaIA» → «Ensenyar i investigar a Eivissa» → «Estudiar a Menorca» → «Quins grups investiguen al nou Complex de Recerca?») | Discutible: cada tarjeta usa un h2 como título y no tiene más texto. No impide el uso, pero quien navega por encabezados encuentra una lista larga de h2 sin contenido; sería más correcto una lista de enlaces |

### Advertencias (125 en 12 criterios) – las más relevantes

| Criterio | Comprobación | Nº | Comentario |
|---|---|---|---|
| 1.1.1 | Imágenes con `alt` vacío | 30 | Son imágenes decorativas de tarjetas y noticias cuyo enlace ya tiene texto. Correcto |
| 1.1.1 | Imágenes que pueden requerir descripción larga | 9 | Logos y fotografías; no transmiten información compleja. No aplica |
| 1.3.2 / 1.4.4 / 2.4.3 | Elementos flotados / medidas absolutas | 7 | No se pudo localizar con certeza (los números de línea de TAW no coinciden con el HTML descargado). En cualquier caso el zoom no rompe la maquetación |
| 1.4.4 | Tamaños de fuente absolutos | 2 | Hay control A-/A/A+ y el zoom funciona. Correcto |
| 2.4.2 Páginas tituladas | Título descriptivo | 1 | El título es «UIB - Universitat de les Illes Balears - Universitat de les Illes Balears»: repite el nombre y no dice que es la portada. Mejorable |
| 2.4.4 Propósito de los enlaces | Mismo texto y destinos diferentes | 8 | Por ejemplo, tres eventos de la agenda con el mismo texto «18-11-2026 - T'ajudam a decidir. Presentació dels estudis de grau» que llevan a páginas distintas (uno por centro). Confuso con lector de pantalla |
| 2.4.6 Encabezados y etiquetas | Contenido adecuado | 30 | Encabezados de tarjetas y noticias; son descriptivos |
| 3.3.x Errores en formularios | – | 2 (×6) | Los dos formularios de la portada (TAW las repite en 6 comprobaciones). Son de búsqueda, sin datos legales ni financieros: no aplica |

### No verificados (17 criterios) – comprobación manual

Comprobados (con evidencia del código, de WAVE o de pruebas anteriores):

| Criterio | Resultado |
|---|---|
| 1.4.3 Contraste | Cumple según WAVE (0 errores de contraste); el texto gris claro de la lista lateral de noticias queda justo |
| 1.4.5 Imágenes de texto | No cumple: el banner «T'ajudam a decidir» es una imagen con texto |
| 2.2.2 Pausar, detener, ocultar | Cumple parcialmente: el carrusel tiene «Reproduir/Pausa» y «Atura», pero los vídeos arrancan solos |
| 2.4.1 Evitar bloques | Cumple: enlace «Salta al contingut principal» |
| 2.4.5 Múltiples vías | Cumple parcialmente: menú y buscador, pero el «Mapa del web» no funciona |
| 2.4.7 Foco visible | Cumple: anillo azul (comprobado en la auditoría) |
| 3.1.2 Idioma de las partes | No cumple (comprobado en la versión en castellano: textos en catalán sin `lang="ca"`) |
| 3.2.3 / 3.2.4 Navegación e identificación consistentes | Cumple: cabecera y menú iguales en las 5 páginas revisadas |
| 4.1.2 Nombre, función, valor | No cumple: Lighthouse marca `aria-hidden-focus` y los controles del carrusel son enlaces con `href=""`; las pestañas del listado de grados no tienen `role="tab"` |

**[COMPROBAR A MANO]** – no probados todavía:

| Criterio | Cómo comprobarlo |
|---|---|
| 1.3.3 Características sensoriales | Buscar instrucciones del tipo «pulsa el botón de la derecha» o «el icono rojo» |
| 1.4.1 Uso del color | Ver si los enlaces del texto se distinguen sin color (subrayado, negrita) |
| 2.1.1 / 2.1.2 Teclado y sin bloqueos | Recorrer la portada solo con Tab / Shift+Tab / Intro: llegar a todo (menús, carrusel, vídeos) sin quedarse atrapado |
| 2.2.1 Tiempo ajustable | Ver si hay algo con límite de tiempo (normalmente no aplica) |
| 2.3.1 Destellos | Ver si algún vídeo o animación parpadea más de 3 veces por segundo |
| 2.4.3 Orden del foco | Con Tab, comprobar que el foco sigue el orden visual |
| 3.2.1 / 3.2.2 Al recibir el foco / al introducir datos | Con Tab y en los desplegables, comprobar que no cambia la página ni se abre nada sin pulsar |

## Página 2 – Listado de grados (https://estudis.uib.es/estudis-de-grau/grau/)

Análisis válido: el «Código fuente» del informe empieza por `<!DOCTYPE html>` y es la página real.

Resumen TAW: **27 problemas** en 2 criterios · **144 advertencias** en 13 criterios · **16 no verificados** en 16 criterios.

| Principio | Problemas | Advertencias | No verificados |
|---|---|---|---|
| Perceptible | 27 | 24 | 4 |
| Operable | 0 | 108 | 6 |
| Comprensible | 0 | 12 | 5 |
| Robusto | 0 | 0 | 1 |

### Problemas (27) – verificados con el código fuente del propio informe

| Criterio | Comprobación | Nº | Qué es en realidad | Resultado |
|---|---|---|---|---|
| 1.1.1 Contenido no textual (A) | Imágenes sin atributo alt (F65) | 24 | Los iconos de sello de las titulaciones: `<img class="uib_img_muesca" src="…Icona_Internacional-Pathway.png" title="International Pathway">` (también English Pathway y Sello EURO-INF), sin `alt`, solo con `title` | **Fallo real.** Es lo mismo que encontré a mano con WAVE: WAVE no lo marcaba como error porque acepta el `title` como nombre, pero TAW sí lo considera un fallo de WCAG 1.1.1 |
| 1.1.1 Contenido no textual (A) | Enlaces consecutivos de texto e imagen al mismo recurso (H2) | 1 | Línea 630: el enlace del logo para móvil (`#logoEnterpriseMobile`) junto al del logo de escritorio, ambos a www.uib.es/es/ | Fallo menor, igual que en la portada |
| 1.3.1 Información y relaciones (A) | Dos encabezados del mismo nivel seguidos sin contenido (H42) | 1 | Línea 4524: h2 «Et pot interessar» seguido directamente de otro h2 (las tarjetas de la sección final) | Fallo menor; además ese h2 está en catalán |
| 1.3.1 Información y relaciones (A) | Presencia de listas vacías | 1 | Línea 4163: la lista del buscador con autocompletado «Nombre del estudio» (`easy-autocomplete`), que está vacía hasta que el usuario escribe | Falso positivo: se rellena con JavaScript al escribir |

### Advertencias (144) – las más relevantes

| Criterio | Comprobación | Nº | Comentario |
|---|---|---|---|
| 2.4.4 Propósito de los enlaces | Mismo texto y destinos diferentes | 60 | La mayor parte son **15 enlaces del menú lateral con el texto «OPEN/CLOSE»** (en inglés) que despliegan secciones distintas: un lector de pantalla oye 15 veces «OPEN/CLOSE» sin saber qué abre. También «Preguntas frecuentes» (4 destinos) y los nombres de facultad (2 destinos cada uno: calendario y ficha) |
| 2.4.6 Encabezados y etiquetas | Contenido adecuado | 41 | Encabezados de ramas y titulaciones; son descriptivos |
| 2.4.1 Evitar bloques | Anidamiento de los encabezados | 1 | Línea 4142: h4 «Nuevos estudios de grado (curs 2026-27)» sin h3 antes; además mezcla castellano y catalán («curs») |
| 1.1.1 | Imágenes con alt vacío | 9 | Imágenes decorativas de tarjetas con texto en el enlace. Correcto |
| 2.4.2 Páginas tituladas | Título descriptivo | 1 | «Estudios de grado - Estudis de la UIB - Universitat de les Illes Balears»: mezcla castellano y catalán |
| 3.3.x Errores en formularios | – | 2 (×6) | Buscador general y buscador de estudios: no aplica |

### No verificados (16 criterios)

Son los mismos criterios manuales que en la portada (la plantilla es la misma). Resultados específicos de esta página:
- 4.1.2 Nombre, función, valor: **no cumple**. Las pestañas «Por rama / Por centro / Por isla» son enlaces `javascript:void();` sin `role="tab"` ni `aria-selected`, y los 15 botones «OPEN/CLOSE» no indican qué despliegan ni si están abiertos.
- 3.1.2 Idioma de las partes: **no cumple** («Estudis de grau», «Et pot interessar», «curs 2026-27» sin `lang="ca"`).
- El resto: ver la lista de la portada.

## Página 3 – Plan de estudios (https://estudis.uib.es/estudis-de-grau/grau/informatica/GIN3-P/plaEstudis.html): NO VÁLIDO (1.er intento)

Mismo caso que uib.es/inici: 1 problema (3.1.1), 3 advertencias y 19 no verificados, pero el «Código fuente» del informe es la página de error `502 Bad Gateway` de nginx/1.13.8, no el plan de estudios. Hay que repetirlo (más tarde o con la versión .cat de la misma URL).

## Página 4 – Ficha de la 21724 (https://estudis.uib.es/estudis-de-grau/grau/informatica/GIN3-P/21724/index.html): NO VÁLIDO (confirmado)

Resumen idéntico al de los análisis fallidos (1 problema en Comprensible, 3 advertencias, 19 no verificados), cuando esta página es la que más alertas tenía en WAVE (54). Confirmado en el «Código fuente» del informe: TAW recibió la página `502 Bad Gateway` de nginx/1.13.8.
