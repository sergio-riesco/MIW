// Tratamiento de los textos que escribe el usuario antes de guardarlos y mostrarlos (pauta 4.19)
// y descripción con formato sencillo (pauta 4.15).

// Quita espacios sobrantes y pone la primera letra en mayúscula: "  vendo   bici " → "Vendo bici"
export let cleanTitle = (text) => {
    let t = (text ?? "").replace(/\s+/g, " ").trim()
    return t.charAt(0).toUpperCase() + t.slice(1)
}

// Descripción: quita espacios al final de cada línea y deja como mucho una línea en blanco seguida
export let cleanDescription = (text) =>
    (text ?? "").split("\n").map(l => l.replace(/\s+$/, "")).join("\n").replace(/\n{3,}/g, "\n\n").trim()

// Nombres propios: "  ana  garcía " → "Ana García"
export let cleanName = (text) =>
    (text ?? "").replace(/\s+/g, " ").trim().replace(/(^|\s)(\p{L})/gu, (m, s, l) => s + l.toUpperCase())

// ---- Formato de la descripción ----
// Se admite un formato mínimo: **negrita**, *cursiva* y listas con líneas que empiezan por "- ".
// Se renderiza a elementos de React (nunca HTML), así que no hay riesgo de inyectar código.

let inline = (text, keyBase) => {
    let parts = []
    let re = /(\*\*[^*\n]+\*\*|\*[^*\n]+\*)/g
    let last = 0, m, i = 0
    while ((m = re.exec(text)) != null) {
        if (m.index > last) parts.push(text.slice(last, m.index))
        let token = m[0]
        parts.push(token.startsWith("**") ?
            <strong key={keyBase + "-" + i++}>{token.slice(2, -2)}</strong> :
            <em key={keyBase + "-" + i++}>{token.slice(1, -1)}</em>)
        last = m.index + token.length
    }
    if (last < text.length) parts.push(text.slice(last))
    return parts
}

export let renderRichText = (text) => {
    // Primero se agrupan las líneas (las de lista seguidas forman una lista) y luego se crean los elementos
    let groups = []
    ;(text ?? "").split("\n").forEach((line, n) => {
        let isItem = /^\s*[-•]\s+/.test(line)
        let last = groups[groups.length - 1]
        if (isItem && last?.type == "list")
            last.items.push({ n, text: line.replace(/^\s*[-•]\s+/, "") })
        else if (isItem)
            groups.push({ type: "list", n, items: [{ n, text: line.replace(/^\s*[-•]\s+/, "") }] })
        else
            groups.push({ type: line.trim() == "" ? "blank" : "p", n, text: line })
    })
    return groups.map(g =>
        g.type == "list" ? <ul key={"ul" + g.n} className="rich-list">
                {g.items.map(it => <li key={"li" + it.n}>{inline(it.text, "li" + it.n)}</li>)}
            </ul> :
        g.type == "blank" ? <br key={"br" + g.n}/> :
            <p key={"p" + g.n} className="rich-p">{inline(g.text, "p" + g.n)}</p>)
}

// Texto plano sin marcas de formato (para cards, tablas y tooltips)
export let plainText = (text) => (text ?? "").replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\*([^*]+)\*/g, "$1")
    .replace(/^\s*[-•]\s+/gm, "· ")
