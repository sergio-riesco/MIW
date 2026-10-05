import { sitioVacio } from './model.js';
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// Atributos en orden. Los vacíos y los false no se escriben (false ya es el
// valor por defecto).
const attrs = (o) => Object.entries(o).filter(([, v]) => v !== '' && v !== false)
    .map(([k, v]) => ` ${k}="${v === true ? 'true' : esc(String(v))}"`).join('');
const nodo = (n, a, texto = '', pad = '    ') => texto ? `${pad}<${n}${attrs(a)}>${esc(texto)}</${n}>` : `${pad}<${n}${attrs(a)}/>`;
// el XML generado apunta a estos dos
const DTD = 'sitio.dtd';
const XSD = 'sitio.xsd';
/** Formulario -> XML. */
export function aXml(s) {
    const sec = (k) => attrs({ ...s.secciones[k] });
    const o = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        `<!DOCTYPE sitio SYSTEM "${DTD}">`,
        `<sitio${attrs({ autor: s.autor, idioma: s.idioma, pie: s.pie })}`,
        `       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="${XSD}">`,
    ];
    o.push(`  <perfil${attrs({ foto: s.foto })}>`);
    if (s.resumen)
        o.push(`    <resumen>${esc(s.resumen)}</resumen>`);
    s.parrafos.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean).forEach(p => o.push(`    <parrafo>${esc(p)}</parrafo>`));
    s.datos.forEach(d => o.push(nodo('dato', { etiqueta: d.etiqueta, detalle: d.detalle }, d.texto)));
    s.contactos.forEach(d => o.push(nodo('contacto', { etiqueta: d.etiqueta, enlace: d.enlace }, d.texto)));
    o.push('  </perfil>');
    if (s.grupos.length) {
        o.push(`  <musica${sec('musica')}>`);
        const cats = [...new Set(s.grupos.map(g => g.categoria || 'General'))];
        for (const c of cats) {
            o.push(`    <categoria nombre="${esc(c)}">`);
            s.grupos.filter(g => (g.categoria || 'General') === c).forEach(g => o.push(nodo('grupo', {
                nombre: g.nombre, album: g.album, imagen: g.imagen, fragmento: g.fragmento, cancion: g.cancion, favorito: g.favorito,
            }, '', '      ')));
            o.push('    </categoria>');
        }
        o.push('  </musica>');
    }
    if (s.juegos.length) {
        o.push(`  <videojuegos${sec('videojuegos')}>`);
        s.juegos.forEach(j => o.push(nodo('juego', {
            titulo: j.titulo, genero: j.genero, imagen: j.imagen, trailer: j.trailer, actual: j.actual, favorito: j.favorito,
        }, j.descripcion)));
        o.push('  </videojuegos>');
    }
    if (s.series.length) {
        o.push(`  <series${sec('series')}>`);
        s.series.forEach(e => o.push(nodo('serie', {
            titulo: e.titulo, genero: e.genero, anio: e.anio, imagen: e.imagen, trailer: e.trailer, actual: e.actual, favorita: e.favorita,
        }, e.descripcion)));
        o.push('  </series>');
    }
    if (s.aficiones.length) {
        o.push(`  <aficiones${sec('aficiones')}>`);
        s.aficiones.forEach(a => o.push(nodo('aficion', {
            titulo: a.titulo, imagen: a.imagen, enlace: a.enlace, 'texto-enlace': a.textoEnlace,
        }, a.texto)));
        o.push('  </aficiones>');
    }
    o.push('</sitio>');
    return o.join('\n') + '\n';
}
/** XML -> formulario. */
export function deXml(xml) {
    const d = new DOMParser().parseFromString(xml, 'application/xml');
    if (d.querySelector('parsererror'))
        throw new Error('XML mal formado');
    const r = d.documentElement;
    if (r.tagName !== 'sitio')
        throw new Error('El elemento raíz debe ser <sitio>');
    const a = (e, k) => e.getAttribute(k) ?? '';
    const b = (e, k) => e.getAttribute(k) === 'true';
    const t = (e) => (e?.textContent ?? '').trim();
    const hs = (p, tag) => (p ? Array.from(p.children).filter(c => c.tagName === tag) : []);
    const s = sitioVacio();
    s.autor = a(r, 'autor');
    s.idioma = a(r, 'idioma') || 'es';
    s.pie = a(r, 'pie');
    const p = hs(r, 'perfil')[0];
    if (p) {
        s.foto = a(p, 'foto');
        s.resumen = t(hs(p, 'resumen')[0]);
        s.parrafos = hs(p, 'parrafo').map(t).join('\n\n');
        s.datos = hs(p, 'dato').map(e => ({ etiqueta: a(e, 'etiqueta'), texto: t(e), detalle: a(e, 'detalle'), enlace: '' }));
        s.contactos = hs(p, 'contacto').map(e => ({ etiqueta: a(e, 'etiqueta'), texto: t(e), detalle: '', enlace: a(e, 'enlace') }));
    }
    for (const c of hs(hs(r, 'musica')[0], 'categoria'))
        for (const g of hs(c, 'grupo'))
            s.grupos.push({
                categoria: a(c, 'nombre'), nombre: a(g, 'nombre'), album: a(g, 'album'), imagen: a(g, 'imagen'),
                fragmento: a(g, 'fragmento'), cancion: a(g, 'cancion'), favorito: b(g, 'favorito'),
            });
    s.juegos = hs(hs(r, 'videojuegos')[0], 'juego').map(e => ({
        titulo: a(e, 'titulo'), genero: a(e, 'genero'), descripcion: t(e), imagen: a(e, 'imagen'), trailer: a(e, 'trailer'),
        actual: b(e, 'actual'), favorito: b(e, 'favorito'),
    }));
    s.series = hs(hs(r, 'series')[0], 'serie').map(e => ({
        titulo: a(e, 'titulo'), genero: a(e, 'genero'), anio: a(e, 'anio'), descripcion: t(e), imagen: a(e, 'imagen'),
        trailer: a(e, 'trailer'), actual: b(e, 'actual'), favorita: b(e, 'favorita'),
    }));
    s.aficiones = hs(hs(r, 'aficiones')[0], 'aficion').map(e => ({
        titulo: a(e, 'titulo'), texto: t(e), imagen: a(e, 'imagen'), enlace: a(e, 'enlace'), textoEnlace: a(e, 'texto-enlace'),
    }));
    for (const k of ['musica', 'videojuegos', 'series', 'aficiones']) {
        const e = hs(r, k)[0];
        if (e)
            s.secciones[k] = { titulo: a(e, 'titulo'), introduccion: a(e, 'introduccion'), descripcion: a(e, 'descripcion') };
    }
    return s;
}
