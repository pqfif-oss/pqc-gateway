import { log, isIdentical } from './utils.js'

var DEFAULT_CONFIG_PATH = '/etc/fgw'

var resources = null
var resourceMap = {}
var files = {}
var secrets = {}
var updaters = {}

var notifyCreate = () => {}
var notifyDelete = () => {}
var notifyUpdate = () => {}

function init(pathname, onResourceChange) {
  var configFile = pipy.load('/config.json') || pipy.load('/config.yaml')
  var configDir = pipy.list('/config')
  var hasBuiltinConfig = (configDir.length > 0 || Boolean(configFile))

  if (pathname || !hasBuiltinConfig) {
    pathname = os.path.resolve(pathname || DEFAULT_CONFIG_PATH)
    var s = os.stat(pathname)
    if (!s) {
      throw `configuration file or directory does not exist: ${pathname}`
    }
    if (s.isDirectory()) {
      if (pipy.thread.id === 0) {
        pipy.mount('config', pathname)
      }
      configFile = null
    } else if (s.isFile()) {
      configFile = os.read(pathname)
    }
  }

  if (configFile) {
    var config
    try {
      try {
        config = JSON.decode(configFile)
      } catch {
        config = YAML.decode(configFile)
      }
    } catch {
      throw 'cannot parse configuration file as JSON or YAML'
    }

    resources = config.resources
    resources.forEach(r => appendResource(r))
    Object.entries(config.secrets || {}).forEach(([k, v]) => secrets[k] = v)

  } else {
    pipy.list('/config').forEach(
      pathname => {
        var pathname = os.path.join('/config', pathname)
        var data = readFile(pathname)
        if (data && data.kind && data.spec) {
          log?.(`Load resource file: ${pathname}`)
          files[pathname] = data
          appendResource(data)
        }
      }
    )

    function watch() {
      pipy.watch('/config/').then(pathnames => {
        log?.('Resource files changed:', pathnames)
        pathnames.forEach(pathname => {
          changeFile(pathname, readFile(pathname))
        })
        watch()
      })
    }

    if (onResourceChange) {
      notifyCreate = function (resource) { onResourceChange(resource, null) }
      notifyDelete = function (resource) { onResourceChange(null, resource) }
      notifyUpdate = function (resource, old) { onResourceChange(resource, old) }
      watch()
    }
  }

  function readFile(pathname) {
    try {
      if (isJSON(pathname)) {
        return JSON.decode(pipy.load(pathname))
      } else if (isYAML(pathname)) {
        return YAML.decode(pipy.load(pathname))
      } else if (isSecret(pathname)) {
        var name = os.path.basename(pathname)
        secrets[name] = pipy.load(pathname)
      }
    } catch {
      console.error(`Cannot load or parse file: ${pathname}, skpped.`)
    }
  }
}


function changeFile(pathname, data) {
  var old = files[pathname]
  var cur = data
  if (old) removeResource(old)
  if (cur) appendResource(cur)
  var oldKind = old?.kind
  var curKind = cur?.kind
  if (curKind && curKind === oldKind) {
    files[pathname] = cur
    notifyUpdate(cur, old)
  } else if (curKind && oldKind) {
    files[pathname] = cur
    notifyDelete(old)
    notifyCreate(cur)
  } else if (cur) {
    files[pathname] = cur
    notifyCreate(cur)
  } else if (old) {
    delete files[pathname]
    notifyDelete(old)
  }
}

function appendResource(resource) {
  var kind = resource.kind
  if (kind) {
    var map = (resourceMap[kind] ??= { list: [], dict: {} })
    var name = resource.metadata?.name
    if (name) map.dict[name] = resource
    map.list.push(resource)
  }
}

function removeResource(resource) {
  var kind = resource.kind
  if (kind) {
    var map = resourceMap[kind]
    if (map) {
      var i = map.list.indexOf(resource)
      var name = resource.metadata?.name
      if (name) delete map.dict[name]
      if (i >= 0) map.list.splice(i, 1)
    }
  }
}

