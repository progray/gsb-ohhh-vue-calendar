import { isSameDay } from './index.js'

export const TIME_CAPSULE_STORAGE_KEY = 'time-capsule-data'
export const MAX_CONTENT_LENGTH = 200

export const CapsuleStatus = {
  LOCKED: 'locked',
  UNLOCKED: 'unlocked',
  EXPIRED: 'expired'
}

export function formatDateKey(date) {
  if (!(date instanceof Date)) {
    date = new Date(date)
  }
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
}

export function parseDateKey(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function getToday() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

export function isPastDate(date) {
  if (!date) return false
  const today = getToday()
  const targetDate = date instanceof Date ? date : parseDateKey(date)
  targetDate.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)
  return targetDate < today
}

export function isFutureDate(date) {
  if (!date) return false
  const today = getToday()
  const targetDate = date instanceof Date ? date : parseDateKey(date)
  targetDate.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)
  return targetDate > today
}

export function isToday(date) {
  if (!date) return false
  const today = getToday()
  const targetDate = date instanceof Date ? date : parseDateKey(date)
  return isSameDay(targetDate, today)
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
  const now = new Date()
  const targetDate = date instanceof Date ? date : parseDateKey(date)
  
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
  if (content.length > MAX_CONTENT_LENGTH) {
    throw new Error(`内容不能超过 ${MAX_CONTENT_LENGTH} 字`)
  }
  
  const dateKey = formatDateKey(date)
  const storageData = loadAllCapsules()
  
  storageData[dateKey] = {
    date: dateKey,
    content,
    createdAt: new Date().toISOString(),
    scratchProgress: 0
  }
  
  localStorage.setItem(TIME_CAPSULE_STORAGE_KEY, JSON.stringify(storageData))
  return storageData[dateKey]
}

export function loadCapsule(date) {
  const dateKey = formatDateKey(date)
  const storageData = loadAllCapsules()
  return storageData[dateKey] || null
}

export function loadAllCapsules() {
  const data = localStorage.getItem(TIME_CAPSULE_STORAGE_KEY)
  try {
    return data ? JSON.parse(data) : {}
  } catch (e) {
    console.error('解析时光胶囊数据失败:', e)
    return {}
  }
}

export function deleteCapsule(date) {
  const dateKey = formatDateKey(date)
  const storageData = loadAllCapsules()
  
  if (storageData[dateKey]) {
    delete storageData[dateKey]
    localStorage.setItem(TIME_CAPSULE_STORAGE_KEY, JSON.stringify(storageData))
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
  return deletedCount
}

export function updateScratchProgress(date, progress) {
  const dateKey = formatDateKey(date)
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
