const database = require("./database")

creditCardsRepository = {
    getCreditCard: async (id) => {
        let creditCard = null;
        try{
            await database.connect();
            let creditCards = await database.query("SELECT * FROM creditcards WHERE id = ?",[id])
            if ( creditCards.length > 0){
                creditCard = creditCards[0]
            }
            await database.disconnect();
        } catch (e){
            await database.disconnect();
            console.log(e) // ERROR IN DATABASE OR SQL
        }

        return creditCard
    },
    getCreditCards: async (userId) => {
        let creditCards = null;
        try{
            await database.connect();
            creditCards = await database.query("SELECT * FROM creditcards WHERE userId = ?",[userId])
            await database.disconnect();
        } catch (e){
            await database.disconnect();
            console.log(e) // ERROR IN DATABASE OR SQL
        }

        return creditCards
    },
    addCreditCard: async (userId, number, expirationDate, code, alias) => {
        let insertedInfo = null;
        try{
            await database.connect();
            insertedInfo = await database.query("INSERT INTO creditcards " +
                "(userId, number, expirationDate, code, alias) VALUES (?,?,?,?,?)",[userId, number, expirationDate, code, alias])
            await database.disconnect();
        } catch (e){
            await database.disconnect();
            console.log(e) // ERROR IN DATABASE OR SQL
        }

        return insertedInfo
    },
    deleteCreditCard: async (id) => {
        let deletedInfo = null;
        try{
            await database.connect();
            deletedInfo = await database.query("DELETE FROM creditcards WHERE id=?", [id])
            await database.disconnect();
        } catch (e){
            await database.disconnect();
            console.log(e) // ERROR IN DATABASE OR SQL
        }

        return deletedInfo
    },
}
module.exports =creditCardsRepository