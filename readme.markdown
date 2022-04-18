1、worker_threads 和 electron 版本问题
  1) electronV8.5.5 + electron-builderV21.2.0 不支持 require('./node_worker.js') 方式
    Electron v8.5.5Chromium v80.0.3987.163Node v12.13.0v8 v8.0.426.30-electron.0
  2) electronV18.0.3 + electron-builderV23.0.3 可以
    Electron v18.0.3Chromium v100.0.4896.75Node v16.13.2v8 v10.0.139.9-electron.0