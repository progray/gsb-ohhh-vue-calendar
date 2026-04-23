<template>
  <div
    class="ohhh-calendar-container"
    :class="{ 'is-mondrian': isMondrianView }"
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
        <template v-if="!isMondrianView">
          <div v-html="icons.arrowDoubleLeft" class="ohhh-calendar-toolbar--icon" @click="changePageTo('prev-year')" />
          <div v-html="icons.arrowLeft" class="ohhh-calendar-toolbar--icon" @click="changePageTo('prev-page')" />
          <div class="ohhh-calendar-toolbar--text">{{ headerLabel }}</div>
          <div v-html="icons.arrowRight" class="ohhh-calendar-toolbar--icon" @click="changePageTo('next-page')" />
          <div v-html="icons.arrowDoubleRight" class="ohhh-calendar-toolbar--icon" @click="changePageTo('next-year')" />
        </template>
        <template v-else>
          <div class="ohhh-calendar-toolbar--text mondrian-title">{{ mondrianHeaderLabel }}</div>
        </template>
      </slot>
      <div class="ohhh-calendar-toolbar--mondrian-btn" @click="toggleMondrianView">
        {{ isMondrianView ? '返回日历' : '蒙德里安月历' }}
      </div>
    </div>

    <!-- 蒙德里安视图 -->
    <div v-if="isMondrianView" ref="mondrianRef" class="ohhh-calendar-mondrian">
      <!-- 星期栏 -->
      <div v-if="showWeekdays" class="ohhh-calendar-mondrian-weekdays">
        <div v-for="(day, index) in mondrianWeekdays" :key="day" class="ohhh-calendar-mondrian-weekdays--weekday">
          {{ day }}
        </div>
      </div>

      <!-- 蒙德里安色块网格 -->
      <div class="ohhh-calendar-mondrian-grid">
        <div
          v-for="(block, blockIndex) in mondrianBlocks"
          :key="blockIndex"
          class="ohhh-calendar-mondrian-block"
          :style="getBlockStyle(block)"
        >
          <div
            v-for="cell in block.cells"
            :key="cell.index"
            class="ohhh-calendar-mondrian-cell"
            :style="getCellStyle(block, cell)"
          >
            <span
              class="ohhh-calendar-mondrian-cell--value"
              :style="getCellValueStyle(block, cell)"
            >
              {{ cell.value }}
            </span>
          </div>
        </div>
      </div>

      <!-- 截图按钮 -->
      <div class="ohhh-calendar-mondrian-actions">
        <div class="ohhh-calendar-mondrian-actions--btn" @click="captureMondrianImage">
          获取蒙德里安月历图
        </div>
      </div>
    </div>

    <!-- 普通日历视图 -->
    <template v-else>
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
              'other-month': !dateObj.current
            }"
            @click="changeSelectedDate(dateObj.date)"
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
    </template>

    <!-- 底部工具栏 -->
    <div v-if="showFooter && !isMondrianView" class="ohhh-calendar-footer">
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
import { ref, computed, useTemplateRef, toRefs } from 'vue'
import { useSwipe } from '@vueuse/core'
import { useCalendar } from './hooks/useCalendar.js'
import { isSameDay, createWeekdays } from './utils'
import { icons } from './utils/icons.js'

const swipeRef = useTemplateRef('swp')
const mondrianRef = useTemplateRef('mondrianRef')

const emit = defineEmits(['select-change', 'view-change'])

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

// ==================== 蒙德里安月历逻辑 ====================

// 蒙德里安视图状态
const isMondrianView = ref(false)

// 蒙德里安颜色配置
const MONDRIAN_COLORS = {
  RED: '#DE3831',
  BLUE: '#2B4FA2',
  YELLOW: '#FFD700',
  WHITE: '#FFFFFF',
  GRAY: '#E8E8E8'
}

// 英文月份名称
const ENGLISH_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

// 英文星期名称
const ENGLISH_WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// 切换蒙德里安视图
function toggleMondrianView() {
  isMondrianView.value = !isMondrianView.value
}

// 蒙德里安标题（英文月份）
const mondrianHeaderLabel = computed(() => {
  return `${ENGLISH_MONTHS[currentMonth.value]} ${currentYear.value}`
})

