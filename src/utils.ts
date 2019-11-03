import EPub = require('epub')
import { TocElement } from 'epub'
import decode = require('parse-entities')
import promisifyEvent = require('promisify-event')

import { stat, readdir } from 'mz/fs'
import { join as pjoin } from 'path'
import debugFunc from 'debug'

const debug = debugFunc('wordcount')

// match all html tags, no matter their contents
const htmlRegex = /(<([^>]+)>)/gi
const floatingChars = ['.', '?', '!', ':', ';', ',']

const _cleanText = (text: string) => {
  // a sentence that ends with a tag followed by a period was leaving an extra space
  let result = decode(text)

  result = result
    .replace(htmlRegex, ' ') // these are replaced by spaces so that newlines in the text are properly tokenizedz
    .replace(/“ /g, '“')
    .replace(/ ”/g, '”')
    .replace(/"/g, '') // non-smart quotes complicate spaces and counting words, but don't really matter
    .replace(/\s+/g, ' ')
    .trim()

  floatingChars.forEach(c => {
    result = result.replace(new RegExp(` \\${c}`, 'g'), c)
  })

  return result
}
/**
 * returns a stnadard, space-separated version of the input text
 */
export const cleanText = (text: string): string => {
  // could loop here until there are no changes, but that's minimum 2x runs, plus most of what it catches after the first are just malformed in the first place
  return _cleanText(text)
}

/**
 * given a space-separated string, counts the number of words.
 */
export const countWordsInString = (text: string) => {
  return text.split(/\s+/gm).filter(x => Boolean(x.trim())).length
}

// TODO: be smarter about this
// id also has info?
const ignoredTitlesRegex = /acknowledgment|copyright|cover|dedication|title|author|contents/i
export const shouldParseChapter = (chapter: TocElement): boolean => {
  return !Boolean(chapter.title) || !chapter.title.match(ignoredTitlesRegex)
}

/**
 * given a valid parsed book, returns an array of strings. Each array element is the full text of a chapter.
 */
export const getTextFromBook = async (book: EPub): Promise<string[]> => {
  if (book.hasDRM()) {
    return []
  }

  const getTextForChapter = async (id: string): Promise<string> => {
    return new Promise(resolve => {
      // using getChapter instead of getChapterRaw. the former of which pulls out style automatically
      try {
        book.getChapter(id, (err: Error, text: string) => {
          if (err) {
            debug(`failed to parse chapter id: ${id} because of error: ${err}`)
            // eat the error
            resolve('')
          }

          resolve(cleanText(text))
        })
      } catch (err) {
        debug(
          `hard failed to parse chapter id: ${id} because of error: "${err}" in book ${book.metadata.title}`
        )
        resolve('')
      }
    })
  }

  return (await Promise.all(
    book.flow.map(async chapter => {
      if (!shouldParseChapter(chapter)) {
        return ''
      }
      return getTextForChapter(chapter.id)
    })
  )).filter(Boolean)
}

/**
 * given a path, returns a parsed, DRM-free epub file, ready for use. Takes extra [options](https://github.com/julien-c/epub#usage), useful for parsing non-default epubs. See [here](https://github.com/julien-c/epub#usage) for more info
 */
export const parseEpubAtPath = async (
  path: string,
  {
    imageWebRoot,
    chapterWebRoot,
    throwForDrm = false
  }: {
    imageWebRoot?: string
    chapterWebRoot?: string
    throwForDrm?: boolean
  } = {}
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
    const message = `Unable to accurately count "${epub.metadata.title}" because it's DRM encumbered`
    if (throwForDrm) {
      throw new Error(message)
    }
    debug(message)
  }

  return epub
}

export const getEpubPaths = async (fpath: string): Promise<string[]> => {
  const statRes = await stat(fpath)
  if (statRes.isDirectory()) {
    const files = await readdir(fpath)

    const recursedPaths = await Promise.all(
      files.map(f => getEpubPaths(pjoin(fpath, f)))
    )
    return recursedPaths.reduce((res, path) => res.concat(path), [])
  } else if (fpath.endsWith('epub')) {
    return [fpath]
  }

  return []
}

const getWordCountsForChapters = (chapters: string[]): number =>
  chapters.reduce(
    (total, chapterText) => countWordsInString(chapterText) + total,
    0
  )

const getCharacterCountsForChapters = (chapters: string[]): number =>
  chapters.reduce((total, chapterText) => chapterText.length + total, 0)

export const countWordsInBook = async (book: EPub): Promise<number> => {
  const chapterTexts = await getTextFromBook(book)
  return getWordCountsForChapters(chapterTexts)
}

export const countCharactersInBook = async (book: EPub): Promise<number> => {
  const chapterTexts = await getTextFromBook(book)
  return getCharacterCountsForChapters(chapterTexts)
}

// this mostly combines the above
export const getBookDetails = async (book: EPub) => {
  const chapterTexts = await getTextFromBook(book)
  return {
    text: chapterTexts.join('\n'),
    characterCount: getCharacterCountsForChapters(chapterTexts),
    wordCount: getWordCountsForChapters(chapterTexts)
  }
}
