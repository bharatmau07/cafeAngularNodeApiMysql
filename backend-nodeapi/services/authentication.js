require('dotenv').config()
const jwt = require('jsonwebtoken');

function authenticationToken(req, res, next) {
    const authHeader = req.headers['authentication'];
    //console.log(authHeader);
    const token =  authHeader && authHeader.split(' ')[1]
    if(token == null)
    return res.sendStatus(401);

    jwt.verify(token, process.env.ACCESS_TOKEN, (err, response) => {
        if(err)
           return res.sendStatus(403);
           //console.log(response);
           res.locals = response;
           next();
    })
}
module.exports = {authenticationToken: authenticationToken}