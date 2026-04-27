<template>
  <div
    class="task-bar"
    :class="{
      'is-active': task.isActive,
      'is-weekend': isWeekend(currentDate),
      'starts-today': isStartDate,
      'ends-today': isEndDate,
      'is-dragging': isDragging && draggingTaskId === task.id,
      'is-resizing-start': isResizingStart && resizingStartTaskId === task.id,
      'is-resizing-end': isResizingEnd && resizingEndTaskId === task.id
    }"
    :style="taskBarStyle"
    @mousedown="handleMouseDown"
    @touchstart="handleTouchStart"
    @click="handleClick"
  >
    <!-- 左侧调整大小的手柄（开始日期） -->
    <div 
      class="task-bar--resize-handle task-bar--resize-handle-left" 
      v-if="isStartDate"
      @mousedown.stop="handleResizeStartLeft"
      @touchstart.stop="handleResizeStartLeft"
    />
    
    <!-- 左侧图标 -->
    <div class="task-bar--icon" v-if="isStartDate">
      <svg v-if="!isWeekend(currentDate)" viewBox="0 0 24 24" width="16" height="16">
        <path
          d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"
          fill="currentColor"
        />
      </svg>
      <svg v-else viewBox="0 0 24 24" width="16" height="16">
        <path
          d="M18 15.5c0 1.38-1.12 2.5-2.5 2.5h-11c-1.38 0-2.5-1.12-2.5-2.5v-11c0-1.38 1.12-2.5 2.5-2.5h11c1.38 0 2.5 1.12 2.5 2.5v11zm-11.5-9.5c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm7.5 8c0 1.1-.9 2-2 2h-7c-1.1 0-2-.9-2-2v-.5c0-1.38 1.12-2.5 2.5-2.5h4c1.38 0 2.5 1.12 2.5 2.5v.5zm2.5-7c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm1.5 9.5c0 1.38-1.12 2.5-2.5 2.5h-1c0 1.66-1.34 3-3 3h-11c-1.66 0-3-1.34-3-3v-1h19v1z"
          fill="currentColor"
        />
      </svg>
    </div>
    
    <!-- 任务标题 -->
    <div class="task-bar--title" v-if="isStartDate || !isEndDate">
      {{ task.title }}
    </div>
    
    <!-- 右侧调整大小的手柄（结束日期） -->
    <div 
      class="task-bar--resize-handle task-bar--resize-handle-right" 
      v-if="isEndDate"
      @mousedown.stop="handleResizeStartRight"
      @touchstart.stop="handleResizeStartRight"
    />
  </div>
</template>

<script setup>
import { computed, inject } from 'vue'
import { isSameDay, isWeekend } from '../utils/index.js'
import { useTaskStore } from '../hooks/useTaskStore.js'

const props = defineProps({
  task: {
    type: Object,
    required: true
  },
  currentDate: {
    type: Date,
    required: true
  },
  weekStart: {
    type: Number,
    default: 0
  }
})

const {
  TASK_COLORS,
  activateTask,
  isDragging,
  draggingTaskId,
  startDrag,
  updateDrag,
  endDrag,
  isResizingEnd,
  resizingEndTaskId,
  startResizeEnd,
  updateResizeEnd,
  endResizeEnd,
  isResizingStart,
  resizingStartTaskId,
  startResizeStart,
  updateResizeStart,
  endResizeStart
} = useTaskStore()

// 注入日历容器的引用，用于计算拖拽位置
const calendarContainer = inject('calendarContainer', null)

// 计算任务条的颜色配置
const colorConfig = computed(() => {
  return TASK_COLORS[props.task.color] || TASK_COLORS.kleinianBlue
})

// 检查当前日期是否是任务的开始日期
const isStartDate = computed(() => {
  return isSameDay(props.task.startDate, props.currentDate)
})

// 检查当前日期是否是任务的结束日期
const isEndDate = computed(() => {
  return isSameDay(props.task.endDate, props.currentDate)
})

// 检查当前日期是否是周末
const isWeekendComputed = computed(() => {
  return isWeekend(props.currentDate)
})

// 计算任务条的样式
const taskBarStyle = computed(() => {
  const color = colorConfig.value
  
  // 基础样式
  const style = {
    '--task-primary-color': color.primary,
    '--task-semi-transparent': color.semiTransparent,
    '--task-shadow': color.shadow,
    '--task-accent': color.accent,
    top: `${props.task.rowIndex * 28 + 4}px`
  }
  
  return style
})

