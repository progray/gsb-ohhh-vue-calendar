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
    <div ref="swp" class="ohhh-calendar-wrapper">
      <div
        v-for="(dates, pageIndex) in allRenderDates"
        :key="pageIndex"
        :style="{ left: 100 * (pageIndex - 1) + '%' }"
        class="ohhh-calendar-days"
        @transitionend="onTransitionEnd"
      >
        <!-- 按周分组 -->
        <template v-for="(week, weekIndex) in getWeeks(dates)" :key="weekIndex">
          <div class="ohhh-calendar-week">
            <!-- 日期格子 -->
            <div
              v-for="dateObj in week"
              :key="dateObj.key"
              class="ohhh-calendar-day"
              :class="{
                'is-selected': isSameDay(dateObj.date, selected),
                'is-today': isSameDay(dateObj.date, new Date()),
                'other-month': !dateObj.current,
                'is-drag-over': dragOverDate && isSameDay(dateObj.date, dragOverDate)
              }"
              @click="handleDayClick(dateObj.date)"
              @dragover.prevent="handleDragOver($event, dateObj.date)"
              @dragleave="handleDragLeave"
              @drop.prevent="handleDrop($event, dateObj.date)"
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
          
          <!-- 周事件层 - 用于跨天事件 -->
          <div class="ohhh-calendar-week-events" v-if="showEvents">
            <template v-for="(eventRow, rowIndex) in getWeekEventRows(week)" :key="weekIndex + '-' + rowIndex">
              <div 
                v-for="event in eventRow" 
                :key="event.id"
                class="ohhh-calendar-week-event"
                :style="getEventStyle(event, week)"
              >
                <EventItem
                  :event="event"
                  :date="week[getEventStartIndex(event, week)].date"
                  :show-time="showEventTime"
                  :is-start="getEventStartIndex(event, week) === 0 || isSameDay(new Date(event.startDate), new Date(week[getEventStartIndex(event, week)].date))"
                  :is-end="getEventEndIndex(event, week) === 6 || isSameDay(new Date(event.endDate), new Date(week[getEventEndIndex(event, week)].date))"
                  :is-multi-day="getEventSpanInWeek(event, week) > 1"
                  @click="handleEventClick(event)"
                  @eventDragStart="handleEventDragStart"
                  @eventDragEnd="handleEventDragEnd"
                />
              </div>
            </template>
          </div>
        </template>
      </div>
    </div>

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

    <!-- 事件编辑弹窗 -->
    <EventEditor
      :visible="editorVisible"
      :event="editingEvent"
      :selected-date="selectedDateForEditor || undefined"
      :events="eventManager.events"
      :enable-conflict-check="enableConflictCheck"
      @close="closeEditor"
      @save="handleEventSave"
      @delete="handleEventDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, useTemplateRef, toRefs, toRef } from 'vue'
import { useSwipe } from '@vueuse/core'
import { useCalendar } from './hooks/useCalendar.js'
import { useCalendarEvents } from './hooks/useCalendarEvents'
import { isSameDay, createWeekdays } from './utils'
import { icons } from './utils/icons.js'
import EventItem from './components/EventItem.vue'
import EventEditor from './components/EventEditor.vue'
import type { CalendarEvent } from './types'
import { getEventsForDate, sortEvents } from './utils/eventUtils'

const swipeRef = useTemplateRef('swp')

const emit = defineEmits([
  'select-change', 
  'view-change',
  'event-add',
  'event-update',
  'event-delete',
  'event-click'
])

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
    type: Array as () => (Date | { date: Date; color: string })[],
    default: () => []
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
  },
  // 事件数据
  events: {
    type: Array as () => CalendarEvent[],
    default: () => []
  },
  // 是否显示事件
  showEvents: {
    type: Boolean,
    default: true
  },
  // 是否显示事件时间
  showEventTime: {
    type: Boolean,
    default: true
  },
  // 每个日期格子最多显示的事件数量
  maxVisibleEvents: {
    type: Number,
    default: 3
  },
  // 是否启用冲突检测
  enableConflictCheck: {
    type: Boolean,
    default: true
  },
  // 是否允许拖拽事件
  draggable: {
    type: Boolean,
    default: true
  },
  // 点击日期是否添加新事件
  clickToAddEvent: {
    type: Boolean,
    default: true
  }
})

const { 
  initialSelectedDate, 
  initialViewMode, 
  weekStart, 
  markerDates, 
  duration,
  events: propsEvents
} = toRefs(props)

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

const eventManager = useCalendarEvents(
  { events: propsEvents, enableConflictCheck: toRef(props, 'enableConflictCheck') },
  ((eventName: string, payload: any) => {
    emit(eventName as any, payload)
  }) as any
)

