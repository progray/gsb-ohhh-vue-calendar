import { ref, computed, nextTick, watch } from 'vue'
import { CalendarEngine, isSameDay } from '../calendar-engine'
import type { ICalendarDate, ViewMode, MarkerDateInput } from '../types'

export function useCalendar(
  {
    initialSelectedDate,
    initialViewMode,
    weekStart,
    duration,
    markerDates
  }: {
    initialSelectedDate: { value: Date }
    initialViewMode: { value: string }
    weekStart: { value: number }
    duration: { value: string }
    markerDates?: { value: MarkerDateInput[] }
  },
  emit: (event: 'select-change' | 'view-change', ...args: any[]) => void
) {
  const engine = new CalendarEngine(initialSelectedDate.value, initialViewMode.value as ViewMode, {
    weekStart: weekStart.value,
    duration: duration.value
  })

  const selected = ref<Date>(new Date(initialSelectedDate.value))
  const viewMode = ref<ViewMode>(initialViewMode.value as ViewMode)
  const currentYear = ref<number>(initialSelectedDate.value.getFullYear())
  const currentMonth = ref<number>(initialSelectedDate.value.getMonth())
  const weekIndex = ref<number>(0)

  const headerLabel = computed<string>(() => engine.getHeaderLabel())
  const weekdays = computed<string[]>(() => engine.getWeekdays())

  if (markerDates) {
    engine.setMarkerDates(markerDates.value)
  }

  const transformDistance = ref<string>('0px')
  const transitionDuration = ref<string>('0s')
  const isInTransition = ref<boolean>(false)
  const renderRows = ref<number>(1)

  nextTick(() => {
    _updateStateFromEngine()
  }).then()

  watch(
    () => engine.getRenderData().rows,
    (newRows) => {
      if (!isInTransition.value) {
        renderRows.value = newRows
      }
    }
  )

  const currentRenderDates = computed<ICalendarDate[]>(() => {
    return engine.getRenderData().current
  })

  const prevRenderDates = computed<ICalendarDate[]>(() => {
    return engine.getRenderData().prev
  })

  const nextRenderDates = computed<ICalendarDate[]>(() => {
    return engine.getRenderData().next
  })

  const allRenderDates = computed<ICalendarDate[][]>(() => {
    return [prevRenderDates.value, currentRenderDates.value, nextRenderDates.value]
  })

  function _updateStateFromEngine(): void {
    const state = engine.getState()
    selected.value = new Date(state.selected)
    viewMode.value = state.viewMode
    currentYear.value = state.currentYear
    currentMonth.value = state.currentMonth
    weekIndex.value = state.weekIndex
    renderRows.value = engine.getRenderData().rows
  }

  function toggleViewMode(): void {
    const newViewMode = engine.toggleViewMode()
    viewMode.value = newViewMode
    _updateStateFromEngine()
    emit('view-change', newViewMode)
  }

  function switchPageToTargetDate(date: Date): void {
    const direction = engine.switchPageToTargetDate(date)
    if (direction) {
      startTransitionAnimation(direction)
    }
  }

  function startTransitionAnimation(direction: 'left' | 'right' | 'up' | 'down' | 'none' | null): void {
    transitionDuration.value = duration.value
    isInTransition.value = true

    if (direction === 'left') {
      transformDistance.value = '-100%'
      renderRows.value = engine.getRenderData().rows
    } else if (direction === 'right') {
      transformDistance.value = '100%'
      renderRows.value = engine.getRenderData().rows
    } else {
      transformDistance.value = '0px'
    }
  }

  function onTransitionEnd(): void {
    transitionDuration.value = '0s'

    const targetDate = engine.getTargetDate()
    if (!targetDate) {
      isInTransition.value = false
      return
    }

    engine.finalizeTransition()
    _updateStateFromEngine()
    transformDistance.value = '0px'
    isInTransition.value = false
  }

  function changePageTo(param: string | Date): void {
    const targetDate = engine.normalizePageParam(param)
    switchPageToTargetDate(targetDate)
  }

  function changeSelectedDate(date: Date): void {
    changePageTo(date)
    if (!isSameDay(new Date(date), selected.value)) {
      selected.value = new Date(date)
      engine.setSelected(new Date(date))
      emit('select-change', selected.value)
    }
  }

  function getMarkerColor(date: Date): string | undefined {
    return engine.getMarkerColor(date)
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
    headerLabel,
    weekdays,
    switchPageToTargetDate,
    startTransitionAnimation,
    onTransitionEnd,
    toggleViewMode,
    changePageTo,
    changeSelectedDate,
    getMarkerColor,
    isSameDay
  }
}
