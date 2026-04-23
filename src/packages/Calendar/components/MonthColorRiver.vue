<template>
  <div class="month-color-river">
    <div class="month-color-river-header">
      <span class="month-color-river-title">月度色彩河流</span>
      <span class="month-color-river-subtitle">{{ year }}年{{ month + 1 }}月</span>
    </div>
    <div class="month-color-river-container" ref="riverContainer">
      <div 
        v-for="(color, index) in monthColors" 
        :key="index"
        class="month-color-river-cell"
        :style="{ background: `hsl(${color.h}, ${color.s}%, ${color.l}%)` }"
        :title="`${index + 1}日`"
      >
        <div class="month-color-river-cell-date" v-if="showDates && (index === 0 || index === Math.floor(monthColors.length / 2) || index === monthColors.length - 1)">
          {{ index + 1 }}
        </div>
      </div>
    </div>
    <div class="month-color-river-labels">
      <span class="month-color-river-label">月初</span>
      <span class="month-color-river-label">月中</span>
      <span class="month-color-river-label">月末</span>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { getMonthColors } from '../utils/colorUtils.js'

const props = defineProps({
  year: {
    type: Number,
    required: true
  },
  month: {
    type: Number,
    required: true
  },
  showDates: {
    type: Boolean,
    default: false
  }
})

const riverContainer = ref(null)

const monthColors = computed(() => {
  return getMonthColors(props.year, props.month)
})
</script>

<style scoped>
.month-color-river {
  padding: 16px 12px;
  background: var(--calendar-background, transparent);
}

.month-color-river-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 12px;
}

.month-color-river-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--calendar-text-color-level-2, #606266);
  letter-spacing: 1px;
}

.month-color-river-subtitle {
  font-size: 12px;
  color: var(--calendar-text-color-level-4, #a8abb2);
}

.month-color-river-container {
  display: flex;
  height: 40px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 
    0 4px 16px rgba(0, 0, 0, 0.08),
    0 0 0 1px rgba(0, 0, 0, 0.05) inset;
}

.month-color-river-cell {
  position: relative;
  flex: 1;
  min-width: 1px;
  transition: all 0.2s ease;
  cursor: pointer;
}

.month-color-river-cell:hover {
  flex: 2;
  z-index: 1;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
}

.month-color-river-cell::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 1px;
  background: linear-gradient(
    to bottom,
    transparent,
    rgba(0, 0, 0, 0.05),
    transparent
  );
}

.month-color-river-cell:last-child::after {
  display: none;
}

.month-color-river-cell-date {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 11px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  white-space: nowrap;
}

.month-color-river-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  padding: 0 4px;
}

.month-color-river-label {
  font-size: 11px;
  color: var(--calendar-text-color-level-4, #a8abb2);
}
</style>
