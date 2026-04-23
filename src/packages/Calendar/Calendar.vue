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
          class="ohhh-calendar-day"
          :class="{
            'is-selected': isSameDay(dateObj.date, selected),
            'is-today': isSameDay(dateObj.date, new Date()),
            'other-month': !dateObj.current
          }"
          @click="changeSelectedDate(dateObj.date)"
          @mousedown="onDayMouseDown($event, dateObj.key)"
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
import { computed, useTemplateRef, toRefs, ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useSwipe } from '@vueuse/core'
import { useCalendar } from './hooks/useCalendar.js'
import { isSameDay, createWeekdays } from './utils'
import { icons } from './utils/icons.js'

const swipeRef = useTemplateRef('swp')
const calendarContainer = useTemplateRef('calendarContainer')
const dayElements = ref([])

let mouseX = -1000
let mouseY = -1000
let prevMouseX = -1000
let prevMouseY = -1000
let mouseVelX = 0
let mouseVelY = 0
let isMouseDown = false
let isMouseOver = false
let draggedCellIndex = -1

const animationFrameId = ref(null)
let lastTime = 0
let isPhysicsRunning = false

const PHYSICS = {
  WIND_STRENGTH: 0.25,
  WIND_FALLOFF: 180,
  DRAG_STRENGTH: 0.6,
  DRAG_FALLOFF: 140,
  SPRING_STIFFNESS: 0.12,
  DAMPING: 0.88,
  NEIGHBOR_SPRING_STIFFNESS: 0.06,
  MAX_DISPLACEMENT: 20,
  MAX_ROTATION: 12,
  AFTERSHOCK_WAVE_COUNT: 5,
  AFTERSHOCK_WAVE_INTERVAL: 100,
  AFTERSHOCK_WAVE_SPEED: 0.3
}

const gridState = {
  cells: [],
  cols: 7,
  rows: 0
}

function createCellState() {
  return {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    rotateX: 0,
    rotateY: 0,
    scale: 1,
    element: null,
    pageIndex: -1,
    dayIndex: -1
  }
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

function initGridState() {
  gridState.cells = []
  
  if (!dayElements.value || dayElements.value.length === 0) return
  
  const totalCells = dayElements.value.length
  const currentPageIndex = 1
  
  dayElements.value.forEach((element, index) => {
    if (!element) return
    
    const cell = createCellState()
    cell.element = element
    cell.dayIndex = index % 7
    cell.pageIndex = Math.floor(index / (gridState.cols * 6))
    
    gridState.cells.push(cell)
  })
  
  gridState.rows = Math.ceil(gridState.cells.length / gridState.cols)
}

function getElementCenter(element) {
  if (!element) return null
  const rect = element.getBoundingClientRect()
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  }
}

function dist(p1, p2) {
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  return Math.sqrt(dx * dx + dy * dy)
}

function applyTransform(cell) {
  if (!cell.element) return
  
  const transform = `translate3d(${cell.x}px, ${cell.y}px, 0) rotateX(${cell.rotateX}deg) rotateY(${cell.rotateY}deg) scale(${cell.scale})`
  cell.element.style.transform = transform
}

function getNeighborIndices(cellIndex) {
  const neighbors = []
  const row = Math.floor(cellIndex / gridState.cols)
  const col = cellIndex % gridState.cols
  
  if (col > 0) neighbors.push(cellIndex - 1)
  if (col < gridState.cols - 1) neighbors.push(cellIndex + 1)
  if (row > 0) neighbors.push(cellIndex - gridState.cols)
  if (row < gridState.rows - 1) neighbors.push(cellIndex + gridState.cols)
  
  return neighbors
}

