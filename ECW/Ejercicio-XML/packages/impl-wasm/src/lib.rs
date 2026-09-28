// ============================================================================
// lib.rs -- Motor de analisis de VXML Doctor (implementacion WebAssembly/Rust).
// ============================================================================
// ESTRATEGIA (Rust):
//   - El escaner trabaja directamente sobre los BYTES UTF-8 del documento,
//     sin decodificar a string salvo donde hace falta de verdad (valores de
//     atributos, texto de prompts). Las columnas se miden en bytes desde el
//     inicio de la linea, que es exactamente lo que publica el contrato.
//   - Los eventos se guardan en ESTRUCTURA DE ARRAYS (SoA): un Vec por campo
//     (tipo, hash, linea, columna, offsets, ...). No hay ni un objeto por
//     etiqueta ni un nodo por elemento: todo son arreglos planos tipados.
//   - El nombre de cada elemento se guarda como RANGO DE BYTES sobre el
//     documento (n_ini..n_fin); solo se materializa un string cuando un
//     diagnostico lo necesita de verdad.
//   - Los atributos se consultan por hash FNV-1a de 32 bits, como en JS;
//     los valores con entidades se materializan solo para los atributos que
//     las reglas necesitan (id, href, next, cond, expr, ...).
//   - Tarjan es ITERATIVO (dos pilas paralelas: nodo y cursor de aristas),
//     sin recursion y sin dependencia del tamano de la pila de la VM.
//   - El serializador JSON es un port 1:1 de `serializarInforme` del
//     contrato compartido: la garantia de salida identica byte a byte.
//
// A diferencia de JavaScript y TypeScript NO se importa nada del modulo
// compartido: el catalogo de reglas va incrustado como constantes Rust
// (reglas_gen.rs, regenerado por tools/gen-reglas.mjs).
// ============================================================================

mod reglas_gen;

use reglas_gen::regla_por_nombre;
use std::collections::{BTreeMap, HashSet};

// ===========================================================================
// Hash FNV-1a de 32 bits sobre bytes (identico al h() de JavaScript).
// ===========================================================================
#[inline(always)]
fn hash_nombre(s: &[u8]) -> u32 {
    let mut x: u32 = 0x811c_9dc5;
    for &b in s {
        x = (x ^ b as u32).wrapping_mul(0x0100_0193);
    }
    x
}

// --- Hashes de elementos usados en el camino caliente -----------------------
const H_VXML: u32 = 0x01430dd2;
const H_FORM: u32 = 0x4058c747;
const H_FIELD: u32 = 0x67826267;
const H_GOTO: u32 = 0xf5a30fe6;
const H_PROMPT: u32 = 0xdfe6493b;
const H_NOMATCH: u32 = 0xffce832b;
const H_NOINPUT: u32 = 0x45b6e32e;
const H_FILLED: u32 = 0xfa457dc9;
const H_REPROMPT: u32 = 0xbc5b2006;
const H_CATCH: u32 = 0x4288e94c;
const H_IF: u32 = 0x39386e06;
const H_ELSEIF: u32 = 0x54554c87;
const H_ELSE: u32 = 0xbdbf5bf0;
const H_BREAK: u32 = 0xc9648178;
const H_AUDIO: u32 = 0xe0613999;
const H_SCRIPT: u32 = 0x203e6faa;

// Elementos de salida (contador C.salida).
const H_EXIT: u32 = 0xcded1a85;
const H_DISCONNECT: u32 = 0x45e6feeb;
const H_RETURN: u32 = 0x85ee37bf;
const H_TRANSFER: u32 = 0xe2857f86;

// --- Hashes de atributos -----------------------------------------------------
const H_ID: u32 = 0x37386ae0;
const H_HREF: u32 = 0x9aa418d8;
const H_NEXT: u32 = 0x5cb68de8;
const H_EVENT: u32 = 0xfe30d09f;
const H_COND: u32 = 0xde404cfd;
const H_EXPR: u32 = 0xd62712ae;
const H_SRCEXPR: u32 = 0xe5d9121a;
const H_TYPE: u32 = 0x5127f14d;
const H_NAME: u32 = 0x8d39bde6;
const H_TIME: u32 = 0x5d3c9be4;
const H_SRC: u32 = 0xd33ce1c9;
const H_VERSION: u32 = 0x4671ae97;
const H_XMLLANG: u32 = 0x31281438;

// Tipos de evento (identicos al enum T del scanner de JavaScript).
const T_INICIO: u8 = 1;
const T_AUTO: u8 = 2;
const T_CIERRE: u8 = 3;
const T_TEXTO: u8 = 4;

// Indices de los contadores de subarbol.
const C_SALIDA: usize = 0;
const C_REPROMPT: usize = 1;
const C_CATCH: usize = 2;
const C_NOMATCH: usize = 3;
const C_NOINPUT: usize = 4;
const C_FILLED: usize = 5;
const C_GOTO: usize = 6;
const C_PROMPT: usize = 7;

/// Tipos validos para el atributo type de <field> (el orden no importa).
const TIPOS_FIELD: [&str; 9] = [
    "string", "number", "boolean", "currency", "date", "digits",
    "phonenumber", "time", "telephone",
];

/// Simbolos molestos para TTS: el ORDEN importa, `hallados.join(",")` del
/// contrato recorre la lista tal cual (Set de JavaScript, orden de insercion).
const SIMBOLOS_TTS: [&str; 9] = ["&", "%", "#", "$", "/", "@", "|", "+", "="];

/// Identificadores que el motor expone siempre (regla VXML015). Copia exacta
/// del Set INTEGRADOS_VOICEXML del contrato compartido.
fn es_integrado(ident: &str) -> bool {
    matches!(
        ident,
        "application" | "session" | "document" | "connection" | "phone" | "system" |
        "Math" | "String" | "Number" | "Boolean" | "Array" | "Object" | "Date" |
        "parseInt" | "parseFloat" | "isNaN" | "isFinite" | "typeof" | "void" |
        "escape" | "unescape" | "encodeURI" | "decodeURI" | "eval" | "NaN" | "Infinity" |
        "undefined" | "true" | "false" | "null" |
        "new" | "delete" | "in" | "instanceof" | "this" | "function" | "return" | "var" |
        "if" | "else" | "for" | "while" | "do" | "break" | "continue" | "switch" | "case" |
        "default" | "try" | "catch" | "finally" | "throw" | "with" | "class" | "const" |
        "let" | "yield" | "await" | "async" | "import" | "export" | "extends" | "super" |
        "static" | "get" | "set" | "of" | "enum" | "interface" | "package" | "private" |
        "protected" | "public" | "implements" |
        "application.lastresult$" | "length" | "arguments" | "callee" | "caller"
    )
}

