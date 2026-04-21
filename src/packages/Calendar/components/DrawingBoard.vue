<template>
  <div 
    class="drawing-board-overlay" 
    @click.self="handleOverlayClick"
    :style="overlayStyle"
  >
    <div class="drawing-board">
      <div class="drawing-board-header">
        <span class="drawing-board-title">{{ dateLabel }}</span>
        <button class="drawing-board-close" @click="handleClose">×</button>
      </div>
      
      <div class="drawing-board-canvas-wrapper">
        <div class="drawing-board-canvas-container">
          <canvas
            ref="canvasRef"
            :width="canvasWidth"
            :height="canvasHeight"
            @mousedown="startDrawing"
            @mousemove="draw"
            @mouseup="stopDrawing"
            @mouseleave="stopDrawing"
            @touchstart.prevent="startDrawingTouch"
            @touchmove.prevent="drawTouch"
            @touchend.prevent="stopDrawing"
          ></canvas>
        </div>
      </div>

      <div class="drawing-board-tools">
        <div class="tool-row">
          <div class="tool-group">
            <button
              class="tool-btn"
              :class="{ active: tool === 'pen' }"
              @click="tool = 'pen'"
            >
              ✏️ 画笔
            </button>
            <button
              class="tool-btn"
              :class="{ active: tool === 'eraser' }"
              @click="tool = 'eraser'"
            >
              🧹 橡皮
            </button>
          </div>

          <div class="tool-group size-group">
            <span class="tool-label">粗细:</span>
            <div class="size-picker">
              <button
                v-for="s in sizes"
                :key="s"
                class="size-btn"
                :class="{ active: size === s }"
                :style="getSizeBtnStyle(s)"
                @click="size = s"
              ></button>
            </div>
          </div>
        </div>

        <div class="tool-row bottom-row">
          <div class="tool-group color-group">
            <span class="tool-label">颜色:</span>
            <div class="color-picker">
              <button
                v-for="c in colors"
                :key="c"
                class="color-btn"
                :class="{ active: color === c }"
                :style="{ background: c }"
                @click="color = c"
              ></button>
            </div>
          </div>

          <div class="tool-group actions">
            <button class="action-btn clear" @click="clearCanvas">清空</button>
            <button class="action-btn save" @click="saveDrawing">保存</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue'

