<template>
  <div class="app-container" :style="appStyle">
    <div class="theme-controls" :style="controlsStyle">
      <button class="theme-btn" @click="toggleMode">
        {{ mode === 'dark' ? '☀️ 亮色模式' : '🌙 暗黑模式' }}
      </button>
      <div class="color-picker-container">
        <label class="color-label" :style="labelStyle">主题颜色:</label>
        <input type="color" v-model="themeColor" class="color-input" />
        <span class="color-value" :style="valueStyle">{{ themeColor }}</span>
      </div>
      <button class="reset-btn" @click="resetTheme">重置主题</button>
    </div>
    
    <OhhhVueCalendar 
      ref="calendarRef" 
      :week-start="1" 
      :marker-dates="markerDates"
      :initial-mode="mode"
      :initial-theme-color="themeColor"
      @select-change="onSelectChange"
      @theme-change="onThemeChange"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import OhhhVueCalendar from './packages/Calendar/Calendar.vue'
import '/src/packages/Calendar/style/mobile/mobile.scss'

const STORAGE_KEY = 'ohhh-vue-calendar-theme'
const DEFAULT_MODE = 'light'
const DEFAULT_THEME_COLOR = '#409eff'

function loadTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    console.warn('Failed to load theme:', e)
  }
  return null
}

function saveTheme(mode, themeColor) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ mode, themeColor }))
  } catch (e) {
    console.warn('Failed to save theme:', e)
  }
}

const stored = loadTheme()
const mode = ref(stored?.mode || DEFAULT_MODE)
const themeColor = ref(stored?.themeColor || DEFAULT_THEME_COLOR)
const calendarRef = ref(null)

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

const appStyle = computed(() => ({
  background: mode.value === 'dark' ? '#141414' : '#ffffff',
  minHeight: '100vh',
  transition: 'background-color 0.3s ease'
}))

const controlsStyle = computed(() => ({
  background: mode.value === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
}))

const labelStyle = computed(() => ({
  color: mode.value === 'dark' ? '#d4d4d4' : '#606266'
}))

const valueStyle = computed(() => ({
  color: mode.value === 'dark' ? '#a3a3a3' : '#909399'
}))

function toggleMode() {
  mode.value = mode.value === 'light' ? 'dark' : 'light'
  if (calendarRef.value) {
    calendarRef.value.setMode(mode.value)
  }
}

function resetTheme() {
  mode.value = DEFAULT_MODE
  themeColor.value = DEFAULT_THEME_COLOR
  if (calendarRef.value) {
    calendarRef.value.resetTheme()
  }
}

watch([mode, themeColor], ([newMode, newColor]) => {
  saveTheme(newMode, newColor)
}, { deep: true })

function onSelectChange(date) {
  console.log('Selected date:', date)
}

function onThemeChange(theme) {
  console.log('Theme changed:', theme)
}
</script>

<style scoped>
.app-container {
  padding: 20px;
}

.theme-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px;
  border-radius: 8px;
  transition: background-color 0.3s ease;
}

.theme-btn,
.reset-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.theme-btn {
  background: #409eff;
  color: white;
}

.theme-btn:hover {
  background: #66b1ff;
}

.reset-btn {
  background: #f56c6c;
  color: white;
}

.reset-btn:hover {
  background: #f78989;
}

.color-picker-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

.color-label {
  font-size: 14px;
  transition: color 0.3s ease;
}

.color-input {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  padding: 0;
  background: transparent;
}

.color-input::-webkit-color-swatch-wrapper {
  padding: 0;
}

.color-input::-webkit-color-swatch {
  border: 2px solid #dcdfe6;
  border-radius: 6px;
}

.color-value {
  font-size: 14px;
  font-family: monospace;
  transition: color 0.3s ease;
}

@media (max-width: 600px) {
  .theme-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .theme-btn,
  .reset-btn {
    width: 100%;
  }
  
  .color-picker-container {
    justify-content: center;
  }
}
</style>
