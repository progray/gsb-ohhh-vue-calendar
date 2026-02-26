<template>
  <div class="app-container">
    <div class="demo-section">
      <h2>ohhh-vue-calendar 日程管理演示</h2>

      <div class="toolbar">
        <button @click="addSampleEvent">添加示例事件</button>
        <button @click="clearAllEvents">清空所有事件</button>
        <button @click="checkConflicts">检查冲突</button>
        <button @click="showQueryPanel = !showQueryPanel">查询日程</button>
      </div>

      <!-- 查询面板 -->
      <div v-if="showQueryPanel" class="query-panel">
        <h4>查询日程</h4>
        <div class="query-form">
          <input v-model="queryForm.title" placeholder="标题关键词" />
          <select v-model="queryForm.color">
            <option value="">所有颜色</option>
            <option value="default">默认</option>
            <option value="red">红色</option>
            <option value="orange">橙色</option>
            <option value="green">绿色</option>
            <option value="cyan">青色</option>
            <option value="blue">蓝色</option>
            <option value="purple">紫色</option>
            <option value="pink">粉色</option>
          </select>
          <label class="checkbox-label">
            <input type="checkbox" v-model="queryForm.hasConflict" />
            仅显示冲突
          </label>
          <button @click="executeQuery">查询</button>
          <button @click="resetQuery">重置</button>
        </div>
        <div v-if="queryResults.length > 0" class="query-results">
          <div class="result-count">找到 {{ queryResults.length }} 个结果</div>
          <div v-for="event in queryResults" :key="event.id" class="result-item">
            <span class="result-color" :style="{ background: getColorValue(event.color) }"></span>
            <span class="result-title">{{ event.title }}</span>
            <span class="result-date">{{ event.date }}</span>
            <span v-if="event.time" class="result-time">{{ event.time }}</span>
            <span v-if="event.hasConflict" class="result-conflict">冲突</span>
          </div>
        </div>
      </div>

      <div class="event-stats">
        <span>总事件数: {{ events.length }}</span>
        <span>冲突事件: {{ conflictCount }}</span>
      </div>

      <ohhh-vue-calendar
        ref="calendarRef"
        :week-start="1"
        :markerDates
        :events="events"
        :enableDragDrop="true"
        :enableConflictCheck="true"
        @select-change="onSelectChange"
        @event-add="onEventAdd"
        @event-update="onEventUpdate"
        @event-delete="onEventDelete"
        @event-click="onEventClick"
        @event-drag="onEventDrag"
      />

      <div class="event-log">
        <h3>操作日志</h3>
        <div class="log-list">
          <div v-for="(log, index) in logs" :key="index" class="log-item">
            {{ log }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useTemplateRef, ref, computed } from 'vue'
import OhhhVueCalendar from './packages/Calendar/Calendar.vue'
import '/src/packages/Calendar/style/mobile/mobile.scss'

const calendarRef = useTemplateRef('calendarRef')

const logs = ref([])
const showQueryPanel = ref(false)
const queryResults = ref([])
const queryForm = ref({
  title: '',
  color: '',
  hasConflict: false
})

function addLog(message) {
  const time = new Date().toLocaleTimeString()
  logs.value.unshift(`[${time}] ${message}`)
  if (logs.value.length > 10) {
    logs.value.pop()
  }
}

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
    id: '1',
    title: '团队会议',
    date: formatDate(new Date()),
    time: '09:00',
    color: 'blue',
    description: '每周例会'
  },
  {
    id: '2',
    title: '项目评审',
    date: formatDate(new Date()),
    time: '14:00',
    color: 'orange',
    description: '新项目评审'
  },
  {
    id: '3',
    title: '客户拜访',
    date: formatDate(new Date(new Date().setDate(new Date().getDate() + 1))),
    time: '10:00',
    color: 'green',
    description: '重要客户'
  },
  {
    id: '4',
    title: '需求讨论',
    date: formatDate(new Date()),
    time: '09:30',
    color: 'purple',
    description: '产品需求'
  },
  {
    id: '5',
    title: '代码审查',
    date: formatDate(new Date()),
    time: '16:00',
    color: 'cyan',
    description: '代码走查'
  }
])

const conflictCount = computed(() => {
  return events.value.filter(e => e.hasConflict).length
})

function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getColorValue(color) {
  const colorMap = {
    default: '#409eff',
    red: '#f56c6c',
    orange: '#e6a23c',
    green: '#67c23a',
    cyan: '#13c2c2',
    blue: '#1890ff',
    purple: '#722ed1',
    pink: '#eb2f96'
  }
  return colorMap[color] || colorMap.default
}

