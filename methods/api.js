const prisma = require('../lib/prisma')

/**
* Checks if the request is authenticated and if it is sets the client account to be used for the request
* 
* @param {Object} req - The request object that is being processed
* @param {Object} res - The response object that is being processed to send the response
* @param {Function} next - The next function in the chain that is being processed
* 
* @return {Object} The response object that is being sent to the
*/
async function req_auth(req, res, next) {
    // If the token is not found return 401. json
    if (!req.headers.authorization)
        return res.status(401).json({ state: 'error', error: 'Token not found.' })

    const account = await prisma.account.findFirst({
        where: {
            trading_token: req.headers.authorization
        }
    })

    // set the client account to be used for the request
    if (account && !account.ban) {
        req.headers.client_account = account
        return next()
    }
    else return res.status(401).json({ state: 'error', error: 'The token is invalid or the account is blocked.' })
}


module.exports = {
    req_auth: req_auth,
    validate: validate
}