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
    <!-- 游戏状态显示区域 -->
    <div v-if="isGameActive || showSuccessMessage" class="ohhh-calendar-game-status">
      <div v-if="isGameActive" class="ohhh-calendar-game-status--info">
        <div class="ohhh-calendar-game-status--target">
          <span class="label">目标:</span>
          <span class="value target-value">{{ targetNumber }}</span>
        </div>
        <div class="ohhh-calendar-game-status--sum">
          <span class="label">当前和:</span>
          <span class="value" :class="{ 'sum-match': currentSum === targetNumber, 'sum-over': currentSum > targetNumber }">
            {{ currentSum }}
          </span>
        </div>
      </div>
      <div v-if="showSuccessMessage" class="ohhh-calendar-game-status--success">
        <span class="success-text">🎉 恭喜！挑战成功！</span>
        <span class="success-time">用时: {{ formatTime(lastGameDuration) }}</span>
      </div>
    </div>

    <!-- 顶部工具栏 -->
    <div v-if="showToolbar" class="ohhh-calendar-toolbar">
      <slot name="toolbar" :year="currentYear" :month="currentMonth" :viewMode="viewMode">
        <div v-html="icons.arrowDoubleLeft" class="ohhh-calendar-toolbar--icon" @click="changePageTo('prev-year')" />
        <div v-html="icons.arrowLeft" class="ohhh-calendar-toolbar--icon" @click="changePageTo('prev-page')" />
        <div class="ohhh-calendar-toolbar--text">{{ headerLabel }}</div>
        <div class="ohhh-calendar-toolbar--game-button" @click="toggleGame">
          <span v-if="!isGameActive">求和挑战</span>
          <span v-else>重新开始</span>
        </div>
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
            'game-selected': isGameSelected(dateObj.key),
            'game-celebrating': isCelebrating && isGameSelected(dateObj.key)
          }"
          @click="handleDayClick(dateObj)"
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
import { computed, useTemplateRef, toRefs, ref, watch } from 'vue'
import { useSwipe } from '@vueuse/core'
import { useCalendar } from './hooks/useCalendar.js'
import { isSameDay, createWeekdays } from './utils'
import { icons } from './utils/icons.js'

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
  toggleViewMode: _toggleViewMode
} = useCalendar({ initialSelectedDate, initialViewMode, weekStart, duration }, emit)

const headerLabel = computed(() => `${currentYear.value}年${currentMonth.value + 1}月`)
const weekdays = createWeekdays(weekStart.value)
const markerDateList = computed(() =>
  markerDates.value.map(item => ({
    date: new Date(typeof item === 'object' && item.date ? item.date : item),
    color: typeof item === 'object' && item.color ? item.color : 'var(--calendar-theme-color)'
  }))
)

// 游戏相关状态
const isGameActive = ref(false)
const showSuccessMessage = ref(false)
const targetNumber = ref(0)
const selectedGameDates = ref([])
const currentSum = ref(0)
const gameStartTime = ref(null)
const lastGameDuration = ref(0)
const isCelebrating = ref(false)
const celebrateTimeout = ref(null)

// 游戏统计数据
const gameStats = ref({
  totalCompleted: 0,
  history: []
})

// 从 localStorage 加载游戏统计
function loadGameStats() {
  try {
    const saved = localStorage.getItem('sumChallengeStats')
    if (saved) {
      gameStats.value = JSON.parse(saved)
    }
  } catch (e) {
    console.error('Failed to load game stats:', e)
  }
}

// 保存游戏统计到 localStorage
function saveGameStats() {
  try {
    localStorage.setItem('sumChallengeStats', JSON.stringify(gameStats.value))
  } catch (e) {
    console.error('Failed to save game stats:', e)
  }
}

// 格式化时间显示
function formatTime(ms) {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  if (minutes > 0) {
    return `${minutes}分${remainingSeconds}秒`
  }
  return `${remainingSeconds}秒`
}

// 获取当前视图中可用的日期（只包含当前月/周的日期）
function getAvailableDates() {
  return currentRenderDates.value.filter(d => d.current).map(d => ({
    key: d.key,
    date: d.fullDate.date
  }))
}

