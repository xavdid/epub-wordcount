# epub-wordcount

Given an epub file, do our best to count the number of words in it.

## Limitations

There's no programmatic representation for the table of contents in epub and it's hard to skip over the reviews, copyright, etc. We do our best to guess what's actually story text, but there's a marign of error. Probably no more than ~500 words.

Pull requests welcome.

## API

**countWords(path, [options])** => Promise<number>

### path(`string`)

Path to (what is hopefully) an epub file. Opens it, and returns a promise that resolves to the number of words in the book.

### options

Object of options. It itself is optional.

| key | type | function | default |
| --- | --- | --- | --- |
print | boolean | print a nice message with data included for each file | false


