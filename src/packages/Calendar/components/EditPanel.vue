<template>
  <div v-if="visible" class="edit-panel-overlay" @click.self="handleClose">
    <div class="edit-panel">
      <div class="edit-panel-header">
        <h3 class="edit-panel-title">{{ formatDateTitle(selectedDate) }}</h3>
        <button class="edit-panel-close" @click="handleClose">×</button>
      </div>
      
      <div class="edit-panel-content">
        <div class="edit-section day-section">
          <div class="edit-section-header">
            <span class="section-icon">☀️</span>
            <span class="section-title">白天</span>
          </div>
          <textarea
            v-model="dayContent"
            class="edit-textarea"
            placeholder="记录白天的事情..."
          ></textarea>
          <div class="tags-section">
            <div class="tags-label">标签:</div>
            <div class="tags-selector">
              <span
                v-for="tag in defaultTags"
                :key="tag"
                class="tag-item"
                :class="{ 'is-selected': selectedDayTags.includes(tag) }"
                @click="toggleDayTag(tag)"
              >{{ tag }}</span>
            </div>
          </div>
        </div>
        
        <div class="edit-section night-section">
          <div class="edit-section-header">
            <span class="section-icon">🌙</span>
            <span class="section-title">夜晚</span>
          </div>
          <textarea
            v-model="nightContent"
            class="edit-textarea"
            placeholder="记录夜晚的事情..."
          ></textarea>
          <div class="tags-section">
            <div class="tags-label">标签:</div>
            <div class="tags-selector">
              <span
                v-for="tag in defaultTags"
                :key="tag"
                class="tag-item"
                :class="{ 'is-selected': selectedNightTags.includes(tag) }"
                @click="toggleNightTag(tag)"
              >{{ tag }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="edit-panel-footer">
        <button class="btn-clear" @click="handleClearDay">清空白天</button>
        <button class="btn-clear" @click="handleClearNight">清空夜晚</button>
        <button class="btn-save" @click="handleSave">保存</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  selectedDate: {
    type: Date,
    default: null
  },
  record: {
    type: Object,
    default: null
  },
  defaultTags: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close', 'save', 'clearDay', 'clearNight'])

const dayContent = ref('')
const nightContent = ref('')
const selectedDayTags = ref([])
const selectedNightTags = ref([])

watch(() => props.record, (newRecord) => {
  if (newRecord) {
    dayContent.value = newRecord.day?.content || ''
    nightContent.value = newRecord.night?.content || ''
    selectedDayTags.value = [...(newRecord.day?.tags || [])]
    selectedNightTags.value = [...(newRecord.night?.tags || [])]
  } else {
    dayContent.value = ''
    nightContent.value = ''
    selectedDayTags.value = []
    selectedNightTags.value = []
  }
}, { immediate: true })

function formatDateTitle(date) {
  if (!date) return ''
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const weekDay = weekDays[date.getDay()]
  return `${year}年${month}月${day}日 ${weekDay}`
}

function toggleDayTag(tag) {
  const index = selectedDayTags.value.indexOf(tag)
  if (index > -1) {
    selectedDayTags.value.splice(index, 1)
  } else {
    selectedDayTags.value.push(tag)
  }
}

function toggleNightTag(tag) {
  const index = selectedNightTags.value.indexOf(tag)
  if (index > -1) {
    selectedNightTags.value.splice(index, 1)
  } else {
    selectedNightTags.value.push(tag)
  }
}

function handleClose() {
  emit('close')
}

function handleSave() {
  emit('save', {
    date: props.selectedDate,
    dayContent: dayContent.value,
    dayTags: selectedDayTags.value,
    nightContent: nightContent.value,
    nightTags: selectedNightTags.value
  })
  handleClose()
}

function handleClearDay() {
  dayContent.value = ''
  selectedDayTags.value = []
  emit('clearDay', props.selectedDate)
}

function handleClearNight() {
  nightContent.value = ''
  selectedNightTags.value = []
  emit('clearNight', props.selectedDate)
}
</script>