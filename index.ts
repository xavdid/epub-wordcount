'use strict'

import EPub = require('epub')

import _ = require('lodash')

export interface Options {
  print?: boolean
  sturdy?: boolean
  quiet?: boolean
  chars?: boolean
}

type PromisifyEvent = (server: any, event: string) => Promise<void>
const promisifyEvent: PromisifyEvent = require('promisify-event')

const ignoredTitlesRegex = /acknowledgment|copyright|cover|dedication|title|author|contents/i
// match all html tags, no matter their contents
const htmlRegex = /(<([^>]+)>)/gi

// takes a path to an ebook file
export async function countWords(path: string, options?: Options) {
  const defaults: Options = { print: false, sturdy: false, quiet: false }
  const opts = _.merge({}, defaults, options)

  const epub = new EPub(path)
  try {
    epub.parse()
  } catch (e) {
    const message = `${e.message} :: (path: "${path}")\n`
    if (opts.sturdy) {
      console.log(message)
    } else {
      throw new Error(message)
    }
  }

  await promisifyEvent(epub, 'end')
  if (!opts.sturdy && epub.hasDRM()) {
    throw new Error(
      `Unable to accurately count "${epub.metadata.title}" because it is DRM protected`
    )
  } else {
    return main(epub, opts)
  }
}

function cleanText(text: string) {
  const res = text
    // these are replaced by spaces so that newlines in the text are properly tokenized
    .replace(htmlRegex, ' ')
    .replace(/[\n\t\r]/g, ' ')
  // console.log(res)
  return res
}

function nWords(text: string) {
  return text.split(' ').filter(x => x.trim() !== '').length
}

function nCount(options: Options, text: string) {
  const clean = cleanText(text)
  return options.chars ? clean.length : nWords(clean)
}

function chapterLength(
  id: string,
  epub: EPub,
  options: Options
): Promise<number> {
  return new Promise(function(resolve, reject) {
    // using this instead of getChapterRaw, which pulls out style and stuff for me
    epub.getChapter(id, function(err: Error, text: string) {
      if (err) {
        reject(err)
      }

      resolve(nCount(options, text))
    })
  })
}

async function main(epub: EPub, options: Options) {
  let total = 0
  const promises = epub.flow.map(async chapter => {
    if (
      chapter.title === undefined ||
      !chapter.title.match(ignoredTitlesRegex)
    ) {
      try {
        const res = await chapterLength(chapter.id, epub, options)
        total += res
      } catch (e) {
        if (!options.quiet) {
          console.log(
            `Issue with chapter ${chapter.id} in book ${epub.metadata.title}`
          )
        }
      }
    }
  })
  await Promise.all(promises) // basically a glorified pause

  if (options.print) {
    const metadata = epub.metadata
    console.log(metadata.title)
    console.log('-'.repeat(metadata.title.length))

    if (epub.hasDRM()) {
      // if there's DRM, the answer is way too low
      console.log(' * DRM detected')
    } else {
      console.log(
        ` * ${total.toLocaleString()} ` +
          (options.chars ? 'characters' : 'words')
      )
    }
    console.log()
  }

  if (epub.hasDRM()) {
    return -1
  } else {
    return total
  }
}