/// Palabras clave de la sintaxis ECMAScript que se filtran antes de VXML015.
/// Copia exacta de PALABRAS_CLAVE_EXPRESION (sin la duplicacion de "typeof",
/// que un Set de JavaScript colapsa de todos modos).
fn es_clave_expresion(ident: &str) -> bool {
    matches!(
        ident,
        "var" | "new" | "delete" | "typeof" | "void" | "instanceof" | "in" | "this" | "true" |
        "false" | "null" | "undefined" | "NaN" | "Infinity" | "if" | "else" | "return" |
        "function" | "do" | "while" | "for" | "switch" | "case" | "default" | "break" |
        "continue" | "with" | "try" | "catch" | "finally" | "throw" | "class" | "const" |
        "let" | "yield" | "await" | "async" | "import" | "export" | "extends" | "super" |
        "static" | "get" | "set" | "of" | "enum" | "interface" | "package" | "private" |
        "protected" | "public" | "implements"
    )
}

// ===========================================================================
// Escaner: una pasada sobre los bytes, eventos en estructura de arrays.
// ===========================================================================

/// SoA de eventos. Cada campo es un Vec paralelo indexado por evento; los
/// atributos de los elementos viven en sus propias SoA, referenciadas por
/// (a0, n): para el evento e, los atributos son a_h[a0[e]..a0[e]+n[e]].
#[derive(Default)]
struct Eventos {
    t: Vec<u8>,
    hash: Vec<u32>,
    linea: Vec<u32>,
    col: Vec<u32>, // columna BYTE (1 + bytes desde el inicio de la linea)
    ini: Vec<u32>,
    fin: Vec<u32>,
    n_ini: Vec<u32>,
    n_fin: Vec<u32>,
    n: Vec<u32>, // numero de atributos (solo elementos)
    a0: Vec<u32>, // offset inicial en las SoA de atributos
    a_pos: Vec<u32>,
    a_len: Vec<u32>,
    a_h: Vec<u32>,
}

impl Eventos {
    fn push_elemento(
        &mut self,
        t: u8, hash: u32, linea: u32, col: u32,
        ini: usize, fin: usize, n_ini: usize, n_fin: usize,
        n_at: usize, a0: usize,
    ) {
        self.t.push(t);
        self.hash.push(hash);
        self.linea.push(linea);
        self.col.push(col);
        self.ini.push(ini as u32);
        self.fin.push(fin as u32);
        self.n_ini.push(n_ini as u32);
        self.n_fin.push(n_fin as u32);
        self.n.push(n_at as u32);
        self.a0.push(a0 as u32);
    }

    fn push_texto(&mut self, linea: u32, col: u32, ini: usize, fin: usize) {
        self.t.push(T_TEXTO);
        self.hash.push(0);
        self.linea.push(linea);
        self.col.push(col);
        self.ini.push(ini as u32);
        self.fin.push(fin as u32);
        self.n_ini.push(0);
        self.n_fin.push(0);
        self.n.push(0);
        self.a0.push(0);
    }
}

/// Localizacion minima de un evento para empujar diagnosticos.
#[derive(Clone, Copy)]
struct EvPos {
    linea: u32,
    col: u32,
    n_ini: u32,
    n_fin: u32,
}

fn es_nombre(c: u8) -> bool {
    c.is_ascii_alphabetic() || c.is_ascii_digit() ||
        c == b'_' || c == b':' || c == b'.' || c == b'-' || c == b'#'
}

fn es_espacio(c: u8) -> bool {
    c == b' ' || c == b'\n' || c == b'\t' || c == b'\r'
}

/// Busca `needle` en doc desde `from`, o None. Version lineal simple.
fn find_sub(doc: &[u8], from: usize, needle: &[u8]) -> Option<usize> {
    if from + needle.len() > doc.len() {
        return None;
    }
    for k in from..=doc.len() - needle.len() {
        if &doc[k..k + needle.len()] == needle {
            return Some(k);
        }
    }
    None
}

/// Avanza la posicion [a, b) contando saltos de linea.
fn avanzar(doc: &[u8], a: usize, b: usize, linea: &mut u32, linea_start: &mut usize) {
    for q in a..b {
        if doc[q] == b'\n' {
            *linea += 1;
            *linea_start = q + 1;
        }
    }
}

fn es_blanco(doc: &[u8], a: usize, b: usize) -> bool {
    for &c in &doc[a..b] {
        if !es_espacio(c) {
            return false;
        }
    }
    true
}

