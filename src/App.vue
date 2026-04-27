<template>
  <div class="app-container">
    <ohhh-vue-calendar 
      ref="calendarRef" 
      :week-start="1" 
      :marker-dates="markerDates"
      initial-personality-mode="minimal"
      @select-change="onSelectChange"
      @mode-change="onModeChange"
    />
  </div>
</template>

<script setup>
import { useTemplateRef } from 'vue'
import OhhhVueCalendar from './packages/Calendar/Calendar.vue'

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
  console.log('Selected date:', date)
}

function onModeChange(mode) {
  console.log('Mode changed to:', mode)
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #0f0f23 100%);
}

#app {
  width: 100%;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.app-container {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
}
</style>
