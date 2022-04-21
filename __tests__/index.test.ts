import { join as pjoin } from 'path'
import { spawnSync } from 'child_process'
import { escapeRegExp } from 'lodash'

import EPub = require('epub')
import {
  countWordsInString,
  cleanText,
  getEpubPaths,
  parseEpubAtPath,
  getTextFromBook,
  countCharactersInBook,
  countWordsInBook,
  shouldParseChapter,
} from '../src/utils'

import { countWords, countCharacters, getText } from '../src/index'

const JEKYLL_STATS = {
  // real answer from the site is 25,820
  // current computed is 25,961
  numWordsMin: 25500,
  numWordsMax: 26000,

  // the "real" answer is probably 11, since the last of the 12 is standard-ebook extras
  numChapters: 12,

  // current computed is 140,086
  numCharsMin: 139500,
  numCharsMax: 141000,
}

// helpers
const countInStr = (input: string, search: string) =>
  (input.match(new RegExp(escapeRegExp(search), 'gmi')) || []).length

const runCommandSync = (cmd: string, args?: string[]) => {
  const { stdout, stderr, status } = spawnSync(cmd, args, {
    encoding: 'utf8',
  })
  if (status) {
    throw new Error(stderr || stdout)
  }
  return { stdout, stderr }
}
const cliPath = pjoin(__dirname, '../lib/cli.js')
const booksPath = pjoin(__dirname, 'books')
const jekyllHydePath = pjoin(booksPath, 'jekyll-hyde.epub')
const martianPath = pjoin(booksPath, 'the-martian.epub')
const srcPath = pjoin(__dirname, '..', 'src') // has no books in it!

const invokeCli = (args: string[]) => runCommandSync('node', [cliPath, ...args])

describe('helper', () => {
  test('functionality', () => {
    expect(countInStr('*whoa*cool*adsf', '*')).toEqual(3)
    expect(countInStr("i'm, walking, here", ',')).toEqual(2)
    expect(
      countInStr('asdf\n----\n  * 123,234\n\nqer---\n  * DRM detected', '*')
    ).toEqual(2)
  })
})

describe('should parse chapter', () => {
  test('falsy title', () => {
    expect(
      shouldParseChapter({
        level: 0,
        order: 1,
        title: '',
        id: 'blah-1',
        href: '',
      })
    ).toBeTruthy()
  })
  test('present title', () => {
    expect(
      shouldParseChapter({
        level: 0,
        order: 1,
        title: 'something',
        id: 'blah-1',
        href: '',
      })
    ).toBeTruthy()
  })
})

describe('counting data', () => {
  describe('countWords', () => {
    test('functionality', () => {
      expect(countWordsInString('this has some words')).toEqual(4)
      expect(countWordsInString('this . was cool')).toEqual(4)
      expect(
        countWordsInString(
          'Mr. Johnson took a long look at the thing. Then he did\nthat.'
        )
      ).toEqual(13)
    })
  })

  describe('cleanText', () => {
    test('removing tags', () => {
      expect(
        cleanText(
          'I am <strong>stronger</strong> and <em><strong>nested</strong></em>'
        )
      ).toEqual('I am stronger and nested')
    })
    test('remove tag followed by punctuation', () => {
      expect(
        cleanText(
          "What about <i>it<i>? <i>I</i> said <i>that</i> <u>was</u> <b>cool</b>... <i>but<i>, there's <u>something</u>! This is <em><strong>wild</strong></em>."
        )
      ).toEqual(
        "What about it? I said that was cool... but, there's something! This is wild."
      )
    })
    test('remove quotes', () => {
      expect(cleanText('What would you say you "do" here?')).toEqual(
        'What would you say you do here?'
      )
    })
    test('removing everything needed', () => {
      // chapter 6 from jekyll
      expect(
        cleanText(
          'drew out and set before him an envelope addressed by the hand and sealed with the seal of his dead friend. “<strong>Private</strong>: for the hands of <span class="name">G. J.</span> Utterson <strong>alone</strong>, and in case of his predecease <em>to be destroyed unread</em>,” so it was emphatically superscribed; and the lawyer dreaded to behold the contents.'
        )
      ).toEqual(
        'drew out and set before him an envelope addressed by the hand and sealed with the seal of his dead friend. “Private: for the hands of G. J. Utterson alone, and in case of his predecease to be destroyed unread,” so it was emphatically superscribed; and the lawyer dreaded to behold the contents.'
      )
    })
  })
})

