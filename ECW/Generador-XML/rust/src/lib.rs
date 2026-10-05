//! Genera el sitio web a partir de un documento <sitio> (ver esquema/sitio.dtd).
//!
//! Se compila a WebAssembly y exporta generar(xml), que devuelve una lista
//! [ruta, contenido, ruta, contenido, ...] con las páginas, el CSS, el JS y
//! la imagen por defecto. El HTML es el de mi web personal.

use roxmltree::{Document, Node, ParsingOptions};
use wasm_bindgen::prelude::*;

const CSS: &str = include_str!("plantilla.css");

/// Para cuando un elemento no tiene imagen.
const IMAGEN_POR_DEFECTO: &str = include_str!("imagen-por-defecto.svg");
const RUTA_IMAGEN_POR_DEFECTO: &str = "imagen-por-defecto.svg";

/// En el <head>, para poner el tema antes de pintar (si no, parpadea).
const JS_TEMA_HEAD: &str = "<script>try{var t=localStorage.getItem(\"tema\");if(t)document.documentElement.dataset.theme=t}catch(e){}</script>";

/// Botón de tema y ventana de los tráileres.
const JS_SITIO: &str = include_str!("sitio.js");

// --- Utilidades ---

/// Escapa para HTML (texto y atributos).
fn esc(s: &str) -> String {
    s.replace('&', "&amp;").replace('<', "&lt;").replace('>', "&gt;").replace('"', "&quot;")
}

fn at<'a>(n: Node<'a, '_>, k: &str) -> &'a str {
    n.attribute(k).unwrap_or("")
}

/// true/false (si no está, false).
fn si(n: Node, k: &str) -> bool {
    n.attribute(k) == Some("true")
}

fn texto<'a>(n: Node<'a, '_>) -> &'a str {
    n.text().unwrap_or("").trim()
}

fn hijos<'a, 'b>(n: Node<'a, 'b>, t: &'static str) -> impl Iterator<Item = Node<'a, 'b>> {
    n.children().filter(move |c| c.has_tag_name(t))
}

/// Para no meter enlaces javascript:.
fn enlace_seguro(e: &str) -> bool {
    !e.trim().to_lowercase().starts_with("javascript:")
}

/// alt vacío porque el título ya está al lado. Sin imagen, la de por defecto.
fn img(src: &str, clase: &str, perezosa: bool) -> String {
    let src = if src.is_empty() { RUTA_IMAGEN_POR_DEFECTO } else { src };
    let carga = if perezosa { " loading=\"lazy\"" } else { "" };
    format!("<img class=\"{clase}\" src=\"{}\" alt=\"\"{carga}>", esc(src))
}

/// <p> solo si hay texto.
fn parrafo(clase: &str, t: &str) -> String {
    if t.is_empty() { String::new() } else { format!("<p class=\"{clase}\">{}</p>", esc(t)) }
}

/// Botón invisible sobre la portada que abre el tráiler.
fn boton_trailer(src: &str, titulo: &str) -> String {
    if src.is_empty() {
        return String::new();
    }
    format!(
        "<button class=\"ver-trailer\" type=\"button\" aria-haspopup=\"dialog\" data-trailer=\"{}\" data-titulo=\"{}\" aria-label=\"Ver el tráiler de {}\"></button>",
        esc(src), esc(titulo), esc(titulo)
    )
}

/// "Rock progresivo" -> "rock-progresivo"
fn slug(s: &str) -> String {
    let mut o = String::new();
    for c in s.to_lowercase().chars() {
        let c = match c {
            'á' | 'à' | 'ä' | 'â' => 'a', 'é' | 'è' | 'ë' | 'ê' => 'e', 'í' | 'ì' | 'ï' | 'î' => 'i',
            'ó' | 'ò' | 'ö' | 'ô' => 'o', 'ú' | 'ù' | 'ü' | 'û' => 'u', 'ñ' => 'n', 'ç' => 'c', x => x,
        };
        if c.is_ascii_alphanumeric() {
            o.push(c);
        } else if !o.is_empty() && !o.ends_with('-') {
            o.push('-');
        }
    }
    o.trim_end_matches('-').to_string()
}

// --- Páginas ---

