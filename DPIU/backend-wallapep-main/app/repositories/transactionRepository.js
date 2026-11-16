const database = require("./database")

// Datos completos de la transacción + producto + emails de comprador y vendedor.
// Los alias del final pisan las columnas homónimas de products.* (id, buyerId, sellerId)
const TRANSACTION_SELECT = "SELECT transactions.*, products.*, transactions.id as tid, " +
    "transactions.buyerId as buyerId, transactions.sellerId as sellerId, " +
    "buyer.email as buyerEmail, buyer.name as buyerName, seller.email as sellerEmail, seller.name as sellerName " +
    "FROM transactions LEFT JOIN products ON products.id = transactions.productId " +
    "LEFT JOIN users buyer ON buyer.id = transactions.buyerId " +
    "LEFT JOIN users seller ON seller.id = transactions.sellerId "

// Datos públicos de la transacción (sin dirección ni medio de pago)
const TRANSACTION_PUBLIC_SELECT = "SELECT transactions.id, transactions.productId, transactions.buyerId, transactions.sellerId, " +
    "transactions.productPrice, transactions.startDate, products.title, products.category, " +
    "buyer.email as buyerEmail, buyer.name as buyerName, seller.email as sellerEmail, seller.name as sellerName " +
    "FROM transactions LEFT JOIN products ON products.id = transactions.productId " +
    "LEFT JOIN users buyer ON buyer.id = transactions.buyerId " +
    "LEFT JOIN users seller ON seller.id = transactions.sellerId "

transactionRepository = {
    getTransactionPublicBySeller: async (sellerId) => {
        let transactions = null;

        try{
            await database.connect();
            transactions = await database.query(TRANSACTION_PUBLIC_SELECT + "WHERE transactions.sellerId = ?",[sellerId])
            await database.disconnect();
        } catch (e){
            await database.disconnect();
            console.log(e) // ERROR IN DATABASE OR SQL
        }
        return transactions
    },
    getTransactionPublicByBuyer: async (buyerId) => {
        let transactions = null;

        try{
            await database.connect();
            transactions = await database.query(TRANSACTION_PUBLIC_SELECT + "WHERE transactions.buyerId = ?",[buyerId])
            await database.disconnect();
        } catch (e){
            await database.disconnect();
            console.log(e) // ERROR IN DATABASE OR SQL
        }
        return transactions
    },
    getTransactionsByUserIdAndProductId: async (userId, productId) => {
        let transactions = null;

        try{
            await database.connect();
            transactions = await database.query(TRANSACTION_SELECT + "WHERE (transactions.buyerId = ? OR transactions.sellerId = ?) AND transactions.productId = ?",[userId,userId,productId])
            await database.disconnect();
        } catch (e){
            await database.disconnect();
            console.log(e) // ERROR IN DATABASE OR SQL
        }
        return transactions
    },
    getTransactionsByProductId: async (productId) => {
        let transactions = null;

        try{
            await database.connect();
            transactions = await database.query(TRANSACTION_SELECT + "WHERE transactions.productId = ?",[productId])
            await database.disconnect();
        } catch (e){
            await database.disconnect();
            console.log(e) // ERROR IN DATABASE OR SQL
        }
        return transactions
    },
    getTransactions: async (userId) => {
        let transactions = null;

        try{
            await database.connect();
            transactions = await database.query(TRANSACTION_SELECT + "WHERE transactions.buyerId = ? OR transactions.sellerId = ?",[userId,userId])
            await database.disconnect();
        } catch (e){
            await database.disconnect();
            console.log(e) // ERROR IN DATABASE OR SQL
        }
        return transactions
    },
    getTransaction: async (transactionId) => {
        let transaction = null;

        try{
            await database.connect();
            let transactions = await database.query(TRANSACTION_SELECT + "WHERE transactions.id = ?",[transactionId])
            if ( transactions.length > 0){
                transaction = transactions[0]
            }
            await database.disconnect();
        } catch (e){
            await database.disconnect();
            console.log(e) // ERROR IN DATABASE OR SQL
        }
        return transaction
    },
    addTransaction: async (buyerId, sellerId, buyerCountry, buyerAddress, buyerPostCode, productId, productPrice, buyerPaymentId) => {
        let insertInfo = null;
        try{
            await database.connect();
            insertInfo = await database.query("INSERT INTO transactions (buyerId, sellerId, buyerCountry, buyerAddress, buyerPostCode, productId, productPrice, buyerPaymentId, startDate) VALUES (?,?,?,?,?,?,?,?,?)",
                [buyerId, sellerId, buyerCountry, buyerAddress, buyerPostCode, productId, productPrice, buyerPaymentId, Date.now()])

            await database.disconnect();
        } catch (e){
            await database.disconnect();
            console.log(e) // ERROR IN DATABASE OR SQL
        }

        return insertInfo
    },
    // Deshacer una compra (pauta 5.3)
    deleteTransaction: async (transactionId) => {
        let info = null;
        try{
            await database.connect();
            info = await database.query("DELETE FROM transactions WHERE id = ?", [transactionId])
            await database.disconnect();
        } catch (e){
            await database.disconnect();
            console.log(e)
        }
        return info
    },
    getTransactionById: async (transactionId) => {
        let rows = null;
        try{
            await database.connect();
            rows = await database.query("SELECT * FROM transactions WHERE id = ?", [transactionId])
            await database.disconnect();
        } catch (e){
            await database.disconnect();
            console.log(e)
        }
        return rows?.[0] ?? null
    }
}
module.exports = transactionRepository