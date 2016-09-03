# epub-wordcount

Given an epub file, do our best to count the number of words in it.

## Limitations

There's no programmatic representation for the table of contents in epub and it's hard to skip over the reviews, copyright, etc. We do our best to guess what's actually story text, but there's a marign of error. Probably no more than ~500 words.

Pull requests welcome.

## API

**countWords(path, [options])**

### path(`String|String[]`)

If `path` is a directory, run for each file in the directory. Optionally, recurse through them (see below). If it's an array, repeat for each.

### options

Object of options. It itself is optional.

| key | type | function | default |
| --- | --- | --- | --- |
print | boolean | print a nice message with data included for each file | false
recursive | boolean | recurse into subdirectories if `path` is a directory | false

