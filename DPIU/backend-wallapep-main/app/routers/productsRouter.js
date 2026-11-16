const express = require("express")
const productsController = require('../controllers/productsController')

const productsRouter = express.Router();

productsRouter.get("/", productsController.getProducts);
productsRouter.get("/own", productsController.getMyProducts);
productsRouter.post("/", productsController.postProduct);
productsRouter.get("/categories/count", productsController.countProductsInCategories);
productsRouter.get("/:id", productsController.getProduct);
productsRouter.put("/:id", productsController.putProduct); // The :params allways the last
productsRouter.delete("/:id", productsController.deleteProduct); // The :params allways the last
productsRouter.post("/:id/image", productsController.postProductImage);
productsRouter.get("/:id/images", productsController.getProductImages);
productsRouter.post("/:id/images", productsController.postProductImages);
productsRouter.delete("/:id/images/:name", productsController.deleteProductImage);
productsRouter.put("/:id/images/:name/main", productsController.setMainProductImage);

module.exports = productsRouter