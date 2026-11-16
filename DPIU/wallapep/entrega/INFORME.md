# Práctica 1 – Wallapep: aplicación web y pautas de UX

**Autor:** Sergio Riesco Collar

## Contenido de la entrega

| Elemento | Dónde |
|---|---|
| Código fuente React | carpeta `wallapep/` (sin `node_modules` ni `.next`) |
| Backend (modificado) | carpeta `backend-wallapep-main/`, cambios solo en `app/repositories/productRepository.js` y `app/repositories/transactionRepository.js` |
| Base de datos | `entrega/wallapep_database.sql`: borra la BD `products` y la crea con 5 usuarios completos, 23 productos y 5 transacciones |
| Imágenes | `entrega/images/{id}.png`: una foto real por producto (Wikimedia Commons / Flickr, licencias libres, fuentes en `images/CREDITOS.md`). Tras importar el SQL se copian a `backend-wallapep-main/public/images/` |
| Usuario de pruebas | **email:** `prueba@wallapep.com` · **password:** `123456` (los demás usuarios del SQL tienen la misma contraseña) |

**Previo:** se han borrado todos los datos incompletos. El SQL elimina la base de datos y la vuelve a crear con datos completos: todos los usuarios con todos sus campos y todos los productos con descripción, precio, categoría y fecha.

---

## Parte 1. Funcionalidades implementadas

**1. Crear usuario con todos los campos.**
`src/pages/components/user/CreateUserComponent.js`. El formulario incluye todas las columnas de `users`:
- Obligatorios: email (con formato válido) y password (mínimo 3 caracteres). Se marcan con asterisco y el botón queda desactivado mientras falten.
- Opcionales: nombre, apellidos, tipo y número de documento, fecha de nacimiento, país, dirección y código postal.
- La fecha de nacimiento usa un `DatePicker` que no deja elegir días futuros y se guarda como timestamp.
- El país es un `Select` con búsqueda que usa la lista de `src/utils/UtilsCountries.js`.

**2. Categorías de productos.**
- Las 7 categorías están en `src/utils/UtilsCategories.js`. Cada una tiene valor, etiqueta, icono y color, y el fichero incluye funciones auxiliares (`getCategory`, `categoryOptions`).
- `CreateProductComponent.js` obliga a elegir una categoría con un `Select`. También se puede cambiar al editar (`EditProductFormComponent.js`).
- En todas las vistas la categoría se muestra con el componente reutilizable `CategoryTagComponent.js`.

**3. Página principal.**
`src/pages/index.js` y `components/home/HomeComponent.js`:
- Una presentación que explica para qué sirve la aplicación, con accesos directos.
- Las categorías con su icono y el número de productos a la venta.
- Por cada categoría, sus productos más recientes en *cards*, con un enlace "See all" que abre el listado ya filtrado (`/products?category=…`).

**4. Buscador en el listado de productos.**
`components/products/ListProductsComponent.js`:
- Filtros por título, categoría (cada opción indica cuántos productos tiene), precio mínimo, precio máximo y "solo a la venta".
- Los filtros se combinan dentro de un único `products.filter(...)` en el frontend.
- Además permite ordenar por fecha o precio, muestra el número de resultados y tiene un botón para quitar los filtros.

**5. Registrar compras (POST /transactions).**
- La utilidad `buyProduct` de `src/utils/UtilsProducts.js` hace la petición y devuelve los errores.
- Se usa desde el detalle del producto, desde las *cards* del listado y desde el perfil, siempre con un `Popconfirm` y una notificación.
- El backend guarda ahora la fecha de la transacción (`startDate`).

**6. Transacciones propias.**
- `/transactions` (`components/transactions/ListMyTransactionsComponent.js`) es una tabla con ordenación, filtros (compra o venta, categoría), usuarios con avatar, fecha y un resumen de compras y ventas totales y del último mes, gasto e ingresos.
- `/detailTransaction/[id]` (`DetailsTransactionComponent.js`) muestra lo que no cabe en la tabla: descripción, método de pago, dirección de envío y fechas.

**7. Perfiles de usuario.**
`/user/[id]` (`components/user/UserProfileComponent.js`) muestra:
- los datos públicos (`GET /users/:id`);
- un resumen con número de ventas y compras y fecha de la última transacción;
- los productos en venta (`GET /products?sellerId=`, sin los vendidos);
- las ventas y compras (`GET /transactions/public?sellerId=` y `?buyerId=`).

