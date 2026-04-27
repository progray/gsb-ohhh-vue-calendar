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
            'other-month': !dateObj.current,
            'is-past': _isPastDate(dateObj.date) && !isSameDay(dateObj.date, new Date()),
            'has-capsule': _hasCapsule(dateObj.date)
          }"
          @click="handleDateClick(dateObj.date)"
        >
          <div class="ohhh-calendar-day--inner">
            <div class="ohhh-calendar-day--inner-value">{{ dateObj.fullDate.date }}</div>
            <div class="ohhh-calendar-day--inner-label" v-if="$slots['day-label']">
              <slot name="day-label" :date="dateObj.date" />
            </div>
          </div>
          <div class="ohhh-calendar-day--capsule" v-if="_hasCapsule(dateObj.date)">
            <div
              v-html="icons[_getCapsuleIcon(dateObj.date)]"
              class="ohhh-calendar-day--capsule-icon"
              :class="{
                'is-locked': _getCapsuleStatus(dateObj.date) === CapsuleStatus.LOCKED,
                'is-unlocked': _getCapsuleStatus(dateObj.date) === CapsuleStatus.UNLOCKED,
                'is-expired': _getCapsuleStatus(dateObj.date) === CapsuleStatus.EXPIRED
              }"
            ></div>
          </div>
          <div class="ohhh-calendar-day--marker" :style="{ background: _getMarkerColor(dateObj.date) }" />
        </div>
      </div>
    </div>

    <!-- 底部工具栏 -->
    <div v-if="showFooter" class="ohhh-calendar-footer">
      <slot name="footer" :year="currentYear" :month="currentMonth" :viewMode="viewMode">
        <div
          class="ohhh-calendar-footer--clear-expired"
          v-if="showClearExpired && expiredCapsules.length > 0"
          @click="handleClearExpired"
        >
          清除过期胶囊 ({{ expiredCapsules.length }})
        </div>
        <div
          v-html="viewMode === 'week' ? icons.arrowDown : icons.arrowUp"
          class="ohhh-calendar-footer--icon"
          @click="toggleViewMode"
        />
      </slot>
    </div>

    <!-- 时光胶囊编辑弹窗 -->
    <TimeCapsuleEditModal
      :visible="isEditModalOpen"
      :date="selectedDate"
      :capsule="selectedCapsule"
      :is-past="_isPastDate(selectedDate)"
      @close="closeEditModal"
      @save="handleSaveCapsule"
      @delete="handleDeleteCapsule"
    />

    <!-- 时光胶囊倒计时弹窗 -->
    <TimeCapsuleCountdown
      :visible="isCountdownModalOpen"
      :date="selectedDate"
      @close="closeCountdownModal"
    />

    <!-- 时光胶囊刮刮乐弹窗 -->
    <TimeCapsuleScratch
      :visible="isScratchModalOpen"
      :date="selectedDate"
      :capsule="selectedCapsule"
      :is-today="_isToday(selectedDate)"
      @close="closeScratchModal"
      @progress-update="handleProgressUpdate"
    />
  </div>
</template>

<script setup>
import { computed, useTemplateRef, toRefs, onMounted } from 'vue'
import { useSwipe } from '@vueuse/core'
import { useCalendar } from './hooks/useCalendar.js'
import { useTimeCapsule } from './hooks/useTimeCapsule.js'
import { isSameDay, createWeekdays } from './utils'
import { icons } from './utils/icons.js'
import TimeCapsuleEditModal from './components/TimeCapsuleEditModal.vue'
import TimeCapsuleCountdown from './components/TimeCapsuleCountdown.vue'
import TimeCapsuleScratch from './components/TimeCapsuleScratch.vue'

const swipeRef = useTemplateRef('swp')

const emit = defineEmits(['select-change', 'view-change', 'capsule-save', 'capsule-delete'])

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
  showClearExpired: {
    type: Boolean,
    default: true
  },
  duration: {
    type: String,
    default: '0.3s'
  }
})

const { initialSelectedDate, initialViewMode, weekStart, markerDates, duration, showClearExpired } = toRefs(props)

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
  selectedDate,
  selectedCapsule,
  isEditModalOpen,
  isCountdownModalOpen,
  isScratchModalOpen,
  datesWithCapsules,
  expiredCapsules,
  refreshCapsules,
  getCapsuleForDate,
  hasCapsuleForDate,
  getCapsuleStatusForDate,
  saveNewCapsule,
  deleteExistingCapsule,
  clearAllExpired,
  updateProgress,
  openEditModal,
  closeEditModal,
  closeCountdownModal,
  closeScratchModal,
  isPastDate: _isPastDate,
  isFutureDate: _isFutureDate,
  isToday: _isToday,
  CapsuleStatus
} = useTimeCapsule()

onMounted(() => {
  refreshCapsules()
})

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

function handleDateClick(date) {
  changeSelectedDate(date)
  
  const capsule = getCapsuleForDate(date)
  const status = getCapsuleStatusForDate(date)
  
  selectedDate.value = date
  selectedCapsule.value = capsule
  
  if (capsule) {
    if (status === CapsuleStatus.LOCKED) {
      isCountdownModalOpen.value = true
    } else {
      isScratchModalOpen.value = true
    }
  } else {
    isEditModalOpen.value = true
  }
}

function handleSaveCapsule({ date, content }) {
  try {
    const saved = saveNewCapsule(date, content)
    emit('capsule-save', saved)
    closeEditModal()
  } catch (e) {
    console.error('保存胶囊失败:', e)
  }
}

function handleDeleteCapsule(date) {
  const result = deleteExistingCapsule(date)
  if (result) {
    emit('capsule-delete', date)
  }
  closeEditModal()
}

function handleClearExpired() {
  const count = clearAllExpired()
  console.log(`已清除 ${count} 个过期胶囊`)
}

function handleProgressUpdate({ date, progress }) {
  updateProgress(date, progress)
}

function _getMarkerColor(date) {
  return markerDateList.value.find(d => isSameDay(d.date, date))?.color
}

function _hasCapsule(date) {
  return hasCapsuleForDate(date)
}

function _getCapsuleStatus(date) {
  return getCapsuleStatusForDate(date)
}

function _getCapsuleIcon(date) {
  const status = _getCapsuleStatus(date)
  if (status === CapsuleStatus.LOCKED) {
    return 'capsuleLocked'
  }
  return 'capsuleUnlocked'
}

defineExpose({
  toggleViewMode,
  changePageTo,
  changeSelectedDate,
  refreshCapsules,
  clearAllExpired,
  getCapsuleForDate,
  hasCapsuleForDate
})
</script>
