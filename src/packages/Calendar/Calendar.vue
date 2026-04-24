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
      >
        <div
          v-for="dateObj in item"
          :key="dateObj.key"
          class="ohhh-calendar-day"
          :class="{
            'is-selected': isSameDay(dateObj.date, selected),
            'is-today': isSameDay(dateObj.date, new Date()),
            'other-month': !dateObj.current,
            'ohhh-calendar-day--phase-period': getDatePhaseClass(dateObj.date) === 'period',
            'ohhh-calendar-day--phase-fertile': getDatePhaseClass(dateObj.date) === 'fertile',
            'ohhh-calendar-day--phase-ovulation': getDatePhaseClass(dateObj.date) === 'ovulation',
            'ohhh-calendar-day--phase-luteal': getDatePhaseClass(dateObj.date) === 'luteal',
            'is-predicted': isDatePredicted(dateObj.date)
          }"
          @click="changeSelectedDate(dateObj.date)"
          @mousemove="onDayMouseMove(dateObj.date, $event)"
          @mouseleave="onDayMouseLeave"
        >
          <div class="ohhh-calendar-day--inner">
            <div class="ohhh-calendar-day--inner-value">{{ dateObj.fullDate.date }}</div>
            <div class="ohhh-calendar-day--inner-label" v-if="$slots['day-label']">
              <slot name="day-label" :date="dateObj.date" />
            </div>
          </div>
          <div class="ohhh-calendar-day--marker" :style="{ background: _getMarkerColor(dateObj.date) }" />

          <!-- 经期开始图标 -->
          <div
            v-if="isPeriodStart(dateObj.date) && dateObj.current"
            class="ohhh-calendar-day--icon-start"
            :class="{ 'is-dragging': isDraggingType('start') && isDraggingDate(dateObj.date) }"
            @mousedown="(e) => onStartDrag('start', dateObj.date, e)"
            @touchstart="(e) => onStartDrag('start', dateObj.date, e)"
            title="拖动调整经期开始日期"
          />

          <!-- 经期结束图标 -->
          <div
            v-if="isPeriodEnd(dateObj.date) && dateObj.current"
            class="ohhh-calendar-day--icon-end"
            :class="{ 'is-dragging': isDraggingType('end') && isDraggingDate(dateObj.date) }"
            @mousedown="(e) => onStartDrag('end', dateObj.date, e)"
            @touchstart="(e) => onStartDrag('end', dateObj.date, e)"
            title="拖动调整经期结束日期"
          />

          <!-- 排卵日花朵图标 -->
          <div
            v-if="isOvulationDate(dateObj.date) && dateObj.current"
            class="ohhh-calendar-day--icon-ovulation"
            :class="{ 'is-dragging': isDraggingType('ovulation') && isDraggingDate(dateObj.date) }"
            v-html="icons.flower"
            @mousedown="(e) => onStartDrag('ovulation', dateObj.date, e)"
            @touchstart="(e) => onStartDrag('ovulation', dateObj.date, e)"
            title="拖动调整排卵日期"
          />
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

    <!-- 图例说明 -->
    <div v-if="showCycleLegend" class="cycle-legend">
      <div class="cycle-legend--item">
        <span class="cycle-legend--dot period"></span>
        <span>经期</span>
      </div>
      <div class="cycle-legend--item">
        <span class="cycle-legend--dot ovulation"></span>
        <span>排卵日</span>
      </div>
      <div class="cycle-legend--item">
        <span class="cycle-legend--dot fertile"></span>
        <span>易孕期</span>
      </div>
      <div class="cycle-legend--item">
        <span class="cycle-legend--dot luteal"></span>
        <span>黄体期</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, useTemplateRef, toRefs, ref, onMounted, onUnmounted } from 'vue'
import { useSwipe } from '@vueuse/core'
import { useCalendar } from './hooks/useCalendar.js'
import { useCycle } from './hooks/useCycle.js'
import { isSameDay, addDays, getDaysBetween } from './utils'
import { icons } from './utils/icons.js'

