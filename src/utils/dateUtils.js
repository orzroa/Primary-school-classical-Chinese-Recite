export function getLocalDateStr(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function addDays(dateStr, days) {
  const date = new Date(dateStr)
  date.setDate(date.getDate() + days)
  return getLocalDateStr(date)
}

export function formatDateReadable(dateStr) {
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

export function compareDates(dateStrA, dateStrB) {
  return new Date(dateStrA) - new Date(dateStrB)
}

export function isToday(dateStr) {
  return dateStr === getLocalDateStr()
}

export function isPast(dateStr) {
  const today = getLocalDateStr()
  return new Date(dateStr) < new Date(today)
}