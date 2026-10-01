# Generador de sitios web personales desde XML

Flujo: **formulario (TypeScript) → XML → WebAssembly/Rust → sitio HTML+CSS (vista previa y ZIP)**.

| Lenguaje | Dónde | Qué hace |
|---|---|---|
| TypeScript | `src/model.ts`, `src/xml.ts`, `src/app.ts` | Modelo de datos, formulario, serialización Sitio⇄XML |
| Rust → WASM | `rust/src/lib.rs` (+ `plantilla.css`) | Lee el XML (roxmltree), valida la raíz y genera las páginas |
| JavaScript | `src/glue.js` | Carga del WASM, creador de ZIP (CRC32, sin librerías), descarga |

## Lenguaje XML (`<sitio>`)
```xml
<sitio idioma="es" autor="Nombre">
  <perfil foto="ruta">
    <resumen>…</resumen>  <parrafo>…</parrafo>*
    <dato etiqueta="…">valor</dato>*
    <contacto etiqueta="…" enlace="https://…|mailto:…">texto</contacto>*
  </perfil>
  <musica introduccion="…">
    <categoria nombre="…"><grupo nombre album imagen favorito="true"/>*</categoria>*
  </musica>
  <videojuegos introduccion="…"><juego titulo genero imagen actual favorito>descripción</juego>*</videojuegos>
  <series introduccion="…"><serie titulo genero anio imagen actual favorita>descripción</serie>*</series>
  <aficiones introduccion="…"><aficion titulo imagen>texto</aficion>*</aficiones>
</sitio>
```
`<perfil>` genera `index.html`; cada sección presente genera su página y su entrada de menú.
Las imágenes se referencian por ruta (`imagenes/musica/x.png`); el ZIP las incluye.

## Compilar
```bash
# una vez
cargo install wasm-pack          # y tener Rust instalado
npm i -D typescript              # en web-personal
./generador-xml/build.sh
npm run dev                      # abre http://localhost:3000/generador/index.html
```
Añade `"generador-xml/**"` y `"public/**"` a `globalIgnores` de `eslint.config.mjs`.
