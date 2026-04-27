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
        <div class="ohhh-calendar-toolbar--text-wrapper">
          <div class="ohhh-calendar-toolbar--text">{{ headerLabel }}</div>
          <div class="merit-progress-container">
            <div
              class="merit-progress-bar"
              :class="`progress-level-${progressLevel}`"
              :style="{ width: progressPercentage + '%' }"
            />
            <div class="merit-progress-text">{{ totalMerit }} / {{ targetMerit }} 功德</div>
          </div>
        </div>
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
            'is-animating': isDateAnimating(dateObj.date)
          }"
          @click="handleDayClick(dateObj.date, $event)"
        >
          <WoodenFish
            :is-animating="isDateAnimating(dateObj.date)"
            @click="handleWoodenFishClick(dateObj.date)"
          />
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
import { computed, useTemplateRef, toRefs } from 'vue'
import { useSwipe } from '@vueuse/core'
import { useCalendar } from './hooks/useCalendar.js'
import { useMerit } from './hooks/useMerit.js'
import { isSameDay, createWeekdays } from './utils'
import { icons } from './utils/icons.js'
import WoodenFish from './components/WoodenFish.vue'

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
  totalMerit,
  progressPercentage,
  progressLevel,
  targetMerit,
  addMerit,
  isAnimating: isMeritAnimating
} = useMerit(currentYear, currentMonth)

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

function isDateAnimating(date) {
  return isMeritAnimating(date)
}

function handleWoodenFishClick(date) {
  addMerit(date)
}

function handleDayClick(date, event) {
  changeSelectedDate(date)
}

defineExpose({
  toggleViewMode,
  changePageTo,
  changeSelectedDate,
  totalMerit,
  progressPercentage,
  progressLevel
})
</script>

<style>
.ohhh-calendar-toolbar--text-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.merit-progress-container {
  position: relative;
  width: 120px;
  height: 8px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.merit-progress-bar {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease, background 0.3s ease;
}

.merit-progress-bar.progress-level-gray {
  background: var(--calendar-text-color-level-4);
}

.merit-progress-bar.progress-level-gold {
  background: linear-gradient(90deg, #FFD700, #FFA500);
  box-shadow: 0 0 6px rgba(255, 215, 0, 0.5);
}

.merit-progress-bar.progress-level-purple {
  background: linear-gradient(90deg, #8A2BE2, #4169E1);
  box-shadow: 0 0 6px rgba(138, 43, 226, 0.5);
}

.merit-progress-bar.progress-level-max {
  background: linear-gradient(
    90deg,
    #FF0000,
    #FF7F00,
    #FFFF00,
    #00FF00,
    #0000FF,
    #4B0082,
    #9400D3,
    #FF0000
  );
  background-size: 200% 100%;
  animation: rainbowFlow 2s linear infinite, glowPulse 1s ease-in-out infinite alternate;
}

.merit-progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 9px;
  font-weight: 500;
  color: var(--calendar-text-color-level-3);
  white-space: nowrap;
  text-shadow: 0 0 2px rgba(255, 255, 255, 0.8);
}

.progress-level-max .merit-progress-text {
  color: #fff;
  text-shadow: 0 0 4px rgba(0, 0, 0, 0.5);
}

@keyframes rainbowFlow {
  0% {
    background-position: 0% 50%;
  }
  100% {
    background-position: 200% 50%;
  }
}

@keyframes glowPulse {
  0% {
    box-shadow: 0 0 8px rgba(255, 0, 0, 0.6), 0 0 12px rgba(255, 127, 0, 0.4);
  }
  100% {
    box-shadow: 0 0 16px rgba(255, 0, 0, 0.9), 0 0 24px rgba(138, 43, 226, 0.7), 0 0 32px rgba(0, 255, 0, 0.5);
  }
}

.ohhh-calendar-day {
  position: relative;
  transition: transform 0.15s ease;
}

.ohhh-calendar-day.is-animating {
  transform: scale(1.08);
}

.ohhh-calendar-day.is-animating .ohhh-calendar-day--inner {
  transform: scale(1.1);
  transition: transform 0.15s ease;
}

.ohhh-calendar-day .wooden-fish-wrapper {
  opacity: 0;
  transition: opacity 0.3s ease;
}

.ohhh-calendar-day:hover .wooden-fish-wrapper {
  opacity: 1;
}
</style>
