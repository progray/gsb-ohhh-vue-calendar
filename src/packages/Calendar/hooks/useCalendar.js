import { ref, computed, nextTick } from 'vue'
import { createMonthDates, createWeekDates, isSameDay } from '../utils/index.js'

export function useCalendar({ 
  initialSelectedDate, 
  initialViewMode, 
  weekStart, 
  duration,
  selectionMode = ref('single'),
  rangeMode = ref(false),
  maxSelectCount = ref(Infinity)
}, emit) {
  // 选中的日期（单选模式）
  const selected = ref(initialSelectedDate.value)
  // 选中的日期数组（多选模式）
  const selectedDates = ref([])
  // 选择模式：'single' | 'multiple'
  const currentSelectionMode = ref(selectionMode.value)
  // 范围选择模式
  const isRangeMode = ref(rangeMode.value)
  // 最大可选数量
  const currentMaxSelectCount = ref(maxSelectCount.value)
  // 范围选择的起始日期
  const rangeStartDate = ref(null)
  // 范围选择的结束日期
  const rangeEndDate = ref(null)
  // 悬停预览的日期
  const hoverDate = ref(null)
  
  // 当前渲染页年份
  const currentYear = ref(initialSelectedDate.value.getFullYear())
  // 当前渲染页月份(索引)
  const currentMonth = ref(initialSelectedDate.value.getMonth())
  // 当前渲染视图模式
  const viewMode = ref(initialViewMode.value)
  // 周视图下，当前展示的周索引
  const weekIndex = ref(0)
  nextTick(() => {
    _setWeekIndex()
  }).then()

  // 当前渲染页月日期
  const currentMonthDates = computed(() => {
    return createMonthDates(new Date(currentYear.value, currentMonth.value), weekStart.value)
  })
  // 当前渲染页周日期
  const currentWeekDates = computed(() => {
    return currentMonthDates.value.slice(weekIndex.value * 7, weekIndex.value * 7 + 7)
  })
  // 根据视图模式计算当前渲染页实际渲染的日期
  const currentRenderDates = computed(() => {
    return viewMode.value === 'week' ? currentWeekDates.value : currentMonthDates.value
  })
  // 根据视图模式计算当前渲染页的行数
  const currentRenderRows = computed(() => {
    return viewMode.value === 'week' ? 1 : Math.ceil(currentMonthDates.value.length / 7)
  })

  // 上一渲染页月日期 (初始化取上月)
  const prevMonthDates = ref([])
  _setPrevMonthDates(new Date(currentYear.value, currentMonth.value - 1))
  // 上一渲染页周日期 (初始化取上周)
  const prevWeekDates = ref([])
  _setPrevWeekDates(
    new Date(new Date(currentWeekDates.value[0].date).setDate(currentWeekDates.value[0].date.getDate() - 1))
  )
  // 根据视图模式计算上一渲染页实际渲染的日期
  const prevRenderDates = computed(() => {
    return viewMode.value === 'week' ? prevWeekDates.value : prevMonthDates.value
  })
  // 根据视图模式计算上一渲染页的行数
  const prevRenderRows = computed(() => {
    return viewMode.value === 'week' ? 1 : Math.ceil(prevMonthDates.value.length / 7)
  })

  // 下一渲染页月日期 (初始化取下月)
  const nextMonthDates = ref([])
  _setNextMonthDates(new Date(currentYear.value, currentMonth.value + 1))
  // 下一渲染页周日期 (初始化取下周)
  const nextWeekDates = ref([])
  _setNextWeekDates(
    new Date(new Date(currentWeekDates.value[6].date).setDate(currentWeekDates.value[6].date.getDate() + 1))
  )
  // 根据视图模式计算下一渲染页实际渲染的日期
  const nextRenderDates = computed(() => {
    return viewMode.value === 'week' ? nextWeekDates.value : nextMonthDates.value
  })
  // 根据视图模式计算下一渲染页的行数
  const nextRenderRows = computed(() => {
    return viewMode.value === 'week' ? 1 : Math.ceil(nextMonthDates.value.length / 7)
  })

  // 拼接了上一页、当前页、下一页的渲染日期
  const allRenderDates = computed(() => {
    return [prevRenderDates.value, currentRenderDates.value, nextRenderDates.value]
  })

  // 设置上一渲染页的月日期
  function _setPrevMonthDates(date) {
    prevMonthDates.value = createMonthDates(date, weekStart.value)
  }
  // 设置下一渲染页的月日期
  function _setNextMonthDates(date) {
    nextMonthDates.value = createMonthDates(date, weekStart.value)
  }
  // 设置上一渲染页的周日期
  function _setPrevWeekDates(date) {
    prevWeekDates.value = createWeekDates(date, weekStart.value)
  }
  // 设置下一渲染页的周日期
  function _setNextWeekDates(date) {
    nextWeekDates.value = createWeekDates(date, weekStart.value)
  }

  // 切换视图模式
  function toggleViewMode() {
    viewMode.value = viewMode.value === 'week' ? 'month' : 'week'
    renderRows.value = currentRenderRows.value
    _setWeekIndex()
    emit('view-change', viewMode.value)
  }

  // 切换的目标日期
  const _targetDate = ref(null)

  // 月视图下切换页面到指定日期
  function _switchPageToTargetDateInMonthView(date) {
    if (date.getFullYear() === currentYear.value && date.getMonth() === currentMonth.value) {
      return
    }
    // 1、设置prevMonthDates/nextMonthDates
    let direction
    if (
      date.getFullYear() < currentYear.value ||
      (date.getFullYear() === currentYear.value && date.getMonth() < currentMonth.value)
    ) {
      direction = 'right'
      _setPrevMonthDates(date)
    } else {
      direction = 'left'
      _setNextMonthDates(date)
    }
    _targetDate.value = date
    // 2、开启切换动画
    startTransitionAnimation(direction)
    // 3、监听动画结束事件，并执行相应回调
  }

  // 周视图下切换页面到指定日期
  function _switchPageToTargetDateInWeekView(date) {
    if (currentWeekDates.value.some(item => isSameDay(item.date, date))) {
      if (date.getFullYear() === currentYear.value && date.getMonth() === currentMonth.value) {
        return
      }
      // 目标日期在当前周内，但可能不在当前月份，若不在当前月份需手动设置currentYear/currentMonth
      currentYear.value = date.getFullYear()
      currentMonth.value = date.getMonth()
      _setWeekIndex(date)
      return
    }
    // 1、设置prevWeekDates/nextWeekDates
    let direction
    if (date < currentWeekDates.value[0].date) {
      direction = 'right'
      _setPrevWeekDates(date)
    } else {
      direction = 'left'
      _setNextWeekDates(date)
    }
    _targetDate.value = date
    // 2、开启切换动画
    startTransitionAnimation(direction)
    // 3、监听动画结束事件，并执行相应回调
  }

  // 切换页面到指定日期 (根据当前视图自动判断切月或切周)
  function switchPageToTargetDate(date) {
    if (viewMode.value === 'week') {
      _switchPageToTargetDateInWeekView(date)
    } else if (viewMode.value === 'month') {
      _switchPageToTargetDateInMonthView(date)
    }
  }

  // 设置周索引
  // 查找传入的date或selected所在周的周索引，若找不到则默认为0
  function _setWeekIndex(date) {
    const targetDate = date || selected.value
    if (viewMode.value === 'week') {
      const found = currentMonthDates.value.findIndex(d => isSameDay(d.date, targetDate))
      const idx = Math.max(found, 0)
      weekIndex.value = Math.floor(idx / 7)
    }
  }

  // 移动的距离
  const transformDistance = ref('0px')
  // 动画时间
  const transitionDuration = ref('0s')
  // 是否正在过渡动画过程中
  const isInTransition = ref(false)
  // 页面实际渲染的行数
  const renderRows = ref(currentRenderRows.value)

  // 开始播放过渡动画
  function startTransitionAnimation(direction) {
    transitionDuration.value = duration.value
    isInTransition.value = true
    if (direction === 'left') {
      transformDistance.value = '-100%'
      renderRows.value = nextRenderRows.value
    } else if (direction === 'right') {
      transformDistance.value = '100%'
      renderRows.value = prevRenderRows.value
    } else {
      transformDistance.value = '0px'
    }
  }

  // 检查日期是否在选中数组中
  function isDateSelected(date) {
    return selectedDates.value.some(d => isSameDay(d, date))
  }

  // 获取日期的选中序号
  function getSelectedIndex(date) {
    const index = selectedDates.value.findIndex(d => isSameDay(d, date))
    return index >= 0 ? index + 1 : 0
  }

  // 检查日期是否在范围选择的预览范围内
  function isDateInRangePreview(date) {
    if (!isRangeMode.value || !rangeStartDate.value || !hoverDate.value) {
      return false
    }
    
    const start = rangeStartDate.value
    const end = hoverDate.value
    
    // 确保 start 是较小的日期，end 是较大的日期
    const actualStart = start <= end ? start : end
    const actualEnd = start <= end ? end : start
    
    // 检查日期是否在范围内（不包括起始日期，因为起始日期已经是选中状态）
    return date > actualStart && date < actualEnd
  }

  // 检查日期是否是范围选择的边界（起始或结束）
  function isDateRangeBoundary(date) {
    if (!isRangeMode.value) return false
    if (rangeStartDate.value && isSameDay(date, rangeStartDate.value)) return true
    if (rangeEndDate.value && isSameDay(date, rangeEndDate.value)) return true
    return false
  }

  // 检查日期是否在已选范围中间
  function isDateInSelectedRange(date) {
    if (!isRangeMode.value || !rangeStartDate.value || !rangeEndDate.value) {
      return false
    }
    
    const start = rangeStartDate.value
    const end = rangeEndDate.value
    
    // 确保 start 是较小的日期，end 是较大的日期
    const actualStart = start <= end ? start : end
    const actualEnd = start <= end ? end : start
    
    // 检查日期是否在范围内（不包括边界，因为边界已经是选中状态）
    return date > actualStart && date < actualEnd
  }

  // 多选模式下切换日期选择状态
  function toggleDateSelection(date) {
    const dateIndex = selectedDates.value.findIndex(d => isSameDay(d, date))
    
    if (dateIndex >= 0) {
      // 日期已选中，取消选中
      selectedDates.value.splice(dateIndex, 1)
    } else {
      // 日期未选中，添加到选中列表
      // 检查是否超过最大可选数量
      if (selectedDates.value.length >= currentMaxSelectCount.value) {
        // 超过限制，移除最早选中的日期
        selectedDates.value.shift()
      }
      selectedDates.value.push(new Date(date))
    }
    
    // 触发选择变化事件
    emit('select-change', currentSelectionMode.value === 'single' ? selected.value : selectedDates.value)
  }

  // 范围选择模式下处理日期选择
  function handleRangeSelection(date) {
    if (!rangeStartDate.value) {
      // 第一次点击，设置起始日期
      rangeStartDate.value = new Date(date)
      rangeEndDate.value = null
      // 清空之前的选中日期
      selectedDates.value = [new Date(date)]
    } else {
      // 第二次点击，设置结束日期并选择范围内的所有日期
      rangeEndDate.value = new Date(date)
      
      // 计算范围内的所有日期
      const start = rangeStartDate.value <= rangeEndDate.value ? rangeStartDate.value : rangeEndDate.value
      const end = rangeStartDate.value <= rangeEndDate.value ? rangeEndDate.value : rangeStartDate.value
      
      // 清空之前的选中日期
      selectedDates.value = []
      
      // 添加范围内的所有日期
      let currentDate = new Date(start)
      while (currentDate <= end) {
        // 检查是否超过最大可选数量
        if (selectedDates.value.length >= currentMaxSelectCount.value) {
          break
        }
        selectedDates.value.push(new Date(currentDate))
        currentDate.setDate(currentDate.getDate() + 1)
      }
      
      // 重置范围选择状态，以便下次选择
      rangeStartDate.value = null
      rangeEndDate.value = null
      hoverDate.value = null
    }
    
    // 触发选择变化事件
    emit('select-change', selectedDates.value)
  }

  // 处理悬停事件
  function handleDateHover(date) {
    if (isRangeMode.value && rangeStartDate.value) {
      hoverDate.value = new Date(date)
    }
  }

  // 清除悬停状态
  function clearHover() {
    hoverDate.value = null
  }

  // 切换选择模式
  function setSelectionMode(mode) {
    if (currentSelectionMode.value !== mode) {
      currentSelectionMode.value = mode
      // 切换模式时清空选中状态
      if (mode === 'single') {
        selectedDates.value = []
      } else {
        selected.value = initialSelectedDate.value
      }
    }
  }

  // 设置范围选择模式
  function setRangeMode(enabled) {
    isRangeMode.value = enabled
    if (!enabled) {
      // 关闭范围模式时重置相关状态
      rangeStartDate.value = null
      rangeEndDate.value = null
      hoverDate.value = null
    }
  }

  // 设置最大可选数量
  function setMaxSelectCount(count) {
    currentMaxSelectCount.value = count
    // 如果当前选中数量超过新的限制，移除最早选中的日期
    while (selectedDates.value.length > count) {
      selectedDates.value.shift()
    }
  }

  // 清除所有选中日期
  function clearAllSelections() {
    selectedDates.value = []
    rangeStartDate.value = null
    rangeEndDate.value = null
    hoverDate.value = null
    emit('select-change', currentSelectionMode.value === 'single' ? selected.value : selectedDates.value)
  }

  // 移除单个选中日期
  function removeSelectedDate(date) {
    const index = selectedDates.value.findIndex(d => isSameDay(d, date))
    if (index >= 0) {
      selectedDates.value.splice(index, 1)
      emit('select-change', selectedDates.value)
    }
  }

  // 监听过渡动画结束
  function onTransitionEnd() {
    transitionDuration.value = '0s'
    if (!_targetDate.value) {
      return (isInTransition.value = false)
    }
    // 设置currentYear/currentMonth
    currentYear.value = _targetDate.value.getFullYear()
    currentMonth.value = _targetDate.value.getMonth()
    renderRows.value = currentRenderRows.value
    transformDistance.value = '0px'
    if (viewMode.value === 'week') {
      _setWeekIndex(_targetDate.value)
      _setPrevWeekDates(
        new Date(new Date(currentWeekDates.value[0].date).setDate(currentWeekDates.value[0].date.getDate() - 1))
      )
      _setNextWeekDates(
        new Date(new Date(currentWeekDates.value[6].date).setDate(currentWeekDates.value[6].date.getDate() + 1))
      )
    } else if (viewMode.value === 'month') {
      _setPrevMonthDates(new Date(currentYear.value, currentMonth.value - 1))
      _setNextMonthDates(new Date(currentYear.value, currentMonth.value + 1))
    }
    _targetDate.value = null
    isInTransition.value = false
  }

  return {
    selected,
    selectedDates,
    viewMode,
    currentSelectionMode,
    isRangeMode,
    currentMaxSelectCount,
    rangeStartDate,
    rangeEndDate,
    hoverDate,
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
    toggleViewMode,
    isDateSelected,
    getSelectedIndex,
    isDateInRangePreview,
    isDateRangeBoundary,
    isDateInSelectedRange,
    toggleDateSelection,
    handleRangeSelection,
    handleDateHover,
    clearHover,
    setSelectionMode,
    setRangeMode,
    setMaxSelectCount,
    clearAllSelections,
    removeSelectedDate
  }
}
