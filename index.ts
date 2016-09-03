'use strict'

import EPub = require('epub')
import promisifyEvent = require('promisify-event')
import _ = require('lodash')

// var promisify = require('bluebird-events')

const ignoredTitlesRegex = /acknowledgment|copyright|cover|dedication|title|author|contents/i
// match all html tags, no matter their contents
const htmlRegex = /(<([^>]+)>)/ig

// takes a path to an ebook file
export = async function countWords (path: string, options: Options) {
  // load defaults
  let opts = _.merge({}, { print: false, recursive: false }, options)

  let epub = new EPub(path)
  try {
    epub.parse()
  } catch (e) {
    console.log(`${e.message} :: (path: "${path}")`)
  }

  await promisifyEvent(epub, 'end')
  return await main(epub, opts)
}

function cleanText (text: string) {
  let res = text
    // these are replaced by spaces so that newlines in the text are properly tokenized
    .replace(htmlRegex, ' ')
    .replace(/[\n\t\r]/g, ' ')
    .split(' ')
    .filter(x => x.trim() !== '')
  // console.log(res)
  return res
}

function chapterLength (id: string, epub: EPub): Promise<number> {
  return new Promise(function (resolve, reject) {
    // using this instead of getChapterRaw, which pulls out style and stuff for me
    epub.getChapter(id, function (err, text: string) {
      if (err) { throw (err) }
      resolve(cleanText(text).length)
    })
  })
}

async function main (epub: EPub, options: Options) {
  let total = 0
  const promises = epub.flow.map(async (chapter: Chapter) => {
    if (chapter.title === undefined || !chapter.title.match(ignoredTitlesRegex)) {
      const res = await chapterLength(chapter.id, epub)
      total += res
    }
  })
  await Promise.all(promises) // basically a glorified pause

  if (options.print) {
    const metadata = <Metadata> epub.metadata
    console.log(`${metadata.title}`)
    console.log('-'.repeat(metadata.title.length))
    console.log(` * Word Count: ${total}`)
    console.log()
  }

  return total
}
