<template>
  <div class="ohhh-calendar-weekdays">
    <div v-for="(day, index) in weekdays" :key="day" class="ohhh-calendar-weekdays--weekday">
      <slot name="weekday" :weekday="day" :index="(index + weekStart) % 7">{{ day }}</slot>
    </div>
  </div>
</template>

<script setup>
import { inject } from 'vue'
import { createWeekdays } from '../utils'

const {
  weekStart
} = inject('calendarContext')

const weekdays = createWeekdays(weekStart.value)
</script>
