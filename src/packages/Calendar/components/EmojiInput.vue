<template>
  <Teleport to="body">
    <Transition name="emoji-input-fade">
      <div
        v-if="visible"
        class="emoji-input-overlay"
        @click="handleOverlayClick"
      >
        <div
          ref="inputRef"
          class="emoji-input-container"
          :style="inputStyle"
          @click.stop
        >
          <div class="emoji-input-header">
            <span class="emoji-input-preview">{{ selectedEmoji }}</span>
            <span class="emoji-input-title">添加描述</span>
            <button class="emoji-input-close" @click="close">×</button>
          </div>
          
          <div class="emoji-input-body">
            <textarea
              ref="textareaRef"
              v-model="description"
              class="emoji-input-textarea"
              placeholder="输入描述文字（可选）..."
              rows="2"
              maxlength="100"
              @keydown.enter.exact="handleEnter"
            />
            <div class="emoji-input-counter">
              {{ description.length }}/100
            </div>
          </div>
          
          <div class="emoji-input-footer">
            <button class="emoji-input-btn emoji-input-btn--cancel" @click="close">
              取消
            </button>
            <button class="emoji-input-btn emoji-input-btn--confirm" @click="confirm">
              确认
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, nextTick, onUnmounted } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  selectedEmoji: {
    type: String,
    default: ''
  },
  position: {
    type: Object,
    default: () => ({ x: 0, y: 0 })
  },
  initialDescription: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['confirm', 'close'])

const inputRef = ref(null)
const textareaRef = ref(null)
const description = ref('')

const inputStyle = computed(() => {
  const baseStyle = {
    left: props.position.x + 'px',
    top: props.position.y + 'px'
  }
  
  if (inputRef.value) {
    const rect = inputRef.value.getBoundingClientRect()
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

function handleEnter(e) {
  if (!e.shiftKey) {
    e.preventDefault()
    confirm()
  }
}

function confirm() {
  emit('confirm', description.value)
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

watch(() => props.visible, async (val) => {
  if (val) {
    description.value = props.initialDescription || ''
    document.addEventListener('keydown', handleKeyDown)
    await nextTick()
    if (textareaRef.value) {
      textareaRef.value.focus()
      textareaRef.value.select()
    }
  } else {
    document.removeEventListener('keydown', handleKeyDown)
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
})
</script>

<style scoped>
.emoji-input-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
}

.emoji-input-container {
  position: absolute;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 16px;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.12),
    0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 16px;
  min-width: 280px;
  max-width: 360px;
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.emoji-input-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.emoji-input-preview {
  font-size: 28px;
  line-height: 1;
}

.emoji-input-title {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.emoji-input-close {
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

.emoji-input-close:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #606266;
}

.emoji-input-body {
  margin-bottom: 12px;
}

.emoji-input-textarea {
  width: 100%;
  min-height: 60px;
  padding: 10px 12px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  font-size: 14px;
  font-family: inherit;
  color: #303133;
  background: rgba(255, 255, 255, 0.7);
  resize: none;
  outline: none;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.emoji-input-textarea::placeholder {
  color: #c0c4cc;
}

.emoji-input-textarea:focus {
  border-color: rgba(64, 158, 255, 0.5);
  box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.1);
}

.emoji-input-counter {
  text-align: right;
  font-size: 12px;
  color: #909399;
  margin-top: 6px;
}

.emoji-input-footer {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.emoji-input-btn {
  padding: 8px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.emoji-input-btn--cancel {
  background: rgba(0, 0, 0, 0.05);
  color: #606266;
}

.emoji-input-btn--cancel:hover {
  background: rgba(0, 0, 0, 0.1);
}

.emoji-input-btn--confirm {
  background: #409eff;
  color: #fff;
}

.emoji-input-btn--confirm:hover {
  background: #66b1ff;
}

.emoji-input-fade-enter-active,
.emoji-input-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.emoji-input-fade-enter-from,
.emoji-input-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
