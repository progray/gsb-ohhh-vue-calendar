<template>
  <div v-if="visible" class="ohhh-calendar-event-modal-overlay" @click.self="handleCancel">
    <div class="ohhh-calendar-event-modal">
      <div class="ohhh-calendar-event-modal--header">
        <span class="ohhh-calendar-event-modal--title">添加事件</span>
        <button class="ohhh-calendar-event-modal--close" @click="handleCancel">×</button>
      </div>
      <div class="ohhh-calendar-event-modal--body">
        <div class="ohhh-calendar-event-modal--field">
          <label class="ohhh-calendar-event-modal--label">事件标题</label>
          <input
            v-model="eventTitle"
            type="text"
            class="ohhh-calendar-event-modal--input"
            placeholder="请输入事件标题"
            @keyup.enter="handleConfirm"
          />
        </div>
        <div class="ohhh-calendar-event-modal--field">
          <label class="ohhh-calendar-event-modal--label">日期</label>
          <input
            v-model="eventDate"
            type="date"
            class="ohhh-calendar-event-modal--input"
          />
        </div>
      </div>
      <div class="ohhh-calendar-event-modal--footer">
        <button class="ohhh-calendar-event-modal--btn ohhh-calendar-event-modal--btn-cancel" @click="handleCancel">
          取消
        </button>
        <button class="ohhh-calendar-event-modal--btn ohhh-calendar-event-modal--btn-confirm" @click="handleConfirm">
          确定
        </button>
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
  initialDate: {
    type: Date,
    default: () => new Date()
  }
})

const emit = defineEmits(['confirm', 'cancel'])

const eventTitle = ref('')
const eventDate = ref('')

const formattedInitialDate = computed(() => {
  const date = props.initialDate
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
})

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      eventTitle.value = ''
      eventDate.value = formattedInitialDate.value
    }
  }
)

function handleCancel() {
  emit('cancel')
}

function handleConfirm() {
  if (!eventTitle.value.trim()) {
    return
  }
  const date = new Date(eventDate.value)
  if (isNaN(date.getTime())) {
    return
  }
  emit('confirm', {
    title: eventTitle.value.trim(),
    date: date
  })
}
</script>
