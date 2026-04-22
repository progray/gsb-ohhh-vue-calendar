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
    <div v-if="triggeredReminders.length > 0" class="ohhh-calendar-notifications">
      <TransitionGroup name="notification">
        <div
          v-for="reminder in triggeredReminders"
          :key="reminder.id"
          class="ohhh-calendar-notification"
          :style="{
            '--notification-color': reminder.color,
            '--notification-index': triggeredReminders.indexOf(reminder)
          }"
        >
          <div class="ohhh-calendar-notification--icon" :style="{ background: reminder.color }">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
              <circle cx="12" cy="13" r="8"/>
              <path d="M12 9v4l2 2"/>
            </svg>
          </div>
          <div class="ohhh-calendar-notification--content">
            <div class="ohhh-calendar-notification--title">提醒</div>
            <div class="ohhh-calendar-notification--time">{{ formatTriggerTime(reminder.triggerTime) }}</div>
          </div>
          <div class="ohhh-calendar-notification--close" @click="dismissNotification(reminder.id)">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6 6 18"/>
              <path d="m6 6 12 12"/>
            </svg>
          </div>
        </div>
      </TransitionGroup>
    </div>

    <div v-if="showToolbar" class="ohhh-calendar-toolbar">
      <slot name="toolbar" :year="currentYear" :month="currentMonth" :viewMode="viewMode">
        <div v-html="icons.arrowDoubleLeft" class="ohhh-calendar-toolbar--icon" @click="changePageTo('prev-year')" />
        <div v-html="icons.arrowLeft" class="ohhh-calendar-toolbar--icon" @click="changePageTo('prev-page')" />
        <div class="ohhh-calendar-toolbar--text">{{ headerLabel }}</div>
        <div v-html="icons.arrowRight" class="ohhh-calendar-toolbar--icon" @click="changePageTo('next-page')" />
        <div v-html="icons.arrowDoubleRight" class="ohhh-calendar-toolbar--icon" @click="changePageTo('next-year')" />
        <div class="ohhh-calendar-toolbar--alarm" @click="showReminderList = true">
          <div v-html="icons.alarmClock" class="ohhh-calendar-alarm--icon" />
          <span v-if="hasPendingReminders" class="ohhh-calendar-alarm--badge">{{ pendingReminders.length }}</span>
        </div>
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
            'has-reminder': getReminderForDate(dateObj.date)
          }"
          @click="handleDayClick(dateObj.date)"
        >
          <div 
            class="ohhh-calendar-day--inner"
            :style="getDayInnerStyle(dateObj.date)"
          >
            <div class="ohhh-calendar-day--inner-value">{{ dateObj.fullDate.date }}</div>
            <div class="ohhh-calendar-day--inner-label" v-if="$slots['day-label']">
              <slot name="day-label" :date="dateObj.date" />
            </div>
          </div>
          <div 
            v-if="getReminderForDate(dateObj.date)"
            class="ohhh-calendar-day--reminder-dot"
            :style="getReminderDotStyle(dateObj.date)"
          />
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

    <Transition name="modal">
      <div v-if="showReminderPopup" class="ohhh-calendar-modal-overlay" @click.self="closeReminderPopup">
        <div class="ohhh-calendar-modal">
          <div class="ohhh-calendar-modal--header">
            <span class="ohhh-calendar-modal--title">{{ editingReminder ? '编辑提醒' : '设置提醒' }}</span>
            <span class="ohhh-calendar-modal--close" @click="closeReminderPopup">×</span>
          </div>
          <div class="ohhh-calendar-modal--body">
            <div class="ohhh-calendar-modal--field">
              <label>提醒时间</label>
              <input 
                type="datetime-local" 
                v-model="reminderForm.time"
                class="ohhh-calendar-modal--input"
                :min="minDateTime"
              />
            </div>
            <div class="ohhh-calendar-modal--field">
              <label>提醒颜色</label>
              <div class="ohhh-calendar-color-picker">
                <div 
                  v-for="color in colorOptions" 
                  :key="color"
                  class="ohhh-calendar-color-option"
                  :class="{ 'is-selected': reminderForm.color === color }"
                  :style="{ background: color }"
                  @click="reminderForm.color = color"
                />
              </div>
            </div>
            <div v-if="reminderError" class="ohhh-calendar-modal--error">{{ reminderError }}</div>
          </div>
          <div class="ohhh-calendar-modal--footer">
            <button v-if="editingReminder" class="ohhh-calendar-modal--btn ohhh-calendar-modal--btn-danger" @click="handleClearReminder">
              清除
            </button>
            <button class="ohhh-calendar-modal--btn ohhh-calendar-modal--btn-cancel" @click="closeReminderPopup">
              取消
            </button>
            <button class="ohhh-calendar-modal--btn ohhh-calendar-modal--btn-primary" @click="handleSaveReminder">
              确定
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="modal">
      <div v-if="showReminderList" class="ohhh-calendar-modal-overlay" @click.self="showReminderList = false">
        <div class="ohhh-calendar-modal ohhh-calendar-reminder-list">
          <div class="ohhh-calendar-modal--header">
            <span class="ohhh-calendar-modal--title">待触发提醒</span>
            <span class="ohhh-calendar-modal--close" @click="showReminderList = false">×</span>
          </div>
          <div class="ohhh-calendar-modal--body">
            <div v-if="pendingReminders.length === 0" class="ohhh-calendar-empty">
              暂无待触发提醒
            </div>
            <TransitionGroup name="reminder-item">
              <div 
                v-for="reminder in pendingReminders" 
                :key="reminder.id"
                class="ohhh-calendar-reminder-item"
                @click="navigateToReminder(reminder)"
              >
                <div class="ohhh-calendar-reminder-item--color" :style="{ background: reminder.color }">
                  <div 
                    class="ohhh-calendar-reminder-item--progress" 
                    :style="{ 
                      width: getReminderProgress(reminder) + '%',
                      opacity: getReminderProgress(reminder) > 0 ? 1 : 0
                    }"
                  />
                </div>
                <div class="ohhh-calendar-reminder-item--info">
                  <div class="ohhh-calendar-reminder-item--time">{{ formatTriggerTime(reminder.triggerTime) }}</div>
                  <div class="ohhh-calendar-reminder-item--countdown">{{ getReminderCountdown(reminder) }}</div>
                </div>
                <div class="ohhh-calendar-reminder-item--progress-text">
                  {{ getReminderProgress(reminder) }}%
                </div>
              </div>
            </TransitionGroup>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { computed, useTemplateRef, toRefs, ref, onMounted, onUnmounted, watch } from 'vue'