/// Escanea el documento en una pasada. No guarda la pila de balance porque
/// en esta implementacion las notas de aviso no forman parte del informe
/// canonico JSON (el contrato las deja fuera de la serializacion).
fn escanear(doc: &[u8]) -> Eventos {
    let n = doc.len();
    let mut ev = Eventos::default();
    let mut i = 0usize;
    let mut linea: u32 = 1;
    let mut linea_start = 0usize;

    while i < n {
        let c = doc[i];

        if c != b'<' {
            // --- Texto: se agrupa hasta el siguiente '<'. ---
            let mut k = i;
            while k < n && doc[k] != b'<' {
                k += 1;
            }
            if !es_blanco(doc, i, k) {
                ev.push_texto(linea, (i - linea_start) as u32 + 1, i, k);
            }
            avanzar(doc, i, k, &mut linea, &mut linea_start);
            i = k;
            continue;
        }

        let sig = if i + 1 < n { doc[i + 1] } else { 0 };

        // --- <?...?> (incluye la declaracion <?xml ... ?>) ---
        if sig == b'?' {
            let fin = find_sub(doc, i + 2, b"?>").map_or(n, |f| f);
            avanzar(doc, i, fin, &mut linea, &mut linea_start);
            i = (fin + 2).min(n);
            continue;
        }

        // --- <!--...--> comentario ---
        if sig == b'!' && doc.get(i + 2..i + 4) == Some(b"--") {
            let fin = find_sub(doc, i + 4, b"-->").map_or(n, |f| f);
            avanzar(doc, i, fin, &mut linea, &mut linea_start);
            i = (fin + 3).min(n);
            continue;
        }

        // --- <!DOCTYPE ...> y <![CDATA[...]]> ---
        if sig == b'!' {
            if doc.get(i..i + 9) == Some(b"<![CDATA[") {
                let fin = find_sub(doc, i + 9, b"]]>").map_or(n, |f| f);
                avanzar(doc, i, fin, &mut linea, &mut linea_start);
                i = (fin + 3).min(n);
                continue;
            }
            let mut k = (i + 9).min(n);
            let mut nivel = 0usize;
            while k < n {
                let x = doc[k];
                if x == b'[' {
                    nivel += 1;
                } else if x == b']' {
                    nivel = nivel.saturating_sub(1);
                } else if x == b'>' && nivel == 0 {
                    break;
                }
                k += 1;
            }
            avanzar(doc, i, k, &mut linea, &mut linea_start);
            i = (k + 1).min(n);
            continue;
        }

        // --- </...> ---
        if sig == b'/' {
            let mut j = i + 2;
            while j < n && es_nombre(doc[j]) {
                j += 1;
            }
            if j == i + 2 {
                avanzar(doc, i, j + 1, &mut linea, &mut linea_start);
                i = j + 1;
                continue;
            }
            let n_ini = i + 2;
            let hsh = hash_nombre(&doc[n_ini..j]);
            let mut k = j;
            while k < n && doc[k] != b'>' {
                k += 1;
            }
            if k >= n {
                break; // cierre sin '>': el documento termina (aviso omitido)
            }
            ev.push_elemento(T_CIERRE, hsh, linea, (i - linea_start) as u32 + 1, i, k + 1, n_ini, j, 0, 0);
            avanzar(doc, i, k + 1, &mut linea, &mut linea_start);
            i = k + 1;
            continue;
        }

        // --- '<' que no abre nada: es texto literal ---
        if !es_nombre(sig) {
            avanzar(doc, i, i + 1, &mut linea, &mut linea_start);
            i += 1;
            continue;
        }

        // --- Elemento normal ---
        let linea_tag = linea;
        let off_tag = i;
        let mut j = i + 1;
        let mut hash = 0x811c_9dc5u32;
        while j < n && es_nombre(doc[j]) {
            hash = (hash ^ doc[j] as u32).wrapping_mul(0x0100_0193);
            j += 1;
        }
        let n_ini = i + 1;
        let n_fin = j;

        let mut n_at = 0usize;
        let a0 = ev.a_h.len();
        let mut auto = false;
        let mut k = j;

        loop {
            while k < n && es_espacio(doc[k]) {
                k += 1;
            }
            if k >= n {
                break; // etiqueta sin cerrar (aviso omitido)
            }
            let x = doc[k];
            if x == b'>' {
                k += 1;
                break;
            }
            if x == b'/' {
                if k + 1 < n && doc[k + 1] == b'>' {
                    auto = true;
                    k += 2;
                    break;
                }
                k += 1;
                continue;
            }
            if !es_nombre(x) {
                k += 1;
                continue;
            }

            let mut ah = 0x811c_9dc5u32;
            while k < n {
                let y = doc[k];
                if !es_nombre(y) {
                    break;
                }
                ah = (ah ^ y as u32).wrapping_mul(0x0100_0193);
                k += 1;
            }
            let mut q = k;
            while q < n && es_espacio(doc[q]) {
                q += 1;
            }
            if q >= n || doc[q] != b'=' {
                continue; // atributo sin valor
            }
            q += 1;
            while q < n && es_espacio(doc[q]) {
                q += 1;
            }
            if q >= n {
                break; // atributo sin valor (aviso omitido)
            }
            let qc = doc[q];
            let (v_ini, v_fin, k2);
            if qc == b'"' || qc == b'\'' {
                let cierre = find_sub(doc, q + 1, &[qc]);
                v_ini = q + 1;
                v_fin = cierre.unwrap_or(n);
                k2 = match cierre {
                    Some(c) => c + 1,
                    None => n,
                };
            } else {
                let mut w = q;
                while w < n && !es_espacio(doc[w]) && doc[w] != b'>' {
                    w += 1;
                }
                v_ini = q;
                v_fin = w;
                k2 = w;
            }

            ev.a_pos.push(v_ini as u32);
            ev.a_len.push((v_fin - v_ini) as u32);
            ev.a_h.push(ah);
            n_at += 1;
            k = k2;
        }

        ev.push_elemento(
            if auto { T_AUTO } else { T_INICIO },
            hash, linea_tag, (off_tag - linea_start) as u32 + 1,
            off_tag, k, n_ini, n_fin, n_at, a0,
        );
        avanzar(doc, off_tag, k, &mut linea, &mut linea_start);
        i = k;
    }

    ev
}

// ===========================================================================
// Resolucion de entidades XML (las 5 predefinidas; el resto se deja tal cual).
// ===========================================================================

fn utf8(b: &[u8]) -> &str {
    match std::str::from_utf8(b) {
        Ok(s) => s,
        Err(_) => "\u{FFFD}",
    }
}

fn resolver_entidades(doc: &[u8]) -> String {
    if !doc.contains(&b'&') {
        return utf8(doc).to_string();
    }
    let mut r = String::with_capacity(doc.len());
    let mut ultimo = 0usize;
    let mut i = 0usize;
    let n = doc.len();
    while i < n {
        if doc[i] != b'&' {
            i += 1;
            continue;
        }
        let semi = doc[i + 1..]
            .iter()
            .position(|&b| b == b';')
            .map(|p| p + i + 1);
        match semi {
            Some(s) => {
                r.push_str(utf8(&doc[ultimo..i]));
                let ent = &doc[i + 1..s];
                match ent {
                    b"amp" => r.push('&'),
                    b"lt" => r.push('<'),
                    b"gt" => r.push('>'),
                    b"quot" => r.push('"'),
                    b"apos" => r.push('\''),
                    _ => {
                        r.push('&');
                        r.push_str(utf8(ent));
                        r.push(';');
                    }
                }
                i = s + 1;
                ultimo = i;
            }
            None => {
                r.push_str(utf8(&doc[ultimo..i + 1]));
                i += 1;
                ultimo = i;
            }
        }
    }
    r.push_str(utf8(&doc[ultimo..n]));
    r
}

// ===========================================================================
// Pasada 2: construir el modelo (contadores, formularios, saltos, reglas).
// ===========================================================================

struct Marco {
    hash: u32,
    ev: EvPos,
    es_prompt: bool,
    prompt_attr: bool,
    next_attr: bool,
    idx_form: i32,
    idx_form_padre: i32,
    snap: [u32; 8],
}

struct Campo {
    ev: EvPos,
    consume: bool,
}

struct Formulario {
    id: String,
    linea: u32,
    col: u32,
    orden: u32,
    campos: Vec<Campo>,
    tiene_salida: bool,
}

struct Salto {
    destino: String,
    ev: EvPos,
    form: i32,
}

struct Diagnostico {
    regla: &'static str,
    gravedad: &'static str,
    linea: u32,
    columna: u32,
    elemento: String,
    detalle: String,
    mensaje: &'static str,
}

struct Grafo {
    nodos: u32,
    aristas: u32,
    ciclos: u32,
    inalcanzables: Vec<String>,
    alcanzable: Vec<u8>,
}

struct Analizador<'a> {
    doc: &'a [u8],
    ev: Eventos,
    ds: Vec<Diagnostico>,
    c: [u32; 8],
    pila: Vec<Marco>,
    formularios: Vec<Formulario>,
    saltos: Vec<Salto>,
    declarados: HashSet<String>,
    alertas: HashSet<String>,
    raiz_vista: u32,
    n_elementos: u32,
    n_atributos: u32,
    n_textos: u32,
    n_prompts: u32,
    n_scripts: u32,
    profundidad_prompt: u32,
    idx_form: i32,
}