function updatePhysicsLoop(timestamp) {
  if (!isPhysicsRunning) return
  
  if (!lastTime) lastTime = timestamp
  const deltaTime = Math.min((timestamp - lastTime) / 16.67, 2)
  lastTime = timestamp
  
  if (!calendarContainer.value) {
    animationFrameId.value = requestAnimationFrame(updatePhysicsLoop)
    return
  }
  
  mouseVelX = mouseX - prevMouseX
  mouseVelY = mouseY - prevMouseY
  prevMouseX = mouseX
  prevMouseY = mouseY
  
  const mouseSpeed = Math.sqrt(mouseVelX * mouseVelX + mouseVelY * mouseVelY)
  
  const forces = new Array(gridState.cells.length).fill(null).map(() => ({ fx: 0, fy: 0 }))
  
  for (let i = 0; i < gridState.cells.length; i++) {
    const cell = gridState.cells[i]
    if (!cell || !cell.element) continue
    
    const cellCenter = getElementCenter(cell.element)
    if (!cellCenter) continue
    
    if (isMouseOver) {
      const distance = dist({ x: mouseX, y: mouseY }, cellCenter)
      
      if (distance < PHYSICS.WIND_FALLOFF * 2.5) {
        const falloff = Math.max(0, 1 - distance / (PHYSICS.WIND_FALLOFF * 2))
        
        const dx = cellCenter.x - mouseX
        const dy = cellCenter.y - mouseY
        const angle = Math.atan2(dy, dx)
        
        let effectiveStrength = 0
        
        if (mouseSpeed > 0.3) {
          const speedFactor = Math.min(1, Math.pow(mouseSpeed / 50, 0.7))
          effectiveStrength = PHYSICS.WIND_STRENGTH * falloff * speedFactor * (1 + speedFactor * 0.5)
        } else {
          effectiveStrength = PHYSICS.WIND_STRENGTH * falloff * 0.2
        }
        
        forces[i].fx += Math.cos(angle) * effectiveStrength
        forces[i].fy += Math.sin(angle) * effectiveStrength
      }
    }
    
    if (isMouseDown && draggedCellIndex >= 0) {
      const draggedCell = gridState.cells[draggedCellIndex]
      if (draggedCell && draggedCell.element) {
        const draggedCenter = getElementCenter(draggedCell.element)
        if (draggedCenter) {
          const distanceFromDragged = dist(cellCenter, draggedCenter)
          
          if (distanceFromDragged < PHYSICS.DRAG_FALLOFF * 3) {
            const distanceFromMouse = dist({ x: mouseX, y: mouseY }, cellCenter)
            
            const falloff = Math.max(0, 1 - distanceFromDragged / (PHYSICS.DRAG_FALLOFF * 3))
            const centerFalloff = distanceFromDragged === 0 ? 1 : Math.max(0.2, 1 - distanceFromDragged / PHYSICS.DRAG_FALLOFF)
            
            const dirX = mouseX - cellCenter.x
            const dirY = mouseY - cellCenter.y
            const dirDist = Math.sqrt(dirX * dirX + dirY * dirY) || 1
            
            const strength = PHYSICS.DRAG_STRENGTH * falloff * centerFalloff
            
            forces[i].fx += (dirX / dirDist) * strength
            forces[i].fy += (dirY / dirDist) * strength
            
            cell.scale = 1 + falloff * centerFalloff * 0.08
          }
        }
      }
    } else {
      cell.scale += (1 - cell.scale) * 0.12
    }
    
    const springX = -cell.x * PHYSICS.SPRING_STIFFNESS
    const springY = -cell.y * PHYSICS.SPRING_STIFFNESS
    forces[i].fx += springX
    forces[i].fy += springY
  }
  
  for (let i = 0; i < gridState.cells.length; i++) {
    const cell = gridState.cells[i]
    if (!cell) continue
    
    const neighbors = getNeighborIndices(i)
    
    for (const neighborIdx of neighbors) {
      const neighbor = gridState.cells[neighborIdx]
      if (!neighbor) continue
      
      const dx = neighbor.x - cell.x
      const dy = neighbor.y - cell.y
      
      forces[i].fx += dx * PHYSICS.NEIGHBOR_SPRING_STIFFNESS
      forces[i].fy += dy * PHYSICS.NEIGHBOR_SPRING_STIFFNESS
    }
  }
  
  for (let i = 0; i < gridState.cells.length; i++) {
    const cell = gridState.cells[i]
    if (!cell) continue
    
    const force = forces[i]
    
    cell.vx = (cell.vx + force.fx) * PHYSICS.DAMPING
    cell.vy = (cell.vy + force.fy) * PHYSICS.DAMPING
    
    cell.x += cell.vx * deltaTime
    cell.y += cell.vy * deltaTime
    
    const totalDist = Math.sqrt(cell.x * cell.x + cell.y * cell.y)
    if (totalDist > PHYSICS.MAX_DISPLACEMENT) {
      const ratio = PHYSICS.MAX_DISPLACEMENT / totalDist
      cell.x *= ratio
      cell.y *= ratio
      cell.vx *= 0.75
      cell.vy *= 0.75
    }
    
    cell.rotateY = (cell.x / PHYSICS.MAX_DISPLACEMENT) * PHYSICS.MAX_ROTATION
    cell.rotateX = -(cell.y / PHYSICS.MAX_DISPLACEMENT) * PHYSICS.MAX_ROTATION
    
    applyTransform(cell)
  }
  
  animationFrameId.value = requestAnimationFrame(updatePhysicsLoop)
}

