// Import libs
const express = require('express')
const session = require('express-session')
const PostgreSqlStore = require('connect-pg-simple')(session);
const nunjucks = require('nunjucks')
const bodyParser = require('body-parser')
const cors = require('cors')

// Init express
const app = express()

// Load app resources
const methods = require('./methods')

const accountRouter = require('./account')
const docsRouter = require('./docs')
const mainRouter = require('./main')

const apiRouter = require('./api')
const reqAuth = methods.reqAuth

const authRouter = require('./auth')
const auth = methods.auth
const notAuth = methods.notAuth

// some tools
function authHandler(req, res, next) {
    return auth(req, res, next, '/auth')
}

// Load configuration from .env
const config = require('dotenv').config({ path: __dirname + '/.env' }).parsed

const databaseURL = config.DATABASE_URL
const port = config.PORT || 3030
const secret = config.SECRET
const debug = config.DEBUG === "true"

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
    secret: secret,
    resave: true,
    saveUninitialized: true,
    cookie: { maxAge: 3 * 24 * 60 * 60 * 1000 }, // session is stored for 3 days
    store: new PostgreSqlStore({ conString: databaseURL })
}))

app.use(cors({ origin: true }))

// add static folder
app.use('/static', express.static(__dirname + '/static'));

// add routes
app.use('/api', reqAuth, apiRouter)
app.use('/auth', notAuth, authRouter)
app.use('/logout', (req, res) => { req.session.destroy(); res.redirect('/') })
app.use('/account', authHandler, accountRouter)
app.use('/docs', docsRouter)
app.use('/', mainRouter)

app.listen(port)

console.log("GoToBank Server listening on port:", port)