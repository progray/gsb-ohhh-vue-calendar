<template>
  <div
    class="ohhh-calendar-event"
    :class="{ 'has-conflict': event._hasConflict }"
    :style="{ '--event-color': event.color || '#3B82F6' }"
    :draggable="draggable"
    @dragstart="onDragStart"
    @dragend="onDragEnd"
    @click.stop="onClick"
    :title="event.title || '无标题'"
  >
    <div class="ohhh-calendar-event--dot"></div>
    <span class="ohhh-calendar-event--title">{{ event.title || '无标题' }}</span>
  </div>
</template>

<script setup>
const props = defineProps({
  event: {
    type: Object,
    required: true
  },
  draggable: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['drag-start', 'drag-end', 'click'])

function onDragStart(e) {
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('text/plain', JSON.stringify({
    eventId: props.event.id,
    event: props.event
  }))
  e.target.classList.add('is-dragging')
  emit('drag-start', props.event)
}

function onDragEnd(e) {
  e.target.classList.remove('is-dragging')
  emit('drag-end', props.event)
}

function onClick(e) {
  emit('click', props.event, e)
}
</script>
