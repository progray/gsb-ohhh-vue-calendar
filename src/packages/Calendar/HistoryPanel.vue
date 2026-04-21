<template>
  <div v-if="isOpen" class="ohhh-calendar-history-overlay" @click="$emit('close')">
    <div class="ohhh-calendar-history-panel" @click.stop>
      <div class="ohhh-calendar-history-panel--header">
        <span class="ohhh-calendar-history-panel--title">操作记录</span>
        <button class="ohhh-calendar-history-panel--close" @click="closePanel">×</button>
      </div>
      <div class="ohhh-calendar-history-panel--toolbar">
        <button
          class="ohhh-calendar-history-panel--btn"
          :class="{ 'is-disabled': !canUndo }"
          @click="$emit('undo')"
        >
          <span class="ohhh-calendar-history-panel--btn-icon">↩</span>
          <span class="ohhh-calendar-history-panel--btn-text">撤销</span>
          <span class="ohhh-calendar-history-panel--btn-shortcut">Ctrl+Z</span>
        </button>
        <button
          class="ohhh-calendar-history-panel--btn"
          :class="{ 'is-disabled': !canRedo }"
          @click="$emit('redo')"
        >
          <span class="ohhh-calendar-history-panel--btn-icon">↪</span>
          <span class="ohhh-calendar-history-panel--btn-text">重做</span>
          <span class="ohhh-calendar-history-panel--btn-shortcut">Ctrl+U</span>
        </button>
      </div>
      <div class="ohhh-calendar-history-panel--list">
        <div
          v-for="(item, index) in historyList"
          :key="item.id"
          class="ohhh-calendar-history-panel--item"
          :class="{
            'is-current': index === currentIndex,
            'is-future': index > currentIndex
          }"
          @click="handleItemClick(index)"
        >
          <div class="ohhh-calendar-history-panel--item-left">
            <div class="ohhh-calendar-history-panel--item-dot">
              <span
                v-if="index === currentIndex"
                class="ohhh-calendar-history-panel--item-dot-current"
              ></span>
              <span v-else class="ohhh-calendar-history-panel--item-dot-normal"></span>
            </div>
            <div class="ohhh-calendar-history-panel--item-line" v-if="index < historyList.length - 1"></div>
          </div>
          <div class="ohhh-calendar-history-panel--item-content">
            <div class="ohhh-calendar-history-panel--item-name">{{ item.displayName }}</div>
            <div class="ohhh-calendar-history-panel--item-time">{{ _formatTime(item.timestamp) }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  historyList: {
    type: Array,
    default: () => []
  },
  currentIndex: {
    type: Number,
    default: -1
  },
  canUndo: {
    type: Boolean,
    default: false
  },
  canRedo: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'undo', 'redo', 'jump'])

function closePanel() {
  emit('close')
}

function handleItemClick(index) {
  if (index !== props.currentIndex) {
    emit('jump', index)
  }
}

function _formatTime(timestamp) {
  const date = new Date(timestamp)
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}
</script>
