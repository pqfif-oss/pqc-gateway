#!/usr/bin/env -S pipy --args

import options from './options.js'
import resources from './resources.js'
import startResourceService from './resource-service.js'

import { startGateway, makeResourceWatcher } from './gateway.js'
import { enableLog, enableDump } from './utils.js'

var opts = options(pipy.argv, {
  defaults: {
    '--config': '',
    '--serve': '',
    '--watch': false,
    '--debug': false,
    '--dump': false,
    '--version': false,
    '--help': false,
  },
  shorthands: {
    '-c': '--config',
    '-s': '--serve',
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
  println('Usage: gw -c <dirname/filename> [-w|--watch] [-d|--debug]')
  println('   or: gw -s <dirname[:[ip:]port]>')
  println('   or: gw -v')
  println('   or: gw -h')
  println('')
  println('Options:')
  println('  -c, --config <dirname/filename>      Point to the configuration file or directory')
  println('  -s, --serve  <dirname[:[ip:]port]>   Start configuration server with specified directory')
  println('  -w, --watch                          Monitor configuration changes and perform live updates')
  println('  -d, --debug                          Print debugging log for each request')
  println('  -v, --version                        Print version information')
  println('  -h, --help                           Print help information')
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

} else if (opts['--serve']) {
  var DEFAULT_PORT = '0.0.0.0:6060'
  var path = opts['--serve']
  var port = DEFAULT_PORT
  var i = path.indexOf(':')
  if (i >= 0) {
    port = path.substring(i+1) || DEFAULT_PORT
    path = path.substring(0,i) || '.'
  }

  try {
    startResourceService(port, path)
  } catch (err) {
    println('gw:', err.toString())
  }

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
