<template>
  <div class="music-visualizer-container" :style="containerStyle">
    <canvas 
      ref="canvasRef" 
      class="visualizer-canvas"
      @click="handleCanvasClick"
    />
    <input 
      ref="fileInputRef" 
      type="file" 
      accept="audio/*" 
      class="file-input"
      @change="handleFileSelect"
    />
    
    <div class="visualizer-controls" v-if="isReady">
      <button 
        class="control-btn play-btn" 
        @click="togglePlay"
        :title="isPlaying ? '暂停' : '播放'"
      >
        <svg v-if="isPlaying" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
        </svg>
        <svg v-else viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z"/>
        </svg>
      </button>
      
      <div class="volume-control">
        <svg class="volume-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0014 9.73v4.54a4.5 4.5 0 000-1.27zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
        </svg>
        <input 
          type="range" 
          class="volume-slider" 
          min="0" 
          max="100" 
          :value="volume * 100"
          @input="handleVolumeChange"
        />
      </div>
      
      <div class="mode-selector">
        <button 
          v-for="mode in modes" 
          :key="mode.value"
          class="mode-btn"
          :class="{ active: visualMode === mode.value }"
          @click="visualMode = mode.value"
          :title="mode.label"
        >
          <svg v-if="mode.value === 'wave'" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2 12c2-2 3-2 4-2s2 0 4 2 3 2 4 2 2 0 4-2v3c-2 2-3 2-4 2s-2 0-4-2-3-2-4-2-2 0-4 2v-3z"/>
          </svg>
          <svg v-else-if="mode.value === 'ring'" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2"/>
            <circle cx="12" cy="4" r="2"/>
            <circle cx="4" cy="12" r="1.5"/>
            <circle cx="18" cy="12" r="2"/>
            <circle cx="12" cy="18" r="1.5"/>
          </svg>
          <svg v-else-if="mode.value === 'waterfall'" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 16c0-2.76 2.24-5 5-5s5 2.24 5 5v4H7v-4zM12 2C8.13 2 5 5.13 5 9h2c0-2.76 2.24-5 5-5s5 2.24 5 5h2c0-3.87-3.13-7-7-7z"/>
          </svg>
        </button>
      </div>
    </div>
    
    <div class="visualizer-hint" v-if="!isReady">
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
      </svg>
      <span>点击选择音乐</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps({
  themeColor: {
    type: String,
    default: '#409eff'
  },
  height: {
    type: Number,
    default: 90
  }
})

const canvasRef = ref(null)
const fileInputRef = ref(null)
const audioContext = ref(null)
const analyser = ref(null)
const audioElement = ref(null)
const source = ref(null)
const animationId = ref(null)

const isReady = ref(false)
const isPlaying = ref(false)
const volume = ref(0.7)
const visualMode = ref('wave')

const modes = [
  { value: 'wave', label: '波浪模式' },
  { value: 'ring', label: '粒子环模式' },
  { value: 'waterfall', label: '光谱瀑布模式' }
]

const waveLayers = ref([])
const waterfallData = ref([])
const ringParticles = ref([])
const backgroundGlow = ref(0)

const themeColors = computed(() => {
  const hex = props.themeColor.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  
  return {
    low: { r: 255, g: 140, b: 80 },
    mid: { r, g, b },
    high: { r: 80, g: 200, b: 255 }
  }
})

const containerStyle = computed(() => ({
  height: `${props.height}px`,
  '--theme-color': props.themeColor
}))

function initAudioContext() {
  if (!audioContext.value) {
    const AudioContext = window.AudioContext || window.webkitAudioContext
    audioContext.value = new AudioContext()
    analyser.value = audioContext.value.createAnalyser()
    analyser.value.fftSize = 512
    analyser.value.smoothingTimeConstant = 0.85
  }
}

function handleCanvasClick() {
  fileInputRef.value?.click()
}

