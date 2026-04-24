<template>
  <div
    class="ohhh-calendar-container"
    :style="{
      '--calendar-rows': renderRows,
      '--calendar-transition-duration': duration,
      '--translate-distance': transformDistance,
      '--transition-duration': transitionDuration
    }"
  >
    <div v-if="showToolbar" class="ohhh-calendar-toolbar">
      <slot name="toolbar" :year="currentYear" :month="currentMonth" :viewMode="viewMode">
        <div v-html="icons.arrowDoubleLeft" class="ohhh-calendar-toolbar--icon" @click="changePageTo('prev-year')" />
        <div v-html="icons.arrowLeft" class="ohhh-calendar-toolbar--icon" @click="changePageTo('prev-page')" />
        <div class="ohhh-calendar-toolbar--text">{{ headerLabel }}</div>
        <div v-html="icons.arrowRight" class="ohhh-calendar-toolbar--icon" @click="changePageTo('next-page')" />
        <div v-html="icons.arrowDoubleRight" class="ohhh-calendar-toolbar--icon" @click="changePageTo('next-year')" />
      </slot>
    </div>

    <div v-if="showWeekdays" class="ohhh-calendar-weekdays">
      <div v-for="(day, index) in weekdays" :key="day" class="ohhh-calendar-weekdays--weekday">
        <slot name="weekday" :weekday="day" :index="(index + weekStart) % 7">{{ day }}</slot>
      </div>
    </div>

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
            'other-month': !dateObj.current,
            'has-events': _getEventColorBars(dateObj.date).length > 0
          }"
          @click="changeSelectedDate(dateObj.date)"
          @mouseenter="handleDayHover(dateObj, $event)"
          @mouseleave="handleDayLeave"
        >
          <div class="ohhh-calendar-day--inner">
            <div class="ohhh-calendar-day--inner-value">{{ dateObj.fullDate.date }}</div>
            <div class="ohhh-calendar-day--inner-label" v-if="$slots['day-label']">
              <slot name="day-label" :date="dateObj.date" />
            </div>
          </div>
          <div class="ohhh-calendar-day--marker" :style="{ background: _getMarkerColor(dateObj.date) }" />
          <div class="ohhh-calendar-day--event-bars">
            <div
              v-for="(bar, barIndex) in _getEventColorBars(dateObj.date)"
              :key="`${bar.subscriptionId}-${bar.event.uid}`"
              class="ohhh-calendar-day--event-bar"
              :class="{
                'is-continuation': bar.isContinuation,
                'is-start': bar.isStart,
                'is-end': bar.isEnd,
                'is-multi-day': bar.isMultiDay
              }"
              :style="{
                backgroundColor: bar.color,
                left: bar.isContinuation ? '0' : '2px',
                right: bar.isMultiDay && !bar.isEnd ? '0' : '2px',
                zIndex: bar.isMultiDay ? 10 + barIndex : 1 + barIndex
              }"
              :title="bar.eventTitle"
            >
              <span
                v-if="bar.isStart || !bar.isMultiDay"
                class="ohhh-calendar-day--event-bar-title"
              >{{ truncateText(bar.eventTitle, 6) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <Transition name="ohhh-calendar-popup">
      <div
        v-if="hoveredDayEvents.length > 0 && showPopup"
        class="ohhh-calendar-popup"
        :style="popupStyle"
      >
        <div class="ohhh-calendar-popup--header">
          <span class="ohhh-calendar-popup--date">{{ popupDateLabel }}</span>
          <span class="ohhh-calendar-popup--count">{{ hoveredDayEvents.length }} 个事件</span>
        </div>
        <div class="ohhh-calendar-popup--events">
          <div
            v-for="event in hoveredDayEvents"
            :key="`${event.subscriptionId}-${event.uid}`"
            class="ohhh-calendar-popup--event"
          >
            <div class="ohhh-calendar-popup--event-color" :style="{ backgroundColor: event.color }" />
            <div class="ohhh-calendar-popup--event-content">
              <div class="ohhh-calendar-popup--event-title">
                {{ truncateText(event.title, 20) }}
              </div>
              <div class="ohhh-calendar-popup--event-time">
                {{ event.formattedTime }}
              </div>
              <div class="ohhh-calendar-popup--event-source">
                <span class="ohhh-calendar-popup--event-source-label">来源：</span>
                <span class="ohhh-calendar-popup--event-source-name">{{ event.subscriptionName }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

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
import { computed, useTemplateRef, toRefs, ref, watch, nextTick } from 'vue'
import { useSwipe } from '@vueuse/core'
import { useCalendar } from './hooks/useCalendar.js'
import { isSameDay, createWeekdays } from './utils'
import { icons } from './utils/icons.js'
import { truncateText } from './utils/icsParser.js'

const props = defineProps({
  initialSelectedDate: {
    type: Date,
    default: () => new Date()
  },
  initialViewMode: {
    type: String,
    default: 'month'
  },
  weekStart: {
    type: Number,
    default: 0
  },
  markerDates: {
    type: Array,
    default: () => []
  },
  showToolbar: {
    type: Boolean,
    default: true
  },
  showFooter: {
    type: Boolean,
    default: true
  },
  showWeekdays: {
    type: Boolean,
    default: true
  },
  duration: {
    type: String,
    default: '0.3s'
  },
  eventSubscriptions: {
    type: Array,
    default: () => []
  },
  showEventPopup: {
    type: Boolean,
    default: true
  }
})

const { initialSelectedDate, initialViewMode, weekStart, markerDates, duration, eventSubscriptions } = toRefs(props)

const emit = defineEmits(['select-change', 'view-change', 'event-hover', 'import-ics'])

const swipeRef = useTemplateRef('swp')

const {
  selected,
  viewMode,
  currentYear,
  currentMonth,
  currentRenderDates,
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

const headerLabel = computed(() => `${currentYear.value}年${currentMonth.value + 1}月`)
const weekdays = createWeekdays(weekStart.value)

const markerDateList = computed(() =>
  markerDates.value.map(item => ({
    date: new Date(typeof item === 'object' && item.date ? item.date : item),
    color: typeof item === 'object' && item.color ? item.color : 'var(--calendar-theme-color)'
  }))
)

const allEvents = computed(() => {
  const events = []
  eventSubscriptions.value.forEach(sub => {
    if (sub.events && Array.isArray(sub.events)) {
      sub.events.forEach(event => {
        events.push({
          ...event,
          subscriptionId: sub.id,
          subscriptionName: sub.name,
          color: sub.color
        })
      })
    }
  })
  return events
})

const eventsByDate = computed(() => {
  const map = new Map()
  allEvents.value.forEach(event => {
    const dateKeys = event.dateKeys || []
    dateKeys.forEach(dateKey => {
      if (!map.has(dateKey)) {
        map.set(dateKey, [])
      }
      const existingEvents = map.get(dateKey)
      const exists = existingEvents.some(e => e.uid === event.uid && e.subscriptionId === event.subscriptionId)
      if (!exists) {
        const isStart = event.startDateKey === dateKey
        const isEnd = event.endDateKey === dateKey
        existingEvents.push({
          ...event,
          isStart,
          isEnd,
          isContinuation: !isStart && !isEnd
        })
      }
    })
  })
  return map
})

const hoveredDayEvents = ref([])
const hoveredDateKey = ref(null)
const showPopup = ref(false)
const popupStyle = ref({})
const popupDateLabel = ref('')

function formatDateKey(date) {
  if (!date) return ''
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function _getEventsForDate(date) {
  const dateKey = formatDateKey(date)
  const events = eventsByDate.value.get(dateKey) || []
  return [...events].sort((a, b) => {
    if (a.isAllDay && !b.isAllDay) return -1
    if (!a.isAllDay && b.isAllDay) return 1
    return a.startDate - b.startDate
  })
}

function _getEventColorBars(date) {
  const events = _getEventsForDate(date)
  const colorBars = []
  
  events.forEach(event => {
    colorBars.push({
      color: event.color,
      subscriptionId: event.subscriptionId,
      subscriptionName: event.subscriptionName,
      isContinuation: event.isContinuation,
      isStart: event.isStart,
      isEnd: event.isEnd,
      isMultiDay: event.isMultiDay,
      eventTitle: event.title,
      event: event
    })
  })

  return colorBars.sort((a, b) => {
    if (a.isMultiDay && !b.isMultiDay) return -1
    if (!a.isMultiDay && b.isMultiDay) return 1
    return a.subscriptionId - b.subscriptionId
  })
}

function handleDayHover(dateObj, event) {
  if (!props.showEventPopup) return
  
  const dateKey = formatDateKey(dateObj.date)
  const events = _getEventsForDate(dateObj.date)
  
  if (events.length > 0) {
    hoveredDayEvents.value = events
    hoveredDateKey.value = dateKey
    
    const dayElement = event.currentTarget
    const rect = dayElement.getBoundingClientRect()
    const calendarRect = swipeRef.value?.getBoundingClientRect()
    
    if (calendarRect) {
      popupStyle.value = {
        top: `${rect.bottom - calendarRect.top + 8}px`,
        left: `${rect.left - calendarRect.left}px`
      }
    }
    
    popupDateLabel.value = `${dateObj.fullDate.year}年${dateObj.fullDate.month}月${dateObj.fullDate.date}日`
    
    nextTick(() => {
      showPopup.value = true
    })
    
    emit('event-hover', dateObj.date, events)
  }
}

function handleDayLeave() {
  showPopup.value = false
  hoveredDayEvents.value = []
  hoveredDateKey.value = null
}

const { lengthX } = useSwipe(swipeRef, {
  threshold: 0,
  onSwipe: () => {
    if (isInTransition.value) return
    transformDistance.value = -lengthX.value + 'px'
  },
  onSwipeEnd: (_, direction) => {
    if (isInTransition.value) return
    if (direction === 'left') {
      changePageTo('next-page')
    } else if (direction === 'right') {
      changePageTo('prev-page')
    } else {
      startTransitionAnimation(direction)
    }
  }
})

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

function changePageTo(param) {
  const targetDate = _normalize(param)
  switchPageToTargetDate(targetDate)
}

function changeSelectedDate(date) {
  changePageTo(date)
  if (!isSameDay(new Date(date), selected.value)) {
    selected.value = new Date(date)
    emit('select-change', selected.value)
  }
}

function _getMarkerColor(date) {
  return markerDateList.value.find(d => isSameDay(d.date, date))?.color
}

defineExpose({
  toggleViewMode,
  changePageTo,
  changeSelectedDate,
  _getEventsForDate,
  _getEventColorBars
})
</script>

<style scoped>
.ohhh-calendar-day--event-bars {
  position: absolute;
  bottom: 4px;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0 2px;
  pointer-events: none;
}

.ohhh-calendar-day--event-bar {
  height: 14px;
  min-height: 14px;
  border-radius: 3px;
  opacity: 0.9;
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
}

.ohhh-calendar-day--event-bar.is-multi-day {
  position: relative;
}

.ohhh-calendar-day--event-bar.is-continuation {
  border-radius: 0;
}

.ohhh-calendar-day--event-bar.is-start {
  border-top-left-radius: 2px;
  border-bottom-left-radius: 2px;
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.ohhh-calendar-day--event-bar.is-end {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  border-top-right-radius: 2px;
  border-bottom-right-radius: 2px;
}

.ohhh-calendar-day--event-bar.is-start.is-end {
  border-radius: 2px;
}

.ohhh-calendar-day--event-bar-title {
  position: absolute;
  left: 4px;
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 8px;
  font-weight: 500;
  color: white;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  line-height: 1;
  pointer-events: none;
}

.ohhh-calendar-popup {
  position: absolute;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 12px;
  box-shadow: 
    0 4px 24px rgba(0, 0, 0, 0.12),
    0 0 0 1px rgba(0, 0, 0, 0.06);
  min-width: 240px;
  max-width: 320px;
  overflow: hidden;
}

.ohhh-calendar-popup--header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(250, 250, 252, 0.95) 100%);
}

.ohhh-calendar-popup--date {
  font-size: 14px;
  font-weight: 600;
  color: var(--calendar-text-color-level-1, #303133);
}

.ohhh-calendar-popup--count {
  font-size: 12px;
  color: var(--calendar-text-color-level-3, #909399);
}

.ohhh-calendar-popup--events {
  padding: 8px;
  max-height: 280px;
  overflow-y: auto;
}

.ohhh-calendar-popup--event {
  display: flex;
  gap: 10px;
  padding: 10px;
  border-radius: 8px;
  transition: background-color 0.15s ease;
}

.ohhh-calendar-popup--event:hover {
  background: rgba(0, 0, 0, 0.03);
}

.ohhh-calendar-popup--event:not(:last-child) {
  margin-bottom: 4px;
}

.ohhh-calendar-popup--event-color {
  width: 4px;
  min-width: 4px;
  border-radius: 2px;
  margin-top: 2px;
  margin-bottom: 2px;
}

.ohhh-calendar-popup--event-content {
  flex: 1;
  min-width: 0;
}

.ohhh-calendar-popup--event-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--calendar-text-color-level-1, #303133);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}

.ohhh-calendar-popup--event-time {
  font-size: 12px;
  color: var(--calendar-text-color-level-2, #606266);
  margin-bottom: 3px;
}

.ohhh-calendar-popup--event-source {
  font-size: 11px;
  color: var(--calendar-text-color-level-4, #a8abb2);
  display: flex;
  align-items: center;
}

.ohhh-calendar-popup--event-source-label {
  opacity: 0.8;
}

.ohhh-calendar-popup--event-source-name {
  font-weight: 500;
  color: var(--calendar-text-color-level-3, #909399);
}

.ohhh-calendar-popup-enter-active,
.ohhh-calendar-popup-leave-active {
  transition: all 0.2s ease-out;
}

.ohhh-calendar-popup-enter-from,
.ohhh-calendar-popup-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