A los perfiles se llega con el componente reutilizable `UserLinkComponent.js` (avatar con inicial y nombre o email) desde las *cards* y el detalle de los productos, la tabla y el detalle de transacciones, la tabla de "My products", el propio perfil y el avatar de la cabecera.

**Cambios en el backend** (solo en los repositorios, como sugiere el enunciado):
- `productRepository.js`: todas las consultas de productos devuelven también `sellerEmail`, `sellerName`, `buyerEmail`, `buyerName` y `sellerSales` (número de ventas del vendedor, que se usa como reputación). Así no hacen falta varias peticiones desde el frontend.
- `transactionRepository.js`: las transacciones (propias y públicas) devuelven los emails y nombres del comprador y del vendedor, el precio y la fecha. Al insertar una transacción se guarda `startDate`.

**Utilidades y componentes reutilizables:**
- Utilidades: `UtilsCategories`, `UtilsCountries`, `UtilsProducts` (comprar y actualizar), `UtilsImages` (comprueba si existe la imagen del producto o usa el *mockup*), `UtilsUser` (id del usuario a partir de la apiKey y resumen de transacciones), `UtilsDates` y `UtilsState`.
- Componentes: `ProductCardComponent`, `CategoryTagComponent`, `UserLinkComponent` y `PageTitleComponent`.

---

## Parte 2. Identificación de tareas

### 2.1 Listado de tareas por vista
Dentro de cada vista, las tareas están ordenadas de más a menos frecuente.

**`/` – Página principal**
1. Ver los productos más recientes a la venta de cada categoría.
2. Entrar en una categoría para ver todos sus productos.
3. Ver cuántos productos hay en cada categoría.
4. Ver el detalle de un producto.
5. Entender para qué sirve la aplicación (usuario nuevo).
6. Registrarse o identificarse.
7. Ir a vender un producto.

**`/products` – Listado de productos**
1. Buscar productos por título.
2. Filtrar los productos de una categoría.
3. Filtrar por un rango de precio (mínimo y máximo).
4. Combinar categoría, título y precio.
5. Ordenar por precio o por los más nuevos.
6. Comparar visualmente los productos (precio, categoría, vendedor y su reputación).
7. Ver el detalle de un producto.
8. Comprar un producto directamente desde su *card*.
9. Ir al perfil del vendedor.
10. Quitar los filtros aplicados.
11. Ver también los productos ya vendidos.

**`/detailProduct/[id]` – Detalle de producto**
1. Ver la información completa (imagen, precio, descripción y categoría).
2. Comprar el producto.
3. Consultar la reputación del vendedor (número de ventas).
4. Ir al perfil del vendedor o del comprador.
5. Volver al listado (*breadcrumb*).

**`/createProduct` – Vender un producto**
1. Introducir título, precio y categoría.
2. Escribir una descripción.
3. Subir una imagen.
4. Publicar el producto.

**`/myProducts` – Mis productos**
1. Ver el resumen (productos, a la venta, vendidos y dinero ganado).
2. Cambiar el precio de un producto directamente en la tabla.
3. Ver qué productos se han vendido y a quién.
4. Ordenar por fecha, precio o título.
5. Filtrar por categoría o estado (a la venta / vendido).
6. Editar un producto completo.
7. Eliminar un producto.
8. Publicar un producto nuevo.

**`/editProduct/[id]` – Editar producto**
1. Cambiar el precio.
2. Cambiar el título o la descripción.
3. Cambiar la categoría.
4. Guardar los cambios.

**`/transactions` – Mis transacciones**
1. Ver el resumen de compras y ventas (totales y del último mes, gastado y ganado).
2. Ver la lista de compras y ventas.
3. Filtrar solo compras o solo ventas, o por categoría.
4. Ordenar por fecha o precio.
5. Ver el detalle de una transacción.
6. Ir al perfil del otro usuario de la transacción.
7. Ir al producto de la transacción.

**`/detailTransaction/[id]` – Detalle de transacción**
1. Consultar el precio pagado y la fecha.
2. Consultar la dirección de envío.
3. Ver comprador y vendedor, e ir a sus perfiles.
4. Ver el producto.

**`/user/[id]` – Perfil de usuario**
1. Ver la reputación del usuario (número de ventas y compras, última transacción).
2. Ver sus productos a la venta.
3. Comprar uno de sus productos.
4. Ver sus ventas y compras.
5. Ver sus datos públicos (email, país, código postal).

