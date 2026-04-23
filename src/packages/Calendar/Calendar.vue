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
// 保存进入蒙德里安视图前的视图模式
const savedViewMode = ref(null)

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
  if (!isMondrianView.value) {
    // 进入蒙德里安视图
    savedViewMode.value = viewMode.value
    // 如果当前是周视图，先切换到月视图
    if (viewMode.value === 'week') {
      toggleViewMode()
    }
    isMondrianView.value = true
  } else {
    // 退出蒙德里安视图
    isMondrianView.value = false
    // 恢复之前的视图模式
    if (savedViewMode.value && savedViewMode.value !== viewMode.value) {
      toggleViewMode()
    }
    savedViewMode.value = null
  }
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
  
  // 创建网格
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
  
  // 第一步：生成初始色块布局（不分配颜色）
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
  
  function placeBlockWithoutColor(startRow, startCol, blockRows, blockCols) {
    const blockId = blockIdCounter++
    
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
      color: null,
      colorKey: null,
      cells
    })
  }
  
  // 生成初始色块布局
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
            placeBlockWithoutColor(row, col, size.rows, size.cols)
            placed = true
            break
          }
        }
        
        if (!placed) {
          placeBlockWithoutColor(row, col, 1, 1)
        }
      }
    }
  }
  
  // 第二步：分配颜色
  const colorKeys = Object.keys(MONDRIAN_COLORS)
  blocks.forEach(block => {
    const colorKey = colorKeys[rng.nextInt(0, colorKeys.length - 1)]
    block.colorKey = colorKey
    block.color = MONDRIAN_COLORS[colorKey]
  })
  
  // 第三步：合并相邻的同色色块
  function getAdjacentBlocks(block) {
    const adjacent = []
    
    const blockBottom = block.row + block.rows
    const blockRight = block.col + block.cols
    
    for (const other of blocks) {
      if (other.id === block.id) continue
      if (other.colorKey !== block.colorKey) continue
      
      const otherBottom = other.row + other.rows
      const otherRight = other.col + other.cols
      
      // 检查是否相邻（上下左右）
      const isAbove = otherBottom === block.row && 
                      !(otherRight <= block.col || other.col >= blockRight)
      const isBelow = other.row === blockBottom &&
                      !(otherRight <= block.col || other.col >= blockRight)
      const isLeft = otherRight === block.col &&
                     !(otherBottom <= block.row || other.row >= blockBottom)
      const isRight = other.col === blockRight &&
                      !(otherBottom <= block.row || other.row >= blockBottom)
      
      if (isAbove || isBelow || isLeft || isRight) {
        adjacent.push(other)
      }
    }
    
    return adjacent
  }
  
  function mergeBlocks(blockA, blockB) {
    const minRow = Math.min(blockA.row, blockB.row)
    const maxRow = Math.max(blockA.row + blockA.rows, blockB.row + blockB.rows)
    const minCol = Math.min(blockA.col, blockB.col)
    const maxCol = Math.max(blockA.col + blockA.cols, blockB.col + blockB.cols)
    
    const mergedRows = maxRow - minRow
    const mergedCols = maxCol - minCol
    
    const mergedCells = [...blockA.cells, ...blockB.cells]
    
    // 更新合并后的色块
    blockA.row = minRow
    blockA.col = minCol
    blockA.rows = mergedRows
    blockA.cols = mergedCols
    blockA.cells = mergedCells
    
    // 更新 cells 中的 blockId
    mergedCells.forEach(cell => {
      cell.blockId = blockA.id
    })
    
    // 移除被合并的色块
    const index = blocks.indexOf(blockB)
    if (index > -1) {
      blocks.splice(index, 1)
    }
  }
  
  // 多次迭代合并相邻同色色块
  let merged = true
  let iterations = 0
  const maxIterations = 10
  
  while (merged && iterations < maxIterations) {
    merged = false
    iterations++
    
    // 检查每个色块是否有相邻的同色色块
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i]
      const adjacent = getAdjacentBlocks(block)
      
      if (adjacent.length > 0) {
        // 随机选择一个相邻色块合并
        const toMerge = adjacent[rng.nextInt(0, adjacent.length - 1)]
        mergeBlocks(block, toMerge)
        merged = true
        break
      }
    }
  }
  
  // 第四步：计算每个色块的边界线条位置
  // 检查每个色块的四条边是否需要显示线条
  blocks.forEach(block => {
    const blockBottom = block.row + block.rows
    const blockRight = block.col + block.cols
    
    // 检查四条边
    let showTop = block.row === 0
    let showBottom = blockBottom === ROWS
    let showLeft = block.col === 0
    let showRight = blockRight === COLS
    
    // 检查相邻色块是否颜色不同
    for (const other of blocks) {
      if (other.id === block.id) continue
      
      const otherBottom = other.row + other.rows
      const otherRight = other.col + other.cols
      
      // 上方相邻
      if (otherBottom === block.row && 
          !(otherRight <= block.col || other.col >= blockRight)) {
        if (other.colorKey !== block.colorKey) {
          showTop = true
        }
      }
      
      // 下方相邻
      if (other.row === blockBottom &&
          !(otherRight <= block.col || other.col >= blockRight)) {
        if (other.colorKey !== block.colorKey) {
          showBottom = true
        }
      }
      
      // 左侧相邻
      if (otherRight === block.col &&
          !(otherBottom <= block.row || other.row >= blockBottom)) {
        if (other.colorKey !== block.colorKey) {
          showLeft = true
        }
      }
      
      // 右侧相邻
      if (other.col === blockRight &&
          !(otherBottom <= block.row || other.row >= blockBottom)) {
        if (other.colorKey !== block.colorKey) {
          showRight = true
        }
      }
    }
    
    block.showTop = showTop
    block.showBottom = showBottom
    block.showLeft = showLeft
    block.showRight = showRight
  })
  
  return blocks
}

