(() => {
    // add plugin
    hljs.addPlugin(new CopyButtonPlugin({lang: "ru"}))
   
    // init markdownit
    const md = markdownit({
        highlight: (code, lang) => {
            return `<pre class="hljs container overflow-hidden p-3"><code class="language-${lang}">${code}</code></pre>`
        }
    })

    for (var element of document.getElementsByClassName('markdown')) {
        element.innerHTML = md.render(element.innerHTML)
    }

    hljs.highlightAll()
})()