<template>
  <div
    class="ohhh-calendar-container"
    :style="{
      '--calendar-rows': renderRows,
      '--calendar-transition-duration': duration,
      '--translate-distance': transformDistance,
      '--transition-duration': transitionDuration
    }"
    @click="closeMoodSlider"
  >
    <!-- 顶部工具栏 -->
    <div v-if="showToolbar" class="ohhh-calendar-toolbar">
      <slot name="toolbar" :year="currentYear" :month="currentMonth" :viewMode="viewMode">
        <div v-html="icons.arrowDoubleLeft" class="ohhh-calendar-toolbar--icon" @click="changePageTo('prev-year')" />
        <div v-html="icons.arrowLeft" class="ohhh-calendar-toolbar--icon" @click="changePageTo('prev-page')" />
        <div class="ohhh-calendar-toolbar--text">{{ headerLabel }}</div>
        <div
          v-if="showMoodSystem"
          class="ohhh-calendar-mood-summary"
          @mouseenter="onMoodSummaryHover(true)"
          @mouseleave="onMoodSummaryHover(false)"
        >
          <span class="ohhh-calendar-mood-summary--text">本月心境</span>
          <span
            v-if="dominantMoodColor"
            class="ohhh-calendar-mood-summary--dot"
            :style="{ background: dominantMoodColor }"
          ></span>
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
        v-for="(item, pageIndex) in allRenderDates"
        :key="pageIndex"
        :style="{ left: 100 * (pageIndex - 1) + '%' }"
        class="ohhh-calendar-days"
        :class="{ 'is-current-page': pageIndex === 1 }"
        @transitionend="onTransitionEnd"
      >
        <svg
          v-if="showMoodSystem && pageIndex === 1"
          class="ohhh-calendar-connections"
          ref="connectionSvgRef"
        >
          <defs>
            <filter
              v-for="(color, index) in MOOD_COLORS"
              :key="`glow-${index}`"
              :id="`mood-glow-${index}`"
            >
              <feGaussianBlur :stdDeviation="2" :result="`coloredBlur-${index}`" />
              <feMerge>
                <feMergeNode :in="`coloredBlur-${index}`" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <line
            v-for="lineData in connectionLines"
            :key="lineData.key"
            :x1="lineData.x1"
            :y1="lineData.y1"
            :x2="lineData.x2"
            :y2="lineData.y2"
            :style="{
              stroke: lineData.color,
              filter: `url(#mood-glow-${lineData.colorIndex})`,
              opacity: lineData.opacity
            }"
            class="ohhh-calendar-connection-line"
          />
        </svg>

        <div
          v-for="(dateObj, dayIndex) in item"
          :key="dateObj.key"
          class="ohhh-calendar-day"
          :class="{
            'is-selected': isSameDay(dateObj.date, selected),
            'is-today': isSameDay(dateObj.date, new Date()),
            'other-month': !dateObj.current
          }"
          @click="(e) => onDayClick(e, dateObj, dayIndex, pageIndex)"
        >
          <div class="ohhh-calendar-day--inner">
            <div class="ohhh-calendar-day--inner-value">{{ dateObj.fullDate.date }}</div>
            <div class="ohhh-calendar-day--inner-label" v-if="$slots['day-label']">
              <slot name="day-label" :date="dateObj.date" />
            </div>
          </div>
          <div class="ohhh-calendar-day--marker" :style="{ background: _getMarkerColor(dateObj.date) }" />
          
          <div
            v-if="showMoodSystem"
            class="ohhh-calendar-day--mood-heart"
            :class="{
              'has-mood': hasMood(dateObj.date),
              'is-highlighted': shouldHighlightMood(dateObj.date),
              'is-dimmed': isHighlightingDominantMood && !shouldHighlightMood(dateObj.date)
            }"
            :style="{
              '--mood-color': getMoodColor(dateObj.date) || 'rgba(78, 205, 196, 0.5)'
            }"
            @click.stop="(e) => onHeartClick(e, dateObj)"
          >
            <svg
              v-if="!hasMood(dateObj.date)"
              class="ohhh-calendar-heart-icon ohhh-calendar-heart-icon--empty"
              viewBox="0 0 24 24"
            >
              <path
                d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              />
            </svg>
            <svg
              v-else
              class="ohhh-calendar-heart-icon ohhh-calendar-heart-icon--filled"
              viewBox="0 0 24 24"
            >
              <path
                d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                fill="currentColor"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>

    <MoodSlider
      v-if="moodSliderVisible"
      :visible="moodSliderVisible"
      :position="moodSliderPosition"
      :containerBounds="containerBounds"
      :initialColorIndex="selectedMoodDate ? getMood(selectedMoodDate.date)?.colorIndex : null"
      @cancel="closeMoodSlider"
      @confirm="onMoodConfirmed"
    />

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
import { computed, useTemplateRef, toRefs, ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useSwipe } from '@vueuse/core'
import { useCalendar } from './hooks/useCalendar.js'
import { useMood } from './hooks/useMood.js'
import { isSameDay, createWeekdays } from './utils'
import { icons } from './utils/icons.js'
import MoodSlider from './components/MoodSlider.vue'

const swipeRef = useTemplateRef('swp')
const connectionSvgRef = useTemplateRef('connectionSvgRef')

const emit = defineEmits(['select-change', 'view-change', 'mood-change'])

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
  showMoodSystem: {
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
  moods,
  MOOD_COLORS,
  setMood,
  getMood,
  hasMood,
  getMoodColor,
  getDominantMood,
  getConsecutiveMoodDates
} = useMood()

