<template>
  <div class="app-container">
    <ohhh-vue-calendar
      ref="calendarRef"
      :week-start="1"
      :initial-selected-date="initialSelectedDate"
      :min-date="minDate"
      :max-date="maxDate"
      :markerDates
      @select-change="onSelectChange"
    />
    <div class="demo-info">
      <p>当前限制：只能选择 4 月 10 日 到 4 月 25 日</p>
      <p>超出范围的日期会变灰且不可点击</p>
    </div>
  </div>
</template>

<script setup>
import { useTemplateRef } from 'vue'
import OhhhVueCalendar from './packages/Calendar/Calendar.vue'
import '/src/packages/Calendar/style/mobile/mobile.scss'

const calendarRef = useTemplateRef('calendarRef')

const initialSelectedDate = new Date(2026, 3, 15)
const minDate = new Date(2026, 3, 10)
const maxDate = new Date(2026, 3, 25)

const markerDates = [
  '2026-04-12',
  '2026-04-15',
  '2026-04-18',
  '2026-04-20',
  {
    date: '2026-04-22',
    color: '#ff6a6a'
  }
]

function onSelectChange(date) {
  console.log('选中日期:', date)
}
</script>

<style scoped>
.app-container {
  padding: 20px;
}
.demo-info {
  margin-top: 20px;
  padding: 15px;
  background: #f5f5f5;
  border-radius: 8px;
  font-size: 14px;
  color: #666;
}
.demo-info p {
  margin: 5px 0;
}
</style>
