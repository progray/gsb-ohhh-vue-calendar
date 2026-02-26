<template>
  <div
    class="ohhh-calendar-container"
    :style="{
      '--calendar-rows': renderRows,
      '--calendar-transition-duration': duration,
      '--translate-distance': transformDistance,
      '--transition-duration': transitionDuration,
      '--calendar-event-max-show': maxVisibleEvents
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
            'is-drag-over': dragOverDate && isSameDay(dateObj.date, dragOverDate)
          }"
          :data-date="dateObj.key"
          @click="handleDayClick(dateObj.date)"
          @dblclick="handleDayDoubleClick(dateObj.date)"
          @dragover.prevent="onDragOver($event, dateObj.date)"
          @dragleave="onDragLeave"
          @drop="onDrop($event, dateObj.date)"
        >
          <div class="ohhh-calendar-day--inner">
            <div class="ohhh-calendar-day--inner-value">{{ dateObj.fullDate.date }}</div>
            <div class="ohhh-calendar-day--inner-label" v-if="$slots['day-label']">
              <slot name="day-label" :date="dateObj.date" />
            </div>
          </div>
          <div class="ohhh-calendar-day--marker" :style="{ background: _getMarkerColor(dateObj.date) }" />
          <div class="ohhh-calendar-day--events">
            <component
              v-for="(evt, evtIndex) in getEventsForDate(dateObj.date).slice(0, maxVisibleEvents)"
              :key="evt.id || evtIndex"
              :is="'CalendarEvent'"
              :event="evt"
              :draggable="enableDragDrop"
              @click="handleEventClick(evt, $event)"
              @drag-start="onEventDragStart"
              @drag-end="onEventDragEnd"
            />
            <div
              v-if="getEventsForDate(dateObj.date).length > maxVisibleEvents"
              class="ohhh-calendar-day--events-more"
              @click.stop="showMoreEvents(dateObj.date)"
            >
              +{{ getEventsForDate(dateObj.date).length - maxVisibleEvents }} 更多
            </div>
          </div>
        </div>
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
    <EventDialog
      v-if="enableEventDialog"
      :visible="showEventDialog"
      :event="editingEvent"
      :initial-date="dialogInitialDate"
      :conflicts="currentConflicts"
      @close="closeEventDialog"
      @confirm="handleEventConfirm"
      @delete="handleEventDelete"
    />

    <!-- 更多事件弹窗 -->
    <Teleport to="body">
      <div v-if="showMoreDialog" class="ohhh-events-more-dialog-overlay" @click.self="closeMoreDialog">
        <div class="ohhh-events-more-dialog">
          <div class="ohhh-events-more-dialog--header">
            <span>{{ formatMoreDialogDate }}</span>
            <button class="ohhh-events-more-dialog--close" @click="closeMoreDialog">&times;</button>
          </div>
          <div class="ohhh-events-more-dialog--body">
            <div
              v-for="evt in moreEvents"
              :key="evt.id"
              class="ohhh-events-more-dialog--item"
              :style="{ '--event-color': evt.color || '#3B82F6' }"
              @click="handleEventClick(evt)"
            >
              <span class="item-dot"></span>
              <span class="item-time">{{ formatEventTime(evt) }}</span>
              <span class="item-title">{{ evt.title || '无标题' }}</span>
            </div>
          </div>
          <div class="ohhh-events-more-dialog--footer">
            <button class="btn btn-add" @click="addEventFromMoreDialog">添加事件</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, useTemplateRef, toRefs, markRaw } from 'vue'
import { useSwipe } from '@vueuse/core'
import { useCalendar } from './hooks/useCalendar.js'
import { useEvents } from './hooks/useEvents.js'
import { isSameDay, createWeekdays } from './utils'
import { icons } from './utils/icons.js'
import CalendarEvent from './CalendarEvent.vue'
import EventDialog from './EventDialog.vue'

markRaw(CalendarEvent)

const swipeRef = useTemplateRef('swp')

