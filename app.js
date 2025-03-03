// Import libs
const express = require('express')
const session = require('express-session')

const https = require('https')
const http = require('http')

const fs = require('fs')
const PostgreSqlStore = require('connect-pg-simple')(session)

const nunjucks = require('nunjucks')
const bodyParser = require('body-parser')
const cors = require('cors')

// Init express
const app = express()

// Load configuration from .env
const config = require('dotenv').config({ path: __dirname + '/.env' }).parsed

// Save configuration in global
global.config = config

const databaseURL = config.DATABASE_URL
const port = config.PORT || 3030
const SSL = config.SSL === 'true'
const secret = config.SECRET
const debug = config.DEBUG === 'true'

// Load app resources
const methods = require('./methods')

const account_router = require('./account')
const docs_router = require('./docs')
const main_router = require('./main')

const api_router = require('./api')
const api_auth = methods.api.req_auth

const auth_router = require('./auth')
const auth = methods.is_auth.auth
const not_auth = methods.is_auth.not_auth

// Some tools
function authHandler(req, res, next) {
    return auth(req, res, next, '/auth')
}

// Init template engine
nunjucks.configure('templates', {
    autoescape: true,
    express: app,
    noCache: debug
})

// Here we are configuring express to use body-parser as middle-ware.
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

// Setting up sessions
app.use(session({
    name: 'gotobank.sid',
    secret: secret,
    resave: true,
    saveUninitialized: false,
    cookie: { maxAge: 3 * 24 * 60 * 60 * 1000 }, // session is stored for 3 days
    store: new PostgreSqlStore({ conString: databaseURL })
}))

app.use(cors({ origin: true }))

// Add static folder
app.use('/static', express.static(__dirname + '/static'))


// Add API route
app.use('/api', api_auth, api_router)
// Add authorisation routes
app.use('/auth', not_auth, auth_router)
app.use('/logout', (req, res) => { req.session.destroy(); res.redirect('/') })
// Add main app routes
app.use('/account', authHandler, account_router)
app.use('/docs', docs_router)
app.use('/', main_router)

// Handle 404
app.use(function (req, res, next) {
    res.status(404)
    // respond with html page
    if (req.accepts('html')) {
        return res.render('404.html', { base: 'base.html', title: '404' })
    }
    // respond with json
    if (req.accepts('json')) {
        return res.json({ state: 'error', code: 'not_found', error: 'Not found' })
    }
    // default to plain-text. send()
    return res.type('txt').send('Not found')
})

// Run app
module.exports = (is_main) => {
    global.is_main = is_main

    if (SSL) {
        const httpsServer = https.createServer({
            key: fs.readFileSync(__dirname + '/.ssl/key.pem'),
            cert: fs.readFileSync(__dirname + '/.ssl/cert.pem'),
        }, app)

        httpsServer.listen(port)
    }
    else {
        const httpServer = http.createServer(app)
        httpServer.listen(port)
    }
}