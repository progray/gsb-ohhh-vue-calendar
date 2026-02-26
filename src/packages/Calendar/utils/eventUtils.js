export const EVENT_COLORS = {
  red: '#f56c6c',
  orange: '#e6a23c',
  yellow: '#f0d264',
  green: '#67c23a',
  cyan: '#00d1b2',
  blue: '#409eff',
  purple: '#9b59b6',
  pink: '#ff69b4'
}

export const DEFAULT_EVENT_COLOR = 'blue'

export function getEventColor(color) {
  return EVENT_COLORS[color] || color || EVENT_COLORS[DEFAULT_EVENT_COLOR]
}

export function createEventId() {
  return `event_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export function normalizeEvent(event) {
  const date = event.date instanceof Date ? new Date(event.date) : new Date(event.date)
  return {
    id: event.id || createEventId(),
    title: event.title || '未命名事件',
    date,
    color: event.color || DEFAULT_EVENT_COLOR,
    startTime: event.startTime || null,
    endTime: event.endTime || null,
    description: event.description || ''
  }
}

export function isEventOnDate(event, date) {
  const eventDate = event.date instanceof Date ? event.date : new Date(event.date)
  return (
    eventDate.getFullYear() === date.getFullYear() &&
    eventDate.getMonth() === date.getMonth() &&
    eventDate.getDate() === date.getDate()
  )
}

export function checkEventConflict(event1, event2) {
  if (!event1.startTime || !event1.endTime || !event2.startTime || !event2.endTime) {
    return false
  }
  const start1 = parseTimeToMinutes(event1.startTime)
  const end1 = parseTimeToMinutes(event1.endTime)
  const start2 = parseTimeToMinutes(event2.startTime)
  const end2 = parseTimeToMinutes(event2.endTime)
  return start1 < end2 && start2 < end1
}

export function findConflicts(event, events) {
  return events.filter(e => {
    if (e.id === event.id) return false
    if (!isEventOnDate(e, event.date)) return false
    return checkEventConflict(event, e)
  })
}

export function parseTimeToMinutes(timeStr) {
  if (!timeStr) return 0
  const [hours, minutes] = timeStr.split(':').map(Number)
  return hours * 60 + minutes
}

export function formatTime(timeStr) {
  if (!timeStr) return ''
  return timeStr
}

export function getEventsForDate(events, date) {
  return events.filter(event => isEventOnDate(event, date))
}

export function sortEventsByTime(events) {
  return [...events].sort((a, b) => {
    const timeA = a.startTime ? parseTimeToMinutes(a.startTime) : 0
    const timeB = b.startTime ? parseTimeToMinutes(b.startTime) : 0
    return timeA - timeB
  })
}