**`/register` – Registro**
1. Introducir email y contraseña (obligatorios).
2. Completar datos personales, documento y fecha de nacimiento.
3. Elegir el país escribiendo para filtrar la lista.
4. Introducir dirección y código postal.
5. Crear la cuenta.

**`/login` – Identificación**
1. Introducir email y contraseña e identificarse.
2. Ir a registrarse si no se tiene cuenta.

### 2.2 KLM
El detalle paso a paso está en `entrega/KLM.xlsx` (una hoja por tarea, con fórmulas: si se cambia el tiempo de un operador o un dato de ejemplo, todo se recalcula).

Tiempos estándar de Card, Moran y Newell: K = 0,28 s (mecanógrafo medio), P = 1,10 s, B = 0,10 s, H = 0,40 s, M = 1,35 s y R estimado por paso (0,5 s por carga de página con el servidor local). Las M se colocan antes de cada acción que exige decidir algo (empezar a escribir un dato, elegir una opción, leer una confirmación).

| Tarea | K | P | B | H | M | R | Tiempo |
|---|---|---|---|---|---|---|---|
| 1. Comprar un producto: buscar "switch" en la cabecera → abrir la ficha → Buy now → confirmar | 7 | 4 | 8 | 2 | 5 | 1,3 s | **16,01 s** |
| 1b. La misma compra desde la card del listado (sin abrir la ficha) | 7 | 3 | 6 | 2 | 4 | 0,8 s | **12,86 s** |
| 2. Publicar un producto: foto arrastrando, título "Mountain bike size M", categoría Sports, precio 150 y una descripción de 52 caracteres | 80 | 8 | 14 | 6 | 7 | 1,2 s | **45,65 s** |

- En la compra pesan sobre todo las decisiones (M) y los apuntados; solo se teclea la palabra buscada. Comprar desde la card ahorra 3,15 s (una carga de página, una M y un apuntado).
- En la publicación domina la escritura: la descripción son 55 de las 80 pulsaciones. Por eso la descripción es opcional y el formulario pide solo lo imprescindible. Ayudan las categorías como botones visibles (sin abrir un desplegable), la foto arrastrando, el precio sugerido y que se recuerde la última categoría (en el siguiente producto se ahorra M + P BB).

---

## Parte 3. Cumplimiento de pautas

- **Datos:** el SQL incluye 23 productos de las 7 categorías, con descripciones de distintas longitudes, de 5 vendedores distintos y con 5 transacciones. Cada producto tiene una foto real que corresponde a lo que se vende; las fotos tienen proporciones muy distintas (de 960×540 a 960×1496) y se ajustan enteras sobre un fondo desenfocado de la propia foto, así que ninguna se corta y todas las cards miden lo mismo.
- **Excel de evaluación de pautas:** se rellena aparte, con una columna por cada vista de la parte 2.1.

### Encuesta

**Al crear una cuenta de usuario**
- *¿Es ágil seleccionar el país?* **Sí.** Es un `Select` con `showSearch`: se puede escribir para filtrar la lista o elegir directamente un país.

**Al crear productos**
- *¿Se descuadran los layouts con muy poca o mucha información?* **No.**
  - Las *cards* tienen la imagen a altura fija (`object-fit: cover`), el título en una sola línea y la descripción en dos, recortados con `ellipsis` y *tooltip* con el texto completo.
  - Sin descripción se muestra "No description".
  - El título está limitado a 50 caracteres (el tamaño de la columna) y la descripción a 500, ambos con contador.
  - En el detalle, la descripción larga se recorta y se puede expandir con "more".

**Tablas (mis productos y transacciones)**
- *¿Filtrado y ordenado por los campos relevantes?* **Sí.** Se puede ordenar por título, precio y fecha, y filtrar por categoría, estado (a la venta / vendido) y tipo (compra / venta).
- *¿Propiedad destacada?* **Sí.** El precio va en negrita y en azul. El estado y el tipo se muestran con etiquetas de color y la categoría con icono y color.
- *¿Edición directa de un campo frecuente?* **Sí.** El precio se edita en la propia tabla de "My products" con el botón del lápiz y se guarda con ✓ o con Enter.
- *¿Se adapta a pantallas pequeñas?* **Sí.** Las columnas menos importantes se ocultan con `responsive` y la tabla tiene `scroll.x`.
- *¿Resumen útil?* **Sí.** "My products" muestra productos, a la venta, vendidos y dinero ganado. "Transactions" muestra compras y ventas (totales y del último mes), gastado y ganado.

