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
    <!-- 火把多层光团 -->
    <template v-if="torchEffect">
      <!-- 核心层（最亮） -->
      <div
        class="torch-layer torch-layer-core"
        :class="{ 'torch-orb-active': isTorchActive, 'torch-orb-fade-out': isFadingOut }"
        :style="{
          left: torchX + coreOffsetX + 'px',
          top: torchY + coreOffsetY + 'px',
          '--torch-pulse-scale': coreScale,
          '--torch-opacity': coreOpacity
        }"
      />
      <!-- 中间层 -->
      <div
        class="torch-layer torch-layer-mid"
        :class="{ 'torch-orb-active': isTorchActive, 'torch-orb-fade-out': isFadingOut }"
        :style="{
          left: torchX + midOffsetX + 'px',
          top: torchY + midOffsetY + 'px',
          '--torch-pulse-scale': midScale,
          '--torch-opacity': midOpacity
        }"
      />
      <!-- 外层（最暗最大） -->
      <div
        class="torch-layer torch-layer-outer"
        :class="{ 'torch-orb-active': isTorchActive, 'torch-orb-fade-out': isFadingOut }"
        :style="{
          left: torchX + outerOffsetX + 'px',
          top: torchY + outerOffsetY + 'px',
          '--torch-pulse-scale': outerScale,
          '--torch-opacity': outerOpacity
        }"
      />
    </template>

    <!-- 火花粒子容器 -->
    <div v-if="torchEffect" class="torch-sparks">
      <div
        v-for="spark in sparkList"
        :key="spark.id"
        class="torch-spark"
        :class="[
          spark.size === 'small' ? 'spark-small' : spark.size === 'large' ? 'spark-large' : 'spark-medium'
        ]"
        :style="{
          left: spark.x + 'px',
          top: spark.y + 'px',
          '--spark-opacity': spark.opacity,
          '--spark-scale': spark.scale,
          '--spark-rotation': spark.rotation + 'deg'
        }"
      />
    </div>

    <!-- 火把光影残留容器 -->
    <div v-if="torchEffect" class="torch-trails">
      <div
        v-for="trail in trailList"
        :key="trail.id"
        class="torch-trail"
        :class="trail.type === 'ember' ? 'torch-trail-ember' : 'torch-trail-glow'"
        :style="{
          left: trail.x + 'px',
          top: trail.y + 'px',
          '--trail-opacity': trail.opacity,
          '--trail-scale': trail.scale,
          '--trail-rotation': trail.rotation + 'deg'
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
          :style="_getTorchGlowStyle(dateObj.key, dateObj)"
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
  // 光影残留持续时间基准（毫秒）
  trailDuration: {
    type: Number,
    default: 800
  },
  // 光影残留数量基准
  trailCount: {
    type: Number,
    default: 8
  },
  // 火花生成频率（每帧生成概率 0-1）
  sparkRate: {
    type: Number,
    default: 0.15
  },
  // 最大火花数量
  maxSparks: {
    type: Number,
    default: 6
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

// ==================== 火把光迹效果相关逻辑（性能优化版） ====================

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
// 火花粒子列表
const sparkList = ref([])
// 光影残留ID计数器
let trailIdCounter = 0
// 火花ID计数器
let sparkIdCounter = 0
// 上一个添加残留的位置
let lastTrailPosition = { x: -1, y: -1 }
// 上一次鼠标位置
let lastMousePosition = { x: -1, y: -1 }
// 动画时间计数器（用于生成噪声）
let animationTime = 0
// 格子余烬状态映射（记录每个格子的余烬状态）
const emberStates = shallowRef(new Map())

// ==================== 性能优化相关状态 ====================

// 节流计数器（每 N 帧执行一次某些操作）
let frameCounter = 0
// 上一次计算的火把位置（用于检测是否需要重新计算照亮）
let lastTorchX = 0
let lastTorchY = 0
// 日期格子照亮样式缓存（避免每帧计算所有格子）
const dayGlowStyles = shallowRef(new Map())
// 预计算的随机相位（用于简化的噪声计算）
const randPhases = {
  coreX: Math.random() * Math.PI * 2,
  coreY: Math.random() * Math.PI * 2,
  midX: Math.random() * Math.PI * 2,
  midY: Math.random() * Math.PI * 2,
  outerX: Math.random() * Math.PI * 2,
  outerY: Math.random() * Math.PI * 2
}
// 容器引用缓存
let containerCachedRect = null
// 日期格子位置缓存（key -> {x, y, width, height}）
const dayPositionsCache = new Map()

// 多层光团的实时参数（响应式）
const coreOffsetX = ref(0)
const coreOffsetY = ref(0)
const coreScale = ref(1)
const coreOpacity = ref(1)

const midOffsetX = ref(0)
const midOffsetY = ref(0)
const midScale = ref(1)
const midOpacity = ref(1)

const outerOffsetX = ref(0)
const outerOffsetY = ref(0)
const outerScale = ref(1)
const outerOpacity = ref(1)

// ==================== 简化的数学工具函数（性能优化） ====================

// 范围映射（保留）
function _map(value, inMin, inMax, outMin, outMax) {
  return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin
}

// 幂函数衰减曲线（保留，用于自然的先快后慢衰减）
function _powerDecay(t, power = 1.5) {
  return Math.max(0, 1 - Math.pow(t, power))
}

// 计算两点距离（保留）
function _getDistance(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
}

// ==================== 核心逻辑 ====================

// 设置日期格子引用
function setDayRef(key, el) {
  if (el) {
    dayRefs.value.set(key, el)
    // 清除位置缓存，下次计算时重新获取
    dayPositionsCache.delete(key)
  } else {
    dayRefs.value.delete(key)
    dayPositionsCache.delete(key)
  }
}

// 清除所有缓存（在页面切换或窗口 resize 时调用）
function _clearAllCaches() {
  containerCachedRect = null
  dayPositionsCache.clear()
}

// 更新多层光团的扰动（性能优化版：用简单的 sin/cos 组合替代复杂噪声）
function _updateTorchLayers() {
  const t = animationTime * 0.016 // 约 60fps 的时间步

  // ========== 核心层（最亮、最小、最快抖动） ==========
  // 用 sin 组合替代复杂噪声
  const coreNoiseX = Math.sin(t * 8 + randPhases.coreX) * 0.6 + Math.sin(t * 15 + randPhases.coreY) * 0.4
  const coreNoiseY = Math.sin(t * 9 + randPhases.coreY) * 0.6 + Math.sin(t * 16 + randPhases.coreX) * 0.4

  coreOffsetX.value = coreNoiseX * 8 // 小幅度
  coreOffsetY.value = coreNoiseY * 8 - 5 // 稍微向上偏移（火焰向上）

  // 核心层脉动（高频小幅度）
  const corePulse = 1 + Math.sin(t * 12) * 0.08 + Math.sin(t * 17) * 0.05
  coreScale.value = corePulse

  // 核心层透明度（有轻微闪烁）
  const coreFlicker = 0.95 + Math.sin(t * 20 + randPhases.coreX) * 0.05
  coreOpacity.value = coreFlicker

  // ========== 中间层（中等大小、中等速度） ==========
  const midNoiseX = Math.sin(t * 5 + randPhases.midX) * 0.7 + Math.sin(t * 11 + randPhases.midY) * 0.3
  const midNoiseY = Math.sin(t * 6 + randPhases.midY) * 0.7 + Math.sin(t * 12 + randPhases.midX) * 0.3

  midOffsetX.value = midNoiseX * 15 // 中等幅度
  midOffsetY.value = midNoiseY * 15 - 10 // 向上偏移更多

  // 中间层脉动（中频中幅度）
  const midPulse = 1 + Math.sin(t * 8) * 0.12 + Math.sin(t * 13) * 0.08
  midScale.value = midPulse

  // 中间层透明度
  const midFlicker = 0.9 + Math.sin(t * 15 + randPhases.midX) * 0.1
  midOpacity.value = midFlicker

  // ========== 外层（最大、最慢、最暗） ==========
  const outerNoiseX = Math.sin(t * 3 + randPhases.outerX) * 0.8 + Math.sin(t * 7 + randPhases.outerY) * 0.2
  const outerNoiseY = Math.sin(t * 4 + randPhases.outerY) * 0.8 + Math.sin(t * 8 + randPhases.outerX) * 0.2

  outerOffsetX.value = outerNoiseX * 25 // 大幅度
  outerOffsetY.value = outerNoiseY * 25 - 15 // 向上偏移最多

  // 外层脉动（低频大幅度）
  const outerPulse = 1 + Math.sin(t * 5) * 0.15 + Math.sin(t * 9) * 0.1
  outerScale.value = outerPulse

  // 外层透明度（变化更缓慢）
  const outerFlicker = 0.85 + Math.sin(t * 10 + randPhases.outerX) * 0.15
  outerOpacity.value = outerFlicker
}

// 生成新的火花（性能优化版：只有火把移动时才生成，且降低频率）
function _spawnSparks() {
  if (sparkList.value.length >= props.maxSparks) return

  // 只有当火把移动时才生成火花（静止时不生成）
  const moveDistance = _getDistance(lastTorchX, lastTorchY, torchX.value, torchY.value)
  if (moveDistance < 2) return // 几乎没移动，不生成火花

  // 降低生成频率：每 3 帧才有概率生成
  if (frameCounter % 3 !== 0) return
  if (Math.random() > props.sparkRate) return

  // 火花从火焰顶部生成（稍微随机的位置）
  // 用简单的 sin 替代复杂的 _smoothNoise
  const baseX = torchX.value + Math.sin(animationTime * 0.08 + randPhases.coreX) * 20
  const baseY = torchY.value - 30 + Math.sin(animationTime * 0.06 + randPhases.midX) * 15

  // 随机选择火花大小类型（减少类型数量，简化）
  const sizeRoll = Math.random()
  let size = 'medium'
  if (sizeRoll < 0.6) size = 'small' // 更多小火花
  else size = 'medium' // 简化为只有两种大小

  const newSpark = {
    id: ++sparkIdCounter,
    x: baseX,
    y: baseY,
    // 速度：向上为主，有轻微水平分量
    vx: _map(Math.random(), 0, 1, -1.2, 1.2),
    vy: _map(Math.random(), 0, 1, -3.5, -1.8), // 向上是负y
    // 重力加速度（模拟真实物理）
    gravity: 0.04,
    // 初始透明度和缩放
    opacity: 1,
    scale: 1,
    // 生命周期（简化，缩短）
    life: 0,
    maxLife: size === 'small' ? 25 + Math.random() * 15 : 35 + Math.random() * 20,
    // 大小类型
    size: size,
    // 旋转角度（简化，不使用）
    rotation: 0,
    rotationSpeed: 0,
    // 闪烁（简化）
    flickerPhase: Math.random() * Math.PI * 2,
    flickerSpeed: _map(Math.random(), 0, 1, 6, 12)
  }

  sparkList.value.push(newSpark)
}

// 更新火花位置和状态（保留，但简化计算）
function _updateSparks() {
  animationTime++

  sparkList.value = sparkList.value.filter((spark) => {
    spark.life++

    // 应用速度
    spark.vy += spark.gravity // 重力向下拉
    spark.x += spark.vx
    spark.y += spark.vy

    // 计算生命周期进度
    const t = spark.life / spark.maxLife

    // 透明度：使用幂函数衰减（先快后慢）
    // 简化闪烁计算
    const flicker = 0.85 + Math.sin(spark.flickerPhase + animationTime * 0.016 * spark.flickerSpeed) * 0.15
    spark.opacity = _powerDecay(t, 1.2) * flicker

    // 缩放：稍微缩小
    spark.scale = Math.max(0.25, 1 - t * 0.5)

    // 简化空气阻力
    spark.vx *= 0.99
    spark.vy *= 0.99

    return t < 1 && spark.opacity > 0.02
  })
}

// 添加余烬类型的光影残留（性能优化版：降低频率）
function _addEmberTrail(x, y) {
  const now = Date.now()

  const newTrail = {
    id: ++trailIdCounter,
    type: 'ember',
    x: x + (Math.random() - 0.5) * 4,
    y: y + (Math.random() - 0.5) * 4,
    createdAt: now,
    baseOpacity: 0.3 + Math.random() * 0.3,
    opacity: 0.3 + Math.random() * 0.3,
    scale: 1,
    rotation: Math.random() * 360,
    duration: props.trailDuration * (0.6 + Math.random() * 0.4),
    decayPower: 1.3 + Math.random() * 0.5
  }

  trailList.value.push(newTrail)

  if (trailList.value.length > props.trailCount) {
    trailList.value.shift()
  }
}

// 添加辉光类型的光影残留（主拖尾）
function _addGlowTrail(x, y) {
  const now = Date.now()

  const newTrail = {
    id: ++trailIdCounter,
    type: 'glow',
    x: x,
    y: y,
    createdAt: now,
    baseOpacity: 0.4,
    opacity: 0.4,
    scale: 1,
    rotation: 0,
    duration: props.trailDuration * 0.7,
    decayPower: 1.4
  }

  trailList.value.push(newTrail)
}

// 更新光影残留（保留核心逻辑）
function _updateTrails() {
  const now = Date.now()

  trailList.value = trailList.value.filter((trail) => {
    const age = now - trail.createdAt
    if (age > trail.duration) return false

    const t = age / trail.duration

    trail.opacity = trail.baseOpacity * _powerDecay(t, trail.decayPower)

    if (trail.type === 'ember') {
      const flicker = 0.92 + Math.sin(animationTime * 0.016 * 6 + trail.id) * 0.08
      trail.opacity *= flicker
      trail.scale = t < 0.2 ? 1 + t * 0.3 : 1 + 0.06 - (t - 0.2) * 0.1
    } else {
      trail.scale = 1 + t * 0.6
    }

    return trail.opacity > 0.03
  })
}

// ==================== 性能优化：重构日期格子照亮逻辑 ====================
// 问题：_getTorchGlowStyle 在模板中被每帧调用，每次都做昂贵的 getBoundingClientRect()
// 解决方案：
// 1. 缓存日期格子位置
// 2. 在动画循环中批量计算，而不是模板渲染时
// 3. 使用 dayGlowStyles 缓存样式
// 4. 节流：每 2 帧计算一次

// 获取单个日期格子的位置（带缓存）
function _getDayPosition(key) {
  // 检查缓存
  let cached = dayPositionsCache.get(key)
  if (cached) return cached

  // 没有缓存，重新计算
  const dayEl = dayRefs.value.get(key)
  if (!dayEl) return null

  const rect = dayEl.getBoundingClientRect()

  // 缓存容器位置（只计算一次）
  if (!containerCachedRect) {
    const containerEl = dayEl.closest('.ohhh-calendar-container')
    if (!containerEl) return null
    containerCachedRect = containerEl.getBoundingClientRect()
  }

  cached = {
    x: rect.left + rect.width / 2 - containerCachedRect.left,
    y: rect.top + rect.height / 2 - containerCachedRect.top
  }

  dayPositionsCache.set(key, cached)
  return cached
}

// 批量更新日期格子的照亮样式（在动画循环中调用）
function _updateDayGlowStyles() {
  if (!isTorchActive.value) return

  const flameCenterX = torchX.value
  const flameCenterY = torchY.value - 10
  const maxRange = props.torchRange
  const now = Date.now()

  // 遍历所有有引用的格子
  for (const [key, _el] of dayRefs.value.entries()) {
    const pos = _getDayPosition(key)
    if (!pos) continue

    const distance = _getDistance(flameCenterX, flameCenterY, pos.x, pos.y)
    const existingEmber = emberStates.value.get(key)

    if (distance >= maxRange) {
      // 在照亮范围外
      if (existingEmber && existingEmber.opacity > 0.02) {
        dayGlowStyles.value.set(key, {
          '--torch-glow-intensity': 0,
          '--torch-ember-intensity': existingEmber.opacity,
          '--torch-ember-rand': existingEmber.randFactor
        })
      } else {
        dayGlowStyles.value.delete(key)
      }
      continue
    }

    // 在照亮范围内
    const intensity = Math.max(0, 1 - distance / maxRange)

    // 简化的闪烁（用 sin 替代复杂噪声）
    const flickerIntensity = 0.92 + Math.sin(animationTime * 0.016 * 4 + pos.x * 0.005 + pos.y * 0.003) * 0.08
    const finalIntensity = intensity * flickerIntensity

    // 记录被照亮的格子
    if (intensity > 0.5) {
      if (!existingEmber) {
        emberStates.value.set(key, {
          key: key,
          lastBrightTime: now,
          opacity: 0,
          randFactor: Math.random()
        })
      } else {
        existingEmber.lastBrightTime = now
      }
    }

    // 计算余烬强度
    let emberIntensity = 0
    if (existingEmber) {
      const timeSinceBright = now - existingEmber.lastBrightTime
      if (intensity < 0.3 && timeSinceBright > 50) {
        const emberT = timeSinceBright / (props.trailDuration * 0.8)
        if (emberT < 1) {
          if (emberT < 0.1) {
            emberIntensity = emberT * 10 * (0.25 + existingEmber.randFactor * 0.35)
          } else {
            emberIntensity = (0.25 + existingEmber.randFactor * 0.35) * _powerDecay((emberT - 0.1) / 0.9, 1.2 + existingEmber.randFactor * 0.4)
          }
          existingEmber.opacity = emberIntensity
        } else {
          existingEmber.opacity = 0
        }
      } else {
        existingEmber.opacity = 0
      }
    }

    dayGlowStyles.value.set(key, {
      '--torch-glow-intensity': finalIntensity,
      '--torch-ember-intensity': emberIntensity,
      '--torch-ember-rand': existingEmber ? existingEmber.randFactor : 0
    })
  }
}

// 从缓存中获取日期格子的照亮样式（模板中调用的函数）
function _getTorchGlowStyle(key, dateObj) {
  if (!props.torchEffect || !isTorchActive.value) return null

  const cached = dayGlowStyles.value.get(key)
  if (cached) return cached

  return {
    '--torch-glow-intensity': 0,
    '--torch-ember-intensity': 0
  }
}

// 清理过期的余烬状态
function _cleanupOldEmberStates() {
  const now = Date.now()
  const maxAge = props.trailDuration * 2

  for (const [key, state] of emberStates.value.entries()) {
    if (now - state.lastBrightTime > maxAge) {
      emberStates.value.delete(key)
    }
  }
}

// 动画循环 - 火把缓动跟随（性能优化版：增加节流）
function _animateLoop() {
  if (!isTorchActive.value && !isFadingOut.value) return

  // 帧计数器增加
  frameCounter++

  // 记录上一次的火把位置
  lastTorchX = torchX.value
  lastTorchY = torchY.value

  // 缓动计算
  const dx = targetX.value - torchX.value
  const dy = targetY.value - torchY.value

  torchX.value += dx * props.torchEasing
  torchY.value += dy * props.torchEasing

  // ========== 节流：每 2 帧更新一次光团扰动 ==========
  if (frameCounter % 2 === 0) {
    _updateTorchLayers()
  }

  // 生成和更新火花
  _spawnSparks()
  _updateSparks()

  // 检查是否需要添加光影残留（增加距离阈值）
  const currentDistance = _getDistance(
    lastTrailPosition.x,
    lastTrailPosition.y,
    torchX.value,
    torchY.value
  )

  // 只有移动了足够距离才添加残留（从 12px 增加到 20px）
  if (currentDistance > 20) {
    // 添加辉光拖尾
    _addGlowTrail(torchX.value, torchY.value)

    // 降低余烬拖尾概率：从 0.5 降到 0.25
    if (Math.random() > 0.75) {
      _addEmberTrail(torchX.value, torchY.value)
    }

    lastTrailPosition = { x: torchX.value, y: torchY.value }
  }

  // 更新光影残留
  _updateTrails()

  // ========== 节流：每 2 帧更新一次日期格子照亮 ==========
  if (frameCounter % 2 === 0) {
    _updateDayGlowStyles()
  }

  // 定期清理余烬状态（每 60 帧）
  if (frameCounter % 60 === 0) {
    _cleanupOldEmberStates()
  }

  animationFrameId = requestAnimationFrame(_animateLoop)
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
  lastTorchX = initialX
  lastTorchY = initialY

  // 重置动画时间和帧计数器
  animationTime = 0
  frameCounter = 0

  // 清除所有缓存（确保每次进入都是干净状态）
  _clearAllCaches()
  dayGlowStyles.value.clear()

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
      sparkList.value = []
      emberStates.value.clear()
      dayGlowStyles.value.clear()
      _clearAllCaches()
    }
  }, 400)

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
