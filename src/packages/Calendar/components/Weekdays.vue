<template>
  <div v-if="showWeekdays" class="ohhh-calendar-weekdays">
    <div v-for="(day, index) in weekdays" :key="day" class="ohhh-calendar-weekdays--weekday">
      <slot name="weekday" :weekday="day" :index="(index + weekStart) % 7">{{ day }}</slot>
    </div>
  </div>
</template>

<script setup>
import { inject } from 'vue'
import { createWeekdays } from '../utils'

const props = defineProps({
  showWeekdays: {
    type: Boolean,
    default: true
  }
})

// 从父组件注入状态
const weekStart = inject('weekStart')

// 星期栏
const weekdays = createWeekdays(weekStart.value)
</script>
