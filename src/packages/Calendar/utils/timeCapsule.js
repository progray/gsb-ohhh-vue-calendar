import { isSameDay } from './index.js'

export const TIME_CAPSULE_STORAGE_KEY = 'time-capsule-data'
export const MAX_CONTENT_LENGTH = 200

export const CapsuleStatus = {
  LOCKED: 'locked',
  UNLOCKED: 'unlocked',
  EXPIRED: 'expired'
}

export function formatDateKey(date) {
  if (!date) {
    console.error('formatDateKey: date is null or undefined')
    return null
  }
  
  let d
  if (date instanceof Date) {
    d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  } else {
    d = new Date(date)
    if (isNaN(d.getTime())) {
      console.error('formatDateKey: invalid date', date)
      return null
    }
    d = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  }
  
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  
  return `${year}-${month}-${day}`
}

export function parseDateKey(dateKey) {
  if (!dateKey) {
    console.error('parseDateKey: dateKey is null or undefined')
    return null
  }
  
  const parts = dateKey.split('-')
  if (parts.length !== 3) {
    console.error('parseDateKey: invalid dateKey format', dateKey)
    return null
  }
  
  const [year, month, day] = parts.map(Number)
  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    console.error('parseDateKey: invalid dateKey values', dateKey)
    return null
  }
  
  return new Date(year, month - 1, day)
}

export function getToday() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

function _normalizeDate(date) {
  if (!date) return null
  
  if (date instanceof Date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate())
  }
  
  const parsed = parseDateKey(date)
  return parsed
}

export function isPastDate(date) {
  const targetDate = _normalizeDate(date)
  if (!targetDate) return false
  
  const today = getToday()
  return targetDate.getTime() < today.getTime()
}

export function isFutureDate(date) {
  const targetDate = _normalizeDate(date)
  if (!targetDate) return false
  
  const today = getToday()
  return targetDate.getTime() > today.getTime()
}

export function isToday(date) {
  const targetDate = _normalizeDate(date)
  if (!targetDate) return false
  
  const today = getToday()
  return targetDate.getTime() === today.getTime()
}

export function getCapsuleStatus(date) {
  if (isPastDate(date)) {
    return CapsuleStatus.EXPIRED
  }
  if (isFutureDate(date)) {
    return CapsuleStatus.LOCKED
  }
  return CapsuleStatus.UNLOCKED
}

export function calculateTimeLeft(date) {
  const targetDate = _normalizeDate(date)
  if (!targetDate) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      total: 0
    }
  }
  
  const now = new Date()
  targetDate.setHours(0, 0, 0, 0)
  
  if (isPastDate(targetDate)) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      total: 0
    }
  }
  
  const diff = targetDate.getTime() - now.getTime()
  
  if (diff <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      total: 0
    }
  }
  
  const totalSeconds = Math.floor(diff / 1000)
  const days = Math.floor(totalSeconds / (24 * 60 * 60))
  const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60))
  const minutes = Math.floor((totalSeconds % (60 * 60)) / 60)
  const seconds = totalSeconds % 60
  
  return {
    days,
    hours,
    minutes,
    seconds,
    total: totalSeconds
  }
}

export function saveCapsule(date, content) {
  if (!content || content.length === 0) {
    throw new Error('内容不能为空')
  }
  
  if (content.length > MAX_CONTENT_LENGTH) {
    throw new Error(`内容不能超过 ${MAX_CONTENT_LENGTH} 字`)
  }
  
  const dateKey = formatDateKey(date)
  if (!dateKey) {
    throw new Error('无效的日期')
  }
  
  const storageData = loadAllCapsules()
  
  storageData[dateKey] = {
    dateKey: dateKey,
    date: dateKey,
    content,
    createdAt: new Date().toISOString(),
    scratchProgress: 0
  }
  
  localStorage.setItem(TIME_CAPSULE_STORAGE_KEY, JSON.stringify(storageData))
  
  console.log('saveCapsule: saved capsule for dateKey', dateKey)
  
  return storageData[dateKey]
}

export function loadCapsule(date) {
  const dateKey = formatDateKey(date)
  if (!dateKey) {
    console.error('loadCapsule: invalid date', date)
    return null
  }
  
  const storageData = loadAllCapsules()
  const result = storageData[dateKey] || null
  
  console.log('loadCapsule: dateKey', dateKey, 'result:', result)
  
  return result
}

export function loadAllCapsules() {
  const data = localStorage.getItem(TIME_CAPSULE_STORAGE_KEY)
  try {
    const result = data ? JSON.parse(data) : {}
    console.log('loadAllCapsules: loaded', Object.keys(result).length, 'capsules')
    return result
  } catch (e) {
    console.error('解析时光胶囊数据失败:', e)
    return {}
  }
}

export function deleteCapsule(date) {
  const dateKey = formatDateKey(date)
  if (!dateKey) {
    return false
  }
  
  const storageData = loadAllCapsules()
  
  if (storageData[dateKey]) {
    delete storageData[dateKey]
    localStorage.setItem(TIME_CAPSULE_STORAGE_KEY, JSON.stringify(storageData))
    console.log('deleteCapsule: deleted capsule for dateKey', dateKey)
    return true
  }
  return false
}

export function deleteAllExpiredCapsules() {
  const storageData = loadAllCapsules()
  const keys = Object.keys(storageData)
  let deletedCount = 0
  
  for (const key of keys) {
    if (isPastDate(key)) {
      delete storageData[key]
      deletedCount++
    }
  }
  
  localStorage.setItem(TIME_CAPSULE_STORAGE_KEY, JSON.stringify(storageData))
  console.log('deleteAllExpiredCapsules: deleted', deletedCount, 'expired capsules')
  return deletedCount
}

export function updateScratchProgress(date, progress) {
  const dateKey = formatDateKey(date)
  if (!dateKey) {
    return null
  }
  
  const storageData = loadAllCapsules()
  
  if (storageData[dateKey]) {
    storageData[dateKey].scratchProgress = Math.min(Math.max(progress, 0), 100)
    localStorage.setItem(TIME_CAPSULE_STORAGE_KEY, JSON.stringify(storageData))
    return storageData[dateKey]
  }
  return null
}

export function hasCapsule(date) {
  return loadCapsule(date) !== null
}

export function getDatesWithCapsules() {
  const storageData = loadAllCapsules()
  return Object.keys(storageData).map(key => ({
    date: parseDateKey(key),
    capsule: storageData[key]
  }))
}
