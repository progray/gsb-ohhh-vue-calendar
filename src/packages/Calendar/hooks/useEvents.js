import { computed } from 'vue'
import { isSameDay } from '../utils/index.js'

const DEFAULT_COLORS = [
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
  '#84CC16'
]

export function useEvents(props, emit) {
  function normalizeEventStart(event) {
    if (event.start) return event.start
    if (event.startDate) {
      const date = event.startDate
      const time = event.startTime || '00:00'
      return `${date}T${time}`
    }
    return null
  }

  function normalizeEventEnd(event) {
    if (event.end) return event.end
    if (event.endDate) {
      const date = event.endDate || event.startDate
      const time = event.endTime || '23:59'
      return `${date}T${time}`
    }
    return null
  }

  function convertEventToStandardFormat(event) {
    const start = normalizeEventStart(event)
    const end = normalizeEventEnd(event)
    return {
      ...event,
      start: start,
      end: end,
      startDate: event.startDate || (start ? new Date(start).toISOString().split('T')[0] : null),
      endDate: event.endDate || (end ? new Date(end).toISOString().split('T')[0] : null),
      startTime: event.startTime || (start ? new Date(start).toTimeString().slice(0, 5) : null),
      endTime: event.endTime || (end ? new Date(end).toTimeString().slice(0, 5) : null)
    }
  }

  const eventsMap = computed(() => {
    const map = new Map()
    if (!props.events || !Array.isArray(props.events)) {
      return map
    }
    props.events.forEach(event => {
      const normalizedEvent = convertEventToStandardFormat(event)
      if (!normalizedEvent.start) return
      const startDate = new Date(normalizedEvent.start)
      const endDate = normalizedEvent.end ? new Date(normalizedEvent.end) : null
      const key = normalizeDateKey(startDate)
      if (!map.has(key)) {
        map.set(key, [])
      }
      map.get(key).push({
        ...normalizedEvent,
        _startDate: startDate,
        _endDate: endDate,
        _key: generateEventKey(normalizedEvent)
      })
    })
    return map
  })

  function normalizeDateKey(date) {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
  }

  function generateEventKey(event) {
    if (event.id) return String(event.id)
    const start = new Date(event.start).getTime()
    return `event-${start}-${Math.random().toString(36).substr(2, 9)}`
  }

  function getEventsForDate(date) {
    const key = normalizeDateKey(new Date(date))
    return eventsMap.value.get(key) || []
  }

  function hasEventsForDate(date) {
    return getEventsForDate(date).length > 0
  }

  function detectConflicts(event) {
    if (!event.start) return []
    const eventStart = new Date(event.start)
    const eventEnd = event.end ? new Date(event.end) : null
    const key = normalizeDateKey(eventStart)
    const dayEvents = eventsMap.value.get(key) || []
    const conflicts = []

    dayEvents.forEach(existingEvent => {
      if (event.id && existingEvent.id === event.id) return
      if (!isOverlapping(eventStart, eventEnd, existingEvent._startDate, existingEvent._endDate)) return
      conflicts.push({
        event: existingEvent,
        type: 'time'
      })
    })

    return conflicts
  }

  function isOverlapping(start1, end1, start2, end2) {
    const s1 = start1.getTime()
    const e1 = end1 ? end1.getTime() : s1 + 60000
    const s2 = start2.getTime()
    const e2 = end2 ? end2.getTime() : s2 + 60000
    return s1 < e2 && s2 < e1
  }

  function convertToOutputFormat(eventData) {
    const start = eventData.start ? new Date(eventData.start) : null
    const end = eventData.end ? new Date(eventData.end) : null
    return {
      ...eventData,
      startDate: eventData.startDate || (start ? start.toISOString().split('T')[0] : null),
      endDate: eventData.endDate || (end ? end.toISOString().split('T')[0] : null),
      startTime: eventData.startTime || (start ? start.toTimeString().slice(0, 5) : null),
      endTime: eventData.endTime || (end ? end.toTimeString().slice(0, 5) : null),
      start: eventData.start,
      end: eventData.end
    }
  }

  function addEvent(eventData) {
    const newEvent = convertToOutputFormat({
      ...eventData,
      id: eventData.id || generateId()
    })
    if (!newEvent.color) {
      newEvent.color = getDefaultColor(newEvent.id)
    }
    emit('event-add', newEvent)
    return newEvent
  }

  function updateEvent(eventData) {
    if (!eventData.id) return null
    const updatedEvent = convertToOutputFormat(eventData)
    emit('event-update', updatedEvent)
    return updatedEvent
  }

  function deleteEvent(eventId) {
    if (!eventId) return false
    emit('event-delete', eventId)
    return true
  }

  function moveEvent(eventId, newDate) {
    const event = findEventById(eventId)
    if (!event) return null
    const normalizedEvent = convertEventToStandardFormat(event)
    const originalStart = new Date(normalizedEvent.start)
    const diffTime = newDate.getTime() - originalStart.getTime()
    const newStart = new Date(originalStart.getTime() + diffTime)
    const newEnd = normalizedEvent.end ? new Date(new Date(normalizedEvent.end).getTime() + diffTime) : null
    const updatedEvent = convertToOutputFormat({
      ...normalizedEvent,
      start: newStart.toISOString(),
      end: newEnd ? newEnd.toISOString() : null
    })
    emit('event-update', updatedEvent)
    return updatedEvent
  }

  function findEventById(eventId) {
    if (!props.events) return null
    return props.events.find(e => String(e.id) === String(eventId))
  }

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
  }

  function getDefaultColor(id) {
    const index = Math.abs(hashCode(String(id))) % DEFAULT_COLORS.length
    return DEFAULT_COLORS[index]
  }

  function hashCode(str) {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return hash
  }

  function getEventsBetween(startDate, endDate) {
    const events = []
    const sDate = new Date(startDate)
    const eDate = new Date(endDate)
    const current = new Date(sDate)
    while (current <= eDate) {
      const dayEvents = getEventsForDate(current)
      events.push(...dayEvents)
      current.setDate(current.getDate() + 1)
    }
    return events
  }

  function hasConflict(event) {
    return detectConflicts(event).length > 0
  }

  function searchEvents(keyword) {
    if (!keyword || !keyword.trim() || !props.events) {
      return []
    }
    const lowerKeyword = keyword.trim().toLowerCase()
    return props.events.filter(event => {
      const normalizedEvent = convertEventToStandardFormat(event)
      const titleMatch = normalizedEvent.title && normalizedEvent.title.toLowerCase().includes(lowerKeyword)
      const descMatch = normalizedEvent.description && normalizedEvent.description.toLowerCase().includes(lowerKeyword)
      return titleMatch || descMatch
    }).map(event => convertEventToStandardFormat(event))
  }

  function getAllEvents() {
    if (!props.events) return []
    return props.events.map(event => convertEventToStandardFormat(event))
  }

  return {
    eventsMap,
    getEventsForDate,
    hasEventsForDate,
    detectConflicts,
    hasConflict,
    addEvent,
    updateEvent,
    deleteEvent,
    moveEvent,
    findEventById,
    getEventsBetween,
    searchEvents,
    getAllEvents
  }
}
