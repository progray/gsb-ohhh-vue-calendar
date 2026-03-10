<template>
  <div class="app-container">
    <div class="test-controls">
      <h3>日程管理测试</h3>
      <button @click="addTestEvent">添加测试事件</button>
      <button @click="clearEvents">清空所有事件</button>
      <div class="event-stats">
        <span>当前事件数: {{ events.length }}</span>
      </div>
    </div>
    
    <ohhh-vue-calendar 
      ref="calendarRef" 
      :week-start="1" 
      :markerDates 
      :events="events"
      :draggable="true"
      :max-events-per-day="3"
      :show-conflict-warning="true"
      :show-search="true"
      @select-change="onSelectChange"
      @event-add="onEventAdd"
      @event-update="onEventUpdate"
      @event-delete="onEventDelete"
      @event-click="onEventClick"
    />
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import OhhhVueCalendar from './packages/Calendar/Calendar.vue'
import '/src/packages/Calendar/style/mobile/mobile.scss'

const calendarRef = ref(null)

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

// 测试事件数据
const events = reactive([
  {
    id: '1',
    title: '团队会议',
    startDate: new Date(2025, 7, 10, 9, 0),
    endDate: new Date(2025, 7, 10, 10, 30),
    color: '#409eff',
    description: '每周团队例会',
    allDay: false
  },
  {
    id: '2',
    title: '项目评审',
    startDate: new Date(2025, 7, 12, 14, 0),
    endDate: new Date(2025, 7, 12, 16, 0),
    color: '#67c23a',
    description: '新项目评审会议',
    allDay: false
  },
  {
    id: '3',
    title: '全天培训',
    startDate: new Date(2025, 7, 15),
    endDate: new Date(2025, 7, 15),
    color: '#e6a23c',
    description: '新员工入职培训',
    allDay: true
  },
  {
    id: '4',
    title: '客户拜访',
    startDate: new Date(2025, 7, 18, 10, 0),
    endDate: new Date(2025, 7, 18, 12, 0),
    color: '#f56c6c',
    description: '拜访重要客户',
    allDay: false
  },
  {
    id: '5',
    title: '冲突测试1',
    startDate: new Date(2025, 7, 20, 9, 0),
    endDate: new Date(2025, 7, 20, 11, 0),
    color: '#909399',
    description: '测试事件冲突',
    allDay: false
  },
  {
    id: '6',
    title: '冲突测试2',
    startDate: new Date(2025, 7, 20, 10, 0),
    endDate: new Date(2025, 7, 20, 12, 0),
    color: '#909399',
    description: '这个事件与上一个冲突',
    allDay: false
  }
])

function onSelectChange(date) {
  console.log('选中日期:', date)
}

function onEventAdd(event) {
  console.log('添加事件:', event)
  events.push(event)
}

function onEventUpdate({ event, index }) {
  console.log('更新事件:', event, '索引:', index)
  if (index >= 0 && index < events.length) {
    events[index] = event
  }
}

function onEventDelete(event) {
  console.log('删除事件:', event)
  const index = events.findIndex(e => e.id === event.id)
  if (index >= 0) {
    events.splice(index, 1)
  }
}

function onEventClick({ event, index }) {
  console.log('点击事件:', event, '索引:', index)
}

function addTestEvent() {
  const today = new Date()
  const newEvent = {
    id: Date.now().toString(),
    title: '新事件 ' + (events.length + 1),
    startDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + events.length, 9, 0),
    endDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + events.length, 10, 0),
    color: getRandomColor(),
    description: '自动生成的测试事件',
    allDay: false
  }
  events.push(newEvent)
  console.log('添加测试事件:', newEvent)
}

function clearEvents() {
  events.splice(0, events.length)
  console.log('清空所有事件')
}

function getRandomColor() {
  const colors = ['#409eff', '#67c23a', '#e6a23c', '#f56c6c', '#909399', '#00d4ff', '#ff6b9d', '#b378ff']
  return colors[Math.floor(Math.random() * colors.length)]
}
</script>

<style scoped>
.app-container {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.test-controls {
  margin-bottom: 20px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 8px;
}

.test-controls h3 {
  margin: 0 0 10px 0;
  color: #303133;
}

.test-controls button {
  margin-right: 10px;
  padding: 8px 16px;
  background: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.3s;
}

.test-controls button:hover {
  background: #66b1ff;
}

.event-stats {
  margin-top: 10px;
  color: #606266;
  font-size: 14px;
}
</style>
