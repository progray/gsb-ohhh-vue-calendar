<template>
  <div class="app-container">
    <h2>热力图日历模式</h2>
    <p class="description">
      鼠标悬停查看具体数值，点击下方图例颜色块可筛选同区间日期。
    </p>
    
    <ohhh-vue-calendar
      ref="calendarRef"
      :week-start="1"
      :show-heatmap="true"
      :heatmap-data="heatmapData"
      :color-scale="customColorScale"
      :levels="5"
      @select-change="onSelectChange"
      @heatmap-hover="onHeatmapHover"
      @heatmap-filter-change="onHeatmapFilterChange"
    >
      <template #heatmap-tooltip="{ date, value }">
        <div class="custom-tooltip">
          <div class="custom-tooltip--date">{{ formatDate(date) }}</div>
          <div class="custom-tooltip--value">
            <span>贡献值:</span>
            <strong>{{ value }}</strong>
            <span class="custom-tooltip--unit">次</span>
          </div>
        </div>
      </template>
    </ohhh-vue-calendar>

    <div class="controls">
      <button @click="generateNewData">重新生成数据</button>
      <button @click="clearAllFilters">清除筛选</button>
    </div>

    <div class="info-panel">
      <div class="info-item">
        <span class="info-label">总数据量:</span>
        <span class="info-value">{{ heatmapData.length }} 天</span>
      </div>
      <div class="info-item">
        <span class="info-label">数值范围:</span>
        <span class="info-value">{{ minValue }} - {{ maxValue }}</span>
      </div>
      <div v-if="currentFilter" class="info-item">
        <span class="info-label">当前筛选:</span>
        <span class="info-value">{{ currentFilter.min?.toFixed(1) }} - {{ currentFilter.max?.toFixed(1) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import OhhhVueCalendar from './packages/Calendar/Calendar.vue'
import '/src/packages/Calendar/style/mobile/mobile.scss'
import '/src/packages/Calendar/style/heatmap.scss'

const calendarRef = ref(null)
const currentFilter = ref(null)

const customColorScale = [
  '#ebedf0',
  '#9be9a8',
  '#40c463',
  '#30a14e',
  '#216e39'
]

function generateRandomDateData() {
  const data = []
  const today = new Date()
  const startDate = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate())
  
  for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
    const randomValue = Math.floor(Math.random() * 15)
    data.push({
      date: new Date(d),
      value: randomValue
    })
  }
  
  return data
}

const heatmapData = ref(generateRandomDateData())

const minValue = computed(() => {
  if (heatmapData.value.length === 0) return 0
  return Math.min(...heatmapData.value.map(d => d.value))
})

const maxValue = computed(() => {
  if (heatmapData.value.length === 0) return 0
  return Math.max(...heatmapData.value.map(d => d.value))
})

function formatDate(date) {
  if (!date) return ''
  const d = new Date(date)
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 周${weekdays[d.getDay()]}`
}

function onSelectChange(date) {
  console.log('选中日期:', date)
}

function onHeatmapHover({ date, value }) {
  console.log('悬停日期:', date, '数值:', value)
}

function onHeatmapFilterChange({ selectedInterval, selectedIntervalIndex }) {
  console.log('筛选变化:', selectedInterval, '索引:', selectedIntervalIndex)
  currentFilter.value = selectedInterval
}

function generateNewData() {
  heatmapData.value = generateRandomDateData()
  currentFilter.value = null
  console.log('已生成新的热力图数据')
}

function clearAllFilters() {
  if (calendarRef.value) {
    calendarRef.value.clearFilter()
  }
  currentFilter.value = null
}
</script>

<style scoped>
.app-container {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

h2 {
  margin: 0 0 10px 0;
  color: #303133;
  font-size: 20px;
}

.description {
  margin: 0 0 20px 0;
  color: #909399;
  font-size: 14px;
}

.controls {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.controls button {
  padding: 8px 16px;
  background: #409eff;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.controls button:hover {
  background: #66b1ff;
}

.controls button:active {
  background: #3a8ee6;
}

.info-panel {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-top: 20px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-label {
  color: #909399;
  font-size: 14px;
}

.info-value {
  color: #303133;
  font-size: 14px;
  font-weight: 600;
}

.custom-tooltip {
  background: rgba(0, 0, 0, 0.85);
  color: #fff;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 14px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  white-space: nowrap;
  position: relative;
}

.custom-tooltip::before {
  content: '';
  position: absolute;
  top: -6px;
  left: 16px;
  border: 6px solid transparent;
  border-bottom-color: rgba(0, 0, 0, 0.85);
}

.custom-tooltip--date {
  font-weight: 600;
  margin-bottom: 6px;
  font-size: 15px;
  color: #fff;
}

.custom-tooltip--value {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.custom-tooltip--value span:first-child {
  color: rgba(255, 255, 255, 0.7);
}

.custom-tooltip--value strong {
  font-size: 20px;
  color: #40c463;
  font-weight: 700;
}

.custom-tooltip--unit {
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
}
</style>