struct Pagina {
    archivo: String,
    nombre: String,                // menú y <title>
    h1: String,
    lead: String,
    cuerpo: String,
    migas: Vec<(String, String)>,  // (texto, href); sin href = página actual
    en_menu: bool,
    activa: String,                // qué se marca en el menú
    con_trailers: bool,            // ¿lleva la ventana del tráiler?
}

fn pagina(archivo: &str, nombre: &str, h1: &str, lead: &str, cuerpo: String) -> Pagina {
    Pagina {
        archivo: archivo.into(),
        nombre: nombre.into(),
        h1: if h1.is_empty() { nombre.into() } else { h1.into() },
        lead: lead.into(),
        cuerpo,
        migas: vec![("Sobre mí".into(), "index.html".into()), (nombre.into(), String::new())],
        en_menu: true,
        activa: archivo.into(),
        con_trailers: false,
    }
}

/// (elemento, archivo, nombre, descripción por defecto)
const SECCIONES: [(&str, &str, &str, &str); 4] = [
    ("musica", "musica.html", "Música", "Mis grupos y artistas favoritos, organizados por género."),
    ("videojuegos", "videojuegos.html", "Videojuegos", "Los videojuegos que más me gustan y el que estoy jugando ahora."),
    ("series", "series.html", "Series", "Las series que más me gustan y la que estoy viendo."),
    ("aficiones", "hobbies.html", "Hobbies", "Mis aficiones y lo que hago en mi tiempo libre."),
];

/// index.html
fn pagina_inicio(raiz: Node, autor: &str) -> Pagina {
    let mut cuerpo = String::new();
    let mut lead = String::new();

    if let Some(p) = hijos(raiz, "perfil").next() {
        if let Some(r) = hijos(p, "resumen").next() {
            lead = texto(r).to_string();
        }

        let parrafos: String = hijos(p, "parrafo").map(|x| format!("<p>{}</p>", esc(texto(x)))).collect();
        let foto = at(p, "foto");
        let foto_html = if foto.is_empty() {
            String::new()
        } else {
            format!("<img class=\"foto\" src=\"{}\" alt=\"{}\">", esc(foto), esc(autor))
        };
        if !parrafos.is_empty() || !foto_html.is_empty() {
            cuerpo.push_str(&format!(
                "<section aria-labelledby=\"presentacion\"><h2 id=\"presentacion\">Presentación</h2><div class=\"perfil\"><div>{parrafos}</div>{foto_html}</div></section>"
            ));
        }

        let datos: String = hijos(p, "dato").map(|d| {
            let detalle = at(d, "detalle");
            let detalle = if detalle.is_empty() { String::new() } else { format!("<span class=\"detalle\">{}</span>", esc(detalle)) };
            format!("<div class=\"dato\"><dt>{}</dt><dd>{}{detalle}</dd></div>", esc(at(d, "etiqueta")), esc(texto(d)))
        }).collect();
        if !datos.is_empty() {
            cuerpo.push_str(&format!(
                "<section aria-labelledby=\"datos\"><h2 id=\"datos\">En resumen</h2><dl>{datos}</dl></section>"
            ));
        }

        let contactos: String = hijos(p, "contacto").map(|c| {
            let e = at(c, "enlace");
            let valor = if enlace_seguro(e) {
                format!("<a href=\"{}\">{}</a>", esc(e), esc(texto(c)))
            } else {
                esc(texto(c))
            };
            format!("<div class=\"dato\"><dt>{}</dt><dd>{valor}</dd></div>", esc(at(c, "etiqueta")))
        }).collect();
        if !contactos.is_empty() {
            cuerpo.push_str(&format!(
                "<section aria-labelledby=\"contacto\"><h2 id=\"contacto\">Contacto</h2><address><dl>{contactos}</dl></address></section>"
            ));
        }
    }

    let mut enlaces = String::new();
    for (tag, href, nombre, por_defecto) in SECCIONES {
        if let Some(n) = hijos(raiz, tag).next() {
            let d = if at(n, "descripcion").is_empty() { por_defecto } else { at(n, "descripcion") };
            enlaces.push_str(&format!(
                "<li><a class=\"sec-enlace\" href=\"{href}\"><span class=\"sec-t\">{nombre}</span><span class=\"sec-d\">{}</span></a></li>",
                esc(d)
            ));
        }
    }
    if !enlaces.is_empty() {
        cuerpo.push_str(&format!(
            "<section aria-labelledby=\"secciones\"><h2 id=\"secciones\">Mis secciones</h2><ul class=\"sec-lista\">{enlaces}</ul></section>"
        ));
    }

    let mut inicio = pagina("index.html", "Sobre mí", autor, &lead, cuerpo);
    inicio.migas = vec![("Sobre mí".into(), String::new())];
    inicio
}

