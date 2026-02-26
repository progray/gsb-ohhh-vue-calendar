<template>
  <div class="app-container">
    <ohhh-vue-calendar
      ref="calendarRef"
      :week-start="1"
      :events="events"
      :max-visible-events="3"
      @select-change="onSelectChange"
      @event-click="onEventClick"
      @event-add="onEventAdd"
      @event-update="onEventUpdate"
      @event-delete="onEventDelete"
    />
    <div class="demo-controls">
      <button @click="addRandomEvent">添加随机事件</button>
      <button @click="clearAllEvents">清空所有事件</button>
    </div>
    <div v-if="selectedEvent" class="event-detail">
      <h3>事件详情</h3>
      <p><strong>标题:</strong> {{ selectedEvent.title }}</p>
      <p><strong>日期:</strong> {{ formatDate(selectedEvent.date) }}</p>
      <p v-if="selectedEvent.startTime"><strong>时间:</strong> {{ selectedEvent.startTime }}{{ selectedEvent.endTime ? ` - ${selectedEvent.endTime}` : '' }}</p>
      <p v-if="selectedEvent.description"><strong>描述:</strong> {{ selectedEvent.description }}</p>
      <button @click="deleteSelectedEvent">删除此事件</button>
      <button @click="selectedEvent = null">关闭</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import OhhhVueCalendar from './packages/Calendar/Calendar.vue'
import '/src/packages/Calendar/style/mobile/mobile.scss'

const calendarRef = ref(null)
const selectedEvent = ref(null)

const colors = ['red', 'orange', 'yellow', 'green', 'cyan', 'blue', 'purple', 'pink']

const events = ref([
  {
    id: 'event-1',
    title: '团队会议',
    date: new Date(),
    color: 'blue',
    startTime: '09:00',
    endTime: '10:00',
    description: '每周团队例会'
  },
  {
    id: 'event-2',
    title: '午餐约会',
    date: new Date(),
    color: 'green',
    startTime: '12:00',
    endTime: '13:00'
  },
  {
    id: 'event-3',
    title: '项目评审',
    date: new Date(),
    color: 'orange',
    startTime: '14:00',
    endTime: '15:30'
  },
  {
    id: 'event-4',
    title: '代码审查',
    date: new Date(Date.now() + 86400000),
    color: 'purple',
    startTime: '10:00',
    endTime: '11:00'
  },
  {
    id: 'event-5',
    title: '客户拜访',
    date: new Date(Date.now() + 86400000 * 2),
    color: 'red',
    startTime: '15:00',
    endTime: '16:00'
  },
  {
    id: 'event-6',
    title: '培训课程',
    date: new Date(Date.now() + 86400000 * 3),
    color: 'cyan',
    startTime: '09:00',
    endTime: '12:00'
  },
  {
    id: 'event-7',
    title: '冲突事件1',
    date: new Date(Date.now() + 86400000 * 4),
    color: 'blue',
    startTime: '10:00',
    endTime: '11:00'
  },
  {
    id: 'event-8',
    title: '冲突事件2',
    date: new Date(Date.now() + 86400000 * 4),
    color: 'red',
    startTime: '10:30',
    endTime: '11:30'
  }
])

function onSelectChange(date) {
  console.log('选中日期:', date)
}

function onEventClick({ type, event, date, events: dateEvents }) {
  if (type === 'click') {
    selectedEvent.value = event
  } else if (type === 'show-all') {
    console.log('显示所有事件:', date, dateEvents)
  }
}

function onEventAdd({ event, conflicts }) {
  console.log('事件添加请求:', event)
  if (conflicts) {
    console.warn('检测到冲突:', conflicts)
  }
  events.value.push(event)
}

function onEventUpdate({ event, type, conflicts }) {
  console.log('事件更新请求:', event, '类型:', type)
  if (conflicts) {
    console.warn('检测到冲突:', conflicts)
  }
  const index = events.value.findIndex(e => e.id === event.id)
  if (index !== -1) {
    events.value[index] = event
  }
}

function onEventDelete({ event }) {
  console.log('事件删除请求:', event)
  const index = events.value.findIndex(e => e.id === event.id)
  if (index !== -1) {
    events.value.splice(index, 1)
  }
  if (selectedEvent.value?.id === event.id) {
    selectedEvent.value = null
  }
}

function addRandomEvent() {
  const randomDays = Math.floor(Math.random() * 14) - 7
  const randomHour = Math.floor(Math.random() * 10) + 8
  const randomColor = colors[Math.floor(Math.random() * colors.length)]
  const newEvent = {
    id: `event-${Date.now()}`,
    title: `新事件 ${Date.now()}`,
    date: new Date(Date.now() + randomDays * 86400000),
    color: randomColor,
    startTime: `${randomHour}:00`,
    endTime: `${randomHour + 1}:00`
  }
  events.value.push(newEvent)
}

function clearAllEvents() {
  events.value = []
  selectedEvent.value = null
}

function deleteSelectedEvent() {
  if (selectedEvent.value) {
    const index = events.value.findIndex(e => e.id === selectedEvent.value.id)
    if (index !== -1) {
      events.value.splice(index, 1)
    }
    selectedEvent.value = null
  }
}

function formatDate(date) {
  if (!date) return ''
  const d = date instanceof Date ? date : new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
</script>

<style>
.app-container {
  padding: 20px;
  max-width: 500px;
  margin: 0 auto;
}

.demo-controls {
  margin-top: 20px;
  display: flex;
  gap: 10px;
  justify-content: center;
}

.demo-controls button {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  background: #409eff;
  color: white;
  cursor: pointer;
  font-size: 14px;
}

.demo-controls button:hover {
  background: #66b1ff;
}

.event-detail {
  margin-top: 20px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.event-detail h3 {
  margin: 0 0 12px 0;
  color: #303133;
}

.event-detail p {
  margin: 8px 0;
  color: #606266;
}

.event-detail button {
  margin-right: 10px;
  margin-top: 12px;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.event-detail button:first-of-type {
  background: #f56c6c;
  color: white;
}

.event-detail button:last-of-type {
  background: #909399;
  color: white;
}
</style>
