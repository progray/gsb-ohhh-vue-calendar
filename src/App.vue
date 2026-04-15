<template>
  <div class="app-container">
    <div class="mode-switch">
      <label>
        <input type="checkbox" v-model="isRangeMode" />
        <span>区间选择模式</span>
      </label>
    </div>
    <ohhh-vue-calendar
      ref="calendarRef"
      :week-start="1"
      :markerDates
      :selectionMode="isRangeMode ? 'range' : 'single'"
      @select-change="onSelectChange"
      @range-change="onRangeChange"
    />
    <div v-if="isRangeMode && rangeInfo" class="range-info">
      <p>选中区间: {{ formatDate(rangeInfo.start) }} ~ {{ rangeInfo.end ? formatDate(rangeInfo.end) : '请选择结束日期' }}</p>
    </div>
  </div>
</template>

<script setup>
import { useTemplateRef, ref, watch } from 'vue'
import OhhhVueCalendar from './packages/Calendar/Calendar.vue'
import '/src/packages/Calendar/style/mobile/mobile.scss'

const calendarRef = useTemplateRef('calendarRef')
const isRangeMode = ref(false)
const rangeInfo = ref(null)

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

watch(isRangeMode, () => {
  rangeInfo.value = null
})

function formatDate(date) {
  if (!date) return ''
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function onSelectChange(date) {
  console.log('单日期选择:', date)
}

function onRangeChange(range) {
  console.log('区间选择:', range)
  rangeInfo.value = range
}
</script>

<style scoped>
.app-container {
  padding: 20px;
}
.mode-switch {
  margin-bottom: 20px;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 4px;
}
.mode-switch label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
}
.mode-switch input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}
.range-info {
  margin-top: 20px;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 4px;
  font-size: 14px;
}
</style>
