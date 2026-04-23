<template>
  <Teleport to="body">
    <Transition name="texture-card">
      <div v-if="visible" class="texture-card-overlay" @click="handleOverlayClick">
        <div class="texture-card-container" @click.stop>
          <button class="texture-card-close" @click="close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          
          <div class="texture-card-preview" :style="{ background: textureData?.dataUrl }">
            <div class="texture-card-preview-inner" :style="{ backgroundImage: `url(${textureData?.dataUrl})` }"></div>
          </div>
          
          <div class="texture-card-info">
            <div class="texture-card-header">
              <div class="texture-card-title">{{ textureData?.textureName }}</div>
              <div class="texture-card-date">{{ formattedDate }}</div>
            </div>
            
            <div class="texture-card-content-scroll">
              <div class="texture-card-colors">
                <div class="texture-card-color-section">
                  <div class="texture-card-color-label">主色调</div>
                  <div class="texture-card-color-row">
                    <div class="texture-card-color-item" v-for="(color, index) in mainColors" :key="index">
                      <div class="texture-card-color-swatch" :style="{ background: color }"></div>
                      <span class="texture-card-color-value">{{ color.toUpperCase() }}</span>
                    </div>
                  </div>
                </div>
                
                <div class="texture-card-color-section" v-if="accentColor">
                  <div class="texture-card-color-label">动态色</div>
                  <div class="texture-card-color-row">
                    <div class="texture-card-color-item">
                      <div class="texture-card-color-swatch" :style="{ background: accentColor }"></div>
                      <span class="texture-card-color-value">{{ accentColor.toUpperCase() }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="texture-card-actions">
              <button class="texture-card-btn texture-card-btn-primary" @click="copyTexture">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                <span>{{ copyButtonText }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  textureData: {
    type: Object,
    default: null
  },
  date: {
    type: Date,
    default: null
  }
})

const emit = defineEmits(['update:visible', 'close'])

const copyButtonText = ref('复制纹理图')

const formattedDate = computed(() => {
  if (!props.date) return ''
  const year = props.date.getFullYear()
  const month = props.date.getMonth() + 1
  const day = props.date.getDate()
  return `${year}年${month}月${day}日`
})

const mainColors = computed(() => {
  if (!props.textureData) return []
  const colors = []
  if (props.textureData.colors?.primary) {
    colors.push(props.textureData.colors.primary)
  }
  if (props.textureData.colors?.secondary) {
    colors.push(props.textureData.colors.secondary)
  }
  return colors
})

const accentColor = computed(() => {
  return props.textureData?.colors?.accent || null
})

function handleOverlayClick() {
  close()
}

function close() {
  emit('update:visible', false)
  emit('close')
}

async function copyTexture() {
  if (!props.textureData) return
  
  try {
    const response = await fetch(props.textureData.dataUrl)
    const blob = await response.blob()
    
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = async () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)
      
      canvas.toBlob(async (pngBlob) => {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({
              [pngBlob.type]: pngBlob
            })
          ])
          copyButtonText.value = '已复制!'
          setTimeout(() => {
            copyButtonText.value = '复制纹理图'
          }, 2000)
        } catch (err) {
          fallbackCopy()
        }
      }, 'image/png')
    }
    
    img.src = props.textureData.dataUrl
  } catch (err) {
    fallbackCopy()
  }
}

function fallbackCopy() {
  const link = document.createElement('a')
  link.href = props.textureData.dataUrl
  link.download = `texture-${Date.now()}.svg`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  copyButtonText.value = '已下载!'
  setTimeout(() => {
    copyButtonText.value = '复制纹理图'
  }, 2000)
}

watch(() => props.visible, (newVal) => {
  if (newVal) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})
</script>

<style scoped>
.texture-card-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  backdrop-filter: blur(4px);
}

.texture-card-container {
  position: relative;
  width: 320px;
  max-height: 90vh;
  min-height: 450px;
  max-width: 90vw;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  box-shadow: 
    0 25px 50px -12px rgba(0, 0, 0, 0.25),
    0 0 0 1px rgba(255, 255, 255, 0.5);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.texture-card-close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #666;
  transition: all 0.2s ease;
  z-index: 10;
}

.texture-card-close:hover {
  background: rgba(255, 255, 255, 1);
  color: #333;
  transform: rotate(90deg);
}

.texture-card-preview {
  position: relative;
  width: 100%;
  min-height: 160px;
  max-height: 220px;
  height: auto;
  aspect-ratio: 16 / 10;
  flex-shrink: 0;
  overflow: hidden;
}

.texture-card-preview-inner {
  position: absolute;
  inset: 0;
  background-repeat: repeat;
  background-size: 200px 200px;
}

.texture-card-info {
  padding: 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.texture-card-header {
  margin-bottom: 12px;
  flex-shrink: 0;
}

.texture-card-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 2px;
}

.texture-card-date {
  font-size: 12px;
  color: #909399;
}

.texture-card-content-scroll {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0;
  padding-right: 4px;
  margin-right: -4px;
}

.texture-card-colors {
  background: #f5f7fa;
  border-radius: 12px;
  padding: 14px 16px;
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.texture-card-color-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.texture-card-color-section:last-child {
  margin-bottom: 0;
}

.texture-card-color-label {
  font-size: 11px;
  font-weight: 500;
  color: #909399;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.texture-card-color-row {
  display: flex;
  gap: 16px;
}

.texture-card-color-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.texture-card-color-swatch {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  box-shadow: 
    0 2px 8px rgba(0, 0, 0, 0.1),
    inset 0 0 0 2px rgba(255, 255, 255, 0.5);
}

.texture-card-color-value {
  font-size: 10px;
  color: #606266;
  font-family: 'Monaco', 'Menlo', monospace;
}

.texture-card-actions {
  display: flex;
  gap: 12px;
  margin-top: 12px;
  flex-shrink: 0;
}

.texture-card-content-scroll::-webkit-scrollbar {
  width: 4px;
}

.texture-card-content-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.texture-card-content-scroll::-webkit-scrollbar-thumb {
  background: rgba(144, 147, 153, 0.3);
  border-radius: 2px;
}

.texture-card-content-scroll::-webkit-scrollbar-thumb:hover {
  background: rgba(144, 147, 153, 0.5);
}

.texture-card-btn {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.texture-card-btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.texture-card-btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
}

.texture-card-enter-active,
.texture-card-leave-active {
  transition: all 0.3s ease;
}

.texture-card-enter-from .texture-card-container,
.texture-card-leave-to .texture-card-container {
  opacity: 0;
  transform: scale(0.9) translateY(20px);
}

.texture-card-enter-from .texture-card-overlay,
.texture-card-leave-to .texture-card-overlay {
  opacity: 0;
}
</style>
