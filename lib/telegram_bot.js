const TelegramBot = require('node-telegram-bot-api')
const { get_telegram } = require('../methods/bank.js')

// More crutches to the God of crutches!
function start_polling() {
    if (typeof global.is_main !== 'undefined') {
        if (global.is_main)
            global.tgbot.startPolling()
    }
    else {
        setTimeout(() => {
            start_polling();
        }, 1000)
    }
}

// Init telegram bot
if (!global.tgbot) {
    const config = require('dotenv').config({ path: __dirname + '/../.env' }).parsed
    const tgbot = new TelegramBot(config.TG_TOKEN, { polling: false })

    tgbot.onText(/\/start/, (msg) => {
        const telegram = get_telegram(msg.from.id)

        if (!telegram)
            tgbot.sendMessage(msg.chat.id, 'Telegram ID: `' + msg.from.id + '`', { parse_mode: 'MarkdownV2' })
        else {
            const message = `Привет, @${msg.from.username}!\n\nЯ телеграм бот GoToBank. Я с радостью буду уведомлять тебя о транзакциях`
            tgbot.sendMessage(msg.chat.id, message)
        }
    })

    global.tgbot = tgbot
    start_polling()
}


module.exports = global.tgbot;