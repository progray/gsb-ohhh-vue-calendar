<template>
  <div class="app-container">
    <ohhh-vue-calendar
      ref="calendarRef"
      :week-start="1"
      :marker-dates="markerDates"
      :show-worker-view="true"
      :retirement-date="retirementDate"
      @select-change="onSelectChange"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import OhhhVueCalendar from './packages/Calendar/Calendar.vue'
import '/src/packages/Calendar/style/mobile/mobile.scss'

const calendarRef = ref(null)

const retirementDate = ref('')

const markerDates = [
  '2026-08-04',
  '2026-08-05',
  '2026-08-06',
  '2026-08-07',
  {
    date: '2026-08-08',
    color: '#ff6a6a'
  }
]

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
  width: 100%;
}

.app-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}
</style>
