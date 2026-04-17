<template>
  <Teleport to="body">
    <Transition name="emoji-picker-fade">
      <div
        v-if="visible"
        class="emoji-picker-overlay"
        @click="handleOverlayClick"
      >
        <div
          ref="pickerRef"
          class="emoji-picker-container"
          :style="pickerStyle"
          @click.stop
        >
          <div class="emoji-picker-header">
            <span class="emoji-picker-title">选择表情</span>
            <button class="emoji-picker-close" @click="close">×</button>
          </div>
          
          <div class="emoji-picker-content">
            <button
              v-if="currentPage > 0"
              class="emoji-picker-nav emoji-picker-nav--prev"
              @click="prevPage"
            >
              ‹
            </button>
            
            <div class="emoji-picker-grid">
              <button
                v-for="(emoji, index) in visibleEmojis"
                :key="index"
                class="emoji-picker-item"
                :class="{ 'is-selected': isSelected(emoji) }"
                @click="selectEmoji(emoji)"
              >
                {{ emoji }}
              </button>
            </div>
            
            <button
              v-if="currentPage < totalPages - 1"
              class="emoji-picker-nav emoji-picker-nav--next"
              @click="nextPage"
            >
              ›
            </button>
          </div>
          
          <div class="emoji-picker-dots">
            <span
              v-for="(_, index) in totalPages"
              :key="index"
              class="emoji-picker-dot"
              :class="{ 'is-active': index === currentPage }"
            />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useEmojiStatus } from '../hooks/useEmojiStatus.js'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  targetDate: {
    type: Date,
    default: null
  },
  position: {
    type: Object,
    default: () => ({ x: 0, y: 0 })
  }
})

const emit = defineEmits(['select', 'close'])

const { DEFAULT_EMOJIS, hasEmoji } = useEmojiStatus()

const pickerRef = ref(null)
const currentPage = ref(0)
const EMOJIS_PER_PAGE = 6

const totalPages = computed(() => Math.ceil(DEFAULT_EMOJIS.length / EMOJIS_PER_PAGE))

const visibleEmojis = computed(() => {
  const start = currentPage.value * EMOJIS_PER_PAGE
  return DEFAULT_EMOJIS.slice(start, start + EMOJIS_PER_PAGE)
})

const pickerStyle = computed(() => {
  const baseStyle = {
    left: props.position.x + 'px',
    top: props.position.y + 'px'
  }
  
  if (pickerRef.value) {
    const rect = pickerRef.value.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    
    let x = props.position.x
    let y = props.position.y
    
    if (x + rect.width > viewportWidth) {
      x = viewportWidth - rect.width - 10
    }
    if (x < 10) x = 10
    
    if (y + rect.height > viewportHeight) {
      y = props.position.y - rect.height - 10
    }
    if (y < 10) y = 10
    
    return {
      left: x + 'px',
      top: y + 'px'
    }
  }
  
  return baseStyle
})

function isSelected(emoji) {
  if (!props.targetDate) return false
  return hasEmoji(props.targetDate, emoji)
}

function selectEmoji(emoji) {
  emit('select', emoji)
}

function prevPage() {
  if (currentPage.value > 0) {
    currentPage.value--
  }
}

function nextPage() {
  if (currentPage.value < totalPages.value - 1) {
    currentPage.value++
  }
}

function close() {
  emit('close')
}

function handleOverlayClick() {
  close()
}

function handleKeyDown(e) {
  if (e.key === 'Escape') {
    close()
  }
}

watch(() => props.visible, (val) => {
  if (val) {
    currentPage.value = 0
    document.addEventListener('keydown', handleKeyDown)
  } else {
    document.removeEventListener('keydown', handleKeyDown)
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
})
</script>

<style scoped>
.emoji-picker-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
}

.emoji-picker-container {
  position: absolute;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 16px;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.12),
    0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 12px;
  min-width: 280px;
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.emoji-picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding: 0 4px;
}

.emoji-picker-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.emoji-picker-close {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  border-radius: 50%;
  cursor: pointer;
  font-size: 18px;
  color: #909399;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.emoji-picker-close:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #606266;
}

.emoji-picker-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.emoji-picker-nav {
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 50%;
  cursor: pointer;
  font-size: 20px;
  color: #606266;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.emoji-picker-nav:hover {
  background: rgba(0, 0, 0, 0.1);
  color: #303133;
}

.emoji-picker-grid {
  display: flex;
  gap: 8px;
  flex: 1;
  justify-content: center;
}

.emoji-picker-item {
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  border-radius: 10px;
  cursor: pointer;
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.emoji-picker-item:hover {
  background: rgba(64, 158, 255, 0.1);
  transform: scale(1.1);
}

.emoji-picker-item.is-selected {
  background: rgba(64, 158, 255, 0.2);
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.5);
}

.emoji-picker-dots {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-top: 12px;
}

.emoji-picker-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #c0c4cc;
  transition: all 0.2s ease;
}

.emoji-picker-dot.is-active {
  background: #409eff;
  width: 16px;
  border-radius: 3px;
}

.emoji-picker-fade-enter-active,
.emoji-picker-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.emoji-picker-fade-enter-from,
.emoji-picker-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
