<template>
  <Transition name="fade">
    <div v-if="visible" class="ohhh-diary-panel-mask" @click.self="handleClose">
      <div class="ohhh-diary-panel">
        <div class="ohhh-diary-panel--header">
          <span class="ohhh-diary-panel--header-date">
            {{ formattedDate }}
          </span>
          <div class="ohhh-diary-panel--header-close" @click="handleClose">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </div>
        </div>
        <div class="ohhh-diary-panel--body">
          <textarea
            v-model="currentContent"
            class="ohhh-diary-panel--textarea"
            placeholder="写下今天的一句话感悟..."
            maxlength="500"
          ></textarea>
          <div class="ohhh-diary-panel--char-count">
            {{ currentContent.length }} / 500
          </div>
        </div>
        <div class="ohhh-diary-panel--footer">
          <button v-if="existingContent" class="ohhh-diary-panel--btn ohhh-diary-panel--btn-delete" @click="handleDelete">
            删除
          </button>
          <div class="ohhh-diary-panel--btn-group">
            <button class="ohhh-diary-panel--btn ohhh-diary-panel--btn-cancel" @click="handleClose">
              取消
            </button>
            <button class="ohhh-diary-panel--btn ohhh-diary-panel--btn-save" @click="handleSave">
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { saveDiary, getDiary, deleteDiary, formatDateKey } from './utils/storage.js'

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

const emit = defineEmits(['update:visible', 'save', 'delete'])

const currentContent = ref('')
const existingContent = ref('')

const formattedDate = computed(() => {
  if (!props.selectedDate) return ''
  const year = props.selectedDate.getFullYear()
  const month = props.selectedDate.getMonth() + 1
  const day = props.selectedDate.getDate()
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  const weekday = weekdays[props.selectedDate.getDay()]
  return `${year}年${month}月${day}日 周${weekday}`
})

watch(
  () => props.visible,
  (val) => {
    if (val && props.selectedDate) {
      const diary = getDiary(props.selectedDate)
      existingContent.value = diary ? diary.content : ''
      currentContent.value = existingContent.value
    }
  }
)

function handleClose() {
  emit('update:visible', false)
}

function handleSave() {
  if (!props.selectedDate) return
  
  if (currentContent.value.trim()) {
    saveDiary(props.selectedDate, currentContent.value.trim())
  } else {
    deleteDiary(props.selectedDate)
  }
  
  emit('save', {
    date: props.selectedDate,
    content: currentContent.value.trim()
  })
  handleClose()
}

function handleDelete() {
  if (!props.selectedDate) return
  
  deleteDiary(props.selectedDate)
  emit('delete', {
    date: props.selectedDate
  })
  handleClose()
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.ohhh-diary-panel-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
}

.ohhh-diary-panel {
  width: 90%;
  max-width: 400px;
  background: #fff;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  max-height: 80vh;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.ohhh-diary-panel--header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}

.ohhh-diary-panel--header-date {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.ohhh-diary-panel--header-close {
  cursor: pointer;
  color: #909399;
  transition: color 0.2s;
}

.ohhh-diary-panel--header-close:hover {
  color: #606266;
}

.ohhh-diary-panel--body {
  flex: 1;
  padding: 20px;
  min-height: 200px;
  display: flex;
  flex-direction: column;
}

.ohhh-diary-panel--textarea {
  width: 100%;
  flex: 1;
  min-height: 180px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 12px;
  font-size: 15px;
  line-height: 1.6;
  resize: none;
  outline: none;
  transition: border-color 0.2s;
  font-family: inherit;
}

.ohhh-diary-panel--textarea:focus {
  border-color: #409eff;
}

.ohhh-diary-panel--textarea::placeholder {
  color: #c0c4cc;
}

.ohhh-diary-panel--char-count {
  text-align: right;
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
  flex-shrink: 0;
}

.ohhh-diary-panel--footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px 20px;
  border-top: 1px solid #f0f0f0;
  flex-shrink: 0;
}

.ohhh-diary-panel--btn-group {
  display: flex;
  gap: 12px;
}

.ohhh-diary-panel--btn {
  padding: 10px 24px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.ohhh-diary-panel--btn-cancel {
  background: #f5f7fa;
  color: #606266;
}

.ohhh-diary-panel--btn-cancel:hover {
  background: #e4e7ed;
}

.ohhh-diary-panel--btn-save {
  background: #409eff;
  color: #fff;
}

.ohhh-diary-panel--btn-save:hover {
  background: #66b1ff;
}

.ohhh-diary-panel--btn-delete {
  background: transparent;
  color: #f56c6c;
  padding: 10px 0;
}

.ohhh-diary-panel--btn-delete:hover {
  color: #f78989;
}
</style>
