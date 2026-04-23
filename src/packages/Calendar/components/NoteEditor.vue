<template>
  <Teleport to="body">
    <Transition name="note-editor-fade">
      <div v-if="visible" class="note-editor-overlay" @click="handleOverlayClick">
        <div
          ref="editorRef"
          class="note-editor"
          :style="{
            width: `${windowWidth}px`,
            height: `${windowHeight}px`,
            left: `${positionX}px`,
            top: `${positionY}px`
          }"
          @mousedown="handleContainerMouseDown"
        >
          <div class="note-editor-header">
            <span class="note-editor-title">{{ formattedDate }}</span>
            <div class="note-editor-actions">
              <button
                title="复制"
                class="note-editor-btn"
                @click.stop="handleCopy"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </button>
              <button
                title="粘贴"
                class="note-editor-btn"
                @click.stop="handlePaste"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                </svg>
              </button>
              <button
                title="删除"
                class="note-editor-btn"
                @click.stop="handleDelete"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
              <button
                title="清空"
                class="note-editor-btn"
                @click.stop="handleClear"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
              <div class="note-editor-divider"></div>
              <button
                title="关闭"
                class="note-editor-btn note-editor-close"
                @click.stop="close"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>
          <div class="note-editor-body">
            <textarea
              ref="textareaRef"
              v-model="noteContent"
              class="note-editor-textarea"
              :maxlength="maxNoteLength"
              placeholder="添加备注..."
              @input="handleInput"
            ></textarea>
          </div>
          <div class="note-editor-footer">
            <span class="note-editor-counter" :class="{ 'is-warning': isOverLimit }">
              {{ currentLength }} / {{ maxNoteLength }}
            </span>
            <div
              class="note-editor-resize-handle"
              @mousedown="handleResizeStart"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M22 22H20V20H22V22ZM22 18H20V16H22V18ZM18 22H16V20H18V22ZM22 14H20V12H22V14ZM18 18H16V16H18V18ZM14 22H12V20H14V22Z"></path>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { getNote, saveNote, deleteNote, formatDateKey, MAX_NOTE_LENGTH } from '../utils/noteStorage.js'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  date: {
    type: Date,
    default: null
  }
})

const emit = defineEmits(['update:visible', 'close', 'note-change'])

const editorRef = ref(null)
const textareaRef = ref(null)
const noteContent = ref('')

const windowWidth = ref(380)
const windowHeight = ref(280)
const positionX = ref(100)
const positionY = ref(100)

const isDragging = ref(false)
const isResizing = ref(false)
const dragStartX = ref(0)
const dragStartY = ref(0)
const initialX = ref(0)
const initialY = ref(0)
const initialWidth = ref(0)
const initialHeight = ref(0)

const maxNoteLength = MAX_NOTE_LENGTH
const currentLength = computed(() => noteContent.value.length)
const isOverLimit = computed(() => currentLength.value > maxNoteLength)

const formattedDate = computed(() => {
  if (!props.date) return ''
  const year = props.date.getFullYear()
  const month = props.date.getMonth() + 1
  const day = props.date.getDate()
  return `${year}年${month}月${day}日`
})

watch(() => props.visible, (newVal) => {
  if (newVal && props.date) {
    loadNote()
    positionWindow()
    nextTick(() => {
      if (textareaRef.value) {
        textareaRef.value.focus()
      }
    })
  }
})

function loadNote() {
  if (props.date) {
    noteContent.value = getNote(props.date) || ''
  }
}

function positionWindow() {
  if (typeof window !== 'undefined') {
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    positionX.value = Math.max(50, (viewportWidth - windowWidth.value) / 2)
    positionY.value = Math.max(50, (viewportHeight - windowHeight.value) / 2)
  }
}

function saveCurrentNote() {
  if (props.date) {
    saveNote(props.date, noteContent.value)
    emit('note-change', formatDateKey(props.date), noteContent.value)
  }
}

function close() {
  saveCurrentNote()
  emit('update:visible', false)
  emit('close')
}

function handleOverlayClick(e) {
  if (e.target === e.currentTarget) {
    close()
  }
}

function handleContainerMouseDown(e) {
  if (e.target.closest('.note-editor-actions') || 
      e.target.closest('.note-editor-body') ||
      e.target.closest('.note-editor-resize-handle') ||
      e.target.closest('.note-editor-footer')) {
    return
  }
  
  isDragging.value = true
  dragStartX.value = e.clientX
  dragStartY.value = e.clientY
  initialX.value = positionX.value
  initialY.value = positionY.value
}

