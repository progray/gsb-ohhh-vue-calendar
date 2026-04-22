<template>
  <Teleport to="body">
    <Transition name="command-palette">
      <div
        v-if="isOpen"
        ref="paletteRef"
        class="ohhh-command-palette-overlay"
        @click.self="closePalette"
      >
        <div
          ref="paletteContainerRef"
          class="ohhh-command-palette-container"
          role="dialog"
          aria-modal="true"
          aria-label="命令面板"
        >
          <div class="ohhh-command-palette-header">
            <div class="ohhh-command-palette-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21L16.65 16.65" />
              </svg>
            </div>
            <input
              ref="searchInputRef"
              v-model="searchQuery"
              type="text"
              class="ohhh-command-palette-input"
              placeholder="输入命令..."
              @input="handleInput"
              @keydown="handleKeyDown"
              autocomplete="off"
              spellcheck="false"
            />
            <div class="ohhh-command-palette-hint">
              <kbd>↑↓</kbd>
              <span>选择</span>
              <kbd>↵</kbd>
              <span>执行</span>
              <kbd>Esc</kbd>
              <span>关闭</span>
            </div>
          </div>

          <div
            v-if="filteredCommands.length > 0"
            ref="commandsListRef"
            class="ohhh-command-palette-list"
            role="listbox"
          >
            <div
              v-for="(command, index) in filteredCommands"
              :key="index"
              ref="commandItemRefs"
              class="ohhh-command-palette-item"
              :class="{ 'is-selected': selectedIndex === index }"
              role="option"
              :aria-selected="selectedIndex === index"
              @click="handleCommandClick(command)"
              @mouseenter="handleItemMouseEnter(index)"
            >
              <div class="ohhh-command-palette-item-icon">
                <svg v-if="command.type === 'viewSwitch'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="3" y1="9" x2="21" y2="9" />
                  <line x1="9" y1="21" x2="9" y2="9" />
                </svg>
                <svg v-else-if="command.type === 'dateNavigate'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <svg v-else-if="command.type === 'dateSelect'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <svg v-else-if="command.type === 'pageNavigate'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div class="ohhh-command-palette-item-content">
                <div class="ohhh-command-palette-item-label">
                  {{ command.label }}
                </div>
              </div>
            </div>
          </div>

          <div v-else class="ohhh-command-palette-empty">
            <div class="ohhh-command-palette-empty-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21L16.65 16.65" />
                <path d="M8 11h6" />
              </svg>
            </div>
            <div class="ohhh-command-palette-empty-text">未找到匹配的命令</div>
            <div class="ohhh-command-palette-empty-hint">尝试输入"月视图"、"今天"、"下周五"等</div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { searchCommands, executeCommand as executeCalendarCommand } from './utils/commandPalette.js'

