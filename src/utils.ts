import EPub = require('epub')
import decode = require('parse-entities')
import * as fs from 'mz/fs'

import * as _ from 'lodash'

import { join as pjoin } from 'path'

import debugFunc from 'debug'

const debug = debugFunc('wordcount')

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

const _cleanText = (text: string) =>
  text
    .replace(htmlRegex, ' ') // these are replaced by spaces so that newlines in the text are properly tokenized

    // TODO: better way to replace this all?
    .replace(/ \./g, '.') // a sentence that ends with a tag followed by a period was leaving an extra space
    .replace(/ \?/g, '?') // same with all of these
    .replace(/ !/g, '!')
    .replace(/ :/g, ':')
    .replace(/ ;/g, ';')
    .replace(/ ,/g, ',')
    .replace(/“ /g, '“')
    .replace(/ ”/g, '”')
    .replace(/"/g, '') // non-smart quotes complicate spaces and counting words, but don't really matter
    .replace(/\s+/g, ' ')
    .trim()

/**
 * returns a stnadard, space-separated version of the input text
 */
export const cleanText = (text: string): string => {
  // keep cleaning text until there are no changes
  let res
  let last = text
  while (true) {
    res = _cleanText(last)
    if (res === last) {
      break
    }
    last = res
  }

  return decode(res)
}

/**
 * given a space-separated string, counts the number of words.
 */
export const countWordsInString = (text: string) => {
  return text.split(/\s+/gm).filter(x => Boolean(x.trim())).length
}

// TODO: be smarter about this
// id also has info?
export const shouldParseChapter = (chapter: TocElement): boolean => {
  return !Boolean(chapter.title) || !chapter.title.match(ignoredTitlesRegex)
}

/**
 * given a valid parsed book, returns an array of strings, where each string is a full chapter text
 */
export const getTextInChapters = async (book: EPub): Promise<string[]> => {
  const getTextForChapter = async (id: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      // using getChapter instead of getChapterRaw. the former of which pulls out style automatically
      book.getChapter(id, (err: Error, text: string) => {
        if (err) {
          debug(err)
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
 * TODO: Remove
 */
// const oldMain = async (epub: EPub, options: Options) => {
//   const getCleanTextForChapter = async (id: string): Promise<string> => {
//     return new Promise((resolve, reject) => {
//       // getChapter strips most html, which is awesome
//       epub.getChapter(id, (err: Error, text: string) => {
//         if (err) {
//           reject(err)
//         }

//         resolve(cleanText(text))
//       })
//     })
//   }

//   const chapters = []
//   for (const chapter of epub.flow) {
//     if (shouldParseChapter(chapter)) {
//       try {
//         const res = await getCleanTextForChapter(chapter.id)
//         chapters.push(res)
//       } catch (e) {
//         if (!options.quiet) {
//           console.log(
//             `Issue with chapter ${chapter.id} in book ${epub.metadata.title}`
//           )
//         }
//       }
//     }
//   }

//   if (epub.hasDRM()) {
//     if (options.print) {
//       console.log(' * DRM detected')
//     }
//     return -1
//   }

//   if (options.text) {
//     if (options.print) {
//       console.log(chapters.join('\n'))
//     }
//     return chapters.join('\n')
//   } else {
//     // to modify this, return the most basic version of this
//     const count = 33 // chapters.reduce((a, c) => a + nCount(options, c), 0)
//     if (options.print) {
//       const metadata = epub.metadata
//       console.log(metadata.title)
//       console.log('-'.repeat(metadata.title.length))

//       console.log(
//         ` * ${count.toLocaleString()} ` +
//           (options.chars ? 'characters' : 'words')
//       )

//       console.log()
//     }

//     return count
//   }
// }

/**
 * given a path, returns a parsed, DRM-free epub file, ready for use.
 */
export const parseEpubAtPath = async (
  path: string,
  {
    imageWebRoot,
    chapterWebRoot
  }: { imageWebRoot?: string; chapterWebRoot?: string } = {}
) => {
  // this could concievably fail for a path that ends in `.epub`. don't do that
  if (!path.endsWith('.epub')) {
    throw new Error('unable to parse non-epub file')
  }
  const epub = new EPub(path, imageWebRoot, chapterWebRoot)
  try {
    epub.parse()
  } catch (e) {
    const message = `${e.message} :: (path: "${path}")\n`
    throw new Error(message)
  }

  await promisifyEvent(epub, 'end')

  if (epub.hasDRM()) {
    throw new Error(
      `Unable to accurately count "${epub.metadata.title}" because it's DRM protected`
    )
  }

  return epub
}

export const getEpubPaths = async (fpath: string): Promise<string[]> => {
  const stat = await fs.stat(fpath)
  if (stat.isDirectory()) {
    const files = await fs.readdir(fpath)

    // const newPaths: string[] = []
    // for (const p of files) {
    //   newPaths.concat(await getEpubPaths(p))
    // }
    // return newPaths
    const recursedPaths = await Promise.all(
      files.map(f => getEpubPaths(pjoin(fpath, f)))
    )
    return recursedPaths.reduce((res, path) => res.concat(path), [])
  } else if (fpath.endsWith('epub')) {
    return [fpath]
  }

  return []
}

// takes a path to an ebook file
// export const countWordsForFileAtPath = async (
//   path: string,
//   {
//     print = false,
//     sturdy = false,
//     quiet = false,
//     chars = false,
//     text = false
//   }: Options = {}
// ) => {
//   const epub = new EPub(path)
//   try {
//     epub.parse()
//   } catch (e) {
//     const message = `${e.message} :: (path: "${path}")\n`
//     // console.log('might throw', sturdy)
//     if (sturdy) {
//       console.log(message)
//     } else {
//       throw new Error(message)
//     }
//   }

//   await promisifyEvent(epub, 'end')
//   if (!sturdy && epub.hasDRM()) {
//     throw new Error(
//       `Unable to accurately count "${epub.metadata.title}" because it's DRM protected`
//     )
//   } else {
//     return oldMain(epub, { print, sturdy, quiet, chars, text })
//   }
// }

export const countWordsInBook = async (book: EPub): Promise<number> => {
  const chapterTexts = await getTextInChapters(book)
  return chapterTexts.reduce(
    (total, chapterText) => countWordsInString(chapterText) + total,
    0
  )
}

export const countCharactersInBook = async (book: EPub): Promise<number> => {
  const chapterTexts = await getTextInChapters(book)
  return chapterTexts.reduce(
    (total, chapterText) => chapterText.length + total,
    0
  )
}
