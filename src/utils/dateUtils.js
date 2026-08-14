export function getLocalDateStr(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseLocalDate(dateStr) {
  const [year, month, day] = String(dateStr).split('-').map(Number)
  // 使用本地中午规避 YYYY-MM-DD 被当成 UTC，以及夏令时午夜跳变。
  return new Date(year, month - 1, day, 12, 0, 0, 0)
}

export function addDays(dateStr, days) {
  const date = parseLocalDate(dateStr)
  date.setDate(date.getDate() + days)
  return getLocalDateStr(date)
}

export function formatDateReadable(dateStr) {
  const date = parseLocalDate(dateStr)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

export function compareDates(dateStrA, dateStrB) {
  return parseLocalDate(dateStrA) - parseLocalDate(dateStrB)
}

export function isToday(dateStr) {
  return dateStr === getLocalDateStr()
}

export function isPast(dateStr) {
  const today = getLocalDateStr()
  return compareDates(dateStr, today) < 0
}
