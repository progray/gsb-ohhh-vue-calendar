<template>
  <div class="app-container">
    <div class="demo-section">
      <h3>默认样式 - 周末高亮</h3>
      <p class="description">点击顶部"今"字按钮可快速回到今天</p>
      <ohhh-vue-calendar ref="calendarRef" :week-start="1" :markerDates @select-change="onSelectChange" />
    </div>
    
    <div class="demo-section">
      <h3>自定义周末颜色</h3>
      <p class="description">通过 --calendar-weekend-color 变量自定义周末颜色</p>
      <div class="custom-calendar">
        <ohhh-vue-calendar :week-start="1" />
      </div>
    </div>
    
    <div class="demo-section">
      <h3>功能演示</h3>
      <div class="button-group">
        <button @click="goToToday">回到今天</button>
        <button @click="toggleView">切换视图</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useTemplateRef } from 'vue'
import OhhhVueCalendar from './packages/Calendar/Calendar.vue'
import '/src/packages/Calendar/style/mobile/mobile.scss'

const calendarRef = useTemplateRef('calendarRef')

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

function onSelectChange(date) {
  console.log('选中日期:', date)
}

function goToToday() {
  calendarRef.value?.goToToday()
}

function toggleView() {
  calendarRef.value?.toggleViewMode()
}
</script>

<style>
.app-container {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.demo-section {
  margin-bottom: 40px;
  padding: 20px;
  background: #f5f5f5;
  border-radius: 8px;
}

.demo-section h3 {
  margin: 0 0 10px 0;
  color: #303133;
}

.description {
  margin: 0 0 20px 0;
  color: #606266;
  font-size: 14px;
}

.custom-calendar {
  --calendar-weekend-color: #ff6a6a;
}

.button-group {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.button-group button {
  padding: 10px 20px;
  background: #409eff;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.button-group button:hover {
  background: #66b1ff;
}
</style>
