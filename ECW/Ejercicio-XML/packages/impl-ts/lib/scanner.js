// scanner.ts -- convierte el texto en un arbol de nodos con tipos.
//
// En JS el scanner devuelve una lista plana de eventos con hashes, sin crear un
// objeto por etiqueta. Aqui se hace al reves: un nodo por elemento
// (NodoElemento | NodoTexto) con los atributos ya en un Map. Gasta mas memoria,
// pero el codigo de las reglas queda mas limpio, y es parte de lo que se
// compara.
//
// Lineas, columnas (en UTF-16) y agrupacion del texto son las mismas que en JS,
// para que los diagnosticos salgan en el mismo sitio. Tambien aqui un solo
// </if> cierra toda la cadena <if>/<elseif>/<else>.
// Hash FNV-1a de 32 bits sobre los codigos UTF-16 del nombre.
export function h(s) {
    let x = 0x811c9dc5 | 0;
    for (let i = 0; i < s.length; i++)
        x = Math.imul(x ^ s.charCodeAt(i), 0x01000193);
    return x >>> 0;
}
// Resuelve las 5 entidades predefinidas (como el contrato).
function resolverEntidades(texto, ini, fin) {
    let hayAmp = false;
    for (let i = ini; i < fin; i++) {
        if (texto.charCodeAt(i) === 38 /* & */) {
            hayAmp = true;
            break;
        }
    }
    if (!hayAmp)
        return texto.slice(ini, fin);
    let r = "";
    let ultimo = ini;
    let i = ini;
    while (i < fin) {
        if (texto.charCodeAt(i) !== 38) {
            i++;
            continue;
        }
        const semi = texto.indexOf(";", i + 1);
        if (semi < 0 || semi >= fin) {
            r += texto.slice(ultimo, i + 1);
            i = ultimo = i + 1;
            continue;
        }
        r += texto.slice(ultimo, i);
        const ent = texto.slice(i + 1, semi);
        switch (ent) {
            case "amp":
                r += "&";
                break;
            case "lt":
                r += "<";
                break;
            case "gt":
                r += ">";
                break;
            case "quot":
                r += '"';
                break;
            case "apos":
                r += "'";
                break;
            default:
                r += "&" + ent + ";";
                break;
        }
        i = semi + 1;
        ultimo = i;
    }
    return r + texto.slice(ultimo, fin);
}
const ASCII_LT = 60, ASCII_GT = 62, ASCII_SLASH = 47, ASCII_EQ = 61;
const ASCII_QUOT = 34, ASCII_APOS = 39, ASCII_NL = 10;
const ASCII_BANG = 33, ASCII_QUESTION = 63, ASCII_LBRACKET = 91;
const ASCII_RBRACKET = 93;
function esNombre(c) {
    return (c >= 65 && c <= 90) || (c >= 97 && c <= 122) ||
        (c >= 48 && c <= 57) || c === 95 || c === 58 || c === 46 || c === 45 || c === 35;
}
function esEspacio(c) {
    return c === 32 || c === 10 || c === 9 || c === 13;
}
function esBlanco(texto, a, b) {
    for (let i = a; i < b; i++)
        if (!esEspacio(texto.charCodeAt(i)))
            return false;
    return true;
}
// avanza linea y columna por [a, b)
function avanzar(texto, a, b, pos) {
    for (let q = a; q < b; q++) {
        if (texto.charCodeAt(q) === ASCII_NL) {
            pos.linea++;
            pos.colU16 = 1;
        }
        else {
            pos.colU16++;
        }
    }
}
// Devuelve el arbol y las notas. Las columnas van en UTF-16, como en JS; el
// paso a bytes se hace luego con el contrato.
export function escanearArbol(texto, alAdvertir) {
    const notas = [];
    const avisa = (msg, linea, col) => {
        notas.push({ msg, linea, col });
        alAdvertir?.(msg, linea, col);
    };
    const doc = { tipo: "documento", hijos: [] };
    // elementos abiertos y sus nombres
    const pila = [];
    const abiertos = [];
    let profundidad = 0;
    const pos = { i: 0, linea: 1, colU16: 1 };
    let orden = 0;
    const n = texto.length;
    while (pos.i < n) {
        const c = texto.charCodeAt(pos.i);
        const iniLinea = pos.linea, iniCol = pos.colU16;
        if (c !== ASCII_LT) {
            // texto hasta el siguiente '<' (si son solo espacios no se crea nodo)
            let k = pos.i;
            while (k < n && texto.charCodeAt(k) !== ASCII_LT)
                k++;
            if (!esBlanco(texto, pos.i, k)) {
                const nodo = {
                    tipo: "texto", texto: resolverEntidades(texto, pos.i, k),
                    linea: pos.linea, colU16: pos.colU16, padre: pila.length ? pila[pila.length - 1] : null,
                };
                if (pila.length)
                    pila[pila.length - 1].hijos.push(nodo);
                else
                    doc.hijos.push(nodo);
            }
            avanzar(texto, pos.i, k, pos);
            pos.i = k;
            continue;
        }
        const sig = pos.i + 1 < n ? texto.charCodeAt(pos.i + 1) : -1;
        // <? ... ?>
        if (sig === ASCII_QUESTION) {
            const fin = texto.indexOf("?>", pos.i + 2);
            const hasta = fin < 0 ? n : fin;
            avanzar(texto, pos.i, hasta, pos);
            pos.i = Math.min(hasta + 2, n);
            continue;
        }
        // comentario
        if (sig === ASCII_BANG && texto.startsWith("<!--", pos.i)) {
            const fin = texto.indexOf("-->", pos.i + 4);
            const hasta = fin < 0 ? n : fin;
            avanzar(texto, pos.i, hasta, pos);
            pos.i = Math.min(hasta + 3, n);
            continue;
        }
        // <!DOCTYPE ...> y <![CDATA[...]]>
        if (sig === ASCII_BANG) {
            if (texto.startsWith("<![CDATA[", pos.i)) {
                const fin = texto.indexOf("]]>", pos.i + 9);
                const hasta = fin < 0 ? n : fin;
                avanzar(texto, pos.i, hasta, pos);
                pos.i = Math.min(hasta + 3, n);
                continue;
            }
            let k = pos.i + 9;
            let nivel = 0;
            while (k < n) {
                const x = texto.charCodeAt(k);
                if (x === ASCII_LBRACKET)
                    nivel++;
                else if (x === ASCII_RBRACKET)
                    nivel--;
                else if (x === ASCII_GT && nivel <= 0)
                    break;
                k++;
            }
            const etiqueta = texto.slice(pos.i, Math.min(pos.i + 9, n));
            if (etiqueta.toUpperCase().startsWith("<!DOCTYPE") &&
                texto.slice(pos.i, k).toUpperCase().includes("<!ENTITY")) {
                avisa("DTD interno con ENTITY no admitido: se ignora para evitar expansion recursiva.", iniLinea, iniCol);
            }
            avanzar(texto, pos.i, k, pos);
            pos.i = Math.min(k + 1, n);
            continue;
        }
        // cierre
        if (sig === ASCII_SLASH) {
            let j = pos.i + 2;
            while (j < n && esNombre(texto.charCodeAt(j)))
                j++;
            if (j === pos.i + 2) {
                avanzar(texto, pos.i, pos.i + 1, pos);
                pos.i++;
                continue;
            }
            const nombre = texto.slice(pos.i + 2, j);
            let k = j;
            while (k < n && texto.charCodeAt(k) !== ASCII_GT)
                k++;
            if (k >= n) {
                avisa("Cierre de etiqueta sin '>'.", iniLinea, iniCol);
                break;
            }
            if (profundidad > 0) {
                // un solo </if> cierra toda la cadena <if>/<elseif>/<else>
                if (nombre === "if") {
                    while (profundidad > 0 &&
                        (abiertos[profundidad - 1] === "elseif" || abiertos[profundidad - 1] === "else")) {
                        pila.pop();
                        abiertos.pop();
                        profundidad--;
                    }
                    if (profundidad > 0 && abiertos[profundidad - 1] === "if") {
                        pila.pop();
                        abiertos.pop();
                        profundidad--;
                    }
                    else if (profundidad > 0) {
                        avisa(`Esperaba </${abiertos[profundidad - 1]}> pero encontre </if>.`, iniLinea, iniCol);
                        pila.pop();
                        abiertos.pop();
                        profundidad--;
                    }
                }
                else {
                    const abierto = abiertos[profundidad - 1];
                    if (abierto !== nombre) {
                        avisa(`Esperaba </${abierto}> pero encontre </${nombre}>.`, iniLinea, iniCol);
                    }
                    pila.pop();
                    abiertos.pop();
                    profundidad--;
                }
            }
            else {
                avisa(`Cierre </${nombre}> sin etiqueta abierta.`, iniLinea, iniCol);
            }
            avanzar(texto, pos.i, k + 1, pos);
            pos.i = k + 1;
            continue;
        }
        // '<' suelto: texto
        if (sig < 0 || !esNombre(sig)) {
            avanzar(texto, pos.i, pos.i + 1, pos);
            pos.i++;
            continue;
        }
        // apertura
        let j = pos.i + 1;
        let hash = 0x811c9dc5 | 0;
        while (j < n) {
            const x = texto.charCodeAt(j);
            if (!esNombre(x))
                break;
            hash = Math.imul(hash ^ x, 0x01000193);
            j++;
        }
        const nombre = texto.slice(pos.i + 1, j);
        hash = hash >>> 0;
        const atributos = new Map();
        let nAtributosRaw = 0;
        let autoCerrado = false;
        let k = j;
        for (;;) {
            while (k < n && esEspacio(texto.charCodeAt(k)))
                k++;
            if (k >= n) {
                avisa("Etiqueta sin cerrar.", iniLinea, iniCol);
                break;
            }
            const x = texto.charCodeAt(k);
            if (x === ASCII_GT) {
                k++;
                break;
            }
            if (x === ASCII_SLASH) {
                if (k + 1 < n && texto.charCodeAt(k + 1) === ASCII_GT) {
                    autoCerrado = true;
                    k += 2;
                    break;
                }
                k++;
                continue;
            }
            if (!esNombre(x)) {
                k++;
                continue;
            }
            // nombre y hash
            const aIni = k;
            let ah = 0x811c9dc5 | 0;
            while (k < n) {
                const y = texto.charCodeAt(k);
                if (!esNombre(y))
                    break;
                ah = Math.imul(ah ^ y, 0x01000193);
                k++;
            }
            ah = ah >>> 0;
            const aNombre = texto.slice(aIni, k);
            void ah;
            // espacios hasta el '='
            let q = k;
            while (q < n && esEspacio(texto.charCodeAt(q)))
                q++;
            if (q >= n || texto.charCodeAt(q) !== ASCII_EQ)
                continue; // atributo sin valor
            q++;
            while (q < n && esEspacio(texto.charCodeAt(q)))
                q++;
            if (q >= n) {
                avisa("Atributo sin valor.", iniLinea, iniCol);
                break;
            }
            // valor
            const qc = texto.charCodeAt(q);
            let vIni, vFin;
            if (qc === ASCII_QUOT || qc === ASCII_APOS) {
                vIni = q + 1;
                const cierre = texto.indexOf(qc === ASCII_QUOT ? '"' : "'", vIni);
                vFin = cierre < 0 ? n : cierre;
                k = cierre < 0 ? n : cierre + 1;
            }
            else {
                // sin comillas: hasta espacio o '>'
                vIni = q;
                let w = q;
                while (w < n && !esEspacio(texto.charCodeAt(w)) && texto.charCodeAt(w) !== ASCII_GT)
                    w++;
                vFin = w;
                k = w;
            }
            atributos.set(aNombre, resolverEntidades(texto, vIni, vFin));
            nAtributosRaw++;
        }
        const nodo = {
            tipo: "elemento", nombre, hash, linea: iniLinea, colU16: iniCol, orden: orden++,
            autocerrado: autoCerrado, atributos, nAtributos: nAtributosRaw, hijos: [],
            padre: pila.length ? pila[pila.length - 1] : null,
        };
        if (pila.length)
            pila[pila.length - 1].hijos.push(nodo);
        else
            doc.hijos.push(nodo);
        if (!autoCerrado) {
            pila.push(nodo);
            abiertos[profundidad++] = nombre;
        }
        avanzar(texto, pos.i, k, pos);
        pos.i = k;
    }
    if (profundidad > 0) {
        avisa(`Quedan ${profundidad} etiqueta(s) sin cerrar: ${abiertos.slice(0, profundidad).join(", ")}.`, pos.linea, pos.colU16);
    }
    return { doc, notas };
}
