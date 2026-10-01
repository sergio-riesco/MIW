import { sitioVacio, type Sitio, type Par } from './model.js';
import { aXml, deXml } from './xml.js';
import { iniciarWasm, crearZip, descargar } from './glue.js';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const crear = <K extends keyof HTMLElementTagNameMap>(tag: K, props: Record<string, unknown> = {}, ...hijos: (Node | string)[]): HTMLElementTagNameMap[K] => {
  const e = Object.assign(document.createElement(tag), props);
  e.append(...hijos);
  return e;
};

const imagenes = new Map<string, File>(); // ruta dentro del sitio -> archivo
const archivos = new Map<string, string>(); // salida del WASM
const urls = new Map<string, string>();
let sitio: Sitio = sitioVacio();

// ---------- Formulario ----------
type Tipo = 'text' | 'area' | 'img' | 'check';
interface Campo<T> { k: keyof T & string; et: string; tipo?: Tipo }

function entrada<T>(item: T, c: Campo<T>, carpeta: string): HTMLElement {
  const reg = item as unknown as Record<string, unknown>;
  const label = crear('label', { className: c.tipo === 'check' ? 'check' : '' });
  let el: HTMLElement;
  if (c.tipo === 'area') {
    const t = crear('textarea', { rows: 3, value: String(reg[c.k] ?? '') });
    t.oninput = () => (reg[c.k] = t.value);
    el = t;
  } else if (c.tipo === 'check') {
    const i = crear('input', { type: 'checkbox', checked: Boolean(reg[c.k]) });
    i.onchange = () => (reg[c.k] = i.checked);
    label.append(i, c.et);
    return label;
  } else if (c.tipo === 'img') {
    const nota = crear('small', { textContent: String(reg[c.k] || 'sin imagen') });
    const i = crear('input', { type: 'file', accept: 'image/*' });
    i.onchange = () => {
      const f = i.files?.[0];
      if (!f) return;
      const ruta = `imagenes/${carpeta}/${f.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-')}`;
      imagenes.set(ruta, f);
      reg[c.k] = ruta;
      nota.textContent = ruta;
    };
    label.append(c.et, i, nota);
    return label;
  } else {
    const i = crear('input', { type: 'text', value: String(reg[c.k] ?? '') });
    i.oninput = () => (reg[c.k] = i.value);
    el = i;
  }
  label.append(c.et, el);
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
const T = (k: string, et: string, tipo?: Tipo) => ({ k, et, tipo }) as never;

function pintarFormulario() {
  const perfil: Campo<Sitio>[] = [
    T('autor', 'Nombre'), T('idioma', 'Idioma (es, en…)'), T('resumen', 'Resumen (una frase)', 'area'),
    T('parrafos', 'Presentación (separa párrafos con una línea en blanco)', 'area'), T('foto', 'Foto', 'img'),
  ];
  $('formulario').replaceChildren(
    crear('fieldset', {}, crear('legend', {}, 'Perfil'), ...perfil.map(c => entrada(sitio, c, 'perfil'))),
    lista<Par>('Datos (Vivo en, Estudios…)', 'datos', sitio.datos, [T('etiqueta', 'Etiqueta'), T('texto', 'Valor')], () => ({ etiqueta: '', texto: '', enlace: '' })),
    lista<Par>('Contacto', 'datos', sitio.contactos, [T('etiqueta', 'Etiqueta'), T('texto', 'Texto'), T('enlace', 'Enlace (https:// o mailto:)')], () => ({ etiqueta: '', texto: '', enlace: '' })),
    crear('fieldset', {}, crear('legend', {}, 'Textos de las secciones'),
      ...(Object.keys(NOMBRES) as (keyof typeof NOMBRES)[]).flatMap(k => [
        entrada(sitio.secciones[k], T('introduccion', `${NOMBRES[k]}: introducción de su página`, 'area'), k),
        entrada(sitio.secciones[k], T('descripcion', `${NOMBRES[k]}: descripción en «Mis secciones» (Sobre mí)`), k),
      ])),
    lista('Música: grupos', 'musica', sitio.grupos, [T('categoria', 'Género / categoría'), T('nombre', 'Grupo'), T('album', 'Álbum'), T('imagen', 'Carátula', 'img'), T('favorito', 'Favorito', 'check')],
      () => ({ categoria: '', nombre: '', album: '', imagen: '', favorito: false })),
    lista('Videojuegos', 'videojuegos', sitio.juegos, [T('titulo', 'Título'), T('genero', 'Género'), T('descripcion', 'Descripción', 'area'), T('imagen', 'Portada', 'img'), T('actual', 'Jugando ahora', 'check'), T('favorito', 'Favorito', 'check')],
      () => ({ titulo: '', genero: '', descripcion: '', imagen: '', actual: false, favorito: false })),
    lista('Series', 'series', sitio.series, [T('titulo', 'Título'), T('genero', 'Género'), T('anio', 'Año'), T('descripcion', 'Descripción', 'area'), T('imagen', 'Portada', 'img'), T('actual', 'Viendo ahora', 'check'), T('favorita', 'Favorita', 'check')],
      () => ({ titulo: '', genero: '', anio: '', descripcion: '', imagen: '', actual: false, favorita: false })),
    lista('Aficiones', 'aficiones', sitio.aficiones, [T('titulo', 'Afición'), T('texto', 'Texto', 'area'), T('imagen', 'Imagen', 'img')],
      () => ({ titulo: '', texto: '', imagen: '' })),
  );
}

// ---------- XML -> sitio (WASM) ----------
const xmlArea = () => $<HTMLTextAreaElement>('xml');
function estado(msg: string, ok: boolean) { const e = $('estado'); e.textContent = msg; e.className = ok ? 'ok' : 'error'; }

async function generar(): Promise<boolean> {
  try {
    const gen = await iniciarWasm();
    const r: string[] = gen(xmlArea().value);
    archivos.clear();
    for (let i = 0; i < r.length; i += 2) archivos.set(r[i], r[i + 1]);
    estado(`Sitio generado: ${archivos.size} archivos.`, true);
    $('pestanas').replaceChildren(...[...archivos.keys()].filter(n => n.endsWith('.html')).map(n => {
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

function mostrar(nombre: string) {
  let html = archivos.get(nombre);
  if (!html) return;
  html = html
    .replace('<link rel="stylesheet" href="estilos.css">', () => `<style>${archivos.get('estilos.css') ?? ''}</style>`)
    .replace(/src="([^"]+)"/g, (m, p: string) => {
      const f = imagenes.get(p);
      if (!f) return m;
      if (!urls.has(p)) urls.set(p, URL.createObjectURL(f));
      return `src="${urls.get(p)}"`;
    });
  const fr = $<HTMLIFrameElement>('vista');
  fr.onload = () => fr.contentDocument?.querySelectorAll('a').forEach(a => {
    const h = a.getAttribute('href') ?? '';
    if (archivos.has(h)) a.addEventListener('click', ev => { ev.preventDefault(); mostrar(h); });
  });
  fr.srcdoc = html;
  document.querySelectorAll<HTMLElement>('#pestanas button').forEach(b => b.classList.toggle('activa', b.dataset.p === nombre));
}

async function leerImagen(ruta: string): Promise<Uint8Array | null> {
  const f = imagenes.get(ruta); // subida desde el formulario
  if (f) return new Uint8Array(await f.arrayBuffer());
  try { // ya existe en el servidor (p. ej. /covers/music/x.png)
    const r = await fetch(ruta);
    return r.ok ? new Uint8Array(await r.arrayBuffer()) : null;
  } catch { return null; }
}

async function zip() {
  if (!(await generar())) return;
  const enc = new TextEncoder();
  const externa = (r: string) => /^(https?:|data:|blob:|\/\/)/i.test(r);
  const enZip = (r: string) => r.replace(/^\/+/, ''); // "/covers/a.png" -> "covers/a.png"
  const atributo = /\b(src|imagen|foto)="([^"]+)"/g;
  const xml = xmlArea().value;

  // 1) Rutas de imagen usadas por el XML y por las páginas generadas
  const rutas = new Set<string>();
  for (const t of [xml, ...[...archivos].filter(([n]) => n.endsWith('.html')).map(([, t]) => t)])
    for (const m of t.matchAll(atributo)) if (!externa(m[2])) rutas.add(m[2].replace(/&amp;/g, '&'));

  // 2) Leerlas (subidas o del servidor)
  const datos = new Map<string, Uint8Array>();
  const faltan: string[] = [];
  for (const r of rutas) {
    const b = await leerImagen(r);
    if (b) datos.set(r, b); else faltan.push(r);
  }

  // 3) Reescribir rutas a relativas, para que el ZIP funcione al abrirlo
  const reescribir = (t: string) => t.replace(atributo, (m, k: string, r: string) => {
    const real = r.replace(/&amp;/g, '&');
    return datos.has(real) ? `${k}="${enZip(r)}"` : m;
  });

  const entradas = new Map<string, Uint8Array>();
  for (const [n, t] of archivos) entradas.set(n, enc.encode(n.endsWith('.html') ? reescribir(t) : t));
  entradas.set('sitio.xml', enc.encode(reescribir(xml)));
  for (const [r, b] of datos) entradas.set(enZip(r), b);

  descargar(crearZip([...entradas].map(([nombre, d]) => ({ nombre, datos: d }))), 'sitio-web.zip');
  estado(
    faltan.length ? `ZIP descargado, pero no se encontraron ${faltan.length} imagen(es): ${faltan.join(', ')}` : `ZIP descargado con ${datos.size} imagen(es).`,
    faltan.length === 0,
  );
}

function cargarXml(texto: string) {
  try {
    sitio = deXml(texto);
    xmlArea().value = texto;
    pintarFormulario();
    estado('XML cargado en el formulario.', true);
  } catch (e) {
    estado(e instanceof Error ? e.message : String(e), false);
  }
}

// ---------- Eventos ----------
$('btn-xml').onclick = () => { xmlArea().value = aXml(sitio); estado('XML generado desde el formulario.', true); };
$('btn-generar').onclick = () => { if (!xmlArea().value.trim()) xmlArea().value = aXml(sitio); void generar(); };
$('btn-zip').onclick = () => { if (!xmlArea().value.trim()) xmlArea().value = aXml(sitio); void zip(); };
$('btn-xml-a-form').onclick = () => cargarXml(xmlArea().value);
$<HTMLInputElement>('archivo-xml').onchange = async ev => {
  const f = (ev.target as HTMLInputElement).files?.[0];
  if (f) cargarXml(await f.text());
};
document.querySelectorAll<HTMLButtonElement>('[data-ejemplo]').forEach(b => {
  b.onclick = async () => cargarXml(await (await fetch(`ejemplos/${b.dataset.ejemplo}.xml`)).text());
});
pintarFormulario();
