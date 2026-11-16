// Productos ya vistos por el usuario (pauta 5.1), se guardan en el navegador
const KEY = "viewedProducts"

export let getViewedProducts = () => {
    try {
        return JSON.parse(localStorage.getItem(KEY)) ?? []
    } catch (e) {
        return []
    }
}

export let markProductViewed = (productId) => {
    let viewed = getViewedProducts()
    if (!viewed.includes(Number(productId))) {
        viewed.push(Number(productId))
        localStorage.setItem(KEY, JSON.stringify(viewed))
    }
}
