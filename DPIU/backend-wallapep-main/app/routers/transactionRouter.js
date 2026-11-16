const express = require("express")
const transactionController = require('../controllers/transactionController')

const transactionRouter = express.Router();

transactionRouter.get("/public", transactionController.getTransactionsPublic);
transactionRouter.get("/own", transactionController.getTransactions);
transactionRouter.post("/", transactionController.postTransaction);
transactionRouter.delete("/:id", transactionController.cancelTransaction);

module.exports = transactionRouter

