// Interfaz del generador: formulario -> XML -> sitio (WebAssembly) -> ZIP.
import { sitioVacio, type Sitio, type Par } from './model.js';
import { aXml, deXml } from './xml.js';
import { iniciarWasm, crearZip, descargar } from './glue.js';
import { validarSitio } from './validar.js';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const crear = <K extends keyof HTMLElementTagNameMap>(tag: K, props: Record<string, unknown> = {}, ...hijos: (Node | string)[]): HTMLElementTagNameMap[K] => {
  const e = Object.assign(document.createElement(tag), props);
  e.append(...hijos);
  return e;
};

/** Archivos subidos desde el formulario: ruta dentro del sitio -> archivo. */
const subidos = new Map<string, File>();
/** Salida del WebAssembly: ruta -> contenido. */
const archivos = new Map<string, string>();
/** URLs blob: de los archivos subidos, para la vista previa. */
const urls = new Map<string, string>();
/** Carpeta de donde se leen las imágenes y vídeos de un ejemplo cargado. */
let baseRecursos = '';
let sitio: Sitio = sitioVacio();

// ---------- Formulario ----------

/** Tipo de campo. Los de archivo indican qué aceptan y en qué carpeta se guardan. */
type Tipo = 'text' | 'area' | 'check' | 'imagen' | 'video' | 'audio';
/** oblig: el atributo es #REQUIRED en el DTD (se marca con *). */
interface Campo<T> { k: keyof T & string; et: string; tipo?: Tipo; oblig?: boolean }

const ARCHIVOS: Record<'imagen' | 'video' | 'audio', { accept: string; carpeta: (c: string) => string }> = {
  imagen: { accept: 'image/*', carpeta: c => `covers/${c}` },
  video: { accept: 'video/mp4,video/webm', carpeta: c => `media/videos/${c}` },
  audio: { accept: 'audio/*', carpeta: () => 'media/audios' },
};

function entrada<T>(item: T, c: Campo<T>, carpeta: string): HTMLElement {
  const reg = item as unknown as Record<string, unknown>;
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
      if (!f) return;
      const ruta = `${def.carpeta(carpeta)}/${f.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-')}`;
      subidos.set(ruta, f);
      reg[c.k] = ruta;
      nota.textContent = ruta;
    };
    label.append(c.et, i, nota);
    return label;
  }

  let el: HTMLInputElement | HTMLTextAreaElement;
  if (c.tipo === 'area') {
    el = crear('textarea', { rows: 3, value: String(reg[c.k] ?? '') });
  } else {
    el = crear('input', { type: 'text', value: String(reg[c.k] ?? '') });
  }
  el.oninput = () => (reg[c.k] = el.value);
  if (c.oblig) {
    el.required = true;
    label.append(c.et, crear('span', { className: 'oblig', textContent: ' *', ariaHidden: 'true' }), el);
  } else {
    label.append(c.et, el);
  }
  return label;
}

function lista<T>(titulo: string, carpeta: string, arr: T[], campos: Campo<T>[], nuevo: () => T): HTMLElement {
  const cont = crear('div');
  const pintar = () =>
    cont.replaceChildren(...arr.map((it, i) => {
      const quitar = crear('button', { type: 'button', textContent: 'Quitar', className: 'quitar' });
      quitar.onclick = () => { arr.splice(i, 1); pintar(); };
      return crear('div', { className: 'item' }, ...campos.map(c => entrada(it, c, carpeta)), quitar);
    }));
  const add = crear('button', { type: 'button', textContent: '+ Añadir' });
  add.onclick = () => { arr.push(nuevo()); pintar(); };
  pintar();
  return crear('fieldset', {}, crear('legend', {}, titulo), cont, add);
}

const NOMBRES = { musica: 'Música', videojuegos: 'Videojuegos', series: 'Series', aficiones: 'Hobbies' } as const;
const C = (k: string, et: string, tipo?: Tipo) => ({ k, et, tipo }) as never;
/** Campo obligatorio. */
const O = (k: string, et: string) => ({ k, et, oblig: true }) as never;

