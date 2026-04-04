import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import { ref } from 'vue'
import Calendar from '../src/packages/Calendar/Calendar.vue'
import { useCalendar } from '../src/packages/Calendar/hooks/useCalendar.js'
import { createMonthDates, createWeekDates } from '../src/packages/Calendar/utils/index.js'

describe('Calendar 组件测试', () => {
  describe('月份切换功能', () => {
    it('点击"上一页"按钮，Header 中的年月应该同步更新', async () => {
      const wrapper = mount(Calendar, {
        props: {
          initialSelectedDate: new Date(2024, 5, 15),
          showToolbar: true
        }
      })

      await wrapper.vm.$nextTick()

      expect(wrapper.find('.ohhh-calendar-toolbar--text').text()).toBe('2024年6月')

      await wrapper.vm.changePageTo('prev-page')
      await wrapper.vm.$nextTick()
      
      wrapper.vm.onTransitionEnd()
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.ohhh-calendar-toolbar--text').text()).toBe('2024年5月')
    })

    it('点击"下一页"按钮，Header 中的年月应该同步更新', async () => {
      const wrapper = mount(Calendar, {
        props: {
          initialSelectedDate: new Date(2024, 5, 15),
          showToolbar: true
        }
      })

      await wrapper.vm.$nextTick()

      expect(wrapper.find('.ohhh-calendar-toolbar--text').text()).toBe('2024年6月')

      await wrapper.vm.changePageTo('next-page')
      await wrapper.vm.$nextTick()
      
      wrapper.vm.onTransitionEnd()
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.ohhh-calendar-toolbar--text').text()).toBe('2024年7月')
    })

    it('点击"上一年"按钮，Header 中的年份应该同步更新', async () => {
      const wrapper = mount(Calendar, {
        props: {
          initialSelectedDate: new Date(2024, 5, 15),
          showToolbar: true
        }
      })

      await wrapper.vm.$nextTick()

      expect(wrapper.find('.ohhh-calendar-toolbar--text').text()).toBe('2024年6月')

      await wrapper.vm.changePageTo('prev-year')
      await wrapper.vm.$nextTick()
      
      wrapper.vm.onTransitionEnd()
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.ohhh-calendar-toolbar--text').text()).toBe('2023年6月')
    })

    it('点击"下一年"按钮，Header 中的年份应该同步更新', async () => {
      const wrapper = mount(Calendar, {
        props: {
          initialSelectedDate: new Date(2024, 5, 15),
          showToolbar: true
        }
      })

      await wrapper.vm.$nextTick()

      expect(wrapper.find('.ohhh-calendar-toolbar--text').text()).toBe('2024年6月')

      await wrapper.vm.changePageTo('next-year')
      await wrapper.vm.$nextTick()
      
      wrapper.vm.onTransitionEnd()
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.ohhh-calendar-toolbar--text').text()).toBe('2025年6月')
    })
  })

  describe('闰年边界测试 (2024-02-29)', () => {
    it('从 2024-02-29 切换到下一个月（3月），不应该发生日期溢出', async () => {
      const wrapper = mount(Calendar, {
        props: {
          initialSelectedDate: new Date(2024, 1, 29),
          showToolbar: true
        }
      })

      await wrapper.vm.$nextTick()

      expect(wrapper.find('.ohhh-calendar-toolbar--text').text()).toBe('2024年2月')

      await wrapper.vm.changePageTo('next-page')
      await wrapper.vm.$nextTick()
      
      wrapper.vm.onTransitionEnd()
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.ohhh-calendar-toolbar--text').text()).toBe('2024年3月')
    })

    it('从 2024-02-29 切换到上一个月（1月），不应该发生日期溢出', async () => {
      const wrapper = mount(Calendar, {
        props: {
          initialSelectedDate: new Date(2024, 1, 29),
          showToolbar: true
        }
      })

      await wrapper.vm.$nextTick()

      expect(wrapper.find('.ohhh-calendar-toolbar--text').text()).toBe('2024年2月')

      await wrapper.vm.changePageTo('prev-page')
      await wrapper.vm.$nextTick()
      
      wrapper.vm.onTransitionEnd()
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.ohhh-calendar-toolbar--text').text()).toBe('2024年1月')
    })

    it('从 2024-02-29 切换到下一年（2025年2月），不应该发生日期溢出', async () => {
      const wrapper = mount(Calendar, {
        props: {
          initialSelectedDate: new Date(2024, 1, 29),
          showToolbar: true
        }
      })

      await wrapper.vm.$nextTick()

      expect(wrapper.find('.ohhh-calendar-toolbar--text').text()).toBe('2024年2月')

      await wrapper.vm.changePageTo('next-year')
      await wrapper.vm.$nextTick()
      
      wrapper.vm.onTransitionEnd()
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.ohhh-calendar-toolbar--text').text()).toBe('2025年2月')
    })

    it('从 2024-02-29 切换到上一年（2023年2月），不应该发生日期溢出', async () => {
      const wrapper = mount(Calendar, {
        props: {
          initialSelectedDate: new Date(2024, 1, 29),
          showToolbar: true
        }
      })

      await wrapper.vm.$nextTick()

      expect(wrapper.find('.ohhh-calendar-toolbar--text').text()).toBe('2024年2月')

      await wrapper.vm.changePageTo('prev-year')
      await wrapper.vm.$nextTick()
      
      wrapper.vm.onTransitionEnd()
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.ohhh-calendar-toolbar--text').text()).toBe('2023年2月')
    })
  })
})

