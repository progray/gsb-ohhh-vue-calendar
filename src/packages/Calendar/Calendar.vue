<template>
  <div
    class="ohhh-calendar-container"
    :class="{
      'is-animating-view': isAnimatingViewChange,
      'is-animating-page': isAnimatingPageChange,
      'page-style-slide': pageAnimationStyle === 'slide',
      'page-style-stack': pageAnimationStyle === 'stack',
      'expanding': viewChangeDirection === 'expanding',
      'collapsing': viewChangeDirection === 'collapsing'
    }"
    :style="{
      '--calendar-rows': renderRows,
      '--calendar-transition-duration': actualDuration,
      '--translate-distance': transformDistance,
      '--transition-duration': transitionDuration,
      '--page-transition-duration': pageTransitionDuration,
      '--view-change-duration': viewChangeDuration,
      '--current-week-index': currentWeekIndex,
      '--ripple-x': rippleX,
      '--ripple-y': rippleY
    }"
  >
    <!-- 顶部工具栏 -->
    <div v-if="showToolbar" class="ohhh-calendar-toolbar">
      <slot name="toolbar" :year="currentYear" :month="currentMonth" :viewMode="viewMode">
        <div v-html="icons.arrowDoubleLeft" class="ohhh-calendar-toolbar--icon" @click="handleToolbarClick('prev-year')" />
        <div v-html="icons.arrowLeft" class="ohhh-calendar-toolbar--icon" @click="handleToolbarClick('prev-page')" />
        <div class="ohhh-calendar-toolbar--text">{{ headerLabel }}</div>
        <div v-html="icons.arrowRight" class="ohhh-calendar-toolbar--icon" @click="handleToolbarClick('next-page')" />
        <div v-html="icons.arrowDoubleRight" class="ohhh-calendar-toolbar--icon" @click="handleToolbarClick('next-year')" />
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
        v-for="(dates, pageIndex) in allRenderDates"
        :key="pageIndex"
        :style="{ left: 100 * (pageIndex - 1) + '%' }"
        class="ohhh-calendar-days"
        :class="{
          'is-prev-page': pageIndex === 0,
          'is-current-page': pageIndex === 1,
          'is-next-page': pageIndex === 2,
          'page-exit': isAnimatingPageChange && pageIndex === 1 && pageDirection !== 'none',
          'page-enter': isAnimatingPageChange && ((pageDirection === 'left' && pageIndex === 2) || (pageDirection === 'right' && pageIndex === 0))
        }"
        @transitionend="onPageTransitionEnd"
        @animationend="onPageAnimationEnd"
      >
        <div
          v-for="(week, weekIdx) in getPageRows(dates)"
          :key="weekIdx"
          class="ohhh-calendar-week-row"
          :class="{
            'is-current-week': weekIdx === currentWeekIndex,
            'is-above-current': weekIdx < currentWeekIndex,
            'is-below-current': weekIdx > currentWeekIndex
          }"
          :data-week-index="weekIdx"
        >
          <div
            v-for="dateObj in week"
            :key="dateObj.key"
            class="ohhh-calendar-day"
            :class="{
              'is-selected': isSameDay(dateObj.date, selected),
              'is-today': isSameDay(dateObj.date, new Date()),
              'other-month': !dateObj.current,
              'has-ripple': rippleActive && rippleTargetDate && isSameDay(dateObj.date, rippleTargetDate)
            }"
            @click="onDayClick($event, dateObj)"
          >
            <div class="ohhh-calendar-day--inner">
              <div class="ohhh-calendar-day--inner-value">{{ dateObj.fullDate.date }}</div>
              <div class="ohhh-calendar-day--inner-label" v-if="$slots['day-label']">
                <slot name="day-label" :date="dateObj.date" />
              </div>
            </div>
            <div class="ohhh-calendar-day--marker" :style="{ background: _getMarkerColor(dateObj.date) }" />
            <div class="ohhh-calendar-day--ripple"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部工具栏 -->
    <div v-if="showFooter" class="ohhh-calendar-footer">
      <slot name="footer" :year="currentYear" :month="currentMonth" :viewMode="viewMode">
        <div
          v-html="viewMode === 'week' ? icons.arrowDown : icons.arrowUp"
          class="ohhh-calendar-footer--icon"
          @click="handleViewModeToggle"
        />
      </slot>
    </div>
  </div>
</template>

<script setup>
import { computed, useTemplateRef, toRefs, ref, watch, nextTick } from 'vue'
import { useSwipe } from '@vueuse/core'
import { useCalendar } from './hooks/useCalendar.js'
import { isSameDay, createWeekdays } from './utils'
import { icons } from './utils/icons.js'

const swipeRef = useTemplateRef('swp')

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
  },
  animationEnabled: {
    type: Boolean,
    default: true
  },
  pageAnimationStyle: {
    type: String,
    default: 'slide'
  }
})

const { initialSelectedDate, initialViewMode, weekStart, markerDates, duration, animationEnabled, pageAnimationStyle } = toRefs(props)

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
  weekIndex,
  currentMonthDates,
  currentWeekDates,
  _targetDate,
  _setPrevMonthDates,
  _setNextMonthDates,
  _setPrevWeekDates,
  _setNextWeekDates,
  _setWeekIndex
} = useCalendar({ initialSelectedDate, initialViewMode, weekStart, duration }, emit)

const isAnimatingViewChange = ref(false)
const isAnimatingPageChange = ref(false)
const viewChangeDirection = ref('none')
const pageDirection = ref('none')
const pageTransitionDuration = ref('0s')
const viewChangeDuration = ref('0.3s')

const currentWeekIndex = computed(() => {
  return weekIndex.value
})

