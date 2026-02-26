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
            'is-drag-over': dragOverDate && isSameDay(dateObj.date, dragOverDate)
          }"
          @click="changeSelectedDate(dateObj.date)"
          @dragover.prevent="onDragOver($event, dateObj.date)"
          @dragleave="onDragLeave"
          @drop.prevent="onDrop($event, dateObj.date)"
        >
          <div class="ohhh-calendar-day--header">
            <div class="ohhh-calendar-day--inner">
              <div class="ohhh-calendar-day--inner-value">{{ dateObj.fullDate.date }}</div>
              <div class="ohhh-calendar-day--inner-label" v-if="$slots['day-label']">
                <slot name="day-label" :date="dateObj.date" />
              </div>
            </div>
          </div>
          <div class="ohhh-calendar-day--events" v-if="showEvents">
            <EventItem
              v-for="event in getVisibleEvents(dateObj.date)"
              :key="event.id"
              :event="event"
              :has-conflict="hasConflict(event)"
              @event-click="onEventClick"
              @event-drag-start="onEventDragStart"
              @event-drag-end="onEventDragEnd"
            />
            <div
              v-if="getHiddenEventsCount(dateObj.date) > 0"
              class="ohhh-calendar-event--more"
              @click.stop="showAllEvents(dateObj.date)"
            >
              +{{ getHiddenEventsCount(dateObj.date) }} 更多
            </div>
          </div>
          <div class="ohhh-calendar-day--marker" :style="{ background: _getMarkerColor(dateObj.date) }" />
        </div>
      </div>
    </div>

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
import { computed, useTemplateRef, toRefs, ref } from 'vue'
import { useSwipe } from '@vueuse/core'
import { useCalendar } from './hooks/useCalendar.js'
import { useEvents } from './hooks/useEvents.js'
import { isSameDay, createWeekdays } from './utils'
import { icons } from './utils/icons.js'
import { findConflicts } from './utils/eventUtils.js'
import EventItem from './components/EventItem.vue'

const swipeRef = useTemplateRef('swp')

const emit = defineEmits(['select-change', 'view-change', 'event-add', 'event-update', 'event-delete', 'event-click'])

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
  showEvents: {
    type: Boolean,
    default: true
  },
  maxVisibleEvents: {
    type: Number,
    default: 3
  }
})

const { initialSelectedDate, initialViewMode, weekStart, markerDates, duration, events, showEvents, maxVisibleEvents } = toRefs(props)

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
  events: normalizedEvents,
  getEventsByDate,
  addEvent,
  updateEvent,
  deleteEvent,
  getEventById,
  moveEvent,
  checkConflicts
} = useEvents({ events }, emit)

const headerLabel = computed(() => `${currentYear.value}年${currentMonth.value + 1}月`)
const weekdays = createWeekdays(weekStart.value)
const markerDateList = computed(() =>
  markerDates.value.map(item => ({
    date: new Date(typeof item === 'object' && item.date ? item.date : item),
    color: typeof item === 'object' && item.color ? item.color : 'var(--calendar-theme-color)'
  }))
)

const dragOverDate = ref(null)
const draggingEvent = ref(null)
const dragStartDate = ref(null)

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

function getVisibleEvents(date) {
  const dayEvents = getEventsByDate(date)
  return dayEvents.slice(0, maxVisibleEvents.value)
}

function getHiddenEventsCount(date) {
  const dayEvents = getEventsByDate(date)
  return Math.max(0, dayEvents.length - maxVisibleEvents.value)
}

function hasConflict(event) {
  const conflicts = findConflicts(event, normalizedEvents.value)
  return conflicts.length > 0
}

function showAllEvents(date) {
  emit('event-click', { type: 'show-all', date, events: getEventsByDate(date) })
}

function onEventClick({ event }) {
  emit('event-click', { type: 'click', event })
}

function onDragOver(e, date) {
  if (!draggingEvent.value) return
  e.dataTransfer.dropEffect = 'move'
  dragOverDate.value = date
}

function onDragLeave() {
  dragOverDate.value = null
}

function onDrop(e, targetDate) {
  dragOverDate.value = null
  if (!draggingEvent.value) return

  const originalDate = dragStartDate.value
  const newDate = new Date(targetDate)
  
  if (originalDate && !isSameDay(originalDate, newDate)) {
    moveEvent(draggingEvent.value.id, newDate)
  }
  
  draggingEvent.value = null
  dragStartDate.value = null
}

function onEventDragStart({ event }) {
  draggingEvent.value = event
  dragStartDate.value = event.date instanceof Date ? event.date : new Date(event.date)
}

function onEventDragEnd() {
  draggingEvent.value = null
  dragOverDate.value = null
  dragStartDate.value = null
}

defineExpose({
  toggleViewMode,
  changePageTo,
  changeSelectedDate,
  addEvent,
  updateEvent,
  deleteEvent,
  getEventById,
  getEventsByDate,
  moveEvent,
  checkConflicts
})
</script>
