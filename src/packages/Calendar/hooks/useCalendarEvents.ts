import { ref, computed, watch, type Ref, nextTick } from 'vue'
import type { CalendarEvent } from '../types'
import { getEventsForDate, checkEventConflicts, updateEventDate, sortEvents } from '../utils/eventUtils'

export function useCalendarEvents(
  props: {
    events: Ref<CalendarEvent[]>
    enableConflictCheck?: Ref<boolean>
  },
  emit: {
    (e: 'event-add', event: CalendarEvent): void
    (e: 'event-update', event: CalendarEvent): void
    (e: 'event-delete', eventId: string): void
  }
) {
  const internalEvents = ref<CalendarEvent[]>([])
  const isUpdating = ref(false)

  // 同步外部事件到内部状态
  watch(props.events, (newEvents) => {
    if (isUpdating.value) return
    
    internalEvents.value = newEvents.map(e => ({
      ...e,
      startDate: new Date(e.startDate),
      endDate: new Date(e.endDate)
    }))
  }, { immediate: true, deep: true })

  const sortedEvents = computed(() => {
    return sortEvents(internalEvents.value)
  })

  const conflictMap = computed(() => {
    if (!props.enableConflictCheck?.value) return new Map<string, CalendarEvent[]>()
    
    const map = new Map<string, CalendarEvent[]>()
    internalEvents.value.forEach(event => {
      const result = checkEventConflicts(internalEvents.value, event)
      if (result) {
        map.set(event.id, result.conflicts)
      }
    })
    return map
  })

  function getEventsByDate(date: Date) {
    return getEventsForDate(sortedEvents.value, date)
  }

  function getEventById(id: string) {
    return internalEvents.value.find(e => e.id === id)
  }

  function addEvent(event: CalendarEvent) {
    const newEvent = {
      ...event,
      id: event.id || Date.now().toString(),
      startDate: new Date(event.startDate),
      endDate: new Date(event.endDate)
    }
    isUpdating.value = true
    internalEvents.value.push(newEvent)
    emit('event-add', newEvent)
    nextTick(() => {
      isUpdating.value = false
    })
  }

  function updateEvent(event: CalendarEvent) {
    const updatedEvent = {
      ...event,
      startDate: new Date(event.startDate),
      endDate: new Date(event.endDate)
    }
    const index = internalEvents.value.findIndex(e => e.id === event.id)
    if (index !== -1) {
      isUpdating.value = true
      internalEvents.value[index] = updatedEvent
    }
    emit('event-update', updatedEvent)
    nextTick(() => {
      isUpdating.value = false
    })
  }

  function deleteEvent(eventId: string) {
    isUpdating.value = true
    internalEvents.value = internalEvents.value.filter(e => e.id !== eventId)
    emit('event-delete', eventId)
    nextTick(() => {
      isUpdating.value = false
    })
  }

  function moveEvent(eventId: string, newDate: Date, keepDuration: boolean = true) {
    const event = getEventById(eventId)
    if (!event) return

    const newStart = new Date(newDate)
    const oldStart = new Date(event.startDate)
    
    newStart.setHours(oldStart.getHours(), oldStart.getMinutes(), oldStart.getSeconds(), oldStart.getMilliseconds())
    
    const updatedEvent = updateEventDate(event, newStart, keepDuration)
    updateEvent(updatedEvent)
  }

  function getEventConflicts(event: CalendarEvent) {
    return conflictMap.value.get(event.id) || null
  }

  function hasConflicts(event: CalendarEvent) {
    return conflictMap.value.has(event.id)
  }

  function checkNewEventConflicts(event: CalendarEvent) {
    return checkEventConflicts(internalEvents.value, event)
  }

  return {
    events: sortedEvents,
    getEventsByDate,
    getEventById,
    addEvent,
    updateEvent,
    deleteEvent,
    moveEvent,
    getEventConflicts,
    hasConflicts,
    checkNewEventConflicts
  }
}
