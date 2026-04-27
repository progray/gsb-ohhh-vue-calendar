<template>
  <div
    class="worker-sidebar"
    :class="{ 'is-open': isOpen }"
  >
    <div class="worker-sidebar-toggle" @click="toggleSidebar">
      <span class="toggle-icon">{{ isOpen ? '◀' : '▶' }}</span>
      <span v-if="!isOpen" class="toggle-label">打工人视图</span>
    </div>

    <div v-if="isOpen" class="worker-sidebar-content">
      <h3 class="sidebar-title">打工人专属视图</h3>

      <div class="sidebar-section">
        <label class="sidebar-label">预定退休日期</label>
        <input
          type="date"
          v-model="retirementDateStr"
          class="sidebar-date-input"
          @change="onDateChange"
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
    default: true
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

watch(retirementDateStr, (newVal) => {
  retirementDate.value = parseDate(newVal)
  if (isOpen.value) {
    emit('date-change', {
      retirementDate: retirementDate.value,
      isCelebration: isCelebration.value
    })
  }
})

onMounted(() => {
  if (props.initialRetirementDate) {
    retirementDate.value = parseDate(props.initialRetirementDate)
  }
  emit('date-change', {
    retirementDate: retirementDate.value,
    isCelebration: isCelebration.value
  })
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
  transition: width 0.3s ease, min-width 0.3s ease;
  background: linear-gradient(180deg, #f8fafc 0%, #f0f5ff 100%);
  overflow: visible;
  min-width: 0;
  flex-shrink: 0;
}

.worker-sidebar.is-open {
  width: 260px;
  min-width: 260px;
  border-right: 1px solid #e2e8f0;
}

.worker-sidebar-toggle {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.worker-sidebar:not(.is-open) .worker-sidebar-toggle {
  right: -48px;
  background: linear-gradient(90deg, #409eff, #66b1ff);
  border-radius: 0 8px 8px 0;
  padding: 20px 8px;
  box-shadow: 2px 0 12px rgba(64, 158, 255, 0.4);
  width: 48px;
  min-height: 80px;
}

.worker-sidebar.is-open .worker-sidebar-toggle {
  right: 12px;
  background: rgba(64, 158, 255, 0.1);
  border-radius: 6px;
  padding: 10px 12px;
}

.toggle-icon {
  color: #fff;
  font-size: 16px;
  font-weight: bold;
  line-height: 1;
}

.worker-sidebar.is-open .toggle-icon {
  color: #409eff;
}

.toggle-label {
  color: #fff;
  font-size: 11px;
  writing-mode: vertical-rl;
  margin-top: 10px;
  letter-spacing: 3px;
  line-height: 1.5;
}

.worker-sidebar-content {
  padding: 20px 16px;
  height: 100%;
  overflow-y: auto;
  color: #303133;
  width: 260px;
  box-sizing: border-box;
}

.sidebar-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 20px;
  text-align: center;
  color: #409eff;
  padding-bottom: 12px;
  border-bottom: 1px solid #e2e8f0;
}

.sidebar-section {
  margin-bottom: 20px;
}

.sidebar-label {
  display: block;
  font-size: 13px;
  margin-bottom: 8px;
  color: #606266;
  font-weight: 500;
}

.sidebar-date-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  background: #fff;
  color: #303133;
  cursor: pointer;
  box-sizing: border-box;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.sidebar-date-input:focus {
  outline: none;
  border-color: #409eff;
  box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.15);
}

.sidebar-date-input::-webkit-calendar-picker-indicator {
  cursor: pointer;
  opacity: 0.6;
}

.sidebar-date-input::-webkit-calendar-picker-indicator:hover {
  opacity: 1;
}

.sidebar-hint {
  text-align: center;
  font-size: 13px;
  color: #909399;
  padding: 20px;
  background: rgba(64, 158, 255, 0.05);
  border-radius: 6px;
  border: 1px dashed #d1e5ff;
}

.stats-card {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.stats-item {
  margin-bottom: 16px;
}

.stats-item:last-child {
  margin-bottom: 0;
}

.stats-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.stats-value {
  font-size: 26px;
  font-weight: bold;
  color: #409eff;
}

.stats-value.is-urgent {
  color: #f56c6c;
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
  font-size: 13px;
  font-weight: 600;
  color: #409eff;
}

.progress-bar {
  height: 10px;
  background: #ebeef5;
  border-radius: 5px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #409eff, #66b1ff);
  border-radius: 5px;
  transition: width 0.3s ease;
}
</style>
