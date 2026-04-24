<template>
  <div class="app-container">
    <ohhh-vue-calendar
      ref="calendarRef"
      :week-start="1"
      :initial-selected-date="initialDate"
      :markerDates="[]"
      @select-change="onSelectChange"
      @cycle-change="onCycleChange"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import OhhhVueCalendar from './packages/Calendar/Calendar.vue'
import '/src/packages/Calendar/style/mobile/mobile.scss'

const calendarRef = ref(null)
const initialDate = new Date(2026, 3, 20)

function onSelectChange(date) {
  console.log('选中日期:', date)
}

function onCycleChange(cycles) {
  console.log('周期数据已更新:', cycles)
}

onMounted(() => {
  console.log('日历已加载')
})
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  background: #fffaf5;
  display: flex;
  flex-direction: column;
}
</style>
