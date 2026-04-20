import { ref, computed, nextTick } from 'vue'
import { createMonthDates, createWeekDates, isSameDay } from '../utils/index.js'
import { useHistory } from './useHistory.js'

export function useCalendar({ initialSelectedDate, initialViewMode, weekStart, duration }, emit) {
  const selected = ref(initialSelectedDate.value)
  const currentYear = ref(initialSelectedDate.value.getFullYear())
  const currentMonth = ref(initialSelectedDate.value.getMonth())
  const viewMode = ref(initialViewMode.value)
  const weekIndex = ref(0)

  const {
    historyStack,
    currentIndex: historyCurrentIndex,
    canUndo,
    canRedo,
    currentHistory,
    historyList,
    pushHistory,
    undo: historyUndo,
    redo: historyRedo,
    jumpTo: historyJumpTo,
    clearHistory,
    initializeWithState,
    updateCurrentState
  } = useHistory()

  nextTick(() => {
    _setWeekIndex()
    initializeWithState(_getCurrentState())
  })

  function _getCurrentState() {
    return {
      selected: selected.value ? new Date(selected.value) : null,
      year: currentYear.value,
      month: currentMonth.value,
      viewMode: viewMode.value,
      weekIndex: weekIndex.value
    }
  }

  function _restoreState(state) {
    if (!state) return

    if (state.selected) {
      selected.value = new Date(state.selected)
    }
    currentYear.value = state.year
    currentMonth.value = state.month
    viewMode.value = state.viewMode
    weekIndex.value = state.weekIndex

    _setPrevMonthDates(new Date(currentYear.value, currentMonth.value - 1))
    _setNextMonthDates(new Date(currentYear.value, currentMonth.value + 1))
    _setWeekIndex()

    if (viewMode.value === 'week') {
      _setPrevWeekDates(
        new Date(new Date(currentWeekDates.value[0].date).setDate(currentWeekDates.value[0].date.getDate() - 1))
      )
      _setNextWeekDates(
        new Date(new Date(currentWeekDates.value[6].date).setDate(currentWeekDates.value[6].date.getDate() + 1))
      )
    }

    renderRows.value = currentRenderRows.value
  }

  const currentMonthDates = computed(() => {
    return createMonthDates(new Date(currentYear.value, currentMonth.value), weekStart.value)
  })
  const currentWeekDates = computed(() => {
    return currentMonthDates.value.slice(weekIndex.value * 7, weekIndex.value * 7 + 7)
  })
  const currentRenderDates = computed(() => {
    return viewMode.value === 'week' ? currentWeekDates.value : currentMonthDates.value
  })
  const currentRenderRows = computed(() => {
    return viewMode.value === 'week' ? 1 : Math.ceil(currentMonthDates.value.length / 7)
  })

  const prevMonthDates = ref([])
  _setPrevMonthDates(new Date(currentYear.value, currentMonth.value - 1))
  const prevWeekDates = ref([])
  _setPrevWeekDates(
    new Date(new Date(currentWeekDates.value[0].date).setDate(currentWeekDates.value[0].date.getDate() - 1))
  )
  const prevRenderDates = computed(() => {
    return viewMode.value === 'week' ? prevWeekDates.value : prevMonthDates.value
  })
  const prevRenderRows = computed(() => {
    return viewMode.value === 'week' ? 1 : Math.ceil(prevMonthDates.value.length / 7)
  })

  const nextMonthDates = ref([])
  _setNextMonthDates(new Date(currentYear.value, currentMonth.value + 1))
  const nextWeekDates = ref([])
  _setNextWeekDates(
    new Date(new Date(currentWeekDates.value[6].date).setDate(currentWeekDates.value[6].date.getDate() + 1))
  )
  const nextRenderDates = computed(() => {
    return viewMode.value === 'week' ? nextWeekDates.value : nextMonthDates.value
  })
  const nextRenderRows = computed(() => {
    return viewMode.value === 'week' ? 1 : Math.ceil(nextMonthDates.value.length / 7)
  })

  const allRenderDates = computed(() => {
    return [prevRenderDates.value, currentRenderDates.value, nextRenderDates.value]
  })

  function _setPrevMonthDates(date) {
    prevMonthDates.value = createMonthDates(date, weekStart.value)
  }
  function _setNextMonthDates(date) {
    nextMonthDates.value = createMonthDates(date, weekStart.value)
  }
  function _setPrevWeekDates(date) {
    prevWeekDates.value = createWeekDates(date, weekStart.value)
  }
  function _setNextWeekDates(date) {
    nextWeekDates.value = createWeekDates(date, weekStart.value)
  }

  let isRestoringFromHistory = false

  function toggleViewMode() {
    if (isRestoringFromHistory) return

    const previousState = _getCurrentState()
    viewMode.value = viewMode.value === 'week' ? 'month' : 'week'
    renderRows.value = currentRenderRows.value
    _setWeekIndex()
    emit('view-change', viewMode.value)

    pushHistory('change-view', _getCurrentState(), previousState)
  }

  const _targetDate = ref(null)

  function _switchPageToTargetDateInMonthView(date) {
    if (date.getFullYear() === currentYear.value && date.getMonth() === currentMonth.value) {
      return
    }
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
    startTransitionAnimation(direction)
  }

  function _switchPageToTargetDateInWeekView(date) {
    if (currentWeekDates.value.some(item => isSameDay(item.date, date))) {
      if (date.getFullYear() === currentYear.value && date.getMonth() === currentMonth.value) {
        return
      }
      currentYear.value = date.getFullYear()
      currentMonth.value = date.getMonth()
      _setWeekIndex(date)
      return
    }
    let direction
    if (date < currentWeekDates.value[0].date) {
      direction = 'right'
      _setPrevWeekDates(date)
    } else {
      direction = 'left'
      _setNextWeekDates(date)
    }
    _targetDate.value = date
    startTransitionAnimation(direction)
  }

  let pendingPageChange = null

  function switchPageToTargetDate(date) {
    if (isRestoringFromHistory) return

    const previousState = _getCurrentState()

    if (viewMode.value === 'week') {
      _switchPageToTargetDateInWeekView(date)
    } else if (viewMode.value === 'month') {
      _switchPageToTargetDateInMonthView(date)
    }

    const targetYear = date.getFullYear()
    const targetMonth = date.getMonth()
    const isYearChange = targetYear !== currentYear.value
    const isMonthChange = targetMonth !== currentMonth.value

    if (isYearChange || isMonthChange) {
      pendingPageChange = {
        date: date,
        previousState: previousState,
        action: isYearChange ? 'change-year' : 'change-month'
      }
    }
  }

  function _setWeekIndex(date) {
    const targetDate = date || selected.value
    if (viewMode.value === 'week') {
      const found = currentMonthDates.value.findIndex(d => isSameDay(d.date, targetDate))
      const idx = Math.max(found, 0)
      weekIndex.value = Math.floor(idx / 7)
    }
  }

  const transformDistance = ref('0px')
  const transitionDuration = ref('0s')
  const isInTransition = ref(false)
  const renderRows = ref(currentRenderRows.value)

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

  function onTransitionEnd() {
    transitionDuration.value = '0s'
    if (!_targetDate.value) {
      return (isInTransition.value = false)
    }
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

    if (pendingPageChange) {
      pushHistory(pendingPageChange.action, _getCurrentState(), pendingPageChange.previousState)
      pendingPageChange = null
    }

    _targetDate.value = null
    isInTransition.value = false
  }

  function recordSelectDate(newSelectedDate, previousState) {
    if (isRestoringFromHistory) return
    pushHistory('select-date', _getCurrentState(), previousState)
  }

  function undo() {
    if (!canUndo.value) return

    const historyItem = historyUndo()
    if (historyItem) {
      isRestoringFromHistory = true
      _restoreState(historyItem.state)
      isRestoringFromHistory = false
      emit('select-change', selected.value)
    }
  }

  function redo() {
    if (!canRedo.value) return

    const historyItem = historyRedo()
    if (historyItem) {
      isRestoringFromHistory = true
      _restoreState(historyItem.state)
      isRestoringFromHistory = false
      emit('select-change', selected.value)
    }
  }

  function jumpToHistory(index) {
    const historyItem = historyJumpTo(index)
    if (historyItem) {
      isRestoringFromHistory = true
      _restoreState(historyItem.state)
      isRestoringFromHistory = false
      emit('select-change', selected.value)
    }
  }

  return {
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
    toggleViewMode,
    recordSelectDate,
    canUndo,
    canRedo,
    undo,
    redo,
    jumpToHistory,
    historyList,
    historyCurrentIndex
  }
}
