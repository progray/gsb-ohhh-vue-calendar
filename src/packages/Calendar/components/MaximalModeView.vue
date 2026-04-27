<template>
  <div class="maximal-mode-view"
    :style="{
      '--calendar-rows': renderRows,
      '--calendar-transition-duration': duration,
      '--translate-distance': transformDistance,
      '--transition-duration': transitionDuration
    }"
  >
    <div class="scroll-container" ref="scrollContainerRef">
      <div class="maximal-content">
        <div v-if="showToolbar" class="ohhh-calendar-toolbar">
          <slot name="toolbar" :year="currentYear" :month="currentMonth" :viewMode="viewMode">
            <div v-html="icons.arrowDoubleLeft" class="ohhh-calendar-toolbar--icon" @click="$emit('change-page-to', 'prev-year')" />
            <div v-html="icons.arrowLeft" class="ohhh-calendar-toolbar--icon" @click="$emit('change-page-to', 'prev-page')" />
            <div class="ohhh-calendar-toolbar--text">{{ headerLabel }}</div>
            <div v-html="icons.arrowRight" class="ohhh-calendar-toolbar--icon" @click="$emit('change-page-to', 'next-page')" />
            <div v-html="icons.arrowDoubleRight" class="ohhh-calendar-toolbar--icon" @click="$emit('change-page-to', 'next-year')" />
          </slot>
        </div>

        <div v-if="showWeekdays" class="ohhh-calendar-weekdays">
          <div v-for="(day, index) in weekdays" :key="day" class="ohhh-calendar-weekdays--weekday">
            <slot name="weekday" :weekday="day" :index="(index + weekStart) % 7">{{ day }}</slot>
            <div class="weekday-divider"></div>
          </div>
        </div>

        <div class="ohhh-calendar-wrapper">
          <div
            v-for="(item, index) in allRenderDates"
            :key="index"
            :style="{ left: 100 * (index - 1) + '%' }"
            class="ohhh-calendar-days"
            @transitionend="onTransitionEnd"
          >
            <div
              v-for="(dateObj, dayIndex) in item"
              :key="dateObj.key"
              class="ohhh-calendar-day"
              :class="{
                'is-selected': isSameDay(dateObj.date, selected),
                'is-today': isToday(dateObj.date),
                'is-past': isPast(dateObj.date),
                'is-future': isFuture(dateObj.date),
                'other-month': !dateObj.current
              }"
              @click="$emit('change-selected-date', dateObj.date)"
            >
              <div class="day-header">
                <span class="day-number">{{ dateObj.fullDate.date }}</span>
                <span class="day-status" v-if="isToday(dateObj.date)">今日</span>
              </div>

              <div class="progress-container">
                <div class="progress-label">
                  <span class="progress-title">时间燃尽</span>
                  <span class="progress-value">{{ getProgressDisplay(dateObj.date) }}%</span>
                </div>
                <div class="progress-bar-wrapper">
                  <div class="progress-bar-bg">
                    <div class="progress-bar-fill" :style="{ width: getProgressPercent(dateObj.date) + '%' }">
                      <div class="progress-bar-glow"></div>
                    </div>
                  </div>
                  <div class="progress-marks">
                    <span v-for="mark in 6" :key="mark" class="progress-mark"></span>
                  </div>
                </div>
                <div class="progress-scale">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>

              <div class="life-container" v-if="isToday(dateObj.date)">
                <div class="life-header">
                  <span class="life-title">生命余量</span>
                  <span class="life-percent">{{ remainingLifePercent }}%</span>
                </div>
                <div class="life-bar-wrapper">
                  <div class="life-bar-bg">
                    <div class="life-bar-fill" :style="{ width: (100 - dayProgress * 100) + '%' }">
                      <div class="life-bar-glow"></div>
                    </div>
                  </div>
                </div>
                <div class="life-details">
                  <span class="life-remaining">剩余 {{ formatRemainingTime() }}</span>
                  <span class="life-elapsed">已过 {{ formatElapsedTime() }}</span>
                </div>
              </div>

              <div class="day-footer" v-if="!isToday(dateObj.date)">
                <span class="day-indicator" :class="{
                  'past': isPast(dateObj.date),
                  'future': isFuture(dateObj.date)
                }">
                  {{ isPast(dateObj.date) ? '已完成' : '未开始' }}
                </span>
              </div>

              <div class="corner-decoration top-left"></div>
              <div class="corner-decoration top-right"></div>
              <div class="corner-decoration bottom-left"></div>
              <div class="corner-decoration bottom-right"></div>
            </div>
          </div>
        </div>

        <div v-if="showFooter" class="ohhh-calendar-footer">
          <slot name="footer" :year="currentYear" :month="currentMonth" :viewMode="viewMode">
            <div
              v-html="viewMode === 'week' ? icons.arrowDown : icons.arrowUp"
              class="ohhh-calendar-footer--icon"
              @click="$emit('toggle-view-mode')"
            />
          </slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { isSameDay, isToday, isPast, isFuture, getDayProgress, getRemainingLifePercent } from '../utils'

