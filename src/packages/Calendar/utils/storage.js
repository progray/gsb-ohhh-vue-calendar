const STORAGE_KEY = 'ohhh-vue-calendar-diary'

export function formatDateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function getDiaryData() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : {}
  } catch (e) {
    console.error('Failed to parse diary data:', e)
    return {}
  }
}

export function setDiaryData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.error('Failed to save diary data:', e)
  }
}

export function saveDiary(date, content) {
  const data = getDiaryData()
  const dateKey = formatDateKey(date)
  data[dateKey] = {
    content,
    updatedAt: Date.now()
  }
  setDiaryData(data)
  return data[dateKey]
}

export function getDiary(date) {
  const data = getDiaryData()
  const dateKey = formatDateKey(date)
  return data[dateKey] || null
}

export function deleteDiary(date) {
  const data = getDiaryData()
  const dateKey = formatDateKey(date)
  delete data[dateKey]
  setDiaryData(data)
}

export function getMonthDiaries(year, month) {
  const data = getDiaryData()
  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`
  const monthDiaries = {}
  
  for (const [dateKey, diary] of Object.entries(data)) {
    if (dateKey.startsWith(monthPrefix)) {
      monthDiaries[dateKey] = diary
    }
  }
  
  return monthDiaries
}

export function getMonthDiaryCount(year, month) {
  const monthDiaries = getMonthDiaries(year, month)
  return Object.keys(monthDiaries).length
}