function handleFileSelect(event) {
  const file = event.target.files[0]
  if (!file) return
  
  initAudioContext()
  
  const url = URL.createObjectURL(file)
  
  if (audioElement.value) {
    audioElement.value.pause()
    audioElement.value.src = ''
  }
  
  audioElement.value = new Audio(url)
  audioElement.value.loop = true
  audioElement.value.volume = volume.value
  
  if (source.value) {
    source.value.disconnect()
  }
  
  source.value = audioContext.value.createMediaElementSource(audioElement.value)
  source.value.connect(analyser.value)
  analyser.value.connect(audioContext.value.destination)
  
  isReady.value = true
  isPlaying.value = true
  
  if (audioContext.value.state === 'suspended') {
    audioContext.value.resume()
  }
  
  audioElement.value.play()
  startAnimation()
}

function togglePlay() {
  if (!audioElement.value) return
  
  if (isPlaying.value) {
    audioElement.value.pause()
  } else {
    if (audioContext.value?.state === 'suspended') {
      audioContext.value.resume()
    }
    audioElement.value.play()
    startAnimation()
  }
  isPlaying.value = !isPlaying.value
}

function handleVolumeChange(event) {
  volume.value = event.target.value / 100
  if (audioElement.value) {
    audioElement.value.volume = volume.value
  }
}

function getSmoothFrequency(data, index, total) {
  const smoothRange = 2
  let sum = 0
  let count = 0
  
  for (let i = Math.max(0, index - smoothRange); i <= Math.min(total - 1, index + smoothRange); i++) {
    sum += data[i]
    count++
  }
  
  return sum / count
}

