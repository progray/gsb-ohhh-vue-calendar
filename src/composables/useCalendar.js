export class CalendarDate {
  constructor(date, current) {
    this.key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
    this.date = new Date(date)
    this.fullDate = {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      date: date.getDate()
    }
    this.current = current
  }
}

export function createWeekdays(index) {
  const WEEK_DAYS = ['日', '一', '二', '三', '四', '五', '六']
  return WEEK_DAYS.slice(index).concat(WEEK_DAYS.slice(0, index))
}

export function isSameDay(date1, date2) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}

export function createMonthDates(date, index) {
  const year = date.getFullYear()
  const month = date.getMonth()
  const monthFirstDate = new Date(year, month, 1)
  const monthLastDate = new Date(year, month + 1, 0)
  const firstDateOfWeekIndex = (monthFirstDate.getDay() - index + 7) % 7
  const dates = []
  for (let i = 0; i < firstDateOfWeekIndex; i++) {
    const d = new Date(year, month, i - firstDateOfWeekIndex + 1)
    const cDate = new CalendarDate(d, false)
    dates.push(cDate)
  }
  for (let i = 1; i <= monthLastDate.getDate(); i++) {
    const d = new Date(year, month, i)
    const cDate = new CalendarDate(d, true)
    dates.push(cDate)
  }
  const extra = (7 - (dates.length % 7)) % 7
  for (let i = 1; i <= extra; i++) {
    const d = new Date(year, month + 1, i)
    const cDate = new CalendarDate(d, false)
    dates.push(cDate)
  }
  return dates
}

export function createWeekDates(date, index) {
  const weekDay = date.getDay()
  const offsetToStart = (weekDay - index + 7) % 7
  const startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() - offsetToStart)
  const dates = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i)
    const cDate = new CalendarDate(d, d.getMonth() === date.getMonth())
    dates.push(cDate)
  }
  return dates
}

export function normalizeDateParam(param, { viewMode, currentYear, currentMonth, currentRenderDates }) {
  if (!param) {
    throw new Error('参数不能为空')
  }
  if (param === 'prev-page') {
    if (viewMode === 'week') {
      return new Date(
        new Date(currentRenderDates[0].date).setDate(currentRenderDates[0].date.getDate() - 1)
      )
    } else if (viewMode === 'month') {
      return new Date(currentYear, currentMonth - 1)
    }
  }
  if (param === 'next-page') {
    if (viewMode === 'week') {
      return new Date(
        new Date(currentRenderDates[6].date).setDate(currentRenderDates[6].date.getDate() + 1)
      )
    } else if (viewMode === 'month') {
      return new Date(currentYear, currentMonth + 1)
    }
  }
  if (param === 'prev-year') {
    return new Date(currentYear - 1, currentMonth)
  }
  if (param === 'next-year') {
    return new Date(currentYear + 1, currentMonth)
  }
  const targetDate = new Date(param)
  if (!Number.isNaN(targetDate.getTime())) {
    return targetDate
  }
  throw new Error('日期不合法')
}

export function getDirectionForDate(date, { currentYear, currentMonth, currentWeekDates, viewMode }) {
  if (viewMode === 'week') {
    return date < currentWeekDates[0].date ? 'right' : 'left'
  } else {
    if (
      date.getFullYear() < currentYear ||
      (date.getFullYear() === currentYear && date.getMonth() < currentMonth)
    ) {
      return 'right'
    } else {
      return 'left'
    }
  }
}

export function isSameMonth(date1, date2) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth()
  )
}

export function findWeekIndex(date, monthDates, weekStart) {
  const found = monthDates.findIndex(d => isSameDay(d.date, date))
  const idx = Math.max(found, 0)
  return Math.floor(idx / 7)
}

export function getPrevMonthDate(year, month) {
  return new Date(year, month - 1)
}

export function getNextMonthDate(year, month) {
  return new Date(year, month + 1)
}

export function getPrevWeekDate(currentWeekDates) {
  return new Date(new Date(currentWeekDates[0].date).setDate(currentWeekDates[0].date.getDate() - 1))
}

export function getNextWeekDate(currentWeekDates) {
  return new Date(new Date(currentWeekDates[6].date).setDate(currentWeekDates[6].date.getDate() + 1))
}
