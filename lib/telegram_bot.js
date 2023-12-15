const TelegramBot = require('node-telegram-bot-api')

if (!global.tgbot) {
    const config = require('dotenv').config({ path: __dirname + '/../.env' }).parsed
    const tgbot = new TelegramBot(config.TG_TOKEN, { polling: true })

    tgbot.onText(/\/start/, (msg) => tgbot.sendMessage(msg.chat.id, `Твой телеграм ID: ${msg.from.id}`))

    global.tgbot = tgbot
}


module.exports = global.tgbot;