impl<'a> Analizador<'a> {
    fn nuevo(doc: &'a [u8], ev: Eventos) -> Self {
        Self {
            doc,
            ev,
            ds: Vec::new(),
            c: [0; 8],
            pila: Vec::new(),
            formularios: Vec::new(),
            saltos: Vec::new(),
            declarados: HashSet::new(),
            alertas: HashSet::new(),
            raiz_vista: 0,
            n_elementos: 0,
            n_atributos: 0,
            n_textos: 0,
            n_prompts: 0,
            n_scripts: 0,
            profundidad_prompt: 0,
            idx_form: -1,
        }
    }

    #[inline]
    fn nombre_ev(&self, ev: EvPos) -> &str {
        utf8(&self.doc[ev.n_ini as usize..ev.n_fin as usize])
    }

    #[inline]
    fn evpos(&self, ei: usize) -> EvPos {
        EvPos {
            linea: self.ev.linea[ei],
            col: self.ev.col[ei],
            n_ini: self.ev.n_ini[ei],
            n_fin: self.ev.n_fin[ei],
        }
    }

    #[inline]
    fn valor_atr(&self, ei: usize, a: usize) -> String {
        let a0 = self.ev.a0[ei] as usize;
        let ini = self.ev.a_pos[a0 + a] as usize;
        let fin = ini + self.ev.a_len[a0 + a] as usize;
        resolver_entidades(&self.doc[ini..fin])
    }

    /// Empuja un diagnostico resolviendo el catalogo incrustado.
    fn empuja(&mut self, regla: &'static str, ev: EvPos, elemento: &str, detalle: &str) {
        let r = regla_por_nombre(regla).expect("regla desconocida en el catalogo");
        self.ds.push(Diagnostico {
            regla: r.id,
            gravedad: r.gravedad,
            linea: ev.linea,
            columna: ev.col,
            elemento: elemento.to_string(),
            detalle: if detalle.is_empty() {
                String::new()
            } else {
                detalle.to_string()
            },
            mensaje: r.mensaje,
        });
    }

    fn subarbol(&self, marco: &Marco) -> [u32; 8] {
        let mut s = [0u32; 8];
        for k in 0..8 {
            s[k] = self.c[k] - marco.snap[k];
        }
        s
    }

    /// Presencia de `cond` con algun caracter que no sea espacio/tab/CR/LF.
    fn atributo_cond_no_vacio(&self, ei: usize) -> bool {
        let n = self.ev.n[ei] as usize;
        let a0 = self.ev.a0[ei] as usize;
        for a in 0..n {
            if self.ev.a_h[a0 + a] != H_COND {
                continue;
            }
            let ini = self.ev.a_pos[a0 + a] as usize;
            let fin = ini + self.ev.a_len[a0 + a] as usize;
            for &b in &self.doc[ini..fin] {
                if b != b' ' && b != b'\t' && b != b'\n' && b != b'\r' {
                    return true;
                }
            }
            return false;
        }
        false
    }

