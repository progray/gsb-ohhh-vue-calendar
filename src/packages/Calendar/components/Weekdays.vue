<template>
  <div class="ohhh-calendar-weekdays">
    <div v-for="(day, index) in context.weekdays" :key="day" class="ohhh-calendar-weekdays--weekday">
      <slot name="weekday" :weekday="day" :index="(index + context.weekStart) % 7">{{ day }}</slot>
    </div>
  </div>
</template>

<script setup>
import { inject } from 'vue'

const context = inject('calendarContext')
</script>