import { useSwipe } from '@vueuse/core'
import { useCalendar } from './hooks/useCalendar.js'
import { useReminders } from './hooks/useReminders.js'
import { isSameDay, createWeekdays } from './utils'
import { icons } from './utils/icons.js'

const swipeRef = useTemplateRef('swp')

const emit = defineEmits(['select-change', 'view-change', 'reminder-add', 'reminder-remove', 'reminder-trigger'])

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
  reminders,
  pendingReminders,
  triggeredReminders,
  hasPendingReminders,
  getReminderByDate,
  isValidTriggerTime,
  addReminder,
  removeReminder,
  removeTriggeredReminder,
  getReminderState,
  formatCountdown,
  formatTriggerTime
} = useReminders()

const headerLabel = computed(() => `${currentYear.value}年${currentMonth.value + 1}月`)
const weekdays = createWeekdays(weekStart.value)
const markerDateList = computed(() =>
  markerDates.value.map(item => ({
    date: new Date(typeof item === 'object' && item.date ? item.date : item),
    color: typeof item === 'object' && item.color ? item.color : 'var(--calendar-theme-color)'
  }))
)

const showReminderPopup = ref(false)
const showReminderList = ref(false)
const selectedDateForReminder = ref(null)
const editingReminder = ref(null)
const reminderForm = ref({
  time: '',
  color: '#ff6b6b'
})
const reminderError = ref('')

const colorOptions = [
  '#ff6b6b',
  '#feca57',
  '#48dbfb',
  '#1dd1a1',
  '#5f27cd',
  '#ff9ff3',
  '#54a0ff',
  '#00d2d3'
]

const minDateTime = computed(() => {
  const now = new Date()
  now.setSeconds(now.getSeconds() + 1)
  return now.toISOString().slice(0, 19)
})

let countdownInterval = null

function startCountdownUpdates() {
  countdownInterval = setInterval(() => {}, 1000)
}

function stopCountdownUpdates() {
  if (countdownInterval) {
    clearInterval(countdownInterval)
    countdownInterval = null
  }
}

