<template>
  <div class="app-container">
    <day-night-calendar ref="calendarRef" :week-start="1" @select-change="onSelectChange" />
  </div>
</template>

<script setup>
import { useTemplateRef } from 'vue'
import DayNightCalendar from './packages/Calendar/DayNightCalendar.vue'
import '/src/packages/Calendar/style/day-night.scss'

const calendarRef = useTemplateRef('calendarRef')

function onSelectChange(date) {
  console.log('Selected date:', date)
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  height: 100%;
  overflow: hidden;
}

.app-container {
  height: 100%;
}
</style>
