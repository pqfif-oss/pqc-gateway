#!/usr/bin/env -S pipy --args

import options from './options.js'
import resources from './resources.js'
import { startGateway, makeResourceWatcher } from './gateway.js'
import { enableLog, enableDump } from './utils.js'

var opts = options(pipy.argv, {
  defaults: {
    '--config': '',
    '--watch': false,
    '--debug': false,
    '--dump': false,
    '--version': false,
    '--help': false,
  },
  shorthands: {
    '-c': '--config',
    '-w': '--watch',
    '-d': '--debug',
    '-v': '--version',
    '-h': '--help',
  },
})

if (opts['--help']) {
  println('')
  println('PQC-enabled Gateway')
  println('')
  println('Usage: gw [-c|--config <filename/dirname>] [-w|--watch] [-d|--debug] [-v|--version] [-h|--help]')
  println('')
  println('Options:')
  println('  -c, --config <filename/dirname>    Point to the configuration file or directory')
  println('  -w, --watch                        Monitor configuration changes and perform live updates')
  println('  -d, --debug                        Print debugging log for each request')
  println('  -v, --version                      Print version information')
  println('  -h, --help                         Print help information')
  println('')

} else if (opts['--version']) {
  try {
    var version = JSON.decode(pipy.load('version.json'))
  } catch {}
  println(`Version:`)
  println(`  Tag    : ${version?.tag}`)
  println(`  Commit : ${version?.commit}`)
  println(`  Date   : ${version?.date}`)
  println(`Pipy Version:`)
  println(`  Tag    : ${pipy.version?.tag}`)
  println(`  Commit : ${pipy.version?.commit}`)
  println(`  Date   : ${pipy.version?.date}`)

} else if (opts['--config']) {
  enableLog(opts['--debug'])
  enableDump(opts['--dump'])

  resources.init(opts['--config'], opts['--watch'] ? makeResourceWatcher() : null)
  resources.list('Gateway').forEach(gw => {
    if (gw.metadata?.name) {
      startGateway(gw)
    }
  })

  console.info('FGW started')

} else {
  println(`gw: Configuration not specified. Type 'gw -h' for help.`)
}
