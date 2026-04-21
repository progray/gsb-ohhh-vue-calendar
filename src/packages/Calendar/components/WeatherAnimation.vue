<template>
  <Transition name="weather-fade">
    <div v-if="visible" class="weather-animation-container" @click="$emit('close')">
      <div class="weather-close-btn" @click.stop="$emit('close')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </div>
      
      <div class="weather-info">
        <div class="weather-icon">{{ weatherData?.icon }}</div>
        <div class="weather-description">{{ weatherData?.description }}</div>
        <div class="weather-temperature">
          <span class="temp-max">{{ Math.round(weatherData?.tempMax || 0) }}°</span>
          <span class="temp-separator">/</span>
          <span class="temp-min">{{ Math.round(weatherData?.tempMin || 0) }}°</span>
        </div>
      </div>

      <canvas ref="canvasRef" class="weather-canvas"></canvas>
      
      <div class="weather-bg" :class="weatherData?.weatherType"></div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  weatherData: {
    type: Object,
    default: null
  }
})

defineEmits(['close'])

const canvasRef = ref(null)
let animationId = null
let ctx = null
let canvas = null

const particles = {
  clouds: [],
  rainDrops: [],
  splashes: [],
  snowFlakes: [],
  lightning: [],
  windLines: [],
  sunRays: []
}

function initCanvas() {
  canvas = canvasRef.value
  if (!canvas) return
  
  ctx = canvas.getContext('2d')
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  
  initParticles()
}

function initParticles() {
  const weatherType = props.weatherData?.weatherType || 'sunny'
  
  particles.clouds = []
  particles.rainDrops = []
  particles.splashes = []
  particles.snowFlakes = []
  particles.lightning = []
  particles.windLines = []
  particles.sunRays = []
  
  if (['sunny', 'partlyCloudy'].includes(weatherType)) {
    initSunRays()
    initClouds(3)
  }
  
  if (['cloudy', 'partlyCloudy', 'fog'].includes(weatherType)) {
    initClouds(8)
  }
  
  if (['rain', 'drizzle', 'thunderstorm'].includes(weatherType)) {
    initRainDrops(weatherType === 'thunderstorm' ? 200 : 100)
  }
  
  if (['snow'].includes(weatherType)) {
    initSnowFlakes(150)
  }
  
  if (['thunderstorm'].includes(weatherType)) {
    initLightning()
  }
}

function initSunRays() {
  for (let i = 0; i < 12; i++) {
    particles.sunRays.push({
      angle: (i * 30) * Math.PI / 180,
      length: 0,
      maxLength: Math.max(canvas.width, canvas.height),
      opacity: 0.1 + Math.random() * 0.2,
      speed: 0.5 + Math.random() * 0.5
    })
  }
}

function initClouds(count) {
  for (let i = 0; i < count; i++) {
    particles.clouds.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height * 0.6,
      width: 100 + Math.random() * 200,
      height: 50 + Math.random() * 80,
      speed: 0.2 + Math.random() * 0.5,
      opacity: 0.3 + Math.random() * 0.4,
      color: `rgba(255, 255, 255, ${0.6 + Math.random() * 0.4})`
    })
  }
}

function initRainDrops(count) {
  for (let i = 0; i < count; i++) {
    particles.rainDrops.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      length: 10 + Math.random() * 20,
      speed: 8 + Math.random() * 8,
      opacity: 0.3 + Math.random() * 0.5
    })
  }
}

function initSnowFlakes(count) {
  for (let i = 0; i < count; i++) {
    particles.snowFlakes.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: 2 + Math.random() * 6,
      speed: 0.5 + Math.random() * 2,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.05,
      sway: Math.random() * 2,
      swaySpeed: 0.02 + Math.random() * 0.03,
      opacity: 0.6 + Math.random() * 0.4
    })
  }
}

function initLightning() {
  particles.lightning.push({
    flashTimer: 0,
    flashDuration: 0,
    nextFlash: 60 + Math.random() * 120,
    opacity: 0,
    branches: []
  })
}

