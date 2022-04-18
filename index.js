const Os = require('os')
const Fs = require('fs')
const Path = require('path')
const {
  BrowserWindow,
  BrowserView,
  app,
  ipcMain,
  webContents,
  Notification
} = require('electron')
const shelljs = require('shelljs')
const start = Date.now()
let mainWin
let canQuitNow = false


function createMainWin() {
  mainWin = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webviewTag: true,
      nativeWindowOpen: false,
      nodeIntegrationInWorker: true
    },
    icon: Path.join(__dirname, 'icon_32x32@2x.png'),
    title: 'Elelife',
    show: true
  })
  mainWin.loadFile('dist/index.html').then(() => console.log('[MainWindow] load OK!'))
    .catch((e) => console.log('[MainWindow] load error: ', e))
  console.log('icon', Path.join(__dirname, 'icon_32x32@2x.png'))

  /* IFTRUE_useNativeThreads */
  console.log('[useNativeThreads]')
  require('./worker_threads')(mainWin)
  /* FITRUE_useNativeThreads */
  /* IFTRUE_useThreads */
  console.log('[useThreads]')
  require('./threads').initDropMonitor(mainWin)
  /* FITRUE_useThreads */

}

app.whenReady().then(() => {
  createMainWin()


  console.log('[app-ready] time:', Date.now() - start, 'ms')

  console.log('[env] __dirname:', __dirname, ',__filename:', __filename, '\n')
  console.log(shelljs.ls(__dirname).toString())

  app.on('activate', () => {
    if (!mainWin || !BrowserWindow.getAllWindows().length) createMainWin()
  })

  mainWin.on('close', (e) => {
    console.log('[main] close')
    // e.preventDefault()
  })

  mainWin.on('closed', (e) => {
    console.log('[main] closed ❌')
    // e.preventDefault()
  })

  mainWin.webContents.on('did-create-window', (childWin) => {
    childWin.webContents.on('will-navigate', (e) => {
      e.preventDefault()
    })
  })
})

app.on('window-all-closed', (e) => {
  console.log('[app] window-all-closed')
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', (e) => {
  console.log('[app] before-quit')
  // e.preventDefault()
})
app.on('will-quit', async (e) => {
  console.log('[app] will-quit')
  if (!canQuitNow) {
    e.preventDefault()
    await doSomeHeavy()
    canQuitNow = true
    app.quit()
  }
})
app.on('quit', (e, exitCode) => {
  console.log('[app] quit❌', exitCode)
  e.preventDefault()
})

async function doSomeHeavy() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve()
    }, 1000)
  })
}
// ---- HANDLE ---- 
ipcMain.handle('gpuInfo', () => {
  return app.getGPUFeatureStatus()
})