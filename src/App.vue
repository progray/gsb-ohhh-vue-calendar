<template>
  <div class="app-container">
    <div class="app-header">
      <h1 class="app-title">🍅 番茄日历</h1>
      <p class="app-subtitle">记录每一天的专注时光</p>
    </div>

    <ohhh-vue-calendar 
      ref="calendarRef" 
      :week-start="1" 
      :show-footer="false"
      @select-change="onSelectChange"
      @page-change="onPageChange"
    >
      <template #day-label="{ date }">
        <div class="tomato-day-label">
          <div class="tomato-icons">
            <span 
              v-for="i in getTomatoCount(date)" 
              :key="i" 
              class="tomato-icon-small"
            >🍅</span>
          </div>
          <div v-if="getTomatoCount(date) > 0" class="tomato-count">
            {{ getTomatoCount(date) }}
          </div>
        </div>
      </template>
    </ohhh-vue-calendar>

    <div class="stats-footer">
      <div class="stat-item">
        <div class="stat-label">本月累计</div>
        <div class="stat-value">
          <span class="stat-number">{{ monthStats.total }}</span>
          <span class="stat-unit">个番茄</span>
        </div>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <div class="stat-label">日均数量</div>
        <div class="stat-value">
          <span class="stat-number">{{ monthStats.average }}</span>
          <span class="stat-unit">个/天</span>
        </div>
      </div>
    </div>

    <TomatoTimer 
      :show-timer="showTimer" 
      :target-date="selectedDate"
      @close="closeTimer"
      @complete="onTomatoComplete"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import OhhhVueCalendar from './packages/Calendar/Calendar.vue'
import TomatoTimer from './components/TomatoTimer.vue'
import { 
  generateSampleDataForCurrentMonth, 
  getTomatoesForDate, 
  getMonthTomatoes 
} from './utils/tomatoData.js'
import '/src/packages/Calendar/style/mobile/mobile.scss'

const calendarRef = ref(null)
const showTimer = ref(false)
const selectedDate = ref(new Date())
const currentYear = ref(new Date().getFullYear())
const currentMonth = ref(new Date().getMonth() + 1)

const monthStats = computed(() => {
  const result = getMonthTomatoes(currentYear.value, currentMonth.value)
  const now = new Date()
  const currentDay = now.getDate()
  const daysInMonth = new Date(currentYear.value, currentMonth.value, 0).getDate()
  const effectiveDays = Math.min(currentDay, daysInMonth)
  
  return {
    total: result.total,
    days: result.days,
    average: effectiveDays > 0 ? (result.total / effectiveDays).toFixed(1) : '0.0'
  }
})

function getTomatoCount(date) {
  return getTomatoesForDate(date)
}

function onSelectChange(date) {
  selectedDate.value = date
  showTimer.value = true
}

function closeTimer() {
  showTimer.value = false
}

function onTomatoComplete(date) {
  console.log('番茄完成:', date)
  currentYear.value = date.getFullYear()
  currentMonth.value = date.getMonth() + 1
}

function onPageChange({ year, month }) {
  console.log('页面切换:', year, month)
  currentYear.value = year
  currentMonth.value = month
}

onMounted(() => {
  generateSampleDataForCurrentMonth()
})
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #fff5f5 0%, #ffe4e4 100%);
  padding: 20px;
  padding-bottom: 100px;
  box-sizing: border-box;
}

.app-header {
  text-align: center;
  margin-bottom: 20px;
}

.app-title {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: #ff6b6b;
  text-shadow: 2px 2px 4px rgba(255, 107, 107, 0.2);
}

.app-subtitle {
  margin: 8px 0 0;
  font-size: 14px;
  color: #888;
}

.tomato-day-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 4px;
}

.tomato-icons {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1px;
  max-width: 60px;
}

.tomato-icon-small {
  font-size: 12px;
  line-height: 1;
}

.tomato-count {
  font-size: 10px;
  color: #ff6b6b;
  font-weight: 600;
  margin-top: 2px;
}

.stats-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
  padding: 16px 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 40px;
  z-index: 100;
}

.stat-item {
  text-align: center;
}

.stat-label {
  font-size: 12px;
  color: #888;
  margin-bottom: 4px;
}

.stat-value {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 4px;
}

.stat-number {
  font-size: 24px;
  font-weight: 700;
  color: #ff6b6b;
}

.stat-unit {
  font-size: 12px;
  color: #888;
}

.stat-divider {
  width: 1px;
  height: 40px;
  background: #eee;
}
</style>

<style>
.ohhh-calendar-day {
  cursor: pointer;
  transition: all 0.3s ease;
}

.ohhh-calendar-day:hover {
  background: rgba(255, 107, 107, 0.05);
}

.ohhh-calendar-day.is-selected {
  background: rgba(255, 107, 107, 0.15) !important;
}

.ohhh-calendar-day.is-today {
  background: rgba(255, 107, 107, 0.1);
}

.ohhh-calendar-day.is-today .ohhh-calendar-day--inner-value {
  color: #ff6b6b !important;
  font-weight: 700;
}

.ohhh-calendar-day--inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.ohhh-calendar-toolbar--text {
  color: #ff6b6b;
  font-weight: 600;
}

.ohhh-calendar-weekdays--weekday {
  color: #ff6b6b;
  font-weight: 500;
}

.ohhh-calendar-toolbar--icon {
  color: #ff6b6b;
}

.ohhh-calendar-footer--icon {
  color: #ff6b6b;
}
</style>