function pintarFormulario() {
  const perfil: Campo<Sitio>[] = [
    O('autor', 'Nombre'), C('idioma', 'Idioma (es, en, es-ES…)'), C('pie', 'Texto del pie (opcional)'),
    C('resumen', 'Resumen (una frase)', 'area'),
    C('parrafos', 'Presentación (separa párrafos con una línea en blanco)', 'area'), C('foto', 'Foto', 'imagen'),
  ];
  const parVacio = (): Par => ({ etiqueta: '', texto: '', detalle: '', enlace: '' });

  $('formulario').replaceChildren(
    crear('p', { className: 'nota-oblig', textContent: 'Los campos marcados con * son obligatorios.' }),
    crear('fieldset', {}, crear('legend', {}, 'Perfil'), ...perfil.map(c => entrada(sitio, c, 'perfil'))),
    lista<Par>('Datos (Vivo en, Estudios…)', 'perfil', sitio.datos,
      [O('etiqueta', 'Etiqueta'), C('texto', 'Valor'), C('detalle', 'Detalle (opcional)')], parVacio),
    lista<Par>('Contacto', 'perfil', sitio.contactos,
      [O('etiqueta', 'Etiqueta'), C('texto', 'Texto'), O('enlace', 'Enlace (https:// o mailto:)')], parVacio),
    crear('fieldset', {}, crear('legend', {}, 'Textos de las secciones'),
      ...(Object.keys(NOMBRES) as (keyof typeof NOMBRES)[]).flatMap(k => [
        entrada(sitio.secciones[k], C('titulo', `${NOMBRES[k]}: título de la página (opcional)`), k),
        entrada(sitio.secciones[k], C('introduccion', `${NOMBRES[k]}: introducción de su página`, 'area'), k),
        entrada(sitio.secciones[k], C('descripcion', `${NOMBRES[k]}: descripción en «Mis secciones»`), k),
      ])),
    lista('Música: grupos', 'music', sitio.grupos, [
      C('categoria', 'Género / categoría'), O('nombre', 'Grupo'), C('album', 'Álbum'), C('imagen', 'Carátula', 'imagen'),
      C('fragmento', 'Fragmento de audio', 'audio'), C('cancion', 'Canción del fragmento'), C('favorito', 'Favorito', 'check'),
    ], () => ({ categoria: '', nombre: '', album: '', imagen: '', fragmento: '', cancion: '', favorito: false })),
    lista('Videojuegos', 'videojuegos', sitio.juegos, [
      O('titulo', 'Título'), C('genero', 'Género'), C('descripcion', 'Descripción', 'area'), C('imagen', 'Portada', 'imagen'),
      C('trailer', 'Tráiler (vídeo)', 'video'), C('actual', 'Jugando ahora', 'check'), C('favorito', 'Favorito', 'check'),
    ], () => ({ titulo: '', genero: '', descripcion: '', imagen: '', trailer: '', actual: false, favorito: false })),
    lista('Series', 'series', sitio.series, [
      O('titulo', 'Título'), C('genero', 'Género'), C('anio', 'Año (por ejemplo 2019)'), C('descripcion', 'Descripción', 'area'),
      C('imagen', 'Portada', 'imagen'), C('trailer', 'Tráiler (vídeo)', 'video'),
      C('actual', 'Viendo ahora', 'check'), C('favorita', 'Favorita', 'check'),
    ], () => ({ titulo: '', genero: '', anio: '', descripcion: '', imagen: '', trailer: '', actual: false, favorita: false })),
    lista('Aficiones', 'hobbies', sitio.aficiones, [
      O('titulo', 'Afición'), C('texto', 'Texto', 'area'), C('imagen', 'Imagen', 'imagen'),
      C('enlace', 'Enlace (opcional)'), C('textoEnlace', 'Texto del enlace'),
    ], () => ({ titulo: '', texto: '', imagen: '', enlace: '', textoEnlace: '' })),
  );
}

// ---------- XML -> sitio (WebAssembly) ----------

