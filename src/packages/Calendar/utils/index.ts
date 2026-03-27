import { isSameDay, createCalendarDate, createMonthDates, createWeekDates, createWeekdays } from '../calendar-engine'

export class CalendarDate {
  key: string
  date: Date
  fullDate: {
    year: number
    month: number
    date: number
  }
  current: boolean

  constructor(date: Date, current: boolean) {
    const calendarDate = createCalendarDate(date, current)
    this.key = calendarDate.key
    this.date = calendarDate.date
    this.fullDate = calendarDate.fullDate
    this.current = calendarDate.current
  }
}

export { isSameDay, createMonthDates, createWeekDates, createWeekdays }
