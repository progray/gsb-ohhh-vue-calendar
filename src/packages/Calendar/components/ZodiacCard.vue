<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="zodiac-card-overlay"
      @click.self="closeCard"
    >
      <div
        class="zodiac-card-wrapper"
        :style="cardStyle"
        ref="cardRef"
      >
            <button class="zodiac-card-close" @click="closeCard">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            <div class="zodiac-card-content">
              <div class="zodiac-card-icon-wrapper">
                <div
                  class="zodiac-card-icon"
                  :style="{ color: 'white' }"
                  v-html="zodiacIcon"
                ></div>
              </div>

              <div class="zodiac-card-name">{{ zodiac?.name }}</div>
              <div class="zodiac-card-date">{{ zodiac?.dateRange }}</div>

              <div class="zodiac-card-info">
                <div class="zodiac-card-info-item">
                  <span class="zodiac-card-info-label">元素属性</span>
                  <span class="zodiac-card-info-value">{{ zodiac?.element }}</span>
                </div>
                <div class="zodiac-card-info-item">
                  <span class="zodiac-card-info-label">守护星</span>
                  <span class="zodiac-card-info-value">{{ zodiac?.rulingPlanet }}</span>
                </div>
              </div>

              <div class="zodiac-keywords">
                <span
                  v-for="(keyword, index) in zodiac?.keywords"
                  :key="index"
                  class="zodiac-keyword"
                  :style="{ background: 'rgba(255,255,255,0.2)' }"
                >
                  {{ keyword }}
                </span>
              </div>

              <div class="zodiac-card-footer">
                <button class="zodiac-card-copy-btn" @click="copyCard" :disabled="copying">
                  <svg v-if="!copying" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12,6 12,12 16,14"></polyline>
                  </svg>
                  <span>{{ copying ? '复制中...' : '复制卡片' }}</span>
                </button>
              </div>
            </div>
          </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { zodiacData } from '../utils/zodiacData.js'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  selectedDate: {
    type: Date,
    default: null
  }
})

const emit = defineEmits(['close'])

const cardRef = ref(null)
const copying = ref(false)
const zodiacIcons = ref({})

const zodiac = computed(() => {
  if (!props.selectedDate) return null

  const month = props.selectedDate.getMonth() + 1
  const day = props.selectedDate.getDate()

  for (const z of zodiacData) {
    if (isDateInRange(month, day, z.startMonth, z.startDay, z.endMonth, z.endDay)) {
      return z
    }
  }
  return null
})

const zodiacIcon = computed(() => {
  return zodiacIcons.value[zodiac.value?.iconName] || ''
})

const cardStyle = computed(() => {
  if (!zodiac.value) return {}
  return {
    background: `linear-gradient(135deg, ${zodiac.value.gradient.from} 0%, ${zodiac.value.gradient.to} 100%)`
  }
})

function isDateInRange(month, day, startMonth, startDay, endMonth, endDay) {
  if (startMonth <= endMonth) {
    return (
      (month > startMonth || (month === startMonth && day >= startDay)) &&
      (month < endMonth || (month === endMonth && day <= endDay))
    )
  } else {
    return (
      (month > startMonth || (month === startMonth && day >= startDay)) ||
      (month < endMonth || (month === endMonth && day <= endDay))
    )
  }
}

function closeCard() {
  emit('close')
}

async function loadZodiacIcons() {
  const modules = import.meta.glob('../assets/zodiac/*.svg', { eager: true, query: '?raw', import: 'default' })
  const icons = {}
  for (const [path, raw] of Object.entries(modules)) {
    const name = path
      .split('/')
      .pop()
      .replace('.svg', '')
    icons[name] = raw
  }
  zodiacIcons.value = icons
}

loadZodiacIcons()

async function copyCard() {
  if (!cardRef.value || copying.value) return

  copying.value = true
  try {
    const canvas = await createCanvasFromElement(cardRef.value)
    const pngBlob = await canvasToPNG(canvas)
    await copyImageToClipboard(pngBlob)
    alert('卡片已复制到剪贴板！')
  } catch (error) {
    console.error('复制失败:', error)
    alert('复制失败，请重试')
  } finally {
    copying.value = false
  }
}

function drawRoundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
  ctx.lineTo(x + width, y + height - radius)
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  ctx.lineTo(x + radius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split('')
  let line = ''
  let lines = []
  
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n]
    const metrics = ctx.measureText(testLine)
    const testWidth = metrics.width
    if (testWidth > maxWidth && n > 0) {
      lines.push(line)
      line = words[n]
    } else {
      line = testLine
    }
  }
  lines.push(line)
  
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], x, y + (i * lineHeight))
  }
  return lines.length
}

async function createCanvasFromElement(element) {
  const cardWidth = 360
  const cardHeight = 560
  const dpr = window.devicePixelRatio || 2

  const canvas = document.createElement('canvas')
  canvas.width = cardWidth * dpr
  canvas.height = cardHeight * dpr

  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)

  const gradient = ctx.createLinearGradient(0, 0, cardWidth, cardHeight)
  gradient.addColorStop(0, zodiac.value.gradient.from)
  gradient.addColorStop(1, zodiac.value.gradient.to)

  const borderRadius = 24
  ctx.fillStyle = gradient
  drawRoundRect(ctx, 0, 0, cardWidth, cardHeight, borderRadius)
  ctx.fill()

  ctx.save()
  ctx.beginPath()
  drawRoundRect(ctx, 0, 0, cardWidth, cardHeight, borderRadius)
  ctx.clip()

  const closeBtnX = cardWidth - 16 - 36
  const closeBtnY = 16
  const closeBtnSize = 36
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)'
  ctx.beginPath()
  ctx.arc(closeBtnX + closeBtnSize / 2, closeBtnY + closeBtnSize / 2, closeBtnSize / 2, 0, Math.PI * 2)
  ctx.fill()

  ctx.strokeStyle = 'white'
  ctx.lineWidth = 2
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(closeBtnX + 10, closeBtnY + 10)
  ctx.lineTo(closeBtnX + 26, closeBtnY + 26)
  ctx.moveTo(closeBtnX + 26, closeBtnY + 10)
  ctx.lineTo(closeBtnX + 10, closeBtnY + 26)
  ctx.stroke()

  const iconX = cardWidth / 2 - 60
  const iconY = 40
  const iconSize = 120
  
  if (zodiacIcon.value) {
    try {
      const svgString = zodiacIcon.value
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(svgBlob)
      
      const img = new Image()
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
        img.src = url
      })
      
      ctx.fillStyle = 'white'
      ctx.drawImage(img, iconX, iconY, iconSize, iconSize)
      URL.revokeObjectURL(url)
    } catch (e) {
      console.log('SVG绘制失败，使用备用方案')
    }
  }

  ctx.fillStyle = 'white'
  ctx.textAlign = 'center'
  
  const nameY = iconY + iconSize + 20
  ctx.font = 'bold 32px "Microsoft Yahei", sans-serif'
  ctx.shadowColor = 'rgba(0, 0, 0, 0.2)'
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 2
  ctx.shadowBlur = 8
  ctx.fillText(zodiac.value.name, cardWidth / 2, nameY)
  ctx.shadowBlur = 0
  ctx.shadowOffsetY = 0

  const dateY = nameY + 28
  ctx.font = '16px "Microsoft Yahei", sans-serif'
  ctx.globalAlpha = 0.9
  ctx.fillText(zodiac.value.dateRange, cardWidth / 2, dateY)
  ctx.globalAlpha = 1

  const infoBoxX = 32
  const infoBoxY = dateY + 32
  const infoBoxWidth = cardWidth - 64
  const infoBoxHeight = 80
  const infoBoxRadius = 16
  
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
  drawRoundRect(ctx, infoBoxX, infoBoxY, infoBoxWidth, infoBoxHeight, infoBoxRadius)
  ctx.fill()

  ctx.textAlign = 'center'
  const leftInfoX = cardWidth / 2 - 50
  const rightInfoX = cardWidth / 2 + 50
  const infoLabelY = infoBoxY + 25
  const infoValueY = infoBoxY + 55

  ctx.font = '12px "Microsoft Yahei", sans-serif'
  ctx.globalAlpha = 0.7
  ctx.fillText('元素属性', leftInfoX, infoLabelY)
  ctx.fillText('守护星', rightInfoX, infoLabelY)
  ctx.globalAlpha = 1

  ctx.font = 'bold 16px "Microsoft Yahei", sans-serif'
  ctx.globalAlpha = 1
  ctx.fillText(zodiac.value.element, leftInfoX, infoValueY)
  ctx.fillText(zodiac.value.rulingPlanet, rightInfoX, infoValueY)
  ctx.globalAlpha = 1

  const keywordsY = infoBoxY + infoBoxHeight + 24
  const keywords = zodiac.value.keywords
  
  ctx.textAlign = 'center'
  ctx.font = '13px "Microsoft Yahei", sans-serif'
  ctx.fontWeight = '500'
  
  const keywordPaddingX = 14
  const keywordPaddingY = 6
  const keywordGap = 8
  const keywordRadius = 20
  
  let totalWidth = 0
  keywords.forEach((kw, i) => {
    const metrics = ctx.measureText(kw)
    totalWidth += metrics.width + keywordPaddingX * 2
    if (i < keywords.length - 1) totalWidth += keywordGap
  })
  
  let keywordX = (cardWidth - totalWidth) / 2
  const keywordY = keywordsY
  
  keywords.forEach((kw) => {
    const metrics = ctx.measureText(kw)
    const kwWidth = metrics.width + keywordPaddingX * 2
    const kwHeight = 26
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'
    drawRoundRect(ctx, keywordX, keywordY, kwWidth, kwHeight, keywordRadius)
    ctx.fill()
    
    ctx.fillStyle = 'white'
    ctx.globalAlpha = 1
    ctx.fillText(kw, keywordX + kwWidth / 2, keywordY + 17)
    
    keywordX += kwWidth + keywordGap
  })
  ctx.globalAlpha = 1

  const footerY = keywordsY + 60
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(32, footerY)
  ctx.lineTo(cardWidth - 32, footerY)
  ctx.stroke()

  const btnY = footerY + 16
  const btnText = '复制卡片'
  ctx.font = '14px "Microsoft Yahei", sans-serif'
  const btnMetrics = ctx.measureText(btnText)
  const iconBtnWidth = 18
  const btnGap = 8
  const btnPaddingX = 32
  const btnPaddingY = 14
  const btnWidth = iconBtnWidth + btnGap + btnMetrics.width + btnPaddingX * 2
  const btnHeight = btnPaddingY * 2 + 1
  const btnX = (cardWidth - btnWidth) / 2
  const btnRadius = 12
  
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'
  drawRoundRect(ctx, btnX, btnY, btnWidth, 44, btnRadius)
  ctx.fill()
  
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
  ctx.lineWidth = 1
  drawRoundRect(ctx, btnX, btnY, btnWidth, 44, btnRadius)
  ctx.stroke()

  ctx.strokeStyle = 'white'
  ctx.fillStyle = 'white'
  ctx.lineWidth = 2
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  
  const copyIconX = btnX + btnPaddingX
  const copyIconY = btnY + 14
  const copyIconSize = 16
  
  ctx.strokeRect(copyIconX + 2, copyIconY + 2, copyIconSize - 4, copyIconSize - 4)
  ctx.beginPath()
  ctx.moveTo(copyIconX, copyIconY + 4)
  ctx.lineTo(copyIconX - 2, copyIconY + 4)
  ctx.lineTo(copyIconX - 2, copyIconY - 8)
  ctx.lineTo(copyIconX + 10, copyIconY - 8)
  ctx.lineTo(copyIconX + 10, copyIconY - 6)
  ctx.stroke()

  ctx.fillStyle = 'white'
  ctx.textAlign = 'left'
  ctx.font = 'bold 15px "Microsoft Yahei", sans-serif'
  ctx.globalAlpha = 1
  ctx.fillText(btnText, btnX + btnPaddingX + iconBtnWidth + btnGap, btnY + 29)
  ctx.globalAlpha = 1

  ctx.restore()

  return canvas
}

