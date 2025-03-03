const Ajv = require('ajv')

const ajv = new Ajv({ allErrors: true });
require('ajv-errors')(ajv);

// Transaction schema
const transaction_schema = {
    type: 'object',
    required: ['account_id', 'amount', 'description'],
    properties: {
        account_id: {
            type: 'integer',
            errorMessage: 'No account id or it is not number'
        },
        amount: {
            type: 'number',
            minimum: 1,
            errorMessage: 'No amount or it is not number or lower than 1'
        },
        description: {
            type: 'string',
            errorMessage: 'No description'
        }
    },
    additionalProperties: false
};

// Verification schema
const verify_schema = {
    type: 'object',
    required: ['transaction_id', 'code'],
    properties: {
        transaction_id: {
            type: 'integer',
            errorMessage: 'No transaction id or it is not number'
        },
        code: {
            type: 'integer',
            errorMessage: 'No code or it is not number'
        }
    },
    additionalProperties: false
};

// Compile schemas
const validate_transaction = ajv.compile(transaction_schema);
const validate_verification = ajv.compile(verify_schema);

/**
 * Middleware function to validate request data using a provided validator.
 * 
 * This function acts as a wrapper around a validation function. It validates the request body
 * using the provided validator and returns a 401 error with validation errors if the validation fails.
 * If validation passes, it proceeds to the next middleware in the chain.
 * 
 * @async
 * @function validate
 * 
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @param {Function} next - The Express next middleware function.
 * @param {Function} validator - A validation function that takes the request body and returns a validation result.
 *                              The validator should return `true` if validation passes, or `false` with an `errors` property
 *                              containing validation errors if validation fails.
 * 
 * @returns {Promise<void>} - Returns a Promise that resolves to the result of the wrapper function.
*/
async function validate(req, res, next, validator) {
    wrapper = (req, res, next) => {
        validation = validator(req.body);

        if (!validation)
            return res.status(401).json(validation.errors);

        return next();
    }

    return wrapper(req, res, next)
}

module.exports = {
    validate_transaction: validate_transaction,
    validate_verification: validate_verification,
    validate: validate
}