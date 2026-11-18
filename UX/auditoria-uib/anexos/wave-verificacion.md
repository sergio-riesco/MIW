# Verificación manual de las alertas de WAVE

Notas de trabajo para el Anexo B. WAVE se ejecutó con la extensión de Firefox (la versión online no puede acceder a la UIB: timeout / error de acceso). Cada alerta se verificó inspeccionando el DOM de la página.

## Página 1 – Portada (https://www.uib.es/inici)

Resumen WAVE: 0 errores · 0 errores de contraste · 26 alertas · 41 features · 48 structure · 332 ARIA · AIM 9,6

| Alerta | Nº | Qué es en realidad | Resultado |
|---|---|---|---|
| Suspicious alternative text | 7 | Imágenes del carrusel de la agenda (`#sliderBannerAgenda`) con `alt=" "` (un espacio). 6 de las 7 son clones del carrusel. El enlace sí tiene texto (fecha + título del evento). | Fallo menor: deberían llevar `alt=""` |
| A nearby image has the same alternative text | 7 | Las mismas 7 imágenes, consecutivas y con el mismo `alt=" "` | Consecuencia de la anterior |
| Possible heading | 1 | `<p class="peu-uib__titol">Universitat de les Illes Balears</p>` del pie, a 36 px | No es un problema real (decorativo) |
| Redundant link | 2 | 1) Dos enlaces seguidos del logo a www.uib.es/es/ (uno es la versión móvil oculta). 2) «Personal docente e investigador» y «Personal técnico, de gestión…» van ambos a portal.uib.cat | Fallo menor; el segundo confunde |
| Noscript element | 1 | iframe de Google Tag Manager para cuando no hay JavaScript | Sin impacto en accesibilidad; confirma el seguimiento de Analytics (7.8) |
| Accesskey | 2 | `t` → Directorio telefónico; `m` → Mapa del web | Fallo menor: posibles conflictos con atajos; la `m` lleva al mapa que no funciona |
| Very small text | 2 | `span.sr-only` («Correo electrónico», «Buscador, …»): texto solo para lectores de pantalla | Falso positivo (buena práctica) |
| Redundant title text | 4 | `title` igual al texto: Aula digital, Correo electrónico, botón del buscador, Mapa del web | Fallo menor |

Hallazgos manuales que WAVE no detecta:
- Idioma de las partes (WCAG 3.1.2): `<html lang="es-ES">` pero los titulares en catalán no llevan `lang="ca"` (0 elementos con `lang="ca"`). **No cumple.**
- Controles del carrusel en catalán («Anterior / Següent / Atura»), implementados como enlaces con `href=""`.
- El único h1 es «UIB» y está oculto (`sr-only`).

## Página 2 – Listado de grados (https://estudis.uib.es/estudis-de-grau/grau/)

Resumen WAVE: 0 errores · 0 errores de contraste · 15 alertas · 15 features · 43 structure · 410 ARIA · AIM 9,7

| Alerta | Nº | Qué es en realidad | Resultado |
|---|---|---|---|
| Possible heading | 1 | El mismo `<p class="peu-uib__titol">` del pie (36 px) | No es un problema real |
| Redundant link | 2 | Los mismos que en la portada: logo duplicado y PDI/PTGAS a portal.uib.cat (plantilla común) | Fallo menor |
| Noscript element | 1 | iframe de Google Tag Manager | Sin impacto en accesibilidad |
| Accesskey | 3 | `t` Directorio telefónico, `m` Mapa del web y `r` botón «Abre/cierra barra de herramientas» de ReadSpeaker | Fallo menor (conflictos de atajos) |
| Very small text | 2 | Los mismos `span.sr-only` de la cabecera | Falso positivo |
| Redundant title text | 6 | `title` que repite el texto en los controles de la cabecera (Aula digital, Correo, buscador, Mapa del web) y en el reproductor ReadSpeaker («Escuchar», «Abre/cierra barra de herramientas», icono «Escucha el documento» con alt = title). Hay 8 candidatos; WAVE cuenta 6 (no se pudo precisar cuáles 2 excluye) | Fallo menor |

Hallazgos manuales que WAVE no detecta:
- 24 imágenes de sellos (International Pathway, English Pathway, EURO-INF) **sin atributo alt**, solo con `title`. WAVE no lo cuenta como error porque toma el `title` como nombre accesible, pero no es una buena práctica (el `title` no siempre lo leen los lectores de pantalla ni se ve en táctil).
- Pestañas «Por rama / Por centro / Por isla» hechas con enlaces `javascript:void();` sin `role="tab"` ni `aria-selected`: un lector de pantalla no sabe qué pestaña está activa.
- Título visible y h1 en catalán («Estudis de grau»), y el h4 «Nuevos estudios de grado (curs 2026-27)» mezcla los dos idiomas, todo dentro de `lang="es-ES"`.
- Mismo h1 oculto (`sr-only`).

