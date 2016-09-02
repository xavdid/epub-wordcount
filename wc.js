#! /usr/bin/env node

'use strict'

const EPub = require('epub')

// var promisify = require('bluebird-events')

const ignoredTitlesRegex = /acknowledgment|copyright|cover|dedication|title|author|contents/i
// match all html tags, no matter their contents
const htmlRegex = /(<([^>]+)>)/ig
let total = 0

// const title = 'Cline - Ready Player One (2011).epub'
// const title = 'Rothfuss - The Name of the Wind (2007).epub'
const title = 'Gaiman - American Gods (2002).epub'
// const title = 'Priest - The Adjacent (2013).epub'

let epub = new EPub(`/Users/david/Dropbox/Ebooks/Singles/${title}`)
try {
  epub.parse()
} catch (e) {
  console.log(e.message)
}
// promisify(epub, {resolve: 'end'})

// epub.parse().then(() => {
//   main()
// })

epub.on('end', function () {
  main()
})

function cleanText (text) {
  let res = text
    // these are replaced by spaces so that newlines in the text are properly tokenized
    .replace(htmlRegex, ' ')
    .replace(/[\n\t\r]/g, ' ')
    .split(' ')
    .filter(x => x.trim() !== '')
  // console.log(res)
  return res
}

function idToText (id) {
  return new Promise(function (resolve, reject) {
    epub.getChapter(id, function (err, text) {
      if (err) { throw (err) }
      resolve(cleanText(text).length)
    })
  })
}

function main () {
  Promise.all(epub.flow.map((chapter) => {
    // console.log(chapter.title)
    // if title exists, make sure it's not an ignored page
    if (chapter.title === undefined || !chapter.title.match(ignoredTitlesRegex)) {
      return idToText(chapter.id).then((res) => {
        // console.log(res)
        total += res
      // console.log(`word count: ${total}`)
      })
    } else {
      // skip it!
      return Promise.resolve()
    }
  })).then(() => {
    // all done!
    console.log(`${epub.metadata.title}:`)
    console.log(`word count: ${total}`)
  }).catch((err) => {
    console.log(err)
  })
}
