// Compra con "Deshacer" (pauta 5.3), igual desde el listado, el detalle o el perfil de un vendedor.
import { buyProduct, cancelPurchase, formatPrice } from "./UtilsProducts";
import { withUndo } from "./UtilsApi";

// onBought se llama al comprar y onUndone si el usuario deshace la compra.
// Devuelve true si la compra se ha hecho.
export let buyWithUndo = async ({ product, openNotification, onBought, onUndone }) => {
    let { errors, transactionId } = await buyProduct(product.id)
    if (errors.length > 0) {
        errors.forEach(e => openNotification?.("top", e.msg, "error"))
        return false
    }
    onBought?.()
    let key = "buy-" + product.id
    withUndo({
        openNotification, key, seconds: 8,
        message: "Product bought",
        description: `You bought "${product.title}" for ${formatPrice(product.price)}. You will find it in My transactions.`,
        undo: async () => {
            let undoErrors = await cancelPurchase(transactionId)
            if (undoErrors.length == 0) {
                onUndone?.()
                openNotification?.("bottomLeft", `"${product.title}" is for sale again`, "info", { key, message: "Purchase undone", duration: 3 })
            } else {
                undoErrors.forEach(e => openNotification?.("top", e.msg, "error"))
            }
        },
    })
    return true
}
