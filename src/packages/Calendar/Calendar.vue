<template>
  <div
    class="ohhh-calendar-wrapper-container"
    :class="{ 'worker-view-active': workerViewActive, 'celebration-mode': isCelebration }"
  >
    <WorkerSidebar
      ref="sidebarRef"
      :initial-open="showWorkerView"
      :initial-retirement-date="retirementDate"
      @toggle="onSidebarToggle"
      @date-change="onRetirementDateChange"
    />

    <div
      class="ohhh-calendar-main"
    >
      <div
        class="ohhh-calendar-container"
        :class="{ 'celebration-border': isCelebration }"
        :style="{
          '--calendar-rows': renderRows,
          '--calendar-transition-duration': duration,
          '--translate-distance': transformDistance,
          '--transition-duration': transitionDuration
        }"
      >
        <div v-if="showWorkerView && workerViewActive && retirementDateObj" class="worker-view-header">
          <span class="worker-view-title">
            🏃 打工人倒计时模式
            <span v-if="isCelebration" class="celebration-badge">🎉 即将解脱！</span>
          </span>
        </div>

        <div v-if="showToolbar" class="ohhh-calendar-toolbar">
          <slot name="toolbar" :year="currentYear" :month="currentMonth" :viewMode="viewMode">
            <div v-html="icons.arrowDoubleLeft" class="ohhh-calendar-toolbar--icon" @click="changePageTo('prev-year')" />
            <div v-html="icons.arrowLeft" class="ohhh-calendar-toolbar--icon" @click="changePageTo('prev-page')" />
            <div class="ohhh-calendar-toolbar--text">{{ headerLabel }}</div>
            <div v-html="icons.arrowRight" class="ohhh-calendar-toolbar--icon" @click="changePageTo('next-page')" />
            <div v-html="icons.arrowDoubleRight" class="ohhh-calendar-toolbar--icon" @click="changePageTo('next-year')" />
          </slot>
        </div>

        <div v-if="showWeekdays" class="ohhh-calendar-weekdays">
          <div v-for="(day, index) in weekdays" :key="day" class="ohhh-calendar-weekdays--weekday">
            <slot name="weekday" :weekday="day" :index="(index + weekStart) % 7">{{ day }}</slot>
          </div>
        </div>

        <div ref="swp" class="ohhh-calendar-wrapper">
          <div
            v-for="(item, index) in allRenderDates"
            :key="index"
            :style="{ left: 100 * (index - 1) + '%' }"
            class="ohhh-calendar-days"
            @transitionend="onTransitionEnd"
          >
            <div
              v-for="(dateObj, dateIndex) in item"
              :key="dateObj.key"
              class="ohhh-calendar-day"
              :class="getDayClass(dateObj)"
              @click="handleDayClick($event, dateObj, dateIndex)"
            >
              <div class="ohhh-calendar-day--inner" :class="getInnerDayClass(dateObj)">
                <div class="ohhh-calendar-day--inner-value">
                  <template v-if="workerViewActive && retirementDateObj">
                    <template v-if="isHoliday(dateObj.date) || isWeekend(dateObj.date)">
                      <span class="holiday-text">休</span>
                    </template>
                    <template v-else-if="isFutureWorkDay(dateObj.date)">
                      <span class="countdown-text">剩 {{ getWorkDaysRemaining(dateObj.date) }} 天</span>
                    </template>
                    <template v-else>
                      {{ dateObj.fullDate.date }}
                    </template>
                  </template>
                  <template v-else>
                    {{ dateObj.fullDate.date }}
                  </template>
                </div>
                <div class="ohhh-calendar-day--inner-label" v-if="$slots['day-label'] && !workerViewActive">
                  <slot name="day-label" :date="dateObj.date" />
                </div>
              </div>
              <div class="ohhh-calendar-day--marker" :style="{ background: _getMarkerColor(dateObj.date) }" />
            </div>
          </div>
        </div>

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
    </div>

    <div class="emoji-overlay">
      <transition-group name="emoji-fade">
        <div
          v-for="emoji in floatingEmojis"
          :key="emoji.id"
          class="floating-emoji"
          :style="{
            left: emoji.x + 'px',
            bottom: '0px',
            '--emoji-start-y': emoji.startY + 'px'
          }"
        >
          💪
        </div>
      </transition-group>
    </div>
  </div>