const props = defineProps({
  calendarRef: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['command-executed', 'close'])

const isOpen = ref(false)
const searchQuery = ref('')
const selectedIndex = ref(0)

const paletteRef = ref(null)
const paletteContainerRef = ref(null)
const searchInputRef = ref(null)
const commandsListRef = ref(null)
const commandItemRefs = ref([])

const previousActiveElement = ref(null)

const filteredCommands = computed(() => {
  return searchCommands(searchQuery.value)
})

watch(isOpen, (newValue) => {
  if (newValue) {
    previousActiveElement.value = document.activeElement
    nextTick(() => {
      if (searchInputRef.value) {
        searchInputRef.value.focus()
      }
    })
  } else {
    if (previousActiveElement.value && previousActiveElement.value.focus) {
      previousActiveElement.value.focus()
    }
  }
})

watch(filteredCommands, () => {
  selectedIndex.value = 0
  nextTick(() => {
    scrollToSelectedItem()
  })
})

function openPalette() {
  searchQuery.value = ''
  selectedIndex.value = 0
  isOpen.value = true
}

function closePalette() {
  isOpen.value = false
  emit('close')
}

function togglePalette() {
  if (isOpen.value) {
    closePalette()
  } else {
    openPalette()
  }
}

function handleInput() {
  selectedIndex.value = 0
}

function handleKeyDown(event) {
  switch (event.key) {
    case 'ArrowUp':
      event.preventDefault()
      navigateUp()
      break
    case 'ArrowDown':
      event.preventDefault()
      navigateDown()
      break
    case 'Enter':
      event.preventDefault()
      executeSelectedCommand()
      break
    case 'Escape':
      event.preventDefault()
      closePalette()
      break
    case 'PageUp':
      event.preventDefault()
      navigatePageUp()
      break
    case 'PageDown':
      event.preventDefault()
      navigatePageDown()
      break
    case 'Tab':
      event.preventDefault()
      break
  }
}

function navigateUp() {
  if (filteredCommands.value.length === 0) return
  if (selectedIndex.value > 0) {
    selectedIndex.value--
    scrollToSelectedItem()
  } else {
    selectedIndex.value = filteredCommands.value.length - 1
    scrollToSelectedItem()
  }
}

function navigateDown() {
  if (filteredCommands.value.length === 0) return
  if (selectedIndex.value < filteredCommands.value.length - 1) {
    selectedIndex.value++
    scrollToSelectedItem()
  } else {
    selectedIndex.value = 0
    scrollToSelectedItem()
  }
}

function navigatePageUp() {
  if (filteredCommands.value.length === 0) return
  const visibleItems = getVisibleItemsCount()
  selectedIndex.value = Math.max(0, selectedIndex.value - visibleItems)
  scrollToSelectedItem()
}

function navigatePageDown() {
  if (filteredCommands.value.length === 0) return
  const visibleItems = getVisibleItemsCount()
  selectedIndex.value = Math.min(filteredCommands.value.length - 1, selectedIndex.value + visibleItems)
  scrollToSelectedItem()
}

function getVisibleItemsCount() {
  if (!commandsListRef.value) return 5
  const itemHeight = 44
  const listHeight = commandsListRef.value.clientHeight
  return Math.floor(listHeight / itemHeight) || 5
}

function scrollToSelectedItem() {
  nextTick(() => {
    const items = commandItemRefs.value
    const selectedItem = items[selectedIndex.value]
    if (selectedItem && commandsListRef.value) {
      const listRect = commandsListRef.value.getBoundingClientRect()
      const itemRect = selectedItem.getBoundingClientRect()
      
      if (itemRect.top < listRect.top) {
        selectedItem.scrollIntoView({ block: 'start', behavior: 'smooth' })
      } else if (itemRect.bottom > listRect.bottom) {
        selectedItem.scrollIntoView({ block: 'end', behavior: 'smooth' })
      }
    }
  })
}

function executeSelectedCommand() {
  if (filteredCommands.value.length === 0) return
  const command = filteredCommands.value[selectedIndex.value]
  executeCalendarCommand(command, props.calendarRef)
  emit('command-executed', command)
  closePalette()
}

function handleCommandClick(command) {
  executeCalendarCommand(command, props.calendarRef)
  emit('command-executed', command)
  closePalette()
}

function handleItemMouseEnter(index) {
  selectedIndex.value = index
  if (searchInputRef.value) {
    searchInputRef.value.focus()
  }
}

function handleGlobalKeyDown(event) {
  const isKKey = event.key.toLowerCase() === 'k' || event.code === 'KeyK'
  const isCtrlOrCmd = event.metaKey || event.ctrlKey
  const isShift = event.shiftKey
  
  if (isCtrlOrCmd && isKKey && !isShift) {
    event.preventDefault()
    event.stopPropagation()
    togglePalette()
    return
  }
  
  if (isCtrlOrCmd && isShift && isKKey) {
    event.preventDefault()
    event.stopPropagation()
    togglePalette()
    return
  }
  
  if (event.key === 'Escape' && isOpen.value) {
    event.preventDefault()
    event.stopPropagation()
    closePalette()
  }
}

function setCommandItemRef(el, index) {
  if (el) {
    commandItemRefs.value[index] = el
  }
}

defineExpose({
  openPalette,
  closePalette,
  togglePalette,
  isOpen
})

onMounted(() => {
  document.addEventListener('keydown', handleGlobalKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleGlobalKeyDown)
})
</script>

<style scoped>
.ohhh-command-palette-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: 15vh;
  z-index: 9999;
  backdrop-filter: blur(4px);
}

