<template>
  <div
    class="ohhh-calendar-container"
    :class="{ 'is-minimal': personalityMode === 'minimal', 'is-maximal': personalityMode === 'maximal' }"
    :style="{
      '--calendar-rows': renderRows,
      '--calendar-transition-duration': duration,
      '--translate-distance': transformDistance,
      '--transition-duration': transitionDuration
    }"
  >
    <!-- 模式切换开关 -->
    <div class="ohhh-calendar-mode-switch" @click="togglePersonalityMode">
      <span class="mode-label minimal" :class="{ active: personalityMode === 'minimal' }">极简</span>
      <div class="switch-track">
        <div class="switch-thumb" :class="{ 'to-maximal': isFlipping && personalityMode === 'maximal', 'to-minimal': isFlipping && personalityMode === 'minimal' }"></div>
      </div>
      <span class="mode-label maximal" :class="{ active: personalityMode === 'maximal' }">极繁</span>
    </div>

    <!-- 3D翻转容器 -->
    <div class="ohhh-calendar-flip-container" :class="{ 'flipping': isFlipping, 'flipped': personalityMode === 'maximal' }">
      <!-- 正面：极简模式 -->
      <div class="ohhh-calendar-flip-face flip-front">
        <MinimalModeView
          :all-render-dates="allRenderDates"
          :current-render-dates="currentRenderDates"
          :clicked-dates="clickedDates"
          :selected="selected"
          :current-year="currentYear"
          :current-month="currentMonth"
          :show-weekdays="showWeekdays"
          :show-toolbar="showToolbar"
          :show-footer="showFooter"
          :header-label="headerLabel"
          :view-mode="viewMode"
          :icons="icons"
          :weekdays="weekdays"
          :week-start="weekStart"
          @change-page-to="changePageTo"
          @change-selected-date="handleMinimalModeDateClick"
          @toggle-view-mode="toggleViewMode"
        />
      </div>

      <!-- 反面：极繁模式 -->
      <div class="ohhh-calendar-flip-face flip-back">
        <MaximalModeView
          :all-render-dates="allRenderDates"
          :current-render-dates="currentRenderDates"
          :selected="selected"
          :current-year="currentYear"
          :current-month="currentMonth"
          :show-weekdays="showWeekdays"
          :show-toolbar="showToolbar"
          :show-footer="showFooter"
          :header-label="headerLabel"
          :view-mode="viewMode"
          :icons="icons"
          :weekdays="weekdays"
          :week-start="weekStart"
          @change-page-to="changePageTo"
          @change-selected-date="changeSelectedDate"
          @toggle-view-mode="toggleViewMode"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, useTemplateRef, toRefs, ref, onMounted, onUnmounted } from 'vue'
import { useSwipe } from '@vueuse/core'
import { useCalendar } from './hooks/useCalendar.js'
import { isSameDay, createWeekdays, formatDateKey } from './utils'
import { icons } from './utils/icons.js'
import MinimalModeView from './components/MinimalModeView.vue'
import MaximalModeView from './components/MaximalModeView.vue'

const swipeRef = useTemplateRef('swp')

const emit = defineEmits(['select-change', 'view-change', 'mode-change'])

const props = defineProps({
  initialSelectedDate: {
    type: Date,
    default: () => new Date()
  },
  initialViewMode: {
    type: String,
    default: 'month'
  },
  initialPersonalityMode: {
    type: String,
    default: 'minimal'
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

const personalityMode = ref(props.initialPersonalityMode)
const isFlipping = ref(false)
const clickedDates = ref(new Set())

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

const headerLabel = computed(() => `${currentYear.value}年${currentMonth.value + 1}月`)
const weekdays = createWeekdays(weekStart.value)
const markerDateList = computed(() =>
  markerDates.value.map(item => ({
    date: new Date(typeof item === 'object' && item.date ? item.date : item),
    color: typeof item === 'object' && item.color ? item.color : 'var(--calendar-theme-color)'
  }))
)

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

function handleMinimalModeDateClick(date) {
  const dateKey = formatDateKey(date)
  clickedDates.value.add(dateKey)
  changeSelectedDate(date)
}

function togglePersonalityMode() {
  if (isFlipping.value) return
  isFlipping.value = true
  personalityMode.value = personalityMode.value === 'minimal' ? 'maximal' : 'minimal'
  emit('mode-change', personalityMode.value)
  setTimeout(() => {
    isFlipping.value = false
  }, 800)
}

function _getMarkerColor(date) {
  return markerDateList.value.find(d => isSameDay(d.date, date))?.color
}

defineExpose({
  toggleViewMode,
  changePageTo,
  changeSelectedDate,
  togglePersonalityMode,
  personalityMode
})
</script>

<style lang="scss">
@use './style/variable.scss';

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
  position: relative;
  perspective: 1500px;
  overflow: visible;

  &.is-minimal {
    --calendar-minimal-bg: #0a0a1a;
    --calendar-minimal-grid-color: rgba(255, 255, 255, 0.03);
    --calendar-minimal-text-color: rgba(255, 255, 255, 0.1);
    --calendar-glow-dot-color: #00d4ff;
    --calendar-glow-dot-glow: 0 0 10px #00d4ff, 0 0 20px #00d4ff, 0 0 30px rgba(0, 212, 255, 0.5);
  }

  &.is-maximal {
    --calendar-maximal-bg: #1a1a2e;
    --calendar-maximal-border-color: #4a4a6a;
    --calendar-maximal-border-width: 3px;
    --calendar-maximal-text-color: #e0e0e0;
    --calendar-progress-bg: #2a2a4a;
    --calendar-progress-fill: #ff6b6b;
    --calendar-percent-color: #ffd93d;
  }
}

.ohhh-calendar-mode-switch {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 20px;
  user-select: none;
  z-index: 100;
  position: relative;
}

.mode-label {
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;

  &.minimal {
    color: rgba(255, 255, 255, 0.4);
    &.active {
      color: #00d4ff;
      text-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
    }
  }

  &.maximal {
    color: rgba(255, 255, 255, 0.4);
    &.active {
      color: #ff6b6b;
      text-shadow: 0 0 10px rgba(255, 107, 107, 0.5);
    }
  }
}

.switch-track {
  width: 50px;
  height: 26px;
  background: linear-gradient(135deg, #2a2a4a 0%, #1a1a2e 100%);
  border-radius: 13px;
  position: relative;
  cursor: pointer;
  border: 2px solid rgba(255, 255, 255, 0.1);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
}

.switch-thumb {
  width: 20px;
  height: 20px;
  background: linear-gradient(135deg, #00d4ff 0%, #0099cc 100%);
  border-radius: 50%;
  position: absolute;
  top: 1px;
  left: 1px;
  transition: all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  box-shadow: 0 2px 8px rgba(0, 212, 255, 0.5);

  &.to-maximal {
    left: 25px;
    background: linear-gradient(135deg, #ff6b6b 0%, #cc5555 100%);
    box-shadow: 0 2px 8px rgba(255, 107, 107, 0.5);
  }
}

.ohhh-calendar-flip-container {
  position: relative;
  width: 100%;
  transform-style: preserve-3d;
  transition: transform 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55);

  &.flipped {
    transform: rotateY(180deg);
  }
}

.ohhh-calendar-flip-face {
  width: 100%;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  position: relative;
}

.flip-front {
  z-index: 2;
}

.flip-back {
  position: absolute;
  top: 0;
  left: 0;
  transform: rotateY(180deg);
  z-index: 1;
}
</style>
