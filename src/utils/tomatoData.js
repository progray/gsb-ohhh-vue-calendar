const STORAGE_KEY = 'tomato-calendar-data'

function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getStoredData() {
  const data = localStorage.getItem(STORAGE_KEY)
  return data ? JSON.parse(data) : {}
}

function setStoredData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function getTomatoesForDate(date) {
  const data = getStoredData()
  const dateKey = formatDate(date)
  return data[dateKey] || 0
}

export function addTomatoForDate(date) {
  const data = getStoredData()
  const dateKey = formatDate(date)
  data[dateKey] = (data[dateKey] || 0) + 1
  setStoredData(data)
  return data[dateKey]
}

export function getMonthTomatoes(year, month) {
  const data = getStoredData()
  const monthPrefix = `${year}-${String(month).padStart(2, '0')}`
  const monthData = {}
  let total = 0
  
  for (const [dateKey, count] of Object.entries(data)) {
    if (dateKey.startsWith(monthPrefix)) {
      monthData[dateKey] = count
      total += count
    }
  }
  
  return {
    tomatoes: monthData,
    total,
    days: Object.keys(monthData).length
  }
}

export function generateSampleDataForCurrentMonth() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const lastDay = new Date(year, month + 1, 0).getDate()
  const data = getStoredData()
  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`
  
  const hasExistingData = Object.keys(data).some(key => key.startsWith(monthPrefix))
  
  if (!hasExistingData) {
    for (let day = 1; day <= lastDay; day++) {
      const dateKey = `${monthPrefix}-${String(day).padStart(2, '0')}`
      data[dateKey] = Math.floor(Math.random() * 5) + 1
    }
    setStoredData(data)
  }
}

export function clearAllData() {
  localStorage.removeItem(STORAGE_KEY)
}
