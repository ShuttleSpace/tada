const { Worker, isMainThread, workerData, parentPort, MessageChannel } = require('worker_threads')
const Os = require('os')
const Fs = require('fs')
const Path = require('path')
const { ipcMain, app } = require('electron')
const Chok = require('chokidar')
const { now, timeTrace } = require('../util')

const requestMonitorFileQueue = []
let mainWindow

const ipcChannel = {
  add: 'drop_monitor:add',
  quit: 'drop_monitor:quit',
  checked: 'drop_monitor:checked',
  checked_cache: 'drop_monitor:checked_cache'
}
const resumeEmit = (worker) => worker && worker.postMessage({ resume: true })
const pauseEmit = (worker) => worker && !requestMonitorFileQueue.length && worker.postMessage({ pause: true })

if (isMainThread) {
  console.log('[dropMonitorMain] in main thread')
  const worker = new Worker(__filename)
  ipcMain.handle(ipcChannel.add, (_, filename) => {
    console.log(`[dropMonitorMain]${now()} receivedAdd:`, filename)
    if (!mainWindow || mainWindow.isDestroyed()) {
      console.warn('[dropMonitorMain] mainWindow has destroyed')
      return
    }
    if (requestMonitorFileQueue.findIndex((item) => item === filename) === -1) {
      resumeEmit(worker)
      requestMonitorFileQueue.push(filename)
    }
    console.log(`[dropMonitorMain]${now()} receivedAdd-queue:`, requestMonitorFileQueue)
  })
  ipcMain.handle(ipcChannel.quit, async () => {
    if (worker) {
      const exitCode = worker.terminate()
      console.log('[dropMonitorMain] quit:', exitCode)
    }
  })
  app.on('exit', () => {
    if (worker) {
      worker.terminate()
    }
  })
  worker.on('message', (msg) => {
    // console.log(`[dropMonitorMain] onmessage:`, msg)
    if (!mainWindow || mainWindow.isDestroyed()) {
      console.warn('[dropMonitorMain] mainWindow has destroyed')
      return
    }
    if (!msg) {
      console.warn('[dropMonitorMain] msg is undefined')
      return
    }
    if (msg.ready) {
      console.log('[dropMonitorMain] ready:', msg.ready.timeCost, msg.ready.watchedDirs)
    } else if (msg.added) {
      pauseEmit(worker)
      const createdDir = msg.added
      console.log(`[dropMonitorMain]${now()} added(before):`, createdDir, requestMonitorFileQueue)
      const idx = requestMonitorFileQueue.findIndex((item) => createdDir.indexOf(item) > -1)
      if (idx === -1) return
      console.log(`[dropMonitorMain]${now()} added(after):`, createdDir, requestMonitorFileQueue)
      mainWindow.webContents.send(ipcChannel.checked, createdDir)
      requestMonitorFileQueue.splice(idx, 1)
    } else if (msg.chromeDragCacheDir) {
      console.log(`[fsMinotorMain]${now()} addDir:`, msg.chromeDragCacheDir)
      mainWindow.webContents.send(ipcChannel.checked_cache, msg.chromeDragCacheDir)
    }
  })
  worker.on('error', (err) => {
    console.log(`[dropMonitorMain] error: ${err ? err.message : ''}`)
  })
  worker.on('exit', (exitCode) => {
    console.log(`[dropMonitorMain] worker exited: ${exitCode}`)
  })
  module.exports = (mainWin) => {
    console.log('[dropMonitorMain] mainWin.id=', mainWin.id)
    mainWindow = mainWin
  }
} else {
  console.log('[dropMonitorWorker] in worker thread')
  chokWatch()
}

let isStopPostMessage = false

function chokWatch() {
  const ignoreDirs = ['wwSharedLoading', '.Trash', 'Application Support', 'Saved Application State']
  const start = Date.now()
  parentPort.on('message', (msg) => {
    console.log('[dropMonitorWorker] emit control message:', msg)
    if (msg.pause) {
      isStopPostMessage = true
    } else if (msg.resume) {
      isStopPostMessage = false
    } else {
      console.error('[dropMonitorWorker] wrong message type', msg)
    }
  })
  const watchOptions = {
    ignoreInitial: true,
    ignorePermissionErrors: true,
    ignored: /(^|[\/\\])\../
  }
  // if (process.platform === 'win32') {
  //   watchOptions.ignored = (path, stats) => {
  //     return !path || Path.basename(path).indexOf('.') === 0 || (stats && !stats.isDirectory())
  //   }
  // }
  const watcher = Chok.watch(Os.homedir(), watchOptions)
  // native event
  // watcher.on('raw', (eventName, path, details) => {
  //   if (!path) return
  //   if (ignoreDirs.find((dir) => path.indexOf(dir) > -1)) return
  //   let targetEvent = 'changed'
  //   if (process.platform === 'darwin') {
  //     targetEvent = 'created'
  //   } else if (process.platform === 'win32') {
  //     targetEvent = 'changed'
  //   }
  //   eventName == targetEvent && !isStopPostMessage && parentPort.postMessage({ added: path })
  // })
  watcher.on('add', (path, stats) => {
    if (!path) return
    if (ignoreDirs.find((dir) => path.indexOf(dir) > -1)) return
    !isStopPostMessage && parentPort.postMessage({ added: path })
  })
  if (process.platform === 'win32') {
    const chromeDragCacheDirSegment = `\AppData\Local\Temp\chrome_drag`
    watcher.on('addDir', (path, stats) => {
      if (path && path.indexOf(chromeDragCacheDirSegment) > -1 && !isStopPostMessage) {
        parentPort.postMessage({ chromeDragCacheDir: path })
      }
    })
  }
  watcher
    .on('ready', () => {
      const cost = timeTrace(start)
      parentPort.postMessage({ ready: { timeCost: cost, watchedDirs: Object.keys(watcher.getWatched()).length } })
    })
    .on('error', (error) => console.error(error))
  return watcher
}