/// musica.html y una página por género (con los fragmentos de audio).
fn paginas_musica(m: Node) -> Vec<Pagina> {
    let mut tarjetas = String::new();
    let mut generos: Vec<Pagina> = Vec::new();

    for (i, cat) in hijos(m, "categoria").enumerate() {
        let nombre = at(cat, "nombre");
        let grupos: Vec<_> = hijos(cat, "grupo").collect();

        let mut sl = slug(nombre);
        if sl.is_empty() {
            sl = format!("genero-{}", i + 1);
        }
        let mut archivo = format!("musica-{sl}.html");
        if generos.iter().any(|p| p.archivo == archivo) {
            archivo = format!("musica-{sl}-{}.html", i + 1);
        }

        let n = grupos.len();
        let cuenta = format!("{} {}", n, if n == 1 { "grupo" } else { "grupos" });
        let minis: String = grupos.iter().take(4).map(|g| img(at(*g, "imagen"), "mini", false)).collect();
        tarjetas.push_str(&format!(
            "<li><a class=\"cat\" href=\"{archivo}\"><span class=\"minis\">{minis}</span><span class=\"cat-nombre\">{}</span><span class=\"cat-cuenta\">{cuenta}</span></a></li>",
            esc(nombre)
        ));

        let filas: String = grupos.iter().map(|g| {
            let fragmento = at(*g, "fragmento");
            let audio = if fragmento.is_empty() {
                String::new()
            } else {
                let cancion = at(*g, "cancion");
                let pie = if cancion.is_empty() { "Fragmento del álbum".to_string() } else { format!("Fragmento de «{}»", esc(cancion)) };
                format!(
                    "<figure class=\"fragmento\"><figcaption>{pie}</figcaption><audio controls preload=\"none\" src=\"{s}\"><a href=\"{s}\">Descargar el fragmento</a></audio></figure>",
                    s = esc(fragmento)
                )
            };
            format!(
                "<li><article class=\"banda\">{}<div class=\"banda-info\"><h2>{}</h2>{}{audio}</div>{}</article></li>",
                img(at(*g, "imagen"), "cover-banda", true),
                esc(at(*g, "nombre")),
                parrafo("album", at(*g, "album")),
                if si(*g, "favorito") { "<span class=\"insignia\">★ Favorito</span>" } else { "" }
            )
        }).collect();

        let cuerpo = format!(
            "<nav class=\"volver\" aria-label=\"Volver a la lista de géneros\"><a href=\"musica.html\"><span aria-hidden=\"true\">←</span> Volver a todos los géneros</a></nav><ul class=\"bandas\">{filas}</ul>"
        );
        let mut p = pagina(&archivo, nombre, nombre, &cuenta, cuerpo);
        p.migas = vec![
            ("Sobre mí".into(), "index.html".into()),
            ("Música".into(), "musica.html".into()),
            (nombre.to_string(), String::new()),
        ];
        p.en_menu = false;
        p.activa = "musica.html".into();
        generos.push(p);
    }

    let mut paginas = vec![pagina(
        "musica.html", "Música", at(m, "titulo"), at(m, "introduccion"),
        format!("<ul class=\"cats\">{tarjetas}</ul>"),
    )];
    paginas.extend(generos);
    paginas
}

