//! Generador de sitios web personales a partir de XML (<sitio>).
//! Expone `generar(xml)` a JavaScript/TypeScript vía WebAssembly.
//! Devuelve [ruta1, contenido1, ruta2, contenido2, ...].

use roxmltree::{Document, Node};
use wasm_bindgen::prelude::*;

const CSS: &str = include_str!("plantilla.css");

/// Se ejecuta en <head>: aplica el tema guardado antes de pintar (evita parpadeos).
const JS_TEMA_HEAD: &str = "<script>try{var t=localStorage.getItem(\"tema\");if(t)document.documentElement.dataset.theme=t}catch(e){}</script>";

/// Se ejecuta al final del <body>: botón claro/oscuro.
const JS_TEMA: &str = "<script>(function(){var b=document.getElementById(\"tema\"),r=document.documentElement;function oscuro(){var t=r.dataset.theme;return t?t===\"dark\":matchMedia(\"(prefers-color-scheme: dark)\").matches}function pintar(){var o=oscuro();b.textContent=o?\"☀\":\"☾\";b.setAttribute(\"aria-label\",o?\"Cambiar a modo claro\":\"Cambiar a modo oscuro\")}b.addEventListener(\"click\",function(){var n=oscuro()?\"light\":\"dark\";r.dataset.theme=n;try{localStorage.setItem(\"tema\",n)}catch(e){}pintar()});pintar()})();</script>";

fn esc(s: &str) -> String {
    s.replace('&', "&amp;").replace('<', "&lt;").replace('>', "&gt;").replace('"', "&quot;")
}
fn at<'a>(n: Node<'a, '_>, k: &str) -> &'a str {
    n.attribute(k).unwrap_or("")
}
fn si(n: Node, k: &str) -> bool {
    n.attribute(k) == Some("true")
}
fn raw<'a>(n: Node<'a, '_>) -> &'a str {
    n.text().unwrap_or("").trim()
}
fn hijos<'a, 'b>(n: Node<'a, 'b>, t: &'static str) -> impl Iterator<Item = Node<'a, 'b>> {
    n.children().filter(move |c| c.has_tag_name(t))
}
/// Evita enlaces `javascript:` en atributos href.
fn enlace_seguro(e: &str) -> bool {
    !e.trim().to_lowercase().starts_with("javascript:")
}
fn img(src: &str, clase: &str) -> String {
    if src.is_empty() {
        format!("<div class=\"{clase} vacio\" aria-hidden=\"true\"></div>")
    } else {
        format!("<img class=\"{clase}\" src=\"{}\" alt=\"\" loading=\"lazy\">", esc(src))
    }
}
fn parrafo(clase: &str, t: &str) -> String {
    if t.is_empty() { String::new() } else { format!("<p class=\"{clase}\">{}</p>", esc(t)) }
}

struct Pagina {
    archivo: String,
    nombre: String,
    h1: String,
    lead: String,
    cuerpo: String,
    migas: Vec<(String, String)>, // (texto, href); href vacío = página actual
    en_nav: bool,
    activa: String, // archivo que se marca en el menú
}

fn pag(archivo: &str, nombre: &str, lead: &str, cuerpo: String) -> Pagina {
    Pagina {
        archivo: archivo.into(), nombre: nombre.into(), h1: nombre.into(), lead: lead.into(), cuerpo,
        migas: vec![("Sobre mí".into(), "index.html".into()), (nombre.into(), String::new())],
        en_nav: true, activa: archivo.into(),
    }
}

fn slug(s: &str) -> String {
    let mut o = String::new();
    for c in s.to_lowercase().chars() {
        let c = match c {
            'á' | 'à' | 'ä' => 'a', 'é' | 'è' | 'ë' => 'e', 'í' | 'ï' => 'i',
            'ó' | 'ö' => 'o', 'ú' | 'ü' => 'u', 'ñ' => 'n', x => x,
        };
        if c.is_ascii_alphanumeric() { o.push(c); }
        else if !o.is_empty() && !o.ends_with('-') { o.push('-'); }
    }
    o.trim_end_matches('-').to_string()
}

