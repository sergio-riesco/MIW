// vxml-lint.ts -- el analizador en TypeScript.
//
// A diferencia de la version JS, aqui se trabaja sobre un arbol de nodos con
// tipos (scanner.ts) y las reglas se eligen con un switch sobre el nombre del
// elemento. Los contadores de subarbol funcionan igual que en JS. Tarjan es
// recursivo: queda mas claro y un documento VoiceXML no tiene tantos forms
// como para llenar la pila.
//
// Todo el estado va en una instancia de AnalizadorVxml por documento. La
// serializacion del informe es la del contrato, la misma para las tres.
import { escanearArbol } from "./scanner.js";
import { CATALOGO, INDICE_NOMBRE, TIPOS_FIELD, SIMBOLOS_TTS, INTEGRADOS_VOICEXML, PALABRAS_CLAVE_EXPRESION, ELEMENTOS_SALIDA, serializarInforme, ordenarDiagnosticos, crearColumnas, } from "./contrato.js";
const NUEVOS_CONTADORES = () => ({
    salida: 0, reprompt: 0, catch: 0, nomatch: 0,
    noinput: 0, filled: 0, goto: 0, prompt: 0,
});
// nombres de las reglas (como en el catalogo)
const REGLA = {
    gotoInexistente: "goto-a-form-inexistente",
    formInaccesible: "form-inaccesible",
    cicloSinSalida: "ciclo-goto-sin-salida",
    fieldSinPrompt: "field-sin-prompt",
    fieldSinConsumidor: "field-sin-consumidor",
    nomatchSinReprompt: "nomatch-sin-reprompt",
    sinXmlLang: "sin-xml-lang",
    gotoSinDestino: "goto-sin-destino",
    tipoFieldInvalido: "tipo-field-invalido",
    breakTimeInvalido: "break-time-invalido",
    ifSinCond: "if-sin-cond",
    idFormDuplicado: "id-form-duplicado",
    audioSinFuente: "audio-sin-fuente",
    simboloTtsIlegible: "simbolo-tts-ilegible",
    identificadorNoDeclarado: "identificador-no-declarado",
    formSinManejadorError: "form-sin-manejador-error",
    gotoSIMismo: "goto-a-si-mismo",
    sinVersion: "sin-version",
};
// --- Analizador (uno por documento) ---
class AnalizadorVxml {
    texto;
    nombreArchivo;
    bytes;
    columnas;
    C = NUEVOS_CONTADORES();
    marcos = [];
    formularios = [];
    saltos = [];
    declarados = new Set();
    alertas = new Set();
    ds = [];
    raizVista = 0;
    nElementos = 0;
    nAtributos = 0;
    nTextos = 0;
    nPrompts = 0;
    nScripts = 0;
    profundidadPrompt = 0;
    idxForm = -1;
    constructor(texto, nombreArchivo, src) {
        this.texto = texto;
        this.nombreArchivo = nombreArchivo;
        this.bytes = src ?? new TextEncoder().encode(texto);
        this.columnas = crearColumnas(this.bytes, texto);
    }
    // anade un diagnostico con los datos del catalogo
    empuja(nombreRegla, ev, detalle) {
        const idx = INDICE_NOMBRE.get(nombreRegla);
        if (idx === undefined)
            throw new Error("Regla desconocida en el catalogo: " + nombreRegla);
        const r = CATALOGO.reglas[idx];
        this.ds.push({
            regla: r.id, gravedad: r.gravedad,
            linea: ev.linea, columna: 0, elemento: ev.nombre,
            detalle: detalle || "", mensaje: r.mensaje,
            colU16: ev.colU16,
        });
    }
    analizar() {
        const notas = [];
        const { doc } = escanearArbol(this.texto, (msg, linea, colu) => {
            notas.push({ msg, linea, col: this.columnas.columnaByte(colu, linea) });
        });
        // pasada 2: recorrer el arbol en preorden
        const pilaWalk = [];
        for (let k = doc.hijos.length - 1; k >= 0; k--)
            pilaWalk.push({ nodo: doc.hijos[k], cerrado: false });
        while (pilaWalk.length) {
            const item = pilaWalk.pop();
            if (item.cerrado) {
                this.cerrarNodo(item.nodo);
                continue;
            }
            if (item.nodo.tipo === "texto") {
                this.procesarTexto(item.nodo);
                continue;
            }
            const nodo = item.nodo;
            this.abrirNodo(nodo);
            // <x/> no abre marco ni tiene cierre (igual que en JS)
            if (!nodo.autocerrado)
                pilaWalk.push({ nodo, cerrado: true });
            for (let k = nodo.hijos.length - 1; k >= 0; k--)
                pilaWalk.push({ nodo: nodo.hijos[k], cerrado: false });
        }
        // pasada 3: grafo entre forms
        const grafo = this.resolverGrafo();
        // informe
        const diagnosticos = this.ds.map((d) => ({
            regla: d.regla, gravedad: d.gravedad, linea: d.linea,
            columna: this.columnas.columnaByte(d.colU16, d.linea),
            elemento: d.elemento, detalle: d.detalle, mensaje: d.mensaje,
        }));
        ordenarDiagnosticos(diagnosticos);
        return {
            archivo: this.nombreArchivo,
            bytes: this.bytes.length,
            lineas: contarLineas(this.texto),
            elementos: this.nElementos,
            formularios: this.formularios.map((f, i) => ({
                id: f.id, linea: f.linea, campos: f.campos.length, accesible: !!grafo.alcanzable[i],
            })),
            diagnosticos,
            grafo: {
                nodos: grafo.nodos, aristas: grafo.aristas,
                ciclos: grafo.ciclos, inalcanzables: grafo.inalcanzables,
            },
            estadisticas: {
                elementos: this.nElementos,
                atributos: this.nAtributos,
                formularios: this.formularios.length,
                campos: contarCampos(this.formularios),
                prompts: this.nPrompts,
                textos: this.nTextos,
                saltos: this.saltos.length,
                scripts: this.nScripts,
                bytes: this.bytes.length,
            },
            notas,
        };
    }
    // --- Apertura, cierre y texto ---
    subarbol(marco) {
        const s = NUEVOS_CONTADORES();
        Object.keys(this.C).forEach((k) => { s[k] = this.C[k] - marco.snap[k]; });
        return s;
    }
    abrirNodo(nodo) {
        // los contadores cuentan todos los elementos, tambien los <x/>
        if (ELEMENTOS_SALIDA.has(nodo.nombre))
            this.C.salida++;
        switch (nodo.nombre) {
            case "reprompt":
                this.C.reprompt++;
                break;
            case "catch":
                this.C.catch++;
                break;
            case "nomatch":
                this.C.nomatch++;
                break;
            case "noinput":
                this.C.noinput++;
                break;
            case "filled":
                this.C.filled++;
                break;
            case "prompt":
                this.C.prompt++;
                break;
            case "goto":
                this.C.goto++;
                break;
            default: break;
        }
        this.nElementos++;
        this.nAtributos += nodo.nAtributos;
        // VXML015 antes de declarar el name
        for (const [nombre, valor] of nodo.atributos) {
            if (nombre === "cond" || nombre === "expr" || nombre === "srcexpr") {
                this.revisarExpresion(valor, nodo);
            }
        }
        const vName = nodo.atributos.get("name");
        if (vName !== undefined)
            this.declarados.add(vName);
        switch (nodo.nombre) {
            case "vxml": {
                this.raizVista++;
                if (this.raizVista === 1) {
                    if (!nodo.atributos.has("xml:lang"))
                        this.empuja(REGLA.sinXmlLang, nodo, "");
                    if (!nodo.atributos.has("version"))
                        this.empuja(REGLA.sinVersion, nodo, "");
                }
                break;
            }
            case "script":
                this.nScripts++;
                break;
            case "prompt":
                this.nPrompts++;
                break;
            case "goto": {
                const vHref = nodo.atributos.get("href");
                const vNext = nodo.atributos.get("next");
                const vEvent = nodo.atributos.get("event");
                const destino = (vHref && vHref.trim()) || (vNext && vNext.trim()) || "";
                const evento = vEvent && vEvent.trim();
                if (destino === "" && !evento)
                    this.empuja(REGLA.gotoSinDestino, nodo, "");
                this.saltos.push({ destino, nodo, form: this.idxForm });
                break;
            }
            case "if":
            case "elseif": {
                if (!this.atributoCondNoVacio(nodo))
                    this.empuja(REGLA.ifSinCond, nodo, "");
                break;
            }
            case "break": {
                const vTime = nodo.atributos.get("time");
                if (vTime !== undefined && !esTiempoSSML(vTime)) {
                    this.empuja(REGLA.breakTimeInvalido, nodo, vTime);
                }
                break;
            }
            case "audio": {
                const vSrc = nodo.atributos.get("src");
                const vExpr = nodo.atributos.get("expr");
                const haySrc = vSrc !== undefined && vSrc.trim() !== "";
                const hayExpr = vExpr !== undefined && vExpr.trim() !== "";
                if (!haySrc && !hayExpr)
                    this.empuja(REGLA.audioSinFuente, nodo, "");
                break;
            }
            case "field": {
                const vType = nodo.atributos.get("type");
                if (vType !== undefined && !TIPOS_FIELD.has(vType.trim().toLowerCase())) {
                    this.empuja(REGLA.tipoFieldInvalido, nodo, vType);
                }
                break;
            }
            default: break;
        }
        // abrir marco (si no es <x/>)
        if (nodo.autocerrado)
            return;
        const marco = {
            nodo,
            snap: { ...this.C },
            esPrompt: false, promptAttr: false, nextAttr: false,
            idxForm: this.idxForm,
            idxFormPadre: this.idxForm,
        };
        switch (nodo.nombre) {
            case "prompt":
                this.profundidadPrompt++;
                marco.esPrompt = true;
                break;
            case "field": {
                const vPrompt = nodo.atributos.get("prompt");
                const vNext = nodo.atributos.get("next");
                marco.promptAttr = vPrompt !== undefined && vPrompt.trim() !== "";
                marco.nextAttr = vNext !== undefined && vNext.trim() !== "";
                break;
            }
            case "form": {
                marco.idxForm = this.formularios.length;
                marco.idxFormPadre = this.idxForm;
                this.idxForm = this.formularios.length;
                this.formularios.push({
                    id: nodo.atributos.get("id") ?? "",
                    linea: nodo.linea, colU16: nodo.colU16, orden: nodo.orden,
                    campos: [], tieneSalida: false,
                });
                break;
            }
            default: break;
        }
        this.marcos.push(marco);
    }
    cerrarNodo(nodo) {
        const marco = this.marcos.pop();
        if (!marco)
            return;
        const sub = this.subarbol(marco);
        if (marco.esPrompt)
            this.profundidadPrompt--;
        switch (nodo.nombre) {
            case "nomatch": {
                if (sub.reprompt === 0 && sub.salida === 0 && sub.goto === 0) {
                    this.empuja(REGLA.nomatchSinReprompt, nodo, "");
                }
                break;
            }
            case "field": {
                if (sub.prompt === 0 && !marco.promptAttr)
                    this.empuja(REGLA.fieldSinPrompt, nodo, "");
                if (marco.idxForm >= 0) {
                    this.formularios[marco.idxForm].campos.push({
                        nodo,
                        consume: sub.filled > 0 || marco.nextAttr,
                    });
                }
                this.idxForm = marco.idxFormPadre;
                break;
            }
            case "form": {
                this.cerrarFormulario(nodo, marco, sub);
                this.idxForm = marco.idxFormPadre;
                break;
            }
            default: break;
        }
    }
    cerrarFormulario(nodo, marco, sub) {
        const f = this.formularios[marco.idxForm];
        f.tieneSalida = sub.salida > 0;
        for (const campo of f.campos) {
            if (!campo.consume && !f.tieneSalida) {
                this.empuja(REGLA.fieldSinConsumidor, campo.nodo, "");
            }
        }
        if (f.campos.length > 0 && sub.nomatch === 0 && sub.noinput === 0 && sub.catch === 0) {
            this.empuja(REGLA.formSinManejadorError, nodo, f.id);
        }
    }
    // ¿tiene cond con algo que no sean espacios?
    atributoCondNoVacio(nodo) {
        const v = nodo.atributos.get("cond");
        if (v === undefined)
            return false;
        for (let i = 0; i < v.length; i++) {
            const c = v.charCodeAt(i);
            if (c !== 32 && c !== 9 && c !== 10 && c !== 13)
                return true;
        }
        return false;
    }
    procesarTexto(nodo) {
        this.nTextos++;
        if (this.profundidadPrompt > 0) {
            const hallados = [];
            for (const s of SIMBOLOS_TTS) {
                if (nodo.texto.includes(s))
                    hallados.push(s);
            }
            if (hallados.length) {
                const marco = this.marcos.length ? this.marcos[this.marcos.length - 1] : null;
                this.empuja(REGLA.simboloTtsIlegible, { linea: nodo.linea, colU16: nodo.colU16, nombre: marco ? marco.nodo.nombre : "prompt" }, hallados.join(","));
            }
        }
    }
    // --- Grafo entre forms ---
    // VXML001, VXML002, VXML003, VXML012 y VXML017
    resolverGrafo() {
        const formularios = this.formularios;
        const n = formularios.length;
        const porId = new Map();
        for (let i = 0; i < n; i++) {
            const id = formularios[i].id;
            if (id === "")
                continue;
            const l = porId.get(id);
            if (l)
                l.push(i);
            else
                porId.set(id, [i]);
        }
        // VXML012: ids repetidos
        for (const [id, lista] of porId) {
            if (lista.length < 2)
                continue;
            for (let k = 1; k < lista.length; k++) {
                const f = formularios[lista[k]];
                this.empuja(REGLA.idFormDuplicado, { linea: f.linea, colU16: f.colU16, nombre: "form" }, id);
            }
        }
        const adyac = Array.from({ length: n }, () => []);
        let nAristas = 0;
        for (const s of this.saltos) {
            const dest = s.destino;
            if (dest.charCodeAt(0) !== 35 /* '#' */)
                continue;
            const id = dest.slice(1);
            const candidatos = porId.get(id);
            if (!candidatos) {
                this.empuja(REGLA.gotoInexistente, s.nodo, id);
                continue;
            }
            const destino = candidatos[0];
            nAristas++;
            if (s.form >= 0 && s.form < n) {
                adyac[s.form].push(destino);
                if (s.form === destino)
                    this.empuja(REGLA.gotoSIMismo, s.nodo, id);
            }
        }
        // VXML002: forms a los que no se llega (el primero siempre se ejecuta)
        const alcanzable = new Uint8Array(n);
        for (let i = 0; i < n; i++)
            for (const d of adyac[i])
                alcanzable[d] = 1;
        const inalcanzables = [];
        const visto = new Set();
        for (let i = 0; i < n; i++) {
            if (i === 0)
                alcanzable[i] = 1;
            if (alcanzable[i])
                continue;
            const f = formularios[i];
            if (!visto.has(f.id)) {
                visto.add(f.id);
                inalcanzables.push(f.id);
            }
            this.empuja(REGLA.formInaccesible, { linea: f.linea, colU16: f.colU16, nombre: "form" }, f.id);
        }
        // VXML003: ciclos sin salida. Un form es "seguro" si tiene una salida o
        // salta a otro seguro; se repite hasta que no cambia nada.
        const seguro = new Uint8Array(n);
        const trabajo = [];
        for (let i = 0; i < n; i++)
            if (formularios[i].tieneSalida) {
                seguro[i] = 1;
                trabajo.push(i);
            }
        while (trabajo.length) {
            const i = trabajo.pop();
            for (let j = 0; j < n; j++) {
                if (seguro[j])
                    continue;
                for (const d of adyac[j]) {
                    if (d === i) {
                        seguro[j] = 1;
                        trabajo.push(j);
                        break;
                    }
                }
            }
        }
        // componentes fuertemente conexas entre los no seguros
        const componentes = tarjan(adyac, n, (i) => seguro[i] === 0);
        const ciclos = componentes.filter((c) => c.length > 1 || tieneAutoBucle(adyac, c));
        for (const comp of ciclos)
            comp.sort((a, b) => formularios[a].orden - formularios[b].orden);
        ciclos.sort((a, b) => formularios[a[0]].orden - formularios[b[0]].orden);
        for (const comp of ciclos) {
            const ancla = formularios[comp[0]];
            const cadena = comp.map((i) => formularios[i].id).join(" -> ") + " -> " + ancla.id;
            this.empuja(REGLA.cicloSinSalida, { linea: ancla.linea, colU16: ancla.colU16, nombre: "form" }, cadena);
        }
        return { nodos: n, aristas: nAristas, ciclos: ciclos.length, inalcanzables, alcanzable };
    }
    // --- VXML015: identificadores no declarados ---
    revisarExpresion(expr, ev) {
        const n = expr.length;
        let i = 0;
        let trasPunto = false;
        while (i < n) {
            const c = expr.charCodeAt(i);
            // cadena: se salta
            if (c === 34 || c === 39) {
                const q = c;
                i++;
                while (i < n) {
                    const d = expr.charCodeAt(i);
                    if (d === 92) {
                        i += 2;
                        continue;
                    }
                    i++;
                    if (d === q)
                        break;
                }
                trasPunto = false;
                continue;
            }
            // numero: se salta
            if (c >= 48 && c <= 57) {
                i++;
                while (i < n && esDigitoHex(expr.charCodeAt(i)))
                    i++;
                trasPunto = false;
                continue;
            }
            // identificador
            if (esIniIdent(c) || c === 36) {
                const ini = i;
                while (i < n && esCuerpoIdent(expr.charCodeAt(i)))
                    i++;
                const ident = expr.slice(ini, i);
                if (trasPunto) {
                    trasPunto = false;
                    continue;
                }
                if (PALABRAS_CLAVE_EXPRESION.has(ident) || INTEGRADOS_VOICEXML.has(ident))
                    continue;
                if (this.declarados.has(ident))
                    continue;
                // equipo$ -> equipo
                if (ident.charCodeAt(ident.length - 1) === 36) {
                    const base = ident.slice(0, ident.length - 1);
                    if (this.declarados.has(base) || INTEGRADOS_VOICEXML.has(base))
                        continue;
                }
                // clave de objeto "ident :" o llamada "ident ("
                let j = i;
                while (j < n && expr.charCodeAt(j) <= 32)
                    j++;
                const sig = j < n ? expr.charCodeAt(j) : -1;
                if (sig === 58 /* : */ || sig === 40 /* ( */)
                    continue;
                const clave = ev.linea + ":" + ev.colU16 + ":" + ident;
                if (this.alertas.has(clave))
                    continue;
                this.alertas.add(clave);
                this.empuja(REGLA.identificadorNoDeclarado, ev, ident);
                continue;
            }
            trasPunto = c === 46 /* . */;
            i++;
        }
    }
}
// --- API ---
// Informe en JSON (el mismo que dan JS y WASM).
export function analizarTexto(texto, nombreArchivo, src) {
    return serializarInforme(analizarDocumento(texto, nombreArchivo, src));
}
// Lo mismo, pero ya como objeto.
export function analizarDocumento(texto, nombreArchivo, src) {
    return new AnalizadorVxml(texto, nombreArchivo, src).analizar();
}
// --- Utilidades ---
// time de SSML: un numero, con unidad o sin ella
function esTiempoSSML(s) {
    const t = s.trim();
    if (/^[0-9]+(\.[0-9]+)?$/.test(t))
        return true;
    return /^[0-9]+(\.[0-9]+)?(ms|s|m|h)$/.test(t);
}
// lineas = saltos + 1 si la ultima no acaba en salto
function contarLineas(texto) {
    if (texto.length === 0)
        return 0;
    let l = 0;
    for (let i = 0; i < texto.length; i++)
        if (texto.charCodeAt(i) === 10)
            l++;
    return texto.charCodeAt(texto.length - 1) === 10 ? l : l + 1;
}
function contarCampos(formularios) {
    let t = 0;
    for (const f of formularios)
        t += f.campos.length;
    return t;
}
function esIniIdent(c) {
    return (c >= 65 && c <= 90) || (c >= 97 && c <= 122) || c === 95 /* _ */;
}
function esCuerpoIdent(c) {
    return (c >= 65 && c <= 90) || (c >= 97 && c <= 122) ||
        (c >= 48 && c <= 57) || c === 95 || c === 36 /* $ */;
}
function esDigitoHex(c) {
    return (c >= 48 && c <= 57) || (c >= 97 && c <= 102) || (c >= 65 && c <= 70) ||
        c === 46 /* . */ || c === 120 || c === 88 /* x X */;
}
// Tarjan recursivo, solo con los nodos que cumplen filtro. Las componentes
// no dependen de como se recorra el grafo, asi que salen igual que en JS y Rust.
function tarjan(adyac, n, filtro) {
    const idx = new Int32Array(n).fill(-1);
    const bajo = new Int32Array(n);
    const enPila = new Uint8Array(n);
    const pilaT = [];
    const componentes = [];
    let contador = 0;
    const visitar = (v) => {
        idx[v] = bajo[v] = contador++;
        pilaT.push(v);
        enPila[v] = 1;
        for (const w of adyac[v]) {
            if (!filtro(w))
                continue;
            if (idx[w] === -1) {
                visitar(w);
                bajo[v] = Math.min(bajo[v], bajo[w]);
            }
            else if (enPila[w]) {
                bajo[v] = Math.min(bajo[v], idx[w]);
            }
        }
        if (bajo[v] === idx[v]) {
            const comp = [];
            for (;;) {
                const w = pilaT.pop();
                enPila[w] = 0;
                comp.push(w);
                if (w === v)
                    break;
            }
            componentes.push(comp);
        }
    };
    for (let raiz = 0; raiz < n; raiz++) {
        if (idx[raiz] === -1 && filtro(raiz))
            visitar(raiz);
    }
    return componentes;
}
function tieneAutoBucle(adyac, comp) {
    if (comp.length !== 1)
        return false;
    for (const d of adyac[comp[0]])
        if (d === comp[0])
            return true;
    return false;
}