describe('useCalendar Hook 测试', () => {
  describe('createMonthDates 函数', () => {
    it('2024年2月应该有29天', () => {
      const dates = createMonthDates(new Date(2024, 1, 1), 0)
      const februaryDates = dates.filter(d => d.fullDate.month === 2)
      expect(februaryDates.length).toBe(29)
    })

    it('2023年2月应该有28天', () => {
      const dates = createMonthDates(new Date(2023, 1, 1), 0)
      const februaryDates = dates.filter(d => d.fullDate.month === 2)
      expect(februaryDates.length).toBe(28)
    })

    it('weekStart: 0 (周日) 和 weekStart: 1 (周一) 返回的第一天日期偏移量应该不同', () => {
      const testDate = new Date(2024, 5, 15)
      
      const datesWeekStart0 = createMonthDates(testDate, 0)
      const datesWeekStart1 = createMonthDates(testDate, 1)
      
      const firstDate0 = datesWeekStart0[0]
      const firstDate1 = datesWeekStart1[0]
      
      expect(firstDate0.date).not.toBe(firstDate1.date)
      expect(firstDate0.fullDate.date).not.toBe(firstDate1.fullDate.date)
      
      const dayDiff = Math.abs(firstDate0.fullDate.date - firstDate1.fullDate.date)
      expect(dayDiff).toBe(1)
    })

    it('2024年6月1日是周六，weekStart: 0 时第一天应该是5月26日', () => {
      const dates = createMonthDates(new Date(2024, 5, 1), 0)
      expect(dates[0].fullDate.year).toBe(2024)
      expect(dates[0].fullDate.month).toBe(5)
      expect(dates[0].fullDate.date).toBe(26)
    })

    it('2024年6月1日是周六，weekStart: 1 时第一天应该是5月27日', () => {
      const dates = createMonthDates(new Date(2024, 5, 1), 1)
      expect(dates[0].fullDate.year).toBe(2024)
      expect(dates[0].fullDate.month).toBe(5)
      expect(dates[0].fullDate.date).toBe(27)
    })
  })

  describe('日期切换逻辑', () => {
    it('从2024-02-29切换到下个月（3月）应该正确处理', () => {
      const initialSelectedDate = ref(new Date(2024, 1, 29))
      const initialViewMode = ref('month')
      const weekStart = ref(0)
      const duration = ref('0.3s')
      const emit = vi.fn()

      const { currentYear, currentMonth, switchPageToTargetDate, onTransitionEnd } = useCalendar(
        { initialSelectedDate, initialViewMode, weekStart, duration },
        emit
      )

      expect(currentYear.value).toBe(2024)
      expect(currentMonth.value).toBe(1)

      switchPageToTargetDate(new Date(2024, 2, 1))
      onTransitionEnd()

      expect(currentYear.value).toBe(2024)
      expect(currentMonth.value).toBe(2)
    })

    it('从2024-02-29切换到上个月（1月）应该正确处理', () => {
      const initialSelectedDate = ref(new Date(2024, 1, 29))
      const initialViewMode = ref('month')
      const weekStart = ref(0)
      const duration = ref('0.3s')
      const emit = vi.fn()

      const { currentYear, currentMonth, switchPageToTargetDate, onTransitionEnd } = useCalendar(
        { initialSelectedDate, initialViewMode, weekStart, duration },
        emit
      )

      expect(currentYear.value).toBe(2024)
      expect(currentMonth.value).toBe(1)

      switchPageToTargetDate(new Date(2024, 0, 1))
      onTransitionEnd()

      expect(currentYear.value).toBe(2024)
      expect(currentMonth.value).toBe(0)
    })

    it('从2024-02-29切换到2025年2月应该正确处理', () => {
      const initialSelectedDate = ref(new Date(2024, 1, 29))
      const initialViewMode = ref('month')
      const weekStart = ref(0)
      const duration = ref('0.3s')
      const emit = vi.fn()

      const { currentYear, currentMonth, switchPageToTargetDate, onTransitionEnd } = useCalendar(
        { initialSelectedDate, initialViewMode, weekStart, duration },
        emit
      )

      expect(currentYear.value).toBe(2024)
      expect(currentMonth.value).toBe(1)

      switchPageToTargetDate(new Date(2025, 1, 1))
      onTransitionEnd()

      expect(currentYear.value).toBe(2025)
      expect(currentMonth.value).toBe(1)
    })
  })
})
