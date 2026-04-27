<template>
  <Teleport to="body">
    <div v-if="visible" class="time-capsule-scratch-overlay" @click="handleOverlayClick">
      <div class="time-capsule-scratch" @click.stop>
        <div class="time-capsule-scratch-header">
          <h3 class="time-capsule-scratch-title">
            <span v-if="isToday">✨ 时光胶囊已开封！</span>
            <span v-else>📖 查看时光胶囊</span>
          </h3>
          <div class="time-capsule-scratch-close" @click="handleClose">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </div>
        </div>
        
        <div class="time-capsule-scratch-body">
          <div class="time-capsule-scratch-date">
            <span>日期：</span>
            <span class="time-capsule-scratch-date-value">{{ formattedDate }}</span>
          </div>
          
          <div class="time-capsule-scratch-container">
            <div class="time-capsule-scratch-content" :style="{ opacity: scratchProgress / 100 }">
              <p class="time-capsule-scratch-text">{{ content }}</p>
            </div>
            
            <canvas
              ref="canvasRef"
              class="time-capsule-scratch-canvas"
              :style="{ opacity: 1 - scratchProgress / 100 }"
              @mousedown="handleMouseDown"
              @mousemove="handleMouseMove"
              @mouseup="handleMouseUp"
              @mouseleave="handleMouseLeave"
              @touchstart="handleTouchStart"
              @touchmove="handleTouchMove"
              @touchend="handleTouchEnd"
            ></canvas>
            
            <div
              v-if="scratchProgress < 30"
              class="time-capsule-scratch-hint"
              :style="{ opacity: 1 - scratchProgress / 30 }"
            >
              👆 按住鼠标刮开查看内容
            </div>
          </div>
          
          <div class="time-capsule-scratch-progress">
            <div class="time-capsule-scratch-progress-bar">
              <div
                class="time-capsule-scratch-progress-fill"
                :style="{ width: scratchProgress + '%' }"
              ></div>
            </div>
            <span class="time-capsule-scratch-progress-text">
              {{ scratchProgress >= 100 ? '✅ 已完全刮开' : `已刮开 ${scratchProgress.toFixed(0)}%` }}
            </span>
          </div>
        </div>
        
        <div class="time-capsule-scratch-footer">
          <button
            class="time-capsule-btn time-capsule-btn-secondary"
            @click="handleClose"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  date: {
    type: Date,
    default: null
  },
  capsule: {
    type: Object,
    default: null
  },
  isToday: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'progress-update'])

const canvasRef = ref(null)
const isDrawing = ref(false)
const scratchProgress = ref(0)
const canvasContext = ref(null)
const canvasSize = { width: 400, height: 200 }
const brushSize = 40

const formattedDate = computed(() => {
  if (!props.date) return ''
  return `${props.date.getFullYear()}年${props.date.getMonth() + 1}月${props.date.getDate()}日`
})

const content = computed(() => {
  return props.capsule?.content || ''
})

function initCanvas() {
  if (!canvasRef.value) return
  
  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')
  
  canvas.width = canvasSize.width
  canvas.height = canvasSize.height
  
  ctx.fillStyle = '#9CA3AF'
  ctx.fillRect(0, 0, canvasSize.width, canvasSize.height)
  
  ctx.fillStyle = '#6B7280'
  ctx.font = '20px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('按住刮开', canvasSize.width / 2, canvasSize.height / 2 + 10)
  
  canvasContext.value = ctx
  
  if (props.capsule?.scratchProgress > 0) {
    const savedProgress = props.capsule.scratchProgress
    if (savedProgress >= 100) {
      scratchProgress.value = 100
    } else {
      restoreScratchArea(savedProgress)
    }
  }
}

function restoreScratchArea(progress) {
  if (!canvasContext.value) return
  
  const ctx = canvasContext.value
  const percentageToClear = progress / 100
  const totalPixels = canvasSize.width * canvasSize.height
  const pixelsToClear = totalPixels * percentageToClear
  
  const circlesToDraw = Math.ceil(pixelsToClear / (Math.PI * brushSize * brushSize))
  
  for (let i = 0; i < circlesToDraw; i++) {
    const x = Math.random() * canvasSize.width
    const y = Math.random() * canvasSize.height
    drawCircle(x, y)
  }
  
  scratchProgress.value = progress
}

function drawCircle(x, y) {
  if (!canvasContext.value) return
  
  const ctx = canvasContext.value
  ctx.globalCompositeOperation = 'destination-out'
  ctx.beginPath()
  ctx.arc(x, y, brushSize, 0, Math.PI * 2)
  ctx.fill()
}

function calculateScratchProgress() {
  if (!canvasContext.value || scratchProgress.value >= 100) return
  
  const canvas = canvasRef.value
  const ctx = canvasContext.value
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const pixels = imageData.data
  let transparentPixels = 0
  
  for (let i = 3; i < pixels.length; i += 4) {
    if (pixels[i] === 0) {
      transparentPixels++
    }
  }
  
  const totalPixels = pixels.length / 4
  scratchProgress.value = (transparentPixels / totalPixels) * 100
  
  if (scratchProgress.value >= 70 && scratchProgress.value < 100) {
    scratchProgress.value = 100
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }
  
  emit('progress-update', {
    date: props.date,
    progress: scratchProgress.value
  })
}

function getCanvasPosition(e) {
  const canvas = canvasRef.value
  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  
  let clientX, clientY
  
  if (e.touches) {
    clientX = e.touches[0].clientX
    clientY = e.touches[0].clientY
  } else {
    clientX = e.clientX
    clientY = e.clientY
  }
  
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY
  }
}

function handleMouseDown(e) {
  if (scratchProgress.value >= 100) return
  isDrawing.value = true
  const pos = getCanvasPosition(e)
  drawCircle(pos.x, pos.y)
}

function handleMouseMove(e) {
  if (!isDrawing.value || scratchProgress.value >= 100) return
  const pos = getCanvasPosition(e)
  drawCircle(pos.x, pos.y)
}

function handleMouseUp() {
  isDrawing.value = false
  calculateScratchProgress()
}

function handleMouseLeave() {
  if (isDrawing.value) {
    isDrawing.value = false
    calculateScratchProgress()
  }
}

function handleTouchStart(e) {
  e.preventDefault()
  handleMouseDown(e)
}

function handleTouchMove(e) {
  e.preventDefault()
  handleMouseMove(e)
}

function handleTouchEnd(e) {
  e.preventDefault()
  handleMouseUp()
}

function handleClose() {
  emit('close')
}

function handleOverlayClick() {
  handleClose()
}

watch(
  () => props.visible,
  (newVisible) => {
    if (newVisible) {
      nextTick(() => {
        scratchProgress.value = props.capsule?.scratchProgress || 0
        initCanvas()
      })
    } else {
      scratchProgress.value = 0
    }
  }
)

watch(
  () => props.capsule,
  () => {
    if (props.visible) {
      nextTick(() => {
        scratchProgress.value = props.capsule?.scratchProgress || 0
        initCanvas()
      })
    }
  }
)
</script>