.ohhh-command-palette-container {
  width: 100%;
  max-width: 600px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 
    0 25px 50px -12px rgba(0, 0, 0, 0.25),
    0 0 0 1px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  animation: slideDown 0.2s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.command-palette-enter-active,
.command-palette-leave-active {
  transition: all 0.2s ease-out;
}

.command-palette-enter-from,
.command-palette-leave-to {
  opacity: 0;
}

.command-palette-enter-from .ohhh-command-palette-container,
.command-palette-leave-to .ohhh-command-palette-container {
  opacity: 0;
  transform: translateY(-20px) scale(0.98);
}

.ohhh-command-palette-header {
  display: flex;
  align-items: center;
  padding: 16px 16px 12px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
}

.ohhh-command-palette-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  color: #909399;
  margin-right: 12px;
}

.ohhh-command-palette-input {
  flex: 1;
  height: 40px;
  padding: 0 12px;
  font-size: 15px;
  border: none;
  background: transparent;
  outline: none;
  color: #303133;
}

.ohhh-command-palette-input::placeholder {
  color: #c0c4cc;
}

.ohhh-command-palette-hint {
  display: flex;
  align-items: center;
  gap: 4px;
  padding-left: 12px;
  border-left: 1px solid #e5e5e5;
  color: #909399;
  font-size: 12px;
}

.ohhh-command-palette-hint kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  font-size: 11px;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
  background: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.05);
}

.ohhh-command-palette-hint span {
  margin-right: 8px;
}

.ohhh-command-palette-hint span:last-child {
  margin-right: 0;
}

.ohhh-command-palette-list {
  max-height: 300px;
  overflow-y: auto;
  padding: 8px 0;
}

.ohhh-command-palette-list::-webkit-scrollbar {
  width: 6px;
}

.ohhh-command-palette-list::-webkit-scrollbar-track {
  background: transparent;
}

.ohhh-command-palette-list::-webkit-scrollbar-thumb {
  background: #dcdfe6;
  border-radius: 3px;
}

.ohhh-command-palette-list::-webkit-scrollbar-thumb:hover {
  background: #c0c4cc;
}

.ohhh-command-palette-item {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.ohhh-command-palette-item:hover {
  background: #f5f7fa;
}

.ohhh-command-palette-item.is-selected {
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
  color: #fff;
}

.ohhh-command-palette-item.is-selected .ohhh-command-palette-item-icon {
  color: rgba(255, 255, 255, 0.9);
}

.ohhh-command-palette-item.is-selected .ohhh-command-palette-item-label {
  color: #fff;
}

.ohhh-command-palette-item-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: #f0f2f5;
  border-radius: 8px;
  color: #409eff;
  margin-right: 12px;
  flex-shrink: 0;
  transition: all 0.15s ease;
}

.ohhh-command-palette-item.is-selected .ohhh-command-palette-item-icon {
  background: rgba(255, 255, 255, 0.2);
}

.ohhh-command-palette-item-content {
  flex: 1;
  min-width: 0;
}

.ohhh-command-palette-item-label {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ohhh-command-palette-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #909399;
}

.ohhh-command-palette-empty-icon {
  margin-bottom: 16px;
  opacity: 0.5;
}

.ohhh-command-palette-empty-text {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}

.ohhh-command-palette-empty-hint {
  font-size: 12px;
  color: #909399;
}

@media (max-width: 640px) {
  .ohhh-command-palette-overlay {
    padding: 16px;
    align-items: center;
  }

  .ohhh-command-palette-container {
    max-width: 100%;
    border-radius: 16px;
  }

  .ohhh-command-palette-header {
    padding: 12px 12px 8px;
  }

  .ohhh-command-palette-icon {
    width: 36px;
    height: 36px;
    margin-right: 8px;
  }

  .ohhh-command-palette-input {
    height: 36px;
    font-size: 14px;
  }

  .ohhh-command-palette-hint {
    display: none;
  }

  .ohhh-command-palette-list {
    max-height: 40vh;
  }

  .ohhh-command-palette-item {
    padding: 12px 16px;
  }
}
</style>