/// videojuegos.html: carrusel; cada portada abre su tráiler.
fn pagina_videojuegos(v: Node) -> Pagina {
    let juegos: Vec<_> = hijos(v, "juego").collect();
    let hay_trailers = juegos.iter().any(|j| !at(*j, "trailer").is_empty());

    let tarjetas: String = juegos.iter().enumerate().map(|(i, j)| {
        let (actual, favorito) = (si(*j, "actual"), si(*j, "favorito"));
        let mut insignias = String::new();
        if actual {
            insignias.push_str("<span class=\"insignia-c actual-b\">Jugando ahora</span>");
        }
        if favorito {
            insignias.push_str(&format!(
                "<span class=\"insignia-c fav-b{}\">★ Favorito</span>",
                if actual { " abajo" } else { "" }
            ));
        }
        format!(
            "<li><article class=\"juego{}\"><div class=\"portada-j\">{}{insignias}{}</div>{}<h3>{}</h3>{}</article></li>",
            if actual { " actual" } else { "" },
            img(at(*j, "imagen"), "cover-img", i >= 2),
            boton_trailer(at(*j, "trailer"), at(*j, "titulo")),
            parrafo("genero", at(*j, "genero")),
            esc(at(*j, "titulo")),
            parrafo("desc", texto(*j))
        )
    }).collect();

    let ahora = match juegos.iter().find(|j| si(**j, "actual")) {
        Some(j) => format!(
            "<p class=\"ahora\"><span aria-hidden=\"true\"></span>Jugando ahora: {}</p>",
            esc(at(*j, "titulo"))
        ),
        None => String::new(),
    };
    let pista = if hay_trailers {
        "Desliza la lista para ver más y pulsa una portada para ver su tráiler."
    } else {
        "Desliza la lista para ver más."
    };
    let cuerpo = format!(
        "<section aria-labelledby=\"lista\"><div class=\"cab-sec\"><div><h2 id=\"lista\">Mis juegos</h2><p class=\"pista\">{pista}</p></div>{ahora}</div><ul class=\"carrusel\" aria-label=\"Lista de videojuegos\">{tarjetas}</ul></section>"
    );

    let mut p = pagina("videojuegos.html", "Videojuegos", at(v, "titulo"), at(v, "introduccion"), cuerpo);
    p.con_trailers = hay_trailers;
    p
}

/// series.html: la actual arriba con su vídeo, el resto en rejilla.
fn pagina_series(s: Node) -> Pagina {
    let todas: Vec<_> = hijos(s, "serie").collect();
    let resto: Vec<_> = todas.iter().filter(|e| !si(**e, "actual")).collect();
    let hay_trailers = resto.iter().any(|e| !at(**e, "trailer").is_empty());
    let mut c = String::new();

    if let Some(e) = todas.iter().find(|e| si(**e, "actual")) {
        let trailer = at(*e, "trailer");
        let portada = if trailer.is_empty() {
            img(at(*e, "imagen"), "cover-img", false)
        } else {
            // preload="none": no se baja hasta darle a play
            let poster = if at(*e, "imagen").is_empty() { RUTA_IMAGEN_POR_DEFECTO } else { at(*e, "imagen") };
            format!(
                "<video controls preload=\"none\" poster=\"{}\" aria-label=\"Tráiler de {}\"><source src=\"{t}\" type=\"video/mp4\"><a href=\"{t}\">Descargar el tráiler</a></video>",
                esc(poster), esc(at(*e, "titulo")), t = esc(trailer)
            )
        };
        c.push_str(&format!(
            "<section aria-labelledby=\"actualmente\"><div class=\"cab-sec\"><h2 id=\"actualmente\">Ahora estoy viendo</h2><p class=\"ahora\"><span aria-hidden=\"true\"></span>Viendo ahora</p></div><article class=\"destacada\"><div class=\"portada-s\">{portada}</div><div>{}<h3 class=\"titulo-d\">{}</h3>{}{}</div></article></section>",
            parrafo("genero", at(*e, "genero")),
            esc(at(*e, "titulo")),
            parrafo("temp", at(*e, "anio")),
            parrafo("desc", texto(*e))
        ));
    }

    if !resto.is_empty() {
        let tarjetas: String = resto.iter().map(|e| format!(
            "<li><article class=\"serie\"><div class=\"portada-s\">{}{}{}</div>{}<h3>{}</h3>{}{}</article></li>",
            img(at(**e, "imagen"), "cover-img", true),
            if si(**e, "favorita") { "<span class=\"insignia-c fav-b\">★ Favorita</span>" } else { "" },
            boton_trailer(at(**e, "trailer"), at(**e, "titulo")),
            parrafo("genero", at(**e, "genero")),
            esc(at(**e, "titulo")),
            parrafo("temp", at(**e, "anio")),
            parrafo("desc", texto(**e))
        )).collect();
        let pista = if hay_trailers { "<p class=\"pista\">Pulsa una portada para ver su tráiler.</p>" } else { "" };
        c.push_str(&format!(
            "<section aria-labelledby=\"mis-series\"><h2 id=\"mis-series\">Mis series</h2>{pista}<ul class=\"grid-s\">{tarjetas}</ul></section>"
        ));
    }

    if let Some(e) = todas.iter().find(|e| si(**e, "favorita")) {
        c.push_str(&format!(
            "<section aria-labelledby=\"favorita\"><h2 id=\"favorita\">Mi favorita</h2><p class=\"nota-fav\">Si tengo que elegir una sola: <strong>{}</strong>. {}</p></section>",
            esc(at(*e, "titulo")), esc(texto(*e))
        ));
    }

    let mut p = pagina("series.html", "Series", at(s, "titulo"), at(s, "introduccion"), c);
    p.con_trailers = hay_trailers;
    p
}