</template>

<script setup>
import { computed, useTemplateRef, toRefs, ref, reactive, nextTick } from 'vue'
import { useSwipe } from '@vueuse/core'
import { useCalendar } from './hooks/useCalendar.js'
import { isSameDay, createWeekdays } from './utils'
import { icons } from './utils/icons.js'
import WorkerSidebar from './WorkerSidebar.vue'

const swipeRef = useTemplateRef('swp')
const sidebarRef = useTemplateRef('sidebarRef')

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
  showWorkerView: {
    type: Boolean,
    default: true
  },
  retirementDate: {
    type: String,
    default: ''
  }
})

const { initialSelectedDate, initialViewMode, weekStart, markerDates, duration, showWorkerView } = toRefs(props)

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

const workerViewActive = ref(false)
const sidebarIsOpen = ref(props.initialOpen)
const retirementDateObj = ref(null)
const isCelebration = ref(false)
const floatingEmojis = ref([])
let emojiIdCounter = 0

const holidays = ['2026-05-01', '2026-05-02', '2026-05-03']

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

function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function isWeekend(date) {
  const day = date.getDay()
  return day === 0 || day === 6
}

function isHoliday(date) {
  const dateStr = formatDate(date)
  return holidays.includes(dateStr)
}

function isFutureWorkDay(date) {
  if (!retirementDateObj.value) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const checkDate = new Date(date)
  checkDate.setHours(0, 0, 0, 0)

  if (checkDate < today) return false
  if (checkDate > retirementDateObj.value) return false
  if (isWeekend(checkDate) || isHoliday(checkDate)) return false

  return true
}

function countWorkDaysFromDate(startDate, endDate) {
  let count = 0
  const current = new Date(startDate)
  const end = new Date(endDate)
  while (current <= end) {
    if (!isWeekend(current) && !isHoliday(current)) {
      count++
    }
    current.setDate(current.getDate() + 1)
  }
  return count
}

function getWorkDaysRemaining(date) {
  if (!retirementDateObj.value) return 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const targetDate = new Date(date)
  targetDate.setHours(0, 0, 0, 0)

  if (targetDate > retirementDateObj.value) return 0

  return countWorkDaysFromDate(today, targetDate)
}

function getDayClass(dateObj) {
  const classes = []
  if (isSameDay(dateObj.date, selected.value)) classes.push('is-selected')
  if (isSameDay(dateObj.date, new Date())) classes.push('is-today')
  if (!dateObj.current) classes.push('other-month')

  if (workerViewActive.value && retirementDateObj.value) {
    if (isHoliday(dateObj.date) || isWeekend(dateObj.date)) {
      classes.push('is-holiday')
    }
    if (isFutureWorkDay(dateObj.date)) {
      classes.push('is-future-workday')
    }
  }

  return classes
}