    fn pasada_2(&mut self) {
        let n_ev = self.ev.t.len();
        for ei in 0..n_ev {
            let t = self.ev.t[ei];

            // --- Texto entre elementos -----------------------------------
            if t == T_TEXTO {
                self.n_textos += 1;
                if self.profundidad_prompt > 0 {
                    let ini = self.ev.ini[ei] as usize;
                    let fin = self.ev.fin[ei] as usize;
                    let cuerpo = resolver_entidades(&self.doc[ini..fin]);
                    let mut hallados: Vec<&str> = Vec::new();
                    for s in SIMBOLOS_TTS {
                        if cuerpo.contains(s) {
                            hallados.push(s);
                        }
                    }
                    if !hallados.is_empty() {
                        // El texto vive en el elemento mas interno abierto, que
                        // no siempre es el <prompt> (puede ser <s>, <audio>...).
                        let elemento = match self.pila.last() {
                            Some(m) => self.nombre_ev(m.ev).to_string(),
                            None => "prompt".to_string(),
                        };
                        let evp = EvPos {
                            linea: self.ev.linea[ei],
                            col: self.ev.col[ei],
                            n_ini: 0,
                            n_fin: 0,
                        };
                        self.empuja(
                            "simbolo-tts-ilegible",
                            evp,
                            &elemento,
                            &hallados.join(","),
                        );
                    }
                }
                continue;
            }

            // --- Cierre de un elemento ------------------------------------
            if t == T_CIERRE {
                // Un unico </if> desapila los <elseif>/<else> abiertos Y el
                // <if> original (contrato del scanner compartido).
                if self.ev.hash[ei] == H_IF {
                    while let Some(m) = self.pila.last() {
                        if m.hash != H_ELSEIF && m.hash != H_ELSE {
                            break;
                        }
                        let m = self.pila.pop().unwrap();
                        if m.es_prompt {
                            self.profundidad_prompt -= 1;
                        }
                    }
                }
                let Some(marco) = self.pila.pop() else {
                    continue;
                };
                let sub = self.subarbol(&marco);
                if marco.es_prompt {
                    self.profundidad_prompt -= 1;
                }

                if marco.hash == H_NOMATCH {
                    if sub[C_REPROMPT] == 0 && sub[C_SALIDA] == 0 && sub[C_GOTO] == 0 {
                        self.empuja("nomatch-sin-reprompt", marco.ev, "nomatch", "");
                    }
                } else if marco.hash == H_FIELD {
                    if sub[C_PROMPT] == 0 && !marco.prompt_attr {
                        self.empuja("field-sin-prompt", marco.ev, "field", "");
                    }
                    if marco.idx_form >= 0 {
                        let idx = marco.idx_form as usize;
                        self.formularios[idx].campos.push(Campo {
                            ev: marco.ev,
                            consume: sub[C_FILLED] > 0 || marco.next_attr,
                        });
                    }
                    self.idx_form = marco.idx_form_padre;
                } else if marco.hash == H_FORM {
                    self.cerrar_formulario(&marco, &sub);
                    self.idx_form = marco.idx_form_padre;
                }
                continue;
            }

            // --- Apertura de un elemento (INICIO y AUTO) -------------------
            self.n_elementos += 1;
            self.n_atributos += self.ev.n[ei];

            // Atributos de interes, localizados por hash (ultimo gana, igual
            // que en JavaScript: el switch sobrescribe).
            let n_at = self.ev.n[ei] as usize;
            let a0 = self.ev.a0[ei] as usize;
            let mut v_id: Option<String> = None;
            let mut v_href: Option<String> = None;
            let mut v_next: Option<String> = None;
            let mut v_event: Option<String> = None;
            let mut v_type: Option<String> = None;
            let mut v_name: Option<String> = None;
            let mut v_time: Option<String> = None;
            let mut v_src: Option<String> = None;
            let mut v_expr: Option<String> = None;
            let mut v_prompt: Option<String> = None;
            let mut v_version: Option<String> = None;
            let mut v_lang: Option<String> = None;
            for a in 0..n_at {
                let ini = self.ev.a_pos[a0 + a] as usize;
                let fin = ini + self.ev.a_len[a0 + a] as usize;
                match self.ev.a_h[a0 + a] {
                    H_ID => v_id = Some(resolver_entidades(&self.doc[ini..fin])),
                    H_HREF => v_href = Some(resolver_entidades(&self.doc[ini..fin])),
                    H_NEXT => v_next = Some(resolver_entidades(&self.doc[ini..fin])),
                    H_EVENT => v_event = Some(resolver_entidades(&self.doc[ini..fin])),
                    H_TYPE => v_type = Some(resolver_entidades(&self.doc[ini..fin])),
                    H_NAME => v_name = Some(resolver_entidades(&self.doc[ini..fin])),
                    H_TIME => v_time = Some(resolver_entidades(&self.doc[ini..fin])),
                    H_SRC => v_src = Some(resolver_entidades(&self.doc[ini..fin])),
                    H_EXPR => v_expr = Some(resolver_entidades(&self.doc[ini..fin])),
                    H_PROMPT => v_prompt = Some(resolver_entidades(&self.doc[ini..fin])),
                    H_VERSION => v_version = Some(resolver_entidades(&self.doc[ini..fin])),
                    H_XMLLANG => v_lang = Some(resolver_entidades(&self.doc[ini..fin])),
                    _ => {}
                }
            }

            // Expresiones ECMAScript (VXML015), ANTES de anadir el name a los
            // declarados, para no auto-confirmar una lectura.
            let evp = self.evpos(ei);
            for a in 0..n_at {
                let h = self.ev.a_h[a0 + a];
                if h != H_COND && h != H_EXPR && h != H_SRCEXPR {
                    continue;
                }
                let ini = self.ev.a_pos[a0 + a] as usize;
                let fin = ini + self.ev.a_len[a0 + a] as usize;
                let expr = resolver_entidades(&self.doc[ini..fin]);
                self.revisar_expresion(&expr, evp);
            }

            if let Some(n) = &v_name {
                self.declarados.insert(n.clone());
            }

            let hash = self.ev.hash[ei];

            if hash == H_VXML {
                self.raiz_vista += 1;
                if self.raiz_vista == 1 {
                    if v_lang.is_none() {
                        self.empuja("sin-xml-lang", evp, "vxml", "");
                    }
                    if v_version.is_none() {
                        self.empuja("sin-version", evp, "vxml", "");
                    }
                }
            }
            if hash == H_SCRIPT {
                self.n_scripts += 1;
            }
            if hash == H_PROMPT {
                self.n_prompts += 1;
            }

            // Contadores de subarbol.
            if hash == H_EXIT || hash == H_DISCONNECT || hash == H_RETURN || hash == H_TRANSFER {
                self.c[C_SALIDA] += 1;
            }
            if hash == H_REPROMPT {
                self.c[C_REPROMPT] += 1;
            }
            if hash == H_CATCH {
                self.c[C_CATCH] += 1;
            }
            if hash == H_NOMATCH {
                self.c[C_NOMATCH] += 1;
            }
            if hash == H_NOINPUT {
                self.c[C_NOINPUT] += 1;
            }
            if hash == H_FILLED {
                self.c[C_FILLED] += 1;
            }
            if hash == H_PROMPT {
                self.c[C_PROMPT] += 1;
            }
            if hash == H_GOTO {
                self.c[C_GOTO] += 1;
            }

            if hash == H_GOTO {
                let opc = |v: &Option<String>| -> String {
                    match v {
                        Some(s) => s.trim().to_string(),
                        None => String::new(),
                    }
                };
                let destino = {
                    let h = opc(&v_href);
                    if !h.is_empty() {
                        h
                    } else {
                        opc(&v_next)
                    }
                };
                let evento = opc(&v_event);
                if destino.is_empty() && evento.is_empty() {
                    self.empuja("goto-sin-destino", evp, "goto", "");
                }
                self.saltos.push(Salto {
                    destino,
                    ev: evp,
                    form: self.idx_form,
                });
            }

            if hash == H_IF || hash == H_ELSEIF {
                if !self.atributo_cond_no_vacio(ei) {
                    let el = if hash == H_IF { "if" } else { "elseif" };
                    self.empuja("if-sin-cond", evp, el, "");
                }
            }
            if hash == H_BREAK {
                if let Some(v) = &v_time {
                    if !es_tiempo_ssml(v) {
                        self.empuja("break-time-invalido", evp, "break", v);
                    }
                }
            }
            if hash == H_AUDIO {
                let hay_src = match &v_src {
                    Some(s) => !s.trim().is_empty(),
                    None => false,
                };
                let hay_expr = match &v_expr {
                    Some(s) => !s.trim().is_empty(),
                    None => false,
                };
                if !hay_src && !hay_expr {
                    self.empuja("audio-sin-fuente", evp, "audio", "");
                }
            }
            if hash == H_FIELD {
                if let Some(v) = &v_type {
                    let t = v.trim().to_lowercase();
                    if !TIPOS_FIELD.contains(&t.as_str()) {
                        self.empuja("tipo-field-invalido", evp, "field", v);
                    }
                }
            }

            // --- Abrir marco (solo si no es autocerrado) ---
            if t == T_INICIO {
                let mut marco = Marco {
                    hash,
                    ev: evp,
                    es_prompt: false,
                    prompt_attr: false,
                    next_attr: false,
                    idx_form: self.idx_form,
                    idx_form_padre: self.idx_form,
                    snap: self.c,
                };
                if hash == H_PROMPT {
                    self.profundidad_prompt += 1;
                    marco.es_prompt = true;
                }
                if hash == H_FIELD {
                    marco.prompt_attr = match &v_prompt {
                        Some(s) => !s.trim().is_empty(),
                        None => false,
                    };
                    marco.next_attr = match &v_next {
                        Some(s) => !s.trim().is_empty(),
                        None => false,
                    };
                }
                if hash == H_FORM {
                    marco.idx_form = self.formularios.len() as i32;
                    marco.idx_form_padre = self.idx_form;
                    self.idx_form = self.formularios.len() as i32;
                    self.formularios.push(Formulario {
                        id: v_id.unwrap_or_default(),
                        linea: evp.linea,
                        col: evp.col,
                        orden: self.n_elementos, // ordenElemento ya incrementado
                        campos: Vec::new(),
                        tiene_salida: false,
                    });
                }
                self.pila.push(marco);
            }
        }
    }

