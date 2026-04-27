import { ref, watch } from 'vue'
import { isSameDay } from '../utils/index.js'

const STORAGE_KEY = 'ohhh-vue-calendar-diaries'

function dateToKey(date) {
  const d = new Date(date)
  return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate()
}

function loadDiaries() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return parsed.map(function(item) {
        return {
          dateKey: item.dateKey || dateToKey(new Date(item.date)),
          date: new Date(item.date),
          items: item.items || [{
            id: item.id || dateToKey(new Date(item.date)) + '-0',
            content: item.content || '',
            createdAt: new Date(item.createdAt || Date.now()),
            updatedAt: new Date(item.updatedAt || Date.now())
          }],
          updatedAt: new Date(item.updatedAt || Date.now())
        }
      })
    }
  } catch (e) {
    console.error('Failed to load diaries:', e)
  }
  return []
}

function saveDiaries(diaries) {
  try {
    const toStore = diaries.value.map(function(item) {
      return {
        dateKey: item.dateKey,
        date: item.date.toISOString(),
        items: item.items.map(function(subItem) {
          return {
            id: subItem.id,
            content: subItem.content,
            createdAt: subItem.createdAt.toISOString(),
            updatedAt: subItem.updatedAt.toISOString()
          }
        }),
        updatedAt: item.updatedAt.toISOString()
      }
    })
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore))
  } catch (e) {
    console.error('Failed to save diaries:', e)
  }
}

export function useDiary() {
  const diaries = ref(loadDiaries())

  watch(diaries, function() {
    saveDiaries(diaries)
  }, { deep: true })

  function getDiaryByDate(date) {
    return diaries.value.find(function(d) {
      return isSameDay(d.date, date)
    })
  }

  function getDiaryItems(date) {
    const diary = getDiaryByDate(date)
    return diary ? diary.items : []
  }

  function getDiaryItemById(date, itemId) {
    const items = getDiaryItems(date)
    return items.find(function(item) {
      return item.id === itemId
    })
  }

  function addDiaryItem(date, content) {
    if (!content || !content.trim() || content.trim().length === 0) {
      return null
    }
    if (content.length > 100) {
      console.error('Content too long')
      return null
    }

    const dateKey = dateToKey(date)
    const existingIndex = diaries.value.findIndex(function(d) {
      return isSameDay(d.date, date)
    })
    const now = new Date()

    const newItem = {
      id: dateKey + '-' + Date.now(),
      content: content.trim(),
      createdAt: now,
      updatedAt: now
    }

    if (existingIndex >= 0) {
      diaries.value[existingIndex].items.push(newItem)
      diaries.value[existingIndex].updatedAt = now
    } else {
      diaries.value.push({
        dateKey: dateKey,
        date: new Date(date),
        items: [newItem],
        updatedAt: now
      })
    }

    return newItem
  }

  function removeDiaryItem(date, itemId) {
    const diaryIndex = diaries.value.findIndex(function(d) {
      return isSameDay(d.date, date)
    })
    if (diaryIndex < 0) return false

    const itemIndex = diaries.value[diaryIndex].items.findIndex(function(item) {
      return item.id === itemId
    })
    if (itemIndex < 0) return false

    diaries.value[diaryIndex].items.splice(itemIndex, 1)
    diaries.value[diaryIndex].updatedAt = new Date()

    if (diaries.value[diaryIndex].items.length === 0) {
      diaries.value.splice(diaryIndex, 1)
    }

    return true
  }

  function moveDiaryItem(fromDate, toDate, itemId, action) {
    action = action || 'overwrite'
    
    const fromDiary = getDiaryByDate(fromDate)
    if (!fromDiary) return false

    const itemIndex = fromDiary.items.findIndex(function(item) {
      return item.id === itemId
    })
    if (itemIndex < 0) return false

    const toDateKey = dateToKey(toDate)
    const toDiary = getDiaryByDate(toDate)
    const now = new Date()

    const newItemId = toDateKey + '-' + Date.now()
    const newItem = {
      id: newItemId,
      content: fromDiary.items[itemIndex].content,
      createdAt: fromDiary.items[itemIndex].createdAt,
      updatedAt: now
    }

    if (toDiary) {
      if (action === 'merge') {
        toDiary.items.push(newItem)
        toDiary.updatedAt = now
      } else {
        toDiary.items = [newItem]
        toDiary.updatedAt = now
      }
    } else {
      diaries.value.push({
        dateKey: toDateKey,
        date: new Date(toDate),
        items: [newItem],
        updatedAt: now
      })
    }

    fromDiary.items.splice(itemIndex, 1)
    fromDiary.updatedAt = now

    if (fromDiary.items.length === 0) {
      const fromIndex = diaries.value.findIndex(function(d) {
        return isSameDay(d.date, fromDate)
      })
      if (fromIndex >= 0) {
        diaries.value.splice(fromIndex, 1)
      }
    }

    return action === 'merge' ? 'merged' : 'moved'
  }

  function updateDiaryItem(date, itemId, newContent) {
    if (!newContent || !newContent.trim()) {
      return removeDiaryItem(date, itemId)
    }
    if (newContent.length > 100) {
      return null
    }

    const diary = getDiaryByDate(date)
    if (!diary) return null

    const itemIndex = diary.items.findIndex(function(item) {
      return item.id === itemId
    })
    if (itemIndex < 0) return null

    diary.items[itemIndex].content = newContent.trim()
    diary.items[itemIndex].updatedAt = new Date()
    diary.updatedAt = new Date()

    return diary.items[itemIndex]
  }

  function addDiary(date, content) {
    if (!content || !content.trim()) return null

    const existing = getDiaryByDate(date)
    if (existing && existing.items.length > 0) {
      return updateDiaryItem(date, existing.items[0].id, content)
    }

    return addDiaryItem(date, content)
  }

  function removeDiary(date) {
    const index = diaries.value.findIndex(function(d) {
      return isSameDay(d.date, date)
    })
    if (index >= 0) {
      diaries.value.splice(index, 1)
      return true
    }
    return false
  }

  function moveDiary(fromDate, toDate, action) {
    action = action || 'overwrite'
    const fromDiary = getDiaryByDate(fromDate)
    if (!fromDiary || !fromDiary.items || fromDiary.items.length === 0) {
      return false
    }

    let result = false
    const itemsToMove = fromDiary.items.slice()

    for (let i = 0; i < itemsToMove.length; i++) {
      result = moveDiaryItem(fromDate, toDate, itemsToMove[i].id, action)
      if (action === 'merge') {
        action = 'overwrite'
      }
    }

    return result
  }

  function hasDiary(date) {
    return diaries.value.some(function(d) {
      return isSameDay(d.date, date)
    })
  }

  function hasDiaryItems(date) {
    const items = getDiaryItems(date)
    return items.length > 0
  }

  return {
    diaries: diaries,
    getDiaryByDate: getDiaryByDate,
    getDiaryItems: getDiaryItems,
    getDiaryItemById: getDiaryItemById,
    addDiaryItem: addDiaryItem,
    removeDiaryItem: removeDiaryItem,
    moveDiaryItem: moveDiaryItem,
    updateDiaryItem: updateDiaryItem,
    addDiary: addDiary,
    removeDiary: removeDiary,
    moveDiary: moveDiary,
    hasDiary: hasDiary,
    hasDiaryItems: hasDiaryItems
  }
}
