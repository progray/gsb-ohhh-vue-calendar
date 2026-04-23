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
            'other-month': !dateObj.current
          }"
          :style="getDateStyle(dateObj)"
          @click="handleDateClick(dateObj)"
        >
          <div class="ohhh-calendar-day--value">{{ dateObj.fullDate.date }}</div>
          <div class="ohhh-calendar-day--ring" :style="getRingStyle(dateObj)">
            <div class="ohhh-calendar-day--ring-inner" :style="getRingInnerStyle(dateObj)"></div>
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

  <TextureCard
    v-model:visible="textureCardVisible"
    :texture-data="selectedTextureData"
    :date="selectedDateForCard"
  />
</template>

<script setup>
import { ref, computed, useTemplateRef, toRefs } from 'vue'
import { useSwipe } from '@vueuse/core'
import { useCalendar } from './hooks/useCalendar.js'
import { isSameDay, createWeekdays } from './utils'
import { icons } from './utils/icons.js'
import { generateTexture } from './utils/texture.js'
import TextureCard from './components/TextureCard.vue'

const swipeRef = useTemplateRef('swp')

const emit = defineEmits(['select-change', 'view-change', 'texture-click'])

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

const textureCardVisible = ref(false)
const selectedTextureData = ref(null)
const selectedDateForCard = ref(null)

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

function handleDateClick(dateObj) {
  changeSelectedDate(dateObj.date)
  
  if (dateObj.current) {
    const textureData = generateTexture(dateObj.key)
    selectedTextureData.value = textureData
    selectedDateForCard.value = dateObj.date
    textureCardVisible.value = true
    emit('texture-click', { date: dateObj.date, textureData })
  }
}

function getDateStyle(dateObj) {
  if (!dateObj.current) {
    return {}
  }
  
  const textureData = generateTexture(dateObj.key)
  return {
    '--texture-stroke-color': textureData.colors.strokeColor,
    '--texture-shadow-rgba': textureData.colors.shadowRgba
  }
}

function getRingStyle(dateObj) {
  if (!dateObj.current) {
    return {}
  }
  
  const isSelected = isSameDay(dateObj.date, selected.value)
  const isToday = isSameDay(dateObj.date, new Date())
  const textureData = generateTexture(dateObj.key)
  
  const baseStrokeWidth = isSelected ? '3px' : '2px'
  const baseShadowOpacity = isSelected ? '0.8' : '0.5'
  const baseShadowBlur = isSelected ? '15px' : '8px'
  
  return {
    '--ring-stroke-color': textureData.colors.strokeColor,
    '--ring-stroke-width': baseStrokeWidth,
    '--ring-shadow-rgba': textureData.colors.shadowRgba.replace('0.6', baseShadowOpacity),
    '--ring-shadow-blur': baseShadowBlur,
    '--ring-scale': isSelected ? '1.05' : '1'
  }
}

function getRingInnerStyle(dateObj) {
  if (!dateObj.current) {
    return { background: 'var(--calendar-days-other-month-background, #f5f5f5)' }
  }
  
  const textureData = generateTexture(dateObj.key)
  return {
    backgroundImage: `url(${textureData.dataUrl})`,
    backgroundSize: 'cover',
    backgroundRepeat: 'no-repeat'
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

<style scoped>
.ohhh-calendar-container {
  -webkit-tap-highlight-color: transparent;
  background: var(--calendar-background);
  font-family:
    Open Sans,
    -apple-system,
    BlinkMacSystemFont,
    Helvetica Neue,
    Helvetica,
    Segoe UI,
    Arial,
    Roboto,
    PingFang SC,
    miui,
    Hiragino Sans GB,
    Microsoft Yahei,
    sans-serif;
}

.ohhh-calendar-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  column-gap: var(--calendar-toolbar-column-gap);
  padding: var(--calendar-toolbar-padding);
}
.ohhh-calendar-toolbar--icon,
.ohhh-calendar-footer--icon {
  display: flex;
  cursor: pointer;
}
.ohhh-calendar-toolbar--icon {
  fill: var(--calendar-toolbar-icon-color);
}
.ohhh-calendar-toolbar--icon svg {
  width: var(--calendar-toolbar-icon-size);
  height: var(--calendar-toolbar-icon-size);
}
.ohhh-calendar-toolbar--text {
  margin: 0 auto;
  font-size: var(--calendar-toolbar-font-size);
  font-weight: 500;
}

.ohhh-calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  justify-items: center;
  align-items: center;
  height: var(--calendar-weekdays-height);
}
.ohhh-calendar-weekdays--weekday {
  font-size: var(--calendar-weekdays-font-size);
  font-weight: 500;
  color: var(--calendar-weekdays-color);
}

