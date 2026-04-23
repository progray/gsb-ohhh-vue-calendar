<template>
  <div
    class="ohhh-calendar-container"
    :class="{ 'is-transitioning': isInTransition }"
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
        :class="{
          'is-prev': index === 0,
          'is-current': index === 1,
          'is-next': index === 2
        }"
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
            <div v-if="goals.length > 0" class="ohhh-calendar-day--goal-icons">
              <template v-if="goals.length < 3">
                <button
                  v-for="goal in goals"
                  :key="goal.id"
                  class="ohhh-calendar-day--goal-btn"
                  :class="{
                    'is-completed': getProgress(dateObj.date, goal).isCompleted
                  }"
                  :style="{ '--goal-color': getProgressColor(getProgress(dateObj.date, goal).percentage, goal.color) }"
                  @click.stop="quickCheckIn(dateObj.date, goal)"
                  @contextmenu.stop.prevent="quickCheckInSubtract(dateObj.date, goal)"
                  :title="`${goal.name}: ${getProgress(dateObj.date, goal).current}/${goal.target}${goal.unit}\n左键+ | 右键-`"
                >
                  <span class="ohhh-calendar-day--goal-emoji">{{ goal.emoji }}</span>
                  <div class="ohhh-calendar-day--goal-progress">
                    <div
                      class="ohhh-calendar-day--goal-progress-fill"
                      :style="{ width: getProgress(dateObj.date, goal).percentage + '%' }"
                    ></div>
                  </div>
                </button>
              </template>

              <template v-else>
                <div class="ohhh-calendar-day--goal-stack" @click.stop="toggleGoalPanel(dateObj)">
                  <div
                    v-for="(goal, index) in goals.slice(0, 3)"
                    :key="goal.id"
                    class="ohhh-calendar-day--goal-stack-item"
                    :class="{
                      'is-completed': getProgress(dateObj.date, goal).isCompleted
                    }"
                    :style="{
                      '--goal-color': getProgressColor(getProgress(dateObj.date, goal).percentage, goal.color),
                      '--stack-index': index,
                      '--stack-offset': index * 8 + 'px'
                    }"
                  >
                    <span class="ohhh-calendar-day--goal-emoji">{{ goal.emoji }}</span>
                  </div>
                  <div v-if="goals.length > 3" class="ohhh-calendar-day--goal-stack-more">
                    +{{ goals.length - 3 }}
                  </div>
                </div>

                <div
                  v-if="activeGoalPanelDate && isSameDay(activeGoalPanelDate, dateObj.date)"
                  class="ohhh-calendar-day--goal-panel"
                  :class="{ 'goals-3': goals.length >= 3 && goals.length <= 5, 'goals-more': goals.length > 5 }"
                >
                  <button
                    v-for="goal in goals"
                    :key="goal.id"
                    class="ohhh-calendar-day--goal-btn"
                    :class="{
                      'is-completed': getProgress(dateObj.date, goal).isCompleted
                    }"
                    :style="{ '--goal-color': getProgressColor(getProgress(dateObj.date, goal).percentage, goal.color) }"
                    @click.stop="quickCheckIn(dateObj.date, goal)"
                    @contextmenu.stop.prevent="quickCheckInSubtract(dateObj.date, goal)"
                    :title="`${goal.name}: ${getProgress(dateObj.date, goal).current}/${goal.target}${goal.unit}\n左键+ | 右键-`"
                  >
                    <span class="ohhh-calendar-day--goal-emoji">{{ goal.emoji }}</span>
                    <div class="ohhh-calendar-day--goal-progress">
                      <div
                        class="ohhh-calendar-day--goal-progress-fill"
                        :style="{ width: getProgress(dateObj.date, goal).percentage + '%' }"
                      ></div>
                    </div>
                  </button>
                </div>
              </template>
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
const activeGoalPanelDate = ref(null)

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