function getColorByFrequency(freqIndex, totalFreqs, intensity) {
  const colors = themeColors.value
  const position = freqIndex / totalFreqs
  
  let color
  if (position < 0.33) {
    color = colors.low
  } else if (position < 0.66) {
    color = colors.mid
  } else {
    color = colors.high
  }
  
  const alpha = 0.3 + intensity * 0.5
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`
}

function getGradientColor(ctx, startColor, endColor, width, position, intensity) {
  const gradient = ctx.createLinearGradient(0, 0, width, 0)
  const alpha = 0.3 + intensity * 0.6
  
  const start = {
    r: startColor.r,
    g: startColor.g,
    b: startColor.b
  }
  const end = {
    r: endColor.r,
    g: endColor.g,
    b: endColor.b
  }
  
  gradient.addColorStop(0, `rgba(${start.r}, ${start.g}, ${start.b}, ${alpha * 0.6})`)
  gradient.addColorStop(0.5, `rgba(${(start.r + end.r) / 2}, ${(start.g + end.g) / 2}, ${(start.b + end.b) / 2}, ${alpha})`)
  gradient.addColorStop(1, `rgba(${end.r}, ${end.g}, ${end.b}, ${alpha * 0.6})`)
  
  return gradient
}

function initWaveLayers() {
  if (waveLayers.value.length === 0) {
    waveLayers.value = [
      { speed: 0.003, amplitude: 0.4, offset: 0, color: 'low' },
      { speed: 0.005, amplitude: 0.3, offset: Math.PI / 3, color: 'mid' },
      { speed: 0.008, amplitude: 0.2, offset: Math.PI * 2 / 3, color: 'high' }
    ]
  }
}

function drawWaveMode(ctx, width, height, frequencyData, timeData) {
  initWaveLayers()
  
  const bufferLength = analyser.value.frequencyBinCount
  let totalEnergy = 0
  
  for (let i = 0; i < bufferLength; i++) {
    totalEnergy += frequencyData[i]
  }
  const avgEnergy = totalEnergy / bufferLength
  backgroundGlow.value = avgEnergy / 255
  
  const colors = themeColors.value
  const centerY = height / 2
  
  ctx.globalCompositeOperation = 'lighter'
  
  waveLayers.value.forEach((layer, layerIndex) => {
    layer.offset += layer.speed
    
    const points = []
    const pointsCount = 100
    
    for (let i = 0; i <= pointsCount; i++) {
      const x = (i / pointsCount) * width
      const freqIndex = Math.floor((i / pointsCount) * bufferLength * 0.8)
      const freqValue = getSmoothFrequency(frequencyData, freqIndex, bufferLength)
      
      const baseAmplitude = layer.amplitude * height * 0.4
      const musicAmplitude = (freqValue / 255) * baseAmplitude * 1.5
      
      const wave = Math.sin(layer.offset + (i / pointsCount) * Math.PI * 4) * musicAmplitude
      const y = centerY + wave
      
      points.push({ x, y, intensity: freqValue / 255 })
    }
    
    let colorKey = layer.color
    let layerColor
    
    if (colorKey === 'low') {
      layerColor = colors.low
    } else if (colorKey === 'mid') {
      layerColor = colors.mid
    } else {
      layerColor = colors.high
    }
    
    const gradient = ctx.createLinearGradient(0, centerY - height * 0.5, 0, centerY + height * 0.5)
    const alpha = 0.25 + (avgEnergy / 255) * 0.3
    gradient.addColorStop(0, `rgba(${layerColor.r}, ${layerColor.g}, ${layerColor.b}, 0)`)
    gradient.addColorStop(0.3, `rgba(${layerColor.r}, ${layerColor.g}, ${layerColor.b}, ${alpha})`)
    gradient.addColorStop(0.5, `rgba(${layerColor.r}, ${layerColor.g}, ${layerColor.b}, ${alpha + 0.15})`)
    gradient.addColorStop(0.7, `rgba(${layerColor.r}, ${layerColor.g}, ${layerColor.b}, ${alpha})`)
    gradient.addColorStop(1, `rgba(${layerColor.r}, ${layerColor.g}, ${layerColor.b}, 0)`)
    
    ctx.beginPath()
    ctx.moveTo(points[0].x, height)
    
    points.forEach((point, i) => {
      if (i === 0) {
        ctx.lineTo(point.x, point.y)
      } else {
        const prev = points[i - 1]
        const cpX = (prev.x + point.x) / 2
        ctx.bezierCurveTo(cpX, prev.y, cpX, point.y, point.x, point.y)
      }
    })
    
    ctx.lineTo(points[points.length - 1].x, height)
    ctx.closePath()
    ctx.fillStyle = gradient
    ctx.fill()
    
    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)
    
    points.forEach((point, i) => {
      if (i > 0) {
        const prev = points[i - 1]
        const cpX = (prev.x + point.x) / 2
        ctx.bezierCurveTo(cpX, prev.y, cpX, point.y, point.x, point.y)
      }
    })
    
    ctx.strokeStyle = `rgba(${layerColor.r}, ${layerColor.g}, ${layerColor.b}, ${0.6 + (avgEnergy / 255) * 0.4})`
    ctx.lineWidth = 2 + (avgEnergy / 255) * 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()
    
    ctx.shadowColor = `rgba(${layerColor.r}, ${layerColor.g}, ${layerColor.b}, 0.8)`
    ctx.shadowBlur = 15 + (avgEnergy / 255) * 10
    ctx.strokeStyle = `rgba(${layerColor.r}, ${layerColor.g}, ${layerColor.b}, 0.4)`
    ctx.lineWidth = 1
    ctx.stroke()
    ctx.shadowBlur = 0
  })
  
  ctx.globalCompositeOperation = 'source-over'
}

function initRingParticles(count) {
  if (ringParticles.value.length === 0) {
    for (let i = 0; i < count; i++) {
      ringParticles.value.push({
        angle: (i / count) * Math.PI * 2,
        radius: 0,
        targetRadius: 0,
        size: 0,
        alpha: 0,
        speed: 0.5 + Math.random() * 0.5
      })
    }
  }
}

function drawRingMode(ctx, width, height, frequencyData) {
  const bufferLength = analyser.value.frequencyBinCount
  const particleCount = 60
  initRingParticles(particleCount)
  
  const centerX = width / 2
  const centerY = height / 2
  const baseRadius = Math.min(width, height) * 0.25
  
  let totalEnergy = 0
  for (let i = 0; i < bufferLength; i++) {
    totalEnergy += frequencyData[i]
  }
  backgroundGlow.value = (totalEnergy / bufferLength) / 255
  
  const colors = themeColors.value
  
  ctx.globalCompositeOperation = 'lighter'
  
  ringParticles.value.forEach((particle, i) => {
    const freqIndex = Math.floor((i / particleCount) * bufferLength * 0.8)
    const freqValue = getSmoothFrequency(frequencyData, freqIndex, bufferLength)
    const intensity = freqValue / 255
    
    particle.targetRadius = baseRadius + intensity * baseRadius * 0.6
    particle.radius += (particle.targetRadius - particle.radius) * 0.1
    particle.size = 2 + intensity * 8
    particle.alpha = 0.3 + intensity * 0.7
    particle.angle += 0.002 * particle.speed
    
    const x = centerX + Math.cos(particle.angle) * particle.radius
    const y = centerY + Math.sin(particle.angle) * particle.radius
    
    const position = i / particleCount
    let color
    if (position < 0.33) {
      color = colors.low
    } else if (position < 0.66) {
      color = colors.mid
    } else {
      color = colors.high
    }
    
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, particle.size * 2)
    gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${particle.alpha})`)
    gradient.addColorStop(0.5, `rgba(${color.r}, ${color.g}, ${color.b}, ${particle.alpha * 0.5})`)
    gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`)
    
    ctx.beginPath()
    ctx.arc(x, y, particle.size * 2, 0, Math.PI * 2)
    ctx.fillStyle = gradient
    ctx.fill()
    
    ctx.beginPath()
    ctx.arc(x, y, particle.size * 0.6, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(${255}, ${255}, ${255}, ${particle.alpha * 0.3})`
    ctx.fill()
  })
  
  const innerGlow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, baseRadius * 0.8)
  const glowIntensity = backgroundGlow.value
  innerGlow.addColorStop(0, `rgba(${colors.mid.r}, ${colors.mid.g}, ${colors.mid.b}, ${glowIntensity * 0.3})`)
  innerGlow.addColorStop(1, `rgba(${colors.mid.r}, ${colors.mid.g}, ${colors.mid.b}, 0)`)
  
  ctx.beginPath()
  ctx.arc(centerX, centerY, baseRadius * 0.8, 0, Math.PI * 2)
  ctx.fillStyle = innerGlow
  ctx.fill()
  
  ctx.globalCompositeOperation = 'source-over'
}