.ohhh-calendar-wrapper {
  position: relative;
  overflow: hidden;
  height: calc(var(--calendar-rows) * var(--calendar-row-height));
  transition: height var(--calendar-transition-duration) ease;
}
.ohhh-calendar-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  position: absolute;
  inset: 0;
  width: 100%;
  transform: translate3d(var(--translate-distance), 0, 0);
  transition: transform var(--transition-duration) ease;
}

.ohhh-calendar-day {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: var(--calendar-row-height);
  cursor: pointer;
  position: relative;
}

.ohhh-calendar-day--value {
  font-size: var(--calendar-days-value-font-size);
  color: var(--calendar-days-value-color);
  margin-bottom: 4px;
  z-index: 2;
  font-weight: 500;
  transition: color 0.2s ease;
}

.ohhh-calendar-day--ring {
  width: calc(var(--calendar-row-height) * 0.6);
  height: calc(var(--calendar-row-height) * 0.6);
  border-radius: 50%;
  position: relative;
  overflow: hidden;
  border: var(--ring-stroke-width, 2px) solid var(--ring-stroke-color, var(--calendar-theme-color));
  box-shadow: 
    0 0 var(--ring-shadow-blur, 8px) var(--ring-shadow-rgba, rgba(64, 158, 255, 0.5)),
    0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  transform: scale(var(--ring-scale, 1));
}

.ohhh-calendar-day--ring-inner {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background-size: cover;
  background-position: center;
}

.ohhh-calendar-day--marker {
  flex: none;
  margin-top: 4px;
  width: var(--calendar-days-marker-size);
  height: var(--calendar-days-marker-size);
  border-radius: 50%;
}

.ohhh-calendar-day.other-month .ohhh-calendar-day--value {
  color: var(--calendar-days-other-month-color);
}

.ohhh-calendar-day.other-month .ohhh-calendar-day--ring {
  border-color: var(--calendar-days-other-month-color);
  box-shadow: none;
  opacity: 0.5;
}

.ohhh-calendar-day.is-today .ohhh-calendar-day--value {
  color: var(--ring-stroke-color, var(--calendar-theme-color));
  font-weight: 700;
}

.ohhh-calendar-day.is-today .ohhh-calendar-day--ring {
  animation: pulse-ring 2s ease-in-out infinite;
}

.ohhh-calendar-day.is-today.is-selected .ohhh-calendar-day--ring {
  animation: pulse-ring-selected 1.5s ease-in-out infinite;
}

.ohhh-calendar-day.is-selected .ohhh-calendar-day--value {
  color: var(--ring-stroke-color, var(--calendar-theme-color));
  font-weight: 700;
}

@keyframes pulse-ring {
  0%, 100% {
    box-shadow: 
      0 0 8px var(--ring-shadow-rgba, rgba(64, 158, 255, 0.5)),
      0 2px 8px rgba(0, 0, 0, 0.1);
    transform: scale(1);
  }
  50% {
    box-shadow: 
      0 0 20px var(--ring-shadow-rgba, rgba(64, 158, 255, 0.7)),
      0 4px 16px rgba(0, 0, 0, 0.15);
    transform: scale(1.03);
  }
}

@keyframes pulse-ring-selected {
  0%, 100% {
    box-shadow: 
      0 0 15px var(--ring-shadow-rgba, rgba(64, 158, 255, 0.8)),
      0 4px 12px rgba(0, 0, 0, 0.15);
    transform: scale(1.05);
  }
  50% {
    box-shadow: 
      0 0 30px var(--ring-shadow-rgba, rgba(64, 158, 255, 0.9)),
      0 6px 20px rgba(0, 0, 0, 0.2);
    transform: scale(1.08);
  }
}

.ohhh-calendar-footer {
  display: flex;
  justify-content: center;
  padding: var(--calendar-footer-padding);
}
.ohhh-calendar-footer--icon {
  fill: var(--calendar-footer-icon-color);
}
.ohhh-calendar-footer--icon svg {
  width: var(--calendar-footer-icon-size);
  height: var(--calendar-footer-icon-size);
}
</style>
