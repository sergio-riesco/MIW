const transactionRepository = require('../repositories/transactionRepository')
const userRepository = require('../repositories/userRepository')
const productRepository = require('../repositories/productRepository')
const creditCardRepository = require('../repositories/creditCardRepository')
const InputError = require('../errors/inputError')
const LogicError = require('../errors/logicError')

transactionService = {
    getTransactionsPublic: async (sellerId, buyerId) => {
        let errors = []

        let transactions = null;
        if ( sellerId != null){
            transactions = await transactionRepository.getTransactionPublicBySeller(sellerId);
        }
        if ( buyerId != null){
            transactions = await transactionRepository.getTransactionPublicByBuyer(buyerId);
        }


        if (transactions == null)
            errors.push(new LogicError('Error when get the transactions of user '));

        // Errors in the logic of service
        if (errors.length > 0)
            throw errors

        return transactions
    },
    getTransactions: async (userId, productId) => {
        let errors = []

        if (userId == undefined)
            errors.push(new InputError("userId", 'userId is undefined'));
        // Errors in client INPUTS
        if (errors.length > 0)
            throw errors

        let transactions = null;
        if ( productId == null) {
            transactions = await transactionRepository.getTransactions(userId);
        } else {
            transactions = await transactionRepository.getTransactionsByUserIdAndProductId(userId, productId);
        }

        if (transactions == null)
            errors.push(new LogicError('Error when get the transactions'));

        // Errors in the logic of service
        if (errors.length > 0)
            throw errors

        return transactions
    },
    postTransaction: async (buyerId, productId, buyerPaymentId) => {
        let errors = []

        if (buyerId == undefined)
            errors.push(new InputError("buyerId", 'buyerId is undefined'));
        if (productId == undefined)
            errors.push(new InputError("productId", 'productId is undefined'));

        // Errors in client INPUTS
        if (errors.length > 0)
            throw errors

        let product = await productRepository.getProduct(productId)
        if (product == null){
            errors.push(new LogicError('Error when get Product info'));
            throw errors
        }

        if ( buyerPaymentId != null ) {
            let creditCard = await creditCardRepository.getCreditCard(buyerPaymentId)
            if (creditCard == null) {
                errors.push(new LogicError('Error when get the credit card info'));
                throw errors
            }
            if (creditCard.userId != buyerId) {
                errors.push(new LogicError('Is not your credit card'));
                throw errors
            }
        }

        let userBuyer = await userRepository.getUserById(buyerId)
        if (userBuyer == null){
            errors.push(new LogicError('Error when get the buyer info'));
            throw errors
        }

        let productTransactions = await transactionRepository.getTransactionsByProductId(productId);
        if (productTransactions == null){
            errors.push(new LogicError('Error when get the transactions'));
            throw errors
        }
        if ( productTransactions.length > 0){
            errors.push(new LogicError('This product already has a transation'));
            throw errors
        }

        let transactionInfo = await transactionRepository.addTransaction(
            buyerId, product.sellerId, userBuyer.country, userBuyer.address, userBuyer.postalCode,
            productId, product.price, buyerPaymentId
        );

        let productInfo =await productRepository.editProductBuyer(productId, buyerId)
        if (productInfo == null){
            errors.push(new LogicError('Error when update the product'));
            throw errors
        }

        if (transactionInfo == null)
            errors.push(new LogicError('Error when add the transaction'));

        // Errors in the logic of service
        if (errors.length > 0)
            throw errors

        return transactionInfo
    },
    // Deshacer una compra: solo el comprador y solo en los 2 minutos siguientes (pauta 5.3)
    cancelTransaction: async (userId, transactionId) => {
        const UNDO_WINDOW_MS = 2 * 60 * 1000
        let transaction = await transactionRepository.getTransactionById(transactionId)
        if (transaction == null)
            throw [new LogicError('The purchase does not exist')]
        if (transaction.buyerId != userId)
            throw [new InputError("transactionId", 'Only the buyer can undo a purchase')]
        if (transaction.startDate == null || Date.now() - transaction.startDate > UNDO_WINDOW_MS)
            throw [new InputError("transactionId", 'The purchase can only be undone during the first 2 minutes')]

        let deleted = await transactionRepository.deleteTransaction(transactionId)
        let product = await productRepository.editProductBuyer(transaction.productId, null)
        if (deleted == null || product == null)
            throw [new LogicError('The purchase could not be undone')]
        return { cancelled: true, productId: transaction.productId }
    },
}
module.exports = transactionService