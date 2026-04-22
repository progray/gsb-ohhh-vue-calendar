<template>
  <div class="app-container">
    <div class="demo-header">
      <h1>自然语言日期查询日历</h1>
      <p class="demo-hint">输入自然语言描述查询日期，支持按回车搜索，或点击下方示例快速体验</p>
    </div>

    <div class="demo-examples">
      <span class="demo-examples-label">试试这些：</span>
      <div class="demo-examples-buttons">
        <button @click="searchExample('明天')" type="button">明天</button>
        <button @click="searchExample('下周五')" type="button">下周五</button>
        <button @click="searchExample('本周')" type="button">本周</button>
        <button @click="searchExample('本月所有周末')" type="button">本月所有周末</button>
        <button @click="searchExample('下两周')" type="button">下两周</button>
        <button @click="searchExample('本月所有周五')" type="button">本月所有周五</button>
        <button @click="clearSearch" type="button" class="demo-btn-clear">清除</button>
      </div>
    </div>

    <ohhh-vue-calendar
      ref="calendarRef"
      :week-start="1"
      :show-search="true"
      :marker-dates="markerDates"
      @select-change="onSelectChange"
      @search-change="onSearchChange"
    />
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

function onSearchChange(result) {
  console.log('搜索结果:', result)
}

function searchExample(query) {
  if (calendarRef.value) {
    calendarRef.value.searchQuery = query
    calendarRef.value.search()
  }
}

function clearSearch() {
  if (calendarRef.value) {
    calendarRef.value.clearSearch()
  }
}
</script>

<style scoped>
.app-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.demo-header {
  text-align: center;
  margin-bottom: 16px;
}

.demo-header h1 {
  margin: 0 0 8px 0;
  font-size: 22px;
  color: #303133;
  font-weight: 600;
}

.demo-hint {
  margin: 0;
  font-size: 13px;
  color: #909399;
}

.demo-examples {
  margin-bottom: 16px;
}

.demo-examples-label {
  display: block;
  font-size: 13px;
  color: #606266;
  margin-bottom: 8px;
}

.demo-examples-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.demo-examples-buttons button {
  padding: 6px 14px;
  font-size: 13px;
  color: #409eff;
  background: #ecf5ff;
  border: 1px solid #b3d8ff;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.demo-examples-buttons button:hover {
  background: #409eff;
  color: #fff;
  border-color: #409eff;
}

.demo-examples-buttons .demo-btn-clear {
  color: #909399;
  background: #f4f4f5;
  border-color: #d3d4d6;
}

.demo-examples-buttons .demo-btn-clear:hover {
  color: #fff;
  background: #909399;
  border-color: #909399;
}
</style>