const xmlArea = () => $<HTMLTextAreaElement>('xml');

function estado(msg: string, ok: boolean) {
  const e = $('estado');
  e.textContent = msg;
  e.className = ok ? 'ok' : 'error';
}

/** Muestra los errores de validación como lista. */
function mostrarErrores(titulo: string, errores: string[]) {
  const e = $('estado');
  e.className = 'error';
  e.replaceChildren(titulo, crear('ul', {}, ...errores.map(t => crear('li', { textContent: t }))));
}

/** Comprueba el formulario; si hay errores los muestra y devuelve false. */
function formularioValido(s: Sitio, titulo: string): boolean {
  const errores = validarSitio(s);
  if (errores.length) mostrarErrores(titulo, errores);
  return errores.length === 0;
}

/** Crea el XML desde el formulario solo si es válido. */
function xmlDesdeFormulario(): boolean {
  if (!formularioValido(sitio, 'No se ha creado el XML: corrige estos campos.')) return false;
  xmlArea().value = aXml(sitio);
  return true;
}

async function generar(): Promise<boolean> {
  try {
    // El XML se puede haber editado a mano: se comprueba igual que el formulario.
    if (!formularioValido(deXml(xmlArea().value), 'No se ha generado el sitio: el XML no es válido.')) return false;
    const gen = await iniciarWasm();
    const r: string[] = gen(xmlArea().value);
    archivos.clear();
    for (let i = 0; i < r.length; i += 2) archivos.set(r[i], r[i + 1]);
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
  } catch (e) {
    estado(e instanceof Error ? e.message : String(e), false);
    return false;
  }
}

/** Atributos que apuntan a imágenes, vídeos o audios. */
const ATRIBUTO_RECURSO = /\b(src|poster|data-trailer)="([^"]+)"/g;

/** Muestra una página generada en el iframe de la vista previa. */
function mostrar(nombre: string) {
  let html = archivos.get(nombre);
  if (!html) return;

  const svg = archivos.get('imagen-por-defecto.svg') ?? '';
  const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

  html = html
    // CSS y JS en línea: en un iframe srcdoc no hay carpeta del sitio.
    .replace('<link rel="stylesheet" href="estilos.css">', () => `<style>${archivos.get('estilos.css') ?? ''}</style>`)
    .replace('<script src="sitio.js"></script>', () => `<script>${archivos.get('sitio.js') ?? ''}<\/script>`)
    .replaceAll('"imagen-por-defecto.svg"', `"${svgUrl}"`)
    // Archivos subidos en el formulario: URL blob.
    .replace(ATRIBUTO_RECURSO, (m, k: string, ruta: string) => {
      const real = ruta.replace(/&amp;/g, '&');
      const f = subidos.get(real);
      if (!f) return m;
      if (!urls.has(real)) urls.set(real, URL.createObjectURL(f));
      return `${k}="${urls.get(real)}"`;
    });

  // Los recursos de un ejemplo están en su carpeta de sitios/.
  if (baseRecursos) {
    html = html.replace('<head>', `<head><base href="${new URL(baseRecursos, location.href).href}">`);
  }

  const fr = $<HTMLIFrameElement>('vista');
  fr.onload = () => fr.contentDocument?.querySelectorAll('a').forEach(a => {
    const h = a.getAttribute('href') ?? '';
    if (archivos.has(h)) a.addEventListener('click', ev => { ev.preventDefault(); mostrar(h); });
  });
  fr.srcdoc = html;
  document.querySelectorAll<HTMLElement>('#pestanas button').forEach(b => b.classList.toggle('activa', b.dataset.p === nombre));
}

// ---------- ZIP ----------

/** Lee un recurso: subido en el formulario o de la carpeta del ejemplo. */
async function leerRecurso(ruta: string): Promise<Uint8Array | null> {
  const f = subidos.get(ruta);
  if (f) return new Uint8Array(await f.arrayBuffer());
  if (!baseRecursos) return null;
  try {
    const r = await fetch(new URL(ruta, new URL(baseRecursos, location.href)));
    return r.ok ? new Uint8Array(await r.arrayBuffer()) : null;
  } catch {
    return null;
  }
}