## Página 3 – Plan de estudios del Grado en Ingeniería Informática (https://estudis.uib.es/estudis-de-grau/grau/informatica/GIN3-P/plaEstudis.html)

Resumen WAVE: 0 errores · 0 errores de contraste · 27 alertas · 18 features · 93 structure · 515 ARIA · AIM 9,6

| Alerta | Nº | Qué es en realidad | Resultado |
|---|---|---|---|
| Image with title | 1 | Sello EURO-INF sin atributo `alt`, solo con `title="Sello EURO-INF"` | Fallo menor: debería tener `alt` |
| Skipped heading level | 1 | Tras el h1 «Grado en Ingeniería Informática» viene directamente un h3 «Requisitos para la obtención del título» (se salta el h2) | Fallo menor: rompe la jerarquía para quien navega por encabezados |
| Possible heading | 2 | 1) «240 créditos - Escuela Politécnica Superior», un `span` a 28,8 px que visualmente es un subtítulo. 2) El `<p class="peu-uib__titol">` del pie | El primero sí debería ser encabezado o parte del h1; el segundo no es problema |
| Redundant link | 3 | Logo duplicado, PDI/PTGAS a portal.uib.cat y, en las migas/menú lateral, «Grado en Ingeniería Informática» y «GIN3 Mallorca» seguidos a la misma URL | Fallo menor |
| Noscript element | 1 | iframe de Google Tag Manager | Sin impacto en accesibilidad |
| Accesskey | 3 | `t`, `m` y `r` (igual que en la página 2) | Fallo menor |
| Very small text | 2 | `span.sr-only` de la cabecera | Falso positivo |
| Redundant title text | 14 | Los 6 de la cabecera y ReadSpeaker, más los enlaces del menú lateral (Estudios de grado, Artes y Humanidades, Ciencias, Ciencias de la Salud, Ciencias Sociales y Jurídicas, Ingeniería y Arquitectura), el enlace «Memoria quinta modificación» y el icono «Escucha el documento». Uno está oculto (Mapa del web) | Fallo menor: el lector puede leer dos veces el mismo texto |

Hallazgos manuales que WAVE no detecta:
- **Dos h1** en la página: «Estudis de grau» (oculto y en catalán) y «Grado en Ingeniería Informática».
- Encabezado en catalán en la versión castellana: h2 «Et pot interessar», sin `lang="ca"`.
- Las asignaturas de cada semestre son párrafos con `<br>`, no una lista ni una tabla, y no enlazan a su ficha (hay que ir a otra pestaña, «Año 2026-27»). Las optativas aparecen solo como «Optativas específicas».

## Página 4 – Ficha de la asignatura 21724 (https://estudis.uib.es/estudis-de-grau/grau/informatica/GIN3-P/21724/index.html)

Resumen WAVE: 0 errores · 0 errores de contraste · 54 alertas · 15 features · 188 structure · 544 ARIA · AIM 9,4

| Alerta | Nº | Qué es en realidad | Resultado |
|---|---|---|---|
| Image with title | 1 | Sello EURO-INF sin `alt`, solo con `title` (igual que en la página 3) | Fallo menor |
| Skipped heading level | 1 | Del h1 «21724. Aplicaciones Distribuidas…» se pasa directamente al h3 «Prerrequisitos» | Fallo menor |
| Possible heading | 2 | «240 créditos - Escuela Politécnica Superior» (`span` a 28,8 px) y el título del pie | El primero debería ser encabezado; el segundo no es problema |
| Redundant link | 11 | 3 de la plantilla (logo, portal.uib.cat, «Grado en Ingeniería Informática» / «GIN3 Mallorca») y 8 en la lista de profesorado: el nombre de cada profesor aparece enlazado dos veces seguidas a su perfil (Dra. Ines Ayed 5 veces, Dr. Francisco José Perales 2, Joan Josep Ordóñez 1) | Fallo menor: con lector de pantalla o tabulador se oye/recorre dos veces el mismo enlace |
| Noscript element | 1 | iframe de Google Tag Manager | Sin impacto en accesibilidad |
| Accesskey | 3 | `t`, `m` y `r` | Fallo menor |
| Very small text | 2 | `span.sr-only` de la cabecera | Falso positivo |
| Redundant title text | 8 | Los 6 de cabecera y ReadSpeaker, más «Cronograma del Grupo grande 1» y «Cronograma del Grupo grande 2» | Fallo menor |
| Layout table | 25 | Las tablas que contienen los enlaces a la guía docente por idioma («Castellano», «Català Castellano English»), una por grupo y curso. No tienen `th`; usan el atributo obsoleto `summary` con el texto «Guies docentes para este grupo de asignatura» (mitad catalán, mitad castellano). 24 de las 25 están ocultas (cursos anteriores, desplegables) | Fallo menor: deberían ser una lista de enlaces, no tablas |

