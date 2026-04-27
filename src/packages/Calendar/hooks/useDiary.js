import { ref, watch } from 'vue'
import { isSameDay } from '../utils/index.js'

const STORAGE_KEY = 'ohhh-vue-calendar-diaries'

function loadDiaries() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return parsed.map(item => ({
        ...item,
        date: new Date(item.date)
      }))
    }
  } catch (e) {
    console.error('Failed to load diaries from localStorage:', e)
  }
  return []
}

function saveDiaries(diaries) {
  try {
    const toStore = diaries.value.map(item => ({
      ...item,
      date: item.date.toISOString()
    }))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore))
  } catch (e) {
    console.error('Failed to save diaries to localStorage:', e)
  }
}

export function useDiary() {
  const diaries = ref(loadDiaries())

  watch(diaries, () => {
    saveDiaries(diaries)
  }, { deep: true })

  function getDiaryByDate(date) {
    return diaries.value.find(d => isSameDay(d.date, date))
  }

  function addDiary(date, content) {
    if (!content || content.trim().length === 0) return null
    if (content.length > 100) {
      console.error('Diary content exceeds 100 characters')
      return null
    }

    const existingIndex = diaries.value.findIndex(d => isSameDay(d.date, date))
    
    if (existingIndex >= 0) {
      diaries.value[existingIndex].content = content.trim()
      diaries.value[existingIndex].updatedAt = new Date()
      return diaries.value[existingIndex]
    } else {
      const newDiary = {
        id: Date.now().toString(),
        date: new Date(date),
        content: content.trim(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
      diaries.value.push(newDiary)
      return newDiary
    }
  }

  function removeDiary(date) {
    const index = diaries.value.findIndex(d => isSameDay(d.date, date))
    if (index >= 0) {
      diaries.value.splice(index, 1)
      return true
    }
    return false
  }

  function moveDiary(fromDate, toDate, action = 'overwrite') {
    const fromDiary = getDiaryByDate(fromDate)
    if (!fromDiary) return false

    const toDiary = getDiaryByDate(toDate)

    if (toDiary && action === 'merge') {
      const mergedContent = `${toDiary.content}\n${fromDiary.content}`
      addDiary(toDate, mergedContent)
      removeDiary(fromDate)
      return 'merged'
    } else {
      const newDate = new Date(toDate)
      const fromIndex = diaries.value.findIndex(d => isSameDay(d.date, fromDate))
      
      if (fromIndex >= 0) {
        diaries.value[fromIndex].date = newDate
        diaries.value[fromIndex].updatedAt = new Date()
        return 'moved'
      }
      return false
    }
  }

  function hasDiary(date) {
    return diaries.value.some(d => isSameDay(d.date, date))
  }

  return {
    diaries,
    getDiaryByDate,
    addDiary,
    removeDiary,
    moveDiary,
    hasDiary
  }
}
