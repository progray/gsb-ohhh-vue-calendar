<template>
  <div
    ref="calendarContainer"
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
          v-for="(dateObj, dayIndex) in item"
          :key="dateObj.key"
          ref="dayElements"
          :data-key="dateObj.key"
          class="ohhh-calendar-day"
          :class="{
            'is-selected': isSameDay(dateObj.date, selected),
            'is-today': isSameDay(dateObj.date, new Date()),
            'other-month': !dateObj.current
          }"
          :style="getDayStyle(dateObj.key)"
          @click="changeSelectedDate(dateObj.date)"
          @mousedown="onDayMouseDown($event, dateObj.key, dayIndex)"
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
import { computed, useTemplateRef, toRefs, ref, onMounted, onUnmounted, shallowRef } from 'vue'
import { useSwipe } from '@vueuse/core'
import { useCalendar } from './hooks/useCalendar.js'
import { isSameDay, createWeekdays } from './utils'
import { icons } from './utils/icons.js'

const swipeRef = useTemplateRef('swp')
const calendarContainer = useTemplateRef('calendarContainer')
const dayElements = ref([])

const mousePosition = ref({ x: -1000, y: -1000 })
const prevMousePosition = ref({ x: -1000, y: -1000 })
const mouseVelocity = ref({ x: 0, y: 0 })
const isMouseDown = ref(false)
const isMouseOver = ref(false)
const draggedDayKey = ref(null)
const draggedDayIndex = ref(-1)

const physicalState = shallowRef(new Map())
const animationFrameId = ref(null)
const lastTime = ref(0)

const PHYSICS = {
  WIND_STRENGTH: 0.15,
  WIND_FALLOFF: 150,
  DRAG_STRENGTH: 0.3,
  DRAG_FALLOFF: 100,
  SPRING_STIFFNESS: 0.08,
  DAMPING: 0.92,
  MAX_DISPLACEMENT: 15,
  MAX_ROTATION: 8,
  AFTERSHOCK_COUNT: 3,
  AFTERSHOCK_DELAY: 150,
  AFTERSHOCK_DAMPING: 0.6
}

const emit = defineEmits(['select-change', 'view-change'])

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

function getOrCreatePhysicalState(key) {
  if (!physicalState.value.has(key)) {
    physicalState.value.set(key, {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      rotateX: 0,
      rotateY: 0,
      scale: 1
    })
  }
  return physicalState.value.get(key)
}

function getDayStyle(key) {
  const state = getOrCreatePhysicalState(key)
  return {
    '--day-translate-x': `${state.x}px`,
    '--day-translate-y': `${state.y}px`,
    '--day-rotate-x': `${state.rotateX}deg`,
    '--day-rotate-y': `${state.rotateY}deg`,
    '--day-scale': state.scale
  }
}

function getDayCenter(element) {
  if (!element) return null
  const rect = element.getBoundingClientRect()
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  }
}

function calculateDistance(p1, p2) {
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  return Math.sqrt(dx * dx + dy * dy)
}

function getWindForce(mousePos, dayCenter, velocity) {
  const distance = calculateDistance(mousePos, dayCenter)
  if (distance > PHYSICS.WIND_FALLOFF * 2) return { fx: 0, fy: 0 }

  const dx = dayCenter.x - mousePos.x
  const dy = dayCenter.y - mousePos.y
  const angle = Math.atan2(dy, dx)

  const falloff = Math.max(0, 1 - distance / PHYSICS.WIND_FALLOFF)
  const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y)
  const speedMultiplier = Math.min(1, speed / 50)

  const strength = PHYSICS.WIND_STRENGTH * falloff * speedMultiplier
  const fx = Math.cos(angle) * strength * (1 + speedMultiplier)
  const fy = Math.sin(angle) * strength * (1 + speedMultiplier)

  return { fx, fy }
}

function getDragForce(mousePos, dayCenter, draggedCenter) {
  if (!draggedCenter) return { fx: 0, fy: 0, convergence: 0 }

  const distanceFromDragged = calculateDistance(dayCenter, draggedCenter)
  if (distanceFromDragged > PHYSICS.DRAG_FALLOFF * 2.5) return { fx: 0, fy: 0, convergence: 0 }

  const dx = mousePos.x - dayCenter.x
  const dy = mousePos.y - dayCenter.y
  const distance = calculateDistance(mousePos, dayCenter)

  const falloff = Math.max(0, 1 - distanceFromDragged / (PHYSICS.DRAG_FALLOFF * 2.5))
  const centerFalloff = distanceFromDragged === 0 ? 1 : Math.max(0.3, 1 - distanceFromDragged / PHYSICS.DRAG_FALLOFF)

  const strength = PHYSICS.DRAG_STRENGTH * falloff * centerFalloff
  const fx = (dx / (distance || 1)) * strength
  const fy = (dy / (distance || 1)) * strength

  return { fx, fy, convergence: falloff * centerFalloff }
}

