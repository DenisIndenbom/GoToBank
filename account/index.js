const express = require('express')
const router = express.Router() // Instantiate a new router

const bank = require('../methods/bank.js')

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
        transactions: await bank.transaction_history(account.id),
        codes: codes
    })
})

module.exports = router