<template>
  <div class="app-container">
    <MathCanvas />
    <div class="calendar-wrapper">
      <ohhh-vue-calendar ref="calendarRef" :week-start="1" :markerDates @select-change="onSelectChange" />
    </div>
  </div>
</template>

<script setup>
import { useTemplateRef } from 'vue'
import OhhhVueCalendar from './packages/Calendar/Calendar.vue'
import MathCanvas from './packages/MathCanvas/MathCanvas.vue'
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
  console.log(date)
}
</script>

<style>
html,
body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

#app {
  width: 100%;
  height: 100%;
}

.app-container {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: transparent;
}

.calendar-wrapper {
  width: 100%;
  max-width: 500px;
  padding: 20px;
  box-sizing: border-box;
}

@media (max-width: 600px) {
  .calendar-wrapper {
    max-width: 100%;
    padding: 10px;
  }
}
</style>
