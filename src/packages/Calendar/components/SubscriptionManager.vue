<template>
  <div class="ohhh-calendar-subscription-manager">
    <div class="ohhh-calendar-subscription-manager--header">
      <h3 class="ohhh-calendar-subscription-manager--title">日历订阅</h3>
      <div class="ohhh-calendar-subscription-manager--actions">
        <label class="ohhh-calendar-subscription-manager--import-btn">
          <span class="ohhh-calendar-subscription-manager--import-icon">+</span>
          <span>导入 .ics</span>
          <input
            type="file"
            ref="fileInput"
            accept=".ics,text/calendar"
            multiple
            @change="handleFileSelect"
            class="ohhh-calendar-subscription-manager--file-input"
          />
        </label>
      </div>
    </div>

    <div v-if="subscriptions.length === 0" class="ohhh-calendar-subscription-manager--empty">
      <div class="ohhh-calendar-subscription-manager--empty-icon">📅</div>
      <p class="ohhh-calendar-subscription-manager--empty-text">暂无日历订阅</p>
      <p class="ohhh-calendar-subscription-manager--empty-hint">点击上方按钮导入 .ics 日历文件</p>
    </div>

    <div v-else class="ohhh-calendar-subscription-manager--list">
      <div
        v-for="sub in subscriptions"
        :key="sub.id"
        class="ohhh-calendar-subscription-manager--item"
      >
        <div class="ohhh-calendar-subscription-manager--item-main">
          <div
            class="ohhh-calendar-subscription-manager--color-indicator"
            :style="{ backgroundColor: sub.color }"
          />
          <div class="ohhh-calendar-subscription-manager--item-info">
            <div class="ohhh-calendar-subscription-manager--item-name">
              <input
                v-if="editingId === sub.id"
                ref="nameInput"
                v-model="editingName"
                @blur="saveName(sub.id)"
                @keyup.enter="saveName(sub.id)"
                @keyup.esc="cancelEdit"
                class="ohhh-calendar-subscription-manager--name-input"
              />
              <span
                v-else
                @dblclick="startEdit(sub)"
                class="ohhh-calendar-subscription-manager--name-text"
              >{{ sub.name }}</span>
            </div>
            <div class="ohhh-calendar-subscription-manager--item-meta">
              <span class="ohhh-calendar-subscription-manager--event-count">
                {{ sub.eventCount }} 个事件
              </span>
              <span v-if="sub.fileName" class="ohhh-calendar-subscription-manager--file-name">
                {{ sub.fileName }}
              </span>
            </div>
          </div>
        </div>

        <div class="ohhh-calendar-subscription-manager--item-actions">
          <div class="ohhh-calendar-subscription-manager--color-picker-wrapper">
            <button
              class="ohhh-calendar-subscription-manager--color-btn"
              :style="{ backgroundColor: sub.color }"
              @click="toggleColorPicker(sub.id)"
            />
            <Transition name="ohhh-calendar-fade">
              <div
                v-if="colorPickerFor === sub.id"
                class="ohhh-calendar-subscription-manager--color-picker"
              >
                <div class="ohhh-calendar-subscription-manager--color-grid">
                  <button
                    v-for="(color, idx) in availableColors"
                    :key="idx"
                    class="ohhh-calendar-subscription-manager--color-option"
                    :class="{ 'is-selected': sub.color === color }"
                    :style="{ backgroundColor: color }"
                    @click="changeColor(sub.id, color)"
                  />
                </div>
              </div>
            </Transition>
          </div>
          <button
            class="ohhh-calendar-subscription-manager--delete-btn"
            @click="deleteSub(sub.id)"
            title="删除"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <path d="M10 11v6M14 11v6" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <div v-if="errorMessage" class="ohhh-calendar-subscription-manager--error">
      {{ errorMessage }}
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import { getAvailableColors } from '../utils/colorPalette.js'

