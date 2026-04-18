<template>
  <div
    ref="calendarContainerRef"
    class="ohhh-calendar-container"
    role="application"
    aria-label="日历"
    tabindex="0"
    @keydown="onKeydown"
    @focus="onContainerFocus"
    @blur="onContainerBlur"
    :style="{
      '--calendar-rows': renderRows,
      '--calendar-transition-duration': duration,
      '--translate-distance': transformDistance,
      '--transition-duration': transitionDuration
    }"
  >
    <!-- 顶部工具栏 -->
    <div v-if="showToolbar" class="ohhh-calendar-toolbar" role="toolbar" aria-label="日历导航">
      <slot name="toolbar" :year="currentYear" :month="currentMonth" :viewMode="viewMode">
        <button
          class="ohhh-calendar-toolbar--icon"
          aria-label="上一年"
          @click="changePageTo('prev-year')"
          tabindex="-1"
        >
          <span v-html="icons.arrowDoubleLeft"></span>
        </button>
        <button
          class="ohhh-calendar-toolbar--icon"
          aria-label="上一月"
          @click="changePageTo('prev-page')"
          tabindex="-1"
        >
          <span v-html="icons.arrowLeft"></span>
        </button>
        <div class="ohhh-calendar-toolbar--text" role="status" aria-live="polite">
          {{ headerLabel }}
        </div>
        <button
          class="ohhh-calendar-toolbar--icon"
          aria-label="下一月"
          @click="changePageTo('next-page')"
          tabindex="-1"
        >
          <span v-html="icons.arrowRight"></span>
        </button>
        <button
          class="ohhh-calendar-toolbar--icon"
          aria-label="下一年"
          @click="changePageTo('next-year')"
          tabindex="-1"
        >
          <span v-html="icons.arrowDoubleRight"></span>
        </button>
      </slot>
    </div>

    <!-- 星期栏 -->
    <div v-if="showWeekdays" class="ohhh-calendar-weekdays" role="row">
      <div
        v-for="(day, index) in weekdays"
        :key="day"
        class="ohhh-calendar-weekdays--weekday"
        role="columnheader"
        :aria-label="day"
      >
        <slot name="weekday" :weekday="day" :index="(index + weekStart) % 7">{{ day }}</slot>
      </div>
    </div>

    <!-- 日历主体 -->
    <div
      ref="swp"
      class="ohhh-calendar-wrapper"
      role="grid"
      :aria-label="viewMode === 'month' ? '月视图' : '周视图'"
      aria-readonly="false"
    >
      <div
        v-for="(item, pageIndex) in allRenderDates"
        :key="pageIndex"
        :style="{ left: 100 * (pageIndex - 1) + '%' }"
        class="ohhh-calendar-days"
        @transitionend="onTransitionEndWrapper"
      >
        <div
          v-for="(dateObj, dateIndex) in item"
          :key="dateObj.key"
          ref="el => setDayRef(dateObj.key, el)"
          class="ohhh-calendar-day"
          :class="{
            'is-selected': isSameDay(dateObj.date, selected),
            'is-today': isSameDay(dateObj.date, new Date()),
            'is-focused': isFocusedDate(dateObj.date),
            'other-month': !dateObj.current
          }"
          role="gridcell"
          tabindex="-1"
          :aria-selected="isSameDay(dateObj.date, selected)"
          :aria-label="getAccessibleDateLabel(dateObj)"
          @click="onDayClick(dateObj)"
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
    <div v-if="showFooter" class="ohhh-calendar-footer" role="toolbar" aria-label="视图切换">
      <slot name="footer" :year="currentYear" :month="currentMonth" :viewMode="viewMode">
        <button
          class="ohhh-calendar-footer--icon"
          :aria-label="viewMode === 'week' ? '切换到月视图' : '切换到周视图'"
          @click="toggleViewMode"
          tabindex="-1"
        >
          <span v-html="viewMode === 'week' ? icons.arrowDown : icons.arrowUp"></span>
        </button>
      </slot>
    </div>

    <!-- 键盘导航提示（仅在获得焦点时显示给屏幕阅读器） -->
    <div class="sr-only" aria-live="polite" v-if="showKeyboardHint">
      使用方向键导航日期，Enter 或空格键选择日期，PageUp/PageDown 切换{{ viewMode === 'month' ? '月份' : '周'}}
    </div>
  </div>
</template>

<script setup>
import { computed, useTemplateRef, toRefs, ref, watch, nextTick } from 'vue'
import { useSwipe } from '@vueuse/core'
import { useCalendar } from './hooks/useCalendar.js'
import { isSameDay, createWeekdays, addDays } from './utils'
import { icons } from './utils/icons.js'

