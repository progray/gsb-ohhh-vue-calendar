<template>
  <div
    class="ohhh-calendar-container"
    :class="{ 'heatmap-mode': showHeatmap }"
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

    <!-- 热力图图例 -->
    <div v-if="showHeatmap && showHeatmapLegend" class="ohhh-calendar-heatmap-legend">
      <span class="heatmap-legend--label">少</span>
      <div
        v-for="(item, index) in legendData"
        :key="index"
        class="heatmap-legend--color-block"
        :class="{ 'is-selected': selectedIntervalIndex === item.colorIndex }"
        :style="{ backgroundColor: item.color }"
        @click="handleLegendClick(item)"
        :title="item.label + (item.count > 0 ? ` (${item.count}天)` : '')"
      />
      <span class="heatmap-legend--label">多</span>
      <span v-if="selectedIntervalIndex !== null" class="heatmap-legend--clear" @click="clearFilter">
        清除筛选
      </span>
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
            'other-month': !dateObj.current,
            'heatmap-highlighted': showHeatmap && isDateHighlighted(dateObj.date),
            'heatmap-dimmed': showHeatmap && !isDateHighlighted(dateObj.date),
            'is-hovered': showHeatmap && hoveredDate && isSameDay(dateObj.date, hoveredDate)
          }"
          :style="showHeatmap ? { backgroundColor: getHeatmapColor(dateObj.date) } : {}"
          @click="changeSelectedDate(dateObj.date)"
          @mouseenter="handleDateHover(dateObj.date)"
          @mouseleave="handleDateLeave"
        >
          <div class="ohhh-calendar-day--inner">
            <div class="ohhh-calendar-day--inner-value">{{ dateObj.fullDate.date }}</div>
            <div class="ohhh-calendar-day--inner-label" v-if="$slots['day-label']">
              <slot name="day-label" :date="dateObj.date" />
            </div>
          </div>
          <div v-if="!showHeatmap" class="ohhh-calendar-day--marker" :style="{ background: _getMarkerColor(dateObj.date) }" />
        </div>
      </div>
    </div>

    <!-- 热力图悬停提示 -->
    <Teleport to="body">
      <div
        v-if="showHeatmap && hoveredDateValue !== null"
        class="ohhh-calendar-heatmap-tooltip"
        :style="{
          left: tooltipPosition.x + 'px',
          top: tooltipPosition.y + 'px'
        }"
      >
        <slot name="heatmap-tooltip" :date="hoveredDate" :value="hoveredDateValue">
          <div class="heatmap-tooltip--content">
            <div class="heatmap-tooltip--date">{{ formatTooltipDate(hoveredDate) }}</div>
            <div class="heatmap-tooltip--value">
              <span class="heatmap-tooltip--label">数值:</span>
              <span class="heatmap-tooltip--number">{{ hoveredDateValue }}</span>
            </div>
          </div>
        </slot>
      </div>
    </Teleport>

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
import { computed, useTemplateRef, toRefs, ref, watch } from 'vue'
import { useSwipe } from '@vueuse/core'
import { useCalendar } from './hooks/useCalendar.js'
import { useHeatmap } from './hooks/useHeatmap.js'
import { isSameDay, createWeekdays } from './utils'
import { icons } from './utils/icons.js'

const swipeRef = useTemplateRef('swp')

const emit = defineEmits(['select-change', 'view-change', 'heatmap-hover', 'heatmap-filter-change'])

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
  },
  showHeatmap: {
    type: Boolean,
    default: false
  },
  heatmapData: {
    type: Array,
    default: () => []
  },
  colorScale: {
    type: Array,
    default: null
  },
  levels: {
    type: Number,
    default: null
  },
  showHeatmapLegend: {
    type: Boolean,
    default: true
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
  showHeatmap,
  selectedIntervalIndex,
  hoveredDateValue,
  hoveredDate,
  legendData,
  getHeatmapColor,
  isDateHighlighted,
  handleDateHover: _handleDateHover,
  handleDateLeave: _handleDateLeave,
  handleLegendClick,
  clearFilter
} = useHeatmap(props, emit)

const tooltipPosition = ref({ x: 0, y: 0 })

const headerLabel = computed(() => `${currentYear.value}年${currentMonth.value + 1}月`)
const weekdays = createWeekdays(weekStart.value)
const markerDateList = computed(() =>
  markerDates.value.map(item => ({
    date: new Date(typeof item === 'object' && item.date ? item.date : item),
    color: typeof item === 'object' && item.color ? item.color : 'var(--calendar-theme-color)'
  }))
)

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

function formatTooltipDate(date) {
  if (!date) return ''
  const d = new Date(date)
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

function handleDateHover(date) {
  _handleDateHover(date)
  updateTooltipPosition()
}

function handleDateLeave() {
  _handleDateLeave()
}

function updateTooltipPosition() {
  if (typeof window === 'undefined') return
  const x = event?.clientX || 0
  const y = event?.clientY || 0
  tooltipPosition.value = {
    x: x + 15,
    y: y + 15
  }
}

watch(hoveredDate, () => {
  updateTooltipPosition()
})

defineExpose({
  toggleViewMode,
  changePageTo,
  changeSelectedDate,
  clearFilter,
  getHeatmapColor,
  isDateHighlighted
})
</script>
