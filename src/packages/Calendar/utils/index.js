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

export function createWeekdays(index, weekdaysArray) {
  const WEEK_DAYS = weekdaysArray || ['日', '一', '二', '三', '四', '五', '六']
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