const swipeRef = useTemplateRef('swp')
const calendarContainerRef = useTemplateRef('calendarContainerRef')

const emit = defineEmits(['select-change', 'view-change', 'focus-change'])

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
  // 是否启用键盘导航
  keyboardNavigation: {
    type: Boolean,
    default: true
  }
})

const { initialSelectedDate, initialViewMode, weekStart, markerDates, duration, keyboardNavigation } = toRefs(props)

const {
  selected,
  focusedDate,
  viewMode,
  currentYear,
  currentMonth,
  currentRenderDates,
  allRenderDates,
  transformDistance,
  transitionDuration,
  isInTransition,
  renderRows,
  keyboardNavigationEnabled,
  switchPageToTargetDate,
  startTransitionAnimation,
  onTransitionEnd,
  toggleViewMode,
  handleKeydown,
  isSameDay: calendarIsSameDay
} = useCalendar({ initialSelectedDate, initialViewMode, weekStart, duration }, emit)

// 同步键盘导航开关
keyboardNavigationEnabled.value = keyboardNavigation.value

// 日期元素的 ref 映射表
const dayRefs = ref(new Map())

// 日历容器是否获得焦点
const isContainerFocused = ref(false)

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

// 是否显示键盘导航提示
const showKeyboardHint = computed(() => isContainerFocused.value && keyboardNavigationEnabled.value)

// 检查日期是否是当前焦点日期
function isFocusedDate(date) {
  return focusedDate.value && isSameDay(date, focusedDate.value)
}

// 生成日期的唯一键
function _getDateKey(date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
}

// 设置日期元素的 ref
function setDayRef(key, el) {
  if (el) {
    dayRefs.value.set(key, el)
  } else {
    dayRefs.value.delete(key)
  }
}

// 获取日期元素的 ref
function getDayRef(date) {
  const key = _getDateKey(date)
  return dayRefs.value.get(key)
}

// 聚焦到容器（确保键盘事件能被捕获）
function focusToContainer() {
  nextTick(() => {
    if (calendarContainerRef.value && typeof calendarContainerRef.value.focus === 'function') {
      calendarContainerRef.value.focus({ preventScroll: true })
    }
  })
}

// 获取无障碍日期标签
function getAccessibleDateLabel(dateObj) {
  const date = dateObj.date
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekdaysCN = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  const weekday = weekdaysCN[date.getDay()]
  
  let label = `${year}年${month}月${day}日，${weekday}`
  
  if (!dateObj.current) {
    label = '非当前月，' + label
  }
  if (isSameDay(date, selected.value)) {
    label = '已选中，' + label
  }
  if (isSameDay(date, new Date())) {
    label = '今天，' + label
  }
  
  return label
}

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

// 动画结束包装器
function onTransitionEndWrapper() {
  onTransitionEnd()
  // 动画结束后，确保容器获得焦点
  focusToContainer()
}

// 获取 marker 颜色
function _getMarkerColor(date) {
  return markerDateList.value.find(d => isSameDay(d.date, date))?.color
}

// ==================== 事件处理 ====================

// 日期格子点击事件
function onDayClick(dateObj) {
  // 点击时更新焦点日期
  focusedDate.value = new Date(dateObj.date)
  // 让容器获得焦点（确保键盘事件能被捕获）
  focusToContainer()
  // 然后选中该日期
  changeSelectedDate(dateObj.date)
}

// 日历容器获得焦点
function onContainerFocus() {
  isContainerFocused.value = true
}

// 日历容器失去焦点
function onContainerBlur() {
  isContainerFocused.value = false
}

// 日历容器键盘事件
function onKeydown(event) {
  if (!keyboardNavigationEnabled.value) return
  
  // 动画期间禁用键盘操作（除了 Enter/Space 选中当前焦点日期）
  if (isInTransition.value) {
    // 动画期间只允许选中当前焦点日期
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (focusedDate.value) {
        changeSelectedDate(focusedDate.value)
      }
    }
    return
  }
  
  // 处理 Enter 和 Space 键选中日期
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    if (focusedDate.value) {
      changeSelectedDate(focusedDate.value)
    }
    return
  }
  
  // 其他键由 hook 处理
  handleKeydown(event)
}

defineExpose({
  // 切换周/月视图
  toggleViewMode,
  // 切换日历页
  changePageTo,
  // 切换选中日期
  changeSelectedDate,
  // 获取当前焦点日期
  getFocusedDate: () => focusedDate.value,
  // 设置焦点日期
  setFocusedDate: (date) => {
    focusedDate.value = new Date(date)
    focusToContainer()
  }
})
</script>
