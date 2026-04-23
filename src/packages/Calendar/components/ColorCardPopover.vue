<template>
  <Teleport to="body">
    <div v-if="visible" class="color-card-overlay" @click="handleOverlayClick">
      <div class="color-card-popover" @click.stop :style="popoverStyle">
        <div class="color-card-close" @click="$emit('close')">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </div>
        
        <div class="color-card-preview" :style="{ background: colorInfo?.hsl }">
          <div class="color-card-date">{{ colorInfo?.date }}</div>
        </div>
        
        <div class="color-card-info">
          <div class="color-card-name">{{ colorInfo?.name }}</div>
          
          <div class="color-card-values">
            <div class="color-card-value">
              <span class="color-card-value-label">HEX</span>
              <span class="color-card-value-text">{{ colorInfo?.hex }}</span>
            </div>
            <div class="color-card-value">
              <span class="color-card-value-label">RGB</span>
              <span class="color-card-value-text">{{ colorInfo?.rgb }}</span>
            </div>
            <div class="color-card-value">
              <span class="color-card-value-label">HSL</span>
              <span class="color-card-value-text">{{ colorInfo?.hsl }}</span>
            </div>
          </div>
          
          <div class="color-card-suggestions" v-if="colorInfo">
            <div class="color-card-suggestions-title">推荐搭配</div>
            <div class="color-card-suggestions-list">
              <div class="color-card-suggestion">
                <div class="color-card-suggestion-color" :style="{ background: colorInfo.complementary.hsl }"></div>
                <div class="color-card-suggestion-info">
                  <div class="color-card-suggestion-label">互补色</div>
                  <div class="color-card-suggestion-value">{{ colorInfo.complementary.hex }}</div>
                </div>
              </div>
              <div class="color-card-suggestion">
                <div class="color-card-suggestion-color" :style="{ background: colorInfo.analogous[0]?.hsl }"></div>
                <div class="color-card-suggestion-info">
                  <div class="color-card-suggestion-label">邻近色</div>
                  <div class="color-card-suggestion-value">{{ colorInfo.analogous[0]?.hex }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="color-card-footer">
          <button class="color-card-copy-btn" @click="copyToClipboard">
            <svg v-if="!copied" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            <svg v-else viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>{{ copied ? '已复制' : '复制全部' }}</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  colorInfo: {
    type: Object,
    default: null
  },
  position: {
    type: Object,
    default: () => ({ x: 0, y: 0 })
  }
})

const emit = defineEmits(['close'])

const copied = ref(false)

const popoverStyle = computed(() => {
  return {
    left: `${props.position.x}px`,
    top: `${props.position.y}px`
  }
})

function handleOverlayClick() {
  emit('close')
}

function copyToClipboard() {
  if (!props.colorInfo) return
  
  const text = `日期：${props.colorInfo.date}
颜色名：${props.colorInfo.name}
HEX：${props.colorInfo.hex}
RGB：${props.colorInfo.rgb}
HSL：${props.colorInfo.hsl}
互补色：${props.colorInfo.complementary.hex}
邻近色：${props.colorInfo.analogous[0]?.hex || ''}`
  
  navigator.clipboard.writeText(text).then(() => {
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  })
}

function handleEscKey(event) {
  if (event.key === 'Escape') {
    emit('close')
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleEscKey)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscKey)
})
</script>

<style scoped>
.color-card-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(2px);
}

.color-card-popover {
  position: relative;
  width: 320px;
  max-width: 90vw;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 20px;
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.15),
    0 8px 25px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(255, 255, 255, 0.5) inset;
  overflow: hidden;
  animation: popoverIn 0.3s ease-out;
}

@keyframes popoverIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.color-card-close {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 10;
  width: 32px;
  height: 32px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(4px);
  border-radius: 50%;
  cursor: pointer;
  color: #606266;
  transition: all 0.2s ease;
}

.color-card-close:hover {
  background: rgba(255, 255, 255, 1);
  color: #303133;
  transform: rotate(90deg);
}

.color-card-preview {
  position: relative;
  height: 160px;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.color-card-date {
  position: absolute;
  bottom: 16px;
  left: 20px;
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.95);
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.color-card-info {
  padding: 20px;
}

.color-card-name {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
  letter-spacing: 2px;
}

.color-card-values {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}

.color-card-value {
  display: flex;
  align-items: center;
  gap: 12px;
}

.color-card-value-label {
  min-width: 40px;
  font-size: 12px;
  font-weight: 600;
  color: #909399;
  text-transform: uppercase;
}

.color-card-value-text {
  font-size: 14px;
  font-weight: 500;
  color: #606266;
  font-family: 'Monaco', 'Menlo', monospace;
}

.color-card-suggestions-title {
  font-size: 13px;
  font-weight: 600;
  color: #909399;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.color-card-suggestions-list {
  display: flex;
  gap: 16px;
}

.color-card-suggestion {
  display: flex;
  align-items: center;
  gap: 10px;
}

.color-card-suggestion-color {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.color-card-suggestion-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.color-card-suggestion-label {
  font-size: 11px;
  color: #909399;
}

.color-card-suggestion-value {
  font-size: 13px;
  font-weight: 500;
  color: #606266;
  font-family: 'Monaco', 'Menlo', monospace;
}

.color-card-footer {
  padding: 16px 20px 20px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.color-card-copy-btn {
  width: 100%;
  height: 44px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  background: #409eff;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.color-card-copy-btn:hover {
  background: #66b1ff;
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(64, 158, 255, 0.4);
}

.color-card-copy-btn:active {
  transform: translateY(0);
}
</style>
