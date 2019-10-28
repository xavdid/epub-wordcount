import EPub = require('epub')
import {
  countWordsInString,
  cleanText,
  getEpubPaths,
  parseEpubAtPath,
  getTextInChapters,
  countCharactersInBook,
  countWordsInBook,
  shouldParseChapter
} from '../src/utils'
import { join as pjoin } from 'path'

const jekyllHydePath = pjoin(__dirname, 'books', 'jekyll-hyde.epub')

describe('should parse chapter', () => {
  test('falsy title', () => {
    expect(
      shouldParseChapter({ level: 0, order: 1, title: '', id: 'blah-1' })
    ).toBeTruthy()
  })
  test('present title', () => {
    expect(
      shouldParseChapter({
        level: 0,
        order: 1,
        title: 'something',
        id: 'blah-1'
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
        '/Users/david/Dropbox/Ebooks/Fiction/Machine_of_Death-_A_Collection_of_Stories_About_People_Who_Know_How_They_Will_Die_(ePub)/machine_of_death.epub'
      ])
    })

    test('recursive functionality', async () => {
      // deeply nested, only a few epubs
      expect(
        (await getEpubPaths('/Users/david/Dropbox/Ebooks/Textbooks')).sort()
      ).toEqual(
        [
          '/Users/david/Dropbox/Ebooks/Textbooks/Thinking in Redux/thinking-in-Redux.epub',
          '/Users/david/Dropbox/Ebooks/Textbooks/Writing an Interpreter in Go (1.5)/writing_an_interpreter_in_go_1.5.epub',
          '/Users/david/Dropbox/Ebooks/Textbooks/java-the-legend.epub',
          '/Users/david/Dropbox/Ebooks/Textbooks/object-oriented-vs-functional-programming.epub',
          '/Users/david/Dropbox/Ebooks/Textbooks/swift-pocket-reference.epub',
          '/Users/david/Dropbox/Ebooks/Textbooks/why-rust.epub'
        ].sort()
      )
    })
  })

  describe('parseEpubAtPath', () => {
    test('existing file', async () => {
      const epub = await parseEpubAtPath(jekyllHydePath)
      expect(epub.metadata.title).toEqual(
        'The Strange Case of Dr. Jekyll and Mr. Hyde'
      )
    })
    test('missing file', async () => {
      await expect(
        parseEpubAtPath(pjoin(__dirname, 'blah.epub'))
      ).rejects.toThrow('Invalid/missing file')
    })
    test('protected file no throw', async () => {
      const epub = await parseEpubAtPath(
        pjoin(__dirname, 'books', 'the-martian.epub')
      )
      expect(epub.hasDRM()).toBeTruthy()
    })
    test('protected file throw', async () => {
      await expect(
        parseEpubAtPath(pjoin(__dirname, 'books', 'the-martian.epub'), {
          throwForDrm: true
        })
      ).rejects.toThrow('DRM')
    })
    test('non-epub file', async () => {
      await expect(
        parseEpubAtPath(pjoin(__dirname, 'some-file.txt'))
      ).rejects.toThrow('non-epub')
    })
  })
})

describe('book-level operations', () => {
  let epub: EPub
  beforeAll(async () => {
    epub = await parseEpubAtPath(jekyllHydePath)
  })

  test('getting chapters', async () => {
    const chapters = await getTextInChapters(epub)
    // chapters.forEach((c, i) => console.log(`${i}: ${c.length}`))
    expect(chapters.length).toEqual(13) // might change if I get better heuristics about which chapters to parse
    expect(chapters[0].length).toBeGreaterThan(100)
  })

  test('counting words', async () => {
    const wordCount = await countWordsInBook(epub)

    // real answer is 25,820
    expect(wordCount).toBeGreaterThan(26000)
    expect(wordCount).toBeLessThan(27000)
  })

  test('counting characters', async () => {
    const characterCount = await countCharactersInBook(epub)

    expect(characterCount).toBeGreaterThan(142400)
    expect(characterCount).toBeLessThan(142500)
  })
})

describe('cli', () => {
  // describe.skip('options', () => {
  //   describe('sturdy mode', () => {
  //     it('should not throw in sturdy mode', () => {
  //       expect(() =>
  //         wordCount.countWords('./asdf', { sturdy: true })
  //       ).not.toThrow()
  //       // make assertion about stdout
  //     })
  //     it('should throw when not sturdy mode', () => {
  //       // this doesn't work, which makes me think the above isn't working either
  //       expect(async () => wordCount.countWords('./asdf')).toThrow()
  //       // make assertion about stdout
  //     })
  //   })
  describe('quiet mode', () => {
    it('should work when quiet', () => {
      // stdout should be empty
    })
    it('should work when not quiet', () => {
      // stdout should have an asterisk and a dnumber
    })
  })

  describe('text mode', () => {
    it('should print the full text', () => {
      // stdout should be long
      // it should also have the same result when piped into `wc` as when run in js
    })
  })

  describe('character mode', () => {
    it('should print the character count', () => {
      // stdout should be long
      // it should also have the same result when piped into `wc` as when run in js
    })
  })
  // })
})
