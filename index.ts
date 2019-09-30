'use strict'

import EPub = require('epub')

import _ = require('lodash')

export interface Options {
  print?: boolean
  sturdy?: boolean
  quiet?: boolean
  chars?: boolean
  text?: boolean
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
  // const clean = cleanText(text)
  return options.chars ? text.length : nWords(text)
}

function chapterText(
  id: string,
  epub: EPub,
  options: Options
): Promise<string> {
  return new Promise(function(resolve, reject) {
    // using this instead of getChapterRaw, which pulls out style and stuff for me
    epub.getChapter(id, function(err: Error, text: string) {
      if (err) {
        reject(err)
      }

      resolve(cleanText(text))
    })
  })
}

async function main(epub: EPub, options: Options) {
  let chapters = []
  for (const chapter of epub.flow) {
    if (
      chapter.title === undefined ||
      !chapter.title.match(ignoredTitlesRegex)
    ) {
      try {
        const res = await chapterText(chapter.id, epub, options)
        chapters.push(res)
      } catch (e) {
        if (!options.quiet) {
          console.log(
            `Issue with chapter ${chapter.id} in book ${epub.metadata.title}`
          )
        }
      }
    }
  }
  // await Promise.all(promises) // basically a glorified pause

  if (epub.hasDRM()) {
    if (options.print) {
      console.log(' * DRM detected')
    }
    return -1
  }

  if (options.text) {
    if (options.print) console.log(chapters.join('\n'))
    return chapters.join('\n')
  } else {
    const count = chapters.reduce((a, c) => a + nCount(options, c), 0)
    if (options.print) {
      const metadata = epub.metadata
      console.log(metadata.title)
      console.log('-'.repeat(metadata.title.length))

      console.log(
        ` * ${count.toLocaleString()} ` +
          (options.chars ? 'characters' : 'words')
      )

      console.log()
    }

    return count
  }
}