function getReminderForDate(date) {
  return getReminderByDate(date)
}

function getDayInnerStyle(date) {
  const reminder = getReminderForDate(date)
  if (!reminder) return {}
  
  const state = getReminderState(reminder)
  if (!state) return {}
  
  if (state.state === 'far') {
    return {}
  }
  
  const opacity = state.state === 'urgent' ? 0.3 + (state.progress / 100) * 0.5 : 0.3
  
  return {
    background: `color-mix(in srgb, ${reminder.color} ${opacity * 100}%, transparent)`
  }
}

function getReminderDotStyle(date) {
  const reminder = getReminderForDate(date)
  if (!reminder) return {}
  
  const state = getReminderState(reminder)
  if (!state) return {}
  
  let opacity = 0.4
  if (state.state === 'near') {
    opacity = 0.6
  } else if (state.state === 'urgent') {
    opacity = 0.6 + (state.progress / 100) * 0.4
  }
  
  return {
    background: reminder.color,
    opacity
  }
}

function getReminderProgress(reminder) {
  const state = getReminderState(reminder)
  return state ? Math.round(state.progress) : 0
}

function getReminderCountdown(reminder) {
  const state = getReminderState(reminder)
  if (!state || state.diffMs <= 0) return '00:00:00'
  return formatCountdown(state.diffMs)
}

function handleDayClick(date) {
  changePageTo(date)
  if (!isSameDay(new Date(date), selected.value)) {
    selected.value = new Date(date)
    emit('select-change', selected.value)
  }
  
  openReminderPopup(date)
}

function openReminderPopup(date) {
  selectedDateForReminder.value = new Date(date)
  const existingReminder = getReminderByDate(date)
  
  if (existingReminder) {
    editingReminder.value = existingReminder
    reminderForm.value = {
      time: existingReminder.triggerTime.toISOString().slice(0, 16),
      color: existingReminder.color
    }
  } else {
    editingReminder.value = null
    const defaultTime = new Date(date)
    defaultTime.setHours(9, 0, 0, 0)
    
    const now = new Date()
    if (defaultTime <= now) {
      defaultTime.setTime(now.getTime() + 60000)
    }
    
    reminderForm.value = {
      time: defaultTime.toISOString().slice(0, 16),
      color: '#ff6b6b'
    }
  }
  
  reminderError.value = ''
  showReminderPopup.value = true
}

function closeReminderPopup() {
  showReminderPopup.value = false
  selectedDateForReminder.value = null
  editingReminder.value = null
  reminderForm.value = {
    time: '',
    color: '#ff6b6b'
  }
  reminderError.value = ''
}

function handleSaveReminder() {
  if (!reminderForm.value.time) {
    reminderError.value = '请选择提醒时间'
    return
  }
  
  const triggerTime = new Date(reminderForm.value.time)
  
  if (!isValidTriggerTime(triggerTime)) {
    reminderError.value = '不能设置过去的时间'
    return
  }
  
  const result = addReminder(
    selectedDateForReminder.value,
    triggerTime,
    reminderForm.value.color
  )
  
  if (result.success) {
    emit('reminder-add', result.reminder)
    closeReminderPopup()
  } else {
    reminderError.value = result.message
  }
}

function handleClearReminder() {
  if (editingReminder.value) {
    const result = removeReminder(selectedDateForReminder.value)
    if (result.success) {
      emit('reminder-remove', editingReminder.value)
      closeReminderPopup()
    }
  }
}

function dismissNotification(id) {
  removeTriggeredReminder(id)
}

function navigateToReminder(reminder) {
  showReminderList.value = false
  switchPageToTargetDate(reminder.triggerTime)
  selected.value = new Date(reminder.triggerTime)
  emit('select-change', selected.value)
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

function _getMarkerColor(date) {
  return markerDateList.value.find(d => isSameDay(d.date, date))?.color
}

onMounted(() => {
  startCountdownUpdates()
})

onUnmounted(() => {
  stopCountdownUpdates()
})

defineExpose({
  toggleViewMode,
  changePageTo,
  changeSelectedDate: (date) => {
    changePageTo(date)
    if (!isSameDay(new Date(date), selected.value)) {
      selected.value = new Date(date)
      emit('select-change', selected.value)
    }
  },
  getReminders: () => reminders.value,
  getPendingReminders: () => pendingReminders.value
})
</script>
