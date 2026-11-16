// La apiKey es un JWT, en su payload el backend guarda { email, id } del usuario identificado
export let getLoggedUserId = () => {
    let apiKey = localStorage.getItem("apiKey")
    if (apiKey == null)
        return null
    try {
        let base64 = apiKey.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")
        let payload = JSON.parse(atob(base64))
        return payload.id
    } catch (e) {
        return null
    }
}

// Resumen de las transacciones de un usuario: número de compras/ventas, dinero y última transacción
export let transactionsSummary = (allTransactions, userId) => {
    let transactions = [...new Map(allTransactions.map(t => [t.tid ?? t.id, t])).values()]
    let sales = transactions.filter(t => t.sellerId == userId)
    let purchases = transactions.filter(t => t.buyerId == userId)
    let oneMonthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
    let dates = transactions.map(t => t.startDate).filter(d => d != null)

    return {
        sales: sales.length,
        purchases: purchases.length,
        salesLastMonth: sales.filter(t => t.startDate >= oneMonthAgo).length,
        purchasesLastMonth: purchases.filter(t => t.startDate >= oneMonthAgo).length,
        earned: sales.reduce((total, t) => total + (t.productPrice ?? 0), 0),
        spent: purchases.reduce((total, t) => total + (t.productPrice ?? 0), 0),
        lastTransactionDate: dates.length > 0 ? Math.max(...dates) : null,
    }
}
