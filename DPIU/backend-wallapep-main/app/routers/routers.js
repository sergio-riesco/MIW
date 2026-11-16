let  productsRouter  = require("./productsRouter")
let  usersRouter  = require("./usersRouter")
let  transactionRouter = require("./transactionRouter")
let creditCardsRouter = require("./creditCardsRouter")

let initRouters = (app) =>{
    app.use("/products/",productsRouter)
    app.use("/users/",usersRouter)
    app.use("/transactions/",transactionRouter)
    app.use("/creditCards/",creditCardsRouter)
}

module.exports = initRouters;