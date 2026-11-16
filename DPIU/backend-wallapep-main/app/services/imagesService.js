// Galería de fotos de un producto (pauta 3.27).
// La foto principal sigue siendo public/images/{id}.png (como hasta ahora) y las demás se guardan como
// public/images/{id}_{n}.png, así que no hace falta cambiar la base de datos.
const fs = require("fs")
const path = require("path")
const sharp = require("sharp")
const productRepository = require('../repositories/productRepository')
const InputError = require('../errors/inputError')
const LogicError = require('../errors/logicError')

const IMAGES_DIR = "public/images"
const MAX_IMAGES = 6
const WIDTH = 799, HEIGHT = 867

// Toda la foto se ve entera sobre un fondo con la misma foto desenfocada: nunca se recorta el producto
let processImage = async (data, file) => {
    let background = await sharp(data).resize(WIDTH, HEIGHT, { fit: "cover" }).blur(40).toBuffer()
    let foreground = await sharp(data).resize(WIDTH, HEIGHT, { fit: "inside" }).toBuffer()
    await sharp(background).composite([{ input: foreground, gravity: "center" }]).png().toFile(file)
}

let extraImages = (productId) => fs.readdirSync(IMAGES_DIR)
    .map(f => f.match(new RegExp("^" + productId + "_(\\d+)\\.png$")))
    .filter(m => m != null)
    .map(m => ({ name: m[0], n: Number(m[1]) }))
    .sort((a, b) => a.n - b.n)

let checkOwner = async (productId, userId) => {
    let product = await productRepository.getProduct(productId)
    if (product == null)
        throw [new LogicError("The product does not exist")]
    if (product.sellerId != userId)
        throw [new InputError("productId", "You can only change the photos of your own products")]
    return product
}

let imagesService = {
    processImage,

    getImages: async (productId) => {
        let images = []
        if (fs.existsSync(path.join(IMAGES_DIR, productId + ".png")))
            images.push("/images/" + productId + ".png")
        extraImages(productId).forEach(i => images.push("/images/" + i.name))
        return { images }
    },

    // Añade fotos: si el producto no tiene principal, la primera pasa a ser la principal
    addImages: async (productId, userId, files) => {
        if (files == null || files.length == 0)
            throw [new InputError("images", "Choose at least one image")]
        await checkOwner(productId, userId)

        let main = path.join(IMAGES_DIR, productId + ".png")
        let extras = extraImages(productId)
        let total = (fs.existsSync(main) ? 1 : 0) + extras.length
        if (total + files.length > MAX_IMAGES)
            throw [new InputError("images", "A product can have " + MAX_IMAGES + " photos at most")]

        let next = extras.length > 0 ? extras[extras.length - 1].n + 1 : 1
        for (let file of files) {
            if (!["image/png", "image/jpeg"].includes(file.mimetype))
                throw [new InputError("images", "Only PNG or JPG images are allowed")]
            if (!fs.existsSync(main))
                await processImage(file.data, main)
            else
                await processImage(file.data, path.join(IMAGES_DIR, productId + "_" + (next++) + ".png"))
        }
        return imagesService.getImages(productId)
    },

    // Borra una foto. Si es la principal, la siguiente de la galería pasa a ser la principal
    deleteImage: async (productId, userId, name) => {
        await checkOwner(productId, userId)
        let valid = name == productId + ".png" || new RegExp("^" + productId + "_\\d+\\.png$").test(name)
        let file = path.join(IMAGES_DIR, name)
        if (!valid || !fs.existsSync(file))
            throw [new InputError("image", "That photo does not exist")]
        fs.unlinkSync(file)
        if (name == productId + ".png") {
            let extras = extraImages(productId)
            if (extras.length > 0)
                fs.renameSync(path.join(IMAGES_DIR, extras[0].name), file)
        }
        return imagesService.getImages(productId)
    },

    // Pone una foto de la galería como principal (intercambia los ficheros)
    setMainImage: async (productId, userId, name) => {
        await checkOwner(productId, userId)
        let main = path.join(IMAGES_DIR, productId + ".png")
        let other = path.join(IMAGES_DIR, name)
        if (!new RegExp("^" + productId + "_\\d+\\.png$").test(name) || !fs.existsSync(other) || !fs.existsSync(main))
            throw [new InputError("image", "That photo does not exist")]
        let tmp = main + ".tmp"
        fs.renameSync(main, tmp)
        fs.renameSync(other, main)
        fs.renameSync(tmp, other)
        return imagesService.getImages(productId)
    },
}

module.exports = imagesService