async function canvasToPNG(canvas) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob)
    }, 'image/png')
  })
}

async function copyImageToClipboard(blob) {
  if (navigator.clipboard && window.ClipboardItem) {
    try {
      const item = new ClipboardItem({ 'image/png': blob })
      await navigator.clipboard.write([item])
      return
    } catch (e) {
      console.log('Clipboard API failed, trying fallback')
    }
  }

  const link = document.createElement('a')
  link.download = `${zodiac.value?.name || 'zodiac'}-card.png`
  link.href = URL.createObjectURL(blob)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(link.href)
}

function handleEscape(e) {
  if (e.key === 'Escape') {
    closeCard()
  }
}

watch(
  () => props.visible,
  (val) => {
    if (val) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    } else {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }
)

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape)
  document.body.style.overflow = ''
})
</script>

<style scoped>
.zodiac-card-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  z-index: 9999;
  display: grid;
  place-items: center;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 24px;
  box-sizing: border-box;
}

@supports not (display: grid) {
  .zodiac-card-overlay {
    display: flex;
    justify-content: center;
    align-items: center;
  }
}

@media (max-height: 620px) {
  .zodiac-card-overlay {
    place-items: start center;
    align-items: flex-start;
    padding-top: 24px;
  }
}

.zodiac-overlay-enter-active,
.zodiac-overlay-leave-active {
  transition: opacity 0.3s ease;
}