    fn cerrar_formulario(&mut self, marco: &Marco, sub: &[u32; 8]) {
        // Primero se copian los datos que hacen falta; despues se abandona el
        // prestamo sobre self.formularios para poder llamar a empuja.
        let (tiene_salida, campos, id) = {
            let f = &mut self.formularios[marco.idx_form as usize];
            f.tiene_salida = sub[C_SALIDA] > 0;
            let campos: Vec<(EvPos, bool)> = f.campos.iter().map(|c| (c.ev, c.consume)).collect();
            (f.tiene_salida, campos, f.id.clone())
        };
        for (ev, consume) in &campos {
            if !*consume && !tiene_salida {
                self.empuja("field-sin-consumidor", *ev, "field", "");
            }
        }
        if !campos.is_empty() && sub[C_NOMATCH] == 0 && sub[C_NOINPUT] == 0 && sub[C_CATCH] == 0 {
            self.empuja("form-sin-manejador-error", marco.ev, "form", &id);
        }
    }

    // -----------------------------------------------------------------------
    // Pasada 3: grafo de flujo entre forms.
    // -----------------------------------------------------------------------

    fn resolver_grafo(&mut self) -> Grafo {
        let n = self.formularios.len();

        // por_id ordenado (BTreeMap) para que la iteracion sea determinista;
        // el orden final lo garantiza de todos modos el sort de diagnosticos.
        let mut por_id: BTreeMap<String, Vec<usize>> = BTreeMap::new();
        for (i, f) in self.formularios.iter().enumerate() {
            if f.id.is_empty() {
                continue;
            }
            por_id.entry(f.id.clone()).or_default().push(i);
        }

        // VXML012 -- ids de form duplicados.
        for (id, lista) in &por_id {
            if lista.len() < 2 {
                continue;
            }
            for &k in &lista[1..] {
                let (linea, col) = {
                    let f = &self.formularios[k];
                    (f.linea, f.col)
                };
                let ev = EvPos {
                    linea,
                    col,
                    n_ini: 0,
                    n_fin: 0,
                };
                self.empuja("id-form-duplicado", ev, "form", id);
            }
        }

        let mut adyac: Vec<Vec<usize>> = vec![Vec::new(); n];
        let mut n_aristas = 0u32;

        let saltos = std::mem::take(&mut self.saltos);
        for s in saltos {
            let dest = s.destino.as_bytes();
            if dest.first() != Some(&b'#') {
                continue;
            }
            let id = &s.destino[1..];
            let Some(candidatos) = por_id.get(id) else {
                self.empuja("goto-a-form-inexistente", s.ev, "goto", id);
                continue;
            };
            let destino = candidatos[0];
            n_aristas += 1;
            if s.form >= 0 && (s.form as usize) < n {
                adyac[s.form as usize].push(destino);
                if s.form as usize == destino {
                    self.empuja("goto-a-si-mismo", s.ev, "goto", id);
                }
            }
        }

        // VXML002 -- forms no alcanzables. El primer form se ejecuta al entrar.
        let mut alcanzable = vec![0u8; n];
        for i in 0..n {
            for &d in &adyac[i] {
                alcanzable[d] = 1;
            }
        }
        let mut inalcanzables: Vec<String> = Vec::new();
        let mut visto: HashSet<String> = HashSet::new();
        for i in 0..n {
            if i == 0 {
                alcanzable[i] = 1;
            }
            if alcanzable[i] != 0 {
                continue;
            }
            let (linea, col, id) = {
                let f = &self.formularios[i];
                (f.linea, f.col, f.id.clone())
            };
            if !visto.contains(&id) {
                visto.insert(id.clone());
                inalcanzables.push(id.clone());
            }
            let ev = EvPos {
                linea,
                col,
                n_ini: 0,
                n_fin: 0,
            };
            self.empuja("form-inaccesible", ev, "form", &id);
        }

        // --- VXML003 -- ciclos sin salida -----------------------------------
        // Punto fijo: un form es "seguro" si su subarbol contiene una salida
        // o salta a otro form seguro.
        let mut seguro = vec![0u8; n];
        let mut trabajo: Vec<usize> = Vec::new();
        for i in 0..n {
            if self.formularios[i].tiene_salida {
                seguro[i] = 1;
                trabajo.push(i);
            }
        }
        while let Some(i) = trabajo.pop() {
            for j in 0..n {
                if seguro[j] != 0 {
                    continue;
                }
                for &d in &adyac[j] {
                    if d == i {
                        seguro[j] = 1;
                        trabajo.push(j);
                        break;
                    }
                }
            }
        }

        // Componentes fuertemente conexas del subgrafo de forms inseguros.
        let componentes = tarjan(&adyac, n, &|x| seguro[x] == 0);
        let mut ciclos: Vec<Vec<usize>> = componentes
            .into_iter()
            .filter(|c| c.len() > 1 || tiene_auto_bucle(&adyac, c))
            .collect();
        for comp in &mut ciclos {
            comp.sort_by_key(|&a| self.formularios[a].orden);
        }
        ciclos.sort_by_key(|comp| self.formularios[comp[0]].orden);

        for comp in &ciclos {
            let (ancla_id, ancla_linea, ancla_col) = {
                let f = &self.formularios[comp[0]];
                (f.id.clone(), f.linea, f.col)
            };
            let mut cadena = String::new();
            for (i, &x) in comp.iter().enumerate() {
                if i > 0 {
                    cadena.push_str(" -> ");
                }
                cadena.push_str(&self.formularios[x].id);
            }
            cadena.push_str(" -> ");
            cadena.push_str(&ancla_id);
            let ev = EvPos {
                linea: ancla_linea,
                col: ancla_col,
                n_ini: 0,
                n_fin: 0,
            };
            self.empuja("ciclo-goto-sin-salida", ev, "form", &cadena);
        }

        Grafo {
            nodos: n as u32,
            aristas: n_aristas,
            ciclos: ciclos.len() as u32,
            inalcanzables,
            alcanzable,
        }
    }

    // -----------------------------------------------------------------------
    // VXML015 -- identificadores no declarados.
    // -----------------------------------------------------------------------

    fn revisar_expresion(&mut self, expr: &str, ev: EvPos) {
        let b = expr.as_bytes();
        let n = b.len();
        let mut i = 0;
        let mut tras_punto = false;
        while i < n {
            let c = b[i];

            // Cadena: se salta entera.
            if c == b'"' || c == b'\'' {
                let q = c;
                i += 1;
                while i < n {
                    let d = b[i];
                    if d == b'\\' {
                        i += 2;
                        continue;
                    }
                    i += 1;
                    if d == q {
                        break;
                    }
                }
                tras_punto = false;
                continue;
            }

            // Numero: se salta entero.
            if c.is_ascii_digit() {
                i += 1;
                while i < n && es_digito_hex(b[i]) {
                    i += 1;
                }
                tras_punto = false;
                continue;
            }

            // Identificador.
            if es_ini_ident(c) || c == b'$' {
                let ini = i;
                while i < n && es_cuerpo_ident(b[i]) {
                    i += 1;
                }
                let ident = &expr[ini..i];
                if tras_punto {
                    tras_punto = false;
                    continue;
                }
                if es_clave_expresion(ident) || es_integrado(ident) {
                    continue;
                }
                if self.declarados.contains(ident) {
                    continue;
                }
                // Shadow variable: "equipo$" -> "equipo"
                if ident.ends_with('$') {
                    let base = &ident[..ident.len() - 1];
                    if self.declarados.contains(base) || es_integrado(base) {
                        continue;
                    }
                }
                // Clave de objeto literal: "ident :" o llamada "ident ("
                let mut j = i;
                while j < n && b[j] <= b' ' {
                    j += 1;
                }
                let sig = if j < n { b[j] } else { 0 };
                if sig == b':' || sig == b'(' {
                    continue;
                }
                let clave = format!("{}:{}:{}", ev.linea, ev.col, ident);
                if self.alertas.contains(&clave) {
                    continue;
                }
                self.alertas.insert(clave);
                let elemento = self.nombre_ev(ev).to_string();
                self.empuja("identificador-no-declarado", ev, &elemento, ident);
                continue;
            }

            tras_punto = c == b'.';
            i += 1;
        }
    }
}