// 顶部工具栏标题
const headerLabel = computed(() => `${currentYear.value}年${currentMonth.value + 1}月`)
// 星期栏
const weekdays = createWeekdays(weekStart.value)
// 标记日期
const markerDateList = computed(() =>
  markerDates.value.map(item => ({
    date: new Date(
      typeof item === 'object' && 'date' in item ? (item as { date: Date }).date : (item as Date)
    ),
    color: typeof item === 'object' && 'color' in item ? (item as { color: string }).color : 'var(--calendar-theme-color)'
  }))
)

// 事件编辑相关
const editorVisible = ref(false)
const editingEvent = ref<CalendarEvent | null>(null)
const selectedDateForEditor = ref<Date | null>(null)

// 拖拽相关
const dragOverDate = ref<Date | null>(null)
const draggingEvent = ref<CalendarEvent | null>(null)

// 监听滑动事件
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

function _normalize(param: string | Date) {
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

function changePageTo(param: string | Date) {
  const targetDate = _normalize(param)
  switchPageToTargetDate(targetDate)
}

function changeSelectedDate(date: Date | string) {
  changePageTo(date)
  if (!isSameDay(new Date(date), selected.value)) {
    selected.value = new Date(date)
    emit('select-change', selected.value)
  }
}

function _getMarkerColor(date: Date) {
  return markerDateList.value.find(d => isSameDay(d.date, date))?.color
}

// 按周分组日期
function getWeeks(dates: any[]) {
  const weeks: any[][] = []
  for (let i = 0; i < dates.length; i += 7) {
    weeks.push(dates.slice(i, i + 7))
  }
  return weeks
}

// 获取一周内的所有事件
function getWeekEvents(week: any[]) {
  const events: CalendarEvent[] = []
  const eventIds = new Set<string>()
  
  week.forEach(dateObj => {
    const dayEvents = getEventsForDate(eventManager.events.value, dateObj.date)
    dayEvents.forEach(event => {
      if (!eventIds.has(event.id)) {
        eventIds.add(event.id)
        events.push(event)
      }
    })
  })
  
  return sortEvents(events)
}



// 获取事件在本周的开始索引
function getEventStartIndex(event: CalendarEvent, week: any[]) {
  const eventStart = new Date(event.startDate)
  eventStart.setHours(0, 0, 0, 0)
  
  const weekStartDate = new Date(week[0].date)
  weekStartDate.setHours(0, 0, 0, 0)
  const weekEndDate = new Date(week[6].date)
  weekEndDate.setHours(0, 0, 0, 0)
  
  if (eventStart < weekStartDate) {
    return 0
  }
  
  if (eventStart > weekEndDate) {
    return 6
  }
  
  for (let i = 0; i < week.length; i++) {
    const weekDate = new Date(week[i].date)
    weekDate.setHours(0, 0, 0, 0)
    if (isSameDay(eventStart, weekDate)) {
      return i
    }
  }
  
  return 0
}

// 获取事件在本周的结束索引
function getEventEndIndex(event: CalendarEvent, week: any[]) {
  const eventEnd = new Date(event.endDate)
  eventEnd.setHours(0, 0, 0, 0)
  
  const weekStartDate = new Date(week[0].date)
  weekStartDate.setHours(0, 0, 0, 0)
  const weekEndDate = new Date(week[6].date)
  weekEndDate.setHours(0, 0, 0, 0)
  
  if (eventEnd < weekStartDate) {
    return 0
  }
  
  if (eventEnd > weekEndDate) {
    return 6
  }
  
  for (let i = week.length - 1; i >= 0; i--) {
    const weekDate = new Date(week[i].date)
    weekDate.setHours(0, 0, 0, 0)
    if (isSameDay(eventEnd, weekDate)) {
      return i
    }
  }
  
  return 6
}

// 计算事件跨度
function getEventSpanInWeek(event: CalendarEvent, week: any[]) {
  const startIndex = getEventStartIndex(event, week)
  const endIndex = getEventEndIndex(event, week)
  return endIndex - startIndex + 1
}

// 将事件分配到不同的行以避免重叠
function getWeekEventRows(week: any[]) {
  const weekEvents = getWeekEvents(week)
  const rows: CalendarEvent[][] = []
  const maxRows = 3 // 限制最大显示3行
  
  weekEvents.forEach(event => {
    const startIndex = getEventStartIndex(event, week)
    const endIndex = getEventEndIndex(event, week)
    
    let placed = false
    for (let rowIndex = 0; rowIndex < rows.length && rowIndex < maxRows; rowIndex++) {
      const row = rows[rowIndex]
      const canPlace = row.every(existingEvent => {
        const existingStart = getEventStartIndex(existingEvent, week)
        const existingEnd = getEventEndIndex(existingEvent, week)
        return !(startIndex <= existingEnd && endIndex >= existingStart)
      })
      
      if (canPlace) {
        row.push(event)
        placed = true
        break
      }
    }
    
    if (!placed && rows.length < maxRows) {
      rows.push([event])
    }
  })
  
  return rows
}

// 获取事件样式
function getEventStyle(event: CalendarEvent, week: any[]) {
  const startIndex = getEventStartIndex(event, week)
  const span = getEventSpanInWeek(event, week)
  const rowIndex = getWeekEventRows(week).findIndex(row => row.some(e => e.id === event.id))
  
  return {
    left: `calc(${startIndex * 100 / 7}% + 2px)`,
    width: `calc(${span * 100 / 7}% - 4px)`,
    top: `${rowIndex * 22}px`,
    '--event-color': event.color || '#409eff'
  }
}

function handleDayClick(date: Date) {
  changeSelectedDate(date)
  if (props.clickToAddEvent) {
    openEditorForDate(date)
  }
}

function handleEventClick(event: CalendarEvent) {
  emit('event-click', event)
  openEditorForEvent(event)
}

function openEditorForDate(date: Date) {
  editingEvent.value = null
  selectedDateForEditor.value = new Date(date)
  editorVisible.value = true
}

function openEditorForEvent(event: CalendarEvent) {
  editingEvent.value = { ...event }
  selectedDateForEditor.value = null
  editorVisible.value = true
}

function closeEditor() {
  editorVisible.value = false
  editingEvent.value = null
  selectedDateForEditor.value = null
}

function handleEventSave(event: CalendarEvent) {
  if (editingEvent.value?.id) {
    eventManager.updateEvent(event)
  } else {
    eventManager.addEvent(event)
  }
  closeEditor()
}

function handleEventDelete(eventId: string) {
  eventManager.deleteEvent(eventId)
  closeEditor()
}

// 拖拽相关方法
function handleEventDragStart(event: CalendarEvent, dragEvent: DragEvent) {
  if (!props.draggable) {
    dragEvent.preventDefault()
    return
  }
  draggingEvent.value = event
  dragEvent.dataTransfer?.setData('text/plain', event.id)
  dragEvent.dataTransfer!.effectAllowed = 'move'
  dragEvent.dataTransfer!.dropEffect = 'move'
}

function handleEventDragEnd(_event: CalendarEvent) {
  draggingEvent.value = null
  dragOverDate.value = null
}

function handleDragOver(e: DragEvent, date: Date) {
  if (!props.draggable || !draggingEvent.value) return
  e.preventDefault()
  dragOverDate.value = date
}

function handleDragLeave() {
  dragOverDate.value = null
}

function handleDrop(e: DragEvent, date: Date) {
  if (!props.draggable || !draggingEvent.value) return
  
  const eventId = e.dataTransfer?.getData('text/plain')
  if (eventId && eventId === draggingEvent.value.id) {
    eventManager.moveEvent(eventId, date)
  }
  
  dragOverDate.value = null
  draggingEvent.value = null
}

defineExpose({
  toggleViewMode,
  changePageTo,
  changeSelectedDate,
  openEditorForDate,
  openEditorForEvent,
  closeEditor
})
</script>

<style scoped>
@import './style/index.scss';

.ohhh-calendar-day {
  position: relative;
  justify-content: flex-start;
  padding: 4px;
  box-sizing: border-box;
}

.ohhh-calendar-day--inner {
  flex: none;
}

.ohhh-calendar-day--events {
  position: relative;
  width: 100%;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  margin-top: 2px;
}

.ohhh-calendar-day--event-wrapper {
  position: absolute;
  left: 0;
  right: 0;
  height: 20px;
}

.ohhh-calendar-day--more {
  position: absolute;
  bottom: 2px;
  left: 4px;
  right: 4px;
  font-size: 10px;
  color: var(--calendar-text-color-level-3);
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 2px;
  background: rgba(0, 0, 0, 0.05);
  text-align: center;
}

.ohhh-calendar-day--more:hover {
  background: rgba(0, 0, 0, 0.1);
}

.ohhh-calendar-day.is-drag-over {
  background: rgba(64, 158, 255, 0.1) !important;
}

.ohhh-calendar-day.is-drag-over::after {
  content: '';
  position: absolute;
  inset: 2px;
  border: 2px dashed #409eff;
  border-radius: 4px;
  pointer-events: none;
}
</style>
