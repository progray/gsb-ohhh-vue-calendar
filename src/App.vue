<template>
  <div class="app-container">
    <div class="test-controls">
      <button @click="testSeason('spring')">春季 (3-5月)</button>
      <button @click="testSeason('summer')">夏季 (6-8月)</button>
      <button @click="testSeason('autumn')">秋季 (9-11月)</button>
      <button @click="testSeason('winter')">冬季 (12-2月)</button>
    </div>
    <ohhh-vue-calendar
      ref="calendarRef"
      :week-start="1"
      :markerDates
      :enableSeasonTheme="true"
      :seasonTransitionDuration="'0.8s'"
      @select-change="onSelectChange"
      @season-change="onSeasonChange"
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

function onSeasonChange(seasonInfo) {
  console.log('季节切换:', seasonInfo)
}

function testSeason(season) {
  let targetMonth
  switch (season) {
    case 'spring':
      targetMonth = 3
      break
    case 'summer':
      targetMonth = 6
      break
    case 'autumn':
      targetMonth = 9
      break
    case 'winter':
      targetMonth = 12
      break
    default:
      targetMonth = new Date().getMonth() + 1
  }
  calendarRef.value?.changePageTo(new Date(2025, targetMonth - 1, 15))
}
</script>

<style scoped>
.app-container {
  padding: 20px;
}

.test-controls {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.test-controls button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  background: #409eff;
  color: white;
  cursor: pointer;
  font-size: 14px;
}

.test-controls button:hover {
  background: #66b1ff;
}
</style>
