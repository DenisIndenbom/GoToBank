const express = require('express')
const router = express.Router() // Instantiate a new router

const bank = require('../methods/bank.js')

const limit = 20

router.get('/', async function (req, res) {
    const account = (await bank.get_accounts(req.session.user_id))[0]
    const codes = await bank.get_codes(account.id)

    return res.render('account/index.html', {
        base: 'base.html',
        title: 'Аккаунт',
        id: account.id,
        balance: await bank.balance(account.id),
        created_at: account.created_at,
        token: account.trading_token,
        transactions: await bank.get_transactions(account.id),
        codes: codes
    })
})

router.get('/transactions', async function (req, res) {
    const account = (await bank.get_accounts(req.session.user_id))[0]
    const page = req.query.page ? Number(req.query.page) : 1

    const transactions = await bank.get_transactions(account.id, (page - 1) * limit, limit)

    // Redirect to page if there are no transactions to display on the page.
    if (transactions.length === 0 && page > 1) 
        return res.redirect('/account/transactions?page=1')

    return res.render('account/transactions.html', {
        base: 'base.html',
        title: 'История транзакций',
        id: account.id,
        transactions: transactions,
        prev: page - 1,
        next: transactions.length == limit ? page + 1 : 0,
        current: page
    })
})

module.exports = router