// 处理鼠标按下（开始拖拽）
function handleMouseDown(event) {
  // 如果不是左键点击，或者正在调整大小，则不处理
  if (event.button !== 0 || isResizingEnd.value || isResizingStart.value) return
  
  event.preventDefault()
  startDrag(props.task.id, props.currentDate)
  
  // 绑定鼠标移动和鼠标抬起事件
  const handleMouseMove = (e) => {
    const date = getDateFromEvent(e)
    if (date) {
      updateDrag(date)
    }
  }
  
  const handleMouseUp = () => {
    endDrag()
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }
  
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

// 处理触摸开始（开始拖拽）
function handleTouchStart(event) {
  if (isResizingEnd.value || isResizingStart.value) return
  
  event.preventDefault()
  startDrag(props.task.id, props.currentDate)
  
  const touch = event.touches[0]
  
  const handleTouchMove = (e) => {
    const touch = e.touches[0]
    const date = getDateFromEvent(touch)
    if (date) {
      updateDrag(date)
    }
  }
  
  const handleTouchEnd = () => {
    endDrag()
    document.removeEventListener('touchmove', handleTouchMove)
    document.removeEventListener('touchend', handleTouchEnd)
  }
  
  document.addEventListener('touchmove', handleTouchMove)
  document.addEventListener('touchend', handleTouchEnd)
}

// 处理左侧调整大小开始（调整开始日期）
function handleResizeStartLeft(event) {
  event.preventDefault()
  event.stopPropagation()
  startResizeStart(props.task.id, props.currentDate)
  
  const handleResizeMove = (e) => {
    const date = getDateFromEvent(e)
    if (date) {
      updateResizeStart(date)
    }
  }
  
  const handleResizeEnd = () => {
    endResizeStart()
    document.removeEventListener('mousemove', handleResizeMove)
    document.removeEventListener('mouseup', handleResizeEnd)
    document.removeEventListener('touchmove', handleResizeMove)
    document.removeEventListener('touchend', handleResizeEnd)
  }
  
  if (event.type === 'mousedown') {
    document.addEventListener('mousemove', handleResizeMove)
    document.addEventListener('mouseup', handleResizeEnd)
  } else {
    document.addEventListener('touchmove', handleResizeMove)
    document.addEventListener('touchend', handleResizeEnd)
  }
}

// 处理右侧调整大小开始（调整结束日期）
function handleResizeStartRight(event) {
  event.preventDefault()
  event.stopPropagation()
  startResizeEnd(props.task.id, props.currentDate)
  
  const handleResizeMove = (e) => {
    const date = getDateFromEvent(e)
    if (date) {
      updateResizeEnd(date)
    }
  }
  
  const handleResizeEnd = () => {
    endResizeEnd()
    document.removeEventListener('mousemove', handleResizeMove)
    document.removeEventListener('mouseup', handleResizeEnd)
    document.removeEventListener('touchmove', handleResizeMove)
    document.removeEventListener('touchend', handleResizeEnd)
  }
  
  if (event.type === 'mousedown') {
    document.addEventListener('mousemove', handleResizeMove)
    document.addEventListener('mouseup', handleResizeEnd)
  } else {
    document.addEventListener('touchmove', handleResizeMove)
    document.addEventListener('touchend', handleResizeEnd)
  }
}

// 从事件中获取日期
function getDateFromEvent(event) {
  if (!calendarContainer || !calendarContainer.value) return null
  
  const rect = calendarContainer.value.getBoundingClientRect()
  const clientX = event.clientX || event.touches?.[0]?.clientX
  const clientY = event.clientY || event.touches?.[0]?.clientY
  
  if (clientX === undefined || clientY === undefined) return null
  
  // 这里需要根据日历的布局来计算对应的日期
  // 简化版本：我们需要知道每个日期格子的位置
  // 实际实现中，可能需要更复杂的逻辑
  
  return props.currentDate
}

// 点击任务条时激活任务（显示呼吸闪烁效果）
function handleClick() {
  activateTask(props.task.id)
}
</script>

<style scoped lang="scss">
.task-bar {
  position: absolute;
  left: 4px;
  right: 4px;
  height: 24px;
  background: var(--task-semi-transparent);
  border-left: 4px solid var(--task-accent);
  border-radius: 2px;
  box-shadow: 
    inset 0 1px 2px var(--task-shadow),
    0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  padding: 0 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  overflow: hidden;
  user-select: none;
  
  &:hover {
    background: var(--task-primary-color);
    opacity: 0.9;
  }
  
  // 开始日期的样式
  &.starts-today {
    border-top-left-radius: 4px;
    border-bottom-left-radius: 4px;
  }
  
  // 结束日期的样式
  &.ends-today {
    border-top-right-radius: 4px;
    border-bottom-right-radius: 4px;
    margin-right: 4px;
  }
  
  // 周末的样式
  &.is-weekend {
    opacity: 0.8;
  }
  
  // 激活状态（呼吸闪烁）
  &.is-active {
    animation: breathe 1s ease-in-out infinite;
  }
  
  // 拖拽状态
  &.is-dragging {
    opacity: 0.7;
    cursor: grabbing;
  }
  
  // 调整开始日期状态
  &.is-resizing-start {
    opacity: 0.7;
  }
  
  // 调整结束日期状态
  &.is-resizing-end {
    opacity: 0.7;
  }
}

.task-bar--icon {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 6px;
  color: rgba(255, 255, 255, 0.9);
  flex-shrink: 0;
}

.task-bar--title {
  flex: 1;
  font-size: 12px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.95);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.task-bar--resize-handle {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 8px;
  cursor: ew-resize;
  background: transparent;
  z-index: 10;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
}

.task-bar--resize-handle-left {
  left: 0;
  border-top-left-radius: 4px;
  border-bottom-left-radius: 4px;
}

.task-bar--resize-handle-right {
  right: 0;
  border-top-right-radius: 4px;
  border-bottom-right-radius: 4px;
}

// 呼吸闪烁动画
@keyframes breathe {
  0%, 100% {
    opacity: 0.8;
    transform: scale(1);
    box-shadow: 
      inset 0 1px 2px var(--task-shadow),
      0 2px 4px rgba(0, 0, 0, 0.1),
      0 0 0 0 var(--task-shadow);
  }
  50% {
    opacity: 1;
    transform: scale(1.02);
    box-shadow: 
      inset 0 1px 2px var(--task-shadow),
      0 2px 4px rgba(0, 0, 0, 0.1),
      0 0 10px 2px var(--task-shadow);
  }
}
</style>
