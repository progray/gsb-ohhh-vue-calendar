import { ref, computed, watch } from 'vue'
import { isSameDay } from '../utils/index.js'

const STORAGE_KEY = 'ohhh-calendar-merit'
const TARGET_MERIT = 100

function getStorageKey(year, month) {
  return `${STORAGE_KEY}-${year}-${month + 1}`
}

function loadMeritData(year, month) {
  try {
    const key = getStorageKey(year, month)
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : {}
  } catch (e) {
    console.warn('Failed to load merit data:', e)
    return {}
  }
}

function saveMeritData(year, month, data) {
  try {
    const key = getStorageKey(year, month)
    localStorage.setItem(key, JSON.stringify(data))
  } catch (e) {
    console.warn('Failed to save merit data:', e)
  }
}

export function useMerit(currentYear, currentMonth) {
  const meritData = ref({})
  const animatingDates = ref(new Set())

  function reloadMeritData() {
    meritData.value = loadMeritData(currentYear.value, currentMonth.value)
  }

  reloadMeritData()

  watch([currentYear, currentMonth], () => {
    reloadMeritData()
  })

  const totalMerit = computed(() => {
    return Object.values(meritData.value).reduce((sum, val) => sum + val, 0)
  })

  const progressPercentage = computed(() => {
    return Math.min((totalMerit.value / TARGET_MERIT) * 100, 100)
  })

  const progressLevel = computed(() => {
    const pct = progressPercentage.value
    if (pct >= 90) return 'max'
    if (pct >= 61) return 'purple'
    if (pct >= 31) return 'gold'
    return 'gray'
  })

  function getDateMerit(date) {
    const dateStr = formatDateKey(date)
    return meritData.value[dateStr] || 0
  }

  function formatDateKey(date) {
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
  }

  function addMerit(date) {
    const dateStr = formatDateKey(date)
    if (!meritData.value[dateStr]) {
      meritData.value[dateStr] = 0
    }
    meritData.value[dateStr]++
    saveMeritData(currentYear.value, currentMonth.value, meritData.value)

    animatingDates.value.add(dateStr)
    setTimeout(() => {
      animatingDates.value.delete(dateStr)
    }, 600)
  }

  function isAnimating(date) {
    const dateStr = formatDateKey(date)
    return animatingDates.value.has(dateStr)
  }

  return {
    meritData,
    totalMerit,
    progressPercentage,
    progressLevel,
    targetMerit: TARGET_MERIT,
    getDateMerit,
    addMerit,
    isAnimating,
    reloadMeritData
  }
}
