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
async function reqAuth(req, res, next) {
    // If the token is not found return 401. json
    if (!req.headers.authorization)
        return res.status(401).json({ error: "Token not found." })

    const account = await prisma.account.findFirst({
        where: {
            trading_token: req.headers.authorization
        }
    })

    // set the client account to be used for the request
    if (account && !account.ban) {
        req.body.client_account = account
        return next()
    }
    else return res.status(401).json({ error: "The token is invalid or the account is blocked." })
}

/**
 * Checks if the given data is of the specified type.
 * @param {any} data - The data to be checked.
 * @param {string} type - The type to check against. Possible values: 'int', 'string'.
 * @returns {boolean} - true if the data is of the specified type, false otherwise.
 */
function check_type(data, type) {
    if (type === 'int') return Number.isInteger(data)
    if (type === 'amount') return Number.isInteger(data) && data >= 1
    if (type === 'string') return typeof data === 'string' || data instanceof String

    return false
}

/**
 * Validates the provided data based on the given rules.
 * 
 * @param {Object} data - The data to be validated, as an object.
 * @param {Array} rules - An array of validation rules. Each rule should be an array with three elements: 
 *                        [key, type, error], where key is the key in the data object, type is the expected 
 *                        type for the value, and error is the error message to be returned if validation fails.
 * @returns {Object} - An object with properties correct and error. 
 *                   - If validation succeeds, correct is true and error is an empty string.
 *                   - If validation fails, correct is false and error is the error message corresponding to the failed rule.
 */
function validate(data, rules) {
    for (rule of rules) {
        const key = rule[0]
        const type = rule[1]
        const error = rule[2]

        const arg_empty = !data[key]
        const type_uncorrect = !check_type(data[key], type)

        if (arg_empty || type_uncorrect)
            return { correct: false, error: error }
    }

    return { correct: true, error: '' }
}

module.exports = {
    reqAuth: reqAuth,
    validate: validate
}