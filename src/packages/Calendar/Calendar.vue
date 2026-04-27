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
          @click="onDayClick(dateObj, $event)"
        >
          <div class="ohhh-calendar-day--inner">
            <div class="ohhh-calendar-day--inner-value">{{ dateObj.fullDate.date }}</div>
            <div class="ohhh-calendar-day--inner-label" v-if="$slots['day-label']">
              <slot name="day-label" :date="dateObj.date" />
            </div>
          </div>
          <div class="ohhh-calendar-day--marker" :style="{ background: _getMarkerColor(dateObj.date) }" />

          <!-- 弹珠 -->
          <div
            v-for="marble in getMarblesByDate(dateObj.date)"
            :key="marble.id"
            class="ohhh-calendar-marble"
            :class="{
              'is-dragging': activeMarbleId === marble.id,
              'is-removing': marble.isRemoving,
              'is-connection-start': connectionStart === marble.id
            }"
            :style="{
              '--marble-color': marble.color,
              '--marble-x': marble.x,
              '--marble-y': marble.y
            }"
            @mousedown="onMarbleMouseDown(marble, $event)"
            @touchstart="onMarbleTouchStart(marble, $event)"
          />
        </div>
      </div>

      <!-- SVG 连线层 -->
      <svg
        ref="svgRef"
        class="ohhh-calendar-connections"
        @mousemove="onSvgMouseMove"
        @touchmove="onSvgTouchMove"
      >
        <defs>
          <linearGradient id="defaultLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:rgba(100, 100, 100, 0.3)" />
            <stop offset="100%" style="stop-color:rgba(100, 100, 100, 0.3)" />
          </linearGradient>
          
          <linearGradient
            v-for="conn in connections"
            :key="'grad-' + conn.id"
            :id="'conn-gradient-' + conn.id"
            x1="0%" y1="0%" x2="100%" y2="0%"
          >
            <stop offset="0%" :style="{ stopColor: conn.fromColor, stopOpacity: 0.8 }" />
            <stop offset="100%" :style="{ stopColor: conn.toColor, stopOpacity: 0.8 }" />
          </linearGradient>
        </defs>

        <!-- 连线 -->
        <g class="ohhh-calendar-connections--lines">
          <line
            v-for="conn in connections"
            :key="conn.id"
            class="ohhh-calendar-connection-line"
            :class="{ 'ohhh-calendar-connection-line--gradient': conn.fromColor && conn.toColor }"
            :x1="getMarbleCenterX(conn.fromId)"
            :y1="getMarbleCenterY(conn.fromId)"
            :x2="getMarbleCenterX(conn.toId)"
            :y2="getMarbleCenterY(conn.toId)"
            :stroke="conn.fromColor && conn.toColor ? 'url(#conn-gradient-' + conn.id + ')' : 'rgba(100, 100, 100, 0.3)'"
          />
        </g>

        <!-- 正在拖拽的临时连线 -->
        <line
          v-if="connectionStart && isConnecting"
          class="ohhh-calendar-connection-line ohhh-calendar-connection-line--temp"
          :x1="getMarbleCenterX(connectionStart)"
          :y1="getMarbleCenterY(connectionStart)"
          :x2="tempConnectionEnd.x"
          :y2="tempConnectionEnd.y"
        />
      </svg>
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
  </div>
</template>

<script setup>
import { computed, useTemplateRef, toRefs, ref, nextTick, watch } from 'vue'
import { useSwipe } from '@vueuse/core'
import { useCalendar } from './hooks/useCalendar.js'
import { useMarble } from './hooks/useMarble.js'
import { isSameDay, createWeekdays } from './utils'
import { icons } from './utils/icons.js'

const swipeRef = useTemplateRef('swp')
const svgRef = useTemplateRef('svgRef')

const emit = defineEmits(['select-change', 'view-change', 'marble-create', 'marble-remove', 'marble-move', 'connection-create', 'connection-remove'])

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
  marbles,
  connections,
  activeMarbleId,
  connectionStart,
  createMarble,
  removeMarble,
  updateMarblePosition,
  updateMarbleDate,
  startConnection,
  cancelConnection,
  createConnection,
  createConnectionBetween,
  getMarblesByDate,
  getMarbleById
} = useMarble()

const headerLabel = computed(() => `${currentYear.value}年${currentMonth.value + 1}月`)
const weekdays = createWeekdays(weekStart.value)
const markerDateList = computed(() =>
  markerDates.value.map(item => ({
    date: new Date(typeof item === 'object' && item.date ? item.date : item),
    color: typeof item === 'object' && item.color ? item.color : 'var(--calendar-theme-color)'
  }))
)

const isDragMoving = ref(false)
const isConnecting = ref(false)
const dragStartPoint = ref({ x: 0, y: 0 })
const tempConnectionEnd = ref({ x: 0, y: 0 })
const isLongPress = ref(false)
let longPressTimer = null

const marbleCenters = ref(new Map())

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

