let  authenticationMiddleware  = require("./authenticationMiddleware")

let initMiddlewares = (app) =>{
    app.use(["/products/","/transactions/","/creditCards"],authenticationMiddleware)
}

module.exports = initMiddlewares;