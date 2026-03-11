<template>
  <Teleport to="body">
    <Transition name="event-editor-fade">
      <div v-if="visible" class="event-editor-mask" @click.self="handleClose">
        <div class="event-editor">
          <div class="event-editor-header">
            <span class="event-editor-title">{{ isEdit ? '编辑事件' : '新建事件' }}</span>
            <button class="event-editor-close" @click="handleClose">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          
          <div class="event-editor-body">
            <div class="event-editor-field">
              <label class="event-editor-label">标题</label>
              <input 
                v-model="form.title" 
                type="text" 
                class="event-editor-input"
                placeholder="请输入事件标题"
                maxlength="50"
              />
            </div>
            
            <div class="event-editor-field">
              <label class="event-editor-label">开始时间</label>
              <input 
                v-model="startDateTime" 
                type="datetime-local" 
                class="event-editor-input"
              />
            </div>
            
            <div class="event-editor-field">
              <label class="event-editor-label">结束时间</label>
              <input 
                v-model="endDateTime" 
                type="datetime-local" 
                class="event-editor-input"
              />
            </div>
            
            <div class="event-editor-field">
              <label class="event-editor-label">
                <input type="checkbox" v-model="form.allDay" class="event-editor-checkbox" />
                全天
              </label>
            </div>
            
            <div class="event-editor-field">
              <label class="event-editor-label">颜色</label>
              <div class="event-editor-colors">
                <button 
                  v-for="(color, key) in EVENT_COLORS_MAP" 
                  :key="key"
                  class="event-editor-color"
                  :class="{ 'is-active': form.color === color }"
                  :style="{ background: color }"
                  @click="form.color = color"
                ></button>
              </div>
            </div>
            
            <div class="event-editor-field">
              <label class="event-editor-label">描述</label>
              <textarea 
                v-model="form.description" 
                class="event-editor-textarea"
                placeholder="请输入事件描述（可选）"
                rows="3"
                maxlength="200"
              ></textarea>
            </div>
            
            <div v-if="conflictWarning" class="event-editor-warning">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>该时间段与以下事件冲突：{{ conflictWarning.map(e => e.title).join('、') }}</span>
            </div>
          </div>
          
          <div class="event-editor-footer">
            <button v-if="isEdit" class="event-editor-btn event-editor-btn--delete" @click="handleDelete">
              删除
            </button>
            <div class="event-editor-footer-right">
              <button class="event-editor-btn event-editor-btn--cancel" @click="handleClose">
                取消
              </button>
              <button class="event-editor-btn event-editor-btn--confirm" @click="handleConfirm">
                {{ isEdit ? '保存' : '创建' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import type { CalendarEvent } from '../types'
import { EVENT_COLORS } from '../types'
import { normalizeEvent, checkEventConflicts } from '../utils/eventUtils'

const props = defineProps<{
  visible: boolean
  event?: CalendarEvent | null
  selectedDate?: Date
  events: CalendarEvent[]
  enableConflictCheck?: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', event: CalendarEvent): void
  (e: 'delete', eventId: string): void
}>()

const EVENT_COLORS_MAP = EVENT_COLORS
const defaultColor = EVENT_COLORS.blue

const form = ref<Partial<CalendarEvent>>({
  title: '',
  startDate: new Date(),
  endDate: new Date(Date.now() + 3600000),
  color: defaultColor,
  description: '',
  allDay: false
})

const startDateTime = ref('')
const endDateTime = ref('')

const isEdit = computed(() => !!props.event?.id)
const conflictWarning = ref<CalendarEvent[] | null>(null)

watch(() => props.visible, async (val) => {
  if (val) {
    await nextTick()
    resetForm()
    if (props.event) {
      form.value = { ...props.event }
      updateDateTimeInputs(new Date(props.event.startDate), new Date(props.event.endDate))
    } else if (props.selectedDate) {
      const start = new Date(props.selectedDate)
      start.setHours(9, 0, 0, 0)
      const end = new Date(props.selectedDate)
      end.setHours(10, 0, 0, 0)
      form.value.startDate = start
      form.value.endDate = end
      form.value.color = defaultColor
      updateDateTimeInputs(start, end)
    }
    checkConflicts()
  }
}, { immediate: true })

watch([startDateTime, endDateTime], () => {
  if (startDateTime.value) {
    form.value.startDate = new Date(startDateTime.value)
  }
  if (endDateTime.value) {
    form.value.endDate = new Date(endDateTime.value)
  }
  checkConflicts()
})

function updateDateTimeInputs(start: Date, end: Date) {
  const formatDateTime = (d: Date) => {
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }
  startDateTime.value = formatDateTime(start)
  endDateTime.value = formatDateTime(end)
}

function resetForm() {
  form.value = {
    title: '',
    startDate: new Date(),
    endDate: new Date(Date.now() + 3600000),
    color: defaultColor,
    description: '',
    allDay: false
  }
  conflictWarning.value = null
}

function checkConflicts() {
  if (!props.enableConflictCheck) return
  
  const event = normalizeEvent(form.value)
  if (!event.title) return
  
  const result = checkEventConflicts(props.events, event)
  conflictWarning.value = result?.conflicts || null
}

function handleClose() {
  emit('close')
}

function handleConfirm() {
  if (!form.value.title?.trim()) {
    alert('请输入事件标题')
    return
  }
  
  const start = new Date(form.value.startDate!)
  const end = new Date(form.value.endDate!)
  
  if (end <= start) {
    alert('结束时间必须晚于开始时间')
    return
  }
  
  const event = normalizeEvent(form.value)
  emit('save', event)
}

function handleDelete() {
  if (props.event?.id && confirm('确定要删除这个事件吗？')) {
    emit('delete', props.event.id)
  }
}
</script>

<style scoped>
.event-editor-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.event-editor {
  width: 90%;
  max-width: 480px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.event-editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
}

.event-editor-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.event-editor-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  color: #999;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;
}

.event-editor-close:hover {
  background: #f5f5f5;
  color: #666;
}

.event-editor-body {
  padding: 20px;
  max-height: 60vh;
  overflow-y: auto;
}

.event-editor-field {
  margin-bottom: 16px;
}

.event-editor-label {
  display: block;
  font-size: 14px;
  color: #666;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.event-editor-input {
  width: 100%;
  height: 40px;
  padding: 0 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  color: #333;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.event-editor-input:focus {
  outline: none;
  border-color: #409eff;
}

.event-editor-checkbox {
  width: auto;
  height: auto;
  accent-color: #409eff;
}

.event-editor-colors {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.event-editor-color {
  width: 28px;
  height: 28px;
  border: 2px solid transparent;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.event-editor-color:hover {
  transform: scale(1.1);
}

.event-editor-color.is-active {
  border-color: #333;
}

.event-editor-color.is-active::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 10px;
  height: 10px;
  background: #fff;
  border-radius: 50%;
}

.event-editor-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  color: #333;
  resize: none;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.event-editor-textarea:focus {
  outline: none;
  border-color: #409eff;
}

.event-editor-warning {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px;
  background: #fff7e6;
  border: 1px solid #ffd591;
  border-radius: 6px;
  color: #fa8c16;
  font-size: 13px;
}

.event-editor-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-top: 1px solid #eee;
}

.event-editor-footer-right {
  display: flex;
  gap: 12px;
}

.event-editor-btn {
  height: 36px;
  padding: 0 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.event-editor-btn--cancel {
  background: #f5f5f5;
  color: #666;
}

.event-editor-btn--cancel:hover {
  background: #e8e8e8;
}

.event-editor-btn--confirm {
  background: #409eff;
  color: #fff;
}

.event-editor-btn--confirm:hover {
  background: #66b1ff;
}

.event-editor-btn--delete {
  background: #fef0f0;
  color: #f56c6c;
}

.event-editor-btn--delete:hover {
  background: #fde2e2;
}

.event-editor-fade-enter-active,
.event-editor-fade-leave-active {
  transition: opacity 0.2s;
}

.event-editor-fade-enter-from,
.event-editor-fade-leave-to {
  opacity: 0;
}

.event-editor-fade-enter-active .event-editor,
.event-editor-fade-leave-active .event-editor {
  transition: transform 0.2s;
}

.event-editor-fade-enter-from .event-editor,
.event-editor-fade-leave-to .event-editor {
  transform: scale(0.95);
}
</style>