function updatePhysics(timestamp) {
  if (!lastTime.value) lastTime.value = timestamp
  const deltaTime = Math.min((timestamp - lastTime.value) / 16.67, 2)
  lastTime.value = timestamp

  const containerRect = calendarContainer.value?.getBoundingClientRect()
  if (!containerRect) {
    animationFrameId.value = requestAnimationFrame(updatePhysics)
    return
  }

  mouseVelocity.value = {
    x: mousePosition.value.x - prevMousePosition.value.x,
    y: mousePosition.value.y - prevMousePosition.value.y
  }
  prevMousePosition.value = { ...mousePosition.value }

  let draggedCenter = null
  if (isMouseDown.value && draggedDayIndex.value >= 0) {
    const draggedElement = dayElements.value[draggedDayIndex.value]
    if (draggedElement) {
      draggedCenter = getDayCenter(draggedElement)
    }
  }

  dayElements.value.forEach((element, index) => {
    if (!element) return

    const key = element.getAttribute('data-key') || index.toString()
    const state = getOrCreatePhysicalState(key)
    const dayCenter = getDayCenter(element)

    if (!dayCenter) return

    let totalFx = 0
    let totalFy = 0

    if (isMouseOver.value) {
      const windForce = getWindForce(mousePosition.value, dayCenter, mouseVelocity.value)
      totalFx += windForce.fx
      totalFy += windForce.fy
    }

    if (isMouseDown.value && draggedCenter) {
      const dragForce = getDragForce(mousePosition.value, dayCenter, draggedCenter)
      totalFx += dragForce.fx
      totalFy += dragForce.fy

      state.scale = 1 + dragForce.convergence * 0.05
    } else {
      state.scale += (1 - state.scale) * 0.1
    }

    const springFx = -state.x * PHYSICS.SPRING_STIFFNESS
    const springFy = -state.y * PHYSICS.SPRING_STIFFNESS
    totalFx += springFx
    totalFy += springFy

    state.vx = (state.vx + totalFx) * PHYSICS.DAMPING
    state.vy = (state.vy + totalFy) * PHYSICS.DAMPING

    state.x += state.vx * deltaTime
    state.y += state.vy * deltaTime

    const distance = Math.sqrt(state.x * state.x + state.y * state.y)
    if (distance > PHYSICS.MAX_DISPLACEMENT) {
      const ratio = PHYSICS.MAX_DISPLACEMENT / distance
      state.x *= ratio
      state.y *= ratio
      state.vx *= 0.8
      state.vy *= 0.8
    }

    state.rotateY = (state.x / PHYSICS.MAX_DISPLACEMENT) * PHYSICS.MAX_ROTATION
    state.rotateX = -(state.y / PHYSICS.MAX_DISPLACEMENT) * PHYSICS.MAX_ROTATION
  })

  animationFrameId.value = requestAnimationFrame(updatePhysics)
}

function triggerAftershock() {
  let count = 0
  const trigger = () => {
    if (count >= PHYSICS.AFTERSHOCK_COUNT) return

    dayElements.value.forEach((element) => {
      if (!element) return
      const key = element.getAttribute('data-key')
      const state = physicalState.value.get(key)
      if (state) {
        const angle = Math.random() * Math.PI * 2
        const magnitude = (Math.random() * 0.5 + 0.5) * PHYSICS.AFTERSHOCK_DAMPING
        state.vx += Math.cos(angle) * magnitude * 3
        state.vy += Math.sin(angle) * magnitude * 3
      }
    })

    count++
    if (count < PHYSICS.AFTERSHOCK_COUNT) {
      setTimeout(trigger, PHYSICS.AFTERSHOCK_DELAY)
    }
  }
  trigger()
}

function onMouseMove(event) {
  const containerRect = calendarContainer.value?.getBoundingClientRect()
  if (!containerRect) return

  mousePosition.value = {
    x: event.clientX,
    y: event.clientY
  }
  isMouseOver.value = true
}

function onMouseLeave() {
  isMouseOver.value = false
  mousePosition.value = { x: -1000, y: -1000 }

  if (isMouseDown.value) {
    isMouseDown.value = false
    draggedDayKey.value = null
    draggedDayIndex.value = -1
    triggerAftershock()
  }
}

function onMouseUp() {
  if (isMouseDown.value) {
    isMouseDown.value = false
    draggedDayKey.value = null
    draggedDayIndex.value = -1
    triggerAftershock()
  }
}

function onDayMouseDown(event, key, index) {
  if (event.button !== 0) return

  isMouseDown.value = true
  draggedDayKey.value = key
  draggedDayIndex.value = index
}

function initEventListeners() {
  const container = calendarContainer.value
  if (!container) return

  container.addEventListener('mousemove', onMouseMove, { passive: true })
  container.addEventListener('mouseleave', onMouseLeave, { passive: true })
  document.addEventListener('mouseup', onMouseUp, { passive: true })

  animationFrameId.value = requestAnimationFrame(updatePhysics)
}

function cleanupEventListeners() {
  const container = calendarContainer.value
  if (container) {
    container.removeEventListener('mousemove', onMouseMove)
    container.removeEventListener('mouseleave', onMouseLeave)
  }
  document.removeEventListener('mouseup', onMouseUp)

  if (animationFrameId.value) {
    cancelAnimationFrame(animationFrameId.value)
    animationFrameId.value = null
  }
}

onMounted(() => {
  setTimeout(initEventListeners, 100)
})

onUnmounted(() => {
  cleanupEventListeners()
})

defineExpose({
  // 切换周/月视图
  toggleViewMode,
  // 切换日历页
  changePageTo,
  // 切换选中日期
  changeSelectedDate
})
</script>