.zodiac-overlay-enter-from,
.zodiac-overlay-leave-to {
  opacity: 0;
}

.zodiac-card-wrapper {
  position: relative;
  width: 360px;
  min-height: 480px;
  border-radius: 24px;
  box-shadow:
    0 25px 50px -12px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.1) inset;
  overflow: hidden;
}

.zodiac-card-enter-active,
.zodiac-card-leave-active {
  transition:
    transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
    opacity 0.3s ease;
}

.zodiac-card-enter-from,
.zodiac-card-leave-to {
  opacity: 0;
  transform: scale(0.9) translateY(20px);
}

.zodiac-card-close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 36px;
  height: 36px;
  border: none;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.2s ease;
  z-index: 10;
  color: white;
}

.zodiac-card-close:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: rotate(90deg);
}

.zodiac-card-close svg {
  width: 20px;
  height: 20px;
}

.zodiac-card-content {
  padding: 40px 32px 32px;
  text-align: center;
  color: white;
}

.zodiac-card-icon-wrapper {
  margin-bottom: 20px;
}

.zodiac-card-icon {
  width: 120px;
  height: 120px;
  margin: 0 auto;
  display: flex;
  justify-content: center;
  align-items: center;
}

.zodiac-card-icon :deep(svg) {
  width: 100%;
  height: 100%;
}

.zodiac-card-name {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 8px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.zodiac-card-date {
  font-size: 16px;
  opacity: 0.9;
  margin-bottom: 24px;
}

.zodiac-card-info {
  display: flex;
  justify-content: center;
  gap: 32px;
  margin-bottom: 24px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  backdrop-filter: blur(10px);
}

.zodiac-card-info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.zodiac-card-info-label {
  font-size: 12px;
  opacity: 0.7;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.zodiac-card-info-value {
  font-size: 16px;
  font-weight: 600;
}

.zodiac-keywords {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin-bottom: 32px;
}

.zodiac-keyword {
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  backdrop-filter: blur(10px);
  white-space: nowrap;
}

.zodiac-card-footer {
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.15);
}

.zodiac-card-copy-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 32px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  color: white;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.zodiac-card-copy-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
}

.zodiac-card-copy-btn:active:not(:disabled) {
  transform: translateY(0);
}

.zodiac-card-copy-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.zodiac-card-copy-btn svg {
  width: 18px;
  height: 18px;
}

.zodiac-card-copy-btn svg:last-child {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
