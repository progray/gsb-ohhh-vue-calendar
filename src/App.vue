<template>
  <div class="app-container">
    <div class="mode-switch">
      <button 
        :class="{ active: selectionMode === 'single' }"
        @click="selectionMode = 'single'"
      >
        单日期选择
      </button>
      <button 
        :class="{ active: selectionMode === 'range' }"
        @click="selectionMode = 'range'"
      >
        区间选择
      </button>
    </div>

    <ohhh-vue-calendar 
      ref="calendarRef" 
      :week-start="1" 
      :marker-dates="markerDates"
      :selection-mode="selectionMode"
      @select-change="onSelectChange"
      @range-change="onRangeChange"
    />

    <div class="selection-info" v-if="selectionMode === 'single' && selectedDate">
      <p>选中日期: {{ selectedDate.toLocaleDateString() }}</p>
    </div>
    <div class="selection-info" v-else-if="selectionMode === 'range'">
      <p>起始日期: {{ rangeSelection.start ? rangeSelection.start.toLocaleDateString() : '未选择' }}</p>
      <p>结束日期: {{ rangeSelection.end ? rangeSelection.end.toLocaleDateString() : '未选择' }}</p>
    </div>
  </div>
</template>

<script setup>
import { useTemplateRef, ref } from 'vue'
import OhhhVueCalendar from './packages/Calendar/Calendar.vue'
import '/src/packages/Calendar/style/mobile/mobile.scss'

const calendarRef = useTemplateRef('calendarRef')

const selectionMode = ref('single')
const selectedDate = ref(null)
const rangeSelection = ref({ start: null, end: null })

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
  console.log('单日期选择:', date)
  selectedDate.value = date
}

function onRangeChange(range) {
  console.log('区间选择:', range)
  rangeSelection.value = range
}
</script>

<style>
.app-container {
  padding: 20px;
}
.mode-switch {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}
.mode-switch button {
  padding: 8px 16px;
  border: 1px solid #dcdfe6;
  background: #fff;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}
.mode-switch button:hover {
  color: #409eff;
  border-color: #c6e2ff;
  background: #ecf5ff;
}
.mode-switch button.active {
  color: #fff;
  background: #409eff;
  border-color: #409eff;
}
.selection-info {
  margin-top: 15px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
}
.selection-info p {
  margin: 4px 0;
  font-size: 14px;
  color: #606266;
}
</style>
