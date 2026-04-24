<template>
  <div class="app-container">
    <div class="calendar-wrapper">
      <ohhh-vue-calendar
        ref="calendarRef"
        :week-start="1"
        :initial-selected-date="initialDate"
        :markerDates="[]"
        @select-change="onSelectChange"
        @cycle-change="onCycleChange"
      />
    </div>

    <div class="info-panel">
      <div class="info-item">
        <span class="info-label">周期</span>
        <span class="info-value">{{ cycleInfo.averageCycleLength }}天</span>
      </div>
      <div class="info-item">
        <span class="info-label">经期</span>
        <span class="info-value">{{ cycleInfo.averagePeriodLength }}天</span>
      </div>
      <div class="info-item">
        <span class="info-label">选中</span>
        <span class="info-value">{{ selectedDateText }}</span>
      </div>
    </div>

    <div class="tips-panel" :class="{ 'is-expanded': tipsExpanded }" @click="toggleTips">
      <div class="tips-header">
        <span class="tips-title">使用提示</span>
        <span class="tips-arrow">{{ tipsExpanded ? '▲' : '▼' }}</span>
      </div>
      <ul class="tips-list" v-show="tipsExpanded">
        <li><span class="tip-highlight">长按</span>经期开始/结束图标可拖动调整</li>
        <li><span class="tip-highlight">长按</span>排卵日花朵图标可拖动调整</li>
        <li>较淡颜色为<span class="tip-highlight">预测</span>周期</li>
        <li>红色<span class="tip-highlight">经期</span>，琥珀色<span class="tip-highlight">排卵日</span></li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import OhhhVueCalendar from './packages/Calendar/Calendar.vue'
import '/src/packages/Calendar/style/mobile/mobile.scss'

const calendarRef = ref(null)
const initialDate = new Date(2026, 3, 20)
const selectedDate = ref(initialDate)
const cycleInfo = ref({
  averageCycleLength: 28,
  averagePeriodLength: 5
})
const tipsExpanded = ref(false)

const selectedDateText = computed(() => {
  return `${selectedDate.value.getDate()}日`
})

function toggleTips() {
  tipsExpanded.value = !tipsExpanded.value
}

function onSelectChange(date) {
  selectedDate.value = date
}

function onCycleChange(cycles) {
  console.log('周期数据已更新:', cycles)
}

onMounted(() => {
  if (calendarRef.value) {
    cycleInfo.value = {
      averageCycleLength: calendarRef.value.averageCycleLength,
      averagePeriodLength: calendarRef.value.averagePeriodLength
    }
  }
})
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #fffaf5 0%, #fef5e7 50%, #fffaf5 100%);
  padding: 16px;
  font-family:
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    'Helvetica Neue',
    Arial,
    sans-serif;
}

.calendar-wrapper {
  max-width: 420px;
  margin: 0 auto;
}

.info-panel {
  display: flex;
  justify-content: space-between;
  max-width: 420px;
  margin: 8px auto 0;
  gap: 8px;
}

.info-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 6px 8px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 10px;
  box-shadow: 0 1px 6px rgba(93, 78, 78, 0.04);
}

.info-label {
  font-size: 10px;
  color: #9a8a8a;
  margin-bottom: 2px;
}

.info-value {
  font-size: 14px;
  font-weight: 600;
  color: #5d4e4e;
}

.tips-panel {
  max-width: 420px;
  margin: 8px auto 0;
  padding: 6px 10px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tips-panel:hover {
  background: rgba(255, 255, 255, 0.7);
}

.tips-panel.is-expanded {
  padding: 6px 10px 10px;
}

.tips-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tips-title {
  font-size: 11px;
  font-weight: 500;
  color: #7a6a6a;
  margin: 0;
}

.tips-arrow {
  font-size: 9px;
  color: #9a8a8a;
}

.tips-list {
  list-style: none;
  padding: 6px 0 0;
  margin: 0;
}

.tips-list li {
  font-size: 10px;
  color: #9a8a8a;
  line-height: 1.6;
}

.tip-highlight {
  color: #e8a87c;
  font-weight: 500;
}
</style>
