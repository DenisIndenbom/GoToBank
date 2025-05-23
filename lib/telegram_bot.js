// More crutches to the God of crutches!
function start_polling() {
	if (typeof global.is_main !== 'undefined') {
		if (global.is_main) global.tgbot.startPolling();
	} else {
		setTimeout(() => {
			start_polling();
		}, 1000);
	}
}

// Init telegram bot
if (!global.tgbot) {
	const TelegramBot = require('node-telegram-bot-api');
	const parse_args = require('yargs-parser');

	const bank = require('../methods/bank.js');
	const config = require('dotenv').config({ path: __dirname + '/../.env' }).parsed;
	const admins = config.TG_ADMINS.split(' ');
	const tgbot = new TelegramBot(config.TG_TOKEN, { polling: false });

	tgbot.onText(/\/start/, async (msg) => {
		const account = await bank.get_account_by_tg(msg.from.username, true);

		var message = `Привет, @${msg.from.username}!\n\nЯ телеграм бот GoToBank. Я с радостью буду уведомлять тебя о транзакциях.`;

		if (account && !account.telegram.telegram_id) {
			await bank.set_telegram_id(account.id, msg.from.id);

			message += '\n\nТелеграм привязан к счёту!';
		}

		tgbot.sendMessage(msg.chat.id, message, { parse_mode: 'HTML' });
	});

	tgbot.onText(/\/emission/, async (msg) => {
		if (!admins.includes(msg.from.id.toString())) return;

		const args = parse_args(msg.text);

		if (!args.id || !args.amount || !args.description) return;
		if (!(Number(args.amount) && args.amount > 0) || typeof args.description != 'string') return;

		const ids = Array.isArray(args.id) ? args.id : [args.id];

		let errors_string = 'Операция выполнена с ошибками: \n';
		let errors = false;

		for (const id of ids) {
			if (!Number(id)) continue;

			try {
				await bank.emission(id, args.amount, args.description);
				const telegram = await bank.get_telegram(id);

				if (telegram)
					tgbot.sendMessage(telegram.telegram_id, `Зачисление ${args.amount} gt - ${args.description}`);
			} catch (e) {
				errors_string += `(${id}): ${e.message}\n`;
				errors = true;
			}
		}

		tgbot.sendMessage(msg.from.id, errors ? errors_string : 'Операция выполнена успешно!');
	});

	tgbot.onText(/\/commission/, async (msg) => {
		if (!admins.includes(msg.from.id.toString())) return;

		const args = parse_args(msg.text);

		if (!args.id || !args.amount || !args.description) return;
		if (!(Number(args.amount) && args.amount > 0) || typeof args.description != 'string') return;

		const ids = Array.isArray(args.id) ? args.id : [args.id];

		let errors_string = 'Операция выполнена с ошибками: \n';
		let errors = false;

		for (const id of ids) {
			if (!Number(id)) continue;

			try {
				await bank.commission(id, args.amount, args.description);
				const telegram = await bank.get_telegram(id);

				if (telegram)
					tgbot.sendMessage(telegram.telegram_id, `Комиссия ${args.amount} gt - ${args.description}`);
			} catch (e) {
				errors_string += `(${id}): ${e.message}\n`;
				errors = true;
			}
		}

		tgbot.sendMessage(msg.from.id, errors ? errors_string : 'Операция выполнена успешно!');
	});

	tgbot.onText(/\/set_ban/, async (msg) => {
		if (!admins.includes(msg.from.id.toString())) return;

		const args = parse_args(msg.text);

		if (!args.id || !args.ban) return;
		if (typeof args.id != 'number') return;

		const success = await bank.set_account_ban(args.id, args.ban === 'true');

		tgbot.sendMessage(
			msg.from.id,
			success ? 'Операция выполнена успешно!' : 'Операция не выполнена успешно!'
		);
	});

	global.tgbot = tgbot;
	start_polling();
}

module.exports = global.tgbot;
