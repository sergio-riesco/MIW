export const MOCKUP_IMAGE = "/imageMockup.png"

// La foto de un producto se guarda en el backend como /images/{id}.png
export let productImageUrl = (productId) =>
    process.env.NEXT_PUBLIC_BACKEND_BASE_URL + "/images/" + productId + ".png"

// Si la foto no existe (producto sin imagen) el <img> falla y se cambia por el mockup.
// Se comprueba que no sea ya el mockup para no entrar en bucle si también fallara.
export let onImageError = (event) => {
    let img = event.currentTarget
    if (!img.src.endsWith(MOCKUP_IMAGE))
        img.src = MOCKUP_IMAGE
}

// Añade a cada producto el atributo image con la URL de su foto.
// Antes se descargaba la foto de TODOS los productos para comprobar si existía, y la página no se
// pintaba hasta terminar (con cientos de productos, cientos de descargas). Ahora no se descarga nada
// aquí: cada <img> carga solo su foto cuando es visible (loading="lazy") y, si no existe, onImageError
// pone el mockup.
export let addImagesToProducts = (products) =>
    products.map(p => {
        p.image = productImageUrl(p.id)
        return p
    })
