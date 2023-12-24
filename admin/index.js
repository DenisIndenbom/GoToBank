const express = require('express')
const router = express.Router() // Instantiate a new router

const bank = require('../methods/bank.js')
const admin = require('../methods/admin.js')
const tg_tools = require('../methods/tg_tools.js')

const err_codes = ['invalid_transaction', 'account_not_exist', 'account_blocked', 'insufficient_funds']

router.get('/', async function (req, res) {
    return res.render('admin/index.html', {
        base: 'base.html',
        title: 'Админская панель',
        admin_level: await admin.get_level(req.session.user_id),
        error: req.query.error
    })
})

router.get('/history', async function (req, res) {
    const limit = 50

    const page = (req.query.page && Number(req.query.page) > 0) ? Number(req.query.page) : 1
    const transactions = await bank.get_all_transactions((page - 1) * limit, limit)

    // Redirect to page if there are no transactions to display on the page.
    if (transactions.length === 0 && page > 1)
        return res.redirect('/account/transactions?page=1')

    return res.render('admin/history.html', {
        base: 'base.html',
        title: 'История транзакций',
        transactions: transactions,
        prev_page: page - 1,
        next_page: transactions.length == limit ? page + 1 : 0,
        current_page: page,
    })
})

router.post('/emission', async (req, res) => {
    if (!await admin.access(req.session.user_id, 1))
        return res.redirect('/admin?error=Не достаточно прав!')

    const account_ids = req.body.account_ids
    const amount = Number(req.body.amount)
    const description = req.body.description

    if (!account_ids || !amount || !description || amount <= 0)
        return res.redirect('/admin')

    let errors = ''

    for (const account_id of account_ids.split(' ')) {
        const to_id = Number(account_id)

        if (!to_id) {
            errors += `Invalid ID: ${account_id}; `
            continue
        }

        try {
            const transaction = await bank.emission(to_id, amount, description)

            const telegram = await bank.get_telegram(transaction.to_id)
            tg_tools.transaction_notification(telegram, transaction)
        }
        catch (e) {
            if (err_codes.includes(e.code))
                errors += `(${account_id}): ${e.message}; `
        }
    }

    return res.redirect(`/admin${errors ? `?error=${errors}` : ''}`)
})

router.post('/commission', async (req, res) => {
    if (!await admin.access(req.session.user_id, 1))
        return res.redirect('/admin?error=Не достаточно прав!')

    const account_ids = req.body.account_ids
    const amount = Number(req.body.amount)
    const description = req.body.description

    if (!account_ids || !amount || !description || amount <= 0)
        return res.redirect('/admin')

    let errors = ''

    for (const account_id of account_ids.split(' ')) {
        const from_id = Number(account_id)

        if (!from_id) {
            errors += `Invalid ID: ${account_id}; `
            continue
        }

        try {
            const transaction = await bank.commission(from_id, amount, description)

            const telegram = await bank.get_telegram(transaction.from_id)
            tg_tools.transaction_notification(telegram, transaction)
        }
        catch (e) {
            if (err_codes.includes(e.code))
                errors += `(${account_id}): ${e.message}; `
        }
    }

    return res.redirect(`/admin${errors ? `?error=${errors}` : ''}`)
})

router.post('/mailing', async (req, res) => {
    const message = req.body.message

    if (!message)
        return res.redirect('/admin')

    for (const telegram of (await bank.get_telegrams())) {
        tg_tools.notification(telegram, message)
    }

    return res.redirect('/admin')
})

router.post('/ban', async (req, res) => {
    if (!await admin.access(req.session.user_id, 2))
        return res.redirect('/admin?error=Не достаточно прав!')

    const account_id = Number(req.body.account_id)

    if (!account_id)
        return res.redirect('/admin')

    const result = await bank.set_account_ban(account_id, true)

    return res.redirect(`/admin${result ? '' : '?error=Аккаунт не найден!'}`)
})

router.post('/unban', async (req, res) => {
    if (!await admin.access(req.session.user_id, 2))
        return res.redirect('/admin?error=Не достаточно прав!')

    const account_id = Number(req.body.account_id)

    if (!account_id)
        return res.redirect('/admin')

    const result = await bank.set_account_ban(account_id, false)

    return res.redirect(`/admin${result ? '' : '?error=Аккаунт не найден!'}`)
})

router.post('/add_admin', async (req, res) => {
    if (!await admin.access(req.session.user_id, 3))
        return res.redirect('/admin?error=Не достаточно прав!')

    const user_id = Number(req.body.admin_id)
    const level = Number(req.body.level)

    if (!user_id || !level || user_id <= 0)
        return res.redirect('/admin')

    if (level < 0 || level > 3)
        return res.redirect('/admin?error=Неправильно указан уровень доступа!')

    const result = await admin.add_admin(user_id, level)

    return res.redirect(`/admin${result ? '' : '?error=Админ уже добавлен!'}`)
})

router.post('/delete_admin', async (req, res) => {
    if (!await admin.access(req.session.user_id, 3))
        return res.redirect('/admin?error=Не достаточно прав!')

    const user_id = Number(req.body.admin_id)

    if (!user_id || user_id <= 0)
        return res.redirect('/admin')

    await admin.delete_admin(user_id)

    return res.redirect('/admin')
})

module.exports = router