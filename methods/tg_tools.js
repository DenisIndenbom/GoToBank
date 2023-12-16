// @ts-check
const tgbot = require('../lib/telegram_bot.js')

/**
* Send notification about transaction.
*
* @param {object} telegram - The recipient of the notification in the telegram
* @param {object} transaction - Transaction data
*/
async function transaction_notification(telegram, transaction) {
    if (!telegram) return

    let prefix = ''
    switch (transaction.type) {
        case 'transfer':
            prefix = 'Зачисление'
            break
        case 'emission':
            prefix = 'Зачисление'
            break
        case 'payment':
            prefix = 'Списание'
            break
        case 'commission':
            prefix = 'Комиссия'
            break
    }

    const message = `${prefix} ${transaction.amount} gt - ${transaction.description}`

    try { await tgbot.sendMessage(telegram.telegram_id, message) }
    catch (error) { }
}

/**
* Send code notification about verify code.
* 
* @param {object} telegram - The recipient of the notification in the telegram
* @param {object} transaction - Transaction data
* @param {object} code - The confirm code of payment transaction
*/
async function code_notification(telegram, transaction, code) {
    if (!telegram) return

    const message = `Запрос ${transaction.amount} gt - ${transaction.description}\n\nКод подтверждения: ${code.code}`

    try {await tgbot.sendMessage(telegram.telegram_id, message)}
    catch (error) { }
}

module.exports = {
    transaction_notification: transaction_notification,
    code_notification: code_notification
}