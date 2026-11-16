const usersService = require('../services/usersService')

usersController = {
	getUser: async (req, res) => {
		try {
			let id = req.params.id
			const user = await usersService.getUserById(id)
			return res.json(user)
		}
		catch (errors) {
			return res.status(errors[0].code).json({ errors: errors} )
		}
	},
	loginUser: async (req, res) => {
		try {
			let { email, password } = req.body
			const tokenAndEmail = await usersService.loginUser(email, password)
			return res.json(tokenAndEmail)
		}
		catch (errors) {
			return res.status(errors[0].code).json({ errors: errors} )
		}
	},
	postUser: async (req, res) => {
		try {
			let { email, password, name, surname, birthday,
				documentNumber, country, address, postalCode, documentIdentity } = req.body
			const userId = await usersService.createUser(email, password,  name, surname, birthday, documentNumber, country, address, postalCode,documentIdentity)
			return res.json({"userId": userId})
		}
		catch (errors) {
			return res.status(errors[0].code).json({ errors: errors} )
		}
	},
	disconnect: async (req, res) => {
		try {
			let apikey = req.headers.apikey 
			const disconnected = await usersService.disconnect(apikey)
			return res.json({"disconnected": disconnected})
		}
		catch (errors) {
			return res.status(errors[0].code).json({ errors: errors} )
		}
	},
	isActiveApiKey: async (req, res) => {
		try {
			let apiKey = req.headers.apikey
			const activeApiKey = await usersService.isActiveApiKey(apiKey)
			return res.json({"activeApiKey": activeApiKey})
		}
		catch (errors) {
			return res.status(errors[0].code).json({ errors: errors} )
		}
	}
}

module.exports = usersController