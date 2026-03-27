import type {
  ICalendarDate, ICalendarConfig, ICalendarState, ICalendarRenderData, ViewMode, IMarkerDate, MarkerDateInput } from './types'

export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}

export function createCalendarDate(date: Date, current: boolean): ICalendarDate {
  return {
    key: `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`,
    date: new Date(date),
    fullDate: {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      date: date.getDate()
    },
    current
  }
}

export function createMonthDates(date: Date, weekStart: number): ICalendarDate[] {
  const year = date.getFullYear()
  const month = date.getMonth()
  const monthFirstDate = new Date(year, month, 1)
  const monthLastDate = new Date(year, month + 1, 0)
  const firstDateOfWeekIndex = (monthFirstDate.getDay() - weekStart + 7) % 7
  const dates: ICalendarDate[] = []

  for (let i = 0; i < firstDateOfWeekIndex; i++) {
    const d = new Date(year, month, i - firstDateOfWeekIndex + 1)
    dates.push(createCalendarDate(d, false))
  }

  for (let i = 1; i <= monthLastDate.getDate(); i++) {
    const d = new Date(year, month, i)
    dates.push(createCalendarDate(d, true))
  }

  const extra = (7 - (dates.length % 7)) % 7
  for (let i = 1; i <= extra; i++) {
    const d = new Date(year, month + 1, i)
    dates.push(createCalendarDate(d, false))
  }

  return dates
}

export function createWeekDates(date: Date, weekStart: number): ICalendarDate[] {
  const weekDay = date.getDay()
  const offsetToStart = (weekDay - weekStart + 7) % 7
  const startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() - offsetToStart)
  const dates: ICalendarDate[] = []

  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i)
    dates.push(createCalendarDate(d, d.getMonth() === date.getMonth()))
  }

  return dates
}

export function createWeekdays(index: number): string[] {
  const WEEK_DAYS = ['日', '一', '二', '三', '四', '五', '六']
  return WEEK_DAYS.slice(index).concat(WEEK_DAYS.slice(0, index))
}

export class CalendarEngine {
  private _state: ICalendarState
  private _config: ICalendarConfig
  private _targetDate: Date | null = null
  private _prevMonthDates: ICalendarDate[] = []
  private _nextMonthDates: ICalendarDate[] = []
  private _prevWeekDates: ICalendarDate[] = []
  private _nextWeekDates: ICalendarDate[] = []
  private _markerDates: IMarkerDate[] = []

  constructor(initialSelectedDate: Date, initialViewMode: ViewMode, config: ICalendarConfig) {
    this._state = {
      selected: new Date(initialSelectedDate),
      currentYear: initialSelectedDate.getFullYear(),
      currentMonth: initialSelectedDate.getMonth(),
      viewMode: initialViewMode,
      weekIndex: 0
    }
    this._config = { ...config }
    this._initialize()
  }

  private _initialize(): void {
    this._setWeekIndex()
    this._setPrevMonthDates(new Date(this._state.currentYear, this._state.currentMonth - 1))
    this._setNextMonthDates(new Date(this._state.currentYear, this._state.currentMonth + 1))
    this._setPrevWeekDates(this._getPrevWeekDate())
    this._setNextWeekDates(this._getNextWeekDate())
  }

  private _getCurrentMonthDates(): ICalendarDate[] {
    return createMonthDates(new Date(this._state.currentYear, this._state.currentMonth), this._config.weekStart)
  }

  private _getCurrentWeekDates(): ICalendarDate[] {
    const monthDates = this._getCurrentMonthDates()
    return monthDates.slice(this._state.weekIndex * 7, this._state.weekIndex * 7 + 7)
  }

  private _setWeekIndex(date?: Date): void {
    if (this._state.viewMode !== 'week') return
    const targetDate = date || this._state.selected
    const monthDates = this._getCurrentMonthDates()
    const found = monthDates.findIndex(d => isSameDay(d.date, targetDate))
    const idx = Math.max(found, 0)
    this._state.weekIndex = Math.floor(idx / 7)
  }

  private _setPrevMonthDates(date: Date): void {
    this._prevMonthDates = createMonthDates(date, this._config.weekStart)
  }

  private _setNextMonthDates(date: Date): void {
    this._nextMonthDates = createMonthDates(date, this._config.weekStart)
  }

  private _setPrevWeekDates(date: Date): void {
    this._prevWeekDates = createWeekDates(date, this._config.weekStart)
  }

  private _setNextWeekDates(date: Date): void {
    this._nextWeekDates = createWeekDates(date, this._config.weekStart)
  }

  private _getPrevWeekDate(): Date {
    const currentWeekDates = this._getCurrentWeekDates()
    return new Date(currentWeekDates[0].date.getTime() - 24 * 60 * 60 * 1000)
  }

  private _getNextWeekDate(): Date {
    const currentWeekDates = this._getCurrentWeekDates()
    return new Date(currentWeekDates[6].date.getTime() + 24 * 60 * 60 * 1000)
  }

  getState(): Readonly<ICalendarState> {
    return { ...this._state }
  }

