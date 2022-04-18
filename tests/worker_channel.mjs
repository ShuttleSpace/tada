import { MessageChannel, Worker, isMainThread, parentPort } from 'worker_threads'
import Path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = Path.dirname(__filename)

// console.log(`__dirname:${__dirname},\n__filename:${__filename}`)

const { port1, port2 } = new MessageChannel()

// Object that needs transfer was found in message but not listed in transferList

if (isMainThread) {
  const w = new Worker(__filename)
  port1.on('message', (msg) => {
    console.log('[main]', msg)
    w.postMessage('不啦不啦，钱包瘪了!!!')
  })

  w.postMessage({ port: port2 }, [port2])
} else {
  parentPort.on('message', (msg) => {
    if (msg.port) {
      msg.port.postMessage('来搓麻🦷')
    } else {
      console.log('[worker]', msg)
    }
  })
  self.onmessage = (msg) => {
    console.log('[worker] slef:', msg)
  }
}