**Listado de productos (como comprador)**
- *¿Búsqueda o filtrado adecuado?* **Sí.** Título, categoría, precio mínimo y máximo, solo a la venta, y ordenación.
- *¿Número de productos por categoría antes de buscar?* **Sí.** Aparece en cada chip de categoría del listado y en los iconos de categoría de la página principal.
- *¿Eliminar los filtros de forma sencilla?* **Sí.** Cada filtro aplicado aparece como etiqueta con "x" para quitarlo por separado, además de "Clear all" y el botón del estado vacío.
- *¿Siempre se muestra el número de resultados?* **Sí.** "N results".
- *¿Cambia el número de cards por fila según la pantalla?* **Sí.** 2, 3, 4 o 6 por fila (`xs`-`sm`/`md`/`lg`/`xxl`) con `gutter` de 16px.
- *¿Se puede comprar directamente desde el listado?* **Sí.** Con el botón "Buy now" de cada *card*, que aparece al pasar el ratón y pide confirmación.

**Perfil de usuario**
- *¿Resumen rápido de las transacciones?* **Sí.** Muestra número de ventas, compras, productos en venta y fecha de la última transacción.

**Información relevante antes de comprar**
- *¿Hace falta mucha navegación para ver la reputación?* **No.** El número de ventas del vendedor (★ N sales) aparece en cada *card* del listado y en el detalle del producto.

**Referencias a usuarios**
- *¿Avatar junto al nombre?* **Sí.** Todas las referencias usan `UserLinkComponent`: avatar con la inicial, un color fijo por usuario y su nombre o email.

**Validaciones de entrada**
- *¿Precios negativos?* **No.** El precio usa `InputNumber` con `min=0` al crear, al editar, en la tabla y en los filtros. El precio máximo del filtro no puede ser menor que el mínimo.
- *¿Fechas sin sentido?* **No.** El `DatePicker` de nacimiento desactiva las fechas posteriores a hoy.
- Además: el email se valida con formato, el título necesita al menos 5 caracteres, la categoría es obligatoria y la imagen solo admite PNG o JPG de menos de 2MB.

**Imágenes e iconos**
- En las opciones del menú: **sí**, todas tienen icono.
- Delante de los títulos de cada página: **sí** (`PageTitleComponent`, títulos de *cards*).
- Un icono y un color por categoría: **sí** (`UtilsCategories`).
- Iconos junto a valores concretos: **sí** (€ en precios, calendario en fechas, estrella en la reputación, sobre en el email, ubicación en el país).

**Sitio web**
- *¿Se identifica en qué parte de la página estás?* **Sí.** La opción del menú queda resaltada según la URL, cada vista tiene un título con icono y los detalles tienen *breadcrumb*.
- *¿El logo vuelve a la página principal?* **Sí.**
- *¿Favicon y título?* **Sí.** Se definen en `_app.js` con `next/head`.

### Diseño y pautas de las presentaciones aplicadas

Para la **estructura** de las pantallas se ha tomado como referencia **wallapop.com**, porque los usuarios ya conocen ese modelo mental:
- Cabecera blanca y fija con el logo a la izquierda, un gran buscador y el botón "Sell" como acción principal.
- *Cards* con la imagen cuadrada y el precio como dato más destacado.
- Categorías con iconos redondos.
- La ficha del producto con la imagen a la izquierda y, a la derecha, el precio, el botón de comprar y el vendedor.

La **identidad visual** es propia:
- Violeta `#5b3fd9` como color de marca. No se confunde con los colores con significado (verde vendido, azul a la venta, rojo errores) y el texto blanco sobre él tiene un contraste de 6,6:1.
- Neutros ligeramente violáceos.
- Tipografía Plus Jakarta Sans, con precios y títulos en negrita compacta.
- Botones y chips con esquinas redondeadas en lugar de pastillas.
- *Cards* con un borde fino que se elevan con una sombra violeta al pasar el ratón.

El tema de Ant Design se configura una sola vez en `_app.js` (`ConfigProvider`), y los mismos valores están como variables CSS en `globals.css`, así que todos los botones, campos y tablas tienen el mismo estilo (2.2).

