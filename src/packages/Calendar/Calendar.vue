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
      @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
      @touchcancel="onTouchEnd"
    >
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
          @click="handleDayClick(dateObj)"
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
import { computed, useTemplateRef, toRefs, ref } from 'vue'
import { useCalendar } from './hooks/useCalendar.js'
import { isSameDay, createWeekdays } from './utils'
import { icons } from './utils/icons.js'

const swipeRef = useTemplateRef('swp')

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

// 触摸滑动状态
const touchStartX = ref(0)
const touchStartY = ref(0)
const touchCurrentX = ref(0)
const touchCurrentY = ref(0)
const isDragging = ref(false)
// 是否发生了滑动（用于判断是否阻止点击）
const hasSwiped = ref(false)

// 滑动阈值（像素）- 小于此值视为点击
const SWIPE_THRESHOLD = 10
// 切换阈值（百分比）- 滑动超过容器宽度的此比例时触发月份/周切换
const SWITCH_THRESHOLD = 0.3
// 阻尼开始阈值（百分比）- 滑动超过此比例后应用阻尼效果
const DAMPING_START_THRESHOLD = 0.5
// 阻尼系数 - 超过阻尼阈值后，实际偏移 = 阻尼阈值 + (剩余偏移 * 阻尼系数)
const DAMPING_FACTOR = 0.3

// 获取容器宽度
function getContainerWidth() {
  return swipeRef.value?.offsetWidth || 0
}

// 计算带阻尼的偏移百分比
function calculateDampedOffset(deltaX, containerWidth) {
  const rawPercent = (deltaX / containerWidth) * 100
  const absRawPercent = Math.abs(rawPercent)

  // 如果在阻尼阈值内，直接返回原始偏移
  if (absRawPercent <= DAMPING_START_THRESHOLD * 100) {
    return rawPercent
  }

  // 超过阻尼阈值后应用阻尼
  const sign = deltaX >= 0 ? 1 : -1
  const dampingStartPercent = DAMPING_START_THRESHOLD * 100
  const excessPercent = absRawPercent - dampingStartPercent
  const dampedExcess = excessPercent * DAMPING_FACTOR

  return sign * (dampingStartPercent + dampedExcess)
}

// 触摸开始
function onTouchStart(event) {
  if (isInTransition.value) return
  const touch = event.touches[0]
  touchStartX.value = touch.clientX
  touchStartY.value = touch.clientY
  touchCurrentX.value = touch.clientX
  touchCurrentY.value = touch.clientY
  isDragging.value = true
  hasSwiped.value = false
  transitionDuration.value = '0s'
}

// 触摸移动
function onTouchMove(event) {
  if (!isDragging.value || isInTransition.value) return
  const touch = event.touches[0]
  touchCurrentX.value = touch.clientX
  touchCurrentY.value = touch.clientY

  const deltaX = touchCurrentX.value - touchStartX.value
  const deltaY = touchCurrentY.value - touchStartY.value

  // 检测是否发生了滑动（超过阈值）
  if (Math.abs(deltaX) > SWIPE_THRESHOLD || Math.abs(deltaY) > SWIPE_THRESHOLD) {
    hasSwiped.value = true
  }

  // 主要是水平滑动时才处理偏移
  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    const containerWidth = getContainerWidth()
    if (containerWidth > 0) {
      // 计算带阻尼的偏移百分比
      const offsetPercent = calculateDampedOffset(deltaX, containerWidth)
      transformDistance.value = `${offsetPercent}%`
    }
  }
}

// 触摸结束
function onTouchEnd() {
  if (!isDragging.value || isInTransition.value) {
    isDragging.value = false
    return
  }
  isDragging.value = false

  const deltaX = touchCurrentX.value - touchStartX.value
  const deltaY = touchCurrentY.value - touchStartY.value

  const absDeltaX = Math.abs(deltaX)
  const absDeltaY = Math.abs(deltaY)

  // 如果是点击（滑动距离很小）或垂直滑动为主
  if (!hasSwiped.value || absDeltaY > absDeltaX) {
    startTransitionAnimation(null)
    return
  }

  const containerWidth = getContainerWidth()
  if (containerWidth === 0) {
    startTransitionAnimation(null)
    return
  }

  // 计算实际滑动距离占容器宽度的比例（使用原始距离，而非带阻尼的距离）
  const swipeRatio = absDeltaX / containerWidth

  // 超过切换阈值才触发月份/周切换
  if (swipeRatio >= SWITCH_THRESHOLD) {
    if (deltaX < 0) {
      // 向左滑动，切换到下一个月/周
      changePageTo('next-page')
    } else {
      // 向右滑动，切换到上一个月/周
      changePageTo('prev-page')
    }
  } else {
    // 未达到切换阈值，复位
    startTransitionAnimation(null)
  }
}

// 处理日期点击
function handleDayClick(dateObj) {
  // 只有当没有发生滑动时才触发点击
  if (!hasSwiped.value) {
    changeSelectedDate(dateObj.date)
  }
}

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

defineExpose({
  // 切换周/月视图
  toggleViewMode,
  // 切换日历页
  changePageTo,
  // 切换选中日期
  changeSelectedDate
})
</script>
