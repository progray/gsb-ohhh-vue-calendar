<template>
  <div class="app-container">
    <div class="app-header">
      <h1 class="app-title">女性健康日历</h1>
      <p class="app-subtitle">记录您的生理周期，呵护您的健康</p>
    </div>
    
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
        <span class="info-label">平均周期</span>
        <span class="info-value">{{ cycleInfo.averageCycleLength }}天</span>
      </div>
      <div class="info-item">
        <span class="info-label">平均经期</span>
        <span class="info-value">{{ cycleInfo.averagePeriodLength }}天</span>
      </div>
      <div class="info-item current-phase">
        <span class="info-label">当前选中日期</span>
        <span class="info-value">{{ selectedDateText }}</span>
      </div>
    </div>

    <div class="tips-panel">
      <p class="tips-title">使用提示</p>
      <ul class="tips-list">
        <li>• <span class="tip-highlight">长按</span>经期开始/结束图标（小圆点和小方块）可拖动调整经期范围</li>
        <li>• <span class="tip-highlight">长按</span>排卵日花朵图标可拖动调整排卵日期</li>
        <li>• 较淡的颜色表示<span class="tip-highlight">预测</span>的周期</li>
        <li>• 红色区域为<span class="tip-highlight">经期</span>，琥珀色为<span class="tip-highlight">排卵日</span></li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import OhhhVueCalendar from './packages/Calendar/Calendar.vue'
import '/src/packages/Calendar/style/mobile/mobile.scss'
import { formatDate } from './packages/Calendar/utils/index.js'

const calendarRef = ref(null)

const initialDate = new Date(2026, 3, 20)

const selectedDate = ref(initialDate)
const cycleInfo = ref({
  averageCycleLength: 28,
  averagePeriodLength: 5
})

const selectedDateText = computed(() => {
  return formatDate(selectedDate.value, 'YYYY年MM月DD日')
})

function onSelectChange(date) {
  selectedDate.value = date
  console.log('选中日期:', formatDate(date))
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
  padding: 24px;
  font-family:
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    'Helvetica Neue',
    Arial,
    sans-serif;
}

.app-header {
  text-align: center;
  margin-bottom: 24px;
}

.app-title {
  font-size: 28px;
  font-weight: 600;
  color: #5d4e4e;
  margin: 0 0 8px 0;
  letter-spacing: 1px;
}

.app-subtitle {
  font-size: 14px;
  color: #9a8a8a;
  margin: 0;
}

.calendar-wrapper {
  max-width: 420px;
  margin: 0 auto;
}

.info-panel {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-top: 24px;
  flex-wrap: wrap;
}

.info-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 24px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(93, 78, 78, 0.06);
  min-width: 100px;
}

.info-item.current-phase {
  background: rgba(232, 168, 124, 0.1);
  border: 1px solid rgba(232, 168, 124, 0.2);
}

.info-label {
  font-size: 12px;
  color: #9a8a8a;
  margin-bottom: 4px;
}

.info-value {
  font-size: 20px;
  font-weight: 600;
  color: #5d4e4e;
}

.tips-panel {
  max-width: 420px;
  margin: 24px auto 0;
  padding: 20px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(93, 78, 78, 0.04);
}

.tips-title {
  font-size: 15px;
  font-weight: 600;
  color: #7a6a6a;
  margin: 0 0 12px 0;
}

.tips-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.tips-list li {
  font-size: 13px;
  color: #9a8a8a;
  line-height: 1.8;
}

.tip-highlight {
  color: #e8a87c;
  font-weight: 500;
}
</style>
