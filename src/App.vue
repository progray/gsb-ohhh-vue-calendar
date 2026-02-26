<template>
  <div class="app-container">
    <div class="demo-header">
      <h1>Ohhh Vue Calendar - 日程管理演示</h1>
      <div class="event-stats">
        <span>当前事件数: {{ events.length }}</span>
      </div>
    </div>
    
    <!-- 搜索栏 -->
    <div class="search-bar">
      <input 
        v-model="searchKeyword" 
        type="text" 
        placeholder="搜索日程（标题或备注）..."
        @input="handleSearch"
      />
      <button v-if="searchKeyword" class="btn-clear" @click="clearSearch">×</button>
    </div>
    
    <!-- 搜索结果提示 -->
    <div v-if="searchKeyword && searchResults.length > 0" class="search-results-hint">
      找到 {{ searchResults.length }} 个相关日程
    </div>
    <div v-if="searchKeyword && searchResults.length === 0" class="search-no-results">
      未找到相关日程
    </div>
    
    <ohhh-vue-calendar 
      ref="calendarRef" 
      :week-start="1" 
      :markerDates="markerDates"
      :events="events"
      :enable-drag-drop="true"
      :enable-conflict-detection="true"
      :enable-event-dialog="true"
      :max-visible-events="3"
      @select-change="onSelectChange"
      @event-add="onEventAdd"
      @event-update="onEventUpdate"
      @event-delete="onEventDelete"
    />

  </div>
</template>

<script setup>
import { useTemplateRef, computed, ref } from 'vue'
import OhhhVueCalendar from './packages/Calendar/Calendar.vue'
import '/src/packages/Calendar/style/index.scss'

const calendarRef = useTemplateRef('calendarRef')

const searchKeyword = ref('')
const searchResults = ref([])

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
    title: '团队周会',
    startDate: '2025-08-05',
    endDate: '2025-08-05',
    startTime: '09:00',
    endTime: '10:00',
    color: '#5b9bd5',
    description: '每周例会，讨论本周工作进展'
  },
  {
    id: '2',
    title: '产品评审',
    startDate: '2025-08-06',
    endDate: '2025-08-06',
    startTime: '14:00',
    endTime: '16:00',
    color: '#ed7d31',
    description: '新版本功能评审'
  },
  {
    id: '3',
    title: '客户演示',
    startDate: '2025-08-07',
    endDate: '2025-08-07',
    startTime: '10:00',
    endTime: '11:30',
    color: '#70ad47',
    description: '产品演示会议'
  },
  {
    id: '4',
    title: '技术分享',
    startDate: '2025-08-07',
    endDate: '2025-08-07',
    startTime: '15:00',
    endTime: '16:00',
    color: '#5b9bd5',
    description: 'Vue 3 Composition API 分享'
  },
  {
    id: '5',
    title: '整天活动',
    startDate: '2025-08-08',
    endDate: '2025-08-08',
    color: '#a5a5a5',
    description: '团建活动'
  },
  {
    id: '6',
    title: '冲突测试1',
    startDate: '2025-08-05',
    endDate: '2025-08-05',
    startTime: '09:30',
    endTime: '10:30',
    color: '#ff6a6a',
    description: '与团队周会冲突'
  }
])

const sortedEvents = computed(() => {
  return [...events.value].sort((a, b) => {
    const dateCompare = a.startDate.localeCompare(b.startDate)
    if (dateCompare !== 0) return dateCompare
    if (a.startTime && b.startTime) {
      return a.startTime.localeCompare(b.startTime)
    }
    return 0
  })
})

function onSelectChange(date) {
  console.log('选中日期:', date)
}

function onEventAdd(eventData) {
  console.log('添加事件:', eventData)
  const newEvent = {
    ...eventData,
    id: Date.now().toString()
  }
  events.value.push(newEvent)
}

function onEventUpdate(eventData) {
  console.log('更新事件:', eventData)
  const index = events.value.findIndex(e => e.id === eventData.id)
  if (index !== -1) {
    events.value[index] = eventData
  }
}

function handleSearch() {
  if (!searchKeyword.value.trim()) {
    searchResults.value = []
    return
  }
  if (calendarRef.value && calendarRef.value.searchEvents) {
    searchResults.value = calendarRef.value.searchEvents(searchKeyword.value)
  } else {
    const keyword = searchKeyword.value.trim().toLowerCase()
    searchResults.value = sortedEvents.value.filter(event => {
      const titleMatch = event.title && event.title.toLowerCase().includes(keyword)
      const descMatch = event.description && event.description.toLowerCase().includes(keyword)
      return titleMatch || descMatch
    })
  }
}

function clearSearch() {
  searchKeyword.value = ''
  searchResults.value = []
}
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 20px;
}

.demo-header {
  text-align: center;
  margin-bottom: 20px;
}

.demo-header h1 {
  color: #333;
  font-size: 24px;
  margin-bottom: 10px;
}

.event-stats {
  color: #666;
  font-size: 14px;
}

.event-list-panel {
  margin-top: 30px;
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.event-list-panel h3 {
  color: #333;
  font-size: 16px;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.event-list {
  max-height: 400px;
  overflow-y: auto;
}

.event-list-item {
  padding: 12px;
  background: #f9f9f9;
  border-radius: 6px;
  margin-bottom: 10px;
  border-left: 4px solid #5b9bd5;
}

.event-list-item--title {
  font-weight: 600;
  color: #333;
  font-size: 14px;
  margin-bottom: 6px;
}

.event-list-item--meta {
  font-size: 12px;
  color: #888;
  margin-bottom: 4px;
}

.event-list-item--meta .date {
  margin-right: 12px;
}

.event-list-item--desc {
  font-size: 12px;
  color: #666;
  margin-top: 6px;
}

.empty-tip {
  text-align: center;
  color: #999;
  padding: 40px 20px;
  font-size: 14px;
}

.search-bar {
  position: relative;
  max-width: 400px;
  margin: 0 auto 20px;
}

.search-bar input {
  width: 100%;
  padding: 12px 40px 12px 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  box-sizing: border-box;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.search-bar input:focus {
  outline: none;
  border-color: #5b9bd5;
  box-shadow: 0 0 0 3px rgba(91, 155, 213, 0.1);
}

.search-bar .btn-clear {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 28px;
  height: 28px;
  border: none;
  background: #e0e0e0;
  border-radius: 50%;
  color: #666;
  font-size: 20px;
  line-height: 28px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.search-bar .btn-clear:hover {
  background: #d0d0d0;
}

.search-results-hint {
  text-align: center;
  color: #5b9bd5;
  font-size: 13px;
  margin-bottom: 15px;
  padding: 8px;
  background: rgba(91, 155, 213, 0.08);
  border-radius: 6px;
}

.search-no-results {
  text-align: center;
  color: #999;
  font-size: 13px;
  margin-bottom: 15px;
  padding: 8px;
  background: #f9f9f9;
  border-radius: 6px;
}
</style>