const props = defineProps({
  selectedDate: {
    type: Date,
    required: true
  },
  initialDrawing: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['close', 'save'])

const canvasRef = ref(null)
const ctx = ref(null)
const isDrawing = ref(false)
const lastX = ref(0)
const lastY = ref(0)
const tool = ref('pen')
const color = ref('#333333')
const size = ref(3)
const scale = ref(1)

const canvasWidth = 400
const canvasHeight = 300

const colors = ['#333333', '#ff6a6a', '#4a9eff', '#5cd859', '#ffca3a', '#9b59b6', '#1abc9c', '#e74c3c']
const sizes = [2, 3, 5, 8, 12]

const dateLabel = computed(() => {
  const d = props.selectedDate
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
})

const overlayStyle = computed(() => {
  return {
    '--scale': scale.value,
    '--canvas-width': canvasWidth + 'px',
    '--canvas-height': canvasHeight + 'px'
  }
})

function getSizeBtnStyle(s) {
  return { '--line-size': s + 'px' }
}

function handleOverlayClick() {
  emit('close')
}

function handleClose() {
  emit('close')
}

let resizeTimeout = null

const baseBoardWidth = 520
const baseOverlayPadding = 16
const baseTotalWidth = baseBoardWidth + baseOverlayPadding * 2

const baseHeaderHeight = 60
const baseCanvasWrapperPadding = 32
const baseCanvasBorder = 4
const baseToolsHeight = 140
const baseTotalHeight = baseOverlayPadding * 2 + baseHeaderHeight + 
  baseCanvasWrapperPadding + canvasHeight + baseCanvasBorder + baseToolsHeight

function calculateScale() {
  const windowWidth = window.innerWidth
  const windowHeight = window.innerHeight
  
  const widthScale = windowWidth / baseTotalWidth
  const heightScale = windowHeight / baseTotalHeight
  
  const newScale = Math.min(widthScale, heightScale, 1.2)
  scale.value = Math.max(newScale, 0.5)
}

function handleResize() {
  if (resizeTimeout) {
    clearTimeout(resizeTimeout)
  }
  resizeTimeout = setTimeout(() => {
    calculateScale()
  }, 100)
}

onMounted(() => {
  calculateScale()
  window.addEventListener('resize', handleResize)
  
  const canvas = canvasRef.value
  if (!canvas) return
  
  ctx.value = canvas.getContext('2d')
  ctx.value.fillStyle = '#ffffff'
  ctx.value.fillRect(0, 0, canvasWidth, canvasHeight)
  ctx.value.lineCap = 'round'
  ctx.value.lineJoin = 'round'
  
  if (props.initialDrawing) {
    loadDrawing(props.initialDrawing)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (resizeTimeout) {
    clearTimeout(resizeTimeout)
  }
})

watch(() => props.initialDrawing, (newDrawing) => {
  if (ctx.value && newDrawing) {
    loadDrawing(newDrawing)
  }
})

function loadDrawing(imageData) {
  if (!ctx.value) return
  
  const img = new Image()
  img.onload = () => {
    ctx.value.clearRect(0, 0, canvasWidth, canvasHeight)
    ctx.value.fillStyle = '#ffffff'
    ctx.value.fillRect(0, 0, canvasWidth, canvasHeight)
    ctx.value.drawImage(img, 0, 0, canvasWidth, canvasHeight)
  }
  img.src = imageData
}

function getCanvasPos(clientX, clientY) {
  const canvas = canvasRef.value
  if (!canvas) return { x: 0, y: 0 }
  
  const rect = canvas.getBoundingClientRect()
  const currentScale = rect.width / canvasWidth
  
  return {
    x: (clientX - rect.left) / currentScale,
    y: (clientY - rect.top) / currentScale
  }
}

function startDrawing(e) {
  if (!canvasRef.value) return
  
  isDrawing.value = true
  
  let clientX, clientY
  if (e.touches) {
    clientX = e.touches[0].clientX
    clientY = e.touches[0].clientY
  } else {
    clientX = e.clientX
    clientY = e.clientY
  }
  
  const pos = getCanvasPos(clientX, clientY)
  lastX.value = pos.x
  lastY.value = pos.y
  
  if (ctx.value) {
    ctx.value.beginPath()
    ctx.value.moveTo(pos.x, pos.y)
  }
}

function startDrawingTouch(e) {
  startDrawing(e)
}

function draw(e) {
  if (!isDrawing.value || !ctx.value) return
  
  let clientX, clientY
  if (e.touches) {
    clientX = e.touches[0].clientX
    clientY = e.touches[0].clientY
  } else {
    clientX = e.clientX
    clientY = e.clientY
  }
  
  const pos = getCanvasPos(clientX, clientY)
  
  ctx.value.beginPath()
  ctx.value.moveTo(lastX.value, lastY.value)
  
  if (tool.value === 'eraser') {
    ctx.value.globalCompositeOperation = 'destination-out'
    ctx.value.strokeStyle = 'rgba(0,0,0,1)'
  } else {
    ctx.value.globalCompositeOperation = 'source-over'
    ctx.value.strokeStyle = color.value
  }
  ctx.value.lineWidth = size.value
  ctx.value.lineTo(pos.x, pos.y)
  ctx.value.stroke()
  
  lastX.value = pos.x
  lastY.value = pos.y
}

function drawTouch(e) {
  draw(e)
}

function stopDrawing() {
  if (isDrawing.value) {
    isDrawing.value = false
    if (ctx.value) {
      ctx.value.globalCompositeOperation = 'source-over'
    }
  }
}

function clearCanvas() {
  if (!ctx.value) return
  ctx.value.clearRect(0, 0, canvasWidth, canvasHeight)
  ctx.value.fillStyle = '#ffffff'
  ctx.value.fillRect(0, 0, canvasWidth, canvasHeight)
}

function saveDrawing() {
  if (!canvasRef.value) return
  const canvas = canvasRef.value
  const imageData = canvas.toDataURL('image/png')
  emit('save', imageData)
  emit('close')
}
</script>

<style scoped>
.drawing-board-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: calc(16px * var(--scale, 1));
  box-sizing: border-box;
}

.drawing-board {
  background: #fff;
  border-radius: calc(16px * var(--scale, 1));
  box-shadow: 0 calc(12px * var(--scale, 1)) calc(48px * var(--scale, 1)) rgba(0, 0, 0, 0.25);
  width: calc(520px * var(--scale, 1));
  max-width: 100%;
  max-height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.drawing-board-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: calc(14px * var(--scale, 1)) calc(20px * var(--scale, 1));
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}

.drawing-board-title {
  font-size: calc(17px * var(--scale, 1));
  font-weight: 600;
  color: #1f1f1f;
}

.drawing-board-close {
  width: calc(34px * var(--scale, 1));
  height: calc(34px * var(--scale, 1));
  border: none;
  background: #f5f5f5;
  border-radius: 50%;
  font-size: calc(22px * var(--scale, 1));
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.drawing-board-close:hover {
  background: #e8e8e8;
  color: #333;
}

.drawing-board-canvas-wrapper {
  flex: 1;
  min-height: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: calc(16px * var(--scale, 1));
  overflow: hidden;
}

.drawing-board-canvas-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
}

canvas {
  border: calc(2px * var(--scale, 1)) solid #e8e8e8;
  border-radius: calc(12px * var(--scale, 1));
  background: #fff;
  cursor: crosshair;
  touch-action: none;
  max-width: 100%;
  max-height: 100%;
  width: calc(var(--canvas-width, 400px) * var(--scale, 1));
  height: calc(var(--canvas-height, 300px) * var(--scale, 1));
  box-shadow: 0 calc(2px * var(--scale, 1)) calc(8px * var(--scale, 1)) rgba(0, 0, 0, 0.06);
}

.drawing-board-tools {
  padding: calc(12px * var(--scale, 1)) calc(16px * var(--scale, 1)) calc(14px * var(--scale, 1));
  border-top: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
  gap: calc(10px * var(--scale, 1));
  flex-shrink: 0;
  background: #fafafa;
}

.tool-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: calc(10px * var(--scale, 1));
}

