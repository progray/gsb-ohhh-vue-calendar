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
    <!-- 顶部工具栏 - 扫雷风格 -->
    <div v-if="showToolbar" class="minesweeper-toolbar">
      <!-- 左侧液晶数字显示：当月天数 -->
      <div class="lcd-display">
        <span class="lcd-digit">{{ formattedDaysInMonth[0] }}</span>
        <span class="lcd-digit">{{ formattedDaysInMonth[1] }}</span>
      </div>

      <!-- 中间笑脸按钮 -->
      <button class="smiley-button" :class="{ 'smiley-pressed': smileyPressed }"
        @mousedown="smileyPressed = true"
        @mouseup="smileyPressed = false; resetToCurrentMonth()"
        @mouseleave="smileyPressed = false"
      >
        {{ currentSmiley }}
      </button>

      <!-- 右侧液晶数字显示：年份 -->
      <div class="lcd-display">
        <span class="lcd-digit">{{ formattedYear[0] }}</span>
        <span class="lcd-digit">{{ formattedYear[1] }}</span>
        <span class="lcd-digit">{{ formattedYear[2] }}</span>
        <span class="lcd-digit">{{ formattedYear[3] }}</span>
      </div>
    </div>

    <!-- 月份导航栏 - 扫雷3D按钮风格 -->
    <div class="minesweeper-nav">
      <button class="nav-button" @click="changePageTo('prev-year')"
        @mousedown="setButtonPressed('prevYear', true)"
        @mouseup="setButtonPressed('prevYear', false)"
        @mouseleave="setButtonPressed('prevYear', false)"
        :class="{ 'button-pressed': buttonPressed.prevYear }"
      >◀◀</button>
      <button class="nav-button" @click="changePageTo('prev-page')"
        @mousedown="setButtonPressed('prevMonth', true)"
        @mouseup="setButtonPressed('prevMonth', false)"
        @mouseleave="setButtonPressed('prevMonth', false)"
        :class="{ 'button-pressed': buttonPressed.prevMonth }"
      >◀</button>
      <span class="month-label">{{ monthName }}</span>
      <button class="nav-button" @click="changePageTo('next-page')"
        @mousedown="setButtonPressed('nextMonth', true)"
        @mouseup="setButtonPressed('nextMonth', false)"
        @mouseleave="setButtonPressed('nextMonth', false)"
        :class="{ 'button-pressed': buttonPressed.nextMonth }"
      >▶</button>
      <button class="nav-button" @click="changePageTo('next-year')"
        @mousedown="setButtonPressed('nextYear', true)"
        @mouseup="setButtonPressed('nextYear', false)"
        @mouseleave="setButtonPressed('nextYear', false)"
        :class="{ 'button-pressed': buttonPressed.nextYear }"
      >▶▶</button>
    </div>

    <!-- 星期栏 -->
    <div v-if="showWeekdays" class="ohhh-calendar-weekdays">
      <div v-for="(day, index) in weekdays" :key="day" class="ohhh-calendar-weekdays--weekday">
        <slot name="weekday" :weekday="day" :index="(index + weekStart) % 7">{{ day }}</slot>
      </div>
    </div>

    <!-- 日历主体 - 扫雷格子风格 -->
    <div ref="swp" class="ohhh-calendar-wrapper minesweeper-grid">
      <div
        v-for="(item, index) in allRenderDates"
        :key="index"
        :style="{ left: 100 * (index - 1) + '%' }"
        class="ohhh-calendar-days"
        @transitionend="onTransitionEnd"
      >
        <div
          v-for="(dateObj, cellIndex) in item"
          :key="dateObj.key"
          class="minesweeper-cell"
          :class="{
            'is-revealed': isRevealed(dateObj.key),
            'is-weekend': isWeekend(dateObj.date),
            'is-today': isSameDay(dateObj.date, new Date()),
            'other-month': !dateObj.current,
            'cell-pressed': cellPressed === dateObj.key
          }"
          @mousedown="onCellMouseDown(dateObj)"
          @mouseup="onCellMouseUp(dateObj, cellIndex, item)"
          @mouseleave="onCellMouseLeave(dateObj)"
        >
          <!-- 未翻开状态 -->
          <div v-if="!isRevealed(dateObj.key)" class="cell-unrevealed">
            <!-- 周末显示小红旗 -->
            <span v-if="isWeekend(dateObj.date) && dateObj.current" class="flag-icon">🚩</span>
          </div>
          <!-- 已翻开状态 -->
          <div v-else class="cell-revealed">
            <span class="cell-number" :class="`number-${dateObj.fullDate.date}`">
              {{ dateObj.fullDate.date }}
            </span>
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
import { computed, useTemplateRef, toRefs, ref, watch } from 'vue'
import { useSwipe } from '@vueuse/core'
import { useCalendar } from './hooks/useCalendar.js'
import { isSameDay, createWeekdays, getDaysInMonth } from './utils'
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
  toggleViewMode
} = useCalendar({ initialSelectedDate, initialViewMode, weekStart, duration }, emit)

