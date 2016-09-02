#! /usr/bin/env node

'use strict'

const EPub = require('epub')

// var promisify = require('bluebird-events')

const htmlRegex = /(<([^>]+)>)/ig
const cssRegex = /<style[^>]*>[\s\S]*<\/style>/g
let total = 0

const title = 'Rothfuss - The Name of the Wind (2007).epub'

let epub = new EPub(`/Users/david/Dropbox/Ebooks/Singles/${title}`)
epub.parse()
// promisify(epub, {resolve: 'end'})

// epub.parse().then(() => {
//   main()
// })

epub.on('end', function () {
  main()
})

function cleanText (text) {
  let res = text
    .replace(cssRegex, '')
    // these are replaced by spaces so that newlines in the text are properly tokenized
    .replace(htmlRegex, ' ')
    .replace(/[\n\t\r]/g, ' ')
    .split(' ')
    .filter(x => x.trim() !== '')
  console.log(res)
  return res
}

function idToText (id) {
  return new Promise(function (resolve, reject) {
    epub.getChapterRaw(id, function (err, text) {
      if (err) { throw (err) }
      resolve(cleanText(text).length)
    })
  })
}

function main () {
  Promise.all(epub.flow.map((chapter) => {
    return idToText(chapter.id).then(function (res) {
      // console.log(res)
      total += res
    })
  })).then(() => {
    // all done!
    console.log(`word count: ${total}`)
  }).catch((err) => {
    console.log(err)
  })
}
