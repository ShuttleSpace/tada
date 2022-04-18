
function now() {
  return dateFormat(new Date(), 'yyyy-MM-dd hh:mm:ss')
}

function dateFormat(newDate, format) {
  const date = {
    'M+': newDate.getMonth() + 1,
    'd+': newDate.getDate(),
    'h+': newDate.getHours(),
    'm+': newDate.getMinutes(),
    's+': newDate.getSeconds(),
    'q+': Math.floor((newDate.getMonth() + 3) / 3),
    'S+': newDate.getMilliseconds()
  }
  if (/(y+)/i.test(format)) {
    format = format.replace(RegExp.$1, (newDate.getFullYear() + '').substr(4 - RegExp.$1.length))
  }
  for (const k in date) {
    if (new RegExp('(' + k + ')').test(format)) {
      format = format.replace(
        RegExp.$1,
        RegExp.$1.length == 1 ? date[k] : ('00' + date[k]).substr(('' + date[k]).length)
      )
    }
  }
  return format
}

function timeTrace(start) {
  const diff = Date.now() - start
  console.log(`[time] ${diff / 1000}s, ${diff}ms`)
  return diff
}

module.exports = { now, dateFormat, timeTrace  }