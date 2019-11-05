## 2.0.2

* Move `epub` dependency to published version instead of GitHub fork

## 2.0.1

* Fix broken import in `2.0.0`

## 2.0.0

Basically the entire exposed API was changed with this release. All of the same functionality is still available, but a lot of unnecessary options have been removed. There's a migration guide below.

- :exclamation: Export structure has changed. Instead of exporting a function, the package exports an object with a few functions
- :exclamation: The options object has been dropped from the `countWords` js function. All it does count words now, so there's no need to pass configuration
- :exclamation: the `--quiet` CLI flag only works for single files, not directories
- :exclamation: the `--sturdy` CLI flag has been removed. Errors are caught by default and debug info is printing by default. Run with `DEBUG=*` to see that output
- :tada: CLI works for multiple files and directories: `word-count book.epub other-book.epub folder-of-books`
- :tada: CLI added the `--text` and `--chars` flags for printing the full text of the book and the character count, respectively. Thanks X for the PR!
- Better error handling using `debug`. Run the CLI with `DEBUG=*` to see debugging output
- Use the `parseEpubAtPath` function parse non-standard epubs. You can pass the result to any of the counting functions
- Updated the `epub` fork, which should fix some bugs.
- Reorganized code and added a lot of tests

### Migrating from v1.x.x

#### Code

This:

```js
// v1.x.x
const wordCount = require('epub-wordcount') // <-- notable change
wordCount('path/to/file', { sturdy: true, print: false }).then(count =>
  console.log('count is', count)
)
```

becomes:

```js
// v2.x.x
const { countWords } = require('epub-wordcount') // <-- notable change
countWords('path/to/file').then(count => console.log('count is', count))
```
