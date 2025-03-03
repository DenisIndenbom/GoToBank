const express = require('express')
const router = express.Router() // Instantiate a new router

// load docs markdown file
const docs_markdown = require('fs').readFileSync(`${__dirname}/../docs.md`, { encoding: 'utf-8' })

router.get('/', async function (req, res) {
    return res.render('docs/index.html', {
        base: 'base.html',
        title: 'Документация',
        not_login: !req.session.user_id,
        docs: docs_markdown
    })
})

module.exports = router