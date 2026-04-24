const STORAGE_KEY = 'sleep-calendar-data'

function formatDateKey(date) {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function loadSleepData() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : {}
  } catch (e) {
    console.error('Failed to load sleep data:', e)
    return {}
  }
}

function saveSleepData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.error('Failed to save sleep data:', e)
  }
}

function getSleepRating(date) {
  const data = loadSleepData()
  const key = formatDateKey(date)
  return data[key] ?? null
}

function setSleepRating(date, rating) {
  const data = loadSleepData()
  const key = formatDateKey(date)
  if (rating === null || rating === undefined) {
    delete data[key]
  } else {
    data[key] = Math.max(1, Math.min(5, rating))
  }
  saveSleepData(data)
}

function getMonthSleepData(year, month) {
  const data = loadSleepData()
  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`
  const result = {}
  
  for (const [key, rating] of Object.entries(data)) {
    if (key.startsWith(monthPrefix)) {
      result[key] = rating
    }
  }
  
  return result
}

function calculateMonthAverage(year, month) {
  const monthData = getMonthSleepData(year, month)
  const ratings = Object.values(monthData)
  
  if (ratings.length === 0) return null
  
  const sum = ratings.reduce((a, b) => a + b, 0)
  return sum / ratings.length
}

function getSortedMonthRatings(year, month) {
  const monthData = getMonthSleepData(year, month)
  const entries = Object.entries(monthData)
  
  entries.sort((a, b) => a[0].localeCompare(b[0]))
  
  return entries.map(([_, rating]) => rating)
}

export {
  formatDateKey,
  loadSleepData,
  saveSleepData,
  getSleepRating,
  setSleepRating,
  getMonthSleepData,
  calculateMonthAverage,
  getSortedMonthRatings
}