const props = defineProps({
  allRenderDates: {
    type: Array,
    required: true
  },
  currentRenderDates: {
    type: Array,
    required: true
  },
  selected: {
    type: Date,
    required: true
  },
  currentYear: {
    type: Number,
    required: true
  },
  currentMonth: {
    type: Number,
    required: true
  },
  showWeekdays: {
    type: Boolean,
    default: true
  },
  showToolbar: {
    type: Boolean,
    default: true
  },
  showFooter: {
    type: Boolean,
    default: true
  },
  headerLabel: {
    type: String,
    required: true
  },
  viewMode: {
    type: String,
    required: true
  },
  icons: {
    type: Object,
    required: true
  },
  weekdays: {
    type: Array,
    required: true
  },
  weekStart: {
    type: Number,
    default: 0
  },
  transformDistance: {
    type: String,
    default: '0px'
  },
  transitionDuration: {
    type: String,
    default: '0s'
  },
  renderRows: {
    type: Number,
    default: 6
  },
  duration: {
    type: String,
    default: '0.3s'
  }
})

const emit = defineEmits(['change-page-to', 'change-selected-date', 'toggle-view-mode', 'transition-end'])

const scrollContainerRef = ref(null)
const dayProgress = ref(getDayProgress())
const remainingLifePercent = ref(getRemainingLifePercent())
let updateInterval = null

function getProgressPercent(date) {
  if (isPast(date)) {
    return 100
  } else if (isFuture(date)) {
    return 0
  } else {
    return dayProgress.value * 100
  }
}

function getProgressDisplay(date) {
  return getProgressPercent(date).toFixed(1)
}

function formatRemainingTime() {
  const remaining = (1 - dayProgress.value) * 24
  const hours = Math.floor(remaining)
  const minutes = Math.floor((remaining - hours) * 60)
  return `${hours}时${minutes}分`
}

function formatElapsedTime() {
  const elapsed = dayProgress.value * 24
  const hours = Math.floor(elapsed)
  const minutes = Math.floor((elapsed - hours) * 60)
  return `${hours}时${minutes}分`
}

function onTransitionEnd() {
  emit('transition-end')
}

onMounted(() => {
  updateInterval = setInterval(() => {
    dayProgress.value = getDayProgress()
    remainingLifePercent.value = getRemainingLifePercent()
  }, 1000)
})

onUnmounted(() => {
  if (updateInterval) {
    clearInterval(updateInterval)
  }
})
</script>

<style lang="scss" scoped>
.maximal-mode-view {
  background: var(--calendar-maximal-bg, #1a1a2e);
  border-radius: 8px;
  overflow: hidden;
  position: relative;
}

.scroll-container {
  max-height: 600px;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, #4a4a6a 0%, #3a3a5a 100%);
    border-radius: 4px;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  &::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(180deg, #5a5a7a 0%, #4a4a6a 100%);
  }
}

.maximal-content {
  position: relative;
}

.ohhh-calendar-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  column-gap: 12px;
  padding: 16px 20px;
  background: linear-gradient(180deg, rgba(74, 74, 106, 0.5) 0%, transparent 100%);
  border-bottom: 3px solid var(--calendar-maximal-border-color, #4a4a6a);
  position: relative;
}

.ohhh-calendar-toolbar::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
}

