<template>
  <div class="drawing-board-overlay" @click.self="$emit('close')">
    <div class="drawing-board">
      <div class="drawing-board-header">
        <span class="drawing-board-title">{{ dateLabel }}</span>
        <button class="drawing-board-close" @click="$emit('close')">×</button>
      </div>
      
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

      <div class="drawing-board-tools">
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

        <div class="tool-group">
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

        <div class="tool-group">
          <span class="tool-label">粗细:</span>
          <div class="size-picker">
            <button
              v-for="s in sizes"
              :key="s"
              class="size-btn"
              :class="{ active: size === s }"
              :style="{ '--line-size': s + 'px' }"
              @click="size = s"
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
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'

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

const canvasWidth = 400
const canvasHeight = 300

const colors = ['#333333', '#ff6a6a', '#4a9eff', '#5cd859', '#ffca3a', '#9b59b6', '#1abc9c', '#e74c3c']
const sizes = [2, 3, 5, 8, 12]

const dateLabel = computed(() => {
  const d = props.selectedDate
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
})

onMounted(() => {
  const canvas = canvasRef.value
  ctx.value = canvas.getContext('2d')
  ctx.value.fillStyle = '#ffffff'
  ctx.value.fillRect(0, 0, canvasWidth, canvasHeight)
  ctx.value.lineCap = 'round'
  ctx.value.lineJoin = 'round'
  
  if (props.initialDrawing) {
    loadDrawing(props.initialDrawing)
  }
})

watch(() => props.initialDrawing, (newDrawing) => {
  if (ctx.value && newDrawing) {
    loadDrawing(newDrawing)
  }
})

function loadDrawing(imageData) {
  const img = new Image()
  img.onload = () => {
    ctx.value.clearRect(0, 0, canvasWidth, canvasHeight)
    ctx.value.fillStyle = '#ffffff'
    ctx.value.fillRect(0, 0, canvasWidth, canvasHeight)
    ctx.value.drawImage(img, 0, 0, canvasWidth, canvasHeight)
  }
  img.src = imageData
}

function getPos(e) {
  const canvas = canvasRef.value
  const rect = canvas.getBoundingClientRect()
  const scaleX = canvasWidth / rect.width
  const scaleY = canvasHeight / rect.height
  
  if (e.touches) {
    return {
      x: (e.touches[0].clientX - rect.left) * scaleX,
      y: (e.touches[0].clientY - rect.top) * scaleY
    }
  }
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY
  }
}

function startDrawing(e) {
  isDrawing.value = true
  const pos = getPos(e)
  lastX.value = pos.x
  lastY.value = pos.y
  ctx.value.beginPath()
  ctx.value.moveTo(pos.x, pos.y)
}

function startDrawingTouch(e) {
  startDrawing(e)
}

function draw(e) {
  if (!isDrawing.value) return
  
  const pos = getPos(e)
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
    ctx.value.globalCompositeOperation = 'source-over'
  }
}

function clearCanvas() {
  ctx.value.clearRect(0, 0, canvasWidth, canvasHeight)
  ctx.value.fillStyle = '#ffffff'
  ctx.value.fillRect(0, 0, canvasWidth, canvasHeight)
}

function saveDrawing() {
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
}

.drawing-board {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 450px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.drawing-board-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
}

.drawing-board-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.drawing-board-close {
  width: 32px;
  height: 32px;
  border: none;
  background: #f5f5f5;
  border-radius: 50%;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  transition: all 0.2s;
}

.drawing-board-close:hover {
  background: #eee;
  color: #333;
}

.drawing-board-canvas-container {
  padding: 16px;
  display: flex;
  justify-content: center;
}

canvas {
  border: 2px solid #eee;
  border-radius: 8px;
  background: #fff;
  cursor: crosshair;
  touch-action: none;
  max-width: 100%;
  height: auto;
}

.drawing-board-tools {
  padding: 12px 16px 16px;
  border-top: 1px solid #eee;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tool-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tool-label {
  font-size: 14px;
  color: #666;
  min-width: 40px;
}

.tool-btn {
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: #f9f9f9;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.tool-btn:hover {
  background: #f0f0f0;
  border-color: #ccc;
}

.tool-btn.active {
  background: #4a9eff;
  border-color: #4a9eff;
  color: #fff;
}

.color-picker {
  display: flex;
  gap: 8px;
}

.color-btn {
  width: 28px;
  height: 28px;
  border: 2px solid #ddd;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
}

.color-btn:hover {
  transform: scale(1.1);
}

.color-btn.active {
  border-color: #333;
  transform: scale(1.15);
}

.size-picker {
  display: flex;
  gap: 12px;
  align-items: center;
}

.size-btn {
  width: 32px;
  height: 32px;
  border: 1px solid #ddd;
  border-radius: 50%;
  cursor: pointer;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.size-btn::before {
  content: '';
  width: var(--line-size);
  height: var(--line-size);
  background: #333;
  border-radius: 50%;
}

.size-btn:hover {
  border-color: #999;
  background: #f9f9f9;
}

.size-btn.active {
  border-color: #4a9eff;
  background: #f0f7ff;
}

.actions {
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
}

.action-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.action-btn.clear {
  background: #f5f5f5;
  color: #666;
}

.action-btn.clear:hover {
  background: #eee;
  color: #333;
}

.action-btn.save {
  background: #4a9eff;
  color: #fff;
}

.action-btn.save:hover {
  background: #3388ee;
}
</style>