function initWaterfallData(width) {
  if (waterfallData.value.length === 0) {
    const rows = 30
    for (let i = 0; i < rows; i++) {
      waterfallData.value.push(new Array(Math.floor(width / 4)).fill(0))
    }
  }
}

function drawWaterfallMode(ctx, width, height, frequencyData) {
  const bufferLength = analyser.value.frequencyBinCount
  const barCount = 80
  initWaterfallData(width)
  
  const colors = themeColors.value
  
  let totalEnergy = 0
  for (let i = 0; i < bufferLength; i++) {
    totalEnergy += frequencyData[i]
  }
  backgroundGlow.value = (totalEnergy / bufferLength) / 255
  
  const newRow = []
  for (let i = 0; i < barCount; i++) {
    const freqIndex = Math.floor((i / barCount) * bufferLength * 0.8)
    newRow.push(getSmoothFrequency(frequencyData, freqIndex, bufferLength))
  }
  
  waterfallData.value.unshift(newRow)
  if (waterfallData.value.length > 30) {
    waterfallData.value.pop()
  }
  
  const barWidth = width / barCount
  const rowHeight = height / waterfallData.value.length
  
  waterfallData.value.forEach((row, rowIndex) => {
    const rowAlpha = 1 - (rowIndex / waterfallData.value.length)
    
    row.forEach((value, colIndex) => {
      const intensity = value / 255
      if (intensity < 0.05) return
      
      const position = colIndex / barCount
      let color
      if (position < 0.33) {
        color = colors.low
      } else if (position < 0.66) {
        color = colors.mid
      } else {
        color = colors.high
      }
      
      const x = colIndex * barWidth
      const y = rowIndex * rowHeight
      
      const gradient = ctx.createLinearGradient(x, y, x, y + rowHeight)
      const alpha = intensity * rowAlpha * 0.6
      gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`)
      gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha * 0.2})`)
      
      ctx.fillStyle = gradient
      ctx.fillRect(x, y, barWidth, rowHeight + 1)
    })
  })
  
  const glowGradient = ctx.createLinearGradient(0, 0, 0, height)
  const glowIntensity = backgroundGlow.value
  glowGradient.addColorStop(0, `rgba(${colors.high.r}, ${colors.high.g}, ${colors.high.b}, ${glowIntensity * 0.15})`)
  glowGradient.addColorStop(0.5, `rgba(${colors.mid.r}, ${colors.mid.g}, ${colors.mid.b}, ${glowIntensity * 0.1})`)
  glowGradient.addColorStop(1, `rgba(${colors.low.r}, ${colors.low.g}, ${colors.low.b}, ${glowIntensity * 0.15})`)
  
  ctx.fillStyle = glowGradient
  ctx.fillRect(0, 0, width, height)
  
  ctx.globalCompositeOperation = 'lighter'
  for (let i = 0; i < barCount; i++) {
    const freqIndex = Math.floor((i / barCount) * bufferLength * 0.8)
    const value = getSmoothFrequency(frequencyData, freqIndex, bufferLength)
    const intensity = value / 255
    
    if (intensity > 0.1) {
      const position = i / barCount
      let color
      if (position < 0.33) {
        color = colors.low
      } else if (position < 0.66) {
        color = colors.mid
      } else {
        color = colors.high
      }
      
      const x = i * barWidth + barWidth / 2
      const barHeight = intensity * height * 0.3
      
      const gradient = ctx.createLinearGradient(x, 0, x, barHeight)
      gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${intensity * 0.8})`)
      gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`)
      
      ctx.fillStyle = gradient
      ctx.fillRect(x - barWidth / 2, 0, barWidth, barHeight)
    }
  }
  ctx.globalCompositeOperation = 'source-over'
}

