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
    <GoalToolbar
      :goals="goals"
      @add-goal="handleAddGoal"
      @update-goal="handleUpdateGoal"
      @delete-goal="handleDeleteGoal"
    />

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
          v-for="dateObj in item"
          :key="dateObj.key"
          class="ohhh-calendar-day"
          :class="{
            'is-selected': isSameDay(dateObj.date, selected),
            'is-today': isSameDay(dateObj.date, new Date()),
            'other-month': !dateObj.current,
            'has-fitness-data': getDaySummary(dateObj.date).completedCount > 0,
            'all-completed': getDaySummary(dateObj.date).completedCount === goals.length && goals.length > 0
          }"
          @click="changeSelectedDate(dateObj.date)"
        >
          <div class="ohhh-calendar-day--inner">
            <div class="ohhh-calendar-day--inner-value">{{ dateObj.fullDate.date }}</div>
            <div class="ohhh-calendar-day--inner-label" v-if="$slots['day-label']">
              <slot name="day-label" :date="dateObj.date" />
            </div>
          </div>

          <div class="ohhh-calendar-day--fitness-summary">
            <div v-if="goals.length > 0" class="ohhh-calendar-day--mini-progress">
              <div
                class="ohhh-calendar-day--mini-progress-bar"
                :style="{
                  '--progress-percent': getDaySummary(dateObj.date).overallPercentage + '%',
                  '--progress-color': getProgressColor(getDaySummary(dateObj.date).overallPercentage)
                }"
              >
                <div class="ohhh-calendar-day--mini-progress-fill"></div>
              </div>
              <div class="ohhh-calendar-day--emojis">
                <span
                  v-for="(progress, idx) in getDaySummary(dateObj.date).progressItems.slice(0, 3)"
                  :key="progress.goalId"
                  class="ohhh-calendar-day--emoji"
                  :class="{ 'is-inactive': !progress.isCompleted }"
                >
                  {{ progress.emoji }}
                </span>
              </div>
            </div>
          </div>

          <button
            class="ohhh-calendar-day--checkin-btn"
            @click.stop="openCheckInPanel(dateObj.date)"
            title="打开打卡面板"
          >
            <span class="ohhh-calendar-day--checkin-icon">✓</span>
          </button>

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

    <CheckInPanel
      :visible="checkInPanelVisible"
      :date="checkInPanelDate"
      :goals="goals"
      :get-record="getRecord"
      :set-record="setRecord"
      :get-progress="getProgressForGoal"
      :get-progress-color="getProgressColor"
      @close="closeCheckInPanel"
    />
  </div>
</template>

<script setup>
import { computed, useTemplateRef, toRefs, ref } from 'vue'
import { useSwipe } from '@vueuse/core'
import { useCalendar } from './hooks/useCalendar.js'
import { useFitnessTracker } from './hooks/useFitnessTracker.js'
import { isSameDay, createWeekdays } from './utils'
import { icons } from './utils/icons.js'
import GoalToolbar from './components/GoalToolbar.vue'
import CheckInPanel from './components/CheckInPanel.vue'

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
  goals,
  addGoal,
  updateGoal,
  deleteGoal: deleteGoalById,
  getRecord,
  setRecord,
  getDaySummary,
  getProgress,
  getProgressColor
} = useFitnessTracker()

const checkInPanelVisible = ref(false)
const checkInPanelDate = ref(new Date())

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

function handleAddGoal(goal) {
  addGoal(goal)
}

function handleUpdateGoal(id, updates) {
  updateGoal(id, updates)
}

function handleDeleteGoal(id) {
  deleteGoalById(id)
}

function openCheckInPanel(date) {
  checkInPanelDate.value = new Date(date)
  checkInPanelVisible.value = true
}

function closeCheckInPanel() {
  checkInPanelVisible.value = false
}

function getProgressForGoal(goal) {
  return getProgress(checkInPanelDate.value, goal)
}

defineExpose({
  toggleViewMode,
  changePageTo,
  changeSelectedDate,
  goals,
  getRecord,
  setRecord,
  getDaySummary,
  openCheckInPanel
})
</script>

<style scoped lang="scss">
.ohhh-calendar-day {
  position: relative;
  padding-bottom: 4px;
  
  &.has-fitness-data {
    .ohhh-calendar-day--inner {
      box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
    }
  }
  
  &.all-completed {
    .ohhh-calendar-day--inner {
      box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.4);
    }
    
    &.is-today .ohhh-calendar-day--inner {
      background: linear-gradient(135deg, rgba(76, 175, 80, 0.15) 0%, rgba(67, 160, 71, 0.1) 100%);
    }
  }
}

.ohhh-calendar-day--fitness-summary {
  position: absolute;
  bottom: 2px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  width: 100%;
  max-width: 48px;
}

.ohhh-calendar-day--mini-progress {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.ohhh-calendar-day--mini-progress-bar {
  width: 100%;
  height: 4px;
  background: var(--calendar-fitness-progress-bg, #e2e8f0);
  border-radius: 2px;
  overflow: hidden;
  position: relative;
}

.ohhh-calendar-day--mini-progress-fill {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: var(--progress-color, var(--calendar-theme-color));
  border-radius: 2px;
  width: var(--progress-percent, 0%);
  transition: width 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.ohhh-calendar-day--emojis {
  display: flex;
  justify-content: center;
  gap: 1px;
}

.ohhh-calendar-day--emoji {
  font-size: 10px;
  opacity: 1;
  transition: all 0.3s ease;
  
  &.is-inactive {
    opacity: 0.25;
    filter: grayscale(1);
  }
}

.ohhh-calendar-day--checkin-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
  border: 1px solid rgba(99, 102, 241, 0.3);
  border-radius: 50%;
  cursor: pointer;
  opacity: 0;
  transform: scale(0.8);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 0;
  
  &:hover {
    background: var(--calendar-theme-gradient);
    transform: scale(1.1);
    
    .ohhh-calendar-day--checkin-icon {
      color: white;
    }
  }
}

.ohhh-calendar-day:hover .ohhh-calendar-day--checkin-btn,
.ohhh-calendar-day--checkin-btn:focus {
  opacity: 1;
  transform: scale(1);
}

.ohhh-calendar-day--checkin-icon {
  font-size: 11px;
  font-weight: bold;
  color: var(--calendar-theme-color);
  line-height: 1;
}

.ohhh-calendar-day.is-selected .ohhh-calendar-day--inner {
  background: var(--calendar-theme-gradient);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.ohhh-calendar-day.is-today .ohhh-calendar-day--inner-value {
  color: var(--calendar-days-today-color);
  font-weight: 700;
}
</style>