function isJSON(filename) {
  return filename.endsWith('.json')
}

function isYAML(filename) {
  return filename.endsWith('.yaml') || filename.endsWith('.yml')
}

function isSecret(filename) {
  return filename.endsWith('.crt') || filename.endsWith('.key')
}

function list(kind) {
  var list = resourceMap[kind]?.list
  return list ? [...list] : []
}

function find(kind, name) {
  var dict = resourceMap[kind]?.dict
  return dict?.[name] || null
}

function setUpdater(kind, key, cb) {
  var listMap = (updaters[kind] ??= {})
  listMap[key] = cb ? [cb] : []
}

function addUpdater(kind, key, cb) {
  var listMap = (updaters[kind] ??= {})
  var list = (listMap[key] ??= [])
  if (!list.includes(cb)) list.push(cb)
}

function runUpdaters(kind, key, a, b, c) {
  var listMap = updaters[kind]
  if (listMap) {
    if (key === undefined) {
      delete updaters[kind]
      Object.values(listMap).forEach(
        list => list.forEach(f => f(a, b, c))
      )
      return true
    } else {
      var list = listMap[key]
      if (list) {
        delete listMap[key]
        list.forEach(f => f(a, b, c))
        return true
      }
    }
  }
  return false
}

function initURL({ url, tls }, onResourceChange) {
  var agent = new http.Agent(
    url.host,
    {
      tls: url.protocol === 'https:' ? (tls || {}) : null
    }
  )

  var configVersion = null
  var configFiles = {}

  return init()

  function init() {
    return download().then(obj => {
      if (!obj) {
        console.error('Failed to download configuration')
        return new Timeout(10).wait().then(init)
      }

      configVersion = obj.version
      configFiles = obj.files

      Object.entries(obj.files).forEach(
        ([pathname, file]) => {
          var data = readFile(pathname, file.data)
          if (data && data.kind && data.spec) {
            log?.(`Load resource file: ${pathname}`)
            files[pathname] = data
            appendResource(data)
          }
        }
      )

      console.info('Initial configuration downloaded')

      if (onResourceChange) {
        notifyCreate = function (resource) { onResourceChange(resource, null) }
        notifyDelete = function (resource) { onResourceChange(null, resource) }
        notifyUpdate = function (resource, old) { onResourceChange(resource, old) }
        watch()
      }
    })
  }

  function download() {
    console.info('GET', url.href)
    return agent.request('GET', os.path.join(url.path, '/')).then(
      res => {
        var status = res?.head?.status
        if (status < 200 || status >= 300 || !status) {
          console.error('GET', os.path.join(url.href, '/'), 'response error', status)
          return null
        }

        var version = res.head.headers['etag']
        var files = {}
        var queue = res.body.toString().split('\n').filter(s=>s).map(
          path => {
            var i = path.indexOf('#')
            return i >= 0 ? path.substring(0,i) : path
          }
        )

        function downloadNext() {
          if (queue.length === 0) {
            return { version, files }
          }

          var filePath = queue.shift()
          var httpPath = os.path.join(url.path, filePath)

          console.info('GET', httpPath)

          return agent.request('GET', httpPath).then(
            res => {
              var status = res?.head?.status
              if (status < 200 || status >= 300 || !status) {
                console.error('GET', httpPath, 'response error', status)
                return null
              }
              files[filePath] = {
                etag: res.head.headers['etag'] || '',
                data: res?.body || new Data
              }
              return downloadNext()
            }
          ).catch(() => null)
        }

        return downloadNext()
      }
    ).catch(() => null)
  }

  function watch() {
    new Timeout(5).wait().then(
      () => agent.request('HEAD', os.path.join(url.path, '/')).catch(() => null)
    ).then(
      res => {
        var status = res?.head?.status
        if (status < 200 || status >= 300 || !status) {
          console.error('HEAD', os.path.join(url.href, '/'), 'response error', status)
          return watch()
        }

        var headers = res.head.headers
        if (headers['etag'] === configVersion) return watch()

        console.info('Found configuration version change', configVersion, '=>', headers['etag'])

        return agent.request('GET', os.path.join(url.path, '/')).then(
          res => {
            var status = res?.head?.status
            if (status < 200 || status >= 300 || !status) return watch()

            var newConfigVersion = headers['etag']
            var oldSet = new Set(Object.keys(configFiles))
            var newSet = {}

            res.body.toString().split('\n').forEach(
              line => {
                line = line.trim()
                var i = line.lastIndexOf('#')
                if (i >= 0) {
                  var path = line.substring(0,i)
                  var etag = line.substring(i+1)
                  var old = configFiles[path]
                  if (old?.etag !== etag) {
                    newSet[path] = true
                  }
                  oldSet.delete(path)
                }
              }
            )

            oldSet.forEach(path => { newSet[path] = true })

            return Promise.all(Object.keys(newSet).map(
              path => agent.request('GET', os.path.join(url.path, path)).then(
                res => {
                  var status = res?.head?.status
                  if (200 <= status && status < 300) {
                    var etag = res.head.headers['etag'] || ''
                    var data = res.body || new Data
                    configFiles[path] = { etag, data }
                    console.info('Downloaded file', path)
                    changeFile(path, readFile(path, data))
                  } else if (status === 404) {
                    delete configFiles[path]
                    console.info('Erased 404 file', path)
                    changeFile(path, null)
                  }
                }
              )
            )).then(() => {
              configVersion = newConfigVersion
              watch()
            })
          }
        )
      }
    ).catch(err => {
      console.error(err)
      watch()
    })
  }

  function readFile(pathname, data) {
    try {
      if (isJSON(pathname)) {
        return JSON.decode(data)
      } else if (isYAML(pathname)) {
        return YAML.decode(data)
      } else if (isSecret(pathname)) {
        var name = os.path.basename(pathname)
        secrets[name] = data
      }
    } catch {
      console.error(`Cannot parse file: ${pathname}, skpped.`)
    }
  }
}

