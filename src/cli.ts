#!/usr/bin/env node

import cli = require('commander')
import {
  getEpubPaths,
  getBookDetails,
  parseEpubAtPath,
  countWordsInBook
} from '.'

import debugFunc from 'debug'

const debug = debugFunc('wordcount')

import updateNotifier = require('update-notifier')
const pkg = require('../package.json')
updateNotifier({ pkg }).notify()

// MAIN

cli
  .usage('[options] PATH')
  .description('count the words in an epub file')
  .version(pkg.version)
  .option('-r, --raw', 'print out an array of word counts without the frivolty')
  .option(
    '-f, --fragile',
    'fail on malformed epub files; default: print but skip'
  )
  .option('-c, --chars', 'count characters instead of words')
  .option('-t, --text', 'output the text content instead of a number')
  // .option('-r, --recurse', 'if PATH is a directory, also act on subdirectories')
  .parse(process.argv)

const main = async () => {
  if (!cli.args.length) {
    throw new Error('Must supply a path')
  }

  const input = cli.args[0]
  const paths = await getEpubPaths(input)

  await Promise.all(
    paths.map(async path => {
      const book = await parseEpubAtPath(path, {
        throwForMalformed: cli.fragile
      })
      const numWords = await countWordsInBook(book)
      console.log(book.metadata.title)
      console.log('-'.repeat(book.metadata.title.length))
      console.log(
        ` * ${book.hasDRM() ? 'DRM detected' : numWords.toLocaleString()}\n`
      )
    })
  )
}

main().catch(e => {
  debug(e)
  console.error(
    `ERR: ${e.message}. Re-run command with "DEBUG=wordcount" to see more info`
  )
  process.exitCode = 1
})

// if (!cli.args.length) {
//   console.error('Must supply a path')
//   process.exitCode = 1
// } else {
//   const fpath = cli.args[0]
//   const opts: wc.Options = {
//     print: !cli.raw,
//     sturdy: !cli.sturdy,
//     quiet: !cli.loud,
//     chars: cli.chars,
//     text: cli.text
//   }

//   parsePath(fpath, opts)
//     .then(res => {
//       if (!opts.print) {
//         console.log(res)
//       }
//     })
//     .catch(e => {
//       console.error(e)
//       process.exitCode = 1
//     })
// }