#[wasm_bindgen]
pub fn generar(xml: &str) -> Result<Vec<String>, JsError> {
    let doc = Document::parse(xml).map_err(|e| JsError::new(&format!("XML mal formado: {e}")))?;
    let raiz = doc.root_element();
    if !raiz.has_tag_name("sitio") {
        return Err(JsError::new("El elemento raíz debe ser <sitio>"));
    }
    let autor = at(raiz, "autor");
    let idioma = if at(raiz, "idioma").is_empty() { "es" } else { at(raiz, "idioma") };
    let mut pags: Vec<Pagina> = Vec::new();

    // ---- Inicio (<perfil>) ----
    let mut cuerpo = String::new();
    let mut lead = String::new();
    if let Some(p) = hijos(raiz, "perfil").next() {
        if let Some(r) = hijos(p, "resumen").next() { lead = raw(r).to_string(); }
        let foto = at(p, "foto");
        let parrafos: String = hijos(p, "parrafo").map(|x| format!("<p>{}</p>", esc(raw(x)))).collect();
        let foto_html = if foto.is_empty() { String::new() } else {
            format!("<img class=\"foto\" src=\"{}\" alt=\"{}\">", esc(foto), esc(autor))
        };
        if !parrafos.is_empty() || !foto_html.is_empty() {
            cuerpo.push_str(&format!("<h2>Presentación</h2><div class=\"perfil\"><div>{parrafos}</div>{foto_html}</div>"));
        }
        let lista = |tag: &'static str| -> String {
            hijos(p, tag).map(|d| {
                let e = at(d, "enlace");
                let v = if !e.is_empty() && enlace_seguro(e) {
                    format!("<a href=\"{}\">{}</a>", esc(e), esc(raw(d)))
                } else { esc(raw(d)) };
                format!("<div class=\"dato\"><dt>{}</dt><dd>{}</dd></div>", esc(at(d, "etiqueta")), v)
            }).collect()
        };
        let d = lista("dato");
        if !d.is_empty() { cuerpo.push_str(&format!("<h2>En resumen</h2><dl>{d}</dl>")); }
        let c = lista("contacto");
        if !c.is_empty() { cuerpo.push_str(&format!("<h2>Contacto</h2><dl>{c}</dl>")); }
    }
    let defs = [
        ("musica", "musica.html", "Música", "Mis grupos y artistas favoritos, organizados por género."),
        ("videojuegos", "videojuegos.html", "Videojuegos", "Los videojuegos que más me gustan y el que estoy jugando ahora."),
        ("series", "series.html", "Series", "Las series que más me gustan y la que estoy viendo."),
        ("aficiones", "hobbies.html", "Hobbies", "Mis aficiones y lo que hago en mi tiempo libre."),
    ];
    let mut sec = String::new();
    for (tag, href, nombre, def) in defs {
        if let Some(n) = hijos(raiz, tag).next() {
            let d = if at(n, "descripcion").is_empty() { def } else { at(n, "descripcion") };
            sec.push_str(&format!(
                "<li><a class=\"sec-enlace\" href=\"{href}\"><span class=\"sec-t\">{nombre}</span><span class=\"sec-d\">{}</span></a></li>",
                esc(d)
            ));
        }
    }
    if !sec.is_empty() {
        cuerpo.push_str(&format!("<h2>Mis secciones</h2><ul class=\"sec-lista\">{sec}</ul>"));
    }
    let mut inicio = pag("index.html", "Sobre mí", &lead, cuerpo);
    inicio.h1 = autor.to_string();
    inicio.migas = vec![("Sobre mí".into(), String::new())];
    pags.push(inicio);

    // ---- Música: índice de géneros + una página por género ----
    if let Some(m) = hijos(raiz, "musica").next() {
        let mut tarjetas = String::new();
        let mut subs: Vec<Pagina> = Vec::new();
        for (i, cat) in hijos(m, "categoria").enumerate() {
            let nombre = at(cat, "nombre");
            let grupos: Vec<_> = hijos(cat, "grupo").collect();
            let mut sl = slug(nombre);
            if sl.is_empty() { sl = format!("genero-{}", i + 1); }
            let mut archivo = format!("musica-{sl}.html");
            if subs.iter().any(|p| p.archivo == archivo) { archivo = format!("musica-{sl}-{}.html", i + 1); }
            let n = grupos.len();
            let cuenta = format!("{} {}", n, if n == 1 { "grupo" } else { "grupos" });
            let minis: String = grupos.iter().take(4).map(|g| img(at(*g, "imagen"), "mini")).collect();
            tarjetas.push_str(&format!(
                "<li><a class=\"cat\" href=\"{archivo}\"><span class=\"minis\">{minis}</span><span class=\"cat-nombre\">{}</span><span class=\"cat-cuenta\">{cuenta}</span></a></li>",
                esc(nombre)
            ));
            let filas: String = grupos.iter().map(|g| format!(
                "<li class=\"banda\">{}<div class=\"banda-info\"><h2>{}</h2>{}</div>{}</li>",
                img(at(*g, "imagen"), "cover-banda"), esc(at(*g, "nombre")), parrafo("album", at(*g, "album")),
                if si(*g, "favorito") { "<span class=\"insignia\">★ Favorito</span>" } else { "" }
            )).collect();
            let cuerpo = format!(
                "<nav class=\"volver\" aria-label=\"Volver a la lista de géneros\"><a href=\"musica.html\"><span aria-hidden=\"true\">←</span> Volver a todos los géneros</a></nav><ul class=\"bandas\">{filas}</ul>"
            );
            subs.push(Pagina {
                archivo, nombre: nombre.to_string(), h1: nombre.to_string(), lead: cuenta, cuerpo,
                migas: vec![
                    ("Sobre mí".into(), "index.html".into()),
                    ("Música".into(), "musica.html".into()),
                    (nombre.to_string(), String::new()),
                ],
                en_nav: false, activa: "musica.html".into(),
            });
        }
        pags.push(pag("musica.html", "Música", at(m, "introduccion"), format!("<ul class=\"cats\">{tarjetas}</ul>")));
        pags.extend(subs);
    }

    // ---- Videojuegos: carrusel horizontal desplazable ----
    if let Some(v) = hijos(raiz, "videojuegos").next() {
        let juegos: Vec<_> = hijos(v, "juego").collect();
        let tarjetas: String = juegos.iter().map(|j| {
            let (act, fav) = (si(*j, "actual"), si(*j, "favorito"));
            let mut ins = String::new();
            if act { ins.push_str("<span class=\"insignia-c actual-b\">Jugando ahora</span>"); }
            if fav {
                ins.push_str(&format!("<span class=\"insignia-c fav-b{}\">★ Favorito</span>", if act { " abajo" } else { "" }));
            }
            format!(
                "<li><article class=\"juego{}\"><div class=\"portada-j\">{}{}</div>{}<h3>{}</h3>{}</article></li>",
                if act { " actual" } else { "" }, img(at(*j, "imagen"), "cover-img"), ins,
                parrafo("genero", at(*j, "genero")), esc(at(*j, "titulo")), parrafo("desc", raw(*j))
            )
        }).collect();
        let ahora = match juegos.iter().find(|j| si(**j, "actual")) {
            Some(j) => format!("<p class=\"ahora\"><span aria-hidden=\"true\"></span>Jugando ahora: {}</p>", esc(at(*j, "titulo"))),
            None => String::new(),
        };
        let cuerpo = format!(
            "<section><div class=\"cab-sec\"><div><h2>Mis juegos</h2><p class=\"pista\">Desliza la lista para ver más.</p></div>{ahora}</div><ul class=\"carrusel\" aria-label=\"Lista de videojuegos\">{tarjetas}</ul></section>"
        );
        pags.push(pag("videojuegos.html", "Videojuegos", at(v, "introduccion"), cuerpo));
    }

    // ---- Series: destacada + rejilla + favorita ----
    if let Some(s) = hijos(raiz, "series").next() {
        let todas: Vec<_> = hijos(s, "serie").collect();
        let mut c = String::new();
        if let Some(e) = todas.iter().find(|e| si(**e, "actual")) {
            c.push_str(&format!(
                "<section><div class=\"cab-sec\"><h2>Ahora estoy viendo</h2><p class=\"ahora\"><span aria-hidden=\"true\"></span>Viendo ahora</p></div><article class=\"destacada\"><div class=\"portada-s\">{}</div><div>{}<h3 class=\"titulo-d\">{}</h3>{}{}</div></article></section>",
                img(at(*e, "imagen"), "cover-img"), parrafo("genero", at(*e, "genero")), esc(at(*e, "titulo")),
                parrafo("temp", at(*e, "anio")), parrafo("desc", raw(*e))
            ));
        }
        let resto: String = todas.iter().filter(|e| !si(**e, "actual")).map(|e| format!(
            "<li><article class=\"serie\"><div class=\"portada-s\">{}{}</div>{}<h3>{}</h3>{}{}</article></li>",
            img(at(*e, "imagen"), "cover-img"),
            if si(*e, "favorita") { "<span class=\"insignia-c fav-b\">★ Favorita</span>" } else { "" },
            parrafo("genero", at(*e, "genero")), esc(at(*e, "titulo")), parrafo("temp", at(*e, "anio")), parrafo("desc", raw(*e))
        )).collect();
        c.push_str(&format!("<section><h2>Mis series</h2><ul class=\"grid-s\">{resto}</ul></section>"));
        if let Some(e) = todas.iter().find(|e| si(**e, "favorita")) {
            c.push_str(&format!(
                "<section><h2>Mi favorita</h2><p class=\"nota-fav\">Si tengo que elegir una sola: <strong>{}</strong>. {}</p></section>",
                esc(at(*e, "titulo")), esc(raw(*e))
            ));
        }
        pags.push(pag("series.html", "Series", at(s, "introduccion"), c));
    }

    // ---- Aficiones ----
    if let Some(h) = hijos(raiz, "aficiones").next() {
        let hs: String = hijos(h, "aficion").map(|a| format!(
            "<li><article class=\"fila\">{}<div><h2>{}</h2><p>{}</p></div></article></li>",
            img(at(a, "imagen"), "foto-fila"), esc(at(a, "titulo")), esc(raw(a))
        )).collect();
        pags.push(pag("hobbies.html", "Hobbies", at(h, "introduccion"), format!("<ul class=\"filas\">{hs}</ul>")));
    }

    // ---- Renderizado de páginas ----
    let mut salida: Vec<String> = Vec::new();
    for p in &pags {
        let nav: String = pags.iter().filter(|q| q.en_nav).map(|q| format!(
            "<li><a href=\"{}\"{}>{}</a></li>", q.archivo,
            if q.archivo == p.activa { " aria-current=\"page\"" } else { "" }, esc(&q.nombre)
        )).collect();
        let migas: String = p.migas.iter().enumerate().map(|(i, (t, h))| {
            let sep = if i > 0 { "<span class=\"sep\" aria-hidden=\"true\">›</span>" } else { "" };
            let it = if h.is_empty() {
                format!("<span class=\"miga-actual\" aria-current=\"page\">{}</span>", esc(t))
            } else {
                format!("<a href=\"{h}\">{}</a>", esc(t))
            };
            format!("<li>{sep}{it}</li>")
        }).collect();
        let lead = parrafo("lead", &p.lead);
        let (a, i, t, n, cu) = (esc(autor), esc(idioma), esc(&p.h1), esc(&p.nombre), &p.cuerpo);
        let html = format!(
            "<!doctype html><html lang=\"{i}\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>{n} | {a}</title><link rel=\"stylesheet\" href=\"estilos.css\">{JS_TEMA_HEAD}</head><body><header class=\"cab\"><div class=\"cont\"><a class=\"marca\" href=\"index.html\">{a}</a><div class=\"cab-der\"><nav aria-label=\"Principal\"><ul>{nav}</ul></nav><button class=\"tema\" id=\"tema\" type=\"button\" aria-label=\"Cambiar entre modo claro y oscuro\">☾</button></div></div></header><main class=\"cont\"><header class=\"cab-pag\"><nav class=\"migas\" aria-label=\"Migas de pan\"><ol>{migas}</ol></nav><h1>{t}</h1>{lead}</header>{cu}</main><footer><div class=\"cont\">© {a}</div></footer>{JS_TEMA}</body></html>"
        );
        salida.push(p.archivo.clone());
        salida.push(html);
    }
    salida.push("estilos.css".to_string());
    salida.push(CSS.to_string());
    Ok(salida)
}
