const prisma = require('../lib/prisma')
const moment = require('moment')
const randtoken = require('rand-token')

const config = require('dotenv').config({ path: __dirname + '/../.env' }).parsed

const attempts = Number(config.CODE_ATTEMPTS)
const expiration = Number(config.CODE_EXPIRATION)

/**
* Creates an error object. This is a convenience function for creating custom error objects that do not have a message property
* 
* @param {string} code - The error code to set on the error
* @param {string} message - The message to set on the error
* 
* @return {Error} The error object that was created with
*/
function error(code, message) {
    const err = new Error(message)
    err.code = code

    return err
}

/**
* Returns a random integer between two numbers. This is useful for generating random numbers that are close to each other in the case of a circular dependency.
* 
* @param {int} min - The minimum value to return. Must be greater than or equal to 0.
* @param {int} max - The maximum value to return. Must be greater than or equal to 0.
* 
* @return {int} The random integer between min and max
*/
function randint(min, max) {
    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Init new account if user don't have accounts.
 * 
 * @param {int} user_id - user id
 * @returns {boolean} Success or not
 * @throws An error if values are not set
 */
async function init_account(user_id) {
    const accounts = await prisma.account.findMany({
        where: {
            user_id: user_id
        }
    })

    if (accounts.length > 0) return false

    const account = await prisma.account.create({
        data: {
            user_id: user_id,
            trading_token: randtoken.generate(32),
        }
    })

    return !!account
}

/**
 * Get the accounts by user_id.
 *
 * @param {int} user_id - The id of user
 * @param {boolean} transactions - Include transactions
 *
 * @returns {Array} Array of accounts
 * @throws An error if values are not set
 */
async function get_accounts(user_id, transactions = false) {
    const accounts = await prisma.account.findMany({
        where: {
            user_id: user_id
        },
        include: {
            in_transactions: transactions,
            out_transactions: transactions
        }
    })

    return accounts
}

/**
 * Get the account info.
 *
 * @param {int} account_id - The id of account
 * @param {boolean} transactions - Include transactions
 *
 * @returns {Object} Info of the account
 * @throws An error if values are not set
 */
async function get_account(account_id, transactions = false) {
    const account = await prisma.account.findFirst({
        where: {
            id: account_id
        },
        include: {
            in_transactions: transactions,
            out_transactions: transactions
        }
    })

    return account
}

/**
 * Get the transaction info.
 * 
 * @param {int} transaction_id - The id of transaction
 * @returns {Object} Info of the transaction
 * @throws An error if values are not set
 */
async function get_transaction(transaction_id) {
    const transaction = await prisma.transaction.findFirst({
        where: {
            id: transaction_id
        },
        include: {
            from: true,
            to: true,
            code: true
        }
    })

    return transaction
}

/**
 * Get active verify codes of payment transactions by account id.
 * 
 * @param {int} account_id - The id of account
 * @returns {Array} Array of codes
 * @throws An error if values are not set
 */
async function get_codes(account_id) {
    const codes = await prisma.transaction.findMany({
        where: {
            from_id: account_id,
            type: 'payment',
            status: 'pending',
            code: {
                expires_at: {
                    gte: new Date()
                }
            }
        },
        select: {
            code: true
        }
    })

    return codes
}

/**
 * Get the account's transaction history.
 * 
 * @param {int} account_id - The id of account
 * @returns {Array} Array of transactions
 * @throws An error if values are not set
 */
async function transaction_history(account_id) {
    const transactions = await prisma.transaction.findMany({
        where: {
            OR: [
                { from_id: account_id },
                { to_id: account_id }
            ]
        },
        orderBy: [
            { id: 'desc' }
        ]
    })

    return transactions
}

/**
 * Get the account balance.
 * 
 * @param {int} account_id - The id of account
 * @returns {float} The account balance
 * @throws Throw error if account doesn't exist. Error code: account_not_exist
 */
async function balance(account_id) {
    const account = await get_account(account_id, true)

    // validate
    if (!account)
        throw error('account_not_exist', `Account doesn't exist`)

    // count money
    let amount = 0;
    account.in_transactions.forEach((el) => amount += el.status == 'done' ? el.amount : 0)
    account.out_transactions.forEach((el) => amount -= el.status == 'done' ? el.amount : 0)

    return amount
}

/**
 * Transfer money from account A to account B.
 * 
 * @param {int} from_id - The id of transfer from account
 * @param {int} to_id - The id of transfer to account
 * @param {float} amount - The amount of money being transferred
 * @param {string} description - Description of the transaction
 * @returns {Object} Сompleted transaction
 * @throws {Error} Throw error if account A transfers money to itself. Error code: invalid_transaction
 * @throws {Error} Throw error if account A or B don't exist. Error code: account_not_exist
 * @throws {Error} Throw error if there are not enough funds in the account. Error code: insufficient_funds
 * @throws {Error} Throw error if your account is blocked. Error code: account_blocked
 * @throws {Error} Throw error if the recipient's account is blocked!. Error code: account_blocked
 */
async function transfer(from_id, to_id, amount, description) {
    const from = await get_account(from_id)
    const to = await get_account(to_id)

    // validate transaction
    if (from_id === to_id)
        throw error('invalid_transaction', `Such a transaction cannot be completed`)

    if (!from || !to)
        throw error('account_not_exist', `Account doesn't exist`)

    if (from.ban)
        throw error('account_blocked', 'Your account is blocked!')

    if (to.ban)
        throw error('account_blocked', `The recipient's account has been blocked!`)

    if (await balance(from_id) < amount)
        throw error('insufficient_funds', `Insufficient funds`)

    // create new transfer transaction
    const transaction = await prisma.transaction.create({
        data: {
            from_id: from_id,
            to_id: to_id,
            amount: amount,
            type: 'transfer',
            description: description,
            status: 'done'
        }
    })

    return transaction
}

/**
 * Create payment transaction from account A to account B.
 * 
 * @param {int} from_id - The id of payment from account
 * @param {int} to_id - The id of payment to account
 * @param {float} amount - The amount of money being transferred
 * @param {string} description - Description of the transaction
 * @returns {Object} Сompleted transaction and transaction code {transaction, code}
 * @throws {Error} Throw error if account A transfers money to itself. Error code: invalid_transaction
 * @throws {Error} Throw error if account A or B don't exist. Error code: account_not_exist
 * @throws {Error} Throw error if your account is blocked. Error code: account_blocked
 * @throws {Error} Throw error if the recipient's account is blocked!. Error code: account_blocked
 */
async function payment(from_id, to_id, amount, description) {
    const from = await get_account(from_id)
    const to = await get_account(to_id)

    // validate transaction
    if (from_id === to_id)
        throw error('invalid_transaction', `Such a transaction cannot be completed`)

    if (!from || !to)
        throw error('account_not_exist', `Account doesn't exist`)

    if (from.ban)
        throw error('account_blocked', `The buyer's account has been blocked!`)

    if (to.ban)
        throw error('account_blocked', `Your account is blocked!`)

    // create new payment transaction
    const transaction = await prisma.transaction.create({
        data: {
            from_id: from_id,
            to_id: to_id,
            amount: amount,
            type: 'payment',
            description: description,
            status: 'pending'
        }
    })

    // create verify code
    const code = await prisma.code.create({
        data: {
            transaction_id: transaction.id,
            code: randint(1000, 9999),
            expires_at: moment().add(expiration, 'minute').format(),
            attempts: attempts
        }
    })

    return { transaction: transaction, code: code }
}

/**
 * Verify payment transaction by code.
 * 
 * @param {int} transaction_id - The id of the transaction
 * @param {int} code - The verify code of the transaction
 * @returns {string} - Operation status (done, blocked, incorrect_code)
 * @throws {Error} Throw error if transaction does not exist. Error code: transaction_not_exist
 * @throws {Error} Throw error if transaction is cancelled. Error code: transaction_cancelled
 * @throws {Error} Throw error if transaction is blocked. Error code: transaction_blocked
 * @throws {Error} Throw error if transaction is finnished. Error code: transaction_finished
 */
async function verify_payment(transaction_id, code) {
    const transaction = await get_transaction(transaction_id)

    // validate transaction
    if (!transaction)
        throw error('transaction_not_exist', `Transaction doesn't exist`)

    if (transaction.status === 'cancelled')
        throw error('transaction_cancelled', `The transaction has been cancelled`)

    if (transaction.status === 'blocked')
        throw error('transaction_blocked', `The transaction has been blocked`)

    if (transaction.status === 'done')
        throw error('transaction_finished', `The transaction has been completed`)

    // check balance
    const balance_correct = await balance(transaction.from_id) >= transaction.amount

    // check code
    const correct = transaction.code.code === code
    const is_active = transaction.code.expires_at >= new Date()

    if (correct && is_active && balance_correct) {
        // complete transaction
        await prisma.transaction.update({
            where: {
                id: transaction_id
            },
            data: {
                status: 'done'
            }
        })

        return 'done'
    }
    else if (!is_active || !balance_correct) {
        // cancell transaction
        await prisma.transaction.update({
            where: {
                id: transaction_id
            },
            data: {
                status: 'cancelled'
            }
        })

        return 'cancelled'
    }
    else if (transaction.code.attempts - 1 < 0) {
        // block transaction
        await prisma.transaction.update({
            where: {
                id: transaction_id
            },
            data: {
                status: 'blocked'
            }
        })

        return 'blocked'
    }
    else {
        // update code configuration
        await prisma.code.update({
            where: {
                transaction_id: transaction_id
            },
            data: {
                attempts: transaction.code.attempts - 1
            }
        })

        return 'incorrect_code'
    }
}

/**
 * Create emission transaction to account A.
 * 
 * @param {int} to_id - The id of emission to account
 * @param {float} amount - The amount of money emission
 * @param {string} description - Description of the transaction
 * @returns {Object} Сompleted transaction
 * @throws {Error} Throw error if account A don't exist. Error code: account_not_exist
 * @throws {Error} Throw error if your account is blocked. Error code: account_blocked
 */
async function emission(to_id, amount, description) {
    const to = await get_account(to_id)

    if (!to)
        throw error('account_not_exist', `Account doesn't exist`)

    if (to.ban)
        throw error('account_blocked', 'Account is blocked!')

    // create new emission transaction
    const transaction = await prisma.transaction.create({
        data: {
            from_id: null,
            to_id: to_id,
            amount: amount,
            type: 'emission',
            description: description,
            status: 'done'
        }
    })

    return transaction
}

module.exports = {
    init_account: init_account,
    get_accounts: get_accounts,
    get_account: get_account,
    get_transaction: get_transaction,
    get_codes: get_codes,
    transaction_history: transaction_history,
    balance: balance,
    transfer: transfer,
    payment: payment,
    verify_payment: verify_payment,
    emission: emission
}