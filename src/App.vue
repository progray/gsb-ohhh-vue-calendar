<template>
  <div class="app-container">
    <div class="app-demo">
      <ohhh-vue-calendar
        ref="calendarRef"
        :week-start="1"
        :markerDates="markerDates"
        :themeColor="currentThemeColor"
        :initialPreset="currentPreset"
        @select-change="onSelectChange"
        @screenshot-complete="onScreenshotComplete"
        @background-change="onBackgroundChange"
      />

      <div v-if="screenshotResult" class="app-demo--screenshot-result">
        <p>截图已复制到剪贴板！</p>
        <img :src="screenshotResult.dataUrl" alt="Screenshot Preview" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useTemplateRef } from 'vue'
import OhhhVueCalendar from './packages/Calendar/Calendar.vue'
import '/src/packages/Calendar/style/mobile/mobile.scss'

const calendarRef = useTemplateRef('calendarRef')

const currentThemeColor = ref('#409eff')
const currentPreset = ref('sunset')

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

const screenshotResult = ref(null)

function onSelectChange(date) {
  console.log('Selected date:', date)
}

function onScreenshotComplete(result) {
  console.log('Screenshot completed:', result)
  if (result.success) {
    screenshotResult.value = result
    setTimeout(() => {
      screenshotResult.value = null
    }, 3000)
  }
}

function onBackgroundChange(info) {
  console.log('Background changed:', info)
}
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.app-demo {
  width: 100%;
  max-width: 500px;
}

.app-demo--screenshot-result {
  margin-top: 20px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  text-align: center;
  animation: fadeIn 0.3s ease;
}

.app-demo--screenshot-result p {
  color: #11998e;
  font-weight: 500;
  margin-bottom: 12px;
}

.app-demo--screenshot-result img {
  max-width: 100%;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