const actualDuration = computed(() => {
  if (!animationEnabled.value) return '0s'
  return duration.value
})

watch(actualDuration, (val) => {
  viewChangeDuration.value = val
})

watch(animationEnabled, () => {
  if (!animationEnabled.value) {
    isAnimatingViewChange.value = false
    isAnimatingPageChange.value = false
    viewChangeDirection.value = 'none'
    pageDirection.value = 'none'
  }
}, { immediate: true })

const headerLabel = computed(() => `${currentYear.value}年${currentMonth.value + 1}月`)
const weekdays = createWeekdays(weekStart.value)

const markerDateList = computed(() =>
  markerDates.value.map(item => ({
    date: new Date(typeof item === 'object' && item.date ? item.date : item),
    color: typeof item === 'object' && item.color ? item.color : 'var(--calendar-theme-color)'
  }))
)

function getPageRows(dates) {
  const rows = []
  for (let i = 0; i < dates.length; i += 7) {
    rows.push(dates.slice(i, i + 7))
  }
  return rows
}

const rippleX = ref('50%')
const rippleY = ref('50%')
const rippleActive = ref(false)
const rippleTargetDate = ref(null)

function onDayClick(event, dateObj) {
  const rect = event.currentTarget.getBoundingClientRect()
  rippleX.value = `${event.clientX - rect.left}px`
  rippleY.value = `${event.clientY - rect.top}px`

  rippleTargetDate.value = new Date(dateObj.date)
  rippleActive.value = false

  nextTick(() => {
    rippleActive.value = true
    const durationMs = parseFloat(actualDuration.value) * 1000 * 1.5
    setTimeout(() => {
      rippleActive.value = false
      rippleTargetDate.value = null
    }, durationMs)
  })

  changeSelectedDate(dateObj.date)
}

const { lengthX } = useSwipe(swipeRef, {
  threshold: 0,
  onSwipe: () => {
    if (isAnimatingPageChange.value || isAnimatingViewChange.value || !animationEnabled.value) return
    if (isInTransition.value) return
    transformDistance.value = -lengthX.value + 'px'
  },
  onSwipeEnd: (_, direction) => {
    if (isAnimatingPageChange.value || isAnimatingViewChange.value) return
    if (isInTransition.value) return
    if (direction === 'left') {
      handlePageChange('next-page')
    } else if (direction === 'right') {
      handlePageChange('prev-page')
    } else {
      if (animationEnabled.value) {
        startTransitionAnimation(direction)
      }
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

function handlePageChange(param) {
  const targetDate = _normalize(param)

  if (viewMode.value === 'week') {
    if (currentRenderDates.value.some(item => isSameDay(item.date, targetDate))) {
      if (targetDate.getFullYear() === currentYear.value && targetDate.getMonth() === currentMonth.value) {
        return
      }
      currentYear.value = targetDate.getFullYear()
      currentMonth.value = targetDate.getMonth()
      return
    }
  } else if (viewMode.value === 'month') {
    if (targetDate.getFullYear() === currentYear.value && targetDate.getMonth() === currentMonth.value) {
      return
    }
  }

  if (!animationEnabled.value) {
    switchPageToTargetDate(targetDate)
    return
  }

  let dir
  if (viewMode.value === 'week') {
    dir = targetDate < currentRenderDates.value[0].date ? 'right' : 'left'
  } else {
    if (targetDate.getFullYear() < currentYear.value ||
        (targetDate.getFullYear() === currentYear.value && targetDate.getMonth() < currentMonth.value)) {
      dir = 'right'
    } else {
      dir = 'left'
    }
  }

  if (pageAnimationStyle.value === 'stack') {
    isAnimatingPageChange.value = true
    pageDirection.value = dir
    pageTransitionDuration.value = actualDuration.value

    if (viewMode.value === 'week') {
      if (dir === 'right') {
        _setPrevWeekDates(targetDate)
      } else {
        _setNextWeekDates(targetDate)
      }
    } else {
      if (dir === 'right') {
        _setPrevMonthDates(targetDate)
      } else {
        _setNextMonthDates(targetDate)
      }
    }

    _targetDate.value = targetDate
    isInTransition.value = true
  } else {
    switchPageToTargetDate(targetDate)
  }
}

function onPageTransitionEnd() {
  onTransitionEnd()
}

function onPageAnimationEnd() {
  if (!isAnimatingPageChange.value) return

  onTransitionEnd()

  isAnimatingPageChange.value = false
  pageDirection.value = 'none'
  pageTransitionDuration.value = '0s'
}

function handleToolbarClick(param) {
  if (isAnimatingPageChange.value || isAnimatingViewChange.value) return
  handlePageChange(param)
}

function changePageTo(param) {
  if (isAnimatingPageChange.value || isAnimatingViewChange.value) return
  handlePageChange(param)
}

function handleViewModeToggle() {
  if (isAnimatingPageChange.value || isAnimatingViewChange.value) return

  if (!animationEnabled.value) {
    toggleViewMode()
    return
  }

  const newMode = viewMode.value === 'week' ? 'month' : 'week'

  if (newMode === 'month') {
    viewChangeDirection.value = 'expanding'
  } else {
    viewChangeDirection.value = 'collapsing'
  }

  isAnimatingViewChange.value = true

  if (newMode === 'week') {
    renderRows.value = 1
  } else {
    renderRows.value = Math.ceil(currentMonthDates.value.length / 7)
  }

  const durationMs = parseFloat(actualDuration.value) * 1000 * 1.5

  setTimeout(() => {
    toggleViewMode()
    isAnimatingViewChange.value = false
    viewChangeDirection.value = 'none'
  }, durationMs)
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

defineExpose({
  toggleViewMode,
  changePageTo,
  changeSelectedDate
})
</script>
