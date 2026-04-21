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
        <div class="weather-location" v-if="showWeather && location.name">
          <span class="location-icon">📍</span>
          <span class="location-name">{{ location.name }}</span>
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
            'has-weather': getWeatherForDate(dateObj.date)
          }"
          @click="handleDayClick(dateObj.date)"
        >
          <div class="ohhh-calendar-day--inner">
            <div class="ohhh-calendar-day--inner-value">{{ dateObj.fullDate.date }}</div>
            <div class="ohhh-calendar-day--inner-label" v-if="$slots['day-label']">
              <slot name="day-label" :date="dateObj.date" />
            </div>
            <!-- 天气信息 -->
            <div
              v-if="showWeather && getWeatherForDate(dateObj.date)"
              class="ohhh-calendar-day--weather"
              @click.stop="showWeatherAnimation(dateObj.date)"
            >
              <span class="weather-icon">{{ getWeatherForDate(dateObj.date).icon }}</span>
              <span class="weather-temp">
                {{ Math.round(getWeatherForDate(dateObj.date).tempMax) }}°/{{ Math.round(getWeatherForDate(dateObj.date).tempMin) }}°
              </span>
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

    <!-- 天气动画组件 -->
    <WeatherAnimation
      v-if="showWeather"
      :visible="weatherAnimationVisible"
      :weather-data="selectedWeatherData"
      @close="closeWeatherAnimation"
    />
  </div>
</template>

<script setup>
import { computed, useTemplateRef, toRefs, ref, onMounted } from 'vue'
import { useSwipe } from '@vueuse/core'
import { useCalendar } from './hooks/useCalendar.js'
import { useWeather } from './hooks/useWeather.js'
import { isSameDay, createWeekdays } from './utils'
import { icons } from './utils/icons.js'
import WeatherAnimation from './components/WeatherAnimation.vue'

const swipeRef = useTemplateRef('swp')

const emit = defineEmits(['select-change', 'view-change', 'weather-animation-open'])

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
  showWeather: {
    type: Boolean,
    default: true
  },
  useUserLocation: {
    type: Boolean,
    default: false
  }
})

const { initialSelectedDate, initialViewMode, weekStart, markerDates, duration, showWeather, useUserLocation } = toRefs(props)

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
  location,
  hasWeatherData,
  fetchWeather,
  getUserLocation,
  getWeatherForDate,
  BEIJING_LAT,
  BEIJING_LNG
} = useWeather()

const weatherAnimationVisible = ref(false)
const selectedWeatherData = ref(null)

const headerLabel = computed(() => `${currentYear.value}年${currentMonth.value + 1}月`)
const weekdays = createWeekdays(weekStart.value)
const markerDateList = computed(() =>
  markerDates.value.map(item => ({
    date: new Date(typeof item === 'object' && item.date ? item.date : item),
    color: typeof item === 'object' && item.color ? item.color : 'var(--calendar-theme-color)'
  }))
)

onMounted(async () => {
  if (showWeather.value) {
    await initWeather()
  }
})

async function initWeather() {
  let lat = BEIJING_LAT
  let lng = BEIJING_LNG
  
  if (useUserLocation.value) {
    const userLoc = await getUserLocation()
    lat = userLoc.lat
    lng = userLoc.lng
  }
  
  await fetchWeather(lat, lng)
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

function handleDayClick(date) {
  const weatherData = getWeatherForDate(date)
  if (weatherData && showWeather.value) {
    showWeatherAnimation(date)
  }
  changeSelectedDate(date)
}

function showWeatherAnimation(date) {
  const weatherData = getWeatherForDate(date)
  if (weatherData) {
    selectedWeatherData.value = weatherData
    weatherAnimationVisible.value = true
    emit('weather-animation-open', weatherData)
  }
}

function closeWeatherAnimation() {
  weatherAnimationVisible.value = false
  selectedWeatherData.value = null
}

function _getMarkerColor(date) {
  return markerDateList.value.find(d => isSameDay(d.date, date))?.color
}

defineExpose({
  toggleViewMode,
  changePageTo,
  changeSelectedDate,
  initWeather,
  fetchWeather,
  getWeatherForDate,
  showWeatherAnimation,
  closeWeatherAnimation
})
</script>