function generateLightningBranches(startX, startY) {
  const branches = []
  const segments = 4 + Math.floor(Math.random() * 4)
  let currentX = startX
  let currentY = startY
  
  for (let i = 0; i < segments; i++) {
    const endX = currentX + (Math.random() - 0.5) * 80
    const endY = currentY + canvas.height / segments + Math.random() * 50
    
    branches.push({
      startX: currentX,
      startY: currentY,
      endX: Math.min(Math.max(endX, 50), canvas.width - 50),
      endY: Math.min(endY, canvas.height)
    })
    
    currentX = endX
    currentY = endY
  }
  
  return branches
}

function drawSunRays() {
  const centerX = canvas.width * 0.8
  const centerY = canvas.height * 0.2
  
  const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 200)
  gradient.addColorStop(0, 'rgba(255, 220, 100, 0.4)')
  gradient.addColorStop(0.3, 'rgba(255, 200, 80, 0.2)')
  gradient.addColorStop(1, 'rgba(255, 180, 50, 0)')
  
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(centerX, centerY, 200, 0, Math.PI * 2)
  ctx.fill()
  
  particles.sunRays.forEach((ray) => {
    ray.length += ray.speed
    if (ray.length > ray.maxLength) {
      ray.length = 0
    }
    
    const endX = centerX + Math.cos(ray.angle) * ray.length
    const endY = centerY + Math.sin(ray.angle) * ray.length
    
    const rayGradient = ctx.createLinearGradient(centerX, centerY, endX, endY)
    rayGradient.addColorStop(0, `rgba(255, 220, 100, ${ray.opacity})`)
    rayGradient.addColorStop(1, 'rgba(255, 220, 100, 0)')
    
    ctx.strokeStyle = rayGradient
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(centerX, centerY)
    ctx.lineTo(endX, endY)
    ctx.stroke()
  })
}

function drawCloud(cloud) {
  ctx.save()
  ctx.globalAlpha = cloud.opacity
  
  const circles = [
    { x: 0, y: 0, r: cloud.height * 0.5 },
    { x: cloud.width * 0.3, y: -cloud.height * 0.15, r: cloud.height * 0.4 },
    { x: cloud.width * 0.5, y: 0, r: cloud.height * 0.45 },
    { x: cloud.width * 0.7, y: -cloud.height * 0.1, r: cloud.height * 0.35 },
    { x: cloud.width * 0.85, y: 0, r: cloud.height * 0.3 }
  ]
  
  ctx.fillStyle = cloud.color
  circles.forEach((circle) => {
    ctx.beginPath()
    ctx.arc(cloud.x + circle.x, cloud.y + circle.y, circle.r, 0, Math.PI * 2)
    ctx.fill()
  })
  
  ctx.restore()
}

function drawClouds() {
  particles.clouds.forEach((cloud) => {
    cloud.x += cloud.speed
    if (cloud.x > canvas.width + cloud.width) {
      cloud.x = -cloud.width
    }
    drawCloud(cloud)
  })
}

