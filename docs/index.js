const express = require('express')
const router = express.Router() // Instantiate a new router

const markdownit = require('markdown-it')
const hljs = require('highlight.js')

// init markdownit
const md = markdownit({
    highlight: (str, lang) => {
        const code = lang && hljs.getLanguage(lang)
            ? hljs.highlight(str, {
                language: lang,
                ignoreIllegals: true,
            }).value
            : md.utils.escapeHtml(str)

        return `<pre class="hljs container overflow-hidden overflow-x-auto my-3 p-3"><code>${code}</code></pre>`
    },
})

// load docs markdown file
const docs_markdown = require('fs').readFileSync(`${__dirname}/../docs.md`, { encoding: 'utf-8' })
const docs_html = md.render(docs_markdown)

router.get('/', async function (req, res) {
    return res.render('docs/index.html', {
        base: 'base.html',
        title: 'Документация',
        not_login: !req.session.user_id,
        docs: docs_html
    })
})

module.exports = router