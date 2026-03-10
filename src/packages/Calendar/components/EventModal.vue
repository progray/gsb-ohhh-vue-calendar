<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="visible" class="ohhh-calendar-modal-overlay" @click.self="handleClose">
        <div class="ohhh-calendar-modal">
          <div class="ohhh-calendar-modal-header">
            <span class="ohhh-calendar-modal-title">{{ isEdit ? '编辑事件' : '新建事件' }}</span>
            <button class="ohhh-calendar-modal-close" @click="handleClose">×</button>
          </div>
          
          <div class="ohhh-calendar-modal-body">
            <div class="ohhh-calendar-form-group">
              <label class="ohhh-calendar-form-label">事件标题 *</label>
              <input 
                v-model="form.title" 
                type="text" 
                class="ohhh-calendar-form-input"
                placeholder="请输入事件标题"
              />
            </div>
            
            <div class="ohhh-calendar-form-row">
              <div class="ohhh-calendar-form-group">
                <label class="ohhh-calendar-form-label">开始日期 *</label>
                <input 
                  v-model="form.startDate" 
                  type="datetime-local" 
                  class="ohhh-calendar-form-input"
                />
              </div>
              <div class="ohhh-calendar-form-group">
                <label class="ohhh-calendar-form-label">结束日期 *</label>
                <input 
                  v-model="form.endDate" 
                  type="datetime-local" 
                  class="ohhh-calendar-form-input"
                />
              </div>
            </div>
            
            <div class="ohhh-calendar-form-group">
              <label class="ohhh-calendar-form-label">
                <input type="checkbox" v-model="form.allDay" class="ohhh-calendar-form-checkbox" />
                全天事件
              </label>
            </div>
            
            <div class="ohhh-calendar-form-group">
              <label class="ohhh-calendar-form-label">颜色分类</label>
              <div class="ohhh-calendar-color-picker">
                <div 
                  v-for="color in colorOptions" 
                  :key="color"
                  class="ohhh-calendar-color-option"
                  :class="{ 'is-active': form.color === color }"
                  :style="{ background: color }"
                  @click="form.color = color"
                ></div>
              </div>
            </div>
            
            <div class="ohhh-calendar-form-group">
              <label class="ohhh-calendar-form-label">描述</label>
              <textarea 
                v-model="form.description" 
                class="ohhh-calendar-form-textarea"
                placeholder="请输入事件描述"
                rows="3"
              ></textarea>
            </div>
            
            <div v-if="errors.length" class="ohhh-calendar-form-errors">
              <div v-for="(error, index) in errors" :key="index" class="ohhh-calendar-form-error">
                {{ error }}
              </div>
            </div>
          </div>
          
          <div class="ohhh-calendar-modal-footer">
            <button v-if="isEdit" class="ohhh-calendar-btn ohhh-calendar-btn-danger" @click="handleDelete">
              删除
            </button>
            <div class="ohhh-calendar-modal-footer-right">
              <button class="ohhh-calendar-btn ohhh-calendar-btn-default" @click="handleClose">
                取消
              </button>
              <button class="ohhh-calendar-btn ohhh-calendar-btn-primary" @click="handleSubmit">
                {{ isEdit ? '保存' : '创建' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { validateEvent, formatEventTime } from '../utils/eventUtils.js'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  event: {
    type: Object,
    default: null
  },
  initialDate: {
    type: Date,
    default: () => new Date()
  }
})

const emit = defineEmits(['close', 'submit', 'delete'])

const colorOptions = [
  '#409eff',
  '#67c23a',
  '#e6a23c',
  '#f56c6c',
  '#909399',
  '#00d4ff',
  '#ff6b9d',
  '#8b5cf6'
]

const isEdit = computed(() => props.event !== null)

const defaultForm = () => ({
  title: '',
  startDate: formatDateTimeLocal(props.initialDate),
  endDate: formatDateTimeLocal(new Date(props.initialDate.getTime() + 3600000)),
  color: colorOptions[0],
  description: '',
  allDay: false
})