function quickCheckIn(date, goal) {
  const current = getRecord(date, goal.id)
  const step = Math.max(1, Math.floor(goal.target / 5))
  const newValue = current + step
  setRecord(date, goal.id, Math.min(newValue, goal.target * 2))
}

function quickCheckInSubtract(date, goal) {
  const current = getRecord(date, goal.id)
  const step = Math.max(1, Math.floor(goal.target / 5))
  const newValue = current - step
  setRecord(date, goal.id, Math.max(newValue, 0))
}

function toggleGoalPanel(dateObj) {
  if (activeGoalPanelDate.value && isSameDay(activeGoalPanelDate.value, dateObj.date)) {
    activeGoalPanelDate.value = null
  } else {
    activeGoalPanelDate.value = new Date(dateObj.date)
  }
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
  padding-bottom: 2px;
  
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
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0 2px;
}

.ohhh-calendar-day--goal-icons {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2px;
  flex-wrap: nowrap;
}

.ohhh-calendar-day--goal-stack {
  display: flex;
  align-items: center;
  position: relative;
  height: 24px;
  cursor: pointer;
  padding: 0 2px;
}

.ohhh-calendar-day--goal-stack-item {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  background: rgba(255, 255, 255, 0.95);
  border: 2px solid white;
  border-radius: 50%;
  margin-left: calc(var(--stack-offset, 0px) * -1);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  z-index: calc(3 - var(--stack-index, 0));
  
  &:hover {
    transform: translateY(-2px) scale(1.1);
    z-index: 10;
  }
  
  &.is-completed {
    background: linear-gradient(135deg, rgba(76, 175, 80, 0.15) 0%, rgba(67, 160, 71, 0.1) 100%);
    border-color: rgba(76, 175, 80, 0.5);
    
    .ohhh-calendar-day--goal-emoji {
      filter: none;
      opacity: 1;
    }
  }
  
  &:not(.is-completed) {
    .ohhh-calendar-day--goal-emoji {
      filter: grayscale(0.5);
      opacity: 0.6;
    }
  }
}

.ohhh-calendar-day--goal-stack-more {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border: 2px solid white;
  border-radius: 50%;
  font-size: 10px;
  font-weight: 600;
  color: white;
  margin-left: -6px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  z-index: 0;
}

.ohhh-calendar-day--goal-panel {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 4px;
  padding: 8px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  z-index: 100;
  margin-bottom: 6px;
  animation: panelSlideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  min-width: 80px;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -6px;
    left: 50%;
    transform: translateX(-50%);
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-top: 6px solid white;
  }
  
  &.goals-3 {
    width: 120px;
  }
  
  &.goals-more {
    width: 160px;
  }
}

@keyframes panelSlideUp {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.ohhh-calendar-day--goal-btn {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2px 3px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 20px;
  
  &:hover {
    transform: translateY(-2px) scale(1.1);
    background: white;
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
    border-color: var(--goal-color, var(--calendar-theme-color));
  }
  
  &:active {
    transform: translateY(0) scale(0.95);
  }
  
  &.is-completed {
    background: linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(67, 160, 71, 0.05) 100%);
    border-color: rgba(76, 175, 80, 0.4);
    
    .ohhh-calendar-day--goal-emoji {
      filter: none;
      opacity: 1;
    }
  }
  
  &:not(.is-completed) {
    .ohhh-calendar-day--goal-emoji {
      filter: grayscale(0.5);
      opacity: 0.6;
    }
  }
}

.ohhh-calendar-day--goal-emoji {
  font-size: 12px;
  line-height: 1;
  margin-bottom: 1px;
  transition: all 0.3s ease;
}

.ohhh-calendar-day--goal-progress {
  width: 14px;
  height: 3px;
  background: #e2e8f0;
  border-radius: 2px;
  overflow: hidden;
}

.ohhh-calendar-day--goal-progress-fill {
  height: 100%;
  background: var(--goal-color, var(--calendar-theme-color));
  border-radius: 2px;
  transition: width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
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