const swipeRef = useTemplateRef('swp')

const emit = defineEmits(['select-change', 'view-change', 'cycle-change'])

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
  showCycleLegend: {
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
  toggleViewMode
} = useCalendar({ initialSelectedDate, initialViewMode, weekStart, duration }, emit)

const {
  cycles,
  draggingState,
  averageCycleLength,
  averagePeriodLength,
  CYCLE_PHASE,
  getDatePhase,
  isPeriodStart,
  isPeriodEnd,
  isOvulationDate,
  getCycleByPeriodStart,
  getCycleByPeriodEnd,
  getCycleByOvulationDate,
  startDrag,
  updateDragPosition,
  endDrag
} = useCycle()

const longPressTimer = ref(null)
const isLongPress = ref(false)
const dragStartDate = ref(null)

const headerLabel = computed(() => `${currentYear.value}年${currentMonth.value + 1}月`)
const weekdays = computed(() => {
  const WEEK_DAYS = ['日', '一', '二', '三', '四', '五', '六']
  return WEEK_DAYS.slice(weekStart.value).concat(WEEK_DAYS.slice(0, weekStart.value))
})

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
  if (draggingState.isDragging) return
  changePageTo(date)
  if (!isSameDay(new Date(date), selected.value)) {
    selected.value = new Date(date)
    emit('select-change', selected.value)
  }
}

function _getMarkerColor(date) {
  return markerDateList.value.find(d => isSameDay(d.date, date))?.color
}

function getDatePhaseClass(date) {
  const phaseInfo = getDatePhase(date)
  if (!phaseInfo) return null
  return phaseInfo.phase
}

function isDatePredicted(date) {
  const phaseInfo = getDatePhase(date)
  return phaseInfo?.isPredicted || false
}

function isDraggingType(type) {
  return draggingState.type === type
}

function isDraggingDate(date) {
  return draggingState.currentDate && isSameDay(draggingState.currentDate, date)
}

function getTouchEvent(e) {
  return e.touches ? e.touches[0] : e
}

function onStartDrag(type, date, event) {
  let cycle = null
  if (type === 'start') {
    cycle = getCycleByPeriodStart(date)
  } else if (type === 'end') {
    cycle = getCycleByPeriodEnd(date)
  } else if (type === 'ovulation') {
    cycle = getCycleByOvulationDate(date)
  }

  if (!cycle || cycle.isPredicted) return

  const touch = getTouchEvent(event)
  dragStartDate.value = new Date(date)
  isLongPress.value = false

  longPressTimer.value = setTimeout(() => {
    isLongPress.value = true
    startDrag(type, date, cycle.id)
  }, 500)

  function onMove(e) {
    if (!isLongPress.value) {
      const touch2 = getTouchEvent(e)
      const dx = touch.clientX - touch2.clientX
      const dy = touch.clientY - touch2.clientY
      if (Math.sqrt(dx * dx + dy * dy) > 5) {
        clearTimeout(longPressTimer.value)
        cleanup()
      }
    }
  }

  function onUp() {
    clearTimeout(longPressTimer.value)
    if (draggingState.isDragging) {
      endDrag()
      emit('cycle-change', cycles.value)
    }
    cleanup()
  }

  function cleanup() {
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
    document.removeEventListener('touchmove', onMove, { passive: false })
    document.removeEventListener('touchend', onUp)
  }

  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
  document.addEventListener('touchmove', onMove, { passive: false })
  document.addEventListener('touchend', onUp)
}

function onDayMouseMove(date, event) {
  if (!draggingState.isDragging) return
  updateDragPosition(date)
}

function onDayMouseLeave() {
}

defineExpose({
  toggleViewMode,
  changePageTo,
  changeSelectedDate,
  cycles,
  averageCycleLength,
  averagePeriodLength
})
</script>
