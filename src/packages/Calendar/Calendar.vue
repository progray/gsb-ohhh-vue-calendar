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
        v-for="(item, pageIndex) in allRenderDates"
        :key="pageIndex"
        :style="{ left: 100 * (pageIndex - 1) + '%' }"
        class="ohhh-calendar-days"
        @transitionend="onTransitionEnd"
      >
        <div
          v-for="(dateObj, dateIndex) in item"
          :key="dateObj.key"
          class="ohhh-calendar-day"
          :class="{
            'is-selected': isSameDay(dateObj.date, selected),
            'is-today': isSameDay(dateObj.date, new Date()),
            'other-month': !dateObj.current,
            'has-mood': _hasMood(dateObj.date)
          }"
          :style="{
            animationDelay: _getAnimationDelay(dateIndex) + 'ms'
          }"
          @click="handleDateClick(dateObj, $event)"
        >
          <div class="ohhh-calendar-day--inner">
            <div class="ohhh-calendar-day--inner-value">{{ dateObj.fullDate.date }}</div>
            <div 
              v-if="_hasMood(dateObj.date)" 
              class="ohhh-calendar-day--inner-mood"
              :class="{
                'animate-shake': _isShaking(dateObj.key)
              }"
            >
              {{ _getMoodEmoji(dateObj.date) }}
            </div>
          </div>
          <div class="ohhh-calendar-day--marker" :style="{ background: _getMarkerColor(dateObj.date) }" />
          <div 
            v-if="_rippleEffect.dateKey === dateObj.key" 
            class="ripple-effect"
            :style="{
              left: _rippleEffect.x + 'px',
              top: _rippleEffect.y + 'px',
              width: '30px',
              height: '30px'
            }"
          ></div>
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
import { computed, useTemplateRef, toRefs, ref, watch } from 'vue'
import { useSwipe } from '@vueuse/core'
import { useCalendar } from './hooks/useCalendar.js'
import { isSameDay, createWeekdays, formatDateKey } from './utils'
import { icons } from './utils/icons.js'

const swipeRef = useTemplateRef('swp')

const emit = defineEmits(['select-change', 'view-change', 'date-click', 'mood-select'])

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
  moodData: {
    type: Object,
    default: () => ({})
  }
})

const { initialSelectedDate, initialViewMode, weekStart, markerDates, duration, moodData } = toRefs(props)

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

const _rippleEffect = ref({
  dateKey: null,
  x: 0,
  y: 0
})

const _shakingKeys = ref(new Set())

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

function _getAnimationDelay(index) {
  const row = Math.floor(index / 7)
  const col = index % 7
  return row * 100 + col * 30
}

function _hasMood(date) {
  const dateKey = formatDateKey(date)
  return moodData.value[dateKey] !== undefined
}

function _getMoodEmoji(date) {
  const dateKey = formatDateKey(date)
  const mood = moodData.value[dateKey]
  const moodEmojis = {
    happy: '😊',
    normal: '😐',
    sad: '😢',
    angry: '😡',
    tired: '😴'
  }
  return moodEmojis[mood] || mood
}

function _isShaking(dateKey) {
  return _shakingKeys.value.has(dateKey)
}

function _triggerShake(dateKey) {
  _shakingKeys.value.add(dateKey)
  setTimeout(() => {
    _shakingKeys.value.delete(dateKey)
  }, 500)
}

function handleDateClick(dateObj, event) {
  const rect = event.currentTarget.getBoundingClientRect()
  _rippleEffect.value = {
    dateKey: dateObj.key,
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  }
  
  setTimeout(() => {
    _rippleEffect.value = { dateKey: null, x: 0, y: 0 }
  }, 600)

  emit('date-click', dateObj.date, _hasMood(dateObj.date))

  if (_hasMood(dateObj.date)) {
    _triggerShake(dateObj.key)
    return
  }

  changePageTo(dateObj.date)
  if (!isSameDay(new Date(dateObj.date), selected.value)) {
    selected.value = new Date(dateObj.date)
    emit('select-change', selected.value)
  }
}

defineExpose({
  toggleViewMode,
  changePageTo,
  changeSelectedDate
})
</script>