/// hobbies.html: tarjetas en zigzag con su color, sus datos y un enlace opcional.
fn pagina_aficiones(h: Node) -> Pagina {
    let tarjetas: String = hijos(h, "aficion").enumerate().map(|(i, a)| {
        let texto_aficion = hijos(a, "texto").next().map(texto).unwrap_or("");

        let datos: String = hijos(a, "dato").map(|d| format!(
            "<div><dt>{}</dt><dd>{}</dd></div>",
            esc(at(d, "etiqueta")), esc(texto(d))
        )).collect();
        let datos = if datos.is_empty() { datos } else { format!("<dl class=\"datos-aficion\">{datos}</dl>") };

        let enlace = at(a, "enlace");
        let enlace = if enlace.is_empty() || !enlace_seguro(enlace) {
            String::new()
        } else {
            let t = if at(a, "texto-enlace").is_empty() { "Ver más" } else { at(a, "texto-enlace") };
            format!("<a class=\"enlace-aficion\" href=\"{}\">{}</a>", esc(enlace), esc(t))
        };

        // el tono viene de una lista cerrada en el DTD, pero por si acaso
        // solo se aceptan letras
        let tono = at(a, "tono");
        let clase = if !tono.is_empty() && tono.chars().all(|c| c.is_ascii_lowercase()) {
            format!(" tono-{tono}")
        } else {
            String::new()
        };

        format!(
            "<li><article class=\"aficion{clase}\"><div class=\"foto-aficion\">{}</div><div><h2>{}</h2>{}{datos}{enlace}</div></article></li>",
            img(at(a, "imagen"), "img-aficion", i > 0), esc(at(a, "titulo")), parrafo("texto-aficion", texto_aficion)
        )
    }).collect();
    pagina("hobbies.html", "Hobbies", at(h, "titulo"), at(h, "introduccion"), format!("<ul class=\"aficiones\">{tarjetas}</ul>"))
}

// --- Plantilla común ---

const VENTANA_TRAILER: &str = "<dialog class=\"ventana\" id=\"ventana-trailer\" aria-labelledby=\"ventana-titulo\"><div class=\"ventana-cab\"><h2 id=\"ventana-titulo\"></h2><button class=\"cerrar\" type=\"button\" aria-label=\"Cerrar el tráiler\"><span aria-hidden=\"true\">✕</span></button></div><div class=\"ventana-video\"></div></dialog>";

