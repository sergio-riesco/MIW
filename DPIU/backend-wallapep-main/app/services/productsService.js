const productRepository = require('../repositories/productRepository')
const InputError = require('../errors/inputError')
const LogicError = require('../errors/logicError')

productsService = {
    countProductsInCategories: async () => {
        let errors = []

        let categories = await productRepository.countProductsInCategories();
        if ( categories == null)
            errors.push(new LogicError('Error when get the categories '+id ));

        return categories
    },
    postProduct: async (sellerId, title, description, price, category ) => {
        let errors = []

        if ( title == undefined )
            errors.push(new InputError("title",'title is undefined'));
        if ( title != null && title.length != null && title.length < 5)
            errors.push(new InputError("title",'title is too short'));
        if ( price == undefined || isNaN(price) )
            errors.push(new InputError("price",'price is not a number'));
        // Errors in client INPUTS
        if (errors.length > 0)
            throw errors

        let date = Date.now();

        let product = await productRepository.addProduct(sellerId, date, title, description, price, category);
        if ( product == null)
            errors.push(new LogicError('Error when adding the product'));

        // Errors in the logic of service
        if (errors.length > 0)
            throw errors

        return product.insertId
	},
    putProduct: async (userId, productId, title, description, price, category) => {
        let errors = []

        if ( productId == undefined )
            errors.push(new InputError("productId",'Not valid product Id'));
        if ( title == undefined )
            errors.push(new InputError("title",'title is undefined'));
        if ( title != null && title.length != null && title.length < 5)
            errors.push(new InputError("title",'title is too short'));
        if ( price == undefined || isNaN(price) )
            errors.push(new InputError("price",'price is not a number'));
        // Errors in client INPUTS
        if (errors.length > 0)
            throw errors


        let product = await productRepository.getProduct(productId);
        if ( product == null)
            errors.push(new LogicError('Product does not exists'));
        if ( product.sellerId != userId)
            errors.push(new LogicError('You are not the owner of the product'));
        if ( product.buyerId != null)
            errors.push(new LogicError('Product already has been purchased'));
        if (errors.length > 0)
            throw errors
        

        let modified = await productRepository.editProduct(productId, title, description, price, category);

        if ( modified == null)
            errors.push(new LogicError('Error when updating the product'));

        // Errors in the logic of service
        if (errors.length > 0)
            throw errors

        return true
	},
	getProduct: async (id) => {
        let errors = []

        if ( id == undefined )
            errors.push(new InputError("id",'id is undefined'));
        if ( isNaN(id))
            errors.push(new InputError("id",'id is undefined'));
        // Errors in client INPUTS
        if (errors.length > 0)
            throw errors

        let product = await productRepository.getProduct(id);
        if ( product == null)
            errors.push(new LogicError('Error when get the product '+id ));

        // Errors in the logic of service
        if (errors.length > 0)
            throw errors

        return product
	},
    getProducts: async (sellerId) => {
        let errors = []

        products = null;
        if ( sellerId == null ) {
            products = await productRepository.getProductsSummary();
        } else {
            products = await productRepository.getProductsBySeller(sellerId);
        }

        if ( products == null)
            errors.push(new LogicError('Error when get the products'));

        // Errors in the logic of service
        if (errors.length > 0)
            throw errors

        return products
	},
    getProductsOfUser: async (userId) => {
        let errors = []

        if ( userId == null)
            errors.push(new LogicError('Not user id in the apiKey'));
        if (errors.length > 0)
            throw errors

        let products = await productRepository.getProductsBySeller(userId);

        if ( products == null)
            errors.push(new LogicError('Error when get the products'));

        // Errors in the logic of service
        if (errors.length > 0)
            throw errors

        return products
	},
    deleteProduct: async (userId, productId) => {
        let errors = []

        let productToDelete = await productRepository.getProduct(productId);
        if ( productToDelete == null) {
            errors.push(new LogicError('Error when get the products'));
            throw errors
        }

        if (productToDelete.sellerId != userId){
            errors.push(new LogicError('You are not the owner of the product'));
            throw errors
        }

        if (productToDelete.buyerId != null){
            errors.push(new LogicError('Somebody already bought the product'));
            throw errors
        }

        let deleted = await productRepository.deleteProduct(productId);
        if (deleted != null) {
            const fs = require("fs")
            fs.readdirSync("public/images")
                .filter(f => f == productId + ".png" || f.startsWith(productId + "_"))
                .forEach(f => fs.unlinkSync("public/images/" + f))
        }

        if ( deleted == null)
            errors.push(new LogicError('Error when get the products'));

        // Errors in the logic of service
        if (errors.length > 0)
            throw errors

        return deleted
    },
    postProductImage: async (file, productId) => {
        let errors = []

        if (file==null)
            errors.push(new InputError("file", 'file is undefined'));
        if (productId == undefined)
            errors.push(new InputError("productId", 'productId is undefined'));
        // Errors in client INPUTS
        if (errors.length > 0)
            throw errors

        let answer = { finish: true }

        // Se ve la foto entera sobre un fondo desenfocado de ella misma (antes se recortaba)
        await require("./imagesService").processImage(file.data, "public/images/"+productId+'.png')

        return answer
    },
}

module.exports = productsService