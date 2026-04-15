<template>
  <div class="app-container">
    <h3>单日期选择模式 (默认)</h3>
    <ohhh-vue-calendar ref="calendarRef" :week-start="1" :markerDates @select-change="onSelectChange" />
    
    <h3 style="margin-top: 40px;">区间选择模式</h3>
    <ohhh-vue-calendar 
      ref="rangeCalendarRef" 
      :week-start="1" 
      selection-mode="range"
      @range-change="onRangeChange" 
    />
    <div v-if="rangeSelection" style="margin-top: 10px; padding: 10px; background: #f5f5f5;">
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
const rangeCalendarRef = useTemplateRef('rangeCalendarRef')

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
h3 {
  margin-bottom: 10px;
  color: #303133;
}
</style>