// 生成所有可能的子集和（从2个到6个元素）
function generateAllPossibleSums(dates) {
  const n = dates.length
  const result = new Map()

  function backtrack(start, count, currentSum, currentItems) {
    if (count >= 2 && count <= 6) {
      if (!result.has(currentSum)) {
        result.set(currentSum, [...currentItems])
      }
    }
    if (count >= 6) return

    for (let i = start; i < n; i++) {
      currentItems.push(dates[i].key)
      backtrack(i + 1, count + 1, currentSum + dates[i].date, currentItems)
      currentItems.pop()
    }
  }

  backtrack(0, 0, 0, [])
  return result
}

// 生成目标数字，保证有解
function generateTargetNumber() {
  const availableDates = getAvailableDates()
  if (availableDates.length < 2) {
    return null
  }

  const possibleSums = generateAllPossibleSums(availableDates)
  if (possibleSums.size === 0) {
    return null
  }

  const sums = Array.from(possibleSums.keys())
  const randomIndex = Math.floor(Math.random() * sums.length)
  const selectedSum = sums[randomIndex]

  return {
    target: selectedSum,
    solution: possibleSums.get(selectedSum)
  }
}

// 切换游戏状态
function toggleGame() {
  if (isGameActive.value) {
    resetGame()
  }
  startGame()
}

// 开始游戏
function startGame() {
  const targetData = generateTargetNumber()
  if (!targetData) {
    console.warn('无法生成目标数字，当前视图可用日期不足')
    return
  }

  targetNumber.value = targetData.target
  selectedGameDates.value = []
  currentSum.value = 0
  gameStartTime.value = Date.now()
  showSuccessMessage.value = false
  isCelebrating.value = false
  isGameActive.value = true

  if (celebrateTimeout.value) {
    clearTimeout(celebrateTimeout.value)
    celebrateTimeout.value = null
  }
}

// 重置游戏
function resetGame() {
  isGameActive.value = false
  showSuccessMessage.value = false
  isCelebrating.value = false
  selectedGameDates.value = []
  currentSum.value = 0
  targetNumber.value = 0

  if (celebrateTimeout.value) {
    clearTimeout(celebrateTimeout.value)
    celebrateTimeout.value = null
  }
}

// 检查日期是否在游戏中被选中
function isGameSelected(dateKey) {
  return selectedGameDates.value.includes(dateKey)
}

// 处理日期格子点击
function handleDayClick(dateObj) {
  if (isGameActive.value && dateObj.current) {
    toggleGameSelection(dateObj)
  } else {
    changeSelectedDate(dateObj.date)
  }
}

// 切换游戏选中状态
function toggleGameSelection(dateObj) {
  const index = selectedGameDates.value.indexOf(dateObj.key)
  
  if (index > -1) {
    selectedGameDates.value.splice(index, 1)
  } else {
    if (selectedGameDates.value.length < 6) {
      selectedGameDates.value.push(dateObj.key)
    }
  }

  updateCurrentSum()
  checkWin()
}

// 更新当前和
function updateCurrentSum() {
  const availableDates = getAvailableDates()
  currentSum.value = selectedGameDates.value.reduce((sum, key) => {
    const date = availableDates.find(d => d.key === key)
    return sum + (date ? date.date : 0)
  }, 0)
}

// 检查是否获胜
function checkWin() {
  if (currentSum.value === targetNumber.value && selectedGameDates.value.length >= 2) {
    const endTime = Date.now()
    lastGameDuration.value = endTime - gameStartTime.value

    gameStats.value.totalCompleted++
    gameStats.value.history.push({
      date: new Date().toISOString(),
      duration: lastGameDuration.value,
      target: targetNumber.value,
      selectedDates: [...selectedGameDates.value]
    })
    saveGameStats()

    isCelebrating.value = true
    showSuccessMessage.value = true

    celebrateTimeout.value = setTimeout(() => {
      isCelebrating.value = false
    }, 2500)
  }
}

// 切换视图模式时重置游戏
function toggleViewMode() {
  resetGame()
  _toggleViewMode()
}