function drawRain() {
  particles.rainDrops.forEach((drop) => {
    drop.y += drop.speed
    drop.x += drop.speed * 0.3
    
    if (drop.y > canvas.height) {
      particles.splashes.push({
        x: drop.x,
        y: canvas.height - 10,
        particles: [
          { angle: -Math.PI * 0.7, speed: 2 + Math.random() * 2 },
          { angle: -Math.PI * 0.5, speed: 3 + Math.random() * 2 },
          { angle: -Math.PI * 0.3, speed: 2 + Math.random() * 2 }
        ],
        life: 20,
        maxLife: 20
      })
      
      drop.y = Math.random() * -100
      drop.x = Math.random() * canvas.width
    }
    
    ctx.save()
    ctx.globalAlpha = drop.opacity
    ctx.strokeStyle = 'rgba(180, 200, 255, 0.8)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(drop.x, drop.y)
    ctx.lineTo(drop.x + drop.length * 0.3, drop.y + drop.length)
    ctx.stroke()
    ctx.restore()
  })
  
  particles.splashes = particles.splashes.filter((splash) => {
    splash.life--
    const opacity = splash.life / splash.maxLife
    
    splash.particles.forEach((p) => {
      p.speed *= 0.95
      const x = splash.x + Math.cos(p.angle) * (splash.maxLife - splash.life) * p.speed
      const y = splash.y + Math.sin(p.angle) * (splash.maxLife - splash.life) * p.speed
      
      ctx.save()
      ctx.globalAlpha = opacity * 0.8
      ctx.fillStyle = 'rgba(180, 200, 255, 0.6)'
      ctx.beginPath()
      ctx.arc(x, y, 1.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    })
    
    return splash.life > 0
  })
}

function drawSnow() {
  const snowDrifts = []
  const driftSections = Math.ceil(canvas.width / 100)
  for (let i = 0; i < driftSections; i++) {
    snowDrifts.push({
      x: i * 100,
      height: 20 + Math.sin(i * 0.5) * 10 + Math.random() * 5
    })
  }
  
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
  ctx.beginPath()
  ctx.moveTo(0, canvas.height)
  
  snowDrifts.forEach((drift, index) => {
    const nextDrift = snowDrifts[index + 1]
    if (nextDrift) {
      const midX = (drift.x + nextDrift.x) / 2
      const midHeight = (drift.height + nextDrift.height) / 2
      ctx.quadraticCurveTo(
        midX,
        canvas.height - midHeight - 5,
        nextDrift.x,
        canvas.height - nextDrift.height
      )
    }
  })
  
  ctx.lineTo(canvas.width, canvas.height)
  ctx.closePath()
  ctx.fill()
  
  particles.snowFlakes.forEach((flake) => {
    flake.y += flake.speed
    flake.x += Math.sin(flake.sway) * flake.swaySpeed * 10
    flake.sway += flake.swaySpeed
    flake.rotation += flake.rotationSpeed
    
    if (flake.y > canvas.height - 30) {
      flake.y = Math.random() * -50
      flake.x = Math.random() * canvas.width
    }
    
    ctx.save()
    ctx.translate(flake.x, flake.y)
    ctx.rotate(flake.rotation)
    ctx.globalAlpha = flake.opacity
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)'
    ctx.lineWidth = 1.5
    ctx.lineCap = 'round'
    
    for (let i = 0; i < 6; i++) {
      ctx.save()
      ctx.rotate((i * Math.PI) / 3)
      
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(0, -flake.size)
      ctx.stroke()
      
      ctx.beginPath()
      ctx.moveTo(0, -flake.size * 0.5)
      ctx.lineTo(flake.size * 0.3, -flake.size * 0.7)
      ctx.stroke()
      
      ctx.beginPath()
      ctx.moveTo(0, -flake.size * 0.5)
      ctx.lineTo(-flake.size * 0.3, -flake.size * 0.7)
      ctx.stroke()
      
      ctx.restore()
    }
    
    ctx.restore()
  })
}

function drawLightning() {
  const lightning = particles.lightning[0]
  if (!lightning) return
  
  lightning.flashTimer++
  
  if (lightning.flashTimer >= lightning.nextFlash) {
    lightning.flashDuration = 8
    lightning.flashTimer = 0
    lightning.nextFlash = 60 + Math.random() * 120
    lightning.branches = generateLightningBranches(
      100 + Math.random() * (canvas.width - 200),
      0
    )
  }
  
  if (lightning.flashDuration > 0) {
    lightning.flashDuration--
    const flashOpacity = Math.min(1, lightning.flashDuration / 4)
    
    ctx.fillStyle = `rgba(255, 255, 255, ${flashOpacity * 0.15})`
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    if (lightning.branches.length > 0) {
      ctx.save()
      ctx.strokeStyle = `rgba(255, 255, 200, ${flashOpacity})`
      ctx.lineWidth = 3
      ctx.shadowColor = '#fff'
      ctx.shadowBlur = 20
      
      lightning.branches.forEach((branch) => {
        ctx.beginPath()
        ctx.moveTo(branch.startX, branch.startY)
        ctx.lineTo(branch.endX, branch.endY)
        ctx.stroke()
      })
      
      ctx.restore()
    }
  }
}

