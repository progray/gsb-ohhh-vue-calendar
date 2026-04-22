<template>
  <div
    class="ohhh-calendar-container"
    :class="{
      'torch-effect-enabled': torchEffect,
      'torch-active': isTorchActive
    }"
    :style="{
      '--calendar-rows': renderRows,
      '--calendar-transition-duration': duration,
      '--translate-distance': transformDistance,
      '--transition-duration': transitionDuration
    }"
    @mouseenter="onMouseEnter"
    @mousemove="onMouseMove"
    @mouseleave="onMouseLeave"
  >
    <!-- 火把光团 -->
    <div
      v-if="torchEffect"
      class="torch-orb"
      :class="{ 'torch-orb-active': isTorchActive, 'torch-orb-fade-out': isFadingOut }"
      :style="{
        '--torch-x': torchX + 'px',
        '--torch-y': torchY + 'px'
      }"
    />
    <!-- 火把光影残留容器 -->
    <div v-if="torchEffect" class="torch-trails">
      <div
        v-for="trail in trailList"
        :key="trail.id"
        class="torch-trail"
        :style="{
          '--trail-x': trail.x + 'px',
          '--trail-y': trail.y + 'px',
          '--trail-opacity': trail.opacity,
          '--trail-scale': trail.scale
        }"
      />
    </div>
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
          :ref="(el) => setDayRef(dateObj.key, el)"
          :style="_getTorchGlowStyle(dateObj.key)"
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
import { computed, useTemplateRef, toRefs, ref, shallowRef, onUnmounted } from 'vue'
import { useSwipe } from '@vueuse/core'
import { useCalendar } from './hooks/useCalendar.js'
import { isSameDay, createWeekdays } from './utils'
import { icons } from './utils/icons.js'

const swipeRef = useTemplateRef('swp')
const containerRef = useTemplateRef('container')

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
  },
  // 是否启用火把光迹效果
  torchEffect: {
    type: Boolean,
    default: false
  },
  // 火把光团大小
  torchSize: {
    type: Number,
    default: 120
  },
  // 火把照亮范围（像素）
  torchRange: {
    type: Number,
    default: 180
  },
  // 火把缓动系数（越小越慢）
  torchEasing: {
    type: Number,
    default: 0.15
  },
  // 光影残留持续时间（毫秒）
  trailDuration: {
    type: Number,
    default: 800
  },
  // 光影残留数量
  trailCount: {
    type: Number,
    default: 15
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

// ==================== 火把光迹效果相关逻辑 ====================

// 火把是否激活
const isTorchActive = ref(false)
// 是否正在淡出
const isFadingOut = ref(false)
// 火把光团位置（缓动后的实际位置）
const torchX = ref(0)
const torchY = ref(0)
// 鼠标目标位置
const targetX = ref(0)
const targetY = ref(0)
// 动画帧ID
let animationFrameId = null
// 日期格子引用映射
const dayRefs = shallowRef(new Map())
// 光影残留列表
const trailList = ref([])
// 光影残留ID计数器
let trailIdCounter = 0
// 上一个添加残留的位置
let lastTrailPosition = { x: -1, y: -1 }
// 上一次鼠标位置
let lastMousePosition = { x: -1, y: -1 }

// 设置日期格子引用
function setDayRef(key, el) {
  if (el) {
    dayRefs.value.set(key, el)
  } else {
    dayRefs.value.delete(key)
  }
}

// 计算两点之间的距离
function _getDistance(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
}

// 计算火把对日期格子的照亮样式
function _getTorchGlowStyle(key) {
  if (!props.torchEffect || !isTorchActive.value) return null

  const dayEl = dayRefs.value.get(key)
  if (!dayEl) return null

  const rect = dayEl.getBoundingClientRect()
  const containerRect = dayEl.closest('.ohhh-calendar-container')?.getBoundingClientRect()
  if (!containerRect) return null

  // 计算格子中心相对于容器的位置
  const dayCenterX = rect.left + rect.width / 2 - containerRect.left
  const dayCenterY = rect.top + rect.height / 2 - containerRect.top

  // 计算与火把光团的距离
  const distance = _getDistance(torchX.value, torchY.value, dayCenterX, dayCenterY)

  // 计算照亮强度（距离越近，强度越高）
  const maxRange = props.torchRange
  if (distance >= maxRange) return null

  const intensity = Math.max(0, 1 - distance / maxRange)

  // 应用柔和的照亮效果
  return {
    '--torch-glow-intensity': intensity
  }
}

// 动画循环 - 火把缓动跟随
function _animateLoop() {
  if (!isTorchActive.value && !isFadingOut.value) return

  // 缓动计算
  const dx = targetX.value - torchX.value
  const dy = targetY.value - torchY.value

  torchX.value += dx * props.torchEasing
  torchY.value += dy * props.torchEasing

  // 检查是否需要添加光影残留
  const currentDistance = _getDistance(
    lastTrailPosition.x,
    lastTrailPosition.y,
    torchX.value,
    torchY.value
  )

  // 只有移动了足够距离才添加残留
  if (currentDistance > 15) {
    _addTrail(torchX.value, torchY.value)
    lastTrailPosition = { x: torchX.value, y: torchY.value }
  }

  // 更新光影残留的透明度和大小
  _updateTrails()

  animationFrameId = requestAnimationFrame(_animateLoop)
}

// 添加光影残留
function _addTrail(x, y) {
  const now = Date.now()
  const newTrail = {
    id: ++trailIdCounter,
    x: x,
    y: y,
    createdAt: now,
    opacity: 0.6,
    scale: 1
  }

  trailList.value.push(newTrail)

  // 限制残留数量
  if (trailList.value.length > props.trailCount) {
    trailList.value.shift()
  }
}

// 更新光影残留
function _updateTrails() {
  const now = Date.now()

  trailList.value = trailList.value.filter((trail) => {
    const age = now - trail.createdAt
    if (age > props.trailDuration) return false

    // 计算透明度衰减
    const progress = age / props.trailDuration
    trail.opacity = 0.6 * (1 - progress)
    // 残留稍微放大，模拟扩散效果
    trail.scale = 1 + progress * 0.5

    return true
  })
}

// 鼠标进入容器
function onMouseEnter(e) {
  if (!props.torchEffect) return

  // 获取容器元素
  const container = e.currentTarget
  const rect = container.getBoundingClientRect()

  // 初始化火把位置
  const initialX = e.clientX - rect.left
  const initialY = e.clientY - rect.top

  targetX.value = initialX
  targetY.value = initialY
  torchX.value = initialX
  torchY.value = initialY

  lastTrailPosition = { x: initialX, y: initialY }
  lastMousePosition = { x: initialX, y: initialY }

  // 激活火把
  isFadingOut.value = false
  isTorchActive.value = true

  // 开始动画循环
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }
  _animateLoop()
}

// 鼠标移动
function onMouseMove(e) {
  if (!props.torchEffect || !isTorchActive.value) return

  const container = e.currentTarget
  const rect = container.getBoundingClientRect()

  // 更新目标位置
  targetX.value = e.clientX - rect.left
  targetY.value = e.clientY - rect.top

  lastMousePosition = { x: targetX.value, y: targetY.value }
}

// 鼠标离开容器
function onMouseLeave() {
  if (!props.torchEffect) return

  // 开始淡出效果
  isFadingOut.value = true

  // 延迟后完全隐藏
  setTimeout(() => {
    if (isFadingOut.value) {
      isTorchActive.value = false
      isFadingOut.value = false
      trailList.value = []
    }
  }, 300)

  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
}

// 组件卸载时清理动画
onUnmounted(() => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }
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
