import {
  countCharactersInBook,
  countWordsInBook,
  getEpubPaths,
  getTextInChapters,
  parseEpubAtPath,
  getBookDetails
} from './utils'

export {
  countCharactersInBook,
  countWordsInBook,
  getEpubPaths,
  getTextInChapters,
  parseEpubAtPath,
  getBookDetails
}

export const countWords = async (path: string) => {
  const book = await parseEpubAtPath(path)
  return countWordsInBook(book)
}

export const countCharacters = async (path: string) => {
  const book = await parseEpubAtPath(path)
  return countCharactersInBook(book)
}
