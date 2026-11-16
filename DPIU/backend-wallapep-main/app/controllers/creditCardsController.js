const creditCardsService = require('../services/creditCardsService')

creditCartsController = {
    getCreditCard: async (req, res) => {
        try {
            let creditCardId = req.params.id
            let userId = req.infoInApiKey.id
            let creditCard = await creditCardsService.getCreditCard(creditCardId, userId)
            return res.json(creditCard)
        }
        catch (errors) {
            return res.status(errors[0].code).json({ errors: errors} )
        }
    },
    getCreditCards: async (req, res) => {
        try {
            let userId = req.infoInApiKey.id
            let creditCards = await creditCardsService.getCreditCards(userId)
            setTimeout(() => {
                res.json(creditCards)
            }, 10000);
        }
        catch (errors) {
            return res.status(errors[0].code).json({ errors: errors} )
        }
    },
    postCreditCard: async (req, res) => {
        try {
            let { number, expirationDate, code, alias } = req.body
            let userId = req.infoInApiKey.id
            const cart = await creditCardsService.postCreditCard( userId, number, expirationDate, code, alias)
            setTimeout(() => {
                res.json(cart)
            }, 10000);
        }catch (errors) {
            return res.status(errors[0].code).json({ errors: errors} )
        }
    },
    deleteCreditCard: async (req, res) => {
        try {
            let { id } = req.params
            let userId = req.infoInApiKey.id
            const answer = await creditCardsService.deleteCreditCard( userId,id)
            return res.json(answer)
        }catch (errors) {
            return res.status(errors[0].code).json({ errors: errors} )
        }
    }
}
module.exports = creditCartsController