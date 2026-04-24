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
    <div
      ref="swp"
      class="ohhh-calendar-wrapper"
      @mousedown="onMouseDown"
      @mousemove="onMouseMove"
      @mouseup="onMouseUp"
      @mouseleave="onMouseUp"
    >
      <!-- Canvas 层用于波纹效果 -->
      <canvas
        ref="canvasRef"
        class="ohhh-calendar-canvas"
        :width="canvasSize.width"
        :height="canvasSize.height"
      />

      <div
        v-for="(item, pageIndex) in allRenderDates"
        :key="pageIndex"
        :style="{ left: 100 * (pageIndex - 1) + '%' }"
        class="ohhh-calendar-days"
        :class="{
          'page-exit': isPageExiting(pageIndex),
          'page-enter': isPageEntering(pageIndex)
        }"
        @transitionend="onTransitionEnd"
      >
        <div
          v-for="(dateObj, cellIndex) in item"
          :key="dateObj.key"
          class="ohhh-calendar-day"
          :class="{
            'is-selected': isSameDay(dateObj.date, selected),
            'is-today': isSameDay(dateObj.date, new Date()),
            'other-month': !dateObj.current,
            'wind-chime-active': isCellActive(getCellKey(pageIndex, cellIndex))
          }"
          :style="getCellStyle(getCellKey(pageIndex, cellIndex))"
          :data-index="cellIndex"
          :data-page="pageIndex"
          @mouseenter="onCellMouseEnter(pageIndex, cellIndex)"
          @click="onCellClick(pageIndex, cellIndex, dateObj.date)"
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
import { computed, useTemplateRef, toRefs, ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useSwipe } from '@vueuse/core'
import { useCalendar } from './hooks/useCalendar.js'
import { usePhysicsAnimation } from './hooks/usePhysicsAnimation.js'
import { isSameDay, createWeekdays } from './utils'
import { icons } from './utils/icons.js'

const swipeRef = useTemplateRef('swp')
const canvasRef = useTemplateRef('canvasRef')

const emit = defineEmits(['select-change', 'view-change'])

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
  toggleViewMode,
  lastTransitionDirection
} = useCalendar({ initialSelectedDate, initialViewMode, weekStart, duration }, emit)

const {
  cellStates,
  rippleEffects,
  triggerWindChime,
  triggerRipple,
  getCellTransform,
  resetAllCells,
  startAnimation
} = usePhysicsAnimation()

const headerLabel = computed(() => `${currentYear.value}年${currentMonth.value + 1}月`)
const weekdays = createWeekdays(weekStart.value)

const markerDateList = computed(() =>
  markerDates.value.map(item => ({
    date: new Date(typeof item === 'object' && item.date ? item.date : item),
    color: typeof item === 'object' && item.color ? item.color : 'var(--calendar-theme-color)'
  }))
)

const canvasSize = ref({ width: 0, height: 0 })
const isMouseDown = ref(false)
const lastMouseCellIndex = ref(-1)
const lastMousePageIndex = ref(-1)
const pageTransitionDirection = ref(null)

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

function getCellKey(pageIndex, cellIndex) {
  return `${pageIndex}-${cellIndex}`
}

function getCellStyle(cellKey) {
  const transform = getCellTransform(cellKey)
  return {
    transform: `translate(${transform.x}px, ${transform.y}px) rotate(${transform.rotation}rad)`
  }
}

function isCellActive(cellKey) {
  const state = cellStates.get(cellKey)
  return state ? state.isActive : false
}

function isPageExiting(pageIndex) {
  if (!pageTransitionDirection.value) return false
  return pageIndex === 1
}

function isPageEntering(pageIndex) {
  if (!pageTransitionDirection.value) return false
  if (pageTransitionDirection.value === 'next' && pageIndex === 2) return true
  if (pageTransitionDirection.value === 'prev' && pageIndex === 0) return true
  return false
}

function onMouseDown(event) {
  if (isInTransition.value) return
  isMouseDown.value = true
  lastMouseCellIndex.value = -1
  lastMousePageIndex.value = -1
}

function onMouseMove(event) {
  if (!isMouseDown.value || isInTransition.value) return

  const target = event.target.closest('.ohhh-calendar-day')
  if (target) {
    const cellIndex = parseInt(target.dataset.index)
    const pageIndex = parseInt(target.dataset.page)

    if (cellIndex !== lastMouseCellIndex.value || pageIndex !== lastMousePageIndex.value) {
      const direction = cellIndex > lastMouseCellIndex.value ? 'right' : 'left'
      const cellKey = getCellKey(pageIndex, cellIndex)

      triggerWindChime(cellKey, direction, 1.5)

      lastMouseCellIndex.value = cellIndex
      lastMousePageIndex.value = pageIndex
    }
  }
}

function onMouseUp() {
  isMouseDown.value = false
  lastMouseCellIndex.value = -1
  lastMousePageIndex.value = -1
}

function onCellMouseEnter(pageIndex, cellIndex) {
  if (!isMouseDown.value || isInTransition.value) return

  const cellKey = getCellKey(pageIndex, cellIndex)

  if (lastMouseCellIndex.value !== -1 && lastMousePageIndex.value === pageIndex) {
    const direction = cellIndex > lastMouseCellIndex.value ? 'right' : 'left'
    triggerWindChime(cellKey, direction, 1.5)
  }

  lastMouseCellIndex.value = cellIndex
  lastMousePageIndex.value = pageIndex
}