const moodSliderVisible = ref(false)
const moodSliderPosition = ref({ x: 0, y: 0 })
const selectedMoodDate = ref(null)
const isHighlightingDominantMood = ref(false)
const connectionPoints = ref({})

const headerLabel = computed(() => `${currentYear.value}年${currentMonth.value + 1}月`)
const weekdays = createWeekdays(weekStart.value)

const markerDateList = computed(() =>
  markerDates.value.map(item => ({
    date: new Date(typeof item === 'object' && item.date ? item.date : item),
    color: typeof item === 'object' && item.color ? item.color : 'var(--calendar-theme-color)'
  }))
)

const dominantMoodIndex = computed(() => {
  return getDominantMood(currentYear.value, currentMonth.value)
})

const dominantMoodColor = computed(() => {
  if (dominantMoodIndex.value === null) return null
  return MOOD_COLORS[dominantMoodIndex.value]
})

const consecutiveMoodSequences = computed(() => {
  return getConsecutiveMoodDates(currentYear.value, currentMonth.value)
})

const connectionLines = computed(() => {
  const lines = []
  const dominantIdx = dominantMoodIndex.value
  const isHighlighting = isHighlightingDominantMood.value
  
  consecutiveMoodSequences.value.forEach((sequence, seqIndex) => {
    if (sequence.length < 2) return
    
    const colorIndex = sequence[0].mood.colorIndex
    const color = MOOD_COLORS[colorIndex]
    let opacity = 1
    
    if (isHighlighting && dominantIdx !== null && colorIndex !== dominantIdx) {
      opacity = 0.1
    }
    
    for (let i = 0; i < sequence.length - 1; i++) {
      const point1 = connectionPoints.value[sequence[i].dateKey]
      const point2 = connectionPoints.value[sequence[i + 1].dateKey]
      
      if (point1 && point2) {
        lines.push({
          key: `line-${seqIndex}-${i}`,
          x1: point1.x,
          y1: point1.y,
          x2: point2.x,
          y2: point2.y,
          color,
          colorIndex,
          opacity
        })
      }
    }
  })
  
  return lines
})

const containerBounds = computed(() => {
  if (!swipeRef.value) return null
  const rect = swipeRef.value.getBoundingClientRect()
  return {
    left: rect.left,
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    width: rect.width,
    height: rect.height
  }
})

watch([currentYear, currentMonth], () => {
  nextTick(() => {
    updateConnectionPoints()
  })
})

watch([isInTransition, renderRows], (newVals) => {
  if (!newVals[0]) {
    nextTick(() => {
      updateConnectionPoints()
    })
  }
})

function onMoodSummaryHover(isHovering) {
  isHighlightingDominantMood.value = isHovering
}

function shouldHighlightMood(date) {
  if (!isHighlightingDominantMood.value) return true
  if (dominantMoodIndex.value === null) return true
  const mood = getMood(date)
  if (!mood) return false
  return mood.colorIndex === dominantMoodIndex.value
}

function onDayClick(event, dateObj, dayIndex, pageIndex) {
  if (moodSliderVisible.value) return
  changePageTo(dateObj.date)
  if (!isSameDay(new Date(dateObj.date), selected.value)) {
    selected.value = new Date(dateObj.date)
    emit('select-change', selected.value)
  }
}

function onHeartClick(event, dateObj) {
  event.stopPropagation()
  
  const rect = event.currentTarget.getBoundingClientRect()
  const calendarRect = swipeRef.value?.getBoundingClientRect()
  
  if (!calendarRect) return
  
  moodSliderPosition.value = {
    x: rect.left - calendarRect.left + rect.width / 2,
    y: rect.top - calendarRect.top
  }
  selectedMoodDate.value = dateObj
  moodSliderVisible.value = true
}

function closeMoodSlider() {
  moodSliderVisible.value = false
  selectedMoodDate.value = null
}

function onMoodConfirmed(colorIndex) {
  if (selectedMoodDate.value) {
    setMood(selectedMoodDate.value.date, colorIndex)
    emit('mood-change', {
      date: new Date(selectedMoodDate.value.date),
      colorIndex,
      color: MOOD_COLORS[colorIndex]
    })
  }
  closeMoodSlider()
  nextTick(() => {
    updateConnectionPoints()
  })
}

function updateConnectionPoints() {
  if (!connectionSvgRef.value) return
  
  const svg = connectionSvgRef.value
  const dayElements = svg.parentElement?.querySelectorAll('.ohhh-calendar-day')
  
  if (!dayElements) return
  
  const svgRect = svg.getBoundingClientRect()
  const newPoints = {}
  
  dayElements.forEach((dayEl, index) => {
    const heartEl = dayEl.querySelector('.ohhh-calendar-day--mood-heart')
    if (!heartEl) return
    
    const dayRect = dayEl.getBoundingClientRect()
    const heartRect = heartEl.getBoundingClientRect()
    
    const dateKey = getDateKeyFromElement(dayEl, index)
    if (!dateKey) return
    
    newPoints[dateKey] = {
      x: heartRect.left + heartRect.width / 2 - svgRect.left,
      y: heartRect.top + heartRect.height / 2 - svgRect.top
    }
  })
  
  connectionPoints.value = newPoints
}

function getDateKeyFromElement(element, index) {
  const currentPageDates = allRenderDates.value[1]
  if (!currentPageDates || !currentPageDates[index]) return null
  return currentPageDates[index].key
}

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

onMounted(() => {
  nextTick(() => {
    updateConnectionPoints()
  })
  
  window.addEventListener('resize', updateConnectionPoints)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateConnectionPoints)
})

defineExpose({
  toggleViewMode,
  changePageTo,
  changeSelectedDate,
  setMood,
  getMood,
  hasMood
})
</script>