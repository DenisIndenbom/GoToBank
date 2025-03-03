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
 * using the provided validator and returns a 400 error with validation errors if the validation fails.
 * If validation passes, it proceeds to the next middleware in the chain.
 * 
 * @function validate
 * 
 * @param {Function} validator - A validation function that takes the request body and returns a validation result.
 *                              The validator should return `true` if validation passes, or `false` with an `errors` property
 *                              containing validation errors if validation fails.
 * 
 * @returns {Function} - Returns a middleware function.
 */
function validate(validator) {
    return (req, res, next) => {
        const valid = validator(req.body);

        if (!valid) {
            const errors = validator.errors.map(error => ({
                field: error.params.missingProperty, // Remove the leading '/' from the instancePath
                message: error.message
            }));

            return res.status(400).json({
                state: 'error',
                code: 'invalid_args',
                errors: errors
            });
        }

        return next();
    };
}

module.exports = {
    validate_transaction: validate_transaction,
    validate_verification: validate_verification,
    validate: validate
}