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
  println('Usage: gw -c <dirname/filename/url> [-w|--watch] [-d|--debug]')
  println('   or: gw -s <dirname[:[ip:]port]>')
  println('   or: gw -v')
  println('   or: gw -h')
  println('')
  println('Options:')
  println('  -c, --config <dirname/filename/url>  Point to the configuration file or directory or URL')
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
  var configSource = opts['--config']
  var watcher = opts['--watch'] ? makeResourceWatcher() : null

  enableLog(opts['--debug'])
  enableDump(opts['--dump'])

  function startGateways() {
    resources.list('Gateway').forEach(gw => {
      if (gw.metadata?.name) {
        startGateway(gw)
      }
    })

    console.info('PGW started')
  }

  if (configSource.startsWith('http://') || configSource.startsWith('https://')) {
    resources.initURL({ url: new URL(configSource) }, watcher).then(() => startGateways())

  } else {
    resources.init(opts['--config'], watcher)
    startGateways()
  }

} else {
  println(`gw: Configuration not specified. Type 'gw -h' for help.`)
}
