// Peticiones de productos que se usan desde varios componentes.
// Todas devuelven la lista de errores con mensajes descriptivos (vacía si ha ido bien), ver UtilsApi.
import { apiRequest } from "./UtilsApi";

// Precio con formato de moneda: 1.234,5 → "1.234,50 €"
export let formatPrice = (price) => {
    if (price == null)
        return "-"
    return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", useGrouping: "always",
        minimumFractionDigits: price % 1 == 0 ? 0 : 2 }).format(price)
}

// "1 sale" / "3 sales"
export let plural = (count, singular, pluralWord = singular + "s") =>
    count + " " + (count == 1 ? singular : pluralWord)

export let isSold = (product) => product.buyerId != null || product.buyerEmail != null

// DELETE /products/:id
export let deleteProduct = async (productId) => {
    let { ok, data, errors } = await apiRequest("DELETE", "/products/" + productId)
    if (ok && !data?.deleted)
        return [{ msg: "The product could not be deleted. Reload the page and try again." }]
    return errors
}

// POST /transactions: compra un producto. Devuelve { errors, transactionId } para poder deshacerla
export let buyProduct = async (productId) => {
    let { ok, data, errors } = await apiRequest("POST", "/transactions/", { productId })
    if (ok && data?.affectedRows != 1)
        return { errors: [{ msg: "The product could not be bought. Reload the page and try again." }] }
    return { errors, transactionId: data?.insertId }
}

// DELETE /transactions/:id: deshace una compra (solo en los 2 minutos siguientes)
export let cancelPurchase = async (transactionId) => {
    let { errors } = await apiRequest("DELETE", "/transactions/" + transactionId)
    return errors
}

// PUT /products/:id: el backend necesita todos los campos editables
export let updateProduct = async (product) => {
    let { errors } = await apiRequest("PUT", "/products/" + product.id, {
        title: product.title,
        description: product.description,
        price: product.price,
        category: product.category,
    })
    return errors
}

// Galería de fotos de un producto: lista de URLs completas, la primera es la principal
export let getProductImages = async (productId) => {
    let { ok, data } = await apiRequest("GET", "/products/" + productId + "/images")
    return ok ? data.images.map(i => process.env.NEXT_PUBLIC_BACKEND_BASE_URL + i) : []
}

let imagesResult = ({ ok, data, errors }) =>
    ({ errors, images: ok ? data.images.map(i => process.env.NEXT_PUBLIC_BACKEND_BASE_URL + i) : null })

export let addProductImages = async (productId, files) => {
    let form = new FormData()
    files.forEach(f => form.append("images", f))
    return imagesResult(await apiRequest("POST", "/products/" + productId + "/images", form, { form: true }))
}

export let deleteProductImage = async (productId, imageUrl) =>
    imagesResult(await apiRequest("DELETE", "/products/" + productId + "/images/" + imageUrl.split("/").pop()))

export let setMainProductImage = async (productId, imageUrl) =>
    imagesResult(await apiRequest("PUT", "/products/" + productId + "/images/" + imageUrl.split("/").pop() + "/main"))

// Columnas del grid de cards de producto, iguales en todas las vistas (home, listado, perfil)
export const productGridCol = { xs: 12, md: 8, lg: 6 }
