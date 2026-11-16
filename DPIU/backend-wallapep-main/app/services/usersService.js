const userRepository = require('../repositories/userRepository')
const InputError = require('../errors/inputError')
const LogicError = require('../errors/logicError')
const UnauthorizedError = require('../errors/unauthorizedError')
const activeApiKeys = require("../activeApiKeys")
const jwt = require("jsonwebtoken");
const productRepository = require("../repositories/productRepository");
const crypto = require("crypto");

usersService = {
    loginUser: async (email, password) => {
        let errors = []

        if ( email == undefined || email == '')
            errors.push(new InputError("email",'name is undefined'));
        if ( password == undefined || password == '' || password.length < 3)
            errors.push(new InputError("password",'password is undefined or very short'));
        // Errors in client INPUTS
        if (errors.length > 0)
            throw errors

        let crypto = require('crypto');
        password = crypto.createHash('md5').update(password).digest('hex');

        let users = await userRepository.getUsersByEmailAndPassword(email, password);
        if ( users == null)
            errors.push(new LogicError('Error when access to users'));
        else if ( users.length == 0)
            errors.push(new UnauthorizedError('Email and password dont match'));

        // Errors in the logic of service
        if (errors.length > 0)
            throw errors

        // Generate JWT Token
        let apiKey = jwt.sign(
            { 
                email: users[0].email,
                id: users[0].id
            },
            "secret");
        activeApiKeys.push(apiKey)

        return {
            apiKey : apiKey,
            email : email,
            id: users[0].id
        }
	},
	createUser: async (email, password, name, surname, birthday,
                       documentNumber, country, address, postalCode, documentIdentity) => {
        let errors = []

        if ( email == undefined || email == '')
            errors.push(new InputError("email",'no email'));
        if ( password == undefined || password == '')
            errors.push(new InputError("password",'no password'));
        // Errors in client INPUTS
        if (errors.length > 0)
            throw errors

        let usersWithsameEmail = await userRepository.getUsersByEmail(email);
        if (usersWithsameEmail == null){
            errors.push(new LogicError('Error when check previous users'));
        } else if (usersWithsameEmail.length > 0){
            errors.push(new LogicError("email already in use"));
        }

        let user = { }
        // try to insert the user
        if ( usersWithsameEmail.length == 0){
            let crypto = require('crypto');
            password = crypto.createHash('md5').update(password).digest('hex');
            user = await userRepository.createUser(email, password, name, surname, birthday,
                documentNumber, country, address, postalCode, documentIdentity);

            if ( user == null)
                errors.push(new LogicError('Error when create the user '));
        }

        // Errors in the logic of service
        if (errors.length > 0)
            throw errors

        return user.insertId;
	},
	disconnect: async (apiKey) => {
        let errors = []

        if ( apiKey == undefined ){
            errors.push(new LogicError('Not apiKey'));
        }
        let infoInApiKey = jwt.verify(apiKey, "secret");
        if ( infoInApiKey == undefined || activeApiKeys.indexOf(apiKey) == -1){
            errors.push(new LogicError('is not a valid apikey'));
        }
   
        if (errors.length > 0)
            throw errors

        const index = activeApiKeys.indexOf(apiKey);
        if (index != -1)
            activeApiKeys.splice(index,1)

        return true;
	},
    getUserById: async (userId) => {
        let errors = []

        if ( userId == undefined ){
            errors.push(new LogicError('Not user id'));
        }

        if (errors.length > 0)
            throw errors

        let user = await userRepository.getUserById(userId)
        if ( user == null)
            errors.push(new LogicError('Error when get the user '+id ));

        // Errors in the logic of service
        if (errors.length > 0)
            throw errors

        // DAO
        let userDAO = {
            id: user.id,
            name: user.name,
            email:user.email,
            country:user.country,
            postalCode: user.postalCode
        }
        return userDAO
    },
    isActiveApiKey: async (apikey) => {
        let errors = []

        if ( apikey == undefined ){
            errors.push(new LogicError('Not apiKey'));
        }
   
        if (errors.length > 0)
            throw errors

        if( activeApiKeys.indexOf(apikey) != -1){
            return true;
        } 

        return false;
	}
}

module.exports = usersService