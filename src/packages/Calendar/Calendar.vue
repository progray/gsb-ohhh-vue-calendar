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
    <!-- 数字组合游戏区域 -->
    <div v-if="showNumberGame" class="ohhh-calendar-game">
      <div class="ohhh-calendar-game-input-row">
        <input
          v-model="gameTargetInput"
          type="number"
          class="ohhh-calendar-game-input"
          placeholder="输入目标数字..."
          @keydown.enter="triggerGame"
          :disabled="gameIsAnimating"
        />
        <button class="ohhh-calendar-game-btn" @click="triggerGame" :disabled="gameIsAnimating">计算</button>
        <button
          v-if="gameResult !== null"
          class="ohhh-calendar-game-btn ohhh-calendar-game-btn-reset"
          @click="resetGame"
        >重置</button>
      </div>
      
      <!-- 游戏结果显示 -->
      <div
        class="ohhh-calendar-game-result"
        :class="{
          'ohhh-calendar-game-result--visible': gameResult !== null,
          'ohhh-calendar-game-result--fade-out': gameIsFadingOut,
          'ohhh-calendar-game-result--no-solution': gameResult && !gameResult.hasSolution
        }"
      >
        <template v-if="gameResult">
          <template v-if="gameResult.hasSolution">
            <div class="ohhh-calendar-game-result-label">找到算式：</div>
            <div class="ohhh-calendar-game-result-expression" ref="expressionRef">
              <span
                v-for="(char, idx) in gameResult.expressionChars"
                :key="idx"
                class="ohhh-calendar-game-result-char"
                :style="{ animationDelay: idx * 80 + 'ms' }"
              >{{ char }}</span>
            </div>
          </template>
          <template v-else>
            <div class="ohhh-calendar-game-result-no-solution">
              <span class="ohhh-calendar-game-result-emoji">😔</span>
              <span>无解哦，换个数字试试吧~</span>
            </div>
          </template>
        </template>
      </div>
    </div>

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
            'ohhh-calendar-day--game-highlight': _isGameHighlightDate(dateObj),
            'ohhh-calendar-day--game-fade-out': gameIsFadingOut && _isGameHighlightDate(dateObj),
            'ohhh-calendar-day--game-animating': gameIsAnimating && _isGameHighlightDate(dateObj)
          }"
          :style="_getGameHighlightStyle(dateObj)"
          @click="changeSelectedDate(dateObj.date)"
        >
          <div class="ohhh-calendar-day--inner">
            <div class="ohhh-calendar-day--inner-value">{{ dateObj.fullDate.date }}</div>
            <div class="ohhh-calendar-day--inner-label" v-if="$slots['day-label']">
              <slot name="day-label" :date="dateObj.date" />
            </div>
          </div>
          <div class="ohhh-calendar-day--marker" :style="{ background: _getMarkerColor(dateObj.date) }" />
          
          <!-- 游戏高亮发光效果 -->
          <div
            v-if="_isGameHighlightDate(dateObj) && gameIsAnimating"
            class="ohhh-calendar-day--glow"
            :style="_getGameHighlightStyle(dateObj)"
          />
          <!-- 粒子效果 -->
          <div
            v-if="_isGameHighlightDate(dateObj) && gameIsAnimating"
            class="ohhh-calendar-day--particles"
            :style="_getGameHighlightStyle(dateObj)"
          >
            <div v-for="i in 8" :key="i" class="ohhh-calendar-day--particle" :data-index="i" />
          </div>
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
import { computed, useTemplateRef, toRefs, ref, watch, nextTick } from 'vue'
import { useSwipe } from '@vueuse/core'
import { useCalendar } from './hooks/useCalendar.js'
import { isSameDay, createWeekdays } from './utils'
import { icons } from './utils/icons.js'
import { findDateCombination } from './utils/gameSolver.js'

const swipeRef = useTemplateRef('swp')
const expressionRef = useTemplateRef('expressionRef')

const emit = defineEmits(['select-change', 'view-change', 'game-result'])

