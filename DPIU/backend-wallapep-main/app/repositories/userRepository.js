const database = require("./database")

productsRepository = {
    getUserById: async (id) => {
        let user = null;
        try{
            await database.connect();
            let users = await database.query("SELECT * FROM users WHERE id = ?",[id])
            if ( users.length > 0){
                user = users[0]
            }
            await database.disconnect();
        } catch (e){
            await database.disconnect();
            console.log(e) // ERROR IN DATABASE OR SQL
        }

        return user
    },
    getUsersByEmail: async (email) => {
        let users = null;
        try{
            await database.connect();
            users = await database.query("SELECT * FROM users WHERE email = ?",[email])
            await database.disconnect();
        } catch (e){
            await database.disconnect();
            console.log(e) // ERROR IN DATABASE OR SQL
        }

        return users
	},
    getUsersByEmailAndPassword: async (email,password) => {
        let users = null;
        try{
            await database.connect();
            users = await database.query("SELECT * FROM users WHERE email = ? AND password = ?",[email,password])
            await database.disconnect();
        } catch (e){
            await database.disconnect();
            console.log(e) // ERROR IN DATABASE OR SQL
        }

        return users
	},
    createUser: async (email, password, name, surname, birthday, documentNumber, country,address, postalCode, documentIdentity) => {
        let insertInfo = null;

        try{
            await database.connect();
            insertInfo = await
                database.query("INSERT INTO users (email,password,name, surname, birthday, documentNumber, country,address, postalCode, documentIdentity) VALUES (?,?,?,?,?,?,?,?,?,?)",
                    [email,password,name, surname, birthday, documentNumber, country,address, postalCode, documentIdentity])
            await database.disconnect();
        } catch (e){
            await database.disconnect();
            console.log(e) // ERROR IN DATABASE OR SQL
        }

        return insertInfo
	}
}

module.exports = productsRepository