async function leerTexto(ruta: string): Promise<string> {
  const r = await fetch(ruta);
  return r.ok ? r.text() : '';
}

async function zip() {
  if (!(await generar())) return;
  estado('Preparando el ZIP…', true);

  const enc = new TextEncoder();
  const externa = (r: string) => /^(https?:|data:|blob:|mailto:|\/\/)/i.test(r);
  const xml = aXmlDesdeTexto(xmlArea().value);

  // 1) Recursos que usa el sitio (rutas relativas del XML)
  const rutas = new Set<string>();
  for (const m of xml.matchAll(/\b(foto|imagen|trailer|fragmento)="([^"]+)"/g)) {
    const r = m[2].replace(/&amp;/g, '&');
    if (!externa(r)) rutas.add(r.replace(/^\/+/, ''));
  }

  // 2) Leerlos
  const datos = new Map<string, Uint8Array>();
  const faltan: string[] = [];
  for (const r of rutas) {
    const b = await leerRecurso(r);
    if (b) datos.set(r, b); else faltan.push(r);
  }

  // 3) El sitio, el XML y su DTD y XSD, para que el XML se pueda validar.
  const entradas = new Map<string, Uint8Array>();
  for (const [n, t] of archivos) entradas.set(n, enc.encode(t));
  entradas.set('sitio.xml', enc.encode(xml));
  entradas.set('sitio.dtd', enc.encode(await leerTexto('../esquema/sitio.dtd')));
  entradas.set('sitio.xsd', enc.encode(await leerTexto('../esquema/sitio.xsd')));
  for (const [r, b] of datos) entradas.set(r, b);

  descargar(crearZip([...entradas].map(([nombre, d]) => ({ nombre, datos: d }))), 'sitio-web.zip');
  estado(
    faltan.length
      ? `ZIP descargado, pero faltan ${faltan.length} archivo(s): ${faltan.join(', ')}`
      : `ZIP descargado con ${datos.size} imagen(es), vídeo(s) y audio(s).`,
    faltan.length === 0,
  );
}

/** El XML del ZIP apunta al DTD y al XSD que van junto a él. */
function aXmlDesdeTexto(xml: string): string {
  return xml
    .replace(/<!DOCTYPE sitio SYSTEM "[^"]*">/, '<!DOCTYPE sitio SYSTEM "sitio.dtd">')
    .replace(/xsi:noNamespaceSchemaLocation="[^"]*"/, 'xsi:noNamespaceSchemaLocation="sitio.xsd"');
}

// ---------- Cargar XML ----------

function cargarXml(texto: string, base: string) {
  try {
    sitio = deXml(texto);
    baseRecursos = base;
    xmlArea().value = texto;
    pintarFormulario();
    estado('XML cargado en el formulario.', true);
  } catch (e) {
    estado(e instanceof Error ? e.message : String(e), false);
  }
}

// ---------- Eventos ----------

$('btn-xml').onclick = () => { if (xmlDesdeFormulario()) estado('XML generado desde el formulario.', true); };
$('btn-generar').onclick = () => { if (xmlArea().value.trim() || xmlDesdeFormulario()) void generar(); };
$('btn-zip').onclick = () => { if (xmlArea().value.trim() || xmlDesdeFormulario()) void zip(); };
$('btn-xml-a-form').onclick = () => cargarXml(xmlArea().value, baseRecursos);
$<HTMLInputElement>('archivo-xml').onchange = async ev => {
  const f = (ev.target as HTMLInputElement).files?.[0];
  if (f) cargarXml(await f.text(), '');
};
document.querySelectorAll<HTMLButtonElement>('[data-ejemplo]').forEach(b => {
  b.onclick = async () => {
    const nombre = b.dataset.ejemplo;
    cargarXml(await leerTexto(`../ejemplos/${nombre}.xml`), `../sitios/${nombre}/`);
  };
});
pintarFormulario();
