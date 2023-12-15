const api = require('./api.js')
const is_auth = require('./is_auth.js')
const bank = require('./bank.js')

// export functions for app.js
module.exports = {
    auth: is_auth.auth,
    notAuth: is_auth.notAuth,
    reqAuth: api.reqAuth,
}