function onSelectChange(date) {
  console.log('选中日期:', date)
}

function onEventAdd(event) {
  addLog(`添加事件: ${event.title}`)
}

function onEventUpdate(event) {
  addLog(`更新事件: ${event.title}`)
}

function onEventDelete(event) {
  addLog(`删除事件: ${event.title}`)
}

function onEventClick(event) {
  addLog(`点击事件: ${event.title}`)
}

function onEventDrag({ event, oldDate, newDate }) {
  addLog(`拖拽事件: ${event.title} 从 ${oldDate} 到 ${newDate}`)
}

function addSampleEvent() {
  const today = new Date()
  const randomHour = 9 + Math.floor(Math.random() * 8)
  const colors = ['default', 'red', 'orange', 'green', 'cyan', 'blue', 'purple', 'pink']
  const randomColor = colors[Math.floor(Math.random() * colors.length)]

  const newEvent = {
    title: `新事件 ${Math.floor(Math.random() * 100)}`,
    date: formatDate(today),
    time: `${String(randomHour).padStart(2, '0')}:00`,
    color: randomColor,
    description: '这是一个示例事件'
  }

  calendarRef.value?.addEvent(newEvent)
}

function clearAllEvents() {
  const allEvents = calendarRef.value?.getEvents() || []
  allEvents.forEach(event => {
    calendarRef.value?.removeEvent(event.id)
  })
  addLog('清空所有事件')
}

function checkConflicts() {
  calendarRef.value?.checkConflicts()
  addLog('手动检查冲突完成')
}

// 查询功能
function executeQuery() {
  const query = {}
  if (queryForm.value.title) query.title = queryForm.value.title
  if (queryForm.value.color) query.color = queryForm.value.color
  if (queryForm.value.hasConflict) query.hasConflict = true

  queryResults.value = calendarRef.value?.queryEvents(query) || []
  addLog(`查询: 找到 ${queryResults.value.length} 个事件`)
}

function resetQuery() {
  queryForm.value = {
    title: '',
    color: '',
    hasConflict: false
  }
  queryResults.value = []
}
</script>

<style scoped>
.app-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

.demo-section {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

h2 {
  margin: 0 0 20px 0;
  color: #262626;
  font-size: 24px;
}

.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.toolbar button {
  padding: 8px 16px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  background: #fff;
  color: #262626;
  cursor: pointer;
  transition: all 0.2s;
}

.toolbar button:hover {
  border-color: #409eff;
  color: #409eff;
}

/* 查询面板 */
.query-panel {
  margin-bottom: 16px;
  padding: 16px;
  background: #f6ffed;
  border: 1px solid #b7eb8f;
  border-radius: 8px;
}

.query-panel h4 {
  margin: 0 0 12px 0;
  color: #52c41a;
  font-size: 16px;
}

.query-form {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.query-form input,
.query-form select {
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
}

.query-form input {
  min-width: 150px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #595959;
  cursor: pointer;
}

.checkbox-label input {
  width: 16px;
  height: 16px;
}

.query-form button {
  padding: 8px 16px;
  border: 1px solid #409eff;
  border-radius: 6px;
  background: #409eff;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s;
}

.query-form button:last-child {
  background: #fff;
  color: #595959;
  border-color: #d9d9d9;
}

.query-form button:hover {
  opacity: 0.85;
}

.query-results {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px dashed #b7eb8f;
}

.result-count {
  font-size: 14px;
  color: #52c41a;
  margin-bottom: 8px;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: #fff;
  border-radius: 6px;
  margin-bottom: 6px;
  font-size: 13px;
}

.result-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.result-title {
  flex: 1;
  font-weight: 500;
  color: #262626;
}

.result-date,
.result-time {
  color: #8c8c8c;
}

.result-conflict {
  padding: 2px 8px;
  background: #ff4d4f;
  color: #fff;
  border-radius: 4px;
  font-size: 11px;
}

.event-stats {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: #f5f5f5;
  border-radius: 8px;
  font-size: 14px;
  color: #595959;
}

.event-log {
  margin-top: 24px;
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
}

.event-log h3 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #262626;
}

.log-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.log-item {
  padding: 8px 12px;
  background: #fff;
  border-radius: 4px;
  font-size: 13px;
  color: #595959;
  border-left: 3px solid #409eff;
}
</style>
