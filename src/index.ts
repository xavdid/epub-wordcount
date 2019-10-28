import {
  countCharactersInBook,
  countWordsInBook,
  getTextInChapters,
  parseEpubAtPath
} from './utils'

export {
  countCharactersInBook,
  countWordsInBook,
  getTextInChapters,
  parseEpubAtPath
}

export const countWords = async (path: string) => {
  const book = await parseEpubAtPath(path)
  return countWordsInBook(book)
}

export const countCharacters = async (path: string) => {
  const book = await parseEpubAtPath(path)
  return countCharactersInBook(book)
}
