import { ref, computed, watch } from 'vue'

const STORAGE_KEY_GOALS = 'fitness-tracker-goals'
const STORAGE_KEY_RECORDS = 'fitness-tracker-records'

const defaultGoals = [
  { id: 1, name: '深蹲', emoji: '🏋️', target: 50, unit: '个', color: '#FF6B6B' },
  { id: 2, name: '俯卧撑', emoji: '💪', target: 30, unit: '个', color: '#4ECDC4' },
  { id: 3, name: '热量摄入', emoji: '🔥', target: 1800, unit: 'kcal', color: '#FFD93D' }
]

function loadFromStorage(key, defaultValue) {
  try {
    const stored = localStorage.getItem(key)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    console.error('Error loading from localStorage:', e)
  }
  return defaultValue
}

function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.error('Error saving to localStorage:', e)
  }
}

function formatDate(date) {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function isSameDay(date1, date2) {
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  )
}

export function useFitnessTracker() {
  const goals = ref(loadFromStorage(STORAGE_KEY_GOALS, defaultGoals))
  const records = ref(loadFromStorage(STORAGE_KEY_RECORDS, {}))
  const nextGoalId = ref(goals.value.length > 0 ? Math.max(...goals.value.map(g => g.id)) + 1 : 1)

  watch(
    goals,
    (newVal) => {
      saveToStorage(STORAGE_KEY_GOALS, newVal)
    },
    { deep: true }
  )

  watch(
    records,
    (newVal) => {
      saveToStorage(STORAGE_KEY_RECORDS, newVal)
    },
    { deep: true }
  )

  function addGoal(goal) {
    const newGoal = {
      ...goal,
      id: nextGoalId.value++
    }
    goals.value.push(newGoal)
    return newGoal
  }

  function updateGoal(id, updates) {
    const index = goals.value.findIndex(g => g.id === id)
    if (index !== -1) {
      goals.value[index] = { ...goals.value[index], ...updates }
    }
  }

  function deleteGoal(id) {
    const index = goals.value.findIndex(g => g.id === id)
    if (index !== -1) {
      goals.value.splice(index, 1)
      Object.keys(records.value).forEach(dateKey => {
        if (records.value[dateKey][id] !== undefined) {
          delete records.value[dateKey][id]
        }
      })
    }
  }

  function getRecord(date, goalId) {
    const dateKey = formatDate(date)
    return records.value[dateKey]?.[goalId] || 0
  }

  function setRecord(date, goalId, value) {
    const dateKey = formatDate(date)
    if (!records.value[dateKey]) {
      records.value[dateKey] = {}
    }
    records.value[dateKey][goalId] = Math.max(0, Math.round(value * 10) / 10)
  }

  function getDayRecords(date) {
    const dateKey = formatDate(date)
    return records.value[dateKey] || {}
  }

  function getProgress(date, goal) {
    const record = getRecord(date, goal.id)
    const percentage = goal.target > 0 ? Math.min(100, (record / goal.target) * 100) : 0
    return {
      current: record,
      target: goal.target,
      percentage: Math.round(percentage * 10) / 10,
      isCompleted: record >= goal.target
    }
  }

  function getDaySummary(date) {
    const dayRecords = getDayRecords(date)
    const summary = {
      completedCount: 0,
      totalCount: goals.value.length,
      progressItems: [],
      emojis: []
    }

    goals.value.forEach(goal => {
      const progress = getProgress(date, goal)
      summary.progressItems.push({
        goalId: goal.id,
        goalName: goal.name,
        emoji: goal.emoji,
        color: goal.color,
        ...progress
      })

      if (progress.isCompleted) {
        summary.completedCount++
        summary.emojis.push(goal.emoji)
      }
    })

    summary.overallPercentage = summary.totalCount > 0
      ? Math.round((summary.completedCount / summary.totalCount) * 100)
      : 0

    return summary
  }

  function getProgressColor(percentage, baseColor) {
    if (percentage >= 100) {
      return '#4CAF50'
    } else if (percentage >= 75) {
      return baseColor || '#FFD93D'
    } else if (percentage >= 50) {
      return '#FF9800'
    } else if (percentage >= 25) {
      return '#FF6B6B'
    } else {
      return '#E57373'
    }
  }

  return {
    goals,
    records,
    addGoal,
    updateGoal,
    deleteGoal,
    getRecord,
    setRecord,
    getDayRecords,
    getProgress,
    getDaySummary,
    getProgressColor,
    formatDate,
    isSameDay
  }
}
