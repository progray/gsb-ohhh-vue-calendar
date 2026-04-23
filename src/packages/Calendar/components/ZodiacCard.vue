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
                  :style="{ color: zodiac?.elementColor }"
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

async function createCanvasFromElement(element) {
  const rect = element.getBoundingClientRect()
  const width = Math.ceil(rect.width * window.devicePixelRatio)
  const height = Math.ceil(rect.height * window.devicePixelRatio)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

  const gradient = ctx.createLinearGradient(0, 0, rect.width, rect.height)
  gradient.addColorStop(0, zodiac.value.gradient.from)
  gradient.addColorStop(1, zodiac.value.gradient.to)

  const borderRadius = 24
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.moveTo(borderRadius, 0)
  ctx.lineTo(rect.width - borderRadius, 0)
  ctx.quadraticCurveTo(rect.width, 0, rect.width, borderRadius)
  ctx.lineTo(rect.width, rect.height - borderRadius)
  ctx.quadraticCurveTo(rect.width, rect.height, rect.width - borderRadius, rect.height)
  ctx.lineTo(borderRadius, rect.height)
  ctx.quadraticCurveTo(0, rect.height, 0, rect.height - borderRadius)
  ctx.lineTo(0, borderRadius)
  ctx.quadraticCurveTo(0, 0, borderRadius, 0)
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = 'white'
  ctx.font = 'bold 32px "Microsoft Yahei", sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(zodiac.value.name, rect.width / 2, 100)

  ctx.font = '16px "Microsoft Yahei", sans-serif'
  ctx.globalAlpha = 0.9
  ctx.fillText(zodiac.value.dateRange, rect.width / 2, 130)
  ctx.globalAlpha = 1

  ctx.font = '14px "Microsoft Yahei", sans-serif'
  ctx.globalAlpha = 0.8
  ctx.fillText(`元素属性: ${zodiac.value.element}`, rect.width / 2, 165)
  ctx.fillText(`守护星: ${zodiac.value.rulingPlanet}`, rect.width / 2, 190)
  ctx.globalAlpha = 1

  const keywords = zodiac.value.keywords.join(' · ')
  ctx.font = '14px "Microsoft Yahei", sans-serif'
  ctx.globalAlpha = 0.7
  ctx.fillText(keywords, rect.width / 2, 225)
  ctx.globalAlpha = 1

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
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
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
