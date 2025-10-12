export default function (port, path) {
  var rootPath = os.path.resolve(path)
  var fileCache = {}
  var directoryCache = {}
  var response404 = new Message({ status: 404 })

  if (!os.stat(rootPath)?.isDirectory?.()) {
    throw `Directory ${path} not found`
  }

  scanAllFiles(true)

  pipy.listen(port, $=>$
    .demuxHTTP().to($=>$
      .replaceData()
      .replaceMessage(
        req => {
          var path = req.head.path
          if (path.endsWith('/')) {
            var info = getDirectory(path)
          } else {
            var info = getFile(path)
          }
          if (info) {
            return new Message({
                status: 200,
                headers: {
                'etag': info.time,
                'content-type': 'text/plain',
                }
            }, info.data)
          } else {
            return response404
          }
        }
      )
    )
  )

  console.log('Resource service started on', port, 'for directory', rootPath)

  watchAllFiles()

  function makeFile(time, data) {
    return { time, data }
  }

  function getFile(path) {
    path = os.path.normalize(path)

    var info = fileCache[path]
    if (info?.data) return info

    var filename = os.path.join(rootPath, path)
    var st = os.stat(filename)
    if (st && st.isFile()) {
      return (
        fileCache[path] = makeFile(st.mtime, os.read(filename))
      )
    }

    return null
  }

  function getDirectory(path) {
    path = os.path.normalize(path)

    var info = directoryCache[path]
    if (info) return info

    var dirname = os.path.join(rootPath, path)
    var st = os.stat(dirname)
    if (st && st.isDirectory()) {
      return (
        directoryCache[path] = listDirectory(dirname)
      )
    }

    return null
  }

  function listDirectory(root) {
    var time = 0
    var data = new Data

    function list(path) {
      var dirname = os.path.join(root, path)
      var st = os.stat(dirname)
      if (st?.isDirectory?.()) {
        if (st.mtime > time) time = st.mtime
        os.readDir(dirname).forEach(
          name => {
            if (name.endsWith('/')) {
              list(os.path.join(path, name))
            } else {
              var st = os.stat(os.path.join(dirname, name))
              if (st && st.isFile()) {
                if (st.mtime > time) time = st.mtime
                data.push(os.path.join(path, name))
                data.push('#')
                data.push(st.mtime.toString())
                data.push('\n')
              }
            }
          }
        )
      }
    }

    list('/')
    return makeFile(time, data)
  }

  function scanAllFiles(initial) {
    var oldFilenames = new Set(Object.keys(fileCache))

    function list(path) {
      var dirname = os.path.join(rootPath, path)
      os.readDir(dirname).forEach(
        name => {
          var pathname = os.path.join(path, name)
          if (name.endsWith('/')) {
            list(pathname)
          } else {
            var st = os.stat(os.path.join(dirname, name))
            if (st && st.isFile()) {
              if (initial || !(pathname in fileCache)) {
                fileCache[pathname] = makeFile(st.mtime, null)
                if (!initial) {
                  invalidateDirectories(pathname)
                  console.log('[create]', pathname)
                }
              } else {
                var old = fileCache[pathname]
                if (old.time !== st.mtime) {
                  old.time = st.mtime
                  old.data = null
                  invalidateDirectories(pathname)
                  console.log('[update]', pathname)
                }
                oldFilenames.delete(pathname)
              }
            }
          }
        }
      )
    }

    list('/')

    oldFilenames.forEach(
      pathname => {
        delete fileCache[pathname]
        invalidateDirectories(pathname)
        console.log('[delete]', pathname)
      }
    )
  }

  function watchAllFiles() {
    new Timeout(5).wait().then(() => {
      scanAllFiles(false)
      watchAllFiles()
    })
  }

  function invalidateDirectories(filename) {
    for (var path = filename; path; path = os.path.dirname(path)) {
      delete directoryCache[path]
    }
  }
}
