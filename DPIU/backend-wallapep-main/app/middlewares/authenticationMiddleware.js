const jwt = require("jsonwebtoken");
const activeApiKeys = require("../activeApiKeys")

let authenticationMiddleware = (req, res, next) => {
    console.log("middleware execution")

	let apiKey = req.headers.apikey 
	if ( apiKey == undefined || apiKey == "null" ){
		res.status(401).json({ errors: [{ msg:"no apiKey"}] });
		return 
	}
	let infoInApiKey = jwt.verify(apiKey, "secret");
	if ( infoInApiKey == undefined || activeApiKeys.indexOf(apiKey) == -1){
		res.status(401).json({ errors: [{ msg:"no apiKey"}] });
		return 	
	}

	// desencrypted in req
	req.infoInApiKey = infoInApiKey;
    next();
}

module.exports = authenticationMiddleware;