  getRenderData(): ICalendarRenderData {
    const currentMonthDates = this._getCurrentMonthDates()
    const currentWeekDates = this._getCurrentWeekDates()
    const current = this._state.viewMode === 'week' ? currentWeekDates : currentMonthDates
    const prev = this._state.viewMode === 'week' ? this._prevWeekDates : this._prevMonthDates
    const next = this._state.viewMode === 'week' ? this._nextWeekDates : this._nextMonthDates
    const rows = this._state.viewMode === 'week' ? 1 : Math.ceil(currentMonthDates.length / 7)

    return { current, prev, next, rows }
  }

  getTargetDate(): Date | null {
    return this._targetDate ? new Date(this._targetDate) : null
  }

  setSelected(date: Date): void {
    this._state.selected = new Date(date)
  }

  toggleViewMode(): ViewMode {
    this._state.viewMode = this._state.viewMode === 'week' ? 'month' : 'week'
    if (this._state.viewMode === 'week') {
      this._setWeekIndex()
    }
    return this._state.viewMode
  }

  switchPageToTargetDate(date: Date): 'left' | 'right' | null {
    if (this._state.viewMode === 'week') {
      return this._switchPageToTargetDateInWeekView(date)
    } else {
      return this._switchPageToTargetDateInMonthView(date)
    }
  }

  private _switchPageToTargetDateInMonthView(date: Date): 'left' | 'right' | null {
    if (date.getFullYear() === this._state.currentYear && date.getMonth() === this._state.currentMonth) {
      return null
    }

    let direction: 'left' | 'right'
    if (
      date.getFullYear() < this._state.currentYear ||
      (date.getFullYear() === this._state.currentYear && date.getMonth() < this._state.currentMonth)
    ) {
      direction = 'right'
      this._setPrevMonthDates(date)
    } else {
      direction = 'left'
      this._setNextMonthDates(date)
    }

    this._targetDate = new Date(date)
    return direction
  }

  private _switchPageToTargetDateInWeekView(date: Date): 'left' | 'right' | null {
    const currentWeekDates = this._getCurrentWeekDates()
    const isInCurrentWeek = currentWeekDates.some(item => isSameDay(item.date, date))

    if (isInCurrentWeek) {
      if (date.getFullYear() !== this._state.currentYear || date.getMonth() !== this._state.currentMonth) {
        this._state.currentYear = date.getFullYear()
        this._state.currentMonth = date.getMonth()
        this._setWeekIndex(date)
      }
      return null
    }

    let direction: 'left' | 'right'
    if (date < currentWeekDates[0].date) {
      direction = 'right'
      this._setPrevWeekDates(date)
    } else {
      direction = 'left'
      this._setNextWeekDates(date)
    }

    this._targetDate = new Date(date)
    return direction
  }

  finalizeTransition(): void {
    if (!this._targetDate) return

    this._state.currentYear = this._targetDate.getFullYear()
    this._state.currentMonth = this._targetDate.getMonth()

    if (this._state.viewMode === 'week') {
      this._setWeekIndex(this._targetDate)
      this._setPrevWeekDates(this._getPrevWeekDate())
      this._setNextWeekDates(this._getNextWeekDate())
    } else {
      this._setPrevMonthDates(new Date(this._state.currentYear, this._state.currentMonth - 1))
      this._setNextMonthDates(new Date(this._state.currentYear, this._state.currentMonth + 1))
    }

    this._targetDate = null
  }

  normalizePageParam(param: string | Date): Date {
    if (!param) {
      throw new Error('参数不能为空')
    }

    if (typeof param === 'string') {
      const currentRenderData = this.getRenderData()
      const currentDates = currentRenderData.current

      switch (param) {
        case 'prev-page':
          if (this._state.viewMode === 'week') {
            return new Date(currentDates[0].date.getTime() - 24 * 60 * 60 * 1000)
          } else {
            return new Date(this._state.currentYear, this._state.currentMonth - 1)
          }
        case 'next-page':
          if (this._state.viewMode === 'week') {
            return new Date(currentDates[6].date.getTime() + 24 * 60 * 60 * 1000)
          } else {
            return new Date(this._state.currentYear, this._state.currentMonth + 1)
          }
        case 'prev-year':
          return new Date(this._state.currentYear - 1, this._state.currentMonth)
        case 'next-year':
          return new Date(this._state.currentYear + 1, this._state.currentMonth)
        default:
          const parsedDate = new Date(param)
          if (!Number.isNaN(parsedDate.getTime())) {
            return parsedDate
          }
          throw new Error('日期不合法')
      }
    }

    return new Date(param)
  }

  setMarkerDates(markerDates: MarkerDateInput[]): void {
    this._markerDates = markerDates.map(item => {
      let date: Date
      let color: string

      if (typeof item === 'object' && item !== null && 'date' in item) {
        date = new Date(item.date)
        color = item.color || 'var(--calendar-theme-color)'
      } else {
        date = new Date(item as Date | string | number)
        color = 'var(--calendar-theme-color)'
      }

      return { date, color }
    })
  }

  getMarkerColor(date: Date): string | undefined {
    return this._markerDates.find(d => isSameDay(d.date, date))?.color
  }

  getHeaderLabel(): string {
    return `${this._state.currentYear}年${this._state.currentMonth + 1}月`
  }

  getWeekdays(): string[] {
    return createWeekdays(this._config.weekStart)
  }
}