describe('file utils', () => {
  describe('getEpubPaths', () => {
    // use mock fs, but i'll use my own for now
    test('simple functionality', async () => {
      expect(
        // has 3 files, only one is epub
        await getEpubPaths(
          '/Users/david/Dropbox/Ebooks/Fiction/Machine_of_Death-_A_Collection_of_Stories_About_People_Who_Know_How_They_Will_Die_(ePub)'
        )
      ).toEqual([
        '/Users/david/Dropbox/Ebooks/Fiction/Machine_of_Death-_A_Collection_of_Stories_About_People_Who_Know_How_They_Will_Die_(ePub)/machine_of_death.epub',
      ])
    })

    test('no valid', async () => {
      expect(await getEpubPaths(srcPath)).toEqual([])
    })

    test('recursive functionality', async () => {
      // deeply nested, only a few epubs
      const paths = await getEpubPaths('/Users/david/Dropbox/Ebooks/Textbooks')
      ;[
        '/Users/david/Dropbox/Ebooks/Textbooks/Thinking in Redux/thinking-in-Redux.epub',
        '/Users/david/Dropbox/Ebooks/Textbooks/writing_an_interpreter_in_go_1.7/writing_an_interpreter_in_go_1.7.epub',
        '/Users/david/Dropbox/Ebooks/Textbooks/java-the-legend.epub',
      ].forEach((path) => {
        expect(paths.includes(path)).toEqual(true)
      })
    })
  })

  describe('parseEpubAtPath', () => {
    test('existing file', async () => {
      const epub = await parseEpubAtPath(jekyllHydePath)
      expect(epub.metadata.title).toEqual(
        'The Strange Case of Dr. Jekyll and Mr. Hyde'
      )
      expect(epub.hasDRM()).toBeFalsy()
    })
    test('missing file', async () => {
      await expect(
        parseEpubAtPath(pjoin(__dirname, 'blah.epub'))
      ).rejects.toThrow('Invalid/missing file')
    })
    test('drm encumbered file no throw', async () => {
      const epub = await parseEpubAtPath(
        pjoin(__dirname, 'books', 'the-martian.epub')
      )
      expect(epub.hasDRM()).toBeTruthy()
    })
    test('drm encumbered file throw', async () => {
      await expect(
        parseEpubAtPath(pjoin(__dirname, 'books', 'the-martian.epub'), {
          throwForDrm: true,
        })
      ).rejects.toThrow('DRM')
    })
    test('non-epub file', async () => {
      await expect(
        parseEpubAtPath(pjoin(__dirname, 'some-file.txt'))
      ).rejects.toThrow('non-epub')
    })
    test('broken epub file', async () => {
      await expect(
        parseEpubAtPath(pjoin(__dirname, 'books', 'alice_broken.epub'))
      ).rejects.toThrow(
        'Parsing container XML failed in TOC: Invalid character in entity name'
      )
    })
  })
})

describe('book-level operations', () => {
  let epub: EPub
  beforeAll(async () => {
    epub = await parseEpubAtPath(jekyllHydePath)
  })

  test('getting chapters', async () => {
    const chapters = await getTextFromBook(epub)
    expect(chapters.length).toEqual(JEKYLL_STATS.numChapters) // might change if I get better heuristics about which chapters to parse
    expect(chapters[0].length).toBeGreaterThan(100)
  })

  test('counting words', async () => {
    const wordCount = await countWordsInBook(epub, false)
    expect(wordCount).toBeGreaterThan(JEKYLL_STATS.numWordsMin)
    expect(wordCount).toBeLessThan(JEKYLL_STATS.numWordsMax)
  })

  test('counting characters', async () => {
    const characterCount = await countCharactersInBook(epub, false)
    expect(characterCount).toBeGreaterThan(JEKYLL_STATS.numCharsMin)
    expect(characterCount).toBeLessThan(JEKYLL_STATS.numCharsMax)
  })
})

