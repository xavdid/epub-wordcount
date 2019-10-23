'use strict'

import EPub = require('epub')
import decode = require('parse-entities')

import _ = require('lodash')

export interface Options {
  print?: boolean
  sturdy?: boolean
  quiet?: boolean
  chars?: boolean
  text?: boolean
}

// temporarily copied from the epub defs
interface TocElement {
  level: number
  order: number
  title: string
  id: string
  href?: string
}

type PromisifyEvent = (server: any, event: string) => Promise<void>
const promisifyEvent: PromisifyEvent = require('promisify-event')

const ignoredTitlesRegex = /acknowledgment|copyright|cover|dedication|title|author|contents/i
// match all html tags, no matter their contents
const htmlRegex = /(<([^>]+)>)/gi

/**
 * returns a stnadard, space-separated version of the input text
 */
const cleanText = (text: string): string => {
  const res = text
    // these are replaced by spaces so that newlines in the text are properly tokenized
    .replace(htmlRegex, ' ')
    .replace(/\s+/g, ' ')
  return decode(res)
}

/**
 * given a space-separated string, counts the number of words
 */
const numWords = (text: string) => {
  return text.split(' ').filter(x => Boolean(x.trim())).length
}

// const nCount = (options: Options, text: string) => {
//   return options.chars ? text.length : numWords(text)
// }

// TODO: be smarter about this
const shouldParseChapter = (chapter: TocElement): boolean => {
  return chapter.title === undefined || !chapter.title.match(ignoredTitlesRegex)
}

/**
 * returns an array of strings, where each string is a full chapter text
 */
const getTextForBook = async (book: EPub): Promise<string[]> => {
  if (book.hasDRM()) {
    return []
  }

  const getTextForChapter = async (id: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      // using getChapter instead of getChapterRaw. the former which pulls out style automatically
      book.getChapter(id, (err: Error, text: string) => {
        if (err) {
          reject(err)
        }

        resolve(cleanText(text))
      })
    })
  }

  const chapters: string[] = (await Promise.all(
    book.flow.map(async chapter => {
      if (!shouldParseChapter(chapter)) {
        return ''
      }
      return getTextForChapter(chapter.id)
    })
  )).filter(Boolean)

  return chapters
}

/**
 * @deprecated
 */
const main = async (epub: EPub, options: Options) => {
  const getTextForChapter = async (id: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      // using getChapter instead of getChapterRaw. the former which pulls out style automatically
      epub.getChapter(id, (err: Error, text: string) => {
        if (err) {
          reject(err)
        }

        resolve(cleanText(text))
      })
    })
  }

  let chapters = []
  for (const chapter of epub.flow) {
    if (shouldParseChapter(chapter)) {
      try {
        const res = await getTextForChapter(chapter.id)
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

  if (epub.hasDRM()) {
    if (options.print) {
      console.log(' * DRM detected')
    }
    return -1
  }

  if (options.text) {
    if (options.print) {
      console.log(chapters.join('\n'))
    }
    return chapters.join('\n')
  } else {
    // to modify this, return the most basic version of this
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

// takes a path to an ebook file
export const countWords = async (
  path: string,
  {
    print = false,
    sturdy = false,
    quiet = false,
    chars = false,
    text = false
  }: Options = {}
) => {
  const epub = new EPub(path)
  try {
    epub.parse()
  } catch (e) {
    const message = `${e.message} :: (path: "${path}")\n`
    // console.log('might throw', sturdy)
    if (sturdy) {
      console.log(message)
    } else {
      throw new Error(message)
    }
  }

  await promisifyEvent(epub, 'end')
  if (!sturdy && epub.hasDRM()) {
    throw new Error(
      `Unable to accurately count "${epub.metadata.title}" because it's DRM protected`
    )
  } else {
    return main(epub, { print, sturdy, quiet, chars, text })
  }
}

export const newCountWords = async (book: EPub) => {
  const chapterTexts = await readTextForBook(book)
  return chapterTexts.join('\n').length
}

export const countCharacters = async (book: EPub) => {
  const chapterTexts = await readTextForBook(book)
  return chapterTexts.join('\n').split(/\s/gm).length
}

/**
 * Returns the full text of the epub
 */
export const readTextForBook = async (book: EPub) => {
  return getTextForBook(book)
}
