import { ref, computed, watch } from 'vue'
import { isSameDay, formatDate, getDayOfWeek } from '../utils/index.js'

// 任务颜色配置 - 高饱和度半透明色块
const TASK_COLORS = {
  kleinianBlue: {
    primary: '#002FA7',
    semiTransparent: 'rgba(0, 47, 167, 0.6)',
    shadow: 'rgba(0, 47, 167, 0.3)',
    accent: '#001F6E'
  },
  emeraldGreen: {
    primary: '#046307',
    semiTransparent: 'rgba(4, 99, 7, 0.6)',
    shadow: 'rgba(4, 99, 7, 0.3)',
    accent: '#023E05'
  },
  sunsetOrange: {
    primary: '#FF4500',
    semiTransparent: 'rgba(255, 69, 0, 0.6)',
    shadow: 'rgba(255, 69, 0, 0.3)',
    accent: '#CC3700'
  },
  royalPurple: {
    primary: '#7851A9',
    semiTransparent: 'rgba(120, 81, 169, 0.6)',
    shadow: 'rgba(120, 81, 169, 0.3)',
    accent: '#5A3D80'
  }
}

// 任务类型
let taskIdCounter = 0

// 全局任务状态
const tasks = ref([])
const activeTaskId = ref(null)
const isDragging = ref(false)
const draggingTaskId = ref(null)
const dragStartDate = ref(null)
const dragCurrentDate = ref(null)

// 结束日期调整状态
const isResizingEnd = ref(false)
const resizingEndTaskId = ref(null)
const resizeEndStartDate = ref(null)
const resizeEndCurrentDate = ref(null)

// 开始日期调整状态
const isResizingStart = ref(false)
const resizingStartTaskId = ref(null)
const resizeStartStartDate = ref(null)
const resizeStartCurrentDate = ref(null)

// 初始化一些示例任务
function initSampleTasks() {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()
  
  // 周一到周五的任务
  const monday = new Date(year, month, today.getDate() - today.getDay() + 1)
  const friday = new Date(year, month, monday.getDate() + 4)
  const nextMonday = new Date(year, month, friday.getDate() + 3)
  const nextWednesday = new Date(year, month, nextMonday.getDate() + 2)
  
  addTask({
    title: '项目开发',
    startDate: monday,
    endDate: friday,
    color: 'kleinianBlue'
  })
  
  addTask({
    title: '周末休息',
    startDate: new Date(year, month, friday.getDate() + 1),
    endDate: new Date(year, month, friday.getDate() + 2),
    color: 'emeraldGreen'
  })
  
  addTask({
    title: '跨周任务',
    startDate: friday,
    endDate: nextWednesday,
    color: 'sunsetOrange'
  })
  
  addTask({
    title: '团队会议',
    startDate: monday,
    endDate: monday,
    color: 'royalPurple'
  })
}

// 添加任务
function addTask(taskData) {
  const newTask = {
    id: `task-${taskIdCounter++}`,
    title: taskData.title || '新任务',
    startDate: new Date(taskData.startDate),
    endDate: new Date(taskData.endDate),
    color: taskData.color || 'kleinianBlue',
    isActive: false,
    rowIndex: 0 // 用于垂直堆叠的行索引
  }
  
  tasks.value.push(newTask)
  return newTask
}

// 删除任务
function removeTask(taskId) {
  const index = tasks.value.findIndex(task => task.id === taskId)
  if (index !== -1) {
    tasks.value.splice(index, 1)
  }
}

// 更新任务
function updateTask(taskId, updates) {
  const task = tasks.value.find(t => t.id === taskId)
  if (task) {
    if (updates.startDate) updates.startDate = new Date(updates.startDate)
    if (updates.endDate) updates.endDate = new Date(updates.endDate)
    Object.assign(task, updates)
  }
}

// 获取指定日期的任务
function getTasksForDate(date) {
  return tasks.value.filter(task => {
    const taskStart = task.startDate
    const taskEnd = task.endDate
    const targetDate = new Date(date)
    
    // 确保时间部分为00:00:00以便比较
    taskStart.setHours(0, 0, 0, 0)
    taskEnd.setHours(0, 0, 0, 0)
    targetDate.setHours(0, 0, 0, 0)
    
    return targetDate >= taskStart && targetDate <= taskEnd
  })
}

// 获取指定日期范围内的任务
function getTasksInRange(startDate, endDate) {
  const start = new Date(startDate)
  const end = new Date(endDate)
  start.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)
  
  return tasks.value.filter(task => {
    const taskStart = new Date(task.startDate)
    const taskEnd = new Date(task.endDate)
    taskStart.setHours(0, 0, 0, 0)
    taskEnd.setHours(0, 0, 0, 0)
    
    // 检查是否有重叠
    return !(taskEnd < start || taskStart > end)
  })
}

