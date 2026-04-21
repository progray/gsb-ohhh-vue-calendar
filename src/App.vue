<template>
  <div class="app-container">
    <div class="effect-selector">
      <span class="effect-label">点击动效：</span>
      <button
        v-for="effect in effectTypes"
        :key="effect.value"
        class="effect-btn"
        :class="{ active: selectedEffect === effect.value }"
        @click="selectedEffect = effect.value"
      >
        {{ effect.label }}
      </button>
    </div>
    <ohhh-vue-calendar ref="calendarRef" :week-start="1" :markerDates :click-effect="selectedEffect" @select-change="onSelectChange" />
  </div>
</template>

<script setup>
import { ref, useTemplateRef } from 'vue'
import OhhhVueCalendar from './packages/Calendar/Calendar.vue'
import '/src/packages/Calendar/style/mobile/mobile.scss'

const calendarRef = useTemplateRef('calendarRef')

const effectTypes = [
  { label: '彩花爆开', value: 'confetti' },
  { label: '心跳脉冲', value: 'heartbeat' },
  { label: '震动抖动', value: 'shake' }
]

const selectedEffect = ref('confetti')

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

<style scoped>
.effect-selector {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: #f5f5f5;
  border-radius: 8px;
  margin: 16px;
  flex-wrap: wrap;
  gap: 8px;
}

.effect-label {
  font-size: 14px;
  color: #606266;
  margin-right: 8px;
}

.effect-btn {
  padding: 8px 16px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #fff;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.effect-btn:hover {
  border-color: #409eff;
  color: #409eff;
}

.effect-btn.active {
  background: #409eff;
  border-color: #409eff;
  color: #fff;
}
</style>