// 蒙德里安色块数据
const mondrianBlocks = computed(() => {
  return _generateMondrianBlocks(currentYear.value, currentMonth.value, currentRenderDates.value)
})

// 获取色块样式
function getBlockStyle(block) {
  const borderWidth = '4px'
  const borderStyle = 'solid'
  const borderColor = '#000000'
  
  return {
    gridRow: `${block.row + 1} / span ${block.rows}`,
    gridColumn: `${block.col + 1} / span ${block.cols}`,
    backgroundColor: block.color,
    borderTop: block.showTop ? `${borderWidth} ${borderStyle} ${borderColor}` : 'none',
    borderBottom: block.showBottom ? `${borderWidth} ${borderStyle} ${borderColor}` : 'none',
    borderLeft: block.showLeft ? `${borderWidth} ${borderStyle} ${borderColor}` : 'none',
    borderRight: block.showRight ? `${borderWidth} ${borderStyle} ${borderColor}` : 'none'
  }
}

// 获取单元格样式（移除内部线条，只保留色块边界的线条）
function getCellStyle(block, cell) {
  // 不再在单元格内部绘制线条，线条只绘制在色块边界
  return {}
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
    
    // 先填充所有色块
    mondrianBlocks.value.forEach(block => {
      const x = block.col * cellWidth
      const y = gridY + block.row * cellHeight
      const width = block.cols * cellWidth
      const height = block.rows * cellHeight
      
      ctx.fillStyle = block.color
      ctx.fillRect(x, y, width, height)
    })
    
    // 然后只在色块边界绘制线条
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 4
    
    mondrianBlocks.value.forEach(block => {
      const x = block.col * cellWidth
      const y = gridY + block.row * cellHeight
      const width = block.cols * cellWidth
      const height = block.rows * cellHeight
      
      ctx.beginPath()
      
      // 只绘制需要显示的边
      if (block.showTop) {
        ctx.moveTo(x, y)
        ctx.lineTo(x + width, y)
      }
      if (block.showBottom) {
        ctx.moveTo(x, y + height)
        ctx.lineTo(x + width, y + height)
      }
      if (block.showLeft) {
        ctx.moveTo(x, y)
        ctx.lineTo(x, y + height)
      }
      if (block.showRight) {
        ctx.moveTo(x + width, y)
        ctx.lineTo(x + width, y + height)
      }
      
      ctx.stroke()
      
      // 绘制日期数字
      const isLargeBlock = block.rows > 1 || block.cols > 1
      ctx.font = isLargeBlock ? '14px Arial, Helvetica, sans-serif' : '16px Arial, Helvetica, sans-serif'
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