function onDayClick(dateObj, event) {
  if (activeMarbleId.value || isDragMoving.value) return
  
  const existingMarble = marbles.value.find(m => isSameDay(m.date, dateObj.date))
  
  if (!existingMarble) {
    const x = 0.75
    const y = 0.45
    const marble = createMarble(dateObj.date, x, y)
    emit('marble-create', marble)
  }
}

function onMarbleMouseDown(marble, event) {
  event.stopPropagation()
  event.preventDefault()
  startMarbleInteraction(marble, event.clientX, event.clientY)
  
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

function onMarbleTouchStart(marble, event) {
  event.stopPropagation()
  event.preventDefault()
  const touch = event.touches[0]
  startMarbleInteraction(marble, touch.clientX, touch.clientY)
  
  document.addEventListener('touchmove', handleTouchMove, { passive: false })
  document.addEventListener('touchend', handleTouchEnd)
  document.addEventListener('touchcancel', handleTouchEnd)
}

function startMarbleInteraction(marble, clientX, clientY) {
  activeMarbleId.value = marble.id
  dragStartPoint.value = { x: clientX, y: clientY }
  isDragMoving.value = false
  isConnecting.value = false
  isLongPress.value = false
  
  longPressTimer = setTimeout(() => {
    isLongPress.value = true
    if (!isDragMoving.value) {
      startConnection(marble.id)
      isConnecting.value = true
      tempConnectionEnd.value = { x: clientX, y: clientY }
    }
  }, 500)
}

function handleMouseMove(event) {
  handleMarbleMove(event.clientX, event.clientY)
}

function handleTouchMove(event) {
  event.preventDefault()
  const touch = event.touches[0]
  handleMarbleMove(touch.clientX, touch.clientY)
}

function handleMarbleMove(clientX, clientY) {
  if (!activeMarbleId.value) return
  
  const dx = clientX - dragStartPoint.value.x
  const dy = clientY - dragStartPoint.value.y
  const distance = Math.sqrt(dx * dx + dy * dy)
  
  if (distance > 5 && !isDragMoving.value) {
    isDragMoving.value = true
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      longPressTimer = null
    }
    if (connectionStart.value) {
      cancelConnection()
      isConnecting.value = false
    }
  }
  
  if (isConnecting.value) {
    tempConnectionEnd.value = { x: clientToSvgX(clientX), y: clientToSvgY(clientY) }
  } else if (isDragMoving.value) {
    const marble = getMarbleById(activeMarbleId.value)
    if (!marble) return
    
    const dayElement = findDayElementAtPosition(clientX, clientY)
    
    if (dayElement) {
      const dateFromElement = getDateFromDayElement(dayElement)
      
      if (dateFromElement) {
        if (isSameDay(marble.date, dateFromElement)) {
          const rect = dayElement.getBoundingClientRect()
          const x = Math.max(0.1, Math.min(0.9, (clientX - rect.left) / rect.width))
          const y = Math.max(0.1, Math.min(0.9, (clientY - rect.top) / rect.height))
          updateMarblePosition(activeMarbleId.value, x, y)
        } else {
          const hasExistingMarble = marbles.value.some(m => 
            m.id !== marble.id && isSameDay(m.date, dateFromElement)
          )
          
          if (!hasExistingMarble) {
            updateMarbleDate(activeMarbleId.value, dateFromElement)
            const rect = dayElement.getBoundingClientRect()
            const x = Math.max(0.1, Math.min(0.9, (clientX - rect.left) / rect.width))
            const y = Math.max(0.1, Math.min(0.9, (clientY - rect.top) / rect.height))
            updateMarblePosition(activeMarbleId.value, x, y)
          }
        }
      }
    }
  }
}

function handleMouseUp(event) {
  handleMarbleEnd(event.clientX, event.clientY)
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
}

function handleTouchEnd(event) {
  const touch = event.changedTouches ? event.changedTouches[0] : null
  handleMarbleEnd(touch ? touch.clientX : 0, touch ? touch.clientY : 0)
  document.removeEventListener('touchmove', handleTouchMove)
  document.removeEventListener('touchend', handleTouchEnd)
  document.removeEventListener('touchcancel', handleTouchEnd)
}

function handleMarbleEnd(clientX, clientY) {
  if (longPressTimer) {
    clearTimeout(longPressTimer)
    longPressTimer = null
  }
  
  if (isConnecting.value && connectionStart.value) {
    const targetMarble = findMarbleAtPosition(clientX, clientY)
    if (targetMarble && targetMarble.id !== connectionStart.value) {
      const conn = createConnection(targetMarble.id)
      if (conn) {
        emit('connection-create', conn)
      }
    } else {
      cancelConnection()
    }
    isConnecting.value = false
  }
  
  if (isDragMoving.value && activeMarbleId.value) {
    const marble = getMarbleById(activeMarbleId.value)
    if (marble) {
      const dayElement = findDayElementAtPosition(clientX, clientY)
      
      if (!dayElement) {
        const marbleData = { ...marble }
        removeMarble(activeMarbleId.value)
        emit('marble-remove', marbleData)
      } else {
        const targetDate = getDateFromDayElement(dayElement)
        
        if (targetDate) {
          const existingMarble = marbles.value.find(m => 
            m.id !== marble.id && isSameDay(m.date, targetDate)
          )
          
          if (existingMarble) {
            const conn = createConnectionBetween(marble.id, existingMarble.id)
            if (conn) {
              emit('connection-create', conn)
            }
            updateMarblePosition(activeMarbleId.value, 0.75, 0.45)
          } else {
            if (!isSameDay(marble.date, targetDate)) {
              updateMarbleDate(activeMarbleId.value, targetDate)
            }
            updateMarblePosition(activeMarbleId.value, 0.75, 0.45)
            emit('marble-move', marble)
          }
        }
      }
    }
  }
  
  activeMarbleId.value = null
  isDragMoving.value = false
  isLongPress.value = false
}

