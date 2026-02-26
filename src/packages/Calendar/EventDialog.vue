<template>
  <Teleport to="body">
    <div v-if="visible" class="ohhh-event-dialog-overlay" @click.self="handleClose">
      <div class="ohhh-event-dialog">
        <div class="ohhh-event-dialog--header">
          <h3 class="ohhh-event-dialog--title">{{ isEdit ? '编辑事件' : '新建事件' }}</h3>
          <button class="ohhh-event-dialog--close" @click="handleClose">&times;</button>
        </div>
        <div class="ohhh-event-dialog--body">
          <div class="ohhh-event-dialog--field">
            <label>事件标题</label>
            <input v-model="formData.title" type="text" placeholder="请输入事件标题" />
          </div>
          <div class="ohhh-event-dialog--field">
            <label>开始时间</label>
            <input v-model="formData.start" type="datetime-local" />
          </div>
          <div class="ohhh-event-dialog--field">
            <label>结束时间</label>
            <input v-model="formData.end" type="datetime-local" />
          </div>
          <div class="ohhh-event-dialog--field">
            <label>事件颜色</label>
            <div class="ohhh-event-dialog--colors">
              <div
                v-for="color in colorOptions"
                :key="color"
                class="ohhh-event-dialog--color-item"
                :class="{ 'is-selected': formData.color === color }"
                :style="{ background: color }"
                @click="formData.color = color"
              ></div>
            </div>
          </div>
          <div class="ohhh-event-dialog--field">
            <label>备注</label>
            <textarea v-model="formData.description" placeholder="请输入备注信息"></textarea>
          </div>
          <div v-if="hasConflict" class="ohhh-event-dialog--conflict">
            <span class="conflict-icon">!</span>
            <span>检测到时间冲突，请调整时间</span>
          </div>
        </div>
        <div class="ohhh-event-dialog--footer">
          <button v-if="isEdit" class="btn btn-delete" @click="handleDelete">删除</button>
          <div class="ohhh-event-dialog--actions">
            <button class="btn btn-cancel" @click="handleClose">取消</button>
            <button class="btn btn-confirm" @click="handleConfirm">确定</button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

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
    default: null
  },
  conflicts: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close', 'confirm', 'delete'])

const colorOptions = [
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
  '#84CC16'
]

const formData = ref({
  id: null,
  title: '',
  start: '',
  end: '',
  color: colorOptions[0],
  description: ''
})

const isEdit = computed(() => !!props.event?.id)
const hasConflict = computed(() => props.conflicts.length > 0)

watch(
  () => props.visible,
  (val) => {
    if (val) {
      initFormData()
    }
  },
  { immediate: true }
)

function initFormData() {
  if (props.event) {
    formData.value = {
      id: props.event.id || null,
      title: props.event.title || '',
      start: formatDateTimeForInput(new Date(props.event.start)),
      end: props.event.end ? formatDateTimeForInput(new Date(props.event.end)) : '',
      color: props.event.color || colorOptions[0],
      description: props.event.description || ''
    }
  } else {
    const startDate = props.initialDate || new Date()
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000)
    formData.value = {
      id: null,
      title: '',
      start: formatDateTimeForInput(startDate),
      end: formatDateTimeForInput(endDate),
      color: colorOptions[0],
      description: ''
    }
  }
}

function formatDateTimeForInput(date) {
  if (!date) return ''
  const d = new Date(date)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function parseFromInput(value) {
  if (!value) return null
  const date = new Date(value)
  return isNaN(date.getTime()) ? null : date.toISOString()
}

function handleClose() {
  emit('close')
}

function handleConfirm() {
  if (!formData.value.title.trim()) {
    alert('请输入事件标题')
    return
  }
  if (!formData.value.start) {
    alert('请选择开始时间')
    return
  }
  const eventData = {
    id: formData.value.id,
    title: formData.value.title.trim(),
    start: parseFromInput(formData.value.start),
    end: parseFromInput(formData.value.end),
    color: formData.value.color,
    description: formData.value.description.trim() || null
  }
  emit('confirm', eventData)
}

function handleDelete() {
  if (!formData.value.id) return
  if (confirm('确定要删除这个事件吗？')) {
    emit('delete', formData.value.id)
  }
}
</script>
