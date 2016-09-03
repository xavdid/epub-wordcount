#! /usr/bin/env node

'use strict'

const EPub = require('epub')
const promisifyEvent = require('promisify-event')

// var promisify = require('bluebird-events')

const ignoredTitlesRegex = /acknowledgment|copyright|cover|dedication|title|author|contents/i
// match all html tags, no matter their contents
const htmlRegex = /(<([^>]+)>)/ig

// takes a path to an ebook file
function countWords (path, options) {
  options = options || {print: false}
  let epub = new EPub(path)
  try {
    epub.parse()
  } catch (e) {
    console.log(`${e.message} :: (path: "${path}")`)
  }

  return promisifyEvent(epub, 'end').then(() => {
    return main(epub, options)
  })
}

// promisify(epub, {resolve: 'end'})

// epub.parse().then(() => {
//   main()
// })

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

function idToText (id, epub) {
  return new Promise(function (resolve, reject) {
    // using this instead of getChapterRaw pulls out style and stuff for me
    epub.getChapter(id, function (err, text) {
      if (err) { throw (err) }
      resolve(cleanText(text).length)
    })
  })
}

function main (epub, options) {
  let total = 0
  return Promise.all(epub.flow.map((chapter) => {
    // console.log(chapter.title)
    // if title exists, make sure it's not an ignored page
    if (chapter.title === undefined || !chapter.title.match(ignoredTitlesRegex)) {
      return idToText(chapter.id, epub).then((res) => {
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
    if (options.print) {
      console.log(`${epub.metadata.title}`)
      console.log('-'.repeat(epub.metadata.title.length))
      console.log(` * Word Count: ${total}`)
      console.log()
    }
    return Promise.resolve(total)
  }).catch((err) => {
    console.log(err)
  })
}

module.exports = countWords
