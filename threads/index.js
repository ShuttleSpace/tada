const { ipcMain, app } = require('electron')
const Path = require('path')
const { Thread, Worker, spawn } = require('threads')
const { now } = require('../util')

const requestMonitorFileQueue = []
const ipcDropChannel = {
  add: 'drop_monitor:add',
  quit: 'drop_monitor:quit',
  checked: 'drop_monitor:checked',
  checked_cache: 'drop_monitor:checked_cache'
}

/// ---- drop monitor
async function initDropMonitor(mainWindow) {
  console.log('[dropMonitorMain-Threads] in main thread')
  // console.log('[DropMonitorJsPath]', DropMonitorJsPath)
  const DropMonitorJsPath =
    process.env.NODE_ENV == 'development'
      ? Path.join(process.cwd(), 'threads/worker.js')
      : Path.join(process.resourcesPath, 'app.asar.unpacked/threads/worker.js')
  console.log('[DropMonitorJsPath]' + DropMonitorJsPath)
  const worker = await spawn(new Worker(DropMonitorJsPath))
  ipcMain.handle(ipcDropChannel.add, (_, filename) => {
    console.log(`[dropMonitorMain]${now()} receivedAdd: ${filename}`)
    if (!mainWindow || mainWindow.isDestroyed()) {
      console.warn('[dropMonitorMain] mainWindow has destroyed')
      return
    }
    if (requestMonitorFileQueue.findIndex((item) => item === filename) === -1) {
      console.log(`[dropMonitorMain]resumed`)
      worker.resume()
      requestMonitorFileQueue.push(filename)
    }
    console.log(`[dropMonitorMain]${now()} receivedAdd-queue: ${JSON.stringify(requestMonitorFileQueue)}`)
  })
  ipcMain.handle(ipcDropChannel.quit, async () => worker && Thread.terminate(worker))
  app.on('will-quit', async () => worker && Thread.terminate(worker))
  worker.start().subscribe((msg) => {
    // console.log(`[dropMonitorMain] onmessage:`, msg)
    if (!mainWindow || mainWindow.isDestroyed()) {
      console.log('[dropMonitorMain] mainWindow has destroyed')
      return
    }
    if (!msg) {
      console.log('[dropMonitorMain] msg is undefined')
      return
    }
    if (msg.ready) {
      console.log(`[dropMonitorMain] ready:${msg.ready.timeCost}ms, watched:${msg.ready.watchedDirs} items.`)
    } else if (msg.added || msg.changed) {
      if (!requestMonitorFileQueue.length) {
        worker.pause()
        console.log(`[dropMonitorMain]paused`)
      }
      const createdDir = msg.added || msg.changed
      console.log(`[dropMonitorMain]${now()} added(before): ${createdDir}, ${JSON.stringify(requestMonitorFileQueue)}`)
      const idx = requestMonitorFileQueue.findIndex((item) => createdDir.indexOf(item) > -1)
      if (idx === -1) return
      console.log(`[dropMonitorMain]${now()} added(after): ${createdDir}, ${requestMonitorFileQueue}`)
      mainWindow.webContents.send(ipcDropChannel.checked, createdDir)
      requestMonitorFileQueue.splice(idx, 1)
    } else if (msg.chromeDragCacheDir) {
      console.log(`[fsMinotorMain]${now()} chromeDragCacheDir: ${msg.chromeDragCacheDir}`)
      mainWindow.webContents.send(ipcDropChannel.checked_cache, msg.chromeDragCacheDir)
    }
  })
}

module.exports = {
  initDropMonitor
}
