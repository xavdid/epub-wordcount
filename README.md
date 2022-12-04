# epub-wordcount

Given an epub file, do our best to count the number of words in it.

## Installation

This package is available on [npm](https://www.npmjs.com/package/epub-wordcount) as `epub-wordcount`. It can be installed using common JS tools:

```sh
npm i -g epub-wordcount
```

## Basic Usage

On the CLI:

```
% word-count path/to/book.epub

The Strange Case of Dr. Jekyll and Mr. Hyde
-------------------------------------------
  * 26,341 words
```

In code:

```ts
// TS:
import { countWords } from 'epub-wordcount'

// JS:
// const { countWords } = require('epub-wordcount')

countWords('./books/some-book.epub').then((numWords) => {
  console.log(`There are ${numWords} words`)
})
// There are 106190 words
```

## CLI

There's also a cli tool to quickly get the count of any epub file! Invoke it via:

```bash
word-count path/to/file.epub
```

or

```bash
word-count directory/of/books
```

See `word-count -h` for more info

### Options

- `-c, --chars` - Print the character count instead of the world count
- `-r, --raw` - Instead of printing the nice title, just print out a numeral
- `-t, --text` - Print out the whole text of the book. Great for passing into other unix functions, like `wc`.
- `--ignore-drm` - If the function is saying your file has DRM when you know it doesn't, you can pass this flag to force the CLI to ignore the DRM warning. Might cause weird results if the actually _does_ have DRM.

## Code API

There are a number of functions exported from this package. Each one takes either a path to a file or an already-parsed file. Mostly you'll use the path, but if the epub you're parsing is in a non-standard format, then you might use that function to ensure the file parses correctly. See [here](https://github.com/julien-c/epub#usage) for the options available.

- `countWords(pathOrEpub, ignoreDrm?) => Promise<number>`
- `countCharacters(pathOrEpub, ignoreDrm?) => Promise<number>`
- `getText(pathOrEpub, ignoreDrm?) => Promise<string[]>`

Each of the above can be passed the result of the following:

- `parseEpubAtPath(path, ignoreDrm?) => Promise<EPub>`

## Limitations

There's no programmatic representation for the table of contents in epub and it's hard to skip over the reviews, copyright, etc. An effort is made to only parse the actual story text, but there's a margin of error. Probably no more than ~500 words.

Pull requests welcome.

## Test Books

Unit tests are run on the following e-books:

- Stevenson's _THE STRANGE CASE OF DR. JEKYLL AND MR. HYDE_, from the public domain, provided by [Standard Ebooks](https://standardebooks.org/ebooks/robert-louis-stevenson/the-strange-case-of-dr-jekyll-and-mr-hyde)
- A copy of _The Martian_, by Andy Weir. This is my copy, purchased from Apple Books. It's DRM encumbered, so releasing it publicly should not be seen as copyright infringement.

## Fake ePubs

In modern versions of macOS, dragging a book out of the `Books` app won't give you an actual epub- it'll give you a folder with the `.epub` extension. Unsurprisingly, this doesn't play well with ePub tooling.

To fix, run the following command (pulled [from here](https://apple.stackexchange.com/questions/239050/how-to-convert-an-epub-package-to-regular-epub/429474)) fixes them for me:

```sh
# from inside the rogue directory
zip -X -r ../fixed.epub mimetype *
```