function handleResizeStart(e) {
  e.stopPropagation()
  isResizing.value = true
  dragStartX.value = e.clientX
  dragStartY.value = e.clientY
  initialWidth.value = windowWidth.value
  initialHeight.value = windowHeight.value
}

function handleMouseMove(e) {
  if (isDragging.value) {
    const deltaX = e.clientX - dragStartX.value
    const deltaY = e.clientY - dragStartY.value
    positionX.value = Math.max(0, initialX.value + deltaX)
    positionY.value = Math.max(0, initialY.value + deltaY)
  }
  
  if (isResizing.value) {
    const deltaX = e.clientX - dragStartX.value
    const deltaY = e.clientY - dragStartY.value
    windowWidth.value = Math.max(280, initialWidth.value + deltaX)
    windowHeight.value = Math.max(200, initialHeight.value + deltaY)
  }
}

function handleMouseUp() {
  isDragging.value = false
  isResizing.value = false
}

function handleInput() {
  if (noteContent.value.length > maxNoteLength) {
    noteContent.value = noteContent.value.substring(0, maxNoteLength)
  }
}

async function handleCopy() {
  if (textareaRef.value) {
    textareaRef.value.select()
    try {
      await navigator.clipboard.writeText(noteContent.value)
    } catch (e) {
      document.execCommand('copy')
    }
  }
}

async function handlePaste() {
  try {
    const text = await navigator.clipboard.readText()
    if (textareaRef.value) {
      const start = textareaRef.value.selectionStart
      const end = textareaRef.value.selectionEnd
      const newContent = noteContent.value.substring(0, start) + text + noteContent.value.substring(end)
      noteContent.value = newContent.substring(0, maxNoteLength)
      nextTick(() => {
        if (textareaRef.value) {
          textareaRef.value.selectionStart = textareaRef.value.selectionEnd = start + text.length
          textareaRef.value.focus()
        }
      })
    }
  } catch (e) {
    console.warn('Failed to paste:', e)
  }
}

function handleDelete() {
  if (props.date) {
    deleteNote(props.date)
    noteContent.value = ''
    emit('note-change', formatDateKey(props.date), '')
  }
}

function handleClear() {
  noteContent.value = ''
}

onMounted(() => {
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
})

onUnmounted(() => {
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
})

defineExpose({
  saveCurrentNote,
  close
})
</script>

<style scoped>
.note-editor-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.note-editor-fade-enter-active,
.note-editor-fade-leave-active {
  transition: opacity 0.2s ease;
}

.note-editor-fade-enter-from,
.note-editor-fade-leave-to {
  opacity: 0;
}

.note-editor {
  position: absolute;
  display: flex;
  flex-direction: column;
  min-width: 280px;
  min-height: 200px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 16px;
  box-shadow: 
    0 20px 60px -15px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.5) inset;
  overflow: hidden;
  user-select: none;
}

.note-editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.5);
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  cursor: move;
}

.note-editor-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--calendar-text-color-level-1, #303133);
}

.note-editor-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.note-editor-divider {
  width: 1px;
  height: 16px;
  background: rgba(0, 0, 0, 0.1);
  margin: 0 4px;
}

.note-editor-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  color: var(--calendar-text-color-level-3, #909399);
  transition: all 0.2s ease;
}

.note-editor-btn:hover {
  background: rgba(64, 158, 255, 0.1);
  color: var(--calendar-theme-color, #409eff);
}

.note-editor-btn svg {
  width: 16px;
  height: 16px;
}

.note-editor-body {
  flex: 1;
  padding: 12px 16px;
  overflow: hidden;
}

.note-editor-textarea {
  width: 100%;
  height: 100%;
  border: none;
  background: transparent;
  resize: none;
  outline: none;
  font-size: 14px;
  line-height: 1.6;
  color: var(--calendar-text-color-level-1, #303133);
  font-family: inherit;
}

.note-editor-textarea::placeholder {
  color: var(--calendar-text-color-level-4, #a8abb2);
}

.note-editor-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.5);
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

.note-editor-counter {
  font-size: 12px;
  color: var(--calendar-text-color-level-4, #a8abb2);
}

.note-editor-counter.is-warning {
  color: #f56c6c;
}

.note-editor-resize-handle {
  width: 20px;
  height: 20px;
  cursor: se-resize;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--calendar-text-color-level-4, #a8abb2);
  opacity: 0.5;
  transition: opacity 0.2s ease;
}

.note-editor-resize-handle:hover {
  opacity: 1;
  color: var(--calendar-theme-color, #409eff);
}

.note-editor-resize-handle svg {
  width: 14px;
  height: 14px;
}
</style>