const emit = defineEmits(['select-change', 'view-change', 'event-add', 'event-update', 'event-delete'])

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
  events: {
    type: Array,
    default: () => []
  },
  enableDragDrop: {
    type: Boolean,
    default: true
  },
  enableConflictDetection: {
    type: Boolean,
    default: true
  },
  enableEventDialog: {
    type: Boolean,
    default: true
  },
  maxVisibleEvents: {
    type: Number,
    default: 3
  }
})

const { initialSelectedDate, initialViewMode, weekStart, markerDates, duration } = toRefs(props)

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

const {
  getEventsForDate,
  addEvent,
  updateEvent,
  deleteEvent,
  moveEvent,
  detectConflicts,
  findEventById,
  searchEvents,
  getAllEvents
} = useEvents(props, emit)

const showEventDialog = ref(false)
const editingEvent = ref(null)
const dialogInitialDate = ref(null)
const dragOverDate = ref(null)
const draggingEventId = ref(null)
const currentConflicts = ref([])
const showMoreDialog = ref(false)
const moreEventsDate = ref(null)

const headerLabel = computed(() => `${currentYear.value}年${currentMonth.value + 1}月`)
const weekdays = createWeekdays(weekStart.value)
const markerDateList = computed(() =>
  markerDates.value.map(item => ({
    date: new Date(typeof item === 'object' && item.date ? item.date : item),
    color: typeof item === 'object' && item.color ? item.color : 'var(--calendar-theme-color)'
  }))
)

const moreEvents = computed(() => {
  if (!moreEventsDate.value) return []
  return getEventsForDate(moreEventsDate.value)
})

const formatMoreDialogDate = computed(() => {
  if (!moreEventsDate.value) return ''
  const d = new Date(moreEventsDate.value)
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
})

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

function handleDayClick(date) {
  changeSelectedDate(date)
}

function handleDayDoubleClick(date) {
  if (!props.enableEventDialog) return
  openEventDialog(null, date)
}

function handleEventClick(evt, e) {
  if (e) e.stopPropagation()
  openEventDialog(evt)
}

function openEventDialog(event, initialDate) {
  editingEvent.value = event
  dialogInitialDate.value = initialDate || (event ? new Date(event.start) : new Date())
  currentConflicts.value = event && props.enableConflictDetection ? detectConflicts(event) : []
  showEventDialog.value = true
}

function closeEventDialog() {
  showEventDialog.value = false
  editingEvent.value = null
  dialogInitialDate.value = null
  currentConflicts.value = []
}

function handleEventConfirm(eventData) {
  if (!eventData.id) {
    addEvent(eventData)
  } else {
    updateEvent(eventData)
  }
  closeEventDialog()
}

function handleEventDelete(eventId) {
  deleteEvent(eventId)
  closeEventDialog()
}

function onEventDragStart(event) {
  if (!props.enableDragDrop) return
  draggingEventId.value = event.id
}

function onEventDragEnd() {
  draggingEventId.value = null
  dragOverDate.value = null
}

function onDragOver(e, date) {
  if (!props.enableDragDrop || !draggingEventId.value) return
  e.preventDefault()
  dragOverDate.value = date
}

function onDragLeave() {
  dragOverDate.value = null
}

function onDrop(e, date) {
  if (!props.enableDragDrop || !draggingEventId.value) return
  e.preventDefault()
  const existingEvent = findEventById(draggingEventId.value)
  if (existingEvent) {
    moveEvent(draggingEventId.value, date)
  }
  draggingEventId.value = null
  dragOverDate.value = null
}

function showMoreEvents(date) {
  moreEventsDate.value = date
  showMoreDialog.value = true
}

function closeMoreDialog() {
  showMoreDialog.value = false
  moreEventsDate.value = null
}

function addEventFromMoreDialog() {
  closeMoreDialog()
  openEventDialog(null, moreEventsDate.value)
}

function formatEventTime(evt) {
  if (!evt.start) return ''
  const d = new Date(evt.start)
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

defineExpose({
  toggleViewMode,
  changePageTo,
  changeSelectedDate,
  openEventDialog,
  getEventsForDate,
  searchEvents,
  getAllEvents
})
</script>