.ohhh-calendar-toolbar--icon,
.ohhh-calendar-footer--icon {
  display: flex;
  cursor: pointer;
  padding: 8px;
  border: 2px solid var(--calendar-maximal-border-color, #4a4a6a);
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;

  &:hover {
    border-color: #ff6b6b;
    background: rgba(255, 107, 107, 0.1);
  }
}

.ohhh-calendar-toolbar--icon {
  fill: var(--calendar-maximal-text-color, #e0e0e0);
}

.ohhh-calendar-toolbar--icon svg {
  width: 20px;
  height: 20px;
}

.ohhh-calendar-toolbar--text {
  margin: 0 auto;
  font-size: 18px;
  font-weight: 700;
  color: var(--calendar-maximal-text-color, #e0e0e0);
  letter-spacing: 3px;
  text-transform: uppercase;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  border: 2px solid var(--calendar-maximal-border-color, #4a4a6a);
  padding: 8px 24px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
}

.ohhh-calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  justify-items: center;
  align-items: stretch;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 3px solid var(--calendar-maximal-border-color, #4a4a6a);
}

.ohhh-calendar-weekdays--weekday {
  font-size: 12px;
  font-weight: 700;
  color: var(--calendar-maximal-text-color, #e0e0e0);
  text-transform: uppercase;
  letter-spacing: 2px;
  padding: 12px 8px;
  text-align: center;
  position: relative;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.weekday-divider {
  position: absolute;
  right: 0;
  top: 20%;
  bottom: 20%;
  width: 1px;
  background: linear-gradient(180deg, transparent, rgba(74, 74, 106, 0.8), transparent);
}

.ohhh-calendar-wrapper {
  position: relative;
  padding: 4px;
  background: rgba(0, 0, 0, 0.2);
  overflow: hidden;
  height: calc(var(--calendar-rows) * 160px);
  transition: height var(--calendar-transition-duration) ease;
}

.ohhh-calendar-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  position: absolute;
  inset: 0;
  width: 100%;
  padding: 4px;
  transform: translate3d(var(--translate-distance), 0, 0);
  transition: transform var(--transition-duration) ease;
}

.ohhh-calendar-day {
  display: flex;
  flex-direction: column;
  min-height: 140px;
  cursor: pointer;
  position: relative;
  background: linear-gradient(135deg, #2a2a4a 0%, #1a1a3e 100%);
  border: 3px solid var(--calendar-maximal-border-color, #4a4a6a);
  padding: 10px;
  transition: all 0.3s ease;
  overflow: hidden;

  &:hover {
    border-color: #ff6b6b;
    background: linear-gradient(135deg, #3a3a5a 0%, #2a2a4e 100%);
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(255, 107, 107, 0.2);
  }

  &.other-month {
    opacity: 0.4;
    background: linear-gradient(135deg, #1a1a3a 0%, #0a0a2e 100%);
  }

  &.is-selected {
    border-color: #ffd93d;
    box-shadow: 0 0 20px rgba(255, 217, 61, 0.3);
  }

  &.is-today {
    border-color: #ff6b6b;
    background: linear-gradient(135deg, #3a2a4a 0%, #2a1a3e 100%);
  }

  &.is-past {
    .progress-bar-fill {
      background: linear-gradient(90deg, #4ade80, #22c55e);
    }
  }

  &.is-future {
    .progress-bar-fill {
      width: 0;
    }
  }
}

.day-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 2px dashed var(--calendar-maximal-border-color, #4a4a6a);
}

.day-number {
  font-size: 20px;
  font-weight: 900;
  color: var(--calendar-maximal-text-color, #e0e0e0);
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}

.day-status {
  font-size: 10px;
  font-weight: 700;
  color: #ff6b6b;
  background: rgba(255, 107, 107, 0.2);
  padding: 2px 8px;
  border: 1px solid #ff6b6b;
  border-radius: 2px;
  text-transform: uppercase;
  letter-spacing: 1px;
  animation: pulse 2s ease-in-out infinite;
}

.progress-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.progress-title {
  font-size: 10px;
  font-weight: 600;
  color: rgba(224, 224, 224, 0.7);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.progress-value {
  font-size: 12px;
  font-weight: 700;
  color: var(--calendar-progress-fill, #ff6b6b);
  font-family: 'Courier New', monospace;
}

.progress-bar-wrapper {
  position: relative;
  height: 16px;
  margin-bottom: 4px;
}

.progress-bar-bg {
  position: absolute;
  inset: 0;
  background: var(--calendar-progress-bg, #2a2a4a);
  border: 2px solid var(--calendar-maximal-border-color, #4a4a6a);
  border-radius: 2px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff6b6b, #ff8e8e);
  border-radius: 1px;
  position: relative;
  transition: width 0.5s ease;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 50%;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.2) 0%, transparent 100%);
  }
}

.progress-bar-glow {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 20px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.5), transparent);
  animation: shimmer 2s infinite;
}

.progress-marks {
  position: absolute;
  inset: 0;
  display: flex;
  justify-content: space-around;
  align-items: stretch;
  pointer-events: none;
  padding: 2px 4px;
}

.progress-mark {
  width: 1px;
  height: 100%;
  background: rgba(74, 74, 106, 0.5);
}

.progress-scale {
  display: flex;
  justify-content: space-between;
  font-size: 8px;
  color: rgba(224, 224, 224, 0.4);
  font-family: 'Courier New', monospace;
}

.life-container {
  margin-top: 8px;
  padding: 8px;
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid var(--calendar-maximal-border-color, #4a4a6a);
  border-radius: 4px;
}

.life-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.life-title {
  font-size: 10px;
  font-weight: 600;
  color: rgba(224, 224, 224, 0.7);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.life-percent {
  font-size: 14px;
  font-weight: 900;
  color: var(--calendar-percent-color, #ffd93d);
  font-family: 'Courier New', monospace;
  text-shadow: 0 0 10px rgba(255, 217, 61, 0.5);
}

.life-bar-wrapper {
  height: 8px;
  margin-bottom: 6px;
}

.life-bar-bg {
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid var(--calendar-maximal-border-color, #4a4a6a);
  border-radius: 2px;
  overflow: hidden;
}

.life-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #ffd93d, #fbbf24);
  border-radius: 1px;
  transition: width 1s linear;
}

.life-bar-glow {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 10px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  animation: shimmer 1.5s infinite;
}

.life-details {
  display: flex;
  justify-content: space-between;
  font-size: 9px;
  color: rgba(224, 224, 224, 0.5);
}

.life-remaining {
  color: var(--calendar-percent-color, #ffd93d);
}

.life-elapsed {
  color: #ff6b6b;
}

.day-footer {
  margin-top: 6px;
  display: flex;
  justify-content: flex-end;
}

.day-indicator {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  padding: 2px 6px;
  border-radius: 2px;

  &.past {
    color: #4ade80;
    background: rgba(74, 222, 128, 0.15);
    border: 1px solid rgba(74, 222, 128, 0.3);
  }

  &.future {
    color: rgba(224, 224, 224, 0.4);
    background: rgba(0, 0, 0, 0.2);
    border: 1px dashed var(--calendar-maximal-border-color, #4a4a6a);
  }
}

.corner-decoration {
  position: absolute;
  width: 8px;
  height: 8px;
  border-color: var(--calendar-maximal-border-color, #4a4a6a);
  transition: border-color 0.3s ease;

  &.top-left {
    top: -1px;
    left: -1px;
    border-top: 3px solid;
    border-left: 3px solid;
  }

  &.top-right {
    top: -1px;
    right: -1px;
    border-top: 3px solid;
    border-right: 3px solid;
  }

  &.bottom-left {
    bottom: -1px;
    left: -1px;
    border-bottom: 3px solid;
    border-left: 3px solid;
  }

  &.bottom-right {
    bottom: -1px;
    right: -1px;
    border-bottom: 3px solid;
    border-right: 3px solid;
  }
}

.ohhh-calendar-day:hover .corner-decoration {
  border-color: #ff6b6b;
}

.ohhh-calendar-footer {
  display: flex;
  justify-content: center;
  padding: 12px;
  background: linear-gradient(0deg, rgba(74, 74, 106, 0.5) 0%, transparent 100%);
  border-top: 3px solid var(--calendar-maximal-border-color, #4a4a6a);
}

.ohhh-calendar-footer--icon {
  fill: var(--calendar-maximal-text-color, #e0e0e0);
}

.ohhh-calendar-footer--icon svg {
  width: 18px;
  height: 18px;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(200%);
  }
}
</style>
