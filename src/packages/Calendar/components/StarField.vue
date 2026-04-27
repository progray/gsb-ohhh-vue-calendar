<template>
  <div class="star-field" ref="containerRef">
    <canvas ref="canvasRef"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const containerRef = ref(null)
const canvasRef = ref(null)
let animationId = null
let stars = []

class Star {
  constructor(canvasWidth, canvasHeight) {
    this.x = Math.random() * canvasWidth
    this.y = Math.random() * canvasHeight
    this.size = Math.random() * 2 + 0.5
    this.speedX = (Math.random() - 0.5) * 0.3
    this.speedY = (Math.random() - 0.5) * 0.3
    this.opacity = Math.random() * 0.8 + 0.2
    this.twinkleSpeed = Math.random() * 0.02 + 0.005
    this.twinkleDirection = Math.random() > 0.5 ? 1 : -1
    this.color = this.getRandomColor()
  }

  getRandomColor() {
    const colors = [
      { r: 255, g: 255, b: 255 },
      { r: 200, g: 220, b: 255 },
      { r: 255, g: 240, b: 200 },
      { r: 180, g: 200, b: 255 }
    ]
    return colors[Math.floor(Math.random() * colors.length)]
  }

  update(canvasWidth, canvasHeight) {
    this.x += this.speedX
    this.y += this.speedY

    if (this.x < 0) this.x = canvasWidth
    if (this.x > canvasWidth) this.x = 0
    if (this.y < 0) this.y = canvasHeight
    if (this.y > canvasHeight) this.y = 0

    this.opacity += this.twinkleSpeed * this.twinkleDirection
    if (this.opacity >= 1) {
      this.opacity = 1
      this.twinkleDirection = -1
    } else if (this.opacity <= 0.1) {
      this.opacity = 0.1
      this.twinkleDirection = 1
    }
  }

  draw(ctx) {
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.opacity})`
    ctx.fill()

    if (this.size > 1.5) {
      ctx.beginPath()
      ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.opacity * 0.2})`
      ctx.fill()
    }
  }
}

function initStars(count, canvasWidth, canvasHeight) {
  stars = []
  for (let i = 0; i < count; i++) {
    stars.push(new Star(canvasWidth, canvasHeight))
  }
}

function animate(ctx, canvasWidth, canvasHeight) {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight)

  stars.forEach(star => {
    star.update(canvasWidth, canvasHeight)
    star.draw(ctx)
  })

  animationId = requestAnimationFrame(() => animate(ctx, canvasWidth, canvasHeight))
}

function resizeCanvas(canvas, container) {
  if (!canvas || !container) return
  const rect = container.getBoundingClientRect()
  canvas.width = rect.width
  canvas.height = rect.height
}

onMounted(() => {
  const canvas = canvasRef.value
  const container = containerRef.value
  if (!canvas || !container) return

  const ctx = canvas.getContext('2d')
  resizeCanvas(canvas, container)

  const starCount = Math.floor((canvas.width * canvas.height) / 8000)
  initStars(Math.max(starCount, 50), canvas.width, canvas.height)

  animate(ctx, canvas.width, canvas.height)

  const handleResize = () => {
    resizeCanvas(canvas, container)
    const newStarCount = Math.floor((canvas.width * canvas.height) / 8000)
    initStars(Math.max(newStarCount, 50), canvas.width, canvas.height)
  }

  window.addEventListener('resize', handleResize)
  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    if (animationId) {
      cancelAnimationFrame(animationId)
    }
  })
})
</script>

<style lang="scss" scoped>
.star-field {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;

  canvas {
    width: 100%;
    height: 100%;
  }
}
</style>
