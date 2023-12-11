const express = require('express')
const router = express.Router() // Instantiate a new router

router.get('/', async function (req, res) {
    return res.render('main/index.html', {
        base: 'base.html',
        title: 'Главная',
        not_login: !req.session.user_id
    })
})

module.exports = router