function onCellClick(pageIndex, cellIndex, date) {
  if (isInTransition.value) return

  const cellKey = getCellKey(pageIndex, cellIndex)
  const currentPageDates = allRenderDates.value[pageIndex]

  for (let i = 0; i < currentPageDates.length; i++) {
    const row = Math.floor(i / 7)
    const col = i % 7
    const centerRow = Math.floor(cellIndex / 7)
    const centerCol = cellIndex % 7

    const distance = Math.sqrt(
      Math.pow(row - centerRow, 2) + Math.pow(col - centerCol, 2)
    )

    const maxDistance = Math.sqrt(49 + 25)
    const normalizedDistance = distance / maxDistance

    const delay = normalizedDistance * 200

    setTimeout(() => {
      const key = getCellKey(pageIndex, i)
      const angle = Math.atan2(row - centerRow, col - centerCol)
      const force = 50 * (1 - normalizedDistance * 0.6)

      const state = cellStates.get(key)
      if (state) {
        state.isActive = true
        state.velocity.x = Math.cos(angle) * force
        state.velocity.y = Math.sin(angle) * force * 0.5
        state.rotationVelocity = (Math.random() - 0.5) * 1.5
      }
      startAnimation()
    }, delay)
  }

  triggerRipple(cellKey, currentPageDates.length, 7)

  changePageTo(date)
  if (!isSameDay(new Date(date), selected.value)) {
    selected.value = new Date(date)
    emit('select-change', selected.value)
  }
}

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

  const isPrev = (
    (param === 'prev-page' || param === 'prev-year') ||
    (targetDate.getFullYear() < currentYear.value) ||
    (targetDate.getFullYear() === currentYear.value && targetDate.getMonth() < currentMonth.value)
  )

  if (isPrev) {
    pageTransitionDirection.value = 'prev'
  } else if (
    param === 'next-page' || param === 'next-year' ||
    targetDate.getFullYear() > currentYear.value ||
    (targetDate.getFullYear() === currentYear.value && targetDate.getMonth() > currentMonth.value)
  ) {
    pageTransitionDirection.value = 'next'
  }

  const currentPageDates = allRenderDates.value[1]
  for (let i = 0; i < currentPageDates.length; i++) {
    const row = Math.floor(i / 7)
    const col = i % 7
    const delay = (row * 80 + col * 40)

    setTimeout(() => {
      const cellKey = getCellKey(1, i)
      const state = cellStates.get(cellKey)
      if (state) {
        state.isActive = true
        if (pageTransitionDirection.value === 'next') {
          state.velocity.y = 100
          state.velocity.x = (Math.random() - 0.5) * 60
          state.rotationVelocity = (Math.random() - 0.5) * 3
        } else {
          state.velocity.y = -80
          state.velocity.x = (Math.random() - 0.5) * 50
          state.rotationVelocity = (Math.random() - 0.5) * 2
        }
      }
      startAnimation()
    }, Math.abs(delay))
  }

  switchPageToTargetDate(targetDate)

  nextTick(() => {
    setTimeout(() => {
      pageTransitionDirection.value = null
      resetAllCells()
    }, 800)
  })
}

function _getMarkerColor(date) {
  return markerDateList.value.find(d => isSameDay(d.date, date))?.color
}

let animationFrameId = null

function drawRipples() {
  const canvas = canvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  if (rippleEffects.value.length > 0) {
    rippleEffects.value.forEach(ripple => {
      const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2,
        ripple.radius - 40,
        canvas.width / 2, canvas.height / 2,
        ripple.radius
      )
      gradient.addColorStop(0, `rgba(64, 158, 255, 0)`)
      gradient.addColorStop(0.5, `rgba(64, 158, 255, ${0.4 * ripple.alpha})`)
      gradient.addColorStop(1, `rgba(64, 158, 255, 0)`)

      ctx.beginPath()
      ctx.arc(canvas.width / 2, canvas.height / 2, ripple.radius, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(64, 158, 255, ${0.6 * ripple.alpha})`
      ctx.lineWidth = 4
      ctx.stroke()
    })
  }

  animationFrameId = requestAnimationFrame(drawRipples)
}

function updateCanvasSize() {
  if (swipeRef.value) {
    const rect = swipeRef.value.getBoundingClientRect()
    canvasSize.value = {
      width: rect.width,
      height: rect.height
    }
  }
}

onMounted(() => {
  updateCanvasSize()
  window.addEventListener('resize', updateCanvasSize)
  drawRipples()
})

onUnmounted(() => {
  window.removeEventListener('resize', updateCanvasSize)
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }
})

watch(isInTransition, (val) => {
  if (!val) {
    setTimeout(() => {
      pageTransitionDirection.value = null
    }, 100)
  }
})

defineExpose({
  toggleViewMode,
  changePageTo,
  changeSelectedDate: (date) => {
    changePageTo(date)
    if (!isSameDay(new Date(date), selected.value)) {
      selected.value = new Date(date)
      emit('select-change', selected.value)
    }
  }
})
</script>
