import { ref, computed, reactive } from 'vue'
import { isSameDay, addDays, formatDate, getDaysBetween } from '../utils/index.js'

export const CYCLE_PHASE = {
  PERIOD: 'period',
  FERTILE: 'fertile',
  OVULATION: 'ovulation',
  LUTEAL: 'luteal'
}

export function useCycle() {
  const cycles = ref([
    {
      id: 1,
      periodStart: new Date(2026, 0, 1),
      periodEnd: new Date(2026, 0, 5),
      ovulationDate: new Date(2026, 0, 15),
      cycleLength: 28,
      periodLength: 5,
      isPredicted: false
    },
    {
      id: 2,
      periodStart: new Date(2026, 0, 29),
      periodEnd: new Date(2026, 1, 2),
      ovulationDate: new Date(2026, 1, 12),
      cycleLength: 29,
      periodLength: 5,
      isPredicted: false
    },
    {
      id: 3,
      periodStart: new Date(2026, 1, 28),
      periodEnd: new Date(2026, 2, 3),
      ovulationDate: new Date(2026, 2, 11),
      cycleLength: 28,
      periodLength: 6,
      isPredicted: false
    },
    {
      id: 4,
      periodStart: new Date(2026, 2, 25),
      periodEnd: new Date(2026, 2, 29),
      ovulationDate: new Date(2026, 3, 8),
      cycleLength: 27,
      periodLength: 5,
      isPredicted: false
    },
    {
      id: 5,
      periodStart: new Date(2026, 3, 21),
      periodEnd: new Date(2026, 3, 25),
      ovulationDate: new Date(2026, 4, 5),
      cycleLength: 26,
      periodLength: 5,
      isPredicted: false
    },
    {
      id: 6,
      periodStart: new Date(2026, 4, 16),
      periodEnd: new Date(2026, 4, 20),
      ovulationDate: new Date(2026, 4, 30),
      cycleLength: 26,
      periodLength: 5,
      isPredicted: false
    },
    {
      id: 7,
      periodStart: new Date(2026, 5, 11),
      periodEnd: new Date(2026, 5, 15),
      ovulationDate: new Date(2026, 5, 25),
      cycleLength: 26,
      periodLength: 5,
      isPredicted: false
    },
    {
      id: 8,
      periodStart: new Date(2026, 6, 7),
      periodEnd: new Date(2026, 6, 11),
      ovulationDate: new Date(2026, 6, 21),
      cycleLength: 27,
      periodLength: 5,
      isPredicted: false
    },
    {
      id: 9,
      periodStart: new Date(2026, 7, 3),
      periodEnd: new Date(2026, 7, 7),
      ovulationDate: new Date(2026, 7, 17),
      cycleLength: 27,
      periodLength: 5,
      isPredicted: false
    },
    {
      id: 10,
      periodStart: new Date(2026, 7, 30),
      periodEnd: new Date(2026, 8, 3),
      ovulationDate: new Date(2026, 8, 13),
      cycleLength: 27,
      periodLength: 5,
      isPredicted: false
    },
    {
      id: 11,
      periodStart: new Date(2026, 8, 26),
      periodEnd: new Date(2026, 8, 30),
      ovulationDate: new Date(2026, 9, 10),
      cycleLength: 27,
      periodLength: 5,
      isPredicted: false
    },
    {
      id: 12,
      periodStart: new Date(2026, 9, 23),
      periodEnd: new Date(2026, 9, 27),
      ovulationDate: new Date(2026, 10, 6),
      cycleLength: 28,
      periodLength: 5,
      isPredicted: false
    },
    {
      id: 13,
      periodStart: new Date(2026, 10, 20),
      periodEnd: new Date(2026, 10, 24),
      ovulationDate: new Date(2026, 11, 4),
      cycleLength: 28,
      periodLength: 5,
      isPredicted: false
    },
    {
      id: 14,
      periodStart: new Date(2026, 11, 17),
      periodEnd: new Date(2026, 11, 21),
      ovulationDate: new Date(2026, 11, 31),
      cycleLength: 28,
      periodLength: 5,
      isPredicted: false
    }
  ])

  const draggingState = reactive({
    isDragging: false,
    type: null,
    cycleId: null,
    currentDate: null,
    initialDate: null
  })

  const averageCycleLength = computed(() => {
    const historicalCycles = cycles.value.filter(c => !c.isPredicted && c.cycleLength)
    if (historicalCycles.length === 0) return 28
    const total = historicalCycles.reduce((sum, c) => sum + c.cycleLength, 0)
    return Math.round(total / historicalCycles.length)
  })

  const averagePeriodLength = computed(() => {
    const historicalCycles = cycles.value.filter(c => !c.isPredicted && c.periodLength)
    if (historicalCycles.length === 0) return 5
    const total = historicalCycles.reduce((sum, c) => sum + c.periodLength, 0)
    return Math.round(total / historicalCycles.length)
  })

  function generatePredictedCycles(monthsAhead = 3) {
    const actualCycles = cycles.value.filter(c => !c.isPredicted)
    if (actualCycles.length === 0) return

    const lastActualCycle = actualCycles[actualCycles.length - 1]
    const cycleLen = averageCycleLength.value
    const periodLen = averagePeriodLength.value
    const predictedCycles = []

    let startDate = addDays(lastActualCycle.periodStart, cycleLen)

    for (let i = 0; i < monthsAhead * 2; i++) {
      const endDate = addDays(startDate, periodLen - 1)
      const ovulationDate = addDays(endDate, 8)

      predictedCycles.push({
        id: 1000 + i,
        periodStart: new Date(startDate),
        periodEnd: new Date(endDate),
        ovulationDate: new Date(ovulationDate),
        cycleLength: cycleLen,
        periodLength: periodLen,
        isPredicted: true
      })

      startDate = addDays(startDate, cycleLen)
    }

    cycles.value = [
      ...actualCycles,
      ...predictedCycles
    ]
  }

  function getCycleForDate(date) {
    for (const cycle of cycles.value) {
      const periodStart = cycle.periodStart
      const periodEnd = cycle.periodEnd
      const nextCycleStart = addDays(periodStart, cycle.cycleLength)
      const cycleEnd = addDays(nextCycleStart, -1)

      if (date >= periodStart && date <= cycleEnd) {
        return cycle
      }
    }
    return null
  }

  function getDatePhase(date) {
    const cycle = getCycleForDate(date)
    if (!cycle) return null

    const periodStart = cycle.periodStart
    const periodEnd = cycle.periodEnd
    const ovulationDate = cycle.ovulationDate
    const fertileStart = addDays(periodEnd, 3)
    const fertileEnd = addDays(ovulationDate, 1)
    const lutealStart = addDays(ovulationDate, 2)
    const nextPeriodStart = addDays(periodStart, cycle.cycleLength)

    if (date >= periodStart && date <= periodEnd) {
      return {
        phase: CYCLE_PHASE.PERIOD,
        isPredicted: cycle.isPredicted,
        cycle: cycle
      }
    }

    if (isSameDay(date, ovulationDate)) {
      return {
        phase: CYCLE_PHASE.OVULATION,
        isPredicted: cycle.isPredicted,
        cycle: cycle
      }
    }

    if (date >= fertileStart && date <= fertileEnd) {
      return {
        phase: CYCLE_PHASE.FERTILE,
        isPredicted: cycle.isPredicted,
        cycle: cycle
      }
    }

    if (date >= lutealStart && date < nextPeriodStart) {
      return {
        phase: CYCLE_PHASE.LUTEAL,
        isPredicted: cycle.isPredicted,
        cycle: cycle
      }
    }

    return null
  }

  function isPeriodStart(date) {
    return cycles.value.some(c => isSameDay(c.periodStart, date))
  }

  function isPeriodEnd(date) {
    return cycles.value.some(c => isSameDay(c.periodEnd, date))
  }

  function isOvulationDate(date) {
    return cycles.value.some(c => isSameDay(c.ovulationDate, date))
  }

  function getCycleByPeriodStart(date) {
    return cycles.value.find(c => isSameDay(c.periodStart, date))
  }

  function getCycleByPeriodEnd(date) {
    return cycles.value.find(c => isSameDay(c.periodEnd, date))
  }

  function getCycleByOvulationDate(date) {
    return cycles.value.find(c => isSameDay(c.ovulationDate, date))
  }

  function updatePeriodStart(cycleId, newDate) {
    const cycle = cycles.value.find(c => c.id === cycleId)
    if (!cycle) return false

    const cycleIndex = cycles.value.findIndex(c => c.id === cycleId)
    const prevCycle = cycleIndex > 0 ? cycles.value[cycleIndex - 1] : null
    const nextCycle = cycleIndex < cycles.value.length - 1 ? cycles.value[cycleIndex + 1] : null

    if (prevCycle && newDate <= prevCycle.periodStart) return false
    if (nextCycle && newDate >= nextCycle.periodEnd) return false
    if (newDate >= cycle.periodEnd) return false

    cycle.periodStart = new Date(newDate)
    cycle.cycleLength = getDaysBetween(cycle.periodStart, addDays(cycle.periodStart, 28))

    if (prevCycle) {
      prevCycle.cycleLength = getDaysBetween(prevCycle.periodStart, cycle.periodStart)
    }

    return true
  }

  function updatePeriodEnd(cycleId, newDate) {
    const cycle = cycles.value.find(c => c.id === cycleId)
    if (!cycle) return false

    if (newDate <= cycle.periodStart) return false

    cycle.periodEnd = new Date(newDate)
    cycle.periodLength = getDaysBetween(cycle.periodStart, cycle.periodEnd) + 1

    return true
  }

  function updateOvulationDate(cycleId, newDate) {
    const cycle = cycles.value.find(c => c.id === cycleId)
    if (!cycle) return false

    if (newDate <= cycle.periodEnd || newDate >= addDays(cycle.periodStart, cycle.cycleLength)) {
      return false
    }

    cycle.ovulationDate = new Date(newDate)
    return true
  }

  function startDrag(type, date, cycleId) {
    draggingState.isDragging = true
    draggingState.type = type
    draggingState.cycleId = cycleId
    draggingState.initialDate = new Date(date)
    draggingState.currentDate = new Date(date)
  }

  function updateDragPosition(date) {
    if (!draggingState.isDragging) return

    let updated = false

    switch (draggingState.type) {
      case 'start':
        updated = updatePeriodStart(draggingState.cycleId, date)
        break
      case 'end':
        updated = updatePeriodEnd(draggingState.cycleId, date)
        break
      case 'ovulation':
        updated = updateOvulationDate(draggingState.cycleId, date)
        break
    }

    if (updated) {
      draggingState.currentDate = new Date(date)
    }
  }

  function endDrag() {
    draggingState.isDragging = false
    draggingState.type = null
    draggingState.cycleId = null
    draggingState.initialDate = null
    draggingState.currentDate = null
  }

  generatePredictedCycles(3)

  return {
    cycles,
    draggingState,
    averageCycleLength,
    averagePeriodLength,
    CYCLE_PHASE,
    generatePredictedCycles,
    getCycleForDate,
    getDatePhase,
    isPeriodStart,
    isPeriodEnd,
    isOvulationDate,
    getCycleByPeriodStart,
    getCycleByPeriodEnd,
    getCycleByOvulationDate,
    updatePeriodStart,
    updatePeriodEnd,
    updateOvulationDate,
    startDrag,
    updateDragPosition,
    endDrag
  }
}
