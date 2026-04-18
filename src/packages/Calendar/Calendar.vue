<template>
  <div
    class="ohhh-calendar-container"
    :class="{ 'is-week-view': viewMode === 'week' }"
    :style="{
      '--calendar-rows': renderRows,
      '--calendar-transition-duration': duration,
      '--translate-distance': transformDistance,
      '--transition-duration': transitionDuration
    }"
  >
    <!-- 顶部工具栏 -->
    <div v-if="showToolbar" class="ohhh-calendar-toolbar">
      <slot name="toolbar" :year="currentYear" :month="currentMonth" :viewMode="viewMode">
        <div v-html="icons.arrowDoubleLeft" class="ohhh-calendar-toolbar--icon" @click="changePageTo('prev-year')" />
        <div v-html="icons.arrowLeft" class="ohhh-calendar-toolbar--icon" @click="changePageTo('prev-page')" />
        <div class="ohhh-calendar-toolbar--text">{{ headerLabel }}</div>
        <div v-html="icons.arrowRight" class="ohhh-calendar-toolbar--icon" @click="changePageTo('next-page')" />
        <div v-html="icons.arrowDoubleRight" class="ohhh-calendar-toolbar--icon" @click="changePageTo('next-year')" />
      </slot>
    </div>

    <!-- 星期栏 -->
    <div v-if="showWeekdays" class="ohhh-calendar-weekdays">
      <div v-for="(day, index) in weekdays" :key="day" class="ohhh-calendar-weekdays--weekday">
        <slot name="weekday" :weekday="day" :index="(index + weekStart) % 7">{{ day }}</slot>
      </div>
    </div>

    <!-- 日历主体 -->
    <template v-if="viewMode === 'month'">
      <div ref="swp" class="ohhh-calendar-wrapper">
        <div
          v-for="(item, index) in allRenderDates"
          :key="index"
          :style="{ left: 100 * (index - 1) + '%' }"
          class="ohhh-calendar-days"
          @transitionend="onTransitionEnd"
        >
          <div
            v-for="dateObj in item"
            :key="dateObj.key"
            class="ohhh-calendar-day"
            :class="{
              'is-selected': isSameDay(dateObj.date, selected),
              'is-today': isSameDay(dateObj.date, new Date()),
              'other-month': !dateObj.current
            }"
            @click="changeSelectedDate(dateObj.date)"
          >
            <div class="ohhh-calendar-day--inner">
              <div class="ohhh-calendar-day--inner-value">{{ dateObj.fullDate.date }}</div>
              <div class="ohhh-calendar-day--inner-label" v-if="$slots['day-label']">
                <slot name="day-label" :date="dateObj.date" />
              </div>
            </div>
            <div class="ohhh-calendar-day--marker" :style="{ background: _getMarkerColor(dateObj.date) }" />
          </div>
        </div>
      </div>
    </template>

    <!-- 周视图 - 时间轴布局 -->
    <template v-else>
      <div ref="swp" class="ohhh-calendar-week-wrapper">
        <div
          v-for="(weekData, pageIndex) in allWeekViewData"
          :key="pageIndex"
          :style="{ left: 100 * (pageIndex - 1) + '%' }"
          class="ohhh-calendar-week-page"
          @transitionend="onTransitionEnd"
        >
          <!-- 时间轴左侧 -->
          <div class="ohhh-calendar-time-axis">
            <div
              v-for="hour in timeAxisHours"
              :key="hour"
              class="ohhh-calendar-time-axis--hour"
            >
              <span class="ohhh-calendar-time-axis--hour-label">{{ _formatHourLabel(hour) }}</span>
            </div>
          </div>

          <!-- 日期列区域 -->
          <div class="ohhh-calendar-week-days">
            <div
              v-for="(dateObj, dayIndex) in weekData.dates"
              :key="dateObj.key"
              class="ohhh-calendar-week-day"
              :class="{
                'is-selected': isSameDay(dateObj.date, selected),
                'is-today': isSameDay(dateObj.date, new Date()),
                'other-month': !dateObj.current
              }"
              @click="changeSelectedDate(dateObj.date)"
            >
              <!-- 日期头部 -->
              <div class="ohhh-calendar-week-day--header">
                <div class="ohhh-calendar-week-day--date">{{ dateObj.fullDate.date }}</div>
              </div>

              <!-- 时间网格 -->
              <div class="ohhh-calendar-week-day--grid">
                <div
                  v-for="hour in timeAxisHours"
                  :key="hour"
                  class="ohhh-calendar-week-day--grid-hour"
                ></div>
              </div>

              <!-- 事件层 -->
              <div class="ohhh-calendar-week-day--events">
                <div
                  v-for="(event, eventIndex) in weekData.eventsByDay[dayIndex]"
                  :key="eventIndex"
                  class="ohhh-calendar-event"
                  :style="_getEventStyle(event)"
                  :title="event.title"
                  @click.stop="$emit('event-click', event)"
                >
                  <slot name="event" :event="event">
                    <div class="ohhh-calendar-event--title">{{ event.title }}</div>
                    <div class="ohhh-calendar-event--time" v-if="event.showTime">
                      {{ event.startTime }} - {{ event.endTime }}
                    </div>
                  </slot>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- 底部工具栏 -->
    <div v-if="showFooter" class="ohhh-calendar-footer">
      <slot name="footer" :year="currentYear" :month="currentMonth" :viewMode="viewMode">
        <div
          v-html="viewMode === 'week' ? icons.arrowDown : icons.arrowUp"
          class="ohhh-calendar-footer--icon"
          @click="toggleViewMode"
        />
      </slot>
    </div>
  </div>
