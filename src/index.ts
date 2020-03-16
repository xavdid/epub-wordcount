import EPub = require('epub')
import {
  countCharactersInBook,
  countWordsInBook,
  getTextFromBook,
  parseEpubAtPath
} from './utils'

export { parseEpubAtPath }

const performOperationOnBook = async (
  pathOrEpub: string | EPub,
  ignoreDrm: boolean,
  operation: (book: EPub, ignoreDrm: boolean) => any
) => {
  let book: EPub
  if (typeof pathOrEpub === 'string') {
    book = await parseEpubAtPath(pathOrEpub)
  } else {
    book = pathOrEpub
  }
  if (book.hasDRM() && !ignoreDrm) {
    return -1
  }
  return operation(book, ignoreDrm)
}

type pathOrBook = string | EPub

/**
 * given a path to a valid epub file (or a file that's been parsed by `parseEpubAtPath`), return the word count
 */
export const countWords = async (
  pathOrEpub: pathOrBook,
  ignoreDrm: boolean = false
): ReturnType<typeof countWordsInBook> =>
  performOperationOnBook(pathOrEpub, ignoreDrm, countWordsInBook)

/**
 * given a path to a valid epub file (or a file that's been parsed by `parseEpubAtPath`), return the character count
 */
export const countCharacters = async (
  pathOrEpub: pathOrBook,
  ignoreDrm: boolean = false
): ReturnType<typeof countCharactersInBook> =>
  performOperationOnBook(pathOrEpub, ignoreDrm, countCharactersInBook)

/**
 * given a path to a valid epub file (or a file that's been parsed by `parseEpubAtPath`), return all the text in the book
 */
export const getText = async (
  pathOrEpub: pathOrBook,
  ignoreDrm: boolean = false
): ReturnType<typeof getTextFromBook> =>
  performOperationOnBook(pathOrEpub, ignoreDrm, getTextFromBook)
