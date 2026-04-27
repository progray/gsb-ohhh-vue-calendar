<template>
  <div
    v-if="visible"
    class="mood-slider-popup"
    :class="{
      'position-left': popupPosition === 'left',
      'position-right': popupPosition === 'right',
      'position-bottom': popupPosition === 'bottom'
    }"
    :style="{
      left: adjustedPosition.x + 'px',
      top: adjustedPosition.y + 'px'
    }"
    @click.stop
  >
    <div class="mood-slider-container">
      <div class="mood-slider-track">
        <div
          v-for="(color, index) in MOOD_COLORS"
          :key="index"
          class="mood-slider-dot"
          :class="{
            'is-selected': selectedIndex === index
          }"
          :style="{
            '--mood-color': color,
            left: getDotPosition(index) + '%'
          }"
          @click="selectColor(index)"
        ></div>
      </div>
      <div
        class="mood-slider-thumb"
        :style="{
          left: thumbPosition + '%',
          '--mood-color': selectedColor
        }"
        @mousedown="startDrag"
        @touchstart="startDrag"
      ></div>
    </div>
    <div class="mood-slider-actions">
      <button class="mood-slider-btn mood-slider-btn-cancel" @click="cancel">取消</button>
      <button class="mood-slider-btn mood-slider-btn-confirm" @click="confirm">确定</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { MOOD_COLORS } from '../hooks/useMood.js'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  position: {
    type: Object,
    default: () => ({ x: 0, y: 0 })
  },
  initialColorIndex: {
    type: Number,
    default: null
  },
  containerBounds: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['select', 'cancel', 'confirm'])

const selectedIndex = ref(props.initialColorIndex ?? 2)
const isDragging = ref(false)
const popupRef = ref(null)
const popupPosition = ref('default')

const SLIDER_WIDTH = 232
const SLIDER_HEIGHT = 100

const selectedColor = computed(() => {
  return MOOD_COLORS[selectedIndex.value]
})

const thumbPosition = computed(() => {
  return (selectedIndex.value / (MOOD_COLORS.length - 1)) * 100
})

function getDotPosition(index) {
  return (index / (MOOD_COLORS.length - 1)) * 100
}

const adjustedPosition = computed(() => {
  popupPosition.value = 'default'
  
  if (props.containerBounds) {
    const { left, top, right, bottom, width: containerWidth, height: containerHeight } = props.containerBounds
    
    const clickX = props.position.x
    const clickY = props.position.y
    
    const sliderWidth = 232
    const sliderHeight = 100
    
    const defaultLeft = clickX - sliderWidth / 2
    const defaultRight = clickX + sliderWidth / 2
    const defaultTop = clickY - sliderHeight * 1.2
    const defaultBottom = clickY
    
    let needsLeftAdjust = defaultLeft < 0
    let needsRightAdjust = defaultRight > containerWidth
    let needsBottomAdjust = defaultTop < 0
    
    if (needsLeftAdjust && needsRightAdjust) {
      if (Math.abs(defaultLeft) < Math.abs(defaultRight - containerWidth)) {
        needsRightAdjust = false
      } else {
        needsLeftAdjust = false
      }
    }
    
    if (needsLeftAdjust) {
      popupPosition.value = 'left'
    } else if (needsRightAdjust) {
      popupPosition.value = 'right'
    }
    
    if (needsBottomAdjust) {
      if (popupPosition.value === 'default') {
        popupPosition.value = 'bottom'
      } else {
        popupPosition.value = popupPosition.value + '-bottom'
      }
    }
  }
  
  return {
    x: props.position.x,
    y: props.position.y
  }
})

function selectColor(index) {
  selectedIndex.value = index
}

function startDrag(event) {
  event.preventDefault()
  isDragging.value = true
  
  const track = event.currentTarget.parentElement.querySelector('.mood-slider-track')
  const trackRect = track.getBoundingClientRect()
  
  function updatePosition(clientX) {
    const relativeX = clientX - trackRect.left
    const percentage = Math.max(0, Math.min(1, relativeX / trackRect.width))
    const newIndex = Math.round(percentage * (MOOD_COLORS.length - 1))
    selectedIndex.value = newIndex
  }
  
  function onMove(moveEvent) {
    if (!isDragging.value) return
    const clientX = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX
    updatePosition(clientX)
  }
  
  function onEnd() {
    isDragging.value = false
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onEnd)
    document.removeEventListener('touchmove', onMove)
    document.removeEventListener('touchend', onEnd)
  }
  
  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onEnd)
  document.addEventListener('touchmove', onMove, { passive: false })
  document.addEventListener('touchend', onEnd)
}

