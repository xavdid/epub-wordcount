# epub-wordcount

Given an epub file, do our best to count the number of words in it.

## Usage

```javascript
epub = require('epub-wordcount')

epub.countWords('enders-game.epub').then((c) => {
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
word-count path/to/books
```

See `word-count -h` for more info

## Limitations

There's no programmatic representation for the table of contents in epub and it's hard to skip over the reviews, copyright, etc. We do our best to guess what's actually story text, but there's a margin of error. Probably no more than ~500 words.

Pull requests welcome.

## API


`countWords(path, [options]) => Promise<number>`

### path(`string`)

Path to (what is hopefully) an epub file. Opens it, and returns a promise that resolves to the number of words in the book.

### options

Object of options. It's optional, I don't know your life.

| key | type | function | default |
| --- | --- | --- | --- |
print | boolean | print a nice message with data included for each file | false
sturdy | boolean | bravely ignore errors on missing or malformed epub file | false
quiet | boolean | stifle errors in parsing chapters | false

## Tests

... are for code that doesn't work on the first try (which this undoubtedly doesn't) so please let me know if you see something wrong.
