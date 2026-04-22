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
    <!-- 波形动画背景 -->
    <WaveAnimation 
      v-if="showWaveAnimation && currentHourlyData"
      :hourly-data="currentHourlyData"
      :data-type="weatherDataType"
      :show-info="true"
      :animation-speed="1"
      class="wave-animation-bg"
    />

    <!-- 顶部工具栏 -->
    <div v-if="showToolbar" class="ohhh-calendar-toolbar">
      <slot name="toolbar" :year="currentYear" :month="currentMonth" :viewMode="viewMode">
        <div v-html="icons.arrowDoubleLeft" class="ohhh-calendar-toolbar--icon" @click="changePageTo('prev-year')" />
        <div v-html="icons.arrowLeft" class="ohhh-calendar-toolbar--icon" @click="changePageTo('prev-page')" />
        <div class="ohhh-calendar-toolbar--text">{{ headerLabel }}</div>
        <!-- 天气类型选择器 -->
        <WeatherTypeSelector 
          v-if="enableWeather"
          v-model="weatherDataType"
          class="weather-type-selector-wrapper"
        />
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
            'has-weather-data': enableWeather && hasWeatherDataForDate(dateObj.date)
          }"
          @click="handleDateClick(dateObj)"
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
import { computed, useTemplateRef, toRefs, ref, watch, onMounted, nextTick } from 'vue'
import { useSwipe } from '@vueuse/core'
import { useCalendar } from './hooks/useCalendar.js'
import { isSameDay, createWeekdays } from './utils'
import { icons } from './utils/icons.js'
import WaveAnimation from './components/WaveAnimation.vue'
import WeatherTypeSelector from './components/WeatherTypeSelector.vue'
import {
  fetchWeatherData,
  processWeatherData,
  getHourlyDataForDate
} from './services/weatherService.js'

const swipeRef = useTemplateRef('swp')

const emit = defineEmits(['select-change', 'view-change', 'weather-change'])

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
  enableWeather: {
    type: Boolean,
    default: true
  },
  showWaveAnimation: {
    type: Boolean,
    default: true
  },
  weatherCoordinates: {
    type: Object,
    default: () => ({ latitude: 39.9042, longitude: 116.4074 })
  },
  forecastDays: {
    type: Number,
    default: 16
  }
})

const { initialSelectedDate, initialViewMode, weekStart, markerDates, duration, weatherCoordinates, forecastDays } = toRefs(props)

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

const weatherDataType = ref('temperature')
const weatherData = ref(null)
const currentHourlyData = ref(null)
const isLoadingWeather = ref(false)

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

async function loadWeatherData() {
  if (!props.enableWeather) return
  
  isLoadingWeather.value = true
  try {
    const rawData = await fetchWeatherData(weatherCoordinates.value, forecastDays.value)
    if (rawData) {
      weatherData.value = processWeatherData(rawData)
      emit('weather-change', weatherData.value)
      
      if (selected.value) {
        updateHourlyDataForDate(selected.value)
      }
    }
  } catch (error) {
    console.error('Failed to load weather data:', error)
  } finally {
    isLoadingWeather.value = false
  }
}

function hasWeatherDataForDate(date) {
  if (!weatherData.value || !weatherData.value.dates) return false
  
  const dateStr = formatDateString(date)
  return weatherData.value.dates.includes(dateStr)
}

function formatDateString(date) {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function updateHourlyDataForDate(date) {
  if (!weatherData.value) return
  
  const dateStr = formatDateString(date)
  const hourlyData = getHourlyDataForDate(weatherData.value, dateStr)
  
  if (hourlyData) {
    currentHourlyData.value = hourlyData
  }
}

function handleDateClick(dateObj) {
  changeSelectedDate(dateObj.date)
  
  if (props.enableWeather && props.showWaveAnimation) {
    updateHourlyDataForDate(dateObj.date)
  }
}

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

watch(() => props.weatherCoordinates, () => {
  loadWeatherData()
}, { deep: true })

watch(() => props.enableWeather, (newVal) => {
  if (newVal && !weatherData.value) {
    loadWeatherData()
  }
})

watch(selected, (newDate) => {
  if (props.enableWeather && props.showWaveAnimation) {
    updateHourlyDataForDate(newDate)
  }
})

onMounted(() => {
  if (props.enableWeather) {
    loadWeatherData()
  }
})

defineExpose({
  toggleViewMode,
  changePageTo,
  changeSelectedDate,
  loadWeatherData,
  getWeatherData: () => weatherData.value,
  getCurrentHourlyData: () => currentHourlyData.value
})
</script>

<style scoped>
.wave-animation-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
  pointer-events: none;
}

.weather-type-selector-wrapper {
  margin-left: 8px;
}
</style>