function cancel() {
  emit('cancel')
}

function confirm() {
  emit('confirm', selectedIndex.value)
}

onMounted(() => {
  if (props.initialColorIndex !== null && props.initialColorIndex !== undefined) {
    selectedIndex.value = props.initialColorIndex
  }
})

onUnmounted(() => {
  isDragging.value = false
})
</script>

<style scoped>
.mood-slider-popup {
  position: absolute;
  z-index: 1000;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  padding: 16px;
  width: 200px;
  transform: translateX(-50%) translateY(-120%);
}

.mood-slider-popup::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 8px solid #ffffff;
}

.mood-slider-popup.position-left {
  transform: translateX(0) translateY(-120%);
}

.mood-slider-popup.position-left::after {
  left: 24px;
  transform: translateX(0);
}

.mood-slider-popup.position-right {
  transform: translateX(-100%) translateY(-120%);
}

.mood-slider-popup.position-right::after {
  left: auto;
  right: 24px;
  transform: translateX(0);
}

.mood-slider-popup.position-bottom {
  transform: translateX(-50%) translateY(20px);
}

.mood-slider-popup.position-bottom::after {
  bottom: auto;
  top: -8px;
  border-top: none;
  border-bottom: 8px solid #ffffff;
}

.mood-slider-popup.position-left-bottom {
  transform: translateX(0) translateY(20px);
}

.mood-slider-popup.position-left-bottom::after {
  left: 24px;
  bottom: auto;
  top: -8px;
  transform: translateX(0);
  border-top: none;
  border-bottom: 8px solid #ffffff;
}

.mood-slider-popup.position-right-bottom {
  transform: translateX(-100%) translateY(20px);
}

.mood-slider-popup.position-right-bottom::after {
  left: auto;
  right: 24px;
  bottom: auto;
  top: -8px;
  transform: translateX(0);
  border-top: none;
  border-bottom: 8px solid #ffffff;
}

.mood-slider-container {
  position: relative;
  height: 40px;
  display: flex;
  align-items: center;
}

.mood-slider-track {
  width: 100%;
  height: 4px;
  background: linear-gradient(
    to right,
    #FF6B6B 0%,
    #FFE66D 25%,
    #4ECDC4 50%,
    #A78BFA 75%,
    #95E1D3 100%
  );
  border-radius: 2px;
  position: relative;
  height: 24px;
  display: flex;
  align-items: center;
}

.mood-slider-dot {
  position: absolute;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--mood-color);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, z-index 0.2s ease;
  border: 2px solid #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transform: translate(-50%, -50%);
  top: 50%;
  z-index: 1;
}

.mood-slider-dot:hover {
  transform: translate(-50%, -50%) scale(1.2);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
  z-index: 2;
}

.mood-slider-dot.is-selected {
  transform: translate(-50%, -50%) scale(1.3);
  box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.1);
  z-index: 3;
}

.mood-slider-thumb {
  position: absolute;
  top: 50%;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #ffffff;
  border: 3px solid var(--mood-color);
  transform: translate(-50%, -50%);
  cursor: grab;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transition: box-shadow 0.2s ease, transform 0.2s ease;
  z-index: 10;
  pointer-events: auto;
}

.mood-slider-thumb:active {
  cursor: grabbing;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
}

.mood-slider-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.mood-slider-btn {
  padding: 6px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.mood-slider-btn-cancel {
  background: #f5f5f5;
  color: #666666;
}

.mood-slider-btn-cancel:hover {
  background: #e8e8e8;
}

.mood-slider-btn-confirm {
  background: var(--mood-color, #4ECDC4);
  color: #ffffff;
  font-weight: 500;
}

.mood-slider-btn-confirm:hover {
  filter: brightness(0.95);
}
</style>