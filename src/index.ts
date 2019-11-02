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
  operation: (book: EPub) => any
) => {
  let book: EPub
  if (typeof pathOrEpub === 'string') {
    book = await parseEpubAtPath(pathOrEpub)
  } else {
    book = pathOrEpub
  }
  if (book.hasDRM()) {
    return -1
  }
  return operation(book)
}

type pathOrBook = string | EPub

/**
 * given a path to a valid epub file (or a file that's been parsed by `parseEpubAtPath`), return the word count
 */
export const countWords = async (
  pathOrEpub: pathOrBook
): ReturnType<typeof countWordsInBook> =>
  performOperationOnBook(pathOrEpub, countWordsInBook)

/**
 * given a path to a valid epub file (or a file that's been parsed by `parseEpubAtPath`), return the character count
 */
export const countCharacters = async (
  pathOrEpub: pathOrBook
): ReturnType<typeof countCharactersInBook> =>
  performOperationOnBook(pathOrEpub, countCharactersInBook)

/**
 * given a path to a valid epub file (or a file that's been parsed by `parseEpubAtPath`), return all the text in the book
 */
export const getText = async (
  pathOrEpub: pathOrBook
): ReturnType<typeof getTextFromBook> =>
  performOperationOnBook(pathOrEpub, getTextFromBook)
