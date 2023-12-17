const express = require('express')
const router = express.Router() // Instantiate a new router

const prisma = require('../lib/prisma.js')
const bank = require('../methods/bank.js')

const limit = 15

router.get('/', async function (req, res) {
    const account = (await bank.get_accounts(req.session.user_id))[0]
    const codes = await bank.get_codes(account.id)

    const page = req.query.page ? Number(req.query.page) : 1
    const transactions = await bank.get_transactions(account.id, (page - 1) * limit, limit)

    // Redirect to page if there are no transactions to display on the page.
    if (transactions.length === 0 && page > 1)
        return res.redirect('/account/transactions?page=1')

    return res.render('account/index.html', {
        base: 'base.html',
        title: 'Аккаунт',
        id: account.id,
        balance: await bank.balance(account.id),
        created_at: account.created_at,
        telegram: account.telegram ? account.telegram.telegram_id : null,
        token: account.trading_token,
        ban: account.ban,
        transactions: transactions,
        codes: codes,
        prev_page: page - 1,
        next_page: transactions.length == limit ? page + 1 : 0,
        current_page: page,
    })
})

router.get('/telegram', async (req, res) => {
    const account = (await bank.get_accounts(req.session.user_id))[0]

    return res.render('account/telegram.html', {
        base: 'base.html',
        title: 'Привязка Телеграм',
        telegram_id: account.telegram ? account.telegram.telegram_id : null
    })
})

router.post('/telegram', async (req, res) => {
    const telegram_id = req.body.telegram_id

    if (!telegram_id)
        return res.redirect('/account/telegram')

    const account = (await bank.get_accounts(req.session.user_id))[0]

    if (account.telegram) {
        await prisma.telegram.update({
            where: {
                account_id: account.id
            },
            data: {
                telegram_id: Number(telegram_id)
            }
        })
    }
    else {
        await prisma.telegram.create({
            data: {
                account_id: account.id,
                telegram_id: Number(telegram_id)
            }
        })
    }

    return res.redirect('/account/telegram')
})

router.post('/telegram/delete', async (req, res) => {
    const account = (await bank.get_accounts(req.session.user_id))[0]

    await prisma.telegram.delete({ where: { account_id: account.id } })

    return res.redirect('/account/telegram')
})

module.exports = router