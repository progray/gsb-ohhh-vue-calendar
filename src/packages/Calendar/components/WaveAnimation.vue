<template>
  <div class="wave-animation-container" ref="containerRef">
    <canvas ref="canvasRef" class="wave-canvas"></canvas>
    <div class="wave-info" v-if="showInfo">
      <span class="wave-type">{{ currentTypeInfo.label }}</span>
      <span class="wave-unit">{{ currentTypeInfo.unit }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { WEATHER_TYPES, normalizeData } from '../services/weatherService.js'

const props = defineProps({
  hourlyData: {
    type: Object,
    default: null
  },
  dataType: {
    type: String,
    default: 'temperature'
  },
  showInfo: {
    type: Boolean,
    default: true
  },
  animationSpeed: {
    type: Number,
    default: 1
  }
})

const containerRef = ref(null)
const canvasRef = ref(null)
const ctx = ref(null)
const animationFrameId = ref(null)
const phase = ref(0)
const scrollOffset = ref(0)
const currentData = ref([])
const targetData = ref([])
const interpolationProgress = ref(0)
const isAnimatingTransition = ref(false)
const hasRealData = ref(false)

const currentTypeInfo = computed(() => WEATHER_TYPES[props.dataType] || WEATHER_TYPES.temperature)

function generateDefaultWaveData(points = 24) {
  const data = []
  for (let i = 0; i < points; i++) {
    const value = 0.3 + Math.sin(i * 0.3) * 0.2 + Math.sin(i * 0.7) * 0.1
    data.push(Math.max(0.1, Math.min(0.9, value)))
  }
  return data
}

function initDefaultData() {
  const defaultData = generateDefaultWaveData(24)
  currentData.value = [...defaultData]
  targetData.value = [...defaultData]
  hasRealData.value = false
}

watch(() => props.hourlyData, (newData, oldData) => {
  if (newData && newData.values && newData.values[props.dataType]) {
    prepareForTransition(newData)
    hasRealData.value = true
  }
}, { deep: true })

watch(() => props.dataType, (newType, oldType) => {
  if (props.hourlyData && props.hourlyData.values) {
    prepareForTransition(props.hourlyData, oldType)
  }
})

function prepareForTransition(newData, oldType = null) {
  if (!newData || !newData.values) return
  
  const type = props.dataType
  const values = newData.values[type]
  if (!values) return
  
  if (oldType && isAnimatingTransition.value) {
    currentData.value = [...targetData.value]
  } else {
    currentData.value = targetData.value.length > 0 ? [...targetData.value] : normalizeData(values)
  }
  
  targetData.value = normalizeData(values)
  interpolationProgress.value = 0
  isAnimatingTransition.value = true
}

function getInterpolatedData() {
  if (currentData.value.length === 0) {
    return generateDefaultWaveData(24)
  }
  
  if (!isAnimatingTransition.value || currentData.value.length === 0 || targetData.value.length === 0) {
    return targetData.value.length > 0 ? targetData.value : currentData.value
  }
  
  const progress = interpolationProgress.value
  const maxLength = Math.max(currentData.value.length, targetData.value.length)
  const result = []
  
  for (let i = 0; i < maxLength; i++) {
    const current = currentData.value[i] ?? currentData.value[currentData.value.length - 1] ?? 0.5
    const target = targetData.value[i] ?? targetData.value[targetData.value.length - 1] ?? 0.5
    result.push(current + (target - current) * progress)
  }
  
  return result
}

function initCanvas() {
  if (!canvasRef.value || !containerRef.value) return
  
  const canvas = canvasRef.value
  const container = containerRef.value
  
  const dpr = window.devicePixelRatio || 1
  canvas.width = container.clientWidth * dpr
  canvas.height = container.clientHeight * dpr
  
  ctx.value = canvas.getContext('2d')
  ctx.value.scale(dpr, dpr)
}

function getYValue(data, index, phase, height) {
  const waveOffset = Math.sin(phase + index * 0.15) * 3
  return height - (data[index] * height * 0.7) - 20 + waveOffset
}

function drawWaveSegment(ctx2d, data, startX, pointSpacing, width, height, phase, color, gradient) {
  const points = data.length
  const pathGradient = ctx2d.createLinearGradient(startX, 0, startX + width, 0)
  gradient.forEach((gColor, i) => {
    pathGradient.addColorStop(i / (gradient.length - 1), gColor)
  })
  
  ctx2d.beginPath()
  ctx2d.moveTo(startX, height)
  
  for (let i = 0; i < points; i++) {
    const x = startX + i * pointSpacing
    const y = getYValue(data, i, phase, height)
    
    if (i === 0) {
      ctx2d.moveTo(x, y)
    } else {
      const prevX = startX + (i - 1) * pointSpacing
      const prevY = getYValue(data, i - 1, phase, height)
      const cpX = (prevX + x) / 2
      ctx2d.bezierCurveTo(cpX, prevY, cpX, y, x, y)
    }
  }
  
  ctx2d.lineTo(startX + (points - 1) * pointSpacing, height)
  ctx2d.closePath()
  
  const fillGradient = ctx2d.createLinearGradient(0, 0, 0, height)
  fillGradient.addColorStop(0, color + '40')
  fillGradient.addColorStop(0.5, color + '20')
  fillGradient.addColorStop(1, color + '10')
  
  ctx2d.fillStyle = fillGradient
  ctx2d.fill()
  
  ctx2d.beginPath()
  for (let i = 0; i < points; i++) {
    const x = startX + i * pointSpacing
    const y = getYValue(data, i, phase, height)
    
    if (i === 0) {
      ctx2d.moveTo(x, y)
    } else {
      const prevX = startX + (i - 1) * pointSpacing
      const prevY = getYValue(data, i - 1, phase, height)
      const cpX = (prevX + x) / 2
      ctx2d.bezierCurveTo(cpX, prevY, cpX, y, x, y)
    }
  }
  
  ctx2d.strokeStyle = pathGradient
  ctx2d.lineWidth = 3
  ctx2d.lineCap = 'round'
  ctx2d.lineJoin = 'round'
  ctx2d.stroke()
  
  ctx2d.shadowColor = color
  ctx2d.shadowBlur = 10
  ctx2d.stroke()
  ctx2d.shadowBlur = 0
}

function drawWave() {
  if (!ctx.value || !canvasRef.value) return
  
  const ctx2d = ctx.value
  const canvas = canvasRef.value
  const container = containerRef.value
  
  if (!container) return
  
  const width = container.clientWidth
  const height = container.clientHeight
  
  ctx2d.clearRect(0, 0, width, height)
  
  const data = getInterpolatedData()
  if (data.length === 0) return
  
  const typeInfo = currentTypeInfo.value
  const color = typeInfo.color
  const gradient = typeInfo.gradient
  
  const points = data.length
  const pointSpacing = width / (points - 1)
  const totalWidth = pointSpacing * (points - 1)
  
  const offset = scrollOffset.value % totalWidth
  const startX = -offset
  
  drawWaveSegment(ctx2d, data, startX, pointSpacing, totalWidth, height, phase.value, color, gradient)
  
  if (startX + totalWidth < width) {
    drawWaveSegment(ctx2d, data, startX + totalWidth, pointSpacing, totalWidth, height, phase.value, color, gradient)
  }
  
  if (startX > 0) {
    drawWaveSegment(ctx2d, data, startX - totalWidth, pointSpacing, totalWidth, height, phase.value, color, gradient)
  }
}

function animate() {
  phase.value += 0.015 * props.animationSpeed
  scrollOffset.value += 0.5 * props.animationSpeed
  
  if (isAnimatingTransition.value) {
    interpolationProgress.value += 0.03
    if (interpolationProgress.value >= 1) {
      interpolationProgress.value = 1
      isAnimatingTransition.value = false
      currentData.value = [...targetData.value]
    }
  }
  
  drawWave()
  animationFrameId.value = requestAnimationFrame(animate)
}

function handleResize() {
  initCanvas()
}

onMounted(() => {
  initDefaultData()
  initCanvas()
  animate()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (animationFrameId.value) {
    cancelAnimationFrame(animationFrameId.value)
  }
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.wave-animation-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  z-index: 0;
}

.wave-canvas {
  width: 100%;
  height: 100%;
  display: block;
}

.wave-info {
  position: absolute;
  bottom: 10px;
  right: 10px;
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  background: rgba(0, 0, 0, 0.2);
  padding: 5px 10px;
  border-radius: 20px;
  backdrop-filter: blur(10px);
}

.wave-type {
  font-weight: 500;
}

.wave-unit {
  opacity: 0.8;
}
</style>
