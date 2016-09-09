'use strict'

import { Options } from './interfaces'
export { Options as WordCountOptions } from './interfaces'

import EPub = require('epub')
// import * as things from '../tstest'

import _ = require('lodash')

type PromisifyEvent = (server: any, event: string) => Promise<void>
const promisifyEvent:PromisifyEvent = require('promisify-event')

const ignoredTitlesRegex = /acknowledgment|copyright|cover|dedication|title|author|contents/i
// match all html tags, no matter their contents
const htmlRegex = /(<([^>]+)>)/ig

// takes a path to an ebook file
export async function countWords (path: string, options?: Options) {
  const defaults: Options = { print: false, fragile: true }
  const opts = _.merge({}, defaults, options)

  const epub = new EPub(path)
  try {
    epub.parse()
  } catch (e) {
    const message = `${e.message} :: (path: "${path}")`
    if (opts.fragile) {
      throw new Error(message)
    } else {
      console.log(message)
    }
  }

  await promisifyEvent(epub, 'end')
  return await main(epub, opts)
}

function cleanText (text: string) {
  const res = text
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
    epub.getChapter(id, function (err: Error, text: string) {
      if (err) { throw (err) }
      resolve(cleanText(text).length)
    })
  })
}

async function main (epub: EPub, options: Options) {
  let total = 0
  const promises = epub.flow.map(async (chapter) => {
    if (chapter.title === undefined || !chapter.title.match(ignoredTitlesRegex)) {
      const res = await chapterLength(chapter.id, epub)
      total += res
    }
  })
  await Promise.all(promises) // basically a glorified pause

  if (options.print) {
    const metadata = epub.metadata
    console.log(`${metadata.title}`)
    console.log('-'.repeat(metadata.title.length))
    console.log(` * Word Count: ${total}`)
    console.log()
  }

  return total
}
