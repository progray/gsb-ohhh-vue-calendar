<template>
  <div class="app-container">
    <div class="app-toolbar">
      <button class="app-add-btn" @click="showEventModal = true">
        + 添加事件
      </button>
    </div>
    <ohhh-vue-calendar
      ref="calendarRef"
      :week-start="1"
      :markerDates="markerDates"
      :events="events"
      @select-change="onSelectChange"
    />
    <EventModal
      :visible="showEventModal"
      :initial-date="selectedDate"
      @confirm="handleAddEvent"
      @cancel="showEventModal = false"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import OhhhVueCalendar from './packages/Calendar/Calendar.vue'
import EventModal from './packages/Calendar/components/EventModal.vue'
import '/src/packages/Calendar/style/mobile/mobile.scss'

const calendarRef = ref(null)
const showEventModal = ref(false)
const selectedDate = ref(new Date())

const markerDates = [
  '2025-08-04',
  '2025-08-05',
  '2025-08-06',
  '2025-08-07',
  {
    date: '2025-08-08',
    color: '#ff6a6a'
  }
]

const events = ref([
  {
    id: 1,
    title: '测试事件1',
    date: new Date(2025, 7, 10)
  },
  {
    id: 2,
    title: '测试事件2',
    date: new Date(2025, 7, 15)
  }
])

function onSelectChange(date) {
  selectedDate.value = date
}

function handleAddEvent(eventData) {
  const newEvent = {
    id: Date.now(),
    title: eventData.title,
    date: eventData.date
  }
  events.value.push(newEvent)
  showEventModal.value = false
}
</script>

<style scoped>
.app-container {
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;
}

.app-toolbar {
  margin-bottom: 16px;
}

.app-add-btn {
  padding: 8px 16px;
  background: var(--calendar-theme-color, #409eff);
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: opacity 0.2s;
}

.app-add-btn:hover {
  opacity: 0.9;
}
</style>