function triggerWaveAftershock(centerX, centerY) {
  let waveCount = 0
  
  const createWave = () => {
    if (waveCount >= PHYSICS.AFTERSHOCK_WAVE_COUNT) return
    
    const waveRadius = waveCount * 80 + 50
    const nextWaveDelay = PHYSICS.AFTERSHOCK_WAVE_INTERVAL + waveCount * 30
    
    for (let i = 0; i < gridState.cells.length; i++) {
      const cell = gridState.cells[i]
      if (!cell || !cell.element) continue
      
      const cellCenter = getElementCenter(cell.element)
      if (!cellCenter) continue
      
      const distanceToCenter = dist(cellCenter, { x: centerX, y: centerY })
      const distanceToWave = Math.abs(distanceToCenter - waveRadius)
      
      if (distanceToWave < 60) {
        const intensity = Math.max(0, 1 - distanceToWave / 60) * PHYSICS.AFTERSHOCK_WAVE_SPEED
        const angle = Math.atan2(cellCenter.y - centerY, cellCenter.x - centerX)
        
        const randomOffset = (Math.random() - 0.5) * 0.3
        const finalAngle = angle + randomOffset
        
        const waveMultiplier = (PHYSICS.AFTERSHOCK_WAVE_COUNT - waveCount) / PHYSICS.AFTERSHOCK_WAVE_COUNT
        
        cell.vx += Math.cos(finalAngle) * intensity * 5 * waveMultiplier
        cell.vy += Math.sin(finalAngle) * intensity * 5 * waveMultiplier
      }
    }
    
    waveCount++
    if (waveCount < PHYSICS.AFTERSHOCK_WAVE_COUNT) {
      setTimeout(createWave, nextWaveDelay)
    }
  }
  
  createWave()
}

function onMouseMove(event) {
  mouseX = event.clientX
  mouseY = event.clientY
  isMouseOver = true
}

function onMouseLeave() {
  isMouseOver = false
  
  const leaveX = mouseX
  const leaveY = mouseY
  
  mouseX = -10000
  mouseY = -10000
  
  if (isMouseDown) {
    isMouseDown = false
    triggerWaveAftershock(leaveX, leaveY)
  }
}

function onMouseUp(event) {
  if (isMouseDown) {
    isMouseDown = false
    triggerWaveAftershock(event.clientX, event.clientY)
  }
}

function onDayMouseDown(event, dateKey) {
  if (event.button !== 0) return
  
  isMouseDown = true
  
  const clickedElement = event.currentTarget
  draggedCellIndex = -1
  
  for (let i = 0; i < gridState.cells.length; i++) {
    if (gridState.cells[i].element === clickedElement) {
      draggedCellIndex = i
      break
    }
  }
}

function startPhysics() {
  if (isPhysicsRunning) return
  
  initGridState()
  
  if (gridState.cells.length === 0) {
    setTimeout(startPhysics, 100)
    return
  }
  
  isPhysicsRunning = true
  lastTime = 0
  animationFrameId.value = requestAnimationFrame(updatePhysicsLoop)
}

function stopPhysics() {
  isPhysicsRunning = false
  if (animationFrameId.value) {
    cancelAnimationFrame(animationFrameId.value)
    animationFrameId.value = null
  }
}

function initEventListeners() {
  const container = calendarContainer.value
  if (!container) return
  
  container.addEventListener('mousemove', onMouseMove, { passive: true })
  container.addEventListener('mouseleave', onMouseLeave, { passive: true })
  document.addEventListener('mouseup', onMouseUp, { passive: true })
  
  startPhysics()
}

function cleanupEventListeners() {
  const container = calendarContainer.value
  if (container) {
    container.removeEventListener('mousemove', onMouseMove)
    container.removeEventListener('mouseleave', onMouseLeave)
  }
  document.removeEventListener('mouseup', onMouseUp)
  
  stopPhysics()
}

watch(dayElements, () => {
  nextTick(() => {
    if (isPhysicsRunning) {
      initGridState()
    }
  })
}, { deep: true })

onMounted(() => {
  nextTick(() => {
    setTimeout(initEventListeners, 150)
  })
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