Hallazgos manuales que WAVE no detecta:
- **Tres h1** en la página: «Estudis de grau» (oculto, en catalán), «Grado en Ingeniería Informática» y «21724. Aplicaciones Distribuidas…».
- Atributo `summary` (obsoleto en HTML5) con texto en dos idiomas.
- h2 «Et pot interessar» en catalán sin `lang="ca"`.
- La única tabla de datos (créditos, tipo, curso…) usa `th` pero no tiene `caption`.

## Página 5 – Portal de transparencia (https://transparencia.uib.es)

Resumen WAVE: 0 errores · 0 errores de contraste · 15 alertas · 12 features · 35 structure · 255 ARIA · AIM 9,7

| Alerta | Nº | Qué es en realidad | Resultado |
|---|---|---|---|
| Possible heading | 1 | El `<p class="peu-uib__titol">` del pie | No es un problema real |
| Redundant link | 2 | Logo duplicado y PDI/PTGAS a portal.uib.cat | Fallo menor |
| Noscript element | 1 | iframe de Google Tag Manager | Sin impacto en accesibilidad |
| Accesskey | 3 | `t`, `m` y `r` | Fallo menor |
| Very small text | 2 | `span.sr-only` de la cabecera | Falso positivo |
| Redundant title text | 6 | Los 6 de la cabecera y ReadSpeaker (Mapa del web oculto) | Fallo menor |

Hallazgos manuales que WAVE no detecta:
- El h1 es solo «Inicio», que no describe la página (debería ser «Portal de transparencia»).
- Etiqueta mezclada en los indicadores: «Alumnes de grado» (catalán + castellano) sin `lang`.
- Los indicadores son cifras animadas (`js-animated-number`) que cuentan hasta el valor final; no se pudo comprobar si respetan la preferencia de reducir movimiento.
- Es la página más limpia de las cinco: solo tiene las alertas de la plantilla común.

## Comparativa de las páginas

| Página | Errores | Contraste | Alertas | AIM |
|---|---|---|---|---|
| 1. Portada | 0 | 0 | 26 | 9,6 |
| 2. Listado de grados | 0 | 0 | 15 | 9,7 |
| 3. Plan de estudios | 0 | 0 | 27 | 9,6 |
| 4. Ficha de la 21724 | 0 | 0 | 54 | 9,4 |
| 5. Portal de transparencia | 0 | 0 | 15 | 9,7 |
| **Total** | **0** | **0** | **137** | **9,6 (media)** |

Alertas comunes a las 5 páginas (vienen de la plantilla): enlace redundante del logo y de PDI/PTGAS, noscript de GTM, accesskey `t`/`m` (+ `r` de ReadSpeaker fuera de la portada), los 2 `sr-only` como texto pequeño, los `title` redundantes de la cabecera y el título del pie como posible encabezado. En total suman unas 15 alertas por página: todas las de las páginas 2 y 5 y la mayoría de las demás.

Alertas propias de cada página: carrusel de la agenda con `alt=" "` (portada), salto de h1 a h3 y sello EURO-INF con `title` sin `alt` (páginas 3 y 4), nombres de profesores enlazados dos veces y 25 tablas de maquetación (página 4).

## Conclusión

- WAVE no encuentra ningún error ni ningún fallo de contraste en las 5 páginas, y el AIM Score medio es 9,6. A nivel automático la accesibilidad es buena.
- De las 137 alertas verificadas a mano ninguna impide usar el sitio: la mayoría son fallos menores de implementación y unas pocas son falsos positivos (los `sr-only`, el título del pie).
- Casi todas vienen de la plantilla común (cabecera, pie y ReadSpeaker). Corrigiéndolas una vez en la plantilla desaparecerían de todo el sitio.
- Los problemas más importantes son los que WAVE **no** detecta: el idioma de las partes (textos en catalán dentro de páginas `lang="es-ES"` sin `lang="ca"`, WCAG 3.1.2, en las 5 páginas), la estructura de encabezados (h1 ocultos o duplicados, hasta tres h1 en la página 4), imágenes con `title` pero sin `alt` (24 en la página 2) y pestañas sin semántica ARIA (página 2). Por eso no basta con una herramienta automática y hay que revisar a mano.
- WAVE online (wave.webaim.org) no pudo analizar ninguna página: sus servidores no consiguen acceder a la UIB (timeout / error de acceso), igual que el validador online del W3C. Se usó la extensión del navegador, que analiza la página en local.
