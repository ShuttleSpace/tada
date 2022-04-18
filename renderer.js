console.log('[renderer] i am in renderer processs.!!!')
const { ipcRenderer } = require('electron')
const path = require('path')

// 仅html渲染完成
document.addEventListener("DOMContentLoaded", () => {
    console.log('DOMContentLoaded')
})
// 包含css 等资源加载完成
window.onload = () => {
    console.log('[dom] loaded')
    ipcRenderer.invoke('gpuInfo').then((info) => {
        document.getElementById('gpuInfo').innerHTML = `
        <h3>Graphic Feature Status</h3>
        <table>
            <tr>2d_canvas: <span class="${info['2d_canvas']}">${info['2d_canvas']}</span></tr><br>
            <tr>canvas_oop_rasterization: <span class="${info['canvas_oop_rasterization']}">${info['canvas_oop_rasterization']}</span></tr><br>
            <tr>gpu_compositing: <span class="${info['gpu_compositing']}">${info['gpu_compositing']}</span></tr><br>
            <tr>metal: <span class="${info['metal']}">${info['metal']}</span></tr><br>
            <tr>multiple_raster_threads: <span class="${info['multiple_raster_threads']}">${info['multiple_raster_threads']}</span></tr><br>
            <tr>oop_rasterization: <span class="${info['oop_rasterization']}">${info['oop_rasterization']}</span></tr><br>
            <tr>opengl: <span class="${info['opengl']}">${info['opengl']}</span></tr><br>
            <tr>rasterization: <span class="${info['rasterization']}">${info['rasterization']}</span></tr><br>
            <tr>raw_draw: <span class="${info['raw_draw']}">${info['raw_draw']}</span></tr><br>
            <tr>skia_renderer: <span class="${info['skia_renderer']}">${info['skia_renderer']}</span></tr><br>
            <tr>video_decode: <span class="${info['video_decode']}">${info['video_decode']}</span></tr><br>
            <tr>webgl: <span class="${info['webgl']}">${info['webgl']}</span></tr><br>
            <tr>webgl2: <span class="${info['webgl2']}">${info['webgl2']}</span></tr><br>
        </table>
        `
    })
}

window.onbeforeunload = function (e) {
    console.log('[dom] beforeunload')
}

window.onunload = function () {
    console.log('[dom] unload')
}

window.onerror = (event, source, lineno, colno, error) => {
    console.error('[onError]', event, source, lineno, colno, error)
}