<template>
  <div class="app-container">
    <ohhh-vue-calendar ref="calendarRef" :week-start="1" :markerDates @select-change="onSelectChange" />
  </div>
</template>

<script setup>
import { useTemplateRef, onMounted } from 'vue'
import OhhhVueCalendar from './packages/Calendar/Calendar.vue'
import '/src/packages/Calendar/style/mobile/mobile.scss'
import { getDiaryData, saveDiary } from './packages/Calendar/utils/storage.js'
import { sampleQuotes } from './packages/Calendar/utils/sampleData.js'

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
  console.log(date)
}

function initSampleData() {
  const existingData = getDiaryData()
  if (Object.keys(existingData).length > 0) {
    return
  }
  
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()
  
  const daysToFill = 15
  for (let i = 0; i < daysToFill; i++) {
    const dayNumber = (i % 2 === 0) ? (i + 1) : (daysToFill + 1 - i)
    const targetDay = Math.min(dayNumber, 28)
    
    const date = new Date(year, month, targetDay)
    const quote = sampleQuotes[i % sampleQuotes.length]
    
    saveDiary(date, quote)
  }
}

onMounted(() => {
  initSampleData()
})
</script>

<style scoped>
.app-container {
  width: 100%;
  min-height: 100vh;
  background: #fff;
}
</style>
