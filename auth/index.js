const express = require('express')
const ClientOAuth2 = require('client-oauth2')

const router = express.Router() // Instantiate a new router

const init_account = require('../methods/bank.js').init_account

// Load config
const config = global.config

// Init OAuth client
const GoToIDAuth = new ClientOAuth2({
    clientId: config.OAUTH_KEY,
    clientSecret: config.OAUTH_SECRET,
    accessTokenUri: `${config.OAUTH_HOST}/oauth/token`,
    authorizationUri: `${config.OAUTH_HOST}/oauth`,
    redirectUri: `${config.HOST}/auth/callback`,
    scopes: []
})

router.get('/', function (req, res) {
    return res.redirect(GoToIDAuth.code.getUri())
})

router.get('/callback', async function (req, res) {
    try {
        // Get token by code
        const result = await GoToIDAuth.code.getToken(req.originalUrl)

        // Fetch user data
        const user = await (await fetch(`${config.OAUTH_HOST}/api/user`, {
            headers: new Headers({
                Authorization: `Bearer ${result.accessToken}`,
            }),
        })).json()

        // login user
        req.session.user_id = user.user_id
        req.session.username = user.username

        // init account
        init_account(user.user_id)

        return res.redirect('/')
    }
    catch (e) {
        // redirect if the code is incorrect
        return res.redirect('/auth')
    }
})


module.exports = router