// 监听视图变化，重置游戏
watch([currentYear, currentMonth, viewMode], () => {
  resetGame()
})

// 滑动事件监听
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

// 初始化时加载游戏统计
loadGameStats()

defineExpose({
  toggleViewMode,
  changePageTo,
  changeSelectedDate
})
</script>

<style scoped>
/* 游戏状态区域 */
.ohhh-calendar-game-status {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  margin: 16px;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.ohhh-calendar-game-status--info {
  display: flex;
  justify-content: space-around;
  width: 100%;
}

.ohhh-calendar-game-status--target,
.ohhh-calendar-game-status--sum {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.ohhh-calendar-game-status--target .label,
.ohhh-calendar-game-status--sum .label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
}

.ohhh-calendar-game-status--target .value,
.ohhh-calendar-game-status--sum .value {
  font-size: 28px;
  font-weight: bold;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.ohhh-calendar-game-status--target .target-value {
  color: #ffd700;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.6);
}

.ohhh-calendar-game-status--sum .sum-match {
  color: #4ade80;
  animation: pulse 0.5s ease-in-out infinite;
}

.ohhh-calendar-game-status--sum .sum-over {
  color: #f87171;
}

.ohhh-calendar-game-status--success {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.ohhh-calendar-game-status--success .success-text {
  font-size: 24px;
  font-weight: bold;
  color: #ffd700;
  text-shadow: 0 0 20px rgba(255, 215, 0, 0.8);
  animation: bounceIn 0.6s ease-out;
}

.ohhh-calendar-game-status--success .success-time {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
}

/* 游戏按钮 */
.ohhh-calendar-toolbar--game-button {
  padding: 8px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
  user-select: none;
}

.ohhh-calendar-toolbar--game-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.6);
}

.ohhh-calendar-toolbar--game-button:active {
  transform: translateY(0);
}

/* 重新配置主包装层的裁剪逻辑 */
/* 保留横向（左右）裁剪以隔离月份切换，允许纵向（上下）溢出以展示动画和阴影 */
.ohhh-calendar-wrapper {
  overflow: visible !important;
  /* clip-path: inset(top right bottom left) */
  /* 负值表示允许溢出的距离，0 表示裁剪到边界 */
  clip-path: inset(-40px 0 -40px 0);
}

/* 游戏选中效果 */
.ohhh-calendar-day.game-selected .ohhh-calendar-day--inner {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  animation: elasticScale 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  box-shadow: 0 0 20px rgba(102, 126, 234, 0.6), 0 0 40px rgba(102, 126, 234, 0.3);
  position: relative;
  z-index: 10;
}

.ohhh-calendar-day.game-selected .ohhh-calendar-day--inner-value,
.ohhh-calendar-day.game-selected .ohhh-calendar-day--inner-label {
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* 庆祝动画 */
.ohhh-calendar-day.game-celebrating .ohhh-calendar-day--inner {
  animation: celebrate 0.8s ease-in-out infinite;
  background: linear-gradient(135deg, #ffd700 0%, #ff6b6b 50%, #4ecdc4 100%);
  box-shadow: 0 0 30px rgba(255, 215, 0, 0.8), 0 0 60px rgba(255, 107, 107, 0.5);
  position: relative;
  z-index: 20;
}

.ohhh-calendar-day.game-celebrating .ohhh-calendar-day--inner-value {
  animation: colorFlash 0.3s ease-in-out infinite alternate;
}

/* 动画定义 */
@keyframes elasticScale {
  0% {
    transform: scale(1);
  }
  30% {
    transform: scale(1.2);
  }
  60% {
    transform: scale(0.95);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes celebrate {
  0%, 100% {
    transform: scale(1) translateY(0);
  }
  25% {
    transform: scale(1.15) translateY(-8px);
  }
  50% {
    transform: scale(1) translateY(0);
  }
  75% {
    transform: scale(1.1) translateY(-4px);
  }
}

@keyframes colorFlash {
  0% {
    color: #ffffff;
  }
  100% {
    color: #ffd700;
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

@keyframes bounceIn {
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  50% {
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