function drawBackgroundGlow(ctx, width, height) {
  const colors = themeColors.value
  const intensity = backgroundGlow.value
  
  const gradient = ctx.createRadialGradient(
    width / 2, height / 2, 0,
    width / 2, height / 2, Math.max(width, height) * 0.6
  )
  
  gradient.addColorStop(0, `rgba(${colors.mid.r}, ${colors.mid.g}, ${colors.mid.b}, ${intensity * 0.15})`)
  gradient.addColorStop(0.5, `rgba(${colors.mid.r}, ${colors.mid.g}, ${colors.mid.b}, ${intensity * 0.08})`)
  gradient.addColorStop(1, `rgba(${colors.mid.r}, ${colors.mid.g}, ${colors.mid.b}, 0)`)
  
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)
}

function animate() {
  if (!analyser.value || !canvasRef.value) return
  
  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')
  const width = canvas.width
  const height = canvas.height
  
  const frequencyData = new Uint8Array(analyser.value.frequencyBinCount)
  const timeData = new Uint8Array(analyser.value.frequencyBinCount)
  
  analyser.value.getByteFrequencyData(frequencyData)
  analyser.value.getByteTimeDomainData(timeData)
  
  ctx.clearRect(0, 0, width, height)
  
  drawBackgroundGlow(ctx, width, height)
  
  switch (visualMode.value) {
    case 'wave':
      drawWaveMode(ctx, width, height, frequencyData, timeData)
      break
    case 'ring':
      drawRingMode(ctx, width, height, frequencyData)
      break
    case 'waterfall':
      drawWaterfallMode(ctx, width, height, frequencyData)
      break
  }
  
  animationId.value = requestAnimationFrame(animate)
}

function startAnimation() {
  if (animationId.value) {
    cancelAnimationFrame(animationId.value)
  }
  animate()
}