fn html_pagina(p: &Pagina, todas: &[Pagina], autor: &str, idioma: &str, pie: &str) -> String {
    let menu: String = todas.iter().filter(|q| q.en_menu).map(|q| format!(
        "<li><a href=\"{}\"{}>{}</a></li>",
        q.archivo,
        if q.archivo == p.activa { " aria-current=\"page\"" } else { "" },
        esc(&q.nombre)
    )).collect();

    let migas: String = p.migas.iter().enumerate().map(|(i, (t, h))| {
        let sep = if i > 0 { "<span class=\"sep\" aria-hidden=\"true\">›</span>" } else { "" };
        let item = if h.is_empty() {
            format!("<span class=\"miga-actual\" aria-current=\"page\">{}</span>", esc(t))
        } else {
            format!("<a href=\"{h}\">{}</a>", esc(t))
        };
        format!("<li>{sep}{item}</li>")
    }).collect();

    let pie = if pie.is_empty() { String::new() } else { format!("<p>{}</p>", esc(pie)) };
    let ventana = if p.con_trailers { VENTANA_TRAILER } else { "" };
    let titulo = if p.archivo == "index.html" { esc(autor) } else { format!("{} | {}", esc(&p.nombre), esc(autor)) };

    format!(
        "<!DOCTYPE html>\n<html lang=\"{idioma}\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"><title>{titulo}</title><link rel=\"icon\" href=\"{RUTA_IMAGEN_POR_DEFECTO}\" type=\"image/svg+xml\"><link rel=\"stylesheet\" href=\"estilos.css\">{JS_TEMA_HEAD}</head><body><a class=\"saltar\" href=\"#contenido\">Saltar al contenido principal</a><header class=\"cab\"><div class=\"cont\"><a class=\"marca\" href=\"index.html\">{a}</a><div class=\"cab-der\"><nav aria-label=\"Navegación principal\"><ul>{menu}</ul></nav><button class=\"tema\" id=\"tema\" type=\"button\" aria-label=\"Cambiar entre modo claro y oscuro\">☾</button></div></div></header><main class=\"cont\" id=\"contenido\"><header class=\"cab-pag\"><nav class=\"migas\" aria-label=\"Migas de pan\"><ol>{migas}</ol></nav><h1>{h1}</h1>{lead}</header>{cuerpo}</main><footer><div class=\"cont pie\"><p>© {a}</p>{pie}</div></footer>{ventana}<script src=\"sitio.js\"></script></body></html>\n",
        idioma = esc(idioma),
        a = esc(autor),
        h1 = esc(&p.h1),
        lead = parrafo("lead", &p.lead),
        cuerpo = p.cuerpo,
    )
}

// --- Punto de entrada ---

#[wasm_bindgen]
pub fn generar(xml: &str) -> Result<Vec<String>, JsError> {
    // Los documentos traen DOCTYPE, así que hay que permitirlo. El DTD no se
    // lee aquí: la validación se hace aparte con tools/Validar.java.
    let opciones = ParsingOptions { allow_dtd: true, ..ParsingOptions::default() };
    let doc = Document::parse_with_options(xml, opciones)
        .map_err(|e| JsError::new(&format!("XML mal formado: {e}")))?;

    let raiz = doc.root_element();
    if !raiz.has_tag_name("sitio") {
        return Err(JsError::new("El elemento raíz debe ser <sitio>."));
    }
    if hijos(raiz, "perfil").next().is_none() {
        return Err(JsError::new("Falta el elemento <perfil>, que es obligatorio."));
    }

    let autor = at(raiz, "autor");
    let idioma = if at(raiz, "idioma").is_empty() { "es" } else { at(raiz, "idioma") };
    let pie = at(raiz, "pie");

    let mut paginas = vec![pagina_inicio(raiz, autor)];
    if let Some(n) = hijos(raiz, "musica").next() { paginas.extend(paginas_musica(n)); }
    if let Some(n) = hijos(raiz, "videojuegos").next() { paginas.push(pagina_videojuegos(n)); }
    if let Some(n) = hijos(raiz, "series").next() { paginas.push(pagina_series(n)); }
    if let Some(n) = hijos(raiz, "aficiones").next() { paginas.push(pagina_aficiones(n)); }

    let mut salida = Vec::with_capacity(paginas.len() * 2 + 6);
    for p in &paginas {
        salida.push(p.archivo.clone());
        salida.push(html_pagina(p, &paginas, autor, idioma, pie));
    }
    salida.push("estilos.css".into());
    salida.push(CSS.into());
    salida.push("sitio.js".into());
    salida.push(JS_SITIO.into());
    salida.push(RUTA_IMAGEN_POR_DEFECTO.into());
    salida.push(IMAGEN_POR_DEFECTO.into());
    Ok(salida)
}
