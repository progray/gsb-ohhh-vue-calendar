import { ref, watch } from 'vue'
import { isSameDay } from '../utils/index.js'

const STORAGE_KEY = 'ohhh-calendar-moods'

export const MOOD_COLORS = [
  '#FF6B6B',
  '#FFE66D',
  '#4ECDC4',
  '#A78BFA',
  '#95E1D3'
]

function _formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function _loadFromStorage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

function _saveToStorage(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.error('Failed to save mood data:', e)
  }
}

export function useMood() {
  const moods = ref(_loadFromStorage())

  watch(moods, (newMoods) => {
    _saveToStorage(newMoods)
  }, { deep: true })

  function setMood(date, colorIndex) {
    const dateKey = _formatDate(date)
    if (colorIndex === null || colorIndex === undefined) {
      const newMoods = { ...moods.value }
      delete newMoods[dateKey]
      moods.value = newMoods
    } else {
      moods.value = {
        ...moods.value,
        [dateKey]: {
          colorIndex,
          timestamp: Date.now()
        }
      }
    }
  }

  function getMood(date) {
    const dateKey = _formatDate(date)
    return moods.value[dateKey]
  }

  function hasMood(date) {
    return getMood(date) !== undefined
  }

  function getMoodColor(date) {
    const mood = getMood(date)
    if (!mood) return null
    return MOOD_COLORS[mood.colorIndex]
  }

  function getMonthlyMoods(year, month) {
    const result = {}
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    
    for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
      const mood = getMood(d)
      if (mood) {
        result[_formatDate(d)] = mood
      }
    }
    return result
  }

  function getDominantMood(year, month) {
    const monthlyMoods = getMonthlyMoods(year, month)
    const colorCounts = {}
    
    for (const dateKey in monthlyMoods) {
      const colorIndex = monthlyMoods[dateKey].colorIndex
      colorCounts[colorIndex] = (colorCounts[colorIndex] || 0) + 1
    }
    
    if (Object.keys(colorCounts).length === 0) return null
    
    let maxCount = 0
    let dominantColorIndex = null
    
    for (const colorIndex in colorCounts) {
      if (colorCounts[colorIndex] > maxCount) {
        maxCount = colorCounts[colorIndex]
        dominantColorIndex = parseInt(colorIndex)
      }
    }
    
    return dominantColorIndex
  }

  function getConsecutiveMoodDates(year, month) {
    const monthlyMoods = getMonthlyMoods(year, month)
    const dateKeys = Object.keys(monthlyMoods).sort()
    
    if (dateKeys.length < 2) return []
    
    const sequences = []
    let currentSequence = []
    
    for (let i = 0; i < dateKeys.length; i++) {
      const currentDate = new Date(dateKeys[i])
      const currentMood = monthlyMoods[dateKeys[i]]
      
      if (currentSequence.length === 0) {
        currentSequence.push({
          dateKey: dateKeys[i],
          date: currentDate,
          mood: currentMood
        })
      } else {
        const prevDate = currentSequence[currentSequence.length - 1].date
        const prevMood = currentSequence[currentSequence.length - 1].mood
        
        const dayDiff = (currentDate - prevDate) / (1000 * 60 * 60 * 24)
        
        if (dayDiff === 1 && currentMood.colorIndex === prevMood.colorIndex) {
          currentSequence.push({
            dateKey: dateKeys[i],
            date: currentDate,
            mood: currentMood
          })
        } else {
          if (currentSequence.length >= 2) {
            sequences.push([...currentSequence])
          }
          currentSequence = [{
            dateKey: dateKeys[i],
            date: currentDate,
            mood: currentMood
          }]
        }
      }
    }
    
    if (currentSequence.length >= 2) {
      sequences.push(currentSequence)
    }
    
    return sequences
  }

  return {
    moods,
    MOOD_COLORS,
    setMood,
    getMood,
    hasMood,
    getMoodColor,
    getMonthlyMoods,
    getDominantMood,
    getConsecutiveMoodDates
  }
}