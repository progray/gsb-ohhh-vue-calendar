import { computed, unref } from 'vue'
import {
  normalizeEvent,
  findConflicts,
  createEventId
} from '../utils/eventUtils.js'

export function useEvents(props, emit) {
  const normalizedEvents = computed(() => {
    const eventsArray = unref(props.events) || []
    return eventsArray.map(normalizeEvent)
  })

  const eventsByDateMap = computed(() => {
    const map = new Map()
    for (const event of normalizedEvents.value) {
      const dateKey = _getDateKey(event.date)
      if (!map.has(dateKey)) {
        map.set(dateKey, [])
      }
      map.get(dateKey).push(event)
    }
    for (const [, events] of map) {
      events.sort((a, b) => {
        const timeA = a.startTime ? _parseTimeToMinutes(a.startTime) : 0
        const timeB = b.startTime ? _parseTimeToMinutes(b.startTime) : 0
        return timeA - timeB
      })
    }
    return map
  })

  function _getDateKey(date) {
    const d = date instanceof Date ? date : new Date(date)
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
  }

  function _parseTimeToMinutes(timeStr) {
    if (!timeStr) return 0
    const [hours, minutes] = timeStr.split(':').map(Number)
    return hours * 60 + minutes
  }

  function getEventsByDate(date) {
    const dateKey = _getDateKey(date)
    return eventsByDateMap.value.get(dateKey) || []
  }

  function addEvent(eventData) {
    const event = normalizeEvent({
      ...eventData,
      id: eventData.id || createEventId()
    })
    const conflicts = findConflicts(event, normalizedEvents.value)
    emit('event-add', {
      event: { ...event },
      conflicts: conflicts.length > 0 ? conflicts : undefined
    })
    return event
  }

  function updateEvent(eventId, eventData) {
    const originalEvent = normalizedEvents.value.find(e => e.id === eventId)
    if (!originalEvent) return null
    
    const updatedEvent = normalizeEvent({
      ...originalEvent,
      ...eventData,
      id: eventId
    })
    const otherEvents = normalizedEvents.value.filter(e => e.id !== eventId)
    const conflicts = findConflicts(updatedEvent, otherEvents)
    
    emit('event-update', {
      event: { ...updatedEvent },
      conflicts: conflicts.length > 0 ? conflicts : undefined
    })
    return updatedEvent
  }

  function deleteEvent(eventId) {
    const event = normalizedEvents.value.find(e => e.id === eventId)
    if (!event) return null
    
    emit('event-delete', { event: { ...event } })
    return event
  }

  function getEventById(eventId) {
    return normalizedEvents.value.find(e => e.id === eventId) || null
  }

  function moveEvent(eventId, newDate) {
    const event = getEventById(eventId)
    if (!event) return null
    return updateEvent(eventId, { date: newDate })
  }

  function checkConflicts(eventData) {
    const event = normalizeEvent(eventData)
    return findConflicts(event, normalizedEvents.value)
  }

  return {
    events: normalizedEvents,
    eventsByDateMap,
    getEventsByDate,
    addEvent,
    updateEvent,
    deleteEvent,
    getEventById,
    moveEvent,
    checkConflicts
  }
}
