<template>
  <div class="app-container">
    <ohhh-vue-calendar ref="calendarRef" :week-start="1" :markerDates @select-change="onSelectChange" />
  </div>
</template>

<script setup>
import { useTemplateRef } from 'vue'
import OhhhVueCalendar from './packages/Calendar/Calendar.vue'
import '/src/packages/Calendar/style/mobile/mobile.scss'

const calendarRef = useTemplateRef('calendarRef')


const markerDates = [
  {
    date: '2025-08-04',
    color: '#ff6a6a',
    value: 100,
    type: 'circle'
  },
  {
    date: '2025-08-05',
    color: '#6aff6a',
    value: 75,
    type: 'square'
  },
  {
    date: '2025-08-06',
    color: '#6a6aff',
    value: 50,
    type: 'triangle'
  },
  {
    date: '2025-08-07',
    color: '#ffff6a',
    value: 25,
    type: 'circle'
  },
  {
    date: '2025-08-08',
    color: '#ff6aff',
    value: 10,
    type: 'square'
  }
]

function onSelectChange(date) {
  console.log(date)
}
</script>
