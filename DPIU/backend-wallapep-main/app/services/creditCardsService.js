const creditCardRepository = require('../repositories/creditCardRepository')
const InputError = require('../errors/inputError')
const LogicError = require('../errors/logicError')

creditCardsService = {
    getCreditCard: async (creditCardId, userId) => {
        let errors = []

        if (creditCardId == undefined)
            errors.push(new InputError("creditCardId", 'creditCardId is undefined'));
        if (userId == undefined)
            errors.push(new InputError("userId", 'userId is undefined'));

        if (errors.length > 0)
            throw errors

        let creditCard = await creditCardRepository.getCreditCard(creditCardId);

        if (creditCard == null)
            errors.push(new LogicError('Error when get creditCard'));
        if (creditCard?.userId != userId)
            errors.push(new LogicError('This card is not yours'));

        // Errors in the logic of service
        if (errors.length > 0)
            throw errors

        return creditCard
    },
    getCreditCards: async (userId) => {
        let errors = []

        if (userId == undefined)
            errors.push(new InputError("userId", 'userId is undefined'));

        if (errors.length > 0)
            throw errors

        let creditCards = await creditCardRepository.getCreditCards(userId);

        if (creditCards == null)
            errors.push(new LogicError('Error when get creditCards'));

        // Errors in the logic of service
        if (errors.length > 0)
            throw errors

        return creditCards
    },
    postCreditCard: async (userId, number, expirationDate, code, alias) => {
        let errors = []

        if (userId == undefined)
            errors.push(new InputError("userId", 'userId is undefined'));
        if (number == undefined)
            errors.push(new InputError("number", 'number is undefined'));
        if (expirationDate == undefined)
            errors.push(new InputError("expirationCart", 'expirationCart is undefined'));
        if (code == undefined)
            errors.push(new InputError("code", 'code is undefined'));
        if (alias == undefined)
            errors.push(new InputError("alias", 'alias is undefined'));

        if (errors.length > 0)
            throw errors

        let insertedInfo = await creditCardRepository.addCreditCard(userId, number, expirationDate, code, alias);

        if (insertedInfo == null)
            errors.push(new LogicError('Error when insert cart'));

        // Errors in the logic of service
        if (errors.length > 0)
            throw errors

        return insertedInfo
    },
    deleteCreditCard: async (userId, creditCardId) => {
        let errors = []

        if (userId == undefined)
            errors.push(new InputError("userId", 'userId is undefined'));
        if (creditCardId == undefined)
            errors.push(new InputError("id", 'id is undefined'));
        if (errors.length > 0)
            throw errors

        let creditCard = await creditCardRepository.getCreditCard(creditCardId)
        if (creditCard == null)
            errors.push(new LogicError('Error when get cart'));
        if (creditCard?.userId != userId)
            errors.push(new LogicError('Is not your credit card'));


        // Errors in the logic of service
        if (errors.length > 0)
            throw errors

        let deletedInfo = await creditCardRepository.deleteCreditCard(creditCardId);

        if (deletedInfo == null)
            errors.push(new LogicError('Error when delete cart'));

        // Errors in the logic of service
        if (errors.length > 0)
            throw errors

        return deletedInfo
    }
}
module.exports = creditCardsService