fn es_ini_ident(c: u8) -> bool {
    c.is_ascii_alphabetic() || c == b'_'
}
fn es_cuerpo_ident(c: u8) -> bool {
    c.is_ascii_alphanumeric() || c == b'_' || c == b'$'
}
fn es_digito_hex(c: u8) -> bool {
    c.is_ascii_hexdigit() || c == b'.' || c == b'x' || c == b'X'
}

/// Tarjan iterativo restringido a los nodos que pasan `filtro`, identico al
/// de la implementacion JavaScript (dos pilas paralelas).
fn tarjan(adyac: &[Vec<usize>], n: usize, filtro: &dyn Fn(usize) -> bool) -> Vec<Vec<usize>> {
    let mut idx = vec![-1i32; n];
    let mut bajo = vec![0i32; n];
    let mut en_pila = vec![false; n];
    let mut pila_t: Vec<usize> = Vec::new();
    let mut pila_nodos: Vec<usize> = Vec::new();
    let mut pila_cursors: Vec<usize> = Vec::new();
    let mut componentes: Vec<Vec<usize>> = Vec::new();
    let mut contador = 0i32;

    for raiz in 0..n {
        if idx[raiz] != -1 || !filtro(raiz) {
            continue;
        }
        idx[raiz] = contador;
        bajo[raiz] = contador;
        contador += 1;
        pila_t.push(raiz);
        en_pila[raiz] = true;
        pila_nodos.push(raiz);
        pila_cursors.push(0);

        while let Some(v) = pila_nodos.last().copied() {
            let prof = pila_nodos.len() - 1;
            let vecinos = &adyac[v];
            if pila_cursors[prof] < vecinos.len() {
                let w = vecinos[pila_cursors[prof]];
                pila_cursors[prof] += 1;
                if !filtro(w) {
                    continue;
                }
                if idx[w] == -1 {
                    idx[w] = contador;
                    bajo[w] = contador;
                    contador += 1;
                    pila_t.push(w);
                    en_pila[w] = true;
                    pila_nodos.push(w);
                    pila_cursors.push(0);
                } else if en_pila[w] && idx[w] < bajo[v] {
                    bajo[v] = idx[w];
                }
                continue;
            }
            pila_nodos.pop();
            pila_cursors.pop();
            if let Some(padre) = pila_nodos.last().copied() {
                if bajo[v] < bajo[padre] {
                    bajo[padre] = bajo[v];
                }
            }
            if bajo[v] == idx[v] {
                let mut comp = Vec::new();
                loop {
                    let w = pila_t.pop().unwrap();
                    en_pila[w] = false;
                    comp.push(w);
                    if w == v {
                        break;
                    }
                }
                componentes.push(comp);
            }
        }
    }
    componentes
}

fn tiene_auto_bucle(adyac: &[Vec<usize>], comp: &[usize]) -> bool {
    if comp.len() != 1 {
        return false;
    }
    for &d in &adyac[comp[0]] {
        if d == comp[0] {
            return true;
        }
    }
    false
}

// ===========================================================================
// Utilidades
// ===========================================================================

/** `time` de SSML: numero de segundos, o numero seguido de unidad. */
fn es_tiempo_ssml(s: &str) -> bool {
    let t = s.trim();
    let b = t.as_bytes();
    let mut i = 0;
    let n = b.len();
    while i < n && b[i].is_ascii_digit() {
        i += 1;
    }
    if i == 0 {
        return false;
    }
    if i < n && b[i] == b'.' {
        i += 1;
        let ini = i;
        while i < n && b[i].is_ascii_digit() {
            i += 1;
        }
        if i == ini {
            return false;
        }
    }
    if i == n {
        return true;
    }
    matches!(&b[i..], b"ms" | b"s" | b"m" | b"h")
}

/// Numero de lineas: separadores + la ultima, si no termina en salto.
fn contar_lineas(doc: &[u8]) -> u32 {
    if doc.is_empty() {
        return 0;
    }
    let mut l = 0u32;
    for &b in doc {
        if b == b'\n' {
            l += 1;
        }
    }
    if doc[doc.len() - 1] == b'\n' {
        l
    } else {
        l + 1
    }
}

// ===========================================================================
// Serializacion canonica del informe (port 1:1 de serializarInforme).
// ===========================================================================

struct InformeForm {
    id: String,
    linea: u32,
    campos: u32,
    accesible: bool,
}

