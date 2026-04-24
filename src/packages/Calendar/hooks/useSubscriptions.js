import { ref, computed, watch } from 'vue'
import { parseICSFile, formatDateKey, isSameDay, getAllDatesInRange } from '../utils/icsParser.js'
import { getColorByIndex, EVENT_COLORS } from '../utils/colorPalette.js'

export function useCalendarSubscriptions() {
  const subscriptions = ref([])
  const nextSubscriptionId = ref(1)
  const fileInputRef = ref(null)

  const allEvents = computed(() => {
    const events = []
    subscriptions.value.forEach(sub => {
      sub.events.forEach(event => {
        events.push({
          ...event,
          subscriptionId: sub.id,
          subscriptionName: sub.name,
          color: sub.color
        })
      })
    })
    return events
  })

  const eventsByDate = computed(() => {
    const map = new Map()
    allEvents.value.forEach(event => {
      event.dateKeys.forEach(dateKey => {
        if (!map.has(dateKey)) {
          map.set(dateKey, [])
        }
        const existingEvents = map.get(dateKey)
        const exists = existingEvents.some(e => e.uid === event.uid && e.subscriptionId === event.subscriptionId)
        if (!exists) {
          const isStart = event.startDateKey === dateKey
          const isEnd = event.endDateKey === dateKey
          existingEvents.push({
            ...event,
            isStart,
            isEnd,
            isContinuation: !isStart && !isEnd
          })
        }
      })
    })
    return map
  })

  const subscriptionColorMap = computed(() => {
    const map = new Map()
    subscriptions.value.forEach(sub => {
      map.set(sub.id, sub.color)
    })
    return map
  })

  const getEventsForDate = (date) => {
    const dateKey = formatDateKey(date)
    const events = eventsByDate.value.get(dateKey) || []
    return [...events].sort((a, b) => {
      if (a.isAllDay && !b.isAllDay) return -1
      if (!a.isAllDay && b.isAllDay) return 1
      return a.startDate - b.startDate
    })
  }

  const getEventColorBarsForDate = (date) => {
    const events = getEventsForDate(date)
    const colorBars = []
    
    events.forEach(event => {
      colorBars.push({
        color: event.color,
        subscriptionId: event.subscriptionId,
        subscriptionName: event.subscriptionName,
        isContinuation: event.isContinuation,
        isStart: event.isStart,
        isEnd: event.isEnd,
        isMultiDay: event.isMultiDay,
        eventTitle: event.title,
        event: event
      })
    })

    return colorBars.sort((a, b) => {
      if (a.isMultiDay && !b.isMultiDay) return -1
      if (!a.isMultiDay && b.isMultiDay) return 1
      return a.subscriptionId - b.subscriptionId
    })
  }

  const importICSFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const content = e.target.result
          const parsed = parseICSFile(content)
          
          const existingIndex = subscriptions.value.findIndex(s => s.name === parsed.name)
          
          if (existingIndex >= 0) {
            const existing = subscriptions.value[existingIndex]
            const mergedEvents = [...existing.events]
            
            parsed.events.forEach(newEvent => {
              const exists = mergedEvents.some(e => e.uid === newEvent.uid)
              if (!exists) {
                mergedEvents.push(newEvent)
              }
            })
            
            subscriptions.value[existingIndex] = {
              ...existing,
              events: mergedEvents,
              eventCount: mergedEvents.length
            }
          } else {
            const newSubscription = {
              id: nextSubscriptionId.value++,
              name: parsed.name,
              fileName: file.name,
              color: getColorByIndex(subscriptions.value.length),
              events: parsed.events,
              eventCount: parsed.eventCount
            }
            subscriptions.value.push(newSubscription)
          }
          
          resolve()
        } catch (error) {
          reject(error)
        }
      }
      reader.onerror = () => reject(new Error('读取文件失败'))
      reader.readAsText(file)
    })
  }

  const importICSFiles = async (files) => {
    const errors = []
    for (const file of files) {
      try {
        await importICSFile(file)
      } catch (error) {
        errors.push({ file: file.name, error: error.message })
      }
    }
    return errors
  }

  const updateSubscriptionName = (id, name) => {
    const sub = subscriptions.value.find(s => s.id === id)
    if (sub) {
      sub.name = name || '未命名日历'
    }
  }

  const updateSubscriptionColor = (id, color) => {
    const sub = subscriptions.value.find(s => s.id === id)
    if (sub) {
      sub.color = color
    }
  }

  const deleteSubscription = (id) => {
    const index = subscriptions.value.findIndex(s => s.id === id)
    if (index >= 0) {
      subscriptions.value.splice(index, 1)
    }
  }

  const clearAllSubscriptions = () => {
    subscriptions.value = []
  }

  const getAvailableColors = () => {
    return EVENT_COLORS
  }

  const triggerFileInput = () => {
    if (fileInputRef.value) {
      fileInputRef.value.click()
    }
  }

  return {
    subscriptions,
    allEvents,
    eventsByDate,
    subscriptionColorMap,
    fileInputRef,
    getEventsForDate,
    getEventColorBarsForDate,
    importICSFile,
    importICSFiles,
    updateSubscriptionName,
    updateSubscriptionColor,
    deleteSubscription,
    clearAllSubscriptions,
    getAvailableColors,
    triggerFileInput
  }
}
