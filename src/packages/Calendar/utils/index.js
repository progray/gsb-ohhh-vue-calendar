// 向后兼容的导出
export { isSameDay, createWeekdays, createMonthDates, createWeekDates } from './calendar-engine'

// 为了向后兼容，保留 CalendarDate 类，但推荐使用接口
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

// 导出类型定义供 JavaScript 使用
export const TYPES = {
  ICalendarDate: 'ICalendarDate',
  ICalendarState: 'ICalendarState',
  ICalendarConfig: 'ICalendarConfig'
}
