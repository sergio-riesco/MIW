// Peticiones al backend con errores descriptivos (pauta 5.4): qué ha pasado y qué puede hacer el usuario.
import { Button } from "antd";
import { UndoOutlined } from "@ant-design/icons";

const BASE = process.env.NEXT_PUBLIC_BACKEND_BASE_URL

// Mensajes del backend traducidos a algo que el usuario entienda y con la forma de solucionarlo
const FRIENDLY = [
    [/already has a transation|already bought/i, "Someone has just bought this product. Look for a similar one in the list."],
    [/not the owner|only change the photos of your own/i, "You can only change your own products."],
    [/title is too short/i, "The title needs at least 5 characters."],
    [/price/i, "Check the price: it must be a number of 0 or more."],
    [/apikey|api key|jwt|token/i, "Your session has expired. Log in again to continue."],
    [/Email and password dont match/i, "The email or the password is not correct. Check them and try again."],
]

export const NETWORK_ERROR = "Wallapep's server can't be reached. Check your connection and try again in a moment."

export let friendlyMessage = (msg) => {
    if (msg == null)
        return "Something went wrong. Try again in a moment."
    let found = FRIENDLY.find(([re]) => re.test(msg))
    return found ? found[1] : msg
}

// Devuelve { ok, data, errors }. errors siempre es una lista de { msg } con mensajes descriptivos
export let apiRequest = async (method, path, body, { form = false } = {}) => {
    let headers = { apikey: localStorage.getItem("apiKey") }
    if (body != null && !form)
        headers["Content-Type"] = "application/json"
    let response
    try {
        response = await fetch(BASE + path, { method, headers, body: body == null ? undefined : form ? body : JSON.stringify(body) })
    } catch (e) {
        return { ok: false, data: null, errors: [{ msg: NETWORK_ERROR }] }
    }
    let data = null
    try { data = await response.json() } catch (e) { /* respuesta sin cuerpo */ }
    if (response.ok)
        return { ok: true, data, errors: [] }
    let errors = (data?.errors ?? [{ msg: null }]).map(e => ({ ...e, msg: friendlyMessage(e.msg) }))
    return { ok: false, data, errors }
}

// Notificación con botón "Undo" durante unos segundos (pauta 5.3).
// commit se ejecuta al acabar el tiempo si no se ha deshecho; undo, al pulsar el botón.
// Devuelve una función que ejecuta ya el commit pendiente (p. ej. al salir de la página).
export let withUndo = ({ openNotification, key, message, description, seconds = 6, commit, undo }) => {
    let done = false
    let finish = () => { if (!done) { done = true; commit?.() } }
    let timer = setTimeout(finish, seconds * 1000)
    openNotification?.("bottomLeft", description, "success", {
        key, message, duration: seconds,
        btn: <Button type="primary" size="small" icon={<UndoOutlined/>} onClick={() => {
            if (done) return
            done = true
            clearTimeout(timer)
            undo?.()
        }}>Undo</Button>,
    })
    return () => { clearTimeout(timer); finish() }
}