const props = defineProps({
  // 初始选中的日期
  initialSelectedDate: {
    type: Date,
    default: () => new Date()
  },
  // 初始视图模式
  initialViewMode: {
    type: String,
    default: 'month' // month or week
  },
  // 以周几作为每周的起始
  weekStart: {
    type: Number,
    default: 0 // 0: Sunday, 1: Monday, etc.
  },
  // 标记的日期
  markerDates: {
    type: Array,
    default: () => []
  },
  // 是否显示顶部工具栏
  showToolbar: {
    type: Boolean,
    default: true
  },
  // 是否显示底部工具栏
  showFooter: {
    type: Boolean,
    default: true
  },
  // 是否显示weekdays栏
  showWeekdays: {
    type: Boolean,
    default: true
  },
  // 过渡动画时长
  duration: {
    type: String,
    default: '0.3s'
  },
  // 是否显示数字组合游戏功能
  showNumberGame: {
    type: Boolean,
    default: true
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

// 顶部工具栏标题
const headerLabel = computed(() => `${currentYear.value}年${currentMonth.value + 1}月`)
// 星期栏
const weekdays = createWeekdays(weekStart.value)
// 标记日期
const markerDateList = computed(() =>
  markerDates.value.map(item => ({
    date: new Date(typeof item === 'object' && item.date ? item.date : item),
    color: typeof item === 'object' && item.color ? item.color : 'var(--calendar-theme-color)'
  }))
)

// 监听滑动事件
const { lengthX } = useSwipe(swipeRef, {
  // 滑动阈值
  threshold: 0,
  // 手指滑动过程中
  onSwipe: () => {
    if (isInTransition.value) return
    transformDistance.value = -lengthX.value + 'px'
  },
  // 手指抬起滑动结束，开始滑动动画
  onSwipeEnd: (_, direction) => {
    if (isInTransition.value) return
    if (direction === 'left') {
      changePageTo('next-page')
    } else if (direction === 'right') {
      changePageTo('prev-page')
    } else {
      // 如果方向不是左右，则将页面复位
      startTransitionAnimation(direction)
    }
  }
})

// 归一化参数
// 支持 'prev-page', 'next-page', 'prev-year', 'next-year', 以及合法的日期
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

// 切换日历页面
function changePageTo(param) {
  const targetDate = _normalize(param)
  switchPageToTargetDate(targetDate)
}

// 切换选中的日期
function changeSelectedDate(date) {
  changePageTo(date)
  if (!isSameDay(new Date(date), selected.value)) {
    selected.value = new Date(date)
    emit('select-change', selected.value)
  }
}

// 获取 marker 颜色
function _getMarkerColor(date) {
  return markerDateList.value.find(d => isSameDay(d.date, date))?.color
}

// ==================== 数字组合游戏功能 ====================
const gameTargetInput = ref('')
const gameResult = ref(null)
const gameIsAnimating = ref(false)
const gameIsFadingOut = ref(false)
const gameAnimationTimer = ref(null)
const gameHighlightDates = ref([])
const gameHighlightStyles = ref({})

function triggerGame() {
  const target = parseInt(gameTargetInput.value)
  if (isNaN(target) || target <= 0) {
    return
  }
  
  resetGameInternal()
  
  const solution = findDateCombination(currentRenderDates.value, target)
  
  if (solution) {
    gameResult.value = {
      hasSolution: true,
      expression: solution.expression,
      expressionChars: solution.expression.split(''),
      usedDates: solution.usedDates,
      target: solution.target
    }
    gameHighlightDates.value = solution.usedDates.map(d => d.key)
    
    solution.usedDates.forEach((date, index) => {
      gameHighlightStyles.value[date.key] = {
        '--game-highlight-delay': `${index * 150}ms`,
        '--game-highlight-index': index
      }
    })
    
    startGameAnimation()
  } else {
    gameResult.value = {
      hasSolution: false,
      target
    }
    gameHighlightDates.value = []
  }
  
  emit('game-result', gameResult.value)
}

function startGameAnimation() {
  gameIsAnimating.value = true
  
  if (gameAnimationTimer.value) {
    clearTimeout(gameAnimationTimer.value)
  }
  
  gameAnimationTimer.value = setTimeout(() => {
    gameIsAnimating.value = false
  }, 5000)
}

function resetGameInternal() {
  gameResult.value = null
  gameHighlightDates.value = []
  gameHighlightStyles.value = {}
  gameIsAnimating.value = false
  gameIsFadingOut.value = false
  if (gameAnimationTimer.value) {
    clearTimeout(gameAnimationTimer.value)
    gameAnimationTimer.value = null
  }
}

function resetGame() {
  if (gameResult.value === null) return
  
  gameIsFadingOut.value = true
  
  setTimeout(() => {
    resetGameInternal()
  }, 600)
}

function _isGameHighlightDate(dateObj) {
  return gameHighlightDates.value.includes(dateObj.key)
}

function _getGameHighlightStyle(dateObj) {
  return gameHighlightStyles.value[dateObj.key] || {}
}

watch([currentYear, currentMonth, viewMode], () => {
  resetGame()
})

// ==================== 数字组合游戏功能结束 ====================

defineExpose({
  // 切换周/月视图
  toggleViewMode,
  // 切换日历页
  changePageTo,
  // 切换选中日期
  changeSelectedDate,
  // 重置游戏
  resetGame,
  // 触发游戏
  triggerGame
})
</script>
