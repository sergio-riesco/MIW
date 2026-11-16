const express = require("express")
const creditCardsController = require('../controllers/creditCardsController')

const creditCardsRouter = express.Router();

creditCardsRouter.get("/", creditCardsController.getCreditCards);
creditCardsRouter.get("/:id", creditCardsController.getCreditCard);
creditCardsRouter.post("/", creditCardsController.postCreditCard);
creditCardsRouter.delete("/:id", creditCardsController.deleteCreditCard);

module.exports = creditCardsRouter