<template>
  <div class="app-container">
    <div class="theme-selector">
      <span class="theme-label">主题色：</span>
      <button 
        v-for="theme in themes" 
        :key="theme.color"
        class="theme-btn"
        :class="{ active: currentTheme === theme.name }"
        :style="{ '--theme-color': theme.color }"
        @click="currentTheme = theme.name"
        :title="theme.label"
      >
        <span class="theme-dot" :style="{ background: theme.color }"></span>
        <span class="theme-name">{{ theme.label }}</span>
      </button>
    </div>
    <ohhh-vue-calendar 
      ref="calendarRef" 
      :week-start="1" 
      :markerDates 
      :themeColor="currentThemeColor"
      @select-change="onSelectChange" 
    />
  </div>
</template>

<script setup>
import { useTemplateRef, ref, computed } from 'vue'
import OhhhVueCalendar from './packages/Calendar/Calendar.vue'
import '/src/packages/Calendar/style/mobile/mobile.scss'

const calendarRef = useTemplateRef('calendarRef')

const themes = [
  { name: 'blue', color: '#409eff', label: '天空蓝' },
  { name: 'purple', color: '#9c27b0', label: '优雅紫' },
  { name: 'pink', color: '#e91e63', label: '浪漫粉' },
  { name: 'green', color: '#00c853', label: '清新绿' },
  { name: 'orange', color: '#ff9800', label: '活力橙' },
  { name: 'dark', color: '#2c3e50', label: '深邃黑' }
]

const currentTheme = ref('blue')

const currentThemeColor = computed(() => {
  return themes.find(t => t.name === currentTheme.value)?.color || '#409eff'
})

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

function onSelectChange(date) {
  console.log(date)
}
</script>

<style lang="scss" scoped>
.app-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.theme-selector {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.theme-label {
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  margin-right: 8px;
}

.theme-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
  }
  
  &.active {
    background: rgba(255, 255, 255, 0.15);
    border-color: var(--theme-color);
    box-shadow: 0 0 10px rgba(var(--theme-color-r, 64), var(--theme-color-g, 158), var(--theme-color-b, 255), 0.3);
  }
}

.theme-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.theme-name {
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
}
</style>
