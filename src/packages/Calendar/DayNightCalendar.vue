<template>
  <div
    class="day-night-calendar-container"
    :style="{
      '--calendar-rows': renderRows,
      '--calendar-transition-duration': duration,
      '--translate-distance': transformDistance,
      '--transition-duration': transitionDuration
    }"
  >
    <div class="top-bar">
      <ViewModeSelector :current-view="viewMode" @change="handleViewModeChange" />
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
          v-for="dateObj in item"
          :key="dateObj.key"
          class="ohhh-calendar-day-wrapper"
        >
          <FlipCardDay
            :date-obj="dateObj"
            :selected-date="selected"
            :view-mode="viewMode"
            :day-record="getDayRecord(dateObj.date)"
            :night-record="getNightRecord(dateObj.date)"
            @click="handleDayClick"
            @select="handleDaySelect"
          />
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

    <StatsPanel
      :day-stats="dayStats"
      :night-stats="nightStats"
      :top-day-tags="topDayTags"
      :top-night-tags="topNightTags"
    />

    <EditPanel
      :visible="isEditPanelOpen"
      :selected-date="selectedDate"
      :record="selectedRecord"
      :default-tags="defaultTags"
      @close="closeEditPanel"
      @save="handleSave"
      @clear-day="handleClearDay"
      @clear-night="handleClearNight"
    />
  </div>
</template>

<script setup>
import { computed, useTemplateRef, toRefs } from 'vue'
import { useSwipe } from '@vueuse/core'
import { useCalendar } from './hooks/useCalendar.js'
import { useDayNightCalendar } from './composables/useDayNightCalendar.js'
import { isSameDay, createWeekdays } from './utils'
import { icons } from './utils/icons.js'
import FlipCardDay from './components/FlipCardDay.vue'
import ViewModeSelector from './components/ViewModeSelector.vue'
import StatsPanel from './components/StatsPanel.vue'
import EditPanel from './components/EditPanel.vue'

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
  viewMode: calendarViewMode,
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
  viewMode: dayNightViewMode,
  calendarData,
  selectedDate,
  isEditPanelOpen,
  dayStats,
  nightStats,
  topDayTags,
  topNightTags,
  defaultTags,
  setViewMode,
  getRecordByDate,
  openEditPanel,
  closeEditPanel,
  saveBothRecords,
  clearDayRecord,
  clearNightRecord
} = useDayNightCalendar()

const headerLabel = computed(() => `${currentYear.value}年${currentMonth.value + 1}月`)
const weekdays = createWeekdays(weekStart.value)

const viewMode = computed({
  get() {
    return dayNightViewMode.value
  },
  set(val) {
    dayNightViewMode.value = val
  }
})

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
    if (calendarViewMode.value === 'week') {
      return new Date(
        new Date(currentRenderDates.value[0].date).setDate(currentRenderDates.value[0].date.getDate() - 1)
      )
    } else if (calendarViewMode.value === 'month') {
      return new Date(currentYear.value, currentMonth.value - 1)
    }
  }
  if (param === 'next-page') {
    if (calendarViewMode.value === 'week') {
      return new Date(
        new Date(currentRenderDates.value[6].date).setDate(currentRenderDates.value[6].date.getDate() + 1)
      )
    } else if (calendarViewMode.value === 'month') {
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

function handleViewModeChange(mode) {
  setViewMode(mode)
}

function getDayRecord(date) {
  const record = getRecordByDate(date)
  return record?.day || null
}

function getNightRecord(date) {
  const record = getRecordByDate(date)
  return record?.night || null
}

function handleDayClick(payload) {
  openEditPanel(payload.date)
}

function handleDaySelect(date) {
  changeSelectedDate(date)
}

const selectedRecord = computed(() => {
  if (selectedDate.value) {
    return getRecordByDate(selectedDate.value)
  }
  return null
})

function handleSave(payload) {
  saveBothRecords(
    payload.date,
    payload.dayContent,
    payload.dayTags,
    payload.nightContent,
    payload.nightTags
  )
}

function handleClearDay(date) {
  clearDayRecord(date)
}

function handleClearNight(date) {
  clearNightRecord(date)
}

defineExpose({
  toggleViewMode,
  changePageTo,
  changeSelectedDate,
  viewMode
})
</script>