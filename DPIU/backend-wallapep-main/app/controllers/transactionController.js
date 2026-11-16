const transactionService = require('../services/transactionService')

transactionController = {
    getTransactionsPublic: async (req, res) => {
        try {
            let sellerId = req.query.sellerId
            let buyerId = req.query.buyerId
            let transactions = await transactionService.getTransactionsPublic(sellerId, buyerId)
            return res.json(transactions)
        }
        catch (errors) {
            return res.status(errors[0].code).json({ errors: errors} )
        }

    },
    getTransactions: async (req, res) => {
        try {
            let userId = req.infoInApiKey.id
            let productId = req.params.productId
            let transactions = await transactionService.getTransactions(userId, productId)
            return res.json(transactions)
        }
        catch (errors) {
            return res.status(errors[0].code).json({ errors: errors} )
        }

    },
    postTransaction: async (req, res) => {
        try {
            let userId = req.infoInApiKey.id
            let { productId, buyerPaymentId } = req.body
            const insertInfo = await transactionService.postTransaction( userId, productId, buyerPaymentId )
            return res.json(insertInfo)
        }catch (errors) {
            return res.status(errors[0].code).json({ errors: errors} )
        }

    },
    cancelTransaction: async (req, res) => {
        try {
            let userId = req.infoInApiKey.id
            let answer = await transactionService.cancelTransaction(userId, req.params.id)
            return res.json(answer)
        } catch (errors) {
            return res.status(errors[0].code).json({ errors: errors} )
        }
    },
}
module.exports = transactionController