function resizeCanvas() {
  if (!canvasRef.value) return
  
  const canvas = canvasRef.value
  const rect = canvas.getBoundingClientRect()
  const dpr = window.devicePixelRatio || 1
  
  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr
  
  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)
}

watch(visualMode, () => {
  waterfallData.value = []
  ringParticles.value = []
  waveLayers.value = []
})

onMounted(() => {
  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)
})

onUnmounted(() => {
  if (animationId.value) {
    cancelAnimationFrame(animationId.value)
  }
  if (audioElement.value) {
    audioElement.value.pause()
    audioElement.value.src = ''
  }
  if (audioContext.value) {
    audioContext.value.close()
  }
  window.removeEventListener('resize', resizeCanvas)
})

defineExpose({
  backgroundGlow
})
</script>

<style lang="scss" scoped>
.music-visualizer-container {
  position: relative;
  width: 100%;
  background: transparent;
  overflow: hidden;
  
  .visualizer-canvas {
    width: 100%;
    height: 100%;
    cursor: pointer;
  }
  
  .file-input {
    display: none;
  }
  
  .visualizer-hint {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: var(--calendar-text-color-level-4);
    font-size: 12px;
    pointer-events: none;
    opacity: 0.5;
    transition: opacity 0.3s ease;
    
    svg {
      width: 24px;
      height: 24px;
      margin-bottom: 4px;
      opacity: 0.5;
    }
  }
  
  &:hover .visualizer-hint {
    opacity: 0.8;
  }
  
  .visualizer-controls {
    position: absolute;
    bottom: 4px;
    right: 8px;
    display: flex;
    align-items: center;
    gap: 6px;
    opacity: 0.25;
    transition: all 0.3s ease;
  }
  
  &:hover .visualizer-controls,
  .visualizer-controls:hover {
    opacity: 0.9;
  }
  
  .control-btn {
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 2px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.6);
    transition: all 0.2s ease;
    border-radius: 4px;
    
    &:hover {
      color: rgba(255, 255, 255, 1);
      background: rgba(255, 255, 255, 0.1);
      transform: scale(1.15);
    }
    
    svg {
      width: 14px;
      height: 14px;
    }
  }
  
  .volume-control {
    display: flex;
    align-items: center;
    gap: 4px;
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
    
    .visualizer-controls:hover & {
      opacity: 1;
      pointer-events: auto;
    }
    
    .volume-icon {
      width: 12px;
      height: 12px;
      color: rgba(255, 255, 255, 0.6);
    }
    
    .volume-slider {
      width: 50px;
      height: 3px;
      -webkit-appearance: none;
      appearance: none;
      background: rgba(255, 255, 255, 0.15);
      border-radius: 2px;
      outline: none;
      cursor: pointer;
      
      &::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 10px;
        height: 10px;
        background: rgba(255, 255, 255, 0.7);
        border-radius: 50%;
        cursor: pointer;
        transition: all 0.2s ease;
        
        &:hover {
          transform: scale(1.2);
          background: #fff;
        }
      }
      
      &::-moz-range-thumb {
        width: 10px;
        height: 10px;
        background: rgba(255, 255, 255, 0.7);
        border-radius: 50%;
        cursor: pointer;
        border: none;
      }
    }
  }
  
  .mode-selector {
    display: flex;
    align-items: center;
    gap: 2px;
    padding-left: 6px;
    margin-left: 4px;
    border-left: 1px solid rgba(255, 255, 255, 0.1);
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
    
    .visualizer-controls:hover & {
      opacity: 1;
      pointer-events: auto;
    }
  }
  
  .mode-btn {
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 2px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.35);
    transition: all 0.2s ease;
    border-radius: 3px;
    
    &:hover {
      color: rgba(255, 255, 255, 0.8);
      background: rgba(255, 255, 255, 0.08);
    }
    
    &.active {
      color: rgba(255, 255, 255, 0.9);
      background: rgba(255, 255, 255, 0.12);
    }
    
    svg {
      width: 12px;
      height: 12px;
    }
  }
}
</style>