// 激活任务（点击时）
function activateTask(taskId) {
  // 先取消所有任务的激活状态
  tasks.value.forEach(task => {
    task.isActive = false
  })
  
  // 激活指定任务
  const task = tasks.value.find(t => t.id === taskId)
  if (task) {
    task.isActive = true
    activeTaskId.value = taskId
    
    // 3秒后自动取消激活状态
    setTimeout(() => {
      task.isActive = false
      if (activeTaskId.value === taskId) {
        activeTaskId.value = null
      }
    }, 1000)
  }
}

// 开始拖拽任务
function startDrag(taskId, startDate) {
  isDragging.value = true
  draggingTaskId.value = taskId
  dragStartDate.value = new Date(startDate)
  dragCurrentDate.value = new Date(startDate)
}

// 更新拖拽位置
function updateDrag(currentDate) {
  if (!isDragging.value) return
  dragCurrentDate.value = new Date(currentDate)
}

// 结束拖拽
function endDrag() {
  if (!isDragging.value || !draggingTaskId.value) return
  
  const task = tasks.value.find(t => t.id === draggingTaskId.value)
  if (task && dragStartDate.value && dragCurrentDate.value) {
    // 计算日期差值
    const diffDays = Math.floor((dragCurrentDate.value - dragStartDate.value) / (1000 * 60 * 60 * 24))
    
    if (diffDays !== 0) {
      // 更新任务的开始和结束日期
      const newStartDate = new Date(task.startDate)
      const newEndDate = new Date(task.endDate)
      newStartDate.setDate(newStartDate.getDate() + diffDays)
      newEndDate.setDate(newEndDate.getDate() + diffDays)
      
      updateTask(draggingTaskId.value, {
        startDate: newStartDate,
        endDate: newEndDate
      })
    }
  }
  
  isDragging.value = false
  draggingTaskId.value = null
  dragStartDate.value = null
  dragCurrentDate.value = null
}

// 开始调整结束日期
function startResizeEnd(taskId, startDate) {
  isResizingEnd.value = true
  resizingEndTaskId.value = taskId
  resizeEndStartDate.value = new Date(startDate)
  resizeEndCurrentDate.value = new Date(startDate)
}

// 更新调整结束日期位置
function updateResizeEnd(currentDate) {
  if (!isResizingEnd.value) return
  resizeEndCurrentDate.value = new Date(currentDate)
}

// 结束调整结束日期
function endResizeEnd() {
  if (!isResizingEnd.value || !resizingEndTaskId.value) return
  
  const task = tasks.value.find(t => t.id === resizingEndTaskId.value)
  if (task && resizeEndStartDate.value && resizeEndCurrentDate.value) {
    // 计算日期差值
    const diffDays = Math.floor((resizeEndCurrentDate.value - resizeEndStartDate.value) / (1000 * 60 * 60 * 24))
    
    if (diffDays !== 0) {
      // 更新任务的结束日期
      const newEndDate = new Date(task.endDate)
      newEndDate.setDate(newEndDate.getDate() + diffDays)
      
      // 确保结束日期不早于开始日期
      if (newEndDate >= task.startDate) {
        updateTask(resizingEndTaskId.value, {
          endDate: newEndDate
        })
      }
    }
  }
  
  isResizingEnd.value = false
  resizingEndTaskId.value = null
  resizeEndStartDate.value = null
  resizeEndCurrentDate.value = null
}

// 开始调整开始日期
function startResizeStart(taskId, startDate) {
  isResizingStart.value = true
  resizingStartTaskId.value = taskId
  resizeStartStartDate.value = new Date(startDate)
  resizeStartCurrentDate.value = new Date(startDate)
}

// 更新调整开始日期位置
function updateResizeStart(currentDate) {
  if (!isResizingStart.value) return
  resizeStartCurrentDate.value = new Date(currentDate)
}

// 结束调整开始日期
function endResizeStart() {
  if (!isResizingStart.value || !resizingStartTaskId.value) return
  
  const task = tasks.value.find(t => t.id === resizingStartTaskId.value)
  if (task && resizeStartStartDate.value && resizeStartCurrentDate.value) {
    // 计算日期差值
    const diffDays = Math.floor((resizeStartCurrentDate.value - resizeStartStartDate.value) / (1000 * 60 * 60 * 24))
    
    if (diffDays !== 0) {
      // 更新任务的开始日期
      const newStartDate = new Date(task.startDate)
      newStartDate.setDate(newStartDate.getDate() + diffDays)
      
      // 确保开始日期不晚于结束日期
      if (newStartDate <= task.endDate) {
        updateTask(resizingStartTaskId.value, {
          startDate: newStartDate
        })
      }
    }
  }
  
  isResizingStart.value = false
  resizingStartTaskId.value = null
  resizeStartStartDate.value = null
  resizeStartCurrentDate.value = null
}