// 蒙德里安星期栏（英文）
const mondrianWeekdays = computed(() => {
  return ENGLISH_WEEKDAYS.slice(weekStart.value).concat(ENGLISH_WEEKDAYS.slice(0, weekStart.value))
})

// 基于年月生成伪随机数种子
function _generateHash(year, month) {
  const str = `${year}-${month}`
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

// 伪随机数生成器（基于种子）
class SeededRandom {
  constructor(seed) {
    this.seed = seed
  }
  next() {
    this.seed = (this.seed * 9301 + 49297) % 233280
    return this.seed / 233280
  }
  nextInt(min, max) {
    return Math.floor(this.next() * (max - min + 1)) + min
  }
}

// 生成蒙德里安色块布局
function _generateMondrianBlocks(year, month, dates) {
  const hash = _generateHash(year, month)
  const rng = new SeededRandom(hash)
  
  const ROWS = 6
  const COLS = 7
  
  const grid = []
  for (let row = 0; row < ROWS; row++) {
    grid[row] = []
    for (let col = 0; col < COLS; col++) {
      const index = row * COLS + col
      const dateObj = dates[index]
      grid[row][col] = {
        row,
        col,
        index,
        value: dateObj ? dateObj.fullDate.date : '',
        current: dateObj ? dateObj.current : false,
        blockId: null,
        visited: false
      }
    }
  }
  
  const blocks = []
  let blockIdCounter = 0
  
  const blockSizes = [
    { rows: 1, cols: 1, weight: 35 },
    { rows: 1, cols: 2, weight: 20 },
    { rows: 2, cols: 1, weight: 15 },
    { rows: 2, cols: 2, weight: 10 },
    { rows: 1, cols: 3, weight: 8 },
    { rows: 3, cols: 1, weight: 5 },
    { rows: 2, cols: 3, weight: 4 },
    { rows: 3, cols: 2, weight: 3 }
  ]
  
  const totalWeight = blockSizes.reduce((sum, b) => sum + b.weight, 0)
  
  function getRandomBlockSize() {
    let rand = rng.next() * totalWeight
    for (const size of blockSizes) {
      if (rand < size.weight) {
        return size
      }
      rand -= size.weight
    }
    return blockSizes[0]
  }
  
  function canPlaceBlock(startRow, startCol, blockRows, blockCols) {
    if (startRow + blockRows > ROWS || startCol + blockCols > COLS) {
      return false
    }
    for (let r = startRow; r < startRow + blockRows; r++) {
      for (let c = startCol; c < startCol + blockCols; c++) {
        if (grid[r][c].visited) {
          return false
        }
      }
    }
    return true
  }
  
  function placeBlock(startRow, startCol, blockRows, blockCols) {
    const blockId = blockIdCounter++
    const colorKeys = Object.keys(MONDRIAN_COLORS)
    const colorKey = colorKeys[rng.nextInt(0, colorKeys.length - 1)]
    const color = MONDRIAN_COLORS[colorKey]
    
    const cells = []
    for (let r = startRow; r < startRow + blockRows; r++) {
      for (let c = startCol; c < startCol + blockCols; c++) {
        grid[r][c].visited = true
        grid[r][c].blockId = blockId
        cells.push(grid[r][c])
      }
    }
    
    blocks.push({
      id: blockId,
      row: startRow,
      col: startCol,
      rows: blockRows,
      cols: blockCols,
      color,
      colorKey,
      cells
    })
  }
  
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (!grid[row][col].visited) {
        const blockSize = getRandomBlockSize()
        let placed = false
        
        const sizesToTry = [blockSize]
        for (const size of blockSizes) {
          if (size.rows !== blockSize.rows || size.cols !== blockSize.cols) {
            sizesToTry.push(size)
          }
        }
        
        for (const size of sizesToTry) {
          if (canPlaceBlock(row, col, size.rows, size.cols)) {
            placeBlock(row, col, size.rows, size.cols)
            placed = true
            break
          }
        }
        
        if (!placed) {
          placeBlock(row, col, 1, 1)
        }
      }
    }
  }
  
  return blocks
}

// 蒙德里安色块数据
const mondrianBlocks = computed(() => {
  return _generateMondrianBlocks(currentYear.value, currentMonth.value, currentRenderDates.value)
})

