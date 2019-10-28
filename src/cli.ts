#!/usr/bin/env node

import cli = require('commander')
import { getEpubPaths, getBookDetails, parseEpubAtPath } from '.'

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
  .option(
    '-l, --loud',
    'print warnings about inidividual chapters being weird; helpful for narrowing down parsing errors'
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

  for (const path of paths) {
    const book = await parseEpubAtPath(path)
    const details = await getBookDetails(book)
    console.log(details.title)
    console.log('-'.repeat(details.title.length))
    console.log(` * ${details.wordCount.toLocaleString()}`)
  }
}

main().catch(e => {
  console.error(`ERR: ${e.message}`)
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