// 扫雷状态
const revealedCells = ref(new Set())
const cellPressed = ref(null)
const smileyPressed = ref(false)
const buttonPressed = ref({
  prevYear: false,
  prevMonth: false,
  nextMonth: false,
  nextYear: false
})

// 笑脸表情
const currentSmiley = computed(() => {
  return '🙂'
})

// 月份名称
const monthName = computed(() => {
  const months = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
  return months[currentMonth.value]
})

// 格式化年份为4位数字符串
const formattedYear = computed(() => {
  return String(currentYear.value).padStart(4, '0').split('')
})

// 格式化当月天数为2位数字符串
const formattedDaysInMonth = computed(() => {
  const days = getDaysInMonth(new Date(currentYear.value, currentMonth.value))
  return String(days).padStart(2, '0').split('')
})

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

// 月份/年份切换时重置翻开状态
watch([currentYear, currentMonth], () => {
  revealedCells.value = new Set()
})

// 归一化参数
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

// 检查是否是周末 (周六日)
function isWeekend(date) {
  const day = date.getDay()
  return day === 0 || day === 6
}

// 检查格子是否已翻开
function isRevealed(cellKey) {
  return revealedCells.value.has(cellKey)
}

// 格子按下
function onCellMouseDown(dateObj) {
  if (isRevealed(dateObj.key)) return
  cellPressed.value = dateObj.key
}

// 格子离开
function onCellMouseLeave(dateObj) {
  if (cellPressed.value === dateObj.key) {
    cellPressed.value = null
  }
}

// 格子松开 - 触发翻开
function onCellMouseUp(dateObj, cellIndex, datesArray) {
  if (cellPressed.value !== dateObj.key) return
  cellPressed.value = null
  
  if (isRevealed(dateObj.key)) return
  
  // 如果是其他月份的日期，直接翻开不连锁
  if (!dateObj.current) {
    revealedCells.value.add(dateObj.key)
    changeSelectedDate(dateObj.date)
    return
  }
  
  // 周末格子：连锁展开
  if (isWeekend(dateObj.date)) {
    revealChain(dateObj, cellIndex, datesArray)
  } else {
    // 工作日：只翻开自己
    revealedCells.value.add(dateObj.key)
  }
  
  changeSelectedDate(dateObj.date)
}

// 连锁展开（BFS算法）
function revealChain(startDateObj, startIndex, datesArray) {
  const queue = [{ dateObj: startDateObj, index: startIndex }]
  const visited = new Set([startDateObj.key])
  
  while (queue.length > 0) {
    const { dateObj, index } = queue.shift()
    
    if (revealedCells.value.has(dateObj.key)) continue
    if (!dateObj.current) continue
    
    revealedCells.value.add(dateObj.key)
    
    // 如果是工作日，停止连锁
    if (!isWeekend(dateObj.date)) continue
    
    // 获取相邻的8个格子
    const neighbors = getNeighborIndices(index, datesArray.length)
    
    for (const neighborIdx of neighbors) {
      const neighborObj = datesArray[neighborIdx]
      if (neighborObj && !visited.has(neighborObj.key) && neighborObj.current) {
        visited.add(neighborObj.key)
        queue.push({ dateObj: neighborObj, index: neighborIdx })
      }
    }
  }
}

// 获取相邻格子索引（8个方向）
function getNeighborIndices(index, totalCount) {
  const cols = 7
  const row = Math.floor(index / cols)
  const col = index % cols
  
  const neighbors = []
  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1]
  ]
  
  for (const [dr, dc] of directions) {
    const newRow = row + dr
    const newCol = col + dc
    
    if (newRow >= 0 && newCol >= 0 && newCol < cols) {
      const newIndex = newRow * cols + newCol
      if (newIndex < totalCount) {
        neighbors.push(newIndex)
      }
    }
  }
  
  return neighbors
}

// 设置导航按钮按下状态
function setButtonPressed(button, pressed) {
  buttonPressed.value[button] = pressed
}

// 重置到当月
function resetToCurrentMonth() {
  const today = new Date()
  currentYear.value = today.getFullYear()
  currentMonth.value = today.getMonth()
  revealedCells.value = new Set()
  selected.value = today
  emit('select-change', selected.value)
}

defineExpose({
  toggleViewMode,
  changePageTo,
  changeSelectedDate
})
</script>
