<template>
  <div
    class="worker-sidebar"
    :class="{ 'is-open': isOpen }"
  >
    <div class="worker-sidebar-toggle" @click="toggleSidebar">
      <span class="toggle-icon">{{ isOpen ? '◀' : '▶' }}</span>
    </div>

    <div v-if="isOpen" class="worker-sidebar-content">
      <h3 class="sidebar-title">打工人专属视图</h3>

      <div class="sidebar-section">
        <label class="sidebar-label">预定退休日期</label>
        <input
          type="date"
          v-model="retirementDateStr"
          class="sidebar-date-input"
          @input="onDateChange"
        />
      </div>

      <div v-if="retirementDate" class="sidebar-section stats-card">
        <div class="stats-item">
          <div class="stats-label">已搬砖天数</div>
          <div class="stats-value">{{ workedDays }}</div>
        </div>

        <div class="stats-item">
          <div class="stats-label">剩余搬砖天数</div>
          <div class="stats-value" :class="{ 'is-urgent': remainingDays < 100 }">
            {{ remainingDays }}
          </div>
        </div>

        <div class="stats-item progress-container">
          <div class="progress-header">
            <span class="stats-label">剩余搬砖百分比</span>
            <span class="progress-percent">{{ remainingPercent }}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: 100 - remainingPercent + '%' }"></div>
          </div>
        </div>
      </div>

      <div v-if="!retirementDate" class="sidebar-hint">
        请设置退休日期以启用打工人视图
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'

const emit = defineEmits(['toggle', 'date-change'])

const props = defineProps({
  initialOpen: {
    type: Boolean,
    default: false
  },
  initialRetirementDate: {
    type: String,
    default: ''
  }
})

const isOpen = ref(props.initialOpen)
const retirementDateStr = ref(props.initialRetirementDate)
const retirementDate = ref(null)

const holidays = ['2026-05-01', '2026-05-02', '2026-05-03']

function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseDate(dateStr) {
  if (!dateStr) return null
  const date = new Date(dateStr)
  return isNaN(date.getTime()) ? null : date
}

function isSameDay(date1, date2) {
  if (!date1 || !date2) return false
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}

function isWeekend(date) {
  const day = date.getDay()
  return day === 0 || day === 6
}

function isHoliday(date) {
  const dateStr = formatDate(date)
  return holidays.includes(dateStr)
}

function countWorkDays(startDate, endDate) {
  let count = 0
  const current = new Date(startDate)
  while (current <= endDate) {
    if (!isWeekend(current) && !isHoliday(current)) {
      count++
    }
    current.setDate(current.getDate() + 1)
  }
  return count
}

function countTotalWorkDays(startDate, endDate) {
  return countWorkDays(startDate, endDate)
}

const today = computed(() => {
  return new Date()
})

const yearStart = computed(() => {
  return new Date(today.value.getFullYear(), 0, 1)
})

const workedDays = computed(() => {
  if (!retirementDate.value) return 0
  const endDate = new Date(today.value)
  endDate.setHours(23, 59, 59, 999)
  return countWorkDays(yearStart.value, endDate)
})

const remainingDays = computed(() => {
  if (!retirementDate.value) return 0
  const startDate = new Date(today.value)
  startDate.setHours(0, 0, 0, 0)
  const endDate = new Date(retirementDate.value)
  endDate.setHours(23, 59, 59, 999)
  if (startDate > endDate) return 0
  return countWorkDays(startDate, endDate)
})

const totalWorkDays = computed(() => {
  if (!retirementDate.value) return 0
  const startDate = new Date(yearStart.value)
  const endDate = new Date(retirementDate.value)
  endDate.setHours(23, 59, 59, 999)
  return countTotalWorkDays(startDate, endDate)
})

const remainingPercent = computed(() => {
  if (!retirementDate.value || totalWorkDays.value === 0) return 0
  const percent = (remainingDays.value / totalWorkDays.value) * 100
  return Math.round(percent * 100) / 100
})

const isCelebration = computed(() => {
  return retirementDate.value && remainingDays.value < 100 && remainingDays.value > 0
})

function toggleSidebar() {
  isOpen.value = !isOpen.value
  emit('toggle', isOpen.value)
}

function onDateChange() {
  retirementDate.value = parseDate(retirementDateStr.value)
  emit('date-change', {
    retirementDate: retirementDate.value,
    isCelebration: isCelebration.value
  })
}

watch(() => props.initialRetirementDate, (newVal) => {
  retirementDateStr.value = newVal
  retirementDate.value = parseDate(newVal)
})

onMounted(() => {
  if (props.initialRetirementDate) {
    retirementDate.value = parseDate(props.initialRetirementDate)
  }
})

defineExpose({
  isOpen,
  retirementDate,
  remainingDays,
  isCelebration,
  isWeekend,
  isHoliday
})
</script>

<style scoped>
.worker-sidebar {
  position: relative;
  width: 0;
  transition: width 0.3s ease;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  overflow: hidden;
}

.worker-sidebar.is-open {
  width: 280px;
  min-width: 280px;
}

.worker-sidebar-toggle {
  position: absolute;
  top: 50%;
  right: 0;
  transform: translate(50%, -50%);
  width: 40px;
  height: 80px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 0 8px 8px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 100;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
}

.toggle-icon {
  color: #fff;
  font-size: 18px;
  font-weight: bold;
}

.worker-sidebar-content {
  padding: 20px;
  height: 100%;
  overflow-y: auto;
  color: #fff;
}

.sidebar-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 24px;
  text-align: center;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.sidebar-section {
  margin-bottom: 24px;
}

.sidebar-label {
  display: block;
  font-size: 14px;
  margin-bottom: 8px;
  opacity: 0.9;
}

.sidebar-date-input {
  width: 100%;
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  cursor: pointer;
  backdrop-filter: blur(10px);
}

.sidebar-date-input::-webkit-calendar-picker-indicator {
  filter: invert(1);
  cursor: pointer;
}

.sidebar-date-input::placeholder {
  color: rgba(255, 255, 255, 0.6);
}

.sidebar-hint {
  text-align: center;
  font-size: 14px;
  opacity: 0.7;
  padding: 20px;
}

.stats-card {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  padding: 20px;
  backdrop-filter: blur(10px);
}

.stats-item {
  margin-bottom: 16px;
}

.stats-item:last-child {
  margin-bottom: 0;
}

.stats-label {
  font-size: 12px;
  opacity: 0.8;
  margin-bottom: 4px;
}

.stats-value {
  font-size: 28px;
  font-weight: bold;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.stats-value.is-urgent {
  color: #ffd700;
  animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.progress-container {
  padding-top: 8px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.progress-percent {
  font-size: 14px;
  font-weight: bold;
}

.progress-bar {
  height: 12px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff6b6b, #feca57, #48dbfb);
  border-radius: 6px;
  transition: width 0.3s ease;
}
</style>