.tool-row.bottom-row {
  justify-content: space-between;
  align-items: center;
}

.tool-group {
  display: flex;
  align-items: center;
  gap: calc(8px * var(--scale, 1));
}

.tool-group.size-group {
  justify-content: flex-end;
}

.tool-group.color-group {
  flex: 1;
  min-width: 0;
}

.tool-label {
  font-size: calc(13px * var(--scale, 1));
  color: #888;
  font-weight: 500;
  white-space: nowrap;
}

.tool-btn {
  padding: calc(10px * var(--scale, 1)) calc(16px * var(--scale, 1));
  border: calc(1.5px * var(--scale, 1)) solid #e0e0e0;
  background: #fff;
  border-radius: calc(10px * var(--scale, 1));
  cursor: pointer;
  font-size: calc(14px * var(--scale, 1));
  font-weight: 500;
  transition: all 0.2s ease;
  color: #555;
}

.tool-btn:hover {
  background: #f8f8f8;
  border-color: #d0d0d0;
}

.tool-btn.active {
  background: #4a9eff;
  border-color: #4a9eff;
  color: #fff;
  box-shadow: 0 calc(2px * var(--scale, 1)) calc(8px * var(--scale, 1)) rgba(74, 158, 255, 0.3);
}

.color-picker {
  display: flex;
  gap: calc(8px * var(--scale, 1));
  flex-wrap: wrap;
}

.color-btn {
  width: calc(28px * var(--scale, 1));
  height: calc(28px * var(--scale, 1));
  border: calc(2px * var(--scale, 1)) solid #e0e0e0;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.color-btn:hover {
  transform: scale(1.1);
  border-color: #bbb;
}

.color-btn.active {
  border-color: #333;
  transform: scale(1.15);
  box-shadow: 0 calc(2px * var(--scale, 1)) calc(8px * var(--scale, 1)) rgba(0, 0, 0, 0.2);
}

.size-picker {
  display: flex;
  gap: calc(10px * var(--scale, 1));
  align-items: center;
}