describe('cli', () => {
  describe('basic operation', () => {
    test('single file input', () => {
      const { stdout, stderr } = invokeCli([jekyllHydePath])
      expect(countInStr(stdout, ',')).toEqual(1)
      expect(countInStr(stdout, '*')).toEqual(1)
      expect(stderr).toEqual('')
      expect(stdout.includes('Jekyll')).toBeTruthy()
    })
    test('multi file input', () => {
      const { stdout, stderr } = invokeCli([jekyllHydePath, martianPath])
      expect(countInStr(stdout, ',')).toEqual(1)
      expect(countInStr(stdout, '*')).toEqual(2)
      expect(countInStr(stdout, 'skipping')).toEqual(0)
      expect(stderr).toEqual('')
      expect(stdout.includes('Jekyll')).toBeTruthy()
    })
    test('directory input', () => {
      const { stdout, stderr } = invokeCli([booksPath])
      expect(countInStr(stdout, ',')).toEqual(1)
      expect(countInStr(stdout, '*')).toEqual(2)
      expect(countInStr(stdout, 'skipping')).toEqual(0)

      expect(countInStr(stdout, 'Jekyll')).toEqual(1)
      expect(countInStr(stdout, 'Martian')).toEqual(1)
      expect(countInStr(stdout, 'DRM')).toEqual(1)

      expect(countInStr(stderr, 'skipping')).toEqual(1)
    })
  })

  test('raw mode', () => {
    const { stdout } = invokeCli([jekyllHydePath, '-r'])
    expect(stdout.includes('*')).toBeFalsy()
    expect(stdout.includes(',')).toBeFalsy()
    expect(stdout.includes('Jekyll')).toBeFalsy()
    const result = parseInt(stdout, 10)
    expect(result).toBeGreaterThan(JEKYLL_STATS.numWordsMin)
    expect(result).toBeLessThan(JEKYLL_STATS.numWordsMax)
  })

  test('raw+DRM mode', () => {
    const { stdout } = invokeCli([martianPath, '-r'])
    expect(stdout).toEqual('')
  })

  test('raw character mode', () => {
    const { stdout } = invokeCli([jekyllHydePath, '-rc'])
    expect(stdout.includes('*')).toBeFalsy()
    expect(stdout.includes(',')).toBeFalsy()
    expect(stdout.includes('Jekyll')).toBeFalsy()
    const result = parseInt(stdout, 10)
    expect(result).toBeGreaterThan(JEKYLL_STATS.numCharsMin)
    expect(result).toBeLessThan(JEKYLL_STATS.numCharsMax)
  })

  test('text mode', () => {
    const { stdout } = invokeCli([jekyllHydePath, '-t'])
    expect(stdout.length).toBeGreaterThan(JEKYLL_STATS.numCharsMin)
    expect(stdout.length).toBeLessThan(JEKYLL_STATS.numCharsMax)
  })

  test('raw multi should throw', () => {
    expect(() => invokeCli([jekyllHydePath, martianPath, '-r'])).toThrow(
      'either'
    )
  })
  test('chars and text should throw', () => {
    expect(() => invokeCli([jekyllHydePath, '-ct'])).toThrow('only specify one')
  })

  test('no good input should throw', () => {
    expect(() => invokeCli([srcPath])).toThrow('no valid epubs')
  })
})

describe('index', () => {
  test('countWords', async () => {
    const wordCount = await countWords(jekyllHydePath)
    expect(wordCount).toBeGreaterThan(JEKYLL_STATS.numWordsMin)
    expect(wordCount).toBeLessThan(JEKYLL_STATS.numWordsMax)

    const bookWordCount = await countWords(
      await parseEpubAtPath(jekyllHydePath)
    )
    expect(bookWordCount).toBeGreaterThan(JEKYLL_STATS.numWordsMin)
    expect(bookWordCount).toBeLessThan(JEKYLL_STATS.numWordsMax)
  })
  test('countCharacters', async () => {
    const characterCount = await countCharacters(jekyllHydePath)
    expect(characterCount).toBeGreaterThan(JEKYLL_STATS.numCharsMin)
    expect(characterCount).toBeLessThan(JEKYLL_STATS.numCharsMax)

    const bookCharacterCount = await countCharacters(
      await parseEpubAtPath(jekyllHydePath)
    )
    expect(bookCharacterCount).toBeGreaterThan(JEKYLL_STATS.numCharsMin)
    expect(bookCharacterCount).toBeLessThan(JEKYLL_STATS.numCharsMax)
  })
  test('getText', async () => {
    const chapters = await getText(jekyllHydePath)
    expect(chapters.length).toEqual(JEKYLL_STATS.numChapters)

    const bookChapters = await getText(await parseEpubAtPath(jekyllHydePath))
    expect(bookChapters.length).toEqual(JEKYLL_STATS.numChapters)
  })
})
