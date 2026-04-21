<template>
  <div
    class="flip-card-container"
    :class="{
      'is-flipped': isFlipped,
      'is-selected': isSelected,
      'is-today': isToday,
      'other-month': !isCurrentMonth,
      'has-day-content': dayContent,
      'has-night-content': nightContent
    }"
    @click="handleClick"
  >
    <div class="flip-card">
      <div class="flip-card-face flip-card-front">
        <div class="flip-card-inner">
          <div class="flip-card-date">{{ dateObj.fullDate.date }}</div>
          <div v-if="dayContent" class="flip-card-preview">
            <div class="flip-card-preview-text">{{ dayContent.content || '' }}</div>
            <div v-if="dayContent.tags && dayContent.tags.length > 0" class="flip-card-tags">
              <span
                v-for="tag in dayContent.tags.slice(0, 2)"
                :key="tag"
                class="flip-card-tag"
              >{{ tag }}</span>
            </div>
          </div>
        </div>
        <div class="flip-card-indicator day-indicator" v-if="dayContent"></div>
      </div>
      <div class="flip-card-face flip-card-back">
        <div class="flip-card-inner">
          <div class="flip-card-date">{{ dateObj.fullDate.date }}</div>
          <div v-if="nightContent" class="flip-card-preview">
            <div class="flip-card-preview-text">{{ nightContent.content || '' }}</div>
            <div v-if="nightContent.tags && nightContent.tags.length > 0" class="flip-card-tags">
              <span
                v-for="tag in nightContent.tags.slice(0, 2)"
                :key="tag"
                class="flip-card-tag"
              >{{ tag }}</span>
            </div>
          </div>
        </div>
        <div class="flip-card-indicator night-indicator" v-if="nightContent"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { isSameDay } from '../utils/index.js'

const props = defineProps({
  dateObj: {
    type: Object,
    required: true
  },
  selectedDate: {
    type: Date,
    default: null
  },
  viewMode: {
    type: String,
    default: 'both'
  },
  dayRecord: {
    type: Object,
    default: null
  },
  nightRecord: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['click', 'select'])

const isFlipped = ref(false)

const isSelected = computed(() => {
  return props.selectedDate && isSameDay(props.dateObj.date, props.selectedDate)
})

const isToday = computed(() => {
  return isSameDay(props.dateObj.date, new Date())
})

const isCurrentMonth = computed(() => {
  return props.dateObj.current
})

const dayContent = computed(() => {
  return props.dayRecord && (props.dayRecord.content || (props.dayRecord.tags && props.dayRecord.tags.length > 0))
    ? props.dayRecord
    : null
})

const nightContent = computed(() => {
  return props.nightRecord && (props.nightRecord.content || (props.nightRecord.tags && props.nightRecord.tags.length > 0))
    ? props.nightRecord
    : null
})

watch(() => props.viewMode, (newMode, oldMode) => {
  if (newMode === 'day') {
    isFlipped.value = false
  } else if (newMode === 'night') {
    isFlipped.value = true
  } else if (newMode === 'both') {
    if (oldMode === 'night') {
      isFlipped.value = false
    }
  }
}, { immediate: true })

function handleClick() {
  emit('select', props.dateObj.date)
  
  if (props.viewMode === 'both') {
    isFlipped.value = !isFlipped.value
  }
  
  emit('click', {
    date: props.dateObj.date,
    isFlipped: isFlipped.value
  })
}

defineExpose({
  isFlipped
})
</script>