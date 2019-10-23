#!/usr/bin/env node

import wc = require('./index')
import fs = require('mz/fs')
import path = require('path')

import cli = require('commander')

import updateNotifier = require('update-notifier')
const pkg = require('./package.json')
updateNotifier({ pkg }).notify()

/**
 * Given a path:
 * * if it's a file, count the file
 * * if it's a directory, count each epub file. does not recurse.
 */
async function parsePath(fpath: string, opts: wc.Options) {
  try {
    const stat = await fs.stat(fpath)
    if (stat.isDirectory()) {
      const files = await fs.readdir(fpath)
      const res = await Promise.all(
        files.map(f => {
          const filepath = path.join(fpath, f)
          return parseFile(filepath, opts)
        })
      )
      return res.filter(Boolean)
    } else {
      return parseFile(fpath, opts).then(res => res)
    }
  } catch (e) {
    console.error(`Unable to find anything at path "${fpath}"`)
    return []
  }
}

async function parseFile(filepath: string, opts: wc.Options) {
  let stat = await fs.stat(filepath)
  if (!stat.isDirectory() && filepath.endsWith('epub')) {
    return wc.countWords(filepath, opts)
  } else {
    return 0
  }
}

// MAIN

cli
  .usage('[options] PATH')
  .description('count the words in an epub file')
  .version(require('./package.json').version)
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

if (!cli.args.length) {
  console.error('Must supply a path')
  process.exitCode = 1
} else {
  const fpath = cli.args[0]
  let opts: wc.Options = {
    print: !cli.raw,
    sturdy: !cli.sturdy,
    quiet: !cli.loud,
    chars: cli.chars,
    text: cli.text
  }

  parsePath(fpath, opts)
    .then(res => {
      if (!opts.print) {
        console.log(res)
      }
    })
    .catch(e => {
      console.error(e)
      process.exitCode = 1
    })
}
