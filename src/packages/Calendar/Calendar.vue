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
            'other-month': !dateObj.current
          }"
          :style="[
            getCellStyle(pageIndex, cellIndex),
            { '--animation-tick': animationTick }
          ]"
          :data-index="cellIndex"
          :data-page="pageIndex"
          :data-row="Math.floor(cellIndex / 7)"
          :data-col="cellIndex % 7"
          @mouseenter="onCellMouseEnter(pageIndex, cellIndex, $event)"
          @click="onCellClick(pageIndex, cellIndex, dateObj.date, $event)"
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
  animationTick,
  triggerWindChime,
  triggerRipple,
  getCellTransform,
  resetAllCells,
  startAnimation,
  RIPPLE_CONFIG
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
const clickQueue = ref([])
const isProcessingClick = ref(false)

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

function getCellStyle(pageIndex, cellIndex) {
  const tick = animationTick.value
  const cellKey = getCellKey(pageIndex, cellIndex)
  const transform = getCellTransform(cellKey)
  return {
    transform: `translate(${transform.x}px, ${transform.y}px) rotate(${transform.rotation}rad)`
  }
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

      triggerWindChime(cellKey, direction, 1.8)

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

function onCellMouseEnter(pageIndex, cellIndex, event) {
  if (!isMouseDown.value || isInTransition.value) return

  const cellKey = getCellKey(pageIndex, cellIndex)

  if (lastMouseCellIndex.value !== -1 && lastMousePageIndex.value === pageIndex) {
    const direction = cellIndex > lastMouseCellIndex.value ? 'right' : 'left'
    triggerWindChime(cellKey, direction, 1.8)
  }

  lastMouseCellIndex.value = cellIndex
  lastMousePageIndex.value = pageIndex
}

function getCellCenterPosition(cellElement) {
  if (!cellElement || !swipeRef.value) return null
  const cellRect = cellElement.getBoundingClientRect()
  const wrapperRect = swipeRef.value.getBoundingClientRect()
  return {
    x: cellRect.left + cellRect.width / 2 - wrapperRect.left,
    y: cellRect.top + cellRect.height / 2 - wrapperRect.top
  }
}

function triggerRippleFromClick(clickData) {
  const { pageIndex, cellIndex, clientX, clientY, date } = clickData
  const cellKey = getCellKey(pageIndex, cellIndex)
  const currentPageDates = allRenderDates.value[pageIndex]

  const cellElement = document.querySelector(`[data-page="${pageIndex}"][data-index="${cellIndex}"]`)
  const clickPosition = getCellCenterPosition(cellElement)

  const centerRow = Math.floor(cellIndex / 7)
  const centerCol = cellIndex % 7

  const rippleSpeed = RIPPLE_CONFIG.speed
  const baseDelay = 8

  for (let i = 0; i < currentPageDates.length; i++) {
    const row = Math.floor(i / 7)
    const col = i % 7

    const gridDistance = Math.sqrt(
      Math.pow(row - centerRow, 2) + Math.pow(col - centerCol, 2)
    )

    const delay = gridDistance * baseDelay + (Math.random() - 0.5) * 8

    setTimeout(() => {
      const key = getCellKey(pageIndex, i)

      const angle = Math.atan2(row - centerRow, col - centerCol)
      const maxDistance = Math.sqrt(49 + 25)
      const normalizedDistance = gridDistance / maxDistance

      const baseForce = 85 * (1 - normalizedDistance * 0.4)
      const randomForceOffset = (Math.random() - 0.5) * 25
      const force = Math.max(15, baseForce + randomForceOffset)

      const randomAngleOffset = (Math.random() - 0.5) * 0.6
      const finalAngle = angle + randomAngleOffset

      const state = cellStates[key]
      if (state) {
        state.isActive = true
        state.velocity.x = Math.cos(finalAngle) * force
        state.velocity.y = Math.sin(finalAngle) * force * 0.75 + (Math.random() - 0.5) * 25
        state.rotationVelocity = (Math.random() - 0.5) * 2.8
      } else {
        cellStates[key] = {
          position: { x: 0, y: 0 },
          velocity: {
            x: Math.cos(finalAngle) * force,
            y: Math.sin(finalAngle) * force * 0.75 + (Math.random() - 0.5) * 25
          },
          rotation: 0,
          rotationVelocity: (Math.random() - 0.5) * 2.8,
          scale: 1,
          targetPosition: { x: 0, y: 0 },
          isActive: true,
          lastActivationTime: 0
        }
      }
      startAnimation()
    }, Math.abs(delay))
  }

  if (clickPosition) {
    triggerRipple(clickPosition.x, clickPosition.y, currentPageDates.length, 7)
  }

  if (!isSameDay(new Date(date), selected.value)) {
    selected.value = new Date(date)
    emit('select-change', selected.value)
  }
}

async function processClickQueue() {
  if (isProcessingClick.value || clickQueue.value.length === 0) return

  isProcessingClick.value = true
  const clickData = clickQueue.value.shift()

  const isSelectingNewDate = clickData && clickData.date &&
    !isSameDay(new Date(clickData.date), selected.value)

  if (isSelectingNewDate) {
    triggerRippleFromClick(clickData)
    await new Promise(resolve => setTimeout(resolve, 400))
    switchPageToTargetDate(clickData.date)
  } else if (clickData) {
    triggerRippleFromClick(clickData)
  }

  isProcessingClick.value = false

  if (clickQueue.value.length > 0) {
    processClickQueue()
  }
}

function onCellClick(pageIndex, cellIndex, date, event) {
  if (isInTransition.value || isProcessingClick.value) return

  clickQueue.value.push({
    pageIndex,
    cellIndex,
    date,
    clientX: event.clientX,
    clientY: event.clientY,
    timestamp: performance.now()
  })

  processClickQueue()
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
  if (isInTransition.value) return

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
  const centerCol = 3

  for (let i = 0; i < currentPageDates.length; i++) {
    const row = Math.floor(i / 7)
    const col = i % 7

    const isNext = pageTransitionDirection.value === 'next'

    const colDistance = Math.abs(col - centerCol)
    const rowDelay = row * 55
    const colDelay = colDistance * 12
    const randomDelay = Math.random() * 30

    const delay = rowDelay + colDelay + randomDelay

    setTimeout(() => {
      const cellKey = getCellKey(1, i)
      const state = cellStates[cellKey]

      const baseYForce = isNext ? 140 : -115
      const randomYOffset = (Math.random() - 0.5) * 35
      const randomXOffset = (Math.random() - 0.5) * (isNext ? 75 : 65)
      const randomRotationOffset = (Math.random() - 0.5) * (isNext ? 3.0 : 2.2)

      if (state) {
        state.isActive = true
        state.velocity.y = baseYForce + randomYOffset
        state.velocity.x = randomXOffset
        state.rotationVelocity = (isNext ? 2.0 : -1.5) + randomRotationOffset
      } else {
        cellStates[cellKey] = {
          position: { x: 0, y: 0 },
          velocity: {
            x: randomXOffset,
            y: baseYForce + randomYOffset
          },
          rotation: 0,
          rotationVelocity: (isNext ? 2.0 : -1.5) + randomRotationOffset,
          scale: 1,
          targetPosition: { x: 0, y: 0 },
          isActive: true,
          lastActivationTime: 0
        }
      }
      startAnimation()
    }, Math.abs(delay))
  }

  switchPageToTargetDate(targetDate)

  nextTick(() => {
    setTimeout(() => {
      pageTransitionDirection.value = null
    }, 300)
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
      const centerX = ripple.centerX ?? (canvas.width / 2)
      const centerY = ripple.centerY ?? (canvas.height / 2)

      const gradient = ctx.createRadialGradient(
        centerX, centerY,
        Math.max(0, ripple.radius - 50),
        centerX, centerY,
        ripple.radius
      )
      gradient.addColorStop(0, `rgba(64, 158, 255, 0)`)
      gradient.addColorStop(0.5, `rgba(64, 158, 255, ${0.5 * ripple.alpha})`)
      gradient.addColorStop(1, `rgba(64, 158, 255, 0)`)

      ctx.beginPath()
      ctx.arc(centerX, centerY, ripple.radius, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(64, 158, 255, ${0.7 * ripple.alpha})`
      ctx.lineWidth = 3
      ctx.stroke()

      if (ripple.radius > 30) {
        ctx.beginPath()
        ctx.arc(centerX, centerY, ripple.radius - 30, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(64, 158, 255, ${0.4 * ripple.alpha})`
        ctx.lineWidth = 2
        ctx.stroke()
      }
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
