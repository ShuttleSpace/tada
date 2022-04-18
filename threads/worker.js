const Os = require('os')
const { expose } = require('threads')
const { Observable } = require('threads/observable')
const Chok = require('chokidar')
const { timeTrace } = require('../util')

let isStopPostMessage = false

expose({
  start() {
    console.log('[dropMonitorWorker] in worker thread')
    return new Observable((observer) => {
      chokWatch(observer)
    })
  },
  stop() {
    console.log('[dropMonitorWork] stop')
  },
  pause() {
    console.log('[dropMonitor-worker] paused')
    isStopPostMessage = true
  },
  resume() {
    console.log('[dropMonitor-worker] resumed')
    isStopPostMessage = false
  }
})


function chokWatch(observer) {
  const ignoreDirs = ['.Trash', 'Application Support', 'Saved Application State']
  const start = Date.now()
  const watchOptions = {
    ignoreInitial: true,
    ignorePermissionErrors: true,
    ignored: /((^|[\/\\])\..)+|(\.exe)+/
  }
  const watcher = Chok.watch(Os.homedir(), watchOptions)
  watcher.on('add', (path, stats) => {
    if (!path) return
    if (ignoreDirs.find((dir) => path.indexOf(dir) > -1)) return
    !isStopPostMessage && observer.next({ added: path })
  })
  watcher.on('change', (path, stats) => {
    if (!path) return
    if (ignoreDirs.find((dir) => path.indexOf(dir) > -1)) return
    !isStopPostMessage && observer.next({ changed: path })
  })
  if (process.platform === 'win32') {
    const chromeDragCacheDirSegment = `\AppData\Local\Temp\chrome_drag`
    watcher.on('addDir', (path, stats) => {
      if (path && path.indexOf(chromeDragCacheDirSegment) > -1 && !isStopPostMessage) {
        observer.next({ chromeDragCacheDir: path })
      }
    })
  }
  watcher
    .on('ready', () => {
      const cost = timeTrace(start)
      observer.next({ ready: { timeCost: cost, watchedDirs: Object.keys(watcher.getWatched()).length } })
    })
    .on('error', (error) => console.error(error))
  return watcher
}
