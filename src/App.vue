<template>
  <div class="app-container">
    <div class="app-header">
      <h1>Ohhh Vue Calendar - 日程管理</h1>
      <div class="app-controls">
        <button @click="addSampleEvent">添加示例事件</button>
        <button @click="clearEvents">清空事件</button>
      </div>
    </div>
    
    <ohhh-vue-calendar 
      ref="calendarRef" 
      :week-start="1" 
      :marker-dates="markerDates"
      :events="events"
      :show-events="true"
      :show-event-time="true"
      :max-visible-events="3"
      :enable-conflict-check="true"
      :draggable="true"
      :click-to-add-event="true"
      @select-change="onSelectChange"
      @event-add="onEventAdd"
      @event-update="onEventUpdate"
      @event-delete="onEventDelete"
      @event-click="onEventClick"
    />
    
    <div class="app-event-list">
      <h3>事件列表 ({{ events.length }})</h3>
      <div v-for="event in events" :key="event.id" class="event-item">
        <span class="event-color" :style="{ background: event.color }"></span>
        <span class="event-title">{{ event.title }}</span>
        <span class="event-time">{{ formatDate(event.startDate) }} - {{ formatDate(event.endDate) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import OhhhVueCalendar from './packages/Calendar/Calendar.vue'
import type { CalendarEvent } from './packages/Calendar/types'
import { EVENT_COLORS } from './packages/Calendar/types'
import '/src/packages/Calendar/style/index.scss'

const calendarRef = useTemplateRef<typeof OhhhVueCalendar>('calendarRef')

const markerDates = [
  new Date(),
  { date: new Date(Date.now() + 86400000 * 2), color: '#ff6a6a' }
]

const events = ref<CalendarEvent[]>([
  {
    id: '1',
    title: '团队会议',
    startDate: new Date(),
    endDate: new Date(Date.now() + 3600000 * 2),
    color: EVENT_COLORS.blue,
    description: '每周团队例会'
  },
  {
    id: '2',
    title: '项目评审',
    startDate: new Date(Date.now() + 86400000),
    endDate: new Date(Date.now() + 86400000 + 3600000 * 1.5),
    color: EVENT_COLORS.green,
    description: 'Q3项目评审会议'
  },
  {
    id: '3',
    title: '跨部门协作',
    startDate: new Date(Date.now() + 86400000 * 2),
    endDate: new Date(Date.now() + 86400000 * 4),
    color: EVENT_COLORS.orange,
    allDay: true,
    description: '与产品部门协作'
  },
  {
    id: '4',
    title: '技术培训',
    startDate: new Date(Date.now() + 86400000 * 3),
    endDate: new Date(Date.now() + 86400000 * 3 + 3600000 * 3),
    color: EVENT_COLORS.purple,
    description: 'Vue 3 高级培训'
  },
  {
    id: '5',
    title: '客户会议',
    startDate: new Date(Date.now() + 86400000 * 3),
    endDate: new Date(Date.now() + 86400000 * 3 + 3600000 * 2),
    color: EVENT_COLORS.red,
    description: '与重要客户会谈'
  }
])

function formatDate(date: Date) {
  const d = new Date(date)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function onSelectChange(date: Date) {
  console.log('选中日期:', date)
}

function onEventAdd(event: CalendarEvent) {
  console.log('添加事件:', event)
  // 确保ID不重复 - 使用事件自带的ID（已经由normalizeEvent生成）
  events.value.push({ ...event })
}

function onEventUpdate(event: CalendarEvent) {
  console.log('更新事件:', event)
  const index = events.value.findIndex(e => e.id === event.id)
  if (index !== -1) {
    events.value[index] = event
  }
}

function onEventDelete(eventId: string) {
  console.log('删除事件:', eventId)
  events.value = events.value.filter(e => e.id !== eventId)
}

function onEventClick(event: CalendarEvent) {
  console.log('点击事件:', event)
}

function addSampleEvent() {
  const colors = Object.values(EVENT_COLORS)
  const randomColor = colors[Math.floor(Math.random() * colors.length)]
  const randomDay = Math.floor(Math.random() * 7)
  
  const newEvent: CalendarEvent = {
    id: Date.now().toString(),
    title: `新事件 ${events.value.length + 1}`,
    startDate: new Date(Date.now() + 86400000 * randomDay),
    endDate: new Date(Date.now() + 86400000 * randomDay + 3600000 * 2),
    color: randomColor,
    description: '自动生成的示例事件'
  }
  events.value.push(newEvent)
}

function clearEvents() {
  events.value = []
}
</script>

<style scoped>
.app-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.app-header h1 {
  margin: 0;
  font-size: 24px;
  color: #333;
}

.app-controls button {
  margin-left: 10px;
  padding: 8px 16px;
  background: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.app-controls button:hover {
  background: #66b1ff;
}

.app-event-list {
  margin-top: 30px;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
}

.app-event-list h3 {
  margin: 0 0 15px 0;
  font-size: 16px;
  color: #333;
}

.event-item {
  display: flex;
  align-items: center;
  padding: 10px;
  background: white;
  border-radius: 4px;
  margin-bottom: 8px;
  gap: 12px;
}

.event-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex: none;
}

.event-title {
  flex: 1;
  font-weight: 500;
  color: #333;
}

.event-time {
  color: #909399;
  font-size: 13px;
}
</style>