function initZTM({ mesh, app }, onResourceChange) {
  allExports.ztm = { mesh, app }
  var resourceDir = `/users/${app.username}/resources/`
  return mesh.list(resourceDir).then(
    list => Promise.all(Object.keys(list).map(
      pathname => readFile(mesh, app, pathname).then(
        data => {
          if (data && data.kind && data.spec) {
            app.log(`Load resource file: ${pathname}`)
            files[pathname] = data
            appendResource(data)
          }
        }
      )
    )).then(() => {
      function watch() {
        mesh.watch(resourceDir).then(pathnames => {
          Promise.all(pathnames.map(
            pathname => readFile(mesh, app, pathname).then(
              data => {
                app.log(`Resource file changed: ${pathname}`)
                changeFile(pathname, data)
              }
            )
          ))
        }).then(() => {
          watch()
        })
      }

      if (onResourceChange) {
        notifyCreate = function (resource) { onResourceChange(resource, null) }
        notifyDelete = function (resource) { onResourceChange(null, resource) }
        notifyUpdate = function (resource, old) { onResourceChange(resource, old) }
        watch()
      }
    })
  )

  function readFile(mesh, app, pathname) {
    return mesh.read(pathname).then(
      data => {
        try {
          if (isJSON(pathname)) {
            return JSON.decode(data)
          } else if (isYAML(pathname)) {
            return YAML.decode(data)
          } else if (isSecret(pathname)) {
            var name = os.path.basename(pathname)
            secrets[name] = data
          }
        } catch {
          app.log(`Cannot load or parse file: ${pathname}, skpped.`)
        }
      }
    )
  }
}

var allExports = {
  init,
  initURL,
  initZTM,
  list,
  find,
  secrets,
  setUpdater,
  addUpdater,
  runUpdaters,
  ztm: null,
}

export default allExports
