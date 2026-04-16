<template>
  <div class="app-container">
    <div class="lang-switcher-wrapper">
      <LangSwitcher />
    </div>
    <ohhh-vue-calendar ref="calendarRef" :week-start="1" :markerDates @select-change="onSelectChange" />
  </div>
</template>

<script setup>
import { useTemplateRef } from 'vue'
import OhhhVueCalendar from './packages/Calendar/Calendar.vue'
import LangSwitcher from './packages/Calendar/components/LangSwitcher.vue'
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
.app-container {
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;
}

.lang-switcher-wrapper {
  margin-bottom: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