function onSvgMouseMove(event) {
  if (isConnecting.value) {
    tempConnectionEnd.value = { x: clientToSvgX(event.clientX), y: clientToSvgY(event.clientY) }
  }
}

function onSvgTouchMove(event) {
  if (isConnecting.value && event.touches[0]) {
    tempConnectionEnd.value = { x: clientToSvgX(event.touches[0].clientX), y: clientToSvgY(event.touches[0].clientY) }
  }
}

function findDayElementAtPosition(clientX, clientY) {
  if (!swipeRef.value) return null
  
  const dayElements = swipeRef.value.querySelectorAll('.ohhh-calendar-day')
  for (const el of dayElements) {
    const rect = el.getBoundingClientRect()
    if (clientX >= rect.left && clientX <= rect.right &&
        clientY >= rect.top && clientY <= rect.bottom) {
      return el
    }
  }
  return null
}

function getDateFromDayElement(element) {
  if (!element) return null
  
  const parent = element.parentElement
  if (!parent || !parent.classList.contains('ohhh-calendar-days')) return null
  
  if (!swipeRef.value) return null
  
  const daysContainers = swipeRef.value.querySelectorAll('.ohhh-calendar-days')
  let pageIndex = -1
  
  for (let i = 0; i < daysContainers.length; i++) {
    if (daysContainers[i] === parent) {
      pageIndex = i
      break
    }
  }
  
  if (pageIndex === -1 || pageIndex >= allRenderDates.value.length) return null
  
  const dateElements = Array.from(parent.querySelectorAll('.ohhh-calendar-day'))
  const index = dateElements.indexOf(element)
  
  if (index === -1) return null
  
  const dates = allRenderDates.value[pageIndex]
  if (dates && dates[index]) {
    return dates[index].date
  }
  
  return null
}

function findMarbleAtPosition(clientX, clientY) {
  const clickThreshold = 20
  
  for (const marble of marbles.value) {
    const centerX = getMarbleCenterX(marble.id)
    const centerY = getMarbleCenterY(marble.id)
    
    const dx = clientX - centerX
    const dy = clientY - centerY
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    if (distance < clickThreshold) {
      return marble
    }
  }
  return null
}

function getSvgRect() {
  if (!svgRef.value) return null
  return svgRef.value.getBoundingClientRect()
}

function getMarbleCenterX(marbleId) {
  const marble = getMarbleById(marbleId)
  if (!marble) return 0
  
  const dayElement = findDayElementForDate(marble.date)
  if (!dayElement) return 0
  
  const svgRect = getSvgRect()
  if (!svgRect) return 0
  
  const dayRect = dayElement.getBoundingClientRect()
  return dayRect.left + dayRect.width * marble.x - svgRect.left
}

function getMarbleCenterY(marbleId) {
  const marble = getMarbleById(marbleId)
  if (!marble) return 0
  
  const dayElement = findDayElementForDate(marble.date)
  if (!dayElement) return 0
  
  const svgRect = getSvgRect()
  if (!svgRect) return 0
  
  const dayRect = dayElement.getBoundingClientRect()
  return dayRect.top + dayRect.height * marble.y - svgRect.top
}

function clientToSvgX(clientX) {
  const svgRect = getSvgRect()
  if (!svgRect) return clientX
  return clientX - svgRect.left
}

function clientToSvgY(clientY) {
  const svgRect = getSvgRect()
  if (!svgRect) return clientY
  return clientY - svgRect.top
}

function findDayElementForDate(date) {
  if (!swipeRef.value) return null
  
  const daysContainers = swipeRef.value.querySelectorAll('.ohhh-calendar-days')
  
  for (let pageIndex = 0; pageIndex < allRenderDates.value.length; pageIndex++) {
    const dates = allRenderDates.value[pageIndex]
    const container = daysContainers[pageIndex]
    
    if (!container || !dates) continue
    
    const dayElements = container.querySelectorAll('.ohhh-calendar-day')
    
    for (let i = 0; i < dates.length; i++) {
      if (dates[i] && isSameDay(dates[i].date, date)) {
        return dayElements[i] || null
      }
    }
  }
  
  return null
}

watch([marbles, connections], () => {
  nextTick()
}, { deep: true })

defineExpose({
  toggleViewMode,
  changePageTo,
  changeSelectedDate,
  marbles,
  connections,
  createMarble,
  removeMarble,
  getMarblesByDate,
  getMarbleById
})
</script>

<style src="./style/index.scss"></style>
