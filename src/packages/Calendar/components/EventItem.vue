<template>
  <div
    class="calendar-event"
    :style="{
      '--event-color': event.color || EVENT_COLORS_MAP.blue
    }"
    :class="{
      'is-start': isStart,
      'is-end': isEnd,
      'is-dragging': isDragging,
      'is-multi-day': isMultiDay,
      'is-all-day': event.allDay
    }"
    draggable="true"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
    @click.stop="handleClick"
  >
    <div class="calendar-event-dot" v-if="!isMultiDay"></div>
    <span class="calendar-event-title" :title="event.title">
      <span v-if="isStart && showTime && !event.allDay" class="calendar-event-time">
        {{ formatEventTime(event.startDate) }}
      </span>
      {{ event.title }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { CalendarEvent } from '../types'
import { EVENT_COLORS } from '../types'
import { formatEventTime } from '../utils/eventUtils'
import { isSameDay } from '../utils'

const props = defineProps<{
  event: CalendarEvent
  date?: Date
  showTime?: boolean
  isStart?: boolean
  isEnd?: boolean
  isMultiDay?: boolean
}>()

const emit = defineEmits<{
  click: [event: CalendarEvent]
  eventDragStart: [event: CalendarEvent, dragEvent: DragEvent]
  eventDragEnd: [event: CalendarEvent]
}>()

const EVENT_COLORS_MAP = EVENT_COLORS

const isStart = computed(() => {
  if (props.isStart !== undefined) return props.isStart
  return props.date ? isSameDay(new Date(props.event.startDate), props.date) : true
})

const isEnd = computed(() => {
  if (props.isEnd !== undefined) return props.isEnd
  return props.date ? isSameDay(new Date(props.event.endDate), props.date) : true
})

const isMultiDay = computed(() => {
  if (props.isMultiDay !== undefined) return props.isMultiDay
  const start = new Date(props.event.startDate)
  const end = new Date(props.event.endDate)
  start.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1 > 1
})

const isDragging = ref(false)

function handleDragStart(dragEvent: DragEvent) {
  isDragging.value = true
  dragEvent.dataTransfer?.setData('text/plain', props.event.id)
  dragEvent.dataTransfer!.effectAllowed = 'move'
  emit('eventDragStart', props.event, dragEvent)
}

function handleDragEnd() {
  isDragging.value = false
  emit('eventDragEnd', props.event)
}

function handleClick(e: MouseEvent) {
  e.stopPropagation()
  emit('click', props.event)
}
</script>

<style scoped>
.calendar-event {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 100%;
  min-height: 20px;
  padding: 2px 6px;
  font-size: 11px;
  line-height: 1.3;
  color: #fff;
  background: var(--event-color);
  border-radius: 3px;
  cursor: pointer;
  overflow: hidden;
  transition: opacity 0.2s, transform 0.2s;
  position: relative;
  z-index: 1;
  box-sizing: border-box;
}

.calendar-event:hover {
  filter: brightness(1.05);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  z-index: 10;
}

.calendar-event.is-dragging {
  opacity: 0.5;
}



.calendar-event.is-multi-day:not(.is-start) {
  margin-left: 0;
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}

.calendar-event.is-multi-day:not(.is-end) {
  margin-right: 0;
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.calendar-event-dot {
  flex: none;
  width: 4px;
  height: 4px;
  background: currentColor;
  border-radius: 50%;
  opacity: 0.8;
}

.calendar-event-title {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.calendar-event-time {
  flex: none;
  opacity: 0.9;
  font-size: 10px;
}

.calendar-event.is-multi-day .calendar-event-time {
  display: none;
}
</style>
