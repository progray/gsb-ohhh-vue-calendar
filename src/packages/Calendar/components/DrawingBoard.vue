<template>
  <div class="drawing-board-overlay" @click.self="$emit('close')">
    <div class="drawing-board">
      <div class="drawing-board-header">
        <span class="drawing-board-title">{{ dateLabel }}</span>
        <button class="drawing-board-close" @click="$emit('close')">×</button>
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
                :style="{ '--line-size': s + 'px' }"
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
  padding: 16px;
  box-sizing: border-box;
}

.drawing-board {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.25);
  width: 100%;
  max-width: 520px;
  max-height: calc(100vh - 32px);
  min-height: 480px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.drawing-board-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}

.drawing-board-title {
  font-size: 17px;
  font-weight: 600;
  color: #1f1f1f;
}

.drawing-board-close {
  width: 34px;
  height: 34px;
  border: none;
  background: #f5f5f5;
  border-radius: 50%;
  font-size: 22px;
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
  padding: 16px;
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
  border: 2px solid #e8e8e8;
  border-radius: 12px;
  background: #fff;
  cursor: crosshair;
  touch-action: none;
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.drawing-board-tools {
  padding: 12px 16px 14px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex-shrink: 0;
  background: #fafafa;
}

.tool-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.tool-row.bottom-row {
  justify-content: space-between;
  align-items: center;
}

.tool-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tool-group.size-group {
  justify-content: flex-end;
}

.tool-group.color-group {
  flex: 1;
  min-width: 0;
}

.tool-label {
  font-size: 13px;
  color: #888;
  font-weight: 500;
  white-space: nowrap;
}

.tool-btn {
  padding: 10px 16px;
  border: 1.5px solid #e0e0e0;
  background: #fff;
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
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
  box-shadow: 0 2px 8px rgba(74, 158, 255, 0.3);
}

.color-picker {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.color-btn {
  width: 28px;
  height: 28px;
  border: 2px solid #e0e0e0;
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
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.size-picker {
  display: flex;
  gap: 10px;
  align-items: center;
}

.size-btn {
  width: 30px;
  height: 30px;
  border: 1.5px solid #e0e0e0;
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
  width: var(--line-size);
  height: var(--line-size);
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
  box-shadow: 0 2px 8px rgba(74, 158, 255, 0.25);
}

.size-btn.active::before {
  background: #4a9eff;
}

.actions {
  justify-content: flex-end;
  gap: 12px;
  flex-shrink: 0;
}

.action-btn {
  padding: 10px 24px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.action-btn.clear {
  background: #fff;
  color: #666;
  border: 1.5px solid #e0e0e0;
}

.action-btn.clear:hover {
  background: #f5f5f5;
  border-color: #d0d0d0;
  color: #444;
}

.action-btn.save {
  background: linear-gradient(135deg, #4a9eff 0%, #3388ee 100%);
  color: #fff;
  box-shadow: 0 3px 10px rgba(74, 158, 255, 0.35);
}

.action-btn.save:hover {
  background: linear-gradient(135deg, #3388ee 0%, #2277dd 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(74, 158, 255, 0.45);
}

@media (max-width: 480px) {
  .drawing-board-overlay {
    padding: 8px;
  }

  .drawing-board {
    max-height: calc(100vh - 16px);
    min-height: auto;
    border-radius: 12px;
  }

  .drawing-board-header {
    padding: 12px 16px;
  }

  .drawing-board-title {
    font-size: 15px;
  }

  .drawing-board-canvas-wrapper {
    padding: 12px;
  }

  .drawing-board-tools {
    padding: 10px 12px 12px;
    gap: 8px;
  }

  .tool-row {
    gap: 8px;
  }

  .tool-btn {
    padding: 8px 14px;
    font-size: 13px;
  }

  .color-btn {
    width: 24px;
    height: 24px;
  }

  .size-btn {
    width: 26px;
    height: 26px;
  }

  .action-btn {
    padding: 8px 18px;
    font-size: 13px;
  }

  .tool-label {
    font-size: 12px;
  }
}

@media (max-height: 600px) {
  .drawing-board-canvas-wrapper {
    padding: 8px;
  }

  .drawing-board-tools {
    padding: 8px 12px 10px;
    gap: 6px;
  }

  .drawing-board-header {
    padding: 10px 16px;
  }
}
</style>
