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
const currentData = ref([])
const targetData = ref([])
const interpolationProgress = ref(0)
const isAnimatingTransition = ref(false)

const currentTypeInfo = computed(() => WEATHER_TYPES[props.dataType] || WEATHER_TYPES.temperature)

watch(() => props.hourlyData, (newData, oldData) => {
  if (newData && newData.values && newData.values[props.dataType]) {
    prepareForTransition(newData)
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
  if (currentData.value.length === 0 || targetData.value.length === 0) {
    return targetData.value
  }
  
  const progress = interpolationProgress.value
  return currentData.value.map((val, i) => {
    const target = targetData.value[i] || val
    return val + (target - val) * progress
  })
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
  
  const pathGradient = ctx2d.createLinearGradient(0, 0, width, 0)
  gradient.forEach((color, i) => {
    pathGradient.addColorStop(i / (gradient.length - 1), color)
  })
  
  ctx2d.beginPath()
  ctx2d.moveTo(0, height)
  
  for (let i = 0; i < points; i++) {
    const x = i * pointSpacing
    const waveOffset = Math.sin(phase.value + i * 0.15) * 5
    const y = height - (data[i] * height * 0.7) - 20 + waveOffset
    
    if (i === 0) {
      ctx2d.moveTo(x, y)
    } else {
      const prevX = (i - 1) * pointSpacing
      const prevY = height - (data[i - 1] * height * 0.7) - 20 + Math.sin(phase.value + (i - 1) * 0.15) * 5
      const cpX = (prevX + x) / 2
      ctx2d.bezierCurveTo(cpX, prevY, cpX, y, x, y)
    }
  }
  
  ctx2d.lineTo(width, height)
  ctx2d.closePath()
  
  const fillGradient = ctx2d.createLinearGradient(0, 0, 0, height)
  fillGradient.addColorStop(0, color + '40')
  fillGradient.addColorStop(0.5, color + '20')
  fillGradient.addColorStop(1, color + '10')
  
  ctx2d.fillStyle = fillGradient
  ctx2d.fill()
  
  ctx2d.beginPath()
  for (let i = 0; i < points; i++) {
    const x = i * pointSpacing
    const waveOffset = Math.sin(phase.value + i * 0.15) * 5
    const y = height - (data[i] * height * 0.7) - 20 + waveOffset
    
    if (i === 0) {
      ctx2d.moveTo(x, y)
    } else {
      const prevX = (i - 1) * pointSpacing
      const prevY = height - (data[i - 1] * height * 0.7) - 20 + Math.sin(phase.value + (i - 1) * 0.15) * 5
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

function animate() {
  phase.value += 0.03 * props.animationSpeed
  
  if (isAnimatingTransition.value) {
    interpolationProgress.value += 0.05
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
