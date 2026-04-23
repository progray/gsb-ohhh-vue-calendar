<template>
  <div class="app-container">
    <div class="app-header">
      <h1 class="app-title">🏃 健身打卡日历</h1>
      <p class="app-subtitle">记录每一天的进步</p>
    </div>
    <ohhh-vue-calendar ref="calendarRef" :week-start="1" @select-change="onSelectChange" />
  </div>
</template>

<script setup>
import { useTemplateRef } from 'vue'
import OhhhVueCalendar from './packages/Calendar/Calendar.vue'
import '/src/packages/Calendar/style/mobile/mobile.scss'

const calendarRef = useTemplateRef('calendarRef')

function onSelectChange(date) {
  console.log('选中日期:', date)
}
</script>

<style lang="scss">
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #f0fdf4 100%);
  min-height: 100vh;
  font-family:
    Open Sans,
    -apple-system,
    BlinkMacSystemFont,
    Helvetica Neue,
    Helvetica,
    Segoe UI,
    Arial,
    Roboto,
    PingFang SC,
    miui,
    Hiragino Sans GB,
    Microsoft Yahei,
    sans-serif;
}

.app-container {
  max-width: 480px;
  margin: 0 auto;
  padding: 20px 16px;
}

.app-header {
  text-align: center;
  margin-bottom: 20px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 20px;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.08);
}

.app-title {
  font-size: 22px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 4px;
}

.app-subtitle {
  font-size: 14px;
  color: #64748b;
}
</style>