| Pauta | Dónde se aplica |
|---|---|
| 1.1 Espacio en blanco | Fondo blanco, márgenes amplios y contenido limitado a 1400px de ancho |
| 1.3 Textos cortos / revelación progresiva | La descripción se recorta con "more", los títulos de las *cards* con *tooltip*, los datos opcionales del registro van plegados y la home enseña 4 productos por categoría con "See all" |
| 1.6 Jerarquía de textos | En la ficha y en las *cards*: precio (grande) > título > propiedades |
| 1.7 / 1.12 / 3.9 / 3.10 Pocas propiedades clave | Cada *card* muestra precio, título, categoría, antigüedad y vendedor con su reputación |
| 1.8 / 1.9 / 1.10 Acción principal destacada | Un solo botón de color de marca por vista (Sell, Buy now, Upload product, Create account) |
| 1.11 Opciones de menú limitadas | La cabecera tiene 3 opciones; perfil, mis transacciones y desconectar van en el menú del avatar |
| 1.13 Acciones sobre un elemento | El botón "Buy now" de la *card* aparece al pasar el ratón; en la tabla, editar y borrar son iconos con *tooltip* |
| 2.1 Layout convencional | Logo arriba a la izquierda, menú arriba y fijo, *breadcrumbs* debajo en las vistas de detalle |
| 2.4 Barra de búsqueda | En la cabecera, con el botón de buscar a la derecha del campo |
| 2.6 Orden de formularios | Login: email, contraseña, botón y enlace de registro. Registro: email y contraseña, y luego nombre, apellidos y país |
| 2.7 Colores con significado | Verde para vendido o completado, azul para a la venta e información, rojo solo para borrar y para errores |
| 3.1 Áreas clicables | Toda la *card* y toda la fila de transacciones son clicables; botones grandes (`size="large"`) |
| 3.3 Iconos | En el menú, en los títulos, en cada categoría (icono y color) y junto a fechas, email y reputación |
| 3.4 Cambios dinámicos | Animación *fade-in* al filtrar o cambiar de página |
| 3.11 Evitar zigzag | Precios alineados a la derecha en las tablas; grid uniforme |
| 3.12 / 3.16 / 3.21 Búsqueda y recuentos | Buscador, chips de categoría con su número de productos, rango de precio, orden y "N results" |
| 3.13 Foco | Las *cards* se elevan con sombra al pasar el ratón |
| 3.15 Scroll excesivo | Paginación de 12 productos en el listado y de 10 en las tablas |
| 3.17 Cero elementos | Estados vacíos con alternativas ("Clear filters", "Include sold products", "Sell your first product") |
| 3.20 Fechas | Tiempo transcurrido ("3 days ago") y fecha completa en *tooltip* (`DateComponent`) |
| 3.23 Dónde estoy | Opción del menú resaltada, título con icono y *breadcrumbs* |
| 3.24 Galerías | Imagen del producto con zoom (`Image` de antd) |
| 3.25 Resúmenes | Estadísticas en "My products", "Transactions" y el perfil |
| 4.2 Información mínima | El registro solo pide email y contraseña; el resto es opcional y va plegado |
| 4.3 / 4.4 Explicaciones cortas | Textos de ayuda breves bajo la foto, la descripción, la dirección y el código postal |
| 4.5 Drag and drop | La foto del producto se sube arrastrándola (`Upload.Dragger`) |
| 4.6 Opciones por defecto | País "Spain" por defecto |
| 4.7 / 4.11 Restringir y dar formato | Precio numérico ≥ 0 con unidad €, código postal solo con números, límite de caracteres con contador, fecha de nacimiento no futura, solo imágenes PNG o JPG |
| 4.8 Pocas opciones sin desplegable | Categorías como botones o chips; tipo de documento como botones |
| 4.9 Sugerencias | Autocompletado de títulos en el buscador y ejemplos en los *placeholders* |
| 4.13 Errores en línea | Mensaje junto al campo erróneo y los campos válidos marcados (`hasFeedback`) |
| 4.14 Edición en línea | Cambio de precio en la tabla de "My products" |
| 4.18 Borrar filtros por separado | Cada filtro aplicado es una etiqueta con "x", más "Clear all" |
| 4.19 Datos de usuario y layout | Imágenes cuadradas con `object-fit`, textos recortados y límites de longitud |
| 5.1 Elementos vistos | Los productos ya vistos se marcan con "Viewed" |
| 5.2 Notificaciones | Éxito, error e información con los colores e iconos estándar en todas las acciones |
| 5.3 Acciones irreversibles | Borrar un producto pide confirmación en un diálogo que nombra el producto y avisa de que no se puede deshacer; el botón de confirmar es rojo |
| 1.13 Ruido en listas | En *My products* las acciones (editar, cambiar precio, borrar) van en un menú "⋯" que solo aparece al pasar por la fila; en *My transactions* no hay botón "Details" repetido: toda la fila lleva al detalle y una flecha lo indica al pasar el ratón |
| 4.19 Datos variables | Las cards miden siempre lo mismo: imagen cuadrada recortada sea cual sea su tamaño (probado con 1600×400, 300×900, 2400×1600, 120×120, 800×600 y 500×1200) y cada texto en una línea con "..." y tooltip con el texto completo |
| 2.x Espaciado y consistencia | Escala única de espaciado (4/8/12/16/24/32/48 px) y anchos de página (listados 1400 px, cuenta 560 px, formularios y detalles 800 px) en `globals.css`. Cabecera, contenido y pie alineados al mismo margen. Componentes comunes para que lo igual se vea igual: `StatCardComponent` (todas las tarjetas de resumen con la misma altura), `SectionTitleComponent` (todas las cabeceras de sección), `PageTitleComponent` y un único grid de productos. Crear y editar producto tienen los mismos campos en el mismo orden; login y registro, las mismas etiquetas, tamaños y posición de los errores |
| 5.4 Errores descriptivos | Se muestran los mensajes del backend y los de validación indican cómo corregirlos |