function getInnerDayClass(dateObj) {
  const classes = []
  if (workerViewActive.value && retirementDateObj.value) {
    if (isHoliday(dateObj.date) || isWeekend(dateObj.date)) {
      classes.push('holiday-inner')
    }
  }
  return classes
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

function handleDayClick(event, dateObj, dateIndex) {
  changeSelectedDate(dateObj.date)
  if (workerViewActive.value) {
    spawnEmoji(event)
  }
}

function spawnEmoji(event) {
  const id = ++emojiIdCounter
  const rect = event.currentTarget.getBoundingClientRect()
  const containerRect = event.currentTarget.closest('.ohhh-calendar-wrapper-container').getBoundingClientRect()

  const x = rect.left - containerRect.left + rect.width / 2
  const startY = containerRect.bottom - rect.top - rect.height / 2

  const emoji = reactive({
    id,
    x,
    startY
  })

  floatingEmojis.value.push(emoji)

  setTimeout(() => {
    const index = floatingEmojis.value.findIndex(e => e.id === id)
    if (index > -1) {
      floatingEmojis.value.splice(index, 1)
    }
  }, 2500)
}

function onSidebarToggle(isOpen) {
  sidebarIsOpen.value = isOpen
  workerViewActive.value = isOpen && retirementDateObj.value !== null
}

function onRetirementDateChange({ retirementDate, isCelebration: celebration }) {
  retirementDateObj.value = retirementDate
  isCelebration.value = celebration
  workerViewActive.value = sidebarIsOpen.value && retirementDate !== null
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
.ohhh-calendar-wrapper-container {
  display: flex;
  position: relative;
  min-height: 100%;
  width: 100%;
}

.ohhh-calendar-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  transition: margin-left 0.3s ease;
}

.worker-view-header {
  padding: 10px 20px;
  background: linear-gradient(90deg, #409eff, #66b1ff);
  color: #fff;
  font-size: 14px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 6px 6px 0 0;
}

.worker-view-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.celebration-badge {
  background: rgba(255, 215, 0, 0.4);
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 12px;
  animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.08); }
}

.ohhh-calendar-day.is-holiday .ohhh-calendar-day--inner-value {
  font-size: 16px;
  font-weight: bold;
}

.ohhh-calendar-day.is-future-workday .ohhh-calendar-day--inner-value {
  font-size: 11px;
  line-height: 1.3;
}

.holiday-text {
  color: #67c23a;
  font-weight: 600;
}

.countdown-text {
  color: #f56c6c;
  font-weight: 600;
}

.holiday-inner {
  background: rgba(103, 194, 58, 0.12) !important;
  border: 1px solid rgba(103, 194, 58, 0.3);
}

.ohhh-calendar-day.is-holiday .ohhh-calendar-day--inner-value .holiday-text {
  color: #67c23a;
}

.celebration-border {
  position: relative;
  border-radius: 8px;
  padding: 3px;
  background: linear-gradient(
    90deg,
    #ff6b6b,
    #ffd93d,
    #6bcb77,
    #4d96ff,
    #9b59b6,
    #ff6b6b
  );
  background-size: 400% 400%;
  animation: rainbowBorder 3s linear infinite;
}

.celebration-border::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 8px;
  padding: 3px;
  background: linear-gradient(
    90deg,
    #ff6b6b,
    #ffd93d,
    #6bcb77,
    #4d96ff,
    #9b59b6,
    #ff6b6b
  );
  background-size: 400% 400%;
  animation: rainbowBorder 3s linear infinite;
  filter: blur(10px);
  opacity: 0.6;
  z-index: -1;
}

.celebration-border > * {
  position: relative;
  z-index: 1;
}

@keyframes rainbowBorder {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.emoji-overlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9999;
  overflow: hidden;
}

.floating-emoji {
  position: absolute;
  font-size: 36px;
  animation: emojiFloat 2.2s ease-out forwards;
  transform-origin: center bottom;
}

@keyframes emojiFloat {
  0% {
    transform: translateY(0) scale(0.5);
    opacity: 0;
  }
  10% {
    transform: translateY(0) scale(1.2);
    opacity: 1;
  }
  30% {
    transform: translateY(-30px) scale(1);
  }
  100% {
    transform: translateY(-200px) scale(0.8);
    opacity: 0;
  }
}

.emoji-fade-enter-active,
.emoji-fade-leave-active {
  transition: opacity 0.3s ease;
}

.emoji-fade-enter-from,
.emoji-fade-leave-to {
  opacity: 0;
}

.worker-view-active .ohhh-calendar-day {
  transition: all 0.3s ease;
}

.worker-view-active .ohhh-calendar-day:hover {
  transform: scale(1.05);
}
</style>
