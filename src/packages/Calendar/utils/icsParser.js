import ICAL from 'ical.js'

function normalizeDate(value) {
  if (typeof value === 'string' || typeof value === 'number') {
    return new Date(value)
  }
  if (value instanceof Date) {
    return new Date(value)
  }
  return value
}

export function isSameDay(date1, date2) {
  const d1 = normalizeDate(date1)
  const d2 = normalizeDate(date2)
  if (!d1 || !d2) return false
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  )
}

export function formatDateKey(date) {
  const d = normalizeDate(date)
  if (!d) return ''
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function formatTime(date) {
  const d = normalizeDate(date)
  if (!d) return ''
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function truncateText(text, maxLength = 6) {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

export function getAllDatesInRange(startDate, endDate) {
  const dates = []
  const start = normalizeDate(startDate)
  const end = normalizeDate(endDate)
  if (!start || !end) return dates

  const current = new Date(start.getFullYear(), start.getMonth(), start.getDate())
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate())

  while (current <= endDay) {
    dates.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }
  return dates
}

export function parseICSFile(icsContent) {
  try {
    const jcal = ICAL.parse(icsContent)
    const comp = new ICAL.Component(jcal)
    const vevents = comp.getAllSubcomponents('vevent')
    const calendarName = comp.getFirstPropertyValue('x-wr-calname') || '未命名日历'

    const events = vevents.map(vevent => {
      const summary = vevent.getFirstPropertyValue('summary') || '(无标题)'
      const dtstart = vevent.getFirstPropertyValue('dtstart')
      const dtend = vevent.getFirstPropertyValue('dtend')
      const description = vevent.getFirstPropertyValue('description') || ''
      const location = vevent.getFirstPropertyValue('location') || ''
      const uid = vevent.getFirstPropertyValue('uid')

      let startDate
      let endDate
      let isAllDay = false

      if (dtstart) {
        if (dtstart.isDate) {
          isAllDay = true
          startDate = new Date(dtstart.year, dtstart.month - 1, dtstart.day, 0, 0, 0)
        } else {
          startDate = dtstart.toJSDate()
        }
      } else {
        startDate = new Date()
      }

      if (dtend) {
        if (dtend.isDate) {
          endDate = new Date(dtend.year, dtend.month - 1, dtend.day - 1, 23, 59, 59)
        } else {
          endDate = dtend.toJSDate()
        }
      } else {
        endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000)
      }

      const dates = getAllDatesInRange(startDate, endDate)
      const startDateKey = formatDateKey(startDate)
      const endDateKey = formatDateKey(endDate)
      const isMultiDay = dates.length > 1

      return {
        uid: uid || `${summary}-${startDateKey}`,
        title: summary,
        description,
        location,
        startDate,
        endDate,
        startDateKey,
        endDateKey,
        dates,
        dateKeys: dates.map(d => formatDateKey(d)),
        isAllDay,
        isMultiDay,
        formattedTime: isAllDay ? '全天' : `${formatTime(startDate)} - ${formatTime(endDate)}`
      }
    })

    return {
      name: calendarName,
      events,
      eventCount: events.length
    }
  } catch (error) {
    console.error('解析 ICS 文件失败:', error)
    throw new Error('无法解析 ICS 文件，请确保文件格式正确')
  }
}

export function isDateInRange(date, startDate, endDate) {
  const d = normalizeDate(date)
  const start = normalizeDate(startDate)
  const end = normalizeDate(endDate)
  if (!d || !start || !end) return false

  const dStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0)
  const sStart = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 0, 0, 0)
  const eStart = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59)

  return dStart >= sStart && dStart <= eStart
}