struct Informe {
    archivo: String,
    bytes: u32,
    lineas: u32,
    elementos: u32,
    formularios: Vec<InformeForm>,
    diagnosticos: Vec<Diagnostico>,
    grafo_nodos: u32,
    grafo_aristas: u32,
    grafo_ciclos: u32,
    inalcanzables: Vec<String>,
    estadisticas: Vec<(&'static str, u32)>,
}

fn push_u32(r: &mut String, n: u32) {
    r.push_str(&n.to_string());
}

/** Escapa una cadena para JSON sin comillas (identico a escJSON del contrato). */
fn esc_json(r: &mut String, s: &str) {
    for ch in s.chars() {
        match ch {
            '"' => r.push_str("\\\""),
            '\\' => r.push_str("\\\\"),
            '\u{8}' => r.push_str("\\b"),
            '\u{c}' => r.push_str("\\f"),
            '\n' => r.push_str("\\n"),
            '\r' => r.push_str("\\r"),
            '\t' => r.push_str("\\t"),
            c if (c as u32) < 0x20 || (c as u32) > 0x7e => {
                let h = format!("{:X}", c as u32);
                r.push_str("\\u");
                for _ in 0..(4usize.saturating_sub(h.len())) {
                    r.push('0');
                }
                r.push_str(&h);
            }
            c => r.push(c),
        }
    }
}

fn serializar_informe(m: &Informe) -> String {
    let mut r = String::with_capacity(4096);
    r.push_str("{\"v\":1");
    r.push_str(",\"archivo\":\"");
    esc_json(&mut r, &m.archivo);
    r.push('"');
    r.push_str(",\"bytes\":");
    push_u32(&mut r, m.bytes);
    r.push_str(",\"lineas\":");
    push_u32(&mut r, m.lineas);
    r.push_str(",\"elementos\":");
    push_u32(&mut r, m.elementos);

    r.push_str(",\"formularios\":[");
    for (i, f) in m.formularios.iter().enumerate() {
        if i > 0 {
            r.push(',');
        }
        r.push_str("{\"id\":\"");
        esc_json(&mut r, &f.id);
        r.push_str("\",\"linea\":");
        push_u32(&mut r, f.linea);
        r.push_str(",\"campos\":");
        push_u32(&mut r, f.campos);
        r.push_str(",\"accesible\":");
        r.push_str(if f.accesible { "true" } else { "false" });
        r.push('}');
    }
    r.push_str("]");

    r.push_str(",\"diagnosticos\":[");
    for (i, d) in m.diagnosticos.iter().enumerate() {
        if i > 0 {
            r.push(',');
        }
        r.push_str("{\"regla\":\"");
        r.push_str(d.regla);
        r.push_str("\",\"gravedad\":\"");
        r.push_str(d.gravedad);
        r.push_str("\",\"linea\":");
        push_u32(&mut r, d.linea);
        r.push_str(",\"columna\":");
        push_u32(&mut r, d.columna);
        r.push_str(",\"elemento\":\"");
        esc_json(&mut r, &d.elemento);
        r.push('"');
        if !d.detalle.is_empty() {
            r.push_str(",\"detalle\":\"");
            esc_json(&mut r, &d.detalle);
            r.push('"');
        }
        r.push_str(",\"mensaje\":\"");
        esc_json(&mut r, d.mensaje);
        r.push_str("\"}");
    }
    r.push_str("]");

    r.push_str(",\"grafo\":{\"nodos\":");
    push_u32(&mut r, m.grafo_nodos);
    r.push_str(",\"aristas\":");
    push_u32(&mut r, m.grafo_aristas);
    r.push_str(",\"ciclos\":");
    push_u32(&mut r, m.grafo_ciclos);
    r.push_str(",\"inalcanzables\":[");
    for (i, s) in m.inalcanzables.iter().enumerate() {
        if i > 0 {
            r.push(',');
        }
        r.push('"');
        esc_json(&mut r, s);
        r.push('"');
    }
    r.push_str("]}");

    r.push_str(",\"estadisticas\":{");
    for (i, (k, v)) in m.estadisticas.iter().enumerate() {
        if i > 0 {
            r.push(',');
        }
        r.push('"');
        r.push_str(k);
        r.push_str("\":");
        push_u32(&mut r, *v);
    }
    r.push_str("}}");
    r
}

fn contar_campos(formularios: &[Formulario]) -> u32 {
    let mut t = 0u32;
    for f in formularios {
        t += f.campos.len() as u32;
    }
    t
}

// ===========================================================================
// API PUBLICA
// ===========================================================================

/**
 * Analiza un documento VoiceXML y devuelve el informe JSON canonico (String).
 */
fn analizar_bytes(doc: &[u8], nombre: &str) -> String {
    let ev = escanear(doc);
    let mut a = Analizador::nuevo(doc, ev);
    a.pasada_2();
    let n_saltos = a.saltos.len() as u32;
    let grafo = a.resolver_grafo();

    // Orden canonico de diagnosticos: (linea, columna, regla, detalle).
    a.ds.sort_by(|x, y| {
        x.linea
            .cmp(&y.linea)
            .then(x.columna.cmp(&y.columna))
            .then(x.regla.cmp(y.regla))
            .then(x.detalle.cmp(&y.detalle))
    });

    let formularios = a
        .formularios
        .iter()
        .enumerate()
        .map(|(i, f)| InformeForm {
            id: f.id.clone(),
            linea: f.linea,
            campos: f.campos.len() as u32,
            accesible: grafo.alcanzable.get(i).copied().unwrap_or(0) != 0,
        })
        .collect();

    let n_formularios = a.formularios.len() as u32;
    let n_campos = contar_campos(&a.formularios);
    let bytes = doc.len() as u32;

    let informe = Informe {
        archivo: nombre.to_string(),
        bytes,
        lineas: contar_lineas(doc),
        elementos: a.n_elementos,
        formularios,
        diagnosticos: std::mem::take(&mut a.ds),
        grafo_nodos: grafo.nodos,
        grafo_aristas: grafo.aristas,
        grafo_ciclos: grafo.ciclos,
        inalcanzables: grafo.inalcanzables,
        estadisticas: vec![
            ("elementos", a.n_elementos),
            ("atributos", a.n_atributos),
            ("formularios", n_formularios),
            ("campos", n_campos),
            ("prompts", a.n_prompts),
            ("textos", a.n_textos),
            ("saltos", n_saltos),
            ("scripts", a.n_scripts),
            ("bytes", bytes),
        ],
    };
    serializar_informe(&informe)
}

// ===========================================================================
// ABI WebAssembly
// ===========================================================================

/**
 * vxml_analizar(data, len, nombre, len_nombre, out, cap) -> usize
 *
 * Analiza el documento `data[0..len]` y escribe el informe JSON canonico en
 * `out` (hasta `cap` bytes). Devuelve SIEMPRE el tamano total del informe.
 * Si `out` es nulo o `cap` es insuficiente no se escribe nada y el llamador
 * debe volver a llamar con un buffer del tamano devuelto.
 */
#[no_mangle]
pub extern "C" fn vxml_analizar(
    data: *const u8,
    len: usize,
    nombre: *const u8,
    len_nombre: usize,
    out: *mut u8,
    cap: usize,
) -> usize {
    let doc: &[u8] = if data.is_null() || len == 0 {
        &[]
    } else {
        unsafe { std::slice::from_raw_parts(data, len) }
    };
    let nombre_bytes: &[u8] = if nombre.is_null() || len_nombre == 0 {
        &[]
    } else {
        unsafe { std::slice::from_raw_parts(nombre, len_nombre) }
    };
    let json = analizar_bytes(doc, utf8(nombre_bytes));
    let needed = json.len();
    if !out.is_null() && cap >= needed {
        unsafe {
            std::ptr::copy_nonoverlapping(json.as_ptr(), out, needed);
        }
    }
    needed
}

/// Reserva `n` bytes en el heap de Rust y devuelve el puntero. El llamador
/// debe devolverlos con vxml_dealloc.
#[no_mangle]
pub extern "C" fn vxml_alloc(n: usize) -> *mut u8 {
    let mut v: Vec<u8> = Vec::with_capacity(n);
    let p = v.as_mut_ptr();
    std::mem::forget(v);
    p
}

/// Libera `n` bytes reservados por vxml_alloc.
#[no_mangle]
pub extern "C" fn vxml_dealloc(p: *mut u8, n: usize) {
    unsafe {
        drop(Vec::from_raw_parts(p, 0, n));
    }
}