</template>

<script setup>
import { computed, useTemplateRef, toRefs } from 'vue'
import { useSwipe } from '@vueuse/core'
import { useCalendar } from './hooks/useCalendar.js'
import { isSameDay, createWeekdays } from './utils'
import { icons } from './utils/icons.js'

const swipeRef = useTemplateRef('swp')

const emit = defineEmits(['select-change', 'view-change', 'event-click'])

const props = defineProps({
  // 初始选中的日期
  initialSelectedDate: {
    type: Date,
    default: () => new Date()
  },
  // 初始视图模式
  initialViewMode: {
    type: String,
    default: 'month' // month or week
  },
  // 以周几作为每周的起始
  weekStart: {
    type: Number,
    default: 0 // 0: Sunday, 1: Monday, etc.
  },
  // 标记的日期
  markerDates: {
    type: Array,
    default: () => []
  },
  // 日程事件数组（用于周视图）
  // 每个事件格式：{ date: '2025-08-05' 或 Date, startTime: '09:00', endTime: '11:30', title: '会议', color: '#409eff' }
  events: {
    type: Array,
    default: () => []
  },
  // 周视图时间轴开始时间（小时）
  timeAxisStart: {
    type: Number,
    default: 8 // 8:00
  },
  // 周视图时间轴结束时间（小时）
  timeAxisEnd: {
    type: Number,
    default: 22 // 22:00
  },
  // 是否显示事件上的时间
  showEventTime: {
    type: Boolean,
    default: false
  },
  // 是否显示顶部工具栏
  showToolbar: {
    type: Boolean,
    default: true
  },
  // 是否显示底部工具栏
  showFooter: {
    type: Boolean,
    default: true
  },
  // 是否显示weekdays栏
  showWeekdays: {
    type: Boolean,
    default: true
  },
  // 过渡动画时长
  duration: {
    type: String,
    default: '0.3s'
  }
})

const { initialSelectedDate, initialViewMode, weekStart, markerDates, events, timeAxisStart, timeAxisEnd, showEventTime, duration } = toRefs(props)

const {
  selected,
  viewMode,
  currentYear,
  currentMonth,
  currentRenderDates,
  prevRenderDates,
  nextRenderDates,
  allRenderDates,
  transformDistance,
  transitionDuration,
  isInTransition,
  renderRows,
  switchPageToTargetDate,
  startTransitionAnimation,
  onTransitionEnd,
  toggleViewMode
} = useCalendar({ initialSelectedDate, initialViewMode, weekStart, duration }, emit)

// 顶部工具栏标题
const headerLabel = computed(() => `${currentYear.value}年${currentMonth.value + 1}月`)
// 星期栏
const weekdays = createWeekdays(weekStart.value)
// 标记日期
const markerDateList = computed(() =>
  markerDates.value.map(item => ({
    date: new Date(typeof item === 'object' && item.date ? item.date : item),
    color: typeof item === 'object' && item.color ? item.color : 'var(--calendar-theme-color)'
  }))
)

// ==================== 周视图时间轴相关 ====================

// 时间轴小时数组（从开始时间到结束时间）
const timeAxisHours = computed(() => {
  const hours = []
  for (let h = timeAxisStart.value; h <= timeAxisEnd.value; h++) {
    hours.push(h)
  }
  return hours
})

// 时间轴总时长（分钟）
const timeAxisTotalMinutes = computed(() => {
  return (timeAxisEnd.value - timeAxisStart.value) * 60
})

// 归一化事件数据
const normalizedEvents = computed(() => {
  return events.value.map(event => {
    const eventDate = event.date instanceof Date ? event.date : new Date(event.date)
    return {
      ...event,
      eventDate,
      startMinutes: _timeToMinutes(event.startTime),
      endMinutes: _timeToMinutes(event.endTime),
      showTime: showEventTime.value,
      color: event.color || 'var(--calendar-theme-color)'
    }
  })
})

