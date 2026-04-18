<template>
  <div class="app-container">
    <div class="range-picker-container">
      <div class="calendar-column left-calendar">
        <div class="calendar-header">
          <span class="header-label">开始日期</span>
          <div class="header-nav">
            <button class="nav-btn" @click="navigateLeft('prev-year')">«</button>
            <button class="nav-btn" @click="navigateLeft('prev-page')">‹</button>
            <span class="header-date">{{ leftYear }}年{{ leftMonth + 1 }}月</span>
            <button class="nav-btn" @click="navigateLeft('next-page')">›</button>
            <button class="nav-btn" @click="navigateLeft('next-year')">»</button>
          </div>
        </div>
        <ohhh-vue-calendar
          ref="leftCalRef"
          :week-start="1"
          :show-toolbar="false"
          :show-footer="false"
          :initial-selected-date="leftInitialDate"
          @select-change="onLeftSelect"
        />
      </div>

      <div class="calendar-column right-calendar">
        <div class="calendar-header">
          <span class="header-label">结束日期</span>
          <div class="header-nav">
            <button class="nav-btn" :class="{ disabled: !canRightPrev }" @click="navigateRight('prev-year')">«</button>
            <button class="nav-btn" :class="{ disabled: !canRightPrev }" @click="navigateRight('prev-page')">‹</button>
            <span class="header-date">{{ rightYear }}年{{ rightMonth + 1 }}月</span>
            <button class="nav-btn" @click="navigateRight('next-page')">›</button>
            <button class="nav-btn" @click="navigateRight('next-year')">»</button>
          </div>
        </div>
        <ohhh-vue-calendar
          ref="rightCalRef"
          :week-start="1"
          :show-toolbar="false"
          :show-footer="false"
          :initial-selected-date="rightInitialDate"
          @select-change="onRightSelect"
        />
      </div>
    </div>

    <div v-if="startDate && endDate" class="range-display">
      已选择：{{ formatDate(startDate) }} 至 {{ formatDate(endDate) }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import OhhhVueCalendar from './packages/Calendar/Calendar.vue'
import '/src/packages/Calendar/style/mobile/mobile.scss'

const leftCalRef = ref(null)
const rightCalRef = ref(null)

const today = new Date()
const leftInitialDate = new Date(today.getFullYear(), today.getMonth(), 1)
const rightInitialDate = new Date(today.getFullYear(), today.getMonth() + 1, 1)

const startDate = ref(null)
const endDate = ref(null)

const leftYear = ref(leftInitialDate.getFullYear())
const leftMonth = ref(leftInitialDate.getMonth())
const rightYear = ref(rightInitialDate.getFullYear())
const rightMonth = ref(rightInitialDate.getMonth())

const canRightPrev = computed(() => {
  const leftNextMonth = new Date(leftYear.value, leftMonth.value + 1, 1)
  const rightCurrent = new Date(rightYear.value, rightMonth.value, 1)
  return rightCurrent > leftNextMonth
})

function isDateBefore(date, refDate) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const r = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate())
  return d < r
}

function isDateAfter(date, refDate) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const r = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate())
  return d > r
}

function navigateLeft(direction) {
  let newYear = leftYear.value
  let newMonth = leftMonth.value

  if (direction === 'prev-page') {
    newMonth -= 1
  } else if (direction === 'next-page') {
    newMonth += 1
  } else if (direction === 'prev-year') {
    newYear -= 1
  } else if (direction === 'next-year') {
    newYear += 1
  }

  const newDate = new Date(newYear, newMonth, 1)
  leftYear.value = newDate.getFullYear()
  leftMonth.value = newDate.getMonth()

  if (leftCalRef.value) {
    leftCalRef.value.changePageTo(newDate)
  }

  const rightTarget = new Date(newDate.getFullYear(), newDate.getMonth() + 1, 1)
  rightYear.value = rightTarget.getFullYear()
  rightMonth.value = rightTarget.getMonth()

  if (rightCalRef.value) {
    rightCalRef.value.changePageTo(rightTarget)
  }
}

function navigateRight(direction) {
  if ((direction === 'prev-page' || direction === 'prev-year') && !canRightPrev.value) {
    return
  }

  let newYear = rightYear.value
  let newMonth = rightMonth.value

  if (direction === 'prev-page') {
    newMonth -= 1
  } else if (direction === 'next-page') {
    newMonth += 1
  } else if (direction === 'prev-year') {
    newYear -= 1
  } else if (direction === 'next-year') {
    newYear += 1
  }

  const newDate = new Date(newYear, newMonth, 1)
  const leftNextMonth = new Date(leftYear.value, leftMonth.value + 1, 1)

  if (newDate >= leftNextMonth) {
    rightYear.value = newDate.getFullYear()
    rightMonth.value = newDate.getMonth()

    if (rightCalRef.value) {
      rightCalRef.value.changePageTo(newDate)
    }
  }
}

function onLeftSelect(date) {
  if (endDate.value && isDateAfter(date, endDate.value)) {
    return
  }

  startDate.value = new Date(date)

  if (endDate.value && isDateBefore(endDate.value, startDate.value)) {
    endDate.value = null
  }

  emitRange()
}

function onRightSelect(date) {
  if (startDate.value && isDateBefore(date, startDate.value)) {
    return
  }

  if (!startDate.value) {
    startDate.value = new Date(date)
    return
  }

  endDate.value = new Date(date)
  emitRange()
}

function emitRange() {
  if (startDate.value && endDate.value) {
    console.log('Range selected:', {
      start: startDate.value,
      end: endDate.value
    })
  }
}

function formatDate(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}

onMounted(() => {
  leftYear.value = leftInitialDate.getFullYear()
  leftMonth.value = leftInitialDate.getMonth()
  rightYear.value = rightInitialDate.getFullYear()
  rightMonth.value = rightInitialDate.getMonth()
})
</script>

<style scoped>
.app-container {
  padding: 20px;
  background: #f0f2f5;
  min-height: 100vh;
}

.range-picker-container {
  display: flex;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.calendar-column {
  width: 50%;
  box-sizing: border-box;
}

.left-calendar {
  border-right: 1px solid #e4e7ed;
}

.calendar-header {
  padding: 16px 20px 12px;
  border-bottom: 1px solid #e4e7ed;
  background: #fafafa;
}

.header-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
  text-align: center;
}

.header-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.nav-btn {
  width: 28px;
  height: 28px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #fff;
  color: #606266;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  padding: 0;
}

.nav-btn:hover:not(.disabled) {
  border-color: #409eff;
  color: #409eff;
  background: #ecf5ff;
}

.nav-btn.disabled {
  color: #c0c4cc;
  cursor: not-allowed;
  opacity: 0.5;
}

.header-date {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  white-space: nowrap;
}

.range-display {
  margin-top: 16px;
  padding: 12px 20px;
  background: #f5f7fa;
  border-radius: 6px;
  font-size: 14px;
  color: #606266;
  text-align: center;
}

:deep(.ohhh-calendar-wrapper) {
  position: relative !important;
  overflow: hidden !important;
}

:deep(.ohhh-calendar-days) {
  position: absolute !important;
  top: 0 !important;
  bottom: 0 !important;
  width: 100% !important;
  right: auto !important;
  transform: none !important;
}

:deep(.ohhh-calendar-days:nth-child(1)) {
  left: -100% !important;
}

:deep(.ohhh-calendar-days:nth-child(2)) {
  left: 0 !important;
}

:deep(.ohhh-calendar-days:nth-child(3)) {
  left: 100% !important;
}
</style>
