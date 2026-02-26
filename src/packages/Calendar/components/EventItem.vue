<template>
  <div
    class="ohhh-calendar-event"
    :class="{
      'has-conflict': hasConflict,
      'is-dragging': isDragging
    }"
    :style="eventStyle"
    draggable="true"
    @dragstart="onDragStart"
    @dragend="onDragEnd"
    @click.stop="onClick"
  >
    <span class="ohhh-calendar-event--title">{{ event.title }}</span>
    <span v-if="event.startTime" class="ohhh-calendar-event--time">
      {{ event.startTime }}{{ event.endTime ? `-${event.endTime}` : '' }}
    </span>
    <div v-if="hasConflict" class="ohhh-calendar-event--conflict-badge">!</div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { getEventColor } from '../utils/eventUtils.js'

const props = defineProps({
  event: {
    type: Object,
    required: true
  },
  hasConflict: {
    type: Boolean,
    default: false
  },
  maxVisible: {
    type: Number,
    default: 3
  }
})

const emit = defineEmits(['event-click', 'event-drag-start', 'event-drag-end'])

const isDragging = ref(false)

const eventStyle = computed(() => ({
  '--event-color': getEventColor(props.event.color)
}))

function onDragStart(e) {
  isDragging.value = true
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('application/json', JSON.stringify({
    eventId: props.event.id,
    event: props.event
  }))
  e.dataTransfer.setData('text/plain', props.event.id)
  emit('event-drag-start', { event: props.event, nativeEvent: e })
}

function onDragEnd(e) {
  isDragging.value = false
  emit('event-drag-end', { event: props.event, nativeEvent: e })
}

function onClick(e) {
  emit('event-click', { event: props.event, nativeEvent: e })
}
</script>
