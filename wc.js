#! /usr/bin/env node

const EPub = require('epub')
const htmlRegex = /(<([^>]+)>)/ig
const cssRegex = /<style[^>]*>[\s\S]*<\/style>/g
let chapters = []
let total = 0

let title = 'Rothfuss - The Name of the Wind (2007).epub'

let epub = new EPub(`/Users/david/Dropbox/Ebooks/Singles/${title}`)
epub.parse()
epub.on('end', function () {
  main()
})

function idToText (id, cb) {
  epub.getChapterRaw(id, function (err, text) {
    if (err) { throw (err) }

    text = text
      .replace(cssRegex, '')
      // these are replaced by spaces so that newlines in the text are properly tokenized
      .replace(htmlRegex, ' ')
      .replace(/[\n\t\r]/g, ' ')
      .split(' ')
      .filter(x => x.trim() !== '')
    console.log(text)
    return cb(text.length)
  })
}

function main () {
  epub.flow.forEach(function (chapter) {
    // console.log(chapter.id)
    chapters.push(chapter.id)
    idToText(chapter.id, function (res) {
      // console.log(res)
      total += res
      console.log(`word count: ${total}`)
    })
  })
  console.log(chapters.sort())
}