### Mejoras para cumplir todas las pautas (puntuación 5)

Tras rellenar la plantilla de validación se mejoró todo lo que no llegaba a 5:

| Pauta | Mejora |
|---|---|
| 3.27 Galerías | Hasta 6 fotos por producto: subida múltiple arrastrando, elegir la principal, quitar fotos, miniaturas y zoom en el detalle. Backend: `GET/POST /products/:id/images`, `DELETE /products/:id/images/:name`, `PUT /products/:id/images/:name/main` (ficheros `{id}_{n}.png`, sin cambios en la BD) |
| 4.5 / 3.3 Fotos al editar e imágenes | Las fotos se cambian también al editar; miniaturas en las tablas de Mis productos, Mis transacciones y el perfil |
| 5.3 Deshacer | Borrar (uno o varios) y comprar se pueden deshacer durante unos segundos tras confirmar. Backend: `DELETE /transactions/:id` (solo el comprador, en los 2 minutos siguientes) |
| 4.15 Contenido rico | Editor de la descripción con negrita, cursiva y listas; se muestra formateada en el detalle (sin HTML, sin riesgo de inyección) |
| 4.16 Procesos repetitivos | Selección múltiple para borrar varios productos y botón "Publish and sell another" |
| 3.26 Previsualización | Vista previa en vivo de la card al vender/editar y número de resultados en cada sugerencia de búsqueda |
| 4.9 / 4.6 Sugerencias y valores por defecto | Precio sugerido según productos similares, sugerencias de título y de dominio de email; se recuerda la última categoría |
| 1.14 Elemento destacado | Marca "Top seller" en los productos de vendedores con buena reputación |
| 1.17 Lectura cómoda | Selector de tamaño de letra de la descripción (A- / A / A+) |
| 3.8 / 3.21 Agrupar y contar | Pestañas con su número en Mis productos (Todos / A la venta / Vendidos) y Mis transacciones (Todas / Compras / Ventas) |
| 5.4 Errores | Los errores del servidor se traducen a mensajes que dicen qué pasa y qué hacer (sin conexión, sesión caducada, ya vendido...) |
| Resto | Etiquetas en los filtros, buscador con botón, portada con fondo suave y buscador, estados vacíos con acción, botón de volver arriba, textos limpiados antes de guardar, fechas relativas también al editar, edad en el registro, página actual marcada en la cabecera, orden de la ficha en móvil (foto → compra → descripción) |

Las únicas pautas por debajo de 5 son 3.1 y 3.14 en *Mis productos*: las acciones de cada fila están en un menú "⋯" que aparece al pasar el ratón, una decisión de diseño tomada para no llenar de ruido una lista larga (pauta 1.13).
