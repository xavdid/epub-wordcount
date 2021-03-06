#!/usr/bin/env node

import cli = require('commander')
import {
  getEpubPaths,
  getTextFromBook,
  parseEpubAtPath,
  countWordsInBook,
  countCharactersInBook
} from './utils'

import { uniq } from 'lodash'

import debugFunc from 'debug'

const debug = debugFunc('wordcount')

import updateNotifier = require('update-notifier')
const pkg = require('../package.json')
updateNotifier({ pkg }).notify()

// MAIN

cli
  .usage('[options] PATHS...')
  .description('count the words in an epub file')
  .version(pkg.version)
  .option(
    '-r, --raw',
    'print out the numeric count value without the book title. only works on a single file, not a directory'
  )
  .option('-c, --chars', 'print character count instead of word count')
  .option('-t, --text', 'print entire text of the file instead of word count')
  .option(
    '--ignore-drm',
    'try to parse a book even if it looks like it has DRM. Avoids false positives in detection'
  )

  .parse(process.argv)

const main = async () => {
  debug('starting')
  if (cli.rawArgs.length < 3) {
    console.log(cli.help())
    return
  }

  const rawPaths = cli.args
  // recurse and flatten
  const paths = uniq(
    (await Promise.all(rawPaths.map(getEpubPaths))).reduce(
      (res, path) => res.concat(path),
      []
    )
  )

  if (!paths.length) {
    throw new Error('no valid epubs found in input')
  }

  if (paths.length > 1 && cli.raw) {
    throw new Error(
      'unable to parse a directory in raw mode. either pick a single file or remove the "-r" flag'
    )
  }

  if (cli.chars && cli.text) {
    throw new Error(
      'only specify one of row and text, since only one can be printed'
    )
  }

  return Promise.all(
    paths.map(async path => {
      let book
      try {
        book = await parseEpubAtPath(path)
      } catch (e) {
        if (paths.length > 1) {
          debug(e.message)
          console.error(
            `skipping "${path}" because there was an error while parsing. Re-run command with "DEBUG=wordcount" to see more info, or parse the file by itself`
          )
          return
        }
        throw e
      }
      if (cli.text) {
        console.log((await getTextFromBook(book, cli.ignoreDrm)).join(''))
      } else {
        let message
        let result
        if (book.hasDRM() && !cli.ignoreDrm) {
          message = `DRM detected`
        } else if (cli.chars) {
          result = await countCharactersInBook(book, cli.ignoreDrm)
          message = `${result.toLocaleString()} characters`
        } else {
          result = await countWordsInBook(book, cli.ignoreDrm)
          message = `${result.toLocaleString()} words`
        }

        if (cli.raw) {
          if (result) {
            console.log(result)
          } else {
            debug('drm found, not printing')
          }
        } else {
          // these have to go together or they print wrong
          console.log()
          console.log(book.metadata.title)
          console.log('-'.repeat(book.metadata.title.length))
          console.log(`  * ${message}\n`)
        }
      }
    })
  )
}

main().catch(e => {
  debug(e)
  console.error(
    `ERR: ${e.message}.${
      (process.env.DEBUG || '').includes('wordcount') ||
      process.env.DEBUG === '*'
        ? ''
        : ' Consider re-running command with "DEBUG=wordcount" to see more info'
    }`
  )
  process.exitCode = 1
})
