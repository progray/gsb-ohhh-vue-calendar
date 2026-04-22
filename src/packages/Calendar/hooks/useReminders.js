import { ref, computed, onUnmounted } from 'vue'
import { isSameDay } from '../utils/index.js'

const STORAGE_KEY = 'ohhh-vue-calendar-reminders'

function loadReminders() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (data) {
      const parsed = JSON.parse(data)
      return parsed.map(item => ({
        ...item,
        triggerTime: new Date(item.triggerTime)
      }))
    }
  } catch (e) {
    console.error('Failed to load reminders:', e)
  }
  return []
}

function saveReminders(reminders) {
  try {
    const data = JSON.stringify(reminders.map(item => ({
      ...item,
      triggerTime: item.triggerTime.toISOString()
    })))
    localStorage.setItem(STORAGE_KEY, data)
  } catch (e) {
    console.error('Failed to save reminders:', e)
  }
}

function formatDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function useReminders() {
  const reminders = ref(loadReminders())
  const triggeredReminders = ref([])
  let timerInterval = null

  const pendingReminders = computed(() => {
    const now = new Date()
    return reminders.value
      .filter(r => r.triggerTime > now)
      .sort((a, b) => a.triggerTime.getTime() - b.triggerTime.getTime())
  })

  const hasPendingReminders = computed(() => pendingReminders.value.length > 0)

  function getReminderByDate(date) {
    return reminders.value.find(r => isSameDay(r.triggerTime, date))
  }

  function isValidTriggerTime(time) {
    return time > new Date()
  }

  function addReminder(date, triggerTime, color) {
    if (!isValidTriggerTime(triggerTime)) {
      return { success: false, message: '不能设置过去的时间' }
    }

    const dateKey = formatDateKey(date)
    
    const existingIndex = reminders.value.findIndex(r => formatDateKey(r.triggerTime) === dateKey)
    
    const reminder = {
      id: existingIndex >= 0 ? reminders.value[existingIndex].id : Date.now().toString(),
      triggerTime: new Date(triggerTime),
      color: color || '#ff6b6b'
    }

    if (existingIndex >= 0) {
      reminders.value[existingIndex] = reminder
    } else {
      reminders.value.push(reminder)
    }

    saveReminders(reminders.value)
    return { success: true, reminder }
  }

  function removeReminder(date) {
    const dateKey = formatDateKey(date)
    const index = reminders.value.findIndex(r => formatDateKey(r.triggerTime) === dateKey)
    
    if (index >= 0) {
      reminders.value.splice(index, 1)
      saveReminders(reminders.value)
      return { success: true }
    }
    return { success: false, message: '未找到该日期的提醒' }
  }

  function removeTriggeredReminder(id) {
    const index = triggeredReminders.value.findIndex(r => r.id === id)
    if (index >= 0) {
      triggeredReminders.value.splice(index, 1)
    }
  }

  function getReminderState(reminder) {
    if (!reminder) return null
    
    const now = new Date()
    const diffMs = reminder.triggerTime.getTime() - now.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)
    const diffMinutes = diffMs / (1000 * 60)

    let state = 'far'
    let progress = 0

    if (diffHours > 24) {
      state = 'far'
      progress = 0
    } else if (diffMinutes > 1) {
      state = 'near'
      progress = 0
    } else if (diffMinutes <= 1 && diffMinutes > 0) {
      state = 'urgent'
      progress = 100 - (diffMinutes * 100)
    } else {
      state = 'triggered'
      progress = 100
    }

    return {
      state,
      progress,
      diffMs,
      diffMinutes,
      diffHours
    }
  }

  function formatCountdown(diffMs) {
    if (diffMs <= 0) return '00:00:00'
    
    const seconds = Math.floor(diffMs / 1000)
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    return [
      String(hours).padStart(2, '0'),
      String(minutes).padStart(2, '0'),
      String(secs).padStart(2, '0')
    ].join(':')
  }

  function formatTriggerTime(time) {
    const year = time.getFullYear()
    const month = String(time.getMonth() + 1).padStart(2, '0')
    const day = String(time.getDate()).padStart(2, '0')
    const hours = String(time.getHours()).padStart(2, '0')
    const minutes = String(time.getMinutes()).padStart(2, '0')
    const seconds = String(time.getSeconds()).padStart(2, '0')
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
  }

  function checkAndTrigger() {
    const now = new Date()
    const toRemove = []

    for (let i = reminders.value.length - 1; i >= 0; i--) {
      const reminder = reminders.value[i]
      if (reminder.triggerTime <= now) {
        triggeredReminders.value.unshift({
          ...reminder,
          triggeredAt: now
        })
        toRemove.push(i)
      }
    }

    if (toRemove.length > 0) {
      toRemove.forEach(index => reminders.value.splice(index, 1))
      saveReminders(reminders.value)
    }
  }

  function startTimer() {
    if (timerInterval) return
    
    timerInterval = setInterval(() => {
      checkAndTrigger()
    }, 1000)
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }
  }

  startTimer()

  onUnmounted(() => {
    stopTimer()
  })

  return {
    reminders,
    pendingReminders,
    triggeredReminders,
    hasPendingReminders,
    getReminderByDate,
    isValidTriggerTime,
    addReminder,
    removeReminder,
    removeTriggeredReminder,
    getReminderState,
    formatCountdown,
    formatTriggerTime,
    startTimer,
    stopTimer
  }
}
