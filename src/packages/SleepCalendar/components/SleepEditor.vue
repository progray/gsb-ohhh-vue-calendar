<template>
  <Transition name="fade-scale">
    <div 
      v-if="visible" 
      class="sleep-editor-overlay"
      @click="handleOverlayClick"
    >
      <div 
        class="sleep-editor-panel"
        @click.stop
      >
        <div class="sleep-editor-handle-bar"></div>
        
        <div class="sleep-editor-header">
          <div class="sleep-editor-date">{{ formattedDate }}</div>
          <div class="sleep-editor-close" @click="closePanel">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="#8a8aa0" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
        </div>
        
        <div class="sleep-editor-emoji">
          <SleepEmoji :rating="currentRating" :size="64" variant="outline" />
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
          <span class="sleep-editor-rating-label">当前评分</span>
          <span class="sleep-editor-rating-value">{{ currentRating.toFixed(1) }}</span>
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
  const thumbRadius = 10
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
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
}

.sleep-editor-panel {
  width: 100%;
  max-width: 360px;
  background: #1e1e2e;
  border-radius: 20px;
  padding: 8px 20px 20px;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.06);
  animation: panel-appear 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes panel-appear {
  from {
    transform: scale(0.95);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.sleep-editor-handle-bar {
  width: 36px;
  height: 4px;
  background: #3a3a4a;
  border-radius: 2px;
  margin: 8px auto 16px;
}

.sleep-editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.sleep-editor-date {
  font-size: 15px;
  font-weight: 500;
  color: #b0b0c0;
}

.sleep-editor-close {
  width: 28px;
  height: 28px;
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
  margin: 16px 0;
}

.sleep-editor-slider-container {
  padding: 0 4px;
}

.sleep-editor-slider-track {
  position: relative;
  height: 40px;
  border-radius: 20px;
  background: #252535;
  padding: 5px;
  cursor: pointer;
  box-shadow: 
    inset 0 1px 3px rgba(0, 0, 0, 0.4),
    0 1px 0 rgba(255, 255, 255, 0.03);
}

.sleep-editor-slider-gradient {
  position: absolute;
  inset: 5px;
  border-radius: 15px;
  opacity: 0.9;
}

.sleep-editor-slider-thumb {
  position: absolute;
  top: 50%;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 
    0 2px 6px rgba(0, 0, 0, 0.35),
    0 0 0 1px rgba(255, 255, 255, 0.2);
  transform: translate(-50%, -50%);
  transition: box-shadow 0.15s ease;
  z-index: 1;
  
  &:active {
    box-shadow: 
      0 3px 12px rgba(0, 0, 0, 0.45),
      0 0 0 3px rgba(255, 255, 255, 0.15);
  }
}

.sleep-editor-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  padding: 0 4px;
}

.sleep-editor-label {
  font-size: 12px;
  color: #5a5a70;
}

.sleep-editor-footer {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 6px;
  margin-top: 16px;
}

.sleep-editor-rating-label {
  font-size: 12px;
  color: #6a6a80;
}

.sleep-editor-rating-value {
  font-size: 20px;
  font-weight: 600;
  color: #c0c0d0;
  font-variant-numeric: tabular-nums;
}

.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  
  .sleep-editor-panel {
    transform: scale(0.95);
    opacity: 0;
  }
}
</style>
