const express = require('express');
const router = express.Router(); // Instantiate a new router

const tg_tools = require('../methods/tg_tools.js');
const bank = require('../methods/bank.js');

const limit = 15;
const err_codes = ['invalid_transaction', 'account_not_exist', 'account_blocked', 'insufficient_funds'];

router.get('/', async function (req, res) {
	const account = (await bank.get_accounts(req.session.user_id))[0];
	const codes = await bank.get_codes(account.id);

	const error = req.query.error;

	const page = req.query.page && Number(req.query.page) > 0 ? Number(req.query.page) : 1;
	const transactions = await bank.get_account_transactions(account.id, (page - 1) * limit, limit);

	// Redirect to page if there are no transactions to display on the page.
	if (transactions.length === 0 && page > 1) return res.redirect('/account/transactions?page=1');

	return res.render('account/index.html', {
		base: 'base.html',
		title: 'Аккаунт',
		error: error,
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
	});
});

router.get('/telegram', async (req, res) => {
	const account = (await bank.get_accounts(req.session.user_id))[0];

	return res.render('account/telegram.html', {
		base: 'base.html',
		title: 'Привязка Телеграм',
		telegram_username: account.telegram ? account.telegram.telegram_username : null,
	});
});

router.post('/telegram', async (req, res) => {
	const telegram_username = req.body.telegram_username;

	if (!telegram_username) return res.redirect('/account/telegram');

	const account_id = (await bank.get_accounts(req.session.user_id))[0].id;

	await bank.set_telegram_id(account_id, null);
	await bank.set_telegram_username(account_id, telegram_username);

	return res.redirect('/account/telegram');
});

router.post('/telegram/delete', async (req, res) => {
	const account_id = (await bank.get_accounts(req.session.user_id))[0].id;

	await bank.set_telegram_id(account_id, null);
	await bank.set_telegram_username(account_id, '');

	return res.redirect('/account/telegram');
});

router.post('/transfer', async (req, res) => {
	const account = (await bank.get_accounts(req.session.user_id))[0];

	const to_id = Number(req.body.to_id);
	const amount = Number(req.body.amount);
	const description = req.body.description;

	if (!to_id || !amount || !description || to_id < 0 || amount <= 0) return res.redirect('/account');

	try {
		const transaction = await bank.transfer(account.id, to_id, amount, description);

		const telegram = await bank.get_telegram(transaction.to_id);
		tg_tools.transaction_notification(telegram, transaction);
	} catch (e) {
		if (err_codes.includes(e.code)) return res.redirect(`/account?error=${e.message}`);
	}

	return res.redirect('/account');
});

module.exports = router;