// 生成周视图数据（包含日期和对应事件）
function _createWeekViewData(dates) {
  const eventsByDay = dates.map(() => [])
  
  normalizedEvents.value.forEach(event => {
    dates.forEach((dateObj, index) => {
      if (isSameDay(event.eventDate, dateObj.date)) {
        // 检查事件是否在时间轴范围内
        if (event.endMinutes > timeAxisStart.value * 60 && event.startMinutes < timeAxisEnd.value * 60) {
          eventsByDay[index].push(event)
        }
      }
    })
  })
  
  return {
    dates,
    eventsByDay
  }
}

// 当前周视图数据
const currentWeekViewData = computed(() => {
  return _createWeekViewData(currentRenderDates.value)
})

// 上一周视图数据
const prevWeekViewData = computed(() => {
  return _createWeekViewData(prevRenderDates.value)
})

// 下一周视图数据
const nextWeekViewData = computed(() => {
  return _createWeekViewData(nextRenderDates.value)
})

// 所有周视图数据（上一页、当前页、下一页）
const allWeekViewData = computed(() => {
  return [prevWeekViewData.value, currentWeekViewData.value, nextWeekViewData.value]
})

// 时间字符串转分钟数
function _timeToMinutes(timeStr) {
  if (!timeStr) return 0
  const [hours, minutes] = timeStr.split(':').map(Number)
  return hours * 60 + (minutes || 0)
}

// 格式化小时标签
function _formatHourLabel(hour) {
  return `${hour.toString().padStart(2, '0')}:00`
}

// 获取事件样式（用于定位和高度）
function _getEventStyle(event) {
  const startMinutes = Math.max(event.startMinutes, timeAxisStart.value * 60)
  const endMinutes = Math.min(event.endMinutes, timeAxisEnd.value * 60)
  
  const offsetMinutes = startMinutes - timeAxisStart.value * 60
  const durationMinutes = endMinutes - startMinutes
  
  const topPercent = (offsetMinutes / timeAxisTotalMinutes.value) * 100
  const heightPercent = (durationMinutes / timeAxisTotalMinutes.value) * 100
  
  return {
    top: `${topPercent}%`,
    height: `${Math.max(heightPercent, 2)}%`,
    backgroundColor: event.color
  }
}

// 监听滑动事件
const { lengthX } = useSwipe(swipeRef, {
  // 滑动阈值
  threshold: 0,
  // 手指滑动过程中
  onSwipe: () => {
    if (isInTransition.value) return
    transformDistance.value = -lengthX.value + 'px'
  },
  // 手指抬起滑动结束，开始滑动动画
  onSwipeEnd: (_, direction) => {
    if (isInTransition.value) return
    if (direction === 'left') {
      changePageTo('next-page')
    } else if (direction === 'right') {
      changePageTo('prev-page')
    } else {
      // 如果方向不是左右，则将页面复位
      startTransitionAnimation(direction)
    }
  }
})

// 归一化参数
// 支持 'prev-page', 'next-page', 'prev-year', 'next-year', 以及合法的日期
function _normalize(param) {
  if (!param) {
    throw new Error('参数不能为空')
  }
  if (param === 'prev-page') {
    if (viewMode.value === 'week') {
      return new Date(
        new Date(currentRenderDates.value[0].date).setDate(currentRenderDates.value[0].date.getDate() - 1)
      )
    } else if (viewMode.value === 'month') {
      return new Date(currentYear.value, currentMonth.value - 1)
    }
  }
  if (param === 'next-page') {
    if (viewMode.value === 'week') {
      return new Date(
        new Date(currentRenderDates.value[6].date).setDate(currentRenderDates.value[6].date.getDate() + 1)
      )
    } else if (viewMode.value === 'month') {
      return new Date(currentYear.value, currentMonth.value + 1)
    }
  }
  if (param === 'prev-year') {
    return new Date(currentYear.value - 1, currentMonth.value)
  }
  if (param === 'next-year') {
    return new Date(currentYear.value + 1, currentMonth.value)
  }
  const targetDate = new Date(param)
  if (!Number.isNaN(targetDate.getTime())) {
    return targetDate
  }
  throw new Error('日期不合法')
}

// 切换日历页面
function changePageTo(param) {
  const targetDate = _normalize(param)
  switchPageToTargetDate(targetDate)
}

// 切换选中的日期
function changeSelectedDate(date) {
  changePageTo(date)
  if (!isSameDay(new Date(date), selected.value)) {
    selected.value = new Date(date)
    emit('select-change', selected.value)
  }
}

// 获取 marker 颜色
function _getMarkerColor(date) {
  return markerDateList.value.find(d => isSameDay(d.date, date))?.color
}

defineExpose({
  // 切换周/月视图
  toggleViewMode,
  // 切换日历页
  changePageTo,
  // 切换选中日期
  changeSelectedDate
})
</script>
