export type ViewMode = 'month' | 'week'

export interface IDateHeader {
  year: number
  month: number
  date: number
}

export interface ICalendarDate {
  key: string
  date: Date
  fullDate: IDateHeader
  current: boolean
}

export interface IMarkerDate {
  date: Date
  color: string
}

export type MarkerDateInput = Date | string | number | { date: Date | string | number; color?: string }

export interface ICalendarConfig {
  weekStart: number
  duration: string
}

export interface ICalendarState {
  selected: Date
  currentYear: number
  currentMonth: number
  viewMode: ViewMode
  weekIndex: number
}

export interface ICalendarRenderData {
  current: ICalendarDate[]
  prev: ICalendarDate[]
  next: ICalendarDate[]
  rows: number
}
