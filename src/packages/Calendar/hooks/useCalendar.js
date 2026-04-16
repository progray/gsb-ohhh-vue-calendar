import { ref, computed, nextTick } from 'vue'
import {
  createMonthDates,
  createWeekDates,
  isSameDay,
  getDirectionForDate,
  findWeekIndex,
  getPrevMonthDate,
  getNextMonthDate,
  getPrevWeekDate,
  getNextWeekDate
} from '../../../composables/useCalendar.js'

export function useCalendar({ initialSelectedDate, initialViewMode, weekStart, duration }, emit) {
  const selected = ref(initialSelectedDate.value)
  const currentYear = ref(initialSelectedDate.value.getFullYear())
  const currentMonth = ref(initialSelectedDate.value.getMonth())
  const viewMode = ref(initialViewMode.value)
  const weekIndex = ref(0)
  nextTick(() => {
    _setWeekIndex()
  }).then()

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
  _setPrevMonthDates(getPrevMonthDate(currentYear.value, currentMonth.value))
  const prevWeekDates = ref([])
  _setPrevWeekDates(getPrevWeekDate(currentWeekDates.value))
  const prevRenderDates = computed(() => {
    return viewMode.value === 'week' ? prevWeekDates.value : prevMonthDates.value
  })
  const prevRenderRows = computed(() => {
    return viewMode.value === 'week' ? 1 : Math.ceil(prevMonthDates.value.length / 7)
  })

  const nextMonthDates = ref([])
  _setNextMonthDates(getNextMonthDate(currentYear.value, currentMonth.value))
  const nextWeekDates = ref([])
  _setNextWeekDates(getNextWeekDate(currentWeekDates.value))
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

  function toggleViewMode() {
    viewMode.value = viewMode.value === 'week' ? 'month' : 'week'
    renderRows.value = currentRenderRows.value
    _setWeekIndex()
    emit('view-change', viewMode.value)
  }

  const _targetDate = ref(null)

  function _switchPageToTargetDateInMonthView(date) {
    if (date.getFullYear() === currentYear.value && date.getMonth() === currentMonth.value) {
      return
    }
    let direction = getDirectionForDate(date, {
      currentYear: currentYear.value,
      currentMonth: currentMonth.value,
      viewMode: 'month'
    })
    if (direction === 'right') {
      _setPrevMonthDates(date)
    } else {
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
    let direction = getDirectionForDate(date, {
      currentWeekDates: currentWeekDates.value,
      viewMode: 'week'
    })
    if (direction === 'right') {
      _setPrevWeekDates(date)
    } else {
      _setNextWeekDates(date)
    }
    _targetDate.value = date
    startTransitionAnimation(direction)
  }

  function switchPageToTargetDate(date) {
    if (viewMode.value === 'week') {
      _switchPageToTargetDateInWeekView(date)
    } else if (viewMode.value === 'month') {
      _switchPageToTargetDateInMonthView(date)
    }
  }

  function _setWeekIndex(date) {
    const targetDate = date || selected.value
    if (viewMode.value === 'week') {
      weekIndex.value = findWeekIndex(targetDate, currentMonthDates.value, weekStart.value)
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
      _setPrevWeekDates(getPrevWeekDate(currentWeekDates.value))
      _setNextWeekDates(getNextWeekDate(currentWeekDates.value))
    } else if (viewMode.value === 'month') {
      _setPrevMonthDates(getPrevMonthDate(currentYear.value, currentMonth.value))
      _setNextMonthDates(getNextMonthDate(currentYear.value, currentMonth.value))
    }
    _targetDate.value = null
    isInTransition.value = false
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
    toggleViewMode
  }
}
