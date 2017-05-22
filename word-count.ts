#!/usr/bin/env node

import wc = require('./index')
import fs = require('mz/fs')
import path = require('path')

import cli = require('commander')

async function parsePath(fpath: string, opts: wc.Options) {
  try {
    const stat = await fs.stat(fpath)
    if (stat.isDirectory()) {
      const files = await fs.readdir(fpath)
      return Promise
        .all(files.map(async (f) => {
          const filepath = path.join(fpath, f)
          return parseFile(filepath, opts)
        }))
        .then(res => {
          return res.filter(c => c)
        })
    } else {
      return parseFile(fpath, opts).then(res => [res])
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
  } else { return 0 }
}

// MAIN

cli
  .usage('[options] PATH')
  .description('count the words in an epub file')
  .version(require('./package.json').version)
  .option(
    '-p, --print',
    'print out a nicely formatted message, especially helpful for directories'
  )
  .option(
    '-s, --sturdy',
    'skip malformed epub files; default, error'
  )
  .option(
    '-q, --quiet',
    'suppress warnings about inidividual chapters being weird'
  )
  // .option('-r, --recurse', 'if PATH is a directory, also act on subdirectories')
  .parse(process.argv)

if (!cli.args.length) {
  console.error('Must supply a path')
  process.exit(1)
}

const fpath = cli.args[0]
let opts: wc.Options = {
  print: cli.print,
  sturdy: cli.sturdy,
  quiet: cli.quiet
}

parsePath(fpath, opts)
  .then(res => {
    if (!opts.print) {
      console.log(res)
    }
  })
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
