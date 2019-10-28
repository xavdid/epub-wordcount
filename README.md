# epub-wordcount

Given an epub file, do our best to count the number of words in it.

## Usage

```javascript
epub = require('epub-wordcount')

epub.countWords('some-book.epub').then(c => {
  console.log(`There are ${c} words`)
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

## Limitations

There's no programmatic representation for the table of contents in epub and it's hard to skip over the reviews, copyright, etc. An effort is made to only parse the actual story text, but there's a margin of error. Probably no more than ~500 words.

Pull requests welcome.

## API

`countWords(path, [options]) => Promise<number>`

### path(`string`)

Path to (what is hopefully) an epub file. Opens it, and returns a promise that resolves to the number of words in the book.

### options

Object of options. It's optional, I don't know your life.

| key    | type    | function                                                 | default |
| ------ | ------- | -------------------------------------------------------- | ------- |
| print  | boolean | print a nice message with data included for each file    | false   |
| sturdy | boolean | bravely ignore errors on missing or malformed epub file  | false   |
| quiet  | boolean | stifle errors in parsing chapters                        | false   |
| chars  | boolean | count characters, including spaces, instead of words.    | false   |
| text   | boolean | output the cleaned text which would be used for counting | false   |

## Test Books

Unit tests are run on the following e-books:

- Stevenson's _THE STRANGE CASE OF DR. JEKYLL AND MR. HYDE_, from the public domain, provided by [Standard Ebooks](https://standardebooks.org/ebooks/robert-louis-stevenson/the-strange-case-of-dr-jekyll-and-mr-hyde)
- A copy of _The Martian_, by Andy Weir. This is my copy, purchased from Apple Books. It's DRM encumbered, so releasing it publicly should not be seen as copyright infringement.
