import { describe, it, expect } from 'vitest'
import { createMonthDates, createWeekDates, createWeekdays } from '../src/packages/Calendar/utils/index.js'

describe('Calendar Utils', () => {
  describe('createWeekdays', () => {
    it('should return weekdays starting from Sunday when weekStart is 0', () => {
      const weekdays = createWeekdays(0)
      expect(weekdays).toEqual(['日', '一', '二', '三', '四', '五', '六'])
    })

    it('should return weekdays starting from Monday when weekStart is 1', () => {
      const weekdays = createWeekdays(1)
      expect(weekdays).toEqual(['一', '二', '三', '四', '五', '六', '日'])
    })
  })

  describe('createMonthDates', () => {
    it('should generate correct dates with weekStart 0 (Sunday)', () => {
      const date = new Date('2024-01-01') // 2024年1月1日是星期一
      const dates = createMonthDates(date, 0)
      
      // 验证第一个日期是 2023年12月31日（星期日）
      expect(dates[0].fullDate.year).toBe(2023)
      expect(dates[0].fullDate.month).toBe(12)
      expect(dates[0].fullDate.date).toBe(31)
      expect(dates[0].current).toBe(false)
    })

    it('should generate correct dates with weekStart 1 (Monday)', () => {
      const date = new Date('2024-01-01') // 2024年1月1日是星期一
      const dates = createMonthDates(date, 1)
      
      // 验证第一个日期是 2024年1月1日（星期一）
      expect(dates[0].fullDate.year).toBe(2024)
      expect(dates[0].fullDate.month).toBe(1)
      expect(dates[0].fullDate.date).toBe(1)
      expect(dates[0].current).toBe(true)
    })
  })

  describe('createWeekDates', () => {
    it('should generate correct week dates with weekStart 0 (Sunday)', () => {
      const date = new Date('2024-01-01') // 2024年1月1日是星期一
      const dates = createWeekDates(date, 0)
      
      // 验证第一个日期是 2023年12月31日（星期日）
      expect(dates[0].fullDate.year).toBe(2023)
      expect(dates[0].fullDate.month).toBe(12)
      expect(dates[0].fullDate.date).toBe(31)
    })

    it('should generate correct week dates with weekStart 1 (Monday)', () => {
      const date = new Date('2024-01-01') // 2024年1月1日是星期一
      const dates = createWeekDates(date, 1)
      
      // 验证第一个日期是 2024年1月1日（星期一）
      expect(dates[0].fullDate.year).toBe(2024)
      expect(dates[0].fullDate.month).toBe(1)
      expect(dates[0].fullDate.date).toBe(1)
    })
  })
})
