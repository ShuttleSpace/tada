const buildConfigure = require('./build')
const { Arch, build, Platform } = require('electron-builder')

const appImageTarget = Platform.LINUX.createTarget("appimage")

const packConfigure = {
    appId: "io.moonaka.gate",
    productName: "秦时明月",
    
    targets: appImageTarget,
    config: {
        linux: {

        }
    }
}