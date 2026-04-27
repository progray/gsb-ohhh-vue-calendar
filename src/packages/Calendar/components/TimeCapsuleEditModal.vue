<template>
  <Teleport to="body">
    <div v-if="visible" class="time-capsule-modal-overlay" @click="handleOverlayClick">
      <div class="time-capsule-modal" @click.stop>
        <div class="time-capsule-modal-header">
          <h3 class="time-capsule-modal-title">
            {{ isPast ? '已过期日期 - 不可修改' : '时光胶囊' }}
          </h3>
          <div class="time-capsule-modal-close" @click="handleClose">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </div>
        </div>
        
        <div class="time-capsule-modal-body">
          <div class="time-capsule-date">
            <span class="time-capsule-date-label">日期：</span>
            <span class="time-capsule-date-value">{{ formattedDate }}</span>
          </div>
          
          <div class="time-capsule-content">
            <label class="time-capsule-content-label">
              {{ isPast ? '备忘录内容：' : '胶囊内容（最多200字）：' }}
            </label>
            <textarea
              v-model="localContent"
              class="time-capsule-content-textarea"
              :class="{ 'is-disabled': isPast }"
              :disabled="isPast"
              placeholder="写下你想说的话..."
              maxlength="200"
              rows="6"
            ></textarea>
            <div class="time-capsule-char-count">
              <span :class="{ 'is-over': charCount > 200 }">{{ charCount }}</span>
              <span>/200</span>
            </div>
          </div>
        </div>
        
        <div class="time-capsule-modal-footer">
          <button
            v-if="!isPast"
            class="time-capsule-btn time-capsule-btn-secondary"
            @click="handleDelete"
          >
            删除
          </button>
          <div class="time-capsule-btn-group">
            <button
              class="time-capsule-btn time-capsule-btn-secondary"
              @click="handleClose"
            >
              取消
            </button>
            <button
              v-if="!isPast"
              class="time-capsule-btn time-capsule-btn-primary"
              @click="handleSave"
              :disabled="isSaving || localContent.length === 0"
            >
              {{ isSaving ? '保存中...' : '保存胶囊' }}
            </button>
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
  date: {
    type: Date,
    default: null
  },
  capsule: {
    type: Object,
    default: null
  },
  isPast: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'save', 'delete'])

const localContent = ref('')
const isSaving = ref(false)

const charCount = computed(() => localContent.value.length)

const formattedDate = computed(() => {
  if (!props.date) return ''
  return `${props.date.getFullYear()}年${props.date.getMonth() + 1}月${props.date.getDate()}日`
})

watch(
  () => props.capsule,
  (newCapsule) => {
    localContent.value = newCapsule?.content || ''
  },
  { immediate: true }
)

watch(
  () => props.visible,
  (newVisible) => {
    if (!newVisible) {
      isSaving.value = false
    }
  }
)

function handleClose() {
  emit('close')
}

function handleOverlayClick() {
  handleClose()
}

function handleSave() {
  if (localContent.value.length === 0 || localContent.value.length > 200) {
    return
  }
  
  isSaving.value = true
  emit('save', {
    date: props.date,
    content: localContent.value
  })
  setTimeout(() => {
    isSaving.value = false
  }, 300)
}

function handleDelete() {
  emit('delete', props.date)
}
</script>
