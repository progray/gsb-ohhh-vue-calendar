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
        @mouseleave="clearHover"
      >
        <div
          v-for="dateObj in item"
          :key="dateObj.key"
          class="ohhh-calendar-day"
          :class="{
            'is-selected': currentSelectionMode === 'single' ? isSameDay(dateObj.date, selected) : isDateSelected(dateObj.date),
            'is-today': isSameDay(dateObj.date, new Date()),
            'other-month': !dateObj.current,
            'is-range-boundary': isDateRangeBoundary(dateObj.date),
            'is-in-range-preview': isDateInRangePreview(dateObj.date),
            'is-in-selected-range': isDateInSelectedRange(dateObj.date)
          }"
          @click="handleDateClick(dateObj.date)"
          @mouseenter="handleDateHover(dateObj.date)"
        >
          <div class="ohhh-calendar-day--inner">
            <div class="ohhh-calendar-day--inner-value">
              {{ dateObj.fullDate.date }}
              <span 
                v-if="currentSelectionMode === 'multiple' && !isRangeMode && isDateSelected(dateObj.date)" 
                class="ohhh-calendar-day--selection-index"
              >
                {{ getSelectedIndex(dateObj.date) }}
              </span>
            </div>
            <div class="ohhh-calendar-day--inner-label" v-if="$slots['day-label']">
              <slot name="day-label" :date="dateObj.date" />
            </div>
          </div>
          <div class="ohhh-calendar-day--marker" :style="{ background: _getMarkerColor(dateObj.date) }" />
        </div>
      </div>
    </div>

    <!-- 已选日期标签区域 -->
    <div v-if="showSelectedTags && currentSelectionMode === 'multiple' && selectedDates.length > 0" class="ohhh-calendar-selected-tags">
      <div class="ohhh-calendar-selected-tags--title">已选日期 ({{ selectedDates.length }}/{{ currentMaxSelectCount === Infinity ? '∞' : currentMaxSelectCount }})</div>
      <div class="ohhh-calendar-selected-tags--container">
        <div 
          v-for="(date, index) in selectedDates" 
          :key="formatDate(date)"
          class="ohhh-calendar-selected-tags--tag"
        >
          <span class="ohhh-calendar-selected-tags--tag-index">{{ index + 1 }}</span>
          <span class="ohhh-calendar-selected-tags--tag-text">{{ formatDate(date) }}</span>
          <span 
            class="ohhh-calendar-selected-tags--tag-close"
            @click="removeSelectedDate(date)"
          >×</span>
        </div>
      </div>
      <div 
        v-if="selectedDates.length > 0"
        class="ohhh-calendar-selected-tags--clear-all"
        @click="clearAllSelections"
      >
        清空所有
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
import { computed, useTemplateRef, toRefs } from 'vue'
import { useSwipe } from '@vueuse/core'
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
  // 选择模式
  selectionMode: {
    type: String,
    default: 'single' // single or multiple
  },
  // 范围选择模式
  rangeMode: {
    type: Boolean,
    default: false
  },
  // 最大可选数量
  maxSelectCount: {
    type: Number,
    default: Infinity
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
  // 是否显示已选日期标签
  showSelectedTags: {
    type: Boolean,
    default: true
  },
  // 过渡动画时长
  duration: {
    type: String,
    default: '0.3s'
  }
})

const { 
  initialSelectedDate, 
  initialViewMode, 
  weekStart, 
  markerDates, 
  duration,
  selectionMode,
  rangeMode,
  maxSelectCount
} = toRefs(props)

const {
  selected,
  selectedDates,
  viewMode,
  currentSelectionMode,
  isRangeMode,
  currentMaxSelectCount,
  rangeStartDate,
  rangeEndDate,
  hoverDate,
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
  isDateSelected,
  getSelectedIndex,
  isDateInRangePreview,
  isDateRangeBoundary,
  isDateInSelectedRange,
  toggleDateSelection,
  handleRangeSelection,
  handleDateHover,
  clearHover,
  setSelectionMode,
  setRangeMode,
  setMaxSelectCount,
  clearAllSelections,
  removeSelectedDate
} = useCalendar({ 
  initialSelectedDate, 
  initialViewMode, 
  weekStart, 
  duration,
  selectionMode,
  rangeMode,
  maxSelectCount
}, emit)

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

// 格式化日期
function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 处理日期点击
function handleDateClick(date) {
  changePageTo(date)
  
  if (currentSelectionMode.value === 'single') {
    // 单选模式
    if (!isSameDay(new Date(date), selected.value)) {
      selected.value = new Date(date)
      emit('select-change', selected.value)
    }
  } else {
    // 多选模式
    if (isRangeMode.value) {
      // 范围选择模式
      handleRangeSelection(date)
    } else {
      // 普通多选模式
      toggleDateSelection(date)
    }
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
  changeSelectedDate,
  // 处理日期点击
  handleDateClick,
  // 设置选择模式
  setSelectionMode,
  // 设置范围选择模式
  setRangeMode,
  // 设置最大可选数量
  setMaxSelectCount,
  // 清除所有选中日期
  clearAllSelections,
  // 移除单个选中日期
  removeSelectedDate
})
</script>
