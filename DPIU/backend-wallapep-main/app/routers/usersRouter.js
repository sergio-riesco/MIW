const express = require("express")
const usersController = require('../controllers/usersController')

const usersRouter = express.Router();

usersRouter.post("/login",usersController.loginUser);
usersRouter.post("/",usersController.postUser);
usersRouter.get("/disconnect", usersController.disconnect);
usersRouter.post("/disconnect", usersController.disconnect);
usersRouter.get("/isActiveApiKey", usersController.isActiveApiKey);
usersRouter.get("/:id", usersController.getUser);

module.exports = usersRouter