function drawWind() {
  const weatherType = props.weatherData?.weatherType
  const speed = 3 + Math.random() * 3
  
  const lineCount = 15
  while (particles.windLines.length < lineCount) {
    particles.windLines.push({
      x: -100,
      y: Math.random() * canvas.height,
      length: 50 + Math.random() * 100,
      opacity: 0.1 + Math.random() * 0.3,
      speed: speed
    })
  }
  
  particles.windLines = particles.windLines.filter((line) => {
    line.x += line.speed
    line.y += Math.sin(line.x * 0.01) * 0.5
    
    if (line.x > canvas.width + 100) {
      return false
    }
    
    ctx.save()
    ctx.strokeStyle = `rgba(255, 255, 255, ${line.opacity})`
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(line.x, line.y)
    ctx.lineTo(line.x - line.length, line.y)
    ctx.stroke()
    ctx.restore()
    
    return true
  })
}

function animate() {
  if (!ctx || !canvas) return
  
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  
  const weatherType = props.weatherData?.weatherType || 'sunny'
  
  if (['sunny', 'partlyCloudy'].includes(weatherType)) {
    drawSunRays()
  }
  
  if (['cloudy', 'partlyCloudy', 'fog', 'sunny'].includes(weatherType)) {
    drawClouds()
  }
  
  if (['rain', 'drizzle', 'thunderstorm'].includes(weatherType)) {
    drawRain()
    drawClouds()
  }
  
  if (['snow'].includes(weatherType)) {
    drawSnow()
    drawClouds()
  }
  
  if (['thunderstorm'].includes(weatherType)) {
    drawLightning()
  }
  
  if (weatherType !== 'sunny') {
    drawWind()
  }
  
  animationId = requestAnimationFrame(animate)
}

function stopAnimation() {
  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
}

function handleResize() {
  if (canvas) {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    initParticles()
  }
}

watch(() => props.visible, (newVal) => {
  if (newVal) {
    initCanvas()
    animate()
  } else {
    stopAnimation()
  }
})

watch(() => props.weatherData, () => {
  if (props.visible) {
    initParticles()
  }
})

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  stopAnimation()
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.weather-animation-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  overflow: hidden;
  cursor: pointer;
}

.weather-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 2;
}

.weather-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  transition: background 1s ease;
}

.weather-bg.sunny {
  background: linear-gradient(180deg, #87CEEB 0%, #B0E0E6 50%, #E0F7FA 100%);
}

.weather-bg.partlyCloudy {
  background: linear-gradient(180deg, #87CEEB 0%, #B0C4DE 50%, #D3D3D3 100%);
}

.weather-bg.cloudy {
  background: linear-gradient(180deg, #708090 0%, #A9A9A9 50%, #C0C0C0 100%);
}

.weather-bg.fog {
  background: linear-gradient(180deg, #B0C4DE 0%, #D3D3D3 50%, #E8E8E8 100%);
}

.weather-bg.rain,
.weather-bg.drizzle {
  background: linear-gradient(180deg, #4A5568 0%, #2D3748 50%, #1A202C 100%);
}

.weather-bg.snow {
  background: linear-gradient(180deg, #B0C4DE 0%, #D3D3D3 50%, #E8E8E8 100%);
}

.weather-bg.thunderstorm {
  background: linear-gradient(180deg, #1A1A2E 0%, #16213E 50%, #0F0F1A 100%);
}

.weather-info {
  position: absolute;
  top: 20%;
  left: 50%;
  transform: translateX(-50%);
  z-index: 3;
  text-align: center;
  color: white;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  pointer-events: none;
}

.weather-icon {
  font-size: 120px;
  margin-bottom: 20px;
  animation: float 3s ease-in-out infinite;
}

.weather-description {
  font-size: 32px;
  font-weight: 300;
  margin-bottom: 10px;
}

.weather-temperature {
  display: flex;
  justify-content: center;
  align-items: baseline;
  gap: 10px;
}

.temp-max {
  font-size: 48px;
  font-weight: 500;
}

.temp-separator {
  font-size: 24px;
  opacity: 0.7;
}

.temp-min {
  font-size: 32px;
  font-weight: 300;
  opacity: 0.8;
}

.weather-close-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  transition: all 0.3s ease;
}

.weather-close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.weather-close-btn svg {
  width: 24px;
  height: 24px;
  color: white;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.weather-fade-enter-active,
.weather-fade-leave-active {
  transition: opacity 0.4s ease;
}

.weather-fade-enter-from,
.weather-fade-leave-to {
  opacity: 0;
}
</style>
