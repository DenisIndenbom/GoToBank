const express = require('express')
const router = express.Router() // Instantiate a new router

const bank = require('../methods/bank.js')
const tg_tools = require('../methods/tg_tools.js')
const validate = require('../methods/api.js').validate

// Rule definition for verifying transactions. This is a list of rules that are used to verify transactions
const transaction_rule = [
    ['account_id', 'int', 'No account id or it is not number'],
    ['amount', 'amount', 'No amount or it is not number or lower than 1'],
    ['description', 'string', 'No description']
]

const verify_rule = [
    ['transaction_id', 'int', 'No transaction id or it is not number'],
    ['code', 'int', 'No code or it is not number']
]

router.get('/account', async function (req, res) {
    const account = req.body.client_account

    return res.json({ state: 'success', account: { id: account.id, user_id: account.user_id, created_at: account.created_at } })
})

router.get('/balance', async function (req, res) {
    const account = req.body.client_account

    return res.json({ state: 'success', balance: await bank.balance(account.id) })
})

router.get('/codes', async function (req, res) {
    const account = req.body.client_account

    return res.json({ state: 'success', codes: await bank.get_codes(account.id) })
})

router.get('/transaction', async function (req, res) {
    const account = req.body.client_account
    const transaction_id = Number(req.query.id)

    if (!transaction_id)
        return res.status(422).json({ state: 'error', code: 'invalid_args', error: 'The url argument is missing in the request.' })

    const transaction = await bank.get_transaction(transaction_id, false)

    if (!transaction || (transaction.from_id != account.id && transaction.to_id != account.id))
        return res.status(400).json({ state: 'error', code: 'transaction_not_exist', error: 'The transaction does not exist for you.' })

    return res.json({ state: 'success', transaction: transaction })
})

router.post('/transfer', async function (req, res) {
    const account = req.body.client_account

    // validate arguments
    const result = validate(req.body, transaction_rule)

    // if result.correct is true return 422. json
    if (!result.correct)
        return res.status(422).json({ state: 'error', code: 'invalid_args', error: result.error })

    // parse arguments
    const to_id = req.body.account_id
    const amount = req.body.amount
    const description = req.body.description

    try {
        const transaction = await bank.transfer(account.id, to_id, amount, description)

        // send notification
        const telegram = await bank.get_telegram(transaction.to_id)
        tg_tools.transaction_notification(telegram, transaction)

        return res.json({ state: 'success', transaction: transaction })
    }
    catch (error) {
        return res.status(400).json({ state: 'error', code: error.code, error: error.message })
    }
})

router.post('/payment', async function (req, res) {
    const account = req.body.client_account

    // validate arguments
    const result = validate(req.body, transaction_rule)

    // if result.correct is true return 422. json
    if (!result.correct)
        return res.status(422).json({ state: 'error', code: 'invalid_args', error: res.error })

    // parse arguments
    const from_id = req.body.account_id
    const amount = req.body.amount
    const description = req.body.description

    try {
        const payment = await bank.payment(from_id, account.id, amount, description)

        // send notification
        const telegram = await bank.get_telegram(payment.to_id)
        tg_tools.code_notification(telegram, payment.transaction, payment.code)

        return res.json({ state: 'success', transaction: payment.transaction })
    }
    catch (error) {
        return res.status(400).json({ state: 'error', code: error.code, error: error.message })
    }
})

router.post('/verify', async function (req, res) {
    const account = req.body.client_account

    // validate arguments
    const result = validate(req.body, verify_rule)

    // if result.correct is true return 422. json
    if (!result.correct)
        return res.status(422).json({ state: 'error', code: 'invalid_args', error: res.error })

    // parse arguments
    const transaction_id = req.body.transaction_id
    const code = req.body.code

    try {
        const status = await bank.verify_payment(account.id, transaction_id, code)

        // Send notification if status is done.
        if (status === 'done') {
            const transaction = await bank.get_transaction(transaction_id)
            const telegram = await bank.get_telegram(transaction.from_id)
            tg_tools.transaction_notification(telegram, transaction)
        }

        return res.json({ state: 'success', status: status })
    }
    catch (error) {
        return res.status(400).json({ state: 'error', code: error.code, error: error.message })
    }
})

module.exports = router