const props = defineProps({
  subscriptions: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['import', 'update-name', 'update-color', 'delete'])

const fileInput = ref(null)
const nameInput = ref(null)
const editingId = ref(null)
const editingName = ref('')
const colorPickerFor = ref(null)
const errorMessage = ref('')

const availableColors = getAvailableColors()

function handleFileSelect(event) {
  const files = event.target.files
  if (files && files.length > 0) {
    emit('import', Array.from(files))
  }
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

function startEdit(sub) {
  editingId.value = sub.id
  editingName.value = sub.name
  nextTick(() => {
    if (nameInput.value) {
      nameInput.value.focus()
      nameInput.value.select()
    }
  })
}

function saveName(id) {
  if (editingName.value.trim()) {
    emit('update-name', id, editingName.value.trim())
  }
  editingId.value = null
  editingName.value = ''
}

function cancelEdit() {
  editingId.value = null
  editingName.value = ''
}

function toggleColorPicker(id) {
  colorPickerFor.value = colorPickerFor.value === id ? null : id
}

function changeColor(id, color) {
  emit('update-color', id, color)
  colorPickerFor.value = null
}

function deleteSub(id) {
  emit('delete', id)
}

watch(colorPickerFor, (newVal) => {
  if (newVal === null) return
  
  const handleClickOutside = (e) => {
    if (!e.target.closest('.ohhh-calendar-subscription-manager--color-picker-wrapper')) {
      colorPickerFor.value = null
      document.removeEventListener('click', handleClickOutside)
    }
  }
  
  setTimeout(() => {
    document.addEventListener('click', handleClickOutside)
  }, 0)
})

defineExpose({
  triggerImport: () => {
    if (fileInput.value) {
      fileInput.value.click()
    }
  }
})
</script>

<style scoped>
.ohhh-calendar-subscription-manager {
  font-family:
    Open Sans,
    -apple-system,
    BlinkMacSystemFont,
    Helvetica Neue,
    Helvetica,
    Segoe UI,
    Arial,
    Roboto,
    PingFang SC,
    miui,
    Hiragino Sans GB,
    Microsoft Yahei,
    sans-serif;
  color: var(--calendar-text-color-level-1, #303133);
}

.ohhh-calendar-subscription-manager--header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.ohhh-calendar-subscription-manager--title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--calendar-text-color-level-1, #303133);
}

.ohhh-calendar-subscription-manager--import-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: var(--calendar-theme-color, #409eff);
  color: white;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.ohhh-calendar-subscription-manager--import-btn:hover {
  background: var(--calendar-theme-color, #409eff);
  opacity: 0.9;
}

.ohhh-calendar-subscription-manager--import-icon {
  font-size: 18px;
  font-weight: 400;
  line-height: 1;
}

.ohhh-calendar-subscription-manager--file-input {
  display: none;
}

.ohhh-calendar-subscription-manager--empty {
  text-align: center;
  padding: 32px 16px;
}

.ohhh-calendar-subscription-manager--empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.ohhh-calendar-subscription-manager--empty-text {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--calendar-text-color-level-2, #606266);
}

.ohhh-calendar-subscription-manager--empty-hint {
  margin: 0;
  font-size: 12px;
  color: var(--calendar-text-color-level-4, #a8abb2);
}

.ohhh-calendar-subscription-manager--list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ohhh-calendar-subscription-manager--item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
  transition: background-color 0.15s ease;
}

.ohhh-calendar-subscription-manager--item:hover {
  background: rgba(0, 0, 0, 0.04);
}

.ohhh-calendar-subscription-manager--item-main {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.ohhh-calendar-subscription-manager--color-indicator {
  width: 12px;
  min-width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-top: 4px;
  flex-shrink: 0;
}

.ohhh-calendar-subscription-manager--item-info {
  flex: 1;
  min-width: 0;
}

.ohhh-calendar-subscription-manager--item-name {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
}

.ohhh-calendar-subscription-manager--name-text {
  font-size: 14px;
  font-weight: 500;
  color: var(--calendar-text-color-level-1, #303133);
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ohhh-calendar-subscription-manager--name-text:hover {
  color: var(--calendar-theme-color, #409eff);
}

.ohhh-calendar-subscription-manager--name-input {
  font-size: 14px;
  font-weight: 500;
  color: var(--calendar-text-color-level-1, #303133);
  background: transparent;
  border: 1px solid var(--calendar-theme-color, #409eff);
  border-radius: 4px;
  padding: 2px 6px;
  outline: none;
  width: 100%;
}

.ohhh-calendar-subscription-manager--item-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 11px;
  color: var(--calendar-text-color-level-4, #a8abb2);
}

.ohhh-calendar-subscription-manager--event-count {
  font-weight: 500;
  color: var(--calendar-text-color-level-3, #909399);
}

.ohhh-calendar-subscription-manager--file-name {
  opacity: 0.7;
}

.ohhh-calendar-subscription-manager--item-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ohhh-calendar-subscription-manager--color-picker-wrapper {
  position: relative;
}

.ohhh-calendar-subscription-manager--color-btn {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: 2px solid rgba(0, 0, 0, 0.1);
  cursor: pointer;
  padding: 0;
  transition: all 0.15s ease;
}

.ohhh-calendar-subscription-manager--color-btn:hover {
  transform: scale(1.1);
  border-color: rgba(0, 0, 0, 0.2);
}

.ohhh-calendar-subscription-manager--color-picker {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  padding: 12px;
  background: white;
  border-radius: 8px;
  box-shadow:
    0 4px 20px rgba(0, 0, 0, 0.12),
    0 0 0 1px rgba(0, 0, 0, 0.06);
  z-index: 100;
}

.ohhh-calendar-subscription-manager--color-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 6px;
}

.ohhh-calendar-subscription-manager--color-option {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: 2px solid transparent;
  cursor: pointer;
  padding: 0;
  transition: all 0.15s ease;
}

.ohhh-calendar-subscription-manager--color-option:hover {
  transform: scale(1.15);
}

.ohhh-calendar-subscription-manager--color-option.is-selected {
  border-color: var(--calendar-text-color-level-1, #303133);
  box-shadow: 0 0 0 1px white inset;
}

.ohhh-calendar-subscription-manager--delete-btn {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 4px;
  color: var(--calendar-text-color-level-4, #a8abb2);
  transition: all 0.15s ease;
}

.ohhh-calendar-subscription-manager--delete-btn:hover {
  background: rgba(231, 76, 60, 0.1);
  color: #e74c3c;
}

.ohhh-calendar-subscription-manager--delete-btn svg {
  width: 100%;
  height: 100%;
}

.ohhh-calendar-subscription-manager--error {
  margin-top: 12px;
  padding: 10px 12px;
  background: rgba(231, 76, 60, 0.1);
  border-radius: 6px;
  font-size: 13px;
  color: #e74c3c;
}

.ohhh-calendar-fade-enter-active,
.ohhh-calendar-fade-leave-active {
  transition: all 0.15s ease;
}

.ohhh-calendar-fade-enter-from,
.ohhh-calendar-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
