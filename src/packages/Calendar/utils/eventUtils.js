import { isSameDay } from './index.js'

export class CalendarEvent {
  constructor(event) {
    this.id = event.id || generateId()
    this.title = event.title || ''
    this.startDate = event.startDate ? new Date(event.startDate) : new Date()
    this.endDate = event.endDate ? new Date(event.endDate) : new Date()
    this.color = event.color || '#409eff'
    this.description = event.description || ''
    this.allDay = event.allDay || false
    this.createdAt = event.createdAt || new Date()
    this.updatedAt = event.updatedAt || new Date()
  }
}

function generateId() {
  return 'event_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}

export function getEventsByDate(events, date) {
  return events.filter(event => {
    const eventStart = new Date(event.startDate)
    const eventEnd = new Date(event.endDate)
    const targetDate = new Date(date)
    
    eventStart.setHours(0, 0, 0, 0)
    eventEnd.setHours(23, 59, 59, 999)
    targetDate.setHours(0, 0, 0, 0)
    
    return targetDate >= eventStart && targetDate <= eventEnd
  })
}

export function checkEventConflict(events, newEvent, excludeId = null) {
  const newStart = new Date(newEvent.startDate).getTime()
  const newEnd = new Date(newEvent.endDate).getTime()
  
  return events.filter(event => {
    if (excludeId && event.id === excludeId) return false
    
    const eventStart = new Date(event.startDate).getTime()
    const eventEnd = new Date(event.endDate).getTime()
    
    return (newStart < eventEnd && newEnd > eventStart)
  })
}

export function validateEvent(event) {
  const errors = []
  
  if (!event.title || !event.title.trim()) {
    errors.push('事件标题不能为空')
  }
  
  if (!event.startDate) {
    errors.push('开始日期不能为空')
  }
  
  if (!event.endDate) {
    errors.push('结束日期不能为空')
  }
  
  if (event.startDate && event.endDate) {
    const start = new Date(event.startDate)
    const end = new Date(event.endDate)
    
    if (start > end) {
      errors.push('结束日期不能早于开始日期')
    }
  }
  
  return errors
}

export function formatEventTime(date) {
  const d = new Date(date)
  const hours = d.getHours().toString().padStart(2, '0')
  const minutes = d.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

export function isSameEvent(event1, event2) {
  return event1.id === event2.id
}

export function cloneEvent(event) {
  return new CalendarEvent({ ...event })
}