// 获取色块样式
function getBlockStyle(block) {
  return {
    gridRow: `${block.row + 1} / span ${block.rows}`,
    gridColumn: `${block.col + 1} / span ${block.cols}`,
    backgroundColor: block.color
  }
}

// 获取单元格样式
function getCellStyle(block, cell) {
  const cellRow = cell.row - block.row
  const cellCol = cell.col - block.col
  
  const borderTop = cellRow === 0 ? 'none' : '4px solid #000000'
  const borderLeft = cellCol === 0 ? 'none' : '4px solid #000000'
  
  return {
    borderTop,
    borderLeft
  }
}

// 获取数字颜色（根据背景色自适应）
function getCellValueStyle(block, cell) {
  const isLargeBlock = block.rows > 1 || block.cols > 1
  
  let color = '#000000'
  if (block.colorKey === 'RED' || block.colorKey === 'BLUE') {
    color = '#FFFFFF'
  }
  
  const fontSize = isLargeBlock ? '0.8em' : '1em'
  const opacity = cell.current ? 1 : 0.4
  
  return {
    color,
    fontSize,
    opacity
  }
}

// 截取蒙德里安月历图
async function captureMondrianImage() {
  if (!mondrianRef.value) return
  
  try {
    const canvas = document.createElement('canvas')
    const element = mondrianRef.value
    const rect = element.getBoundingClientRect()
    
    const scale = 2
    canvas.width = rect.width * scale
    canvas.height = rect.height * scale
    
    const ctx = canvas.getContext('2d')
    ctx.scale(scale, scale)
    
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, rect.width, rect.height)
    
    const computedStyle = window.getComputedStyle(element)
    const bgColor = computedStyle.backgroundColor || '#FFFFFF'
    
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, rect.width, rect.height)
    
    ctx.fillStyle = '#000000'
    ctx.font = 'bold 18px Arial, Helvetica, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(mondrianHeaderLabel.value, rect.width / 2, 25)
    
    const weekdaysY = 50
    const weekdayWidth = rect.width / 7
    ctx.font = '12px Arial, Helvetica, sans-serif'
    ctx.textAlign = 'center'
    mondrianWeekdays.value.forEach((day, index) => {
      ctx.fillText(day, weekdayWidth * index + weekdayWidth / 2, weekdaysY)
    })
    
    const gridY = 65
    const cellWidth = rect.width / 7
    const cellHeight = (rect.height - gridY - 50) / 6
    
    mondrianBlocks.value.forEach(block => {
      const x = block.col * cellWidth
      const y = gridY + block.row * cellHeight
      const width = block.cols * cellWidth
      const height = block.rows * cellHeight
      
      ctx.fillStyle = block.color
      ctx.fillRect(x, y, width, height)
      
      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 3
      ctx.strokeRect(x, y, width, height)
      
      ctx.font = block.rows > 1 || block.cols > 1 ? '14px Arial, Helvetica, sans-serif' : '16px Arial, Helvetica, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      
      const textColor = (block.colorKey === 'RED' || block.colorKey === 'BLUE') ? '#FFFFFF' : '#000000'
      ctx.fillStyle = textColor
      
      block.cells.forEach(cell => {
        if (cell.value) {
          const cx = cell.col * cellWidth + cellWidth / 2
          const cy = gridY + cell.row * cellHeight + cellHeight / 2
          
          ctx.globalAlpha = cell.current ? 1 : 0.4
          ctx.fillText(cell.value, cx, cy)
          ctx.globalAlpha = 1
        }
      })
    })
    
    canvas.toBlob(async (blob) => {
      if (blob) {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ])
          alert('蒙德里安月历图已复制到剪贴板！')
        } catch (err) {
          const link = document.createElement('a')
          link.download = `mondrian-calendar-${currentYear.value}-${currentMonth.value + 1}.png`
          link.href = URL.createObjectURL(blob)
          link.click()
          alert('由于浏览器限制，图片已下载。请手动复制。')
        }
      }
    }, 'image/png')
    
  } catch (error) {
    console.error('截图失败:', error)
    alert('截图失败，请重试。')
  }
}

defineExpose({
  // 切换周/月视图
  toggleViewMode,
  // 切换日历页
  changePageTo,
  // 切换选中日期
  changeSelectedDate,
  // 切换蒙德里安视图
  toggleMondrianView
})
</script>