// 取消所有操作
function cancelAllOperations() {
  if (isDragging.value) {
    isDragging.value = false
    draggingTaskId.value = null
    dragStartDate.value = null
    dragCurrentDate.value = null
  }
  if (isResizingEnd.value) {
    isResizingEnd.value = false
    resizingEndTaskId.value = null
    resizeEndStartDate.value = null
    resizeEndCurrentDate.value = null
  }
  if (isResizingStart.value) {
    isResizingStart.value = false
    resizingStartTaskId.value = null
    resizeStartStartDate.value = null
    resizeStartCurrentDate.value = null
  }
}

// 计算任务的垂直堆叠行索引
function calculateTaskRowIndices(tasksToCalculate) {
  if (!tasksToCalculate || tasksToCalculate.length === 0) return
  
  // 按开始日期排序
  const sortedTasks = [...tasksToCalculate].sort((a, b) => {
    return a.startDate - b.startDate
  })
  
  // 为每个任务分配行索引
  const rows = []
  
  sortedTasks.forEach(task => {
    // 找到第一个可用的行
    let rowIndex = 0
    let placed = false
    
    while (!placed) {
      if (!rows[rowIndex]) {
        rows[rowIndex] = []
        rows[rowIndex].push(task)
        task.rowIndex = rowIndex
        placed = true
      } else {
        // 检查当前行的任务是否与新任务重叠
        const overlap = rows[rowIndex].some(existingTask => {
          const existingEnd = new Date(existingTask.endDate)
          const newStart = new Date(task.startDate)
          existingEnd.setHours(0, 0, 0, 0)
          newStart.setHours(0, 0, 0, 0)
          
          // 如果新任务的开始日期 <= 现有任务的结束日期 + 1天，则认为是连续的，需要重叠检查
          // 实际上，甘特图中如果任务在同一天开始，需要堆叠
          const existingStart = new Date(existingTask.startDate)
          const newEnd = new Date(task.endDate)
          existingStart.setHours(0, 0, 0, 0)
          newEnd.setHours(0, 0, 0, 0)
          
          return !(newEnd < existingStart || newStart > existingEnd)
        })
        
        if (!overlap) {
          rows[rowIndex].push(task)
          task.rowIndex = rowIndex
          placed = true
        } else {
          rowIndex++
        }
      }
    }
  })
}

// 导出hook
export function useTaskStore() {
  // 初始化示例任务
  if (tasks.value.length === 0) {
    initSampleTasks()
  }
  
  // 监听任务变化，重新计算行索引
  watch(tasks, () => {
    calculateTaskRowIndices(tasks.value)
  }, { deep: true })
  
  // 计算每个日期的最大任务行数
  const maxTasksPerRow = computed(() => {
    const dateMap = new Map()
    
    tasks.value.forEach(task => {
      const start = new Date(task.startDate)
      const end = new Date(task.endDate)
      start.setHours(0, 0, 0, 0)
      end.setHours(0, 0, 0, 0)
      
      // 遍历任务的每一天
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateKey = formatDate(d)
        if (!dateMap.has(dateKey)) {
          dateMap.set(dateKey, 0)
        }
        // 检查当前任务的rowIndex + 1就是需要的行数
        const currentMax = dateMap.get(dateKey)
        if (task.rowIndex + 1 > currentMax) {
          dateMap.set(dateKey, task.rowIndex + 1)
        }
      }
    })
    
    return dateMap
  })
  
  return {
    // 状态
    tasks,
    activeTaskId,
    isDragging,
    draggingTaskId,
    dragStartDate,
    dragCurrentDate,
    isResizingEnd,
    resizingEndTaskId,
    resizeEndStartDate,
    resizeEndCurrentDate,
    isResizingStart,
    resizingStartTaskId,
    resizeStartStartDate,
    resizeStartCurrentDate,
    maxTasksPerRow,
    TASK_COLORS,
    
    // 方法
    addTask,
    removeTask,
    updateTask,
    getTasksForDate,
    getTasksInRange,
    activateTask,
    startDrag,
    updateDrag,
    endDrag,
    startResizeEnd,
    updateResizeEnd,
    endResizeEnd,
    startResizeStart,
    updateResizeStart,
    endResizeStart,
    cancelAllOperations,
    calculateTaskRowIndices
  }
}
