const Path = require('path')
const { ipcMain, app } = require('electron')
const { Worker } = require('worker_threads')
const { now } = require('../util')

const requestMonitorFileQueue = []
let mainWindow
const ipcChannel = {
  add: 'drop_monitor:add',
  quit: 'drop_monitor:quit',
  checked: 'drop_monitor:checked',
  checked_cache: 'drop_monitor:checked_cache'
}

/**
 * 绑定主窗口
 * @param {*} mainWin
 */
module.exports = (mainWin) => {
  console.log('[dropMonitorMain-nativeThreads] mainWin.id=', mainWin.id)
  mainWindow = mainWin
}


const workerJs = process.env.NODE_ENV == 'development' ? Path.join(process.cwd(), __filename) : Path.join(__dirname, 'worker.js')
console.log('[dropMonitorMain] in main thread:', workerJs, ',__dirname:', __dirname, ',__filename:', __filename)
const worker = new Worker(workerJs)
// 添加新的拖拽文件监听
ipcMain.handle(ipcChannel.add, (_, filename) => {
  console.log(`[dropMonitorMain]${now()} receivedAdd:`, filename)
  if (!mainWindow || mainWindow.isDestroyed()) {
    console.warn('[dropMonitorMain] mainWindow has destroyed')
    return
  }
  // TODO： 需要处理同一个（大）文件连续的被拖动到不同目录下
  if (requestMonitorFileQueue.findIndex((item) => item === filename) === -1) {
    resumeEmit(worker)
    requestMonitorFileQueue.push(filename)
  }
  console.log(`[dropMonitorMain]${now()} receivedAdd-queue:`, requestMonitorFileQueue)
})
// 监听关闭 worker 线程
ipcMain.handle(ipcChannel.quit, async () => {
  if (worker) {
    // 返回 exitCode
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
    // ready 事件
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


const resumeEmit = (worker) => worker && worker.postMessage({ resume: true })
const pauseEmit = (worker) => worker && !requestMonitorFileQueue.length && worker.postMessage({ pause: true })
