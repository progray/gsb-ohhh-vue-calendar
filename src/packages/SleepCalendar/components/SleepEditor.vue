<template>
  <Transition name="slide-up">
    <div 
      v-if="visible" 
      class="sleep-editor-overlay"
      @click="handleOverlayClick"
    >
      <div 
        class="sleep-editor-panel"
        @click.stop
      >
        <div class="sleep-editor-header">
          <div class="sleep-editor-date">{{ formattedDate }}</div>
          <div class="sleep-editor-close" @click="closePanel">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="#8a8aa0" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
        </div>
        
        <div class="sleep-editor-emoji">
          <SleepEmoji :rating="currentRating" :size="80" variant="outline" />
        </div>
        
        <div class="sleep-editor-slider-container">
          <div 
            class="sleep-editor-slider-track"
            ref="trackRef"
            @mousedown="handleTrackMouseDown"
            @touchstart="handleTrackTouchStart"
          >
            <div class="sleep-editor-slider-gradient" :style="gradientStyle"></div>
            <div 
              class="sleep-editor-slider-thumb"
              :style="thumbStyle"
            ></div>
          </div>
          
          <div class="sleep-editor-labels">
            <span class="sleep-editor-label">差</span>
            <span class="sleep-editor-label">一般</span>
            <span class="sleep-editor-label">好</span>
          </div>
        </div>
        
        <div class="sleep-editor-footer">
          <div class="sleep-editor-rating-display">
            当前评分: <span class="sleep-editor-rating-value">{{ currentRating.toFixed(1) }}</span>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import SleepEmoji from './SleepEmoji.vue'
import { createGradient, SLEEP_COLORS } from '../utils/colors.js'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  date: {
    type: Date,
    default: () => new Date()
  },
  initialRating: {
    type: Number,
    default: null
  }
})

const emit = defineEmits(['update:visible', 'save'])

const trackRef = ref(null)
const currentRating = ref(props.initialRating ?? 3)
const isDragging = ref(false)

const formattedDate = computed(() => {
  const d = props.date
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
})

const gradientStyle = computed(() => ({
  background: createGradient()
}))

const thumbPosition = computed(() => {
  const ratio = (currentRating.value - 1) / 4
  return `${ratio * 100}%`
})

const thumbStyle = computed(() => ({
  left: thumbPosition.value,
  transform: 'translateX(-50%)'
}))

watch(() => props.visible, (newVal) => {
  if (newVal) {
    currentRating.value = props.initialRating ?? 3
  }
})

watch(() => props.initialRating, (newVal) => {
  currentRating.value = newVal ?? 3
})

function getRatingFromPosition(clientX) {
  if (!trackRef.value) return currentRating.value
  
  const rect = trackRef.value.getBoundingClientRect()
  const thumbRadius = 12
  const trackPadding = thumbRadius
  const availableWidth = rect.width - trackPadding * 2
  
  let x = clientX - rect.left - trackPadding
  x = Math.max(0, Math.min(availableWidth, x))
  
  const ratio = x / availableWidth
  return 1 + ratio * 4
}

function handleTrackMouseDown(e) {
  isDragging.value = true
  currentRating.value = getRatingFromPosition(e.clientX)
  
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

function handleTrackTouchStart(e) {
  e.preventDefault()
  isDragging.value = true
  const touch = e.touches[0]
  currentRating.value = getRatingFromPosition(touch.clientX)
  
  document.addEventListener('touchmove', handleTouchMove, { passive: false })
  document.addEventListener('touchend', handleTouchEnd)
}

function handleMouseMove(e) {
  if (!isDragging.value) return
  currentRating.value = getRatingFromPosition(e.clientX)
}

function handleTouchMove(e) {
  if (!isDragging.value) return
  e.preventDefault()
  const touch = e.touches[0]
  currentRating.value = getRatingFromPosition(touch.clientX)
}

function handleMouseUp() {
  if (isDragging.value) {
    isDragging.value = false
    saveAndClose()
  }
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
}

function handleTouchEnd() {
  if (isDragging.value) {
    isDragging.value = false
    saveAndClose()
  }
  document.removeEventListener('touchmove', handleTouchMove)
  document.removeEventListener('touchend', handleTouchEnd)
}

function saveAndClose() {
  emit('save', {
    date: props.date,
    rating: Math.round(currentRating.value * 10) / 10
  })
  closePanel()
}

function closePanel() {
  emit('update:visible', false)
}

function handleOverlayClick(e) {
  if (e.target === e.currentTarget) {
    closePanel()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
})

function handleKeyDown(e) {
  if (e.key === 'Escape' && props.visible) {
    closePanel()
  }
}
</script>

<style lang="scss" scoped>
.sleep-editor-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.sleep-editor-panel {
  width: 100%;
  max-width: 480px;
  background: #1e1e2e;
  border-radius: 24px 24px 0 0;
  padding: 24px;
  box-shadow: 
    0 -8px 32px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.05);
  animation: panel-appear 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes panel-appear {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.sleep-editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.sleep-editor-date {
  font-size: 18px;
  font-weight: 500;
  color: #c0c0d0;
}

.sleep-editor-close {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #2a2a3a;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #3a3a4a;
  }
}

.sleep-editor-emoji {
  display: flex;
  justify-content: center;
  margin: 24px 0;
}

.sleep-editor-slider-container {
  padding: 0 8px;
}

.sleep-editor-slider-track {
  position: relative;
  height: 48px;
  border-radius: 24px;
  background: #2a2a3a;
  padding: 6px;
  cursor: pointer;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
}

.sleep-editor-slider-gradient {
  position: absolute;
  inset: 6px;
  border-radius: 18px;
  opacity: 0.9;
}

.sleep-editor-slider-thumb {
  position: absolute;
  top: 50%;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 
    0 2px 8px rgba(0, 0, 0, 0.4),
    0 0 0 2px rgba(255, 255, 255, 0.3);
  transform: translate(-50%, -50%);
  transition: box-shadow 0.2s ease;
  z-index: 1;
  
  &:active {
    box-shadow: 
      0 4px 16px rgba(0, 0, 0, 0.5),
      0 0 0 4px rgba(255, 255, 255, 0.2);
  }
}

.sleep-editor-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 12px;
  padding: 0 8px;
}

.sleep-editor-label {
  font-size: 13px;
  color: #6a6a80;
}

.sleep-editor-footer {
  margin-top: 24px;
  text-align: center;
}

.sleep-editor-rating-display {
  font-size: 14px;
  color: #8a8aa0;
}

.sleep-editor-rating-value {
  font-size: 18px;
  font-weight: 600;
  color: #c0c0d0;
  margin-left: 4px;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  
  .sleep-editor-panel {
    transform: translateY(100%);
  }
}
</style>
