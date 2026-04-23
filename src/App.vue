<template>
  <div class="app-container">
    <ohhh-vue-calendar ref="calendarRef" :week-start="1" @select-change="onSelectChange" />
  </div>
</template>

<script setup>
import { useTemplateRef } from 'vue'
import OhhhVueCalendar from './packages/Calendar/Calendar.vue'
import '/src/packages/Calendar/style/mobile/mobile.scss'

const calendarRef = useTemplateRef('calendarRef')

function onSelectChange(date) {
  console.log(date)
}
</script>
