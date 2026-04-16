<template>
  <div class="app-container" :style="{ background: isDark ? '#171717' : '#fff', minHeight: '100vh' }">
    <div class="theme-controls">
      <button class="theme-btn" @click="toggleTheme">
        {{ isDark ? '☀️ 亮色模式' : '🌙 暗黑模式' }}
      </button>
      <div class="color-picker-container">
        <label class="color-label">主题颜色:</label>
        <input type="color" v-model="selectedColor" @input="onColorChange" class="color-input" />
        <span class="color-value">{{ selectedColor }}</span>
      </div>
      <button class="reset-btn" @click="resetTheme">重置主题</button>
    </div>
    
    <ohhh-vue-calendar 
      ref="calendarRef" 
      :week-start="1" 
      :markerDates 
      @select-change="onSelectChange"
      @theme-change="onThemeChange"
    />
  </div>
</template>

<script setup>
import { useTemplateRef, computed } from 'vue'
import OhhhVueCalendar from './packages/Calendar/Calendar.vue'
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

const selectedColor = computed({
  get: () => calendarRef.value?.themeColor || '#409eff',
  set: (val) => {
    if (calendarRef.value) {
      calendarRef.value.setThemeColor(val)
    }
  }
})

const isDark = computed(() => calendarRef.value?.mode === 'dark')

function toggleTheme() {
  if (calendarRef.value) {
    calendarRef.value.toggleMode()
  }
}

function onColorChange(e) {
  if (calendarRef.value) {
    calendarRef.value.setThemeColor(e.target.value)
  }
}

function resetTheme() {
  if (calendarRef.value) {
    calendarRef.value.resetTheme()
  }
}

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
  transition: background-color 0.3s ease;
}

.theme-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px;
  background: rgba(128, 128, 128, 0.1);
  border-radius: 8px;
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
  color: #606266;
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
  color: #909399;
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
