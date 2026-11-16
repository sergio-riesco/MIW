const productService = require('../services/productsService')
const imagesService = require('../services/imagesService')

// express-fileupload da un objeto si se sube un fichero y un array si son varios
let filesOf = (req, field) => {
	let f = req.files?.[field]
	return f == null ? [] : Array.isArray(f) ? f : [f]
}
let handle = (fn) => async (req, res) => {
	try {
		return res.json(await fn(req))
	} catch (errors) {
		if (!Array.isArray(errors)) { console.log(errors); errors = [{ msg: "Unexpected error with the photos", code: 500 }] }
		return res.status(errors[0].code ?? 500).json({ errors })
	}
}

productsController = {
	countProductsInCategories: async (req, res) => {
		try {
			const count = await productService.countProductsInCategories()
			return res.json(count)
		}
		catch (errors) {
			return res.status(errors[0].code).json({ errors: errors} )
		}
	},
	putProduct: async (req, res) => {
		try {
			let { title, description, price, category } = req.body
			productId = req.params.id
			userId = req.infoInApiKey.id

			const modified = await productService.putProduct(userId, productId, title, description, price, category)
			return res.json({"modified": modified})
		}
		catch (errors) {
			return res.status(errors[0].code).json({ errors: errors} )
		}
	},
	postProduct: async (req, res) => {
		try {
			let { title, description, price, category } = req.body
			userId = req.infoInApiKey.id // i put this info in the middleware

			const productId = await productService.postProduct(userId, title, description, price, category )
			return res.json({"productId": productId})
		}
		catch (errors) {
			return res.status(errors[0].code).json({ errors: errors} )
		}
	},
	getProduct: async (req, res) => {
		try {
			let id = req.params.id
			const product = await productService.getProduct(id)
			return res.json(product)
		}
		catch (errors) {
			return res.status(errors[0].code).json({ errors: errors} )
		}
	},
	getProducts: async (req, res) => {
		try {
			let { sellerId } = req.query
			const products = await productService.getProducts(sellerId)
			return res.json(products)
		}
		catch (errors) {
			return res.status(errors[0].code).json({ errors: errors} )
		}
	},
	getMyProducts: async (req, res) => {
		try {
			let userId = req.infoInApiKey.id;
			const products = await productService.getProductsOfUser(userId)
			return res.json(products)
		}
		catch (errors) {
			return res.status(errors[0].code).json({ errors: errors} )
		}
	},
	deleteProduct: async (req, res) => {
		try {
			productId = req.params.id
			userId = req.infoInApiKey.id

			const deleted = await productService.deleteProduct(userId, productId)
			return res.json({"deleted": deleted})
		}
		catch (errors) {
			return res.status(errors[0].code).json({ errors: errors} )
		}
	},
	postProductImage: async (req, res) => {
		try {
			let { id } = req.params
			let file = req.files.image
			const answer = await productService.postProductImage(file, id)
			return res.json(answer)
		}
		catch (errors) {
			return res.status(errors[0].code).json({ errors: errors} )
		}
	},
	// Galería de fotos (pauta 3.27)
	getProductImages: handle((req) => imagesService.getImages(req.params.id)),
	postProductImages: handle((req) => imagesService.addImages(req.params.id, req.infoInApiKey.id, filesOf(req, "images"))),
	deleteProductImage: handle((req) => imagesService.deleteImage(req.params.id, req.infoInApiKey.id, req.params.name)),
	setMainProductImage: handle((req) => imagesService.setMainImage(req.params.id, req.infoInApiKey.id, req.params.name)),
}

module.exports = productsController