.size-btn {
  width: calc(30px * var(--scale, 1));
  height: calc(30px * var(--scale, 1));
  border: calc(1.5px * var(--scale, 1)) solid #e0e0e0;
  border-radius: 50%;
  cursor: pointer;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.size-btn::before {
  content: '';
  width: calc(var(--line-size) * var(--scale, 1));
  height: calc(var(--line-size) * var(--scale, 1));
  background: #444;
  border-radius: 50%;
}

.size-btn:hover {
  border-color: #b0b0b0;
  background: #fafafa;
}

.size-btn.active {
  border-color: #4a9eff;
  background: #f0f7ff;
  box-shadow: 0 calc(2px * var(--scale, 1)) calc(8px * var(--scale, 1)) rgba(74, 158, 255, 0.25);
}

.size-btn.active::before {
  background: #4a9eff;
}

.actions {
  justify-content: flex-end;
  gap: calc(12px * var(--scale, 1));
  flex-shrink: 0;
}

.action-btn {
  padding: calc(10px * var(--scale, 1)) calc(24px * var(--scale, 1));
  border: none;
  border-radius: calc(10px * var(--scale, 1));
  cursor: pointer;
  font-size: calc(14px * var(--scale, 1));
  font-weight: 600;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.action-btn.clear {
  background: #fff;
  color: #666;
  border: calc(1.5px * var(--scale, 1)) solid #e0e0e0;
}

.action-btn.clear:hover {
  background: #f5f5f5;
  border-color: #d0d0d0;
  color: #444;
}

.action-btn.save {
  background: linear-gradient(135deg, #4a9eff 0%, #3388ee 100%);
  color: #fff;
  box-shadow: 0 calc(3px * var(--scale, 1)) calc(10px * var(--scale, 1)) rgba(74, 158, 255, 0.35);
}

.action-btn.save:hover {
  background: linear-gradient(135deg, #3388ee 0%, #2277dd 100%);
  transform: translateY(-1px);
  box-shadow: 0 calc(4px * var(--scale, 1)) calc(14px * var(--scale, 1)) rgba(74, 158, 255, 0.45);
}

@media (max-width: 480px) {
  .drawing-board-overlay {
    padding: calc(8px * var(--scale, 1));
  }

  .drawing-board {
    border-radius: calc(12px * var(--scale, 1));
  }

  .drawing-board-header {
    padding: calc(12px * var(--scale, 1)) calc(16px * var(--scale, 1));
  }

  .drawing-board-title {
    font-size: calc(15px * var(--scale, 1));
  }

  .drawing-board-canvas-wrapper {
    padding: calc(12px * var(--scale, 1));
  }

  .drawing-board-tools {
    padding: calc(10px * var(--scale, 1)) calc(12px * var(--scale, 1)) calc(12px * var(--scale, 1));
    gap: calc(8px * var(--scale, 1));
  }

  .tool-row {
    gap: calc(8px * var(--scale, 1));
  }

  .tool-btn {
    padding: calc(8px * var(--scale, 1)) calc(14px * var(--scale, 1));
    font-size: calc(13px * var(--scale, 1));
  }

  .color-btn {
    width: calc(24px * var(--scale, 1));
    height: calc(24px * var(--scale, 1));
  }

  .size-btn {
    width: calc(26px * var(--scale, 1));
    height: calc(26px * var(--scale, 1));
  }

  .action-btn {
    padding: calc(8px * var(--scale, 1)) calc(18px * var(--scale, 1));
    font-size: calc(13px * var(--scale, 1));
  }

  .tool-label {
    font-size: calc(12px * var(--scale, 1));
  }
}

@media (max-height: 600px) {
  .drawing-board-canvas-wrapper {
    padding: calc(8px * var(--scale, 1));
  }

  .drawing-board-tools {
    padding: calc(8px * var(--scale, 1)) calc(12px * var(--scale, 1)) calc(10px * var(--scale, 1));
    gap: calc(6px * var(--scale, 1));
  }

  .drawing-board-header {
    padding: calc(10px * var(--scale, 1)) calc(16px * var(--scale, 1));
  }
}
</style>
