<template>
  <div class="app-container">
    <div class="app-demo">
      <h2 class="app-demo--title">悬浮玻璃日历演示</h2>

      <div class="app-demo--themes">
        <div
          v-for="theme in themes"
          :key="theme.name"
          class="app-demo--theme-btn"
          :class="{ 'is-active': currentTheme === theme.name }"
          :style="{ background: theme.color }"
          @click="currentTheme = theme.name"
        >
          {{ theme.name }}
        </div>
      </div>

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
import { ref, computed, watch } from 'vue'
import { useTemplateRef } from 'vue'
import OhhhVueCalendar from './packages/Calendar/Calendar.vue'
import '/src/packages/Calendar/style/mobile/mobile.scss'

const calendarRef = useTemplateRef('calendarRef')

const currentTheme = ref('blue')

const themes = [
  { name: 'blue', color: '#409eff' },
  { name: 'pink', color: '#f5576c' },
  { name: 'green', color: '#11998e' },
  { name: 'purple', color: '#764ba2' },
  { name: 'orange', color: '#f7971e' }
]

const currentThemeColor = computed(() => {
  const theme = themes.find(t => t.name === currentTheme.value)
  return theme ? theme.color : '#409eff'
})

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
  padding: 40px 20px;
}

.app-demo {
  width: 100%;
  max-width: 500px;
}

.app-demo--title {
  text-align: center;
  color: #fff;
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 24px;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.app-demo--themes {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 20px;
}

.app-demo--theme-btn {
  padding: 8px 16px;
  border-radius: 20px;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.app-demo--theme-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
}

.app-demo--theme-btn.is-active {
  border-color: #fff;
  transform: scale(1.05);
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
