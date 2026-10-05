// Interfaz: formulario -> XML -> sitio (wasm) -> ZIP.
import { sitioVacio } from './model.js';
import { aXml, deXml } from './xml.js';
import { iniciarWasm, crearZip, descargar } from './glue.js';
import { validarSitio } from './validar.js';
const $ = (id) => document.getElementById(id);
const crear = (tag, props = {}, ...hijos) => {
    const e = Object.assign(document.createElement(tag), props);
    e.append(...hijos);
    return e;
};
// archivos subidos: ruta en el sitio -> File
const subidos = new Map();
// lo que devuelve el wasm: ruta -> contenido
const archivos = new Map();
// blob: de los subidos, para la vista previa
const urls = new Map();
// carpeta de los recursos del ejemplo cargado
let baseRecursos = '';
let sitio = sitioVacio();
const ARCHIVOS = {
    imagen: { accept: 'image/*', carpeta: c => `covers/${c}` },
    video: { accept: 'video/mp4,video/webm', carpeta: c => `media/videos/${c}` },
    audio: { accept: 'audio/*', carpeta: () => 'media/audios' },
};
function entrada(item, c, carpeta) {
    const reg = item;
    const label = crear('label', { className: c.tipo === 'check' ? 'check' : '' });
    if (c.tipo === 'check') {
        const i = crear('input', { type: 'checkbox', checked: Boolean(reg[c.k]) });
        i.onchange = () => (reg[c.k] = i.checked);
        label.append(i, c.et);
        return label;
    }
    if (c.tipo === 'imagen' || c.tipo === 'video' || c.tipo === 'audio') {
        const def = ARCHIVOS[c.tipo];
        const nota = crear('small', { textContent: String(reg[c.k] || 'sin archivo') });
        const i = crear('input', { type: 'file', accept: def.accept });
        i.onchange = () => {
            const f = i.files?.[0];
            if (!f)
                return;
            const ruta = `${def.carpeta(carpeta)}/${f.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-')}`;
            subidos.set(ruta, f);
            reg[c.k] = ruta;
            nota.textContent = ruta;
        };
        label.append(c.et, i, nota);
        return label;
    }
    let el;
    if (c.tipo === 'area') {
        el = crear('textarea', { rows: 3, value: String(reg[c.k] ?? '') });
    }
    else {
        el = crear('input', { type: 'text', value: String(reg[c.k] ?? '') });
    }
    el.oninput = () => (reg[c.k] = el.value);
    if (c.oblig) {
        el.required = true;
        label.append(c.et, crear('span', { className: 'oblig', textContent: ' *', ariaHidden: 'true' }), el);
    }
    else {
        label.append(c.et, el);
    }
    return label;
}
function lista(titulo, carpeta, arr, campos, nuevo) {
    const cont = crear('div');
    const pintar = () => cont.replaceChildren(...arr.map((it, i) => {
        const quitar = crear('button', { type: 'button', textContent: 'Quitar', className: 'quitar' });
        quitar.onclick = () => { arr.splice(i, 1); pintar(); };
        return crear('div', { className: 'item' }, ...campos.map(c => entrada(it, c, carpeta)), quitar);
    }));
    const add = crear('button', { type: 'button', textContent: '+ Añadir' });
    add.onclick = () => { arr.push(nuevo()); pintar(); };
    pintar();
    return crear('fieldset', {}, crear('legend', {}, titulo), cont, add);
}
const NOMBRES = { musica: 'Música', videojuegos: 'Videojuegos', series: 'Series', aficiones: 'Hobbies' };
const C = (k, et, tipo) => ({ k, et, tipo });
// campo obligatorio
const O = (k, et) => ({ k, et, oblig: true });
function pintarFormulario() {
    const perfil = [
        O('autor', 'Nombre'), C('idioma', 'Idioma (es, en, es-ES…)'), C('pie', 'Texto del pie (opcional)'),
        C('resumen', 'Resumen (una frase)', 'area'),
        C('parrafos', 'Presentación (separa párrafos con una línea en blanco)', 'area'), C('foto', 'Foto', 'imagen'),
    ];
    const parVacio = () => ({ etiqueta: '', texto: '', detalle: '', enlace: '' });
    $('formulario').replaceChildren(crear('p', { className: 'nota-oblig', textContent: 'Los campos marcados con * son obligatorios.' }), crear('fieldset', {}, crear('legend', {}, 'Perfil'), ...perfil.map(c => entrada(sitio, c, 'perfil'))), lista('Datos (Vivo en, Estudios…)', 'perfil', sitio.datos, [O('etiqueta', 'Etiqueta'), C('texto', 'Valor'), C('detalle', 'Detalle (opcional)')], parVacio), lista('Contacto', 'perfil', sitio.contactos, [O('etiqueta', 'Etiqueta'), C('texto', 'Texto'), O('enlace', 'Enlace (https:// o mailto:)')], parVacio), crear('fieldset', {}, crear('legend', {}, 'Textos de las secciones'), ...Object.keys(NOMBRES).flatMap(k => [
        entrada(sitio.secciones[k], C('titulo', `${NOMBRES[k]}: título de la página (opcional)`), k),
        entrada(sitio.secciones[k], C('introduccion', `${NOMBRES[k]}: introducción de su página`, 'area'), k),
        entrada(sitio.secciones[k], C('descripcion', `${NOMBRES[k]}: descripción en «Mis secciones»`), k),
    ])), lista('Música: grupos', 'music', sitio.grupos, [
        C('categoria', 'Género / categoría'), O('nombre', 'Grupo'), C('album', 'Álbum'), C('imagen', 'Carátula', 'imagen'),
        C('fragmento', 'Fragmento de audio', 'audio'), C('cancion', 'Canción del fragmento'), C('favorito', 'Favorito', 'check'),
    ], () => ({ categoria: '', nombre: '', album: '', imagen: '', fragmento: '', cancion: '', favorito: false })), lista('Videojuegos', 'videojuegos', sitio.juegos, [
        O('titulo', 'Título'), C('genero', 'Género'), C('descripcion', 'Descripción', 'area'), C('imagen', 'Portada', 'imagen'),
        C('trailer', 'Tráiler (vídeo)', 'video'), C('actual', 'Jugando ahora', 'check'), C('favorito', 'Favorito', 'check'),
    ], () => ({ titulo: '', genero: '', descripcion: '', imagen: '', trailer: '', actual: false, favorito: false })), lista('Series', 'series', sitio.series, [
        O('titulo', 'Título'), C('genero', 'Género'), C('anio', 'Año (por ejemplo 2019)'), C('descripcion', 'Descripción', 'area'),
        C('imagen', 'Portada', 'imagen'), C('trailer', 'Tráiler (vídeo)', 'video'),
        C('actual', 'Viendo ahora', 'check'), C('favorita', 'Favorita', 'check'),
    ], () => ({ titulo: '', genero: '', anio: '', descripcion: '', imagen: '', trailer: '', actual: false, favorita: false })), lista('Aficiones', 'hobbies', sitio.aficiones, [
        O('titulo', 'Afición'), C('texto', 'Texto', 'area'), C('imagen', 'Imagen', 'imagen'),
        C('enlace', 'Enlace (opcional)'), C('textoEnlace', 'Texto del enlace'),
    ], () => ({ titulo: '', texto: '', imagen: '', enlace: '', textoEnlace: '' })));
}
// --- XML -> sitio (WebAssembly) ---
const xmlArea = () => $('xml');
function estado(msg, ok) {
    const e = $('estado');
    e.textContent = msg;
    e.className = ok ? 'ok' : 'error';
}
function mostrarErrores(titulo, errores) {
    const e = $('estado');
    e.className = 'error';
    e.replaceChildren(titulo, crear('ul', {}, ...errores.map(t => crear('li', { textContent: t }))));
}
// si hay errores los enseña y devuelve false
function formularioValido(s, titulo) {
    const errores = validarSitio(s);
    if (errores.length)
        mostrarErrores(titulo, errores);
    return errores.length === 0;
}
// XML desde el formulario, solo si es válido
function xmlDesdeFormulario() {
    if (!formularioValido(sitio, 'No se ha creado el XML: corrige estos campos.'))
        return false;
    xmlArea().value = aXml(sitio);
    return true;
}
async function generar() {
    try {
        // el XML puede estar editado a mano, así que se comprueba también
        if (!formularioValido(deXml(xmlArea().value), 'No se ha generado el sitio: el XML no es válido.'))
            return false;
        const gen = await iniciarWasm();
        const r = gen(xmlArea().value);
        archivos.clear();
        for (let i = 0; i < r.length; i += 2)
            archivos.set(r[i], r[i + 1]);
        const paginas = [...archivos.keys()].filter(n => n.endsWith('.html'));
        estado(`Sitio generado: ${paginas.length} páginas y ${archivos.size - paginas.length} archivos más.`, true);
        $('pestanas').replaceChildren(...paginas.map(n => {
            const b = crear('button', { type: 'button', textContent: n });
            b.dataset.p = n;
            b.onclick = () => mostrar(n);
            return b;
        }));
        mostrar('index.html');
        return true;
    }
    catch (e) {
        estado(e instanceof Error ? e.message : String(e), false);
        return false;
    }
}
// atributos con rutas de imágenes, vídeos o audios
const ATRIBUTO_RECURSO = /\b(src|poster|data-trailer)="([^"]+)"/g;
// pinta una página en el iframe
function mostrar(nombre) {
    let html = archivos.get(nombre);
    if (!html)
        return;
    const svg = archivos.get('imagen-por-defecto.svg') ?? '';
    const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    html = html
        // en un srcdoc no hay carpeta, así que CSS y JS van en línea
        .replace('<link rel="stylesheet" href="estilos.css">', () => `<style>${archivos.get('estilos.css') ?? ''}</style>`)
        .replace('<script src="sitio.js"></script>', () => `<script>${archivos.get('sitio.js') ?? ''}<\/script>`)
        .replaceAll('"imagen-por-defecto.svg"', `"${svgUrl}"`)
        // los subidos, con su blob:
        .replace(ATRIBUTO_RECURSO, (m, k, ruta) => {
        const real = ruta.replace(/&amp;/g, '&');
        const f = subidos.get(real);
        if (!f)
            return m;
        if (!urls.has(real))
            urls.set(real, URL.createObjectURL(f));
        return `${k}="${urls.get(real)}"`;
    });
    // los recursos de los ejemplos están en sitios/<nombre>/
    if (baseRecursos) {
        html = html.replace('<head>', `<head><base href="${new URL(baseRecursos, location.href).href}">`);
    }
    const fr = $('vista');
    fr.onload = () => fr.contentDocument?.querySelectorAll('a').forEach(a => {
        const h = a.getAttribute('href') ?? '';
        if (archivos.has(h))
            a.addEventListener('click', ev => { ev.preventDefault(); mostrar(h); });
    });
    fr.srcdoc = html;
    document.querySelectorAll('#pestanas button').forEach(b => b.classList.toggle('activa', b.dataset.p === nombre));
}
// --- ZIP ---
// lee un recurso subido o de la carpeta del ejemplo
async function leerRecurso(ruta) {
    const f = subidos.get(ruta);
    if (f)
        return new Uint8Array(await f.arrayBuffer());
    if (!baseRecursos)
        return null;
    try {
        const r = await fetch(new URL(ruta, new URL(baseRecursos, location.href)));
        return r.ok ? new Uint8Array(await r.arrayBuffer()) : null;
    }
    catch {
        return null;
    }
}
async function leerTexto(ruta) {
    const r = await fetch(ruta);
    return r.ok ? r.text() : '';
}
async function zip() {
    if (!(await generar()))
        return;
    estado('Preparando el ZIP…', true);
    const enc = new TextEncoder();
    const externa = (r) => /^(https?:|data:|blob:|mailto:|\/\/)/i.test(r);
    const xml = aXmlDesdeTexto(xmlArea().value);
    // rutas de recursos del XML
    const rutas = new Set();
    for (const m of xml.matchAll(/\b(foto|imagen|trailer|fragmento)="([^"]+)"/g)) {
        const r = m[2].replace(/&amp;/g, '&');
        if (!externa(r))
            rutas.add(r.replace(/^\/+/, ''));
    }
    const datos = new Map();
    const faltan = [];
    for (const r of rutas) {
        const b = await leerRecurso(r);
        if (b)
            datos.set(r, b);
        else
            faltan.push(r);
    }
    // el sitio + el XML con su DTD y XSD (para poder validarlo)
    const entradas = new Map();
    for (const [n, t] of archivos)
        entradas.set(n, enc.encode(t));
    entradas.set('sitio.xml', enc.encode(xml));
    entradas.set('sitio.dtd', enc.encode(await leerTexto('../esquema/sitio.dtd')));
    entradas.set('sitio.xsd', enc.encode(await leerTexto('../esquema/sitio.xsd')));
    for (const [r, b] of datos)
        entradas.set(r, b);
    descargar(crearZip([...entradas].map(([nombre, d]) => ({ nombre, datos: d }))), 'sitio-web.zip');
    estado(faltan.length
        ? `ZIP descargado, pero faltan ${faltan.length} archivo(s): ${faltan.join(', ')}`
        : `ZIP descargado con ${datos.size} imagen(es), vídeo(s) y audio(s).`, faltan.length === 0);
}
// en el ZIP el XML apunta al DTD y XSD que van al lado
function aXmlDesdeTexto(xml) {
    return xml
        .replace(/<!DOCTYPE sitio SYSTEM "[^"]*">/, '<!DOCTYPE sitio SYSTEM "sitio.dtd">')
        .replace(/xsi:noNamespaceSchemaLocation="[^"]*"/, 'xsi:noNamespaceSchemaLocation="sitio.xsd"');
}
// --- Cargar XML ---
function cargarXml(texto, base) {
    try {
        sitio = deXml(texto);
        baseRecursos = base;
        xmlArea().value = texto;
        pintarFormulario();
        estado('XML cargado en el formulario.', true);
    }
    catch (e) {
        estado(e instanceof Error ? e.message : String(e), false);
    }
}
// --- Eventos ---
$('btn-xml').onclick = () => { if (xmlDesdeFormulario())
    estado('XML generado desde el formulario.', true); };
$('btn-generar').onclick = () => { if (xmlArea().value.trim() || xmlDesdeFormulario())
    void generar(); };
$('btn-zip').onclick = () => { if (xmlArea().value.trim() || xmlDesdeFormulario())
    void zip(); };
$('btn-xml-a-form').onclick = () => cargarXml(xmlArea().value, baseRecursos);
$('archivo-xml').onchange = async (ev) => {
    const f = ev.target.files?.[0];
    if (f)
        cargarXml(await f.text(), '');
};
document.querySelectorAll('[data-ejemplo]').forEach(b => {
    b.onclick = async () => {
        const nombre = b.dataset.ejemplo;
        cargarXml(await leerTexto(`../ejemplos/${nombre}.xml`), `../sitios/${nombre}/`);
    };
});
pintarFormulario();