const form = ref(defaultForm())
const errors = ref([])

watch(() => props.visible, (val) => {
  if (val) {
    errors.value = []
    if (props.event) {
      form.value = {
        title: props.event.title,
        startDate: formatDateTimeLocal(new Date(props.event.startDate)),
        endDate: formatDateTimeLocal(new Date(props.event.endDate)),
        color: props.event.color || colorOptions[0],
        description: props.event.description || '',
        allDay: props.event.allDay || false
      }
    } else {
      form.value = defaultForm()
    }
  }
})

function formatDateTimeLocal(date) {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

function handleClose() {
  emit('close')
}

function handleSubmit() {
  const eventData = {
    ...form.value,
    startDate: new Date(form.value.startDate),
    endDate: new Date(form.value.endDate)
  }
  
  const validationErrors = validateEvent(eventData)
  if (validationErrors.length > 0) {
    errors.value = validationErrors
    return
  }
  
  emit('submit', {
    ...eventData,
    id: props.event?.id
  })
}

function handleDelete() {
  if (props.event) {
    emit('delete', props.event)
  }
}
</script>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.ohhh-calendar-modal-overlay {
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
}

.ohhh-calendar-modal {
  background: #fff;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.ohhh-calendar-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
}

.ohhh-calendar-modal-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.ohhh-calendar-modal-close {
  width: 24px;
  height: 24px;
  border: none;
  background: none;
  font-size: 20px;
  color: #909399;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.ohhh-calendar-modal-close:hover {
  background: #f5f7fa;
  color: #606266;
}

.ohhh-calendar-modal-body {
  padding: 20px;
}

.ohhh-calendar-form-group {
  margin-bottom: 16px;
}

.ohhh-calendar-form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.ohhh-calendar-form-label {
  display: block;
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}

.ohhh-calendar-form-input {
  width: 100%;
  height: 36px;
  padding: 0 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  color: #606266;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.ohhh-calendar-form-input:focus {
  outline: none;
  border-color: #409eff;
}

.ohhh-calendar-form-checkbox {
  margin-right: 8px;
  cursor: pointer;
}

.ohhh-calendar-form-textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  color: #606266;
  box-sizing: border-box;
  resize: vertical;
  transition: border-color 0.2s;
}

.ohhh-calendar-form-textarea:focus {
  outline: none;
  border-color: #409eff;
}

.ohhh-calendar-color-picker {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.ohhh-calendar-color-option {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.ohhh-calendar-color-option:hover {
  transform: scale(1.1);
}

.ohhh-calendar-color-option.is-active {
  border-color: #303133;
  transform: scale(1.1);
}

.ohhh-calendar-form-errors {
  margin-top: 16px;
  padding: 12px;
  background: #fef0f0;
  border-radius: 4px;
}

.ohhh-calendar-form-error {
  font-size: 13px;
  color: #f56c6c;
  margin-bottom: 4px;
}

.ohhh-calendar-form-error:last-child {
  margin-bottom: 0;
}

.ohhh-calendar-modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-top: 1px solid #eee;
}

.ohhh-calendar-modal-footer-right {
  display: flex;
  gap: 12px;
}

.ohhh-calendar-btn {
  height: 36px;
  padding: 0 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.ohhh-calendar-btn-default {
  background: #f5f7fa;
  color: #606266;
}

.ohhh-calendar-btn-default:hover {
  background: #e4e7ed;
}

.ohhh-calendar-btn-primary {
  background: #409eff;
  color: #fff;
}

.ohhh-calendar-btn-primary:hover {
  background: #66b1ff;
}

.ohhh-calendar-btn-danger {
  background: #f56c6c;
  color: #fff;
}

.ohhh-calendar-btn-danger:hover {
  background: #f78989;
}
</style>
