<template>
  <div class="app-container">
    <div class="picker-wrapper">
      <div class="calendar-box">
        <div class="calendar-title">开始日期</div>
        <div class="calendar-nav">
          <button class="nav-btn" @click="leftPrevYear">«</button>
          <button class="nav-btn" @click="leftPrevMonth">‹</button>
          <span class="current-date">{{ leftYear }}年{{ leftMonth + 1 }}月</span>
          <button class="nav-btn" @click="leftNextMonth">›</button>
          <button class="nav-btn" @click="leftNextYear">»</button>
        </div>
        <ohhh-vue-calendar
          ref="leftCal"
          :week-start="1"
          :show-toolbar="false"
          :show-footer="false"
          :initial-selected-date="leftStart"
          @select-change="onLeftSelect"
        />
      </div>

      <div class="calendar-box">
        <div class="calendar-title">结束日期</div>
        <div class="calendar-nav">
          <button class="nav-btn" :class="{ 'btn-disabled': !canRightGoBack }" @click="rightPrevYear">«</button>
          <button class="nav-btn" :class="{ 'btn-disabled': !canRightGoBack }" @click="rightPrevMonth">‹</button>
          <span class="current-date">{{ rightYear }}年{{ rightMonth + 1 }}月</span>
          <button class="nav-btn" @click="rightNextMonth">›</button>
          <button class="nav-btn" @click="rightNextYear">»</button>
        </div>
        <ohhh-vue-calendar
          ref="rightCal"
          :week-start="1"
          :show-toolbar="false"
          :show-footer="false"
          :initial-selected-date="rightStart"
          @select-change="onRightSelect"
        />
      </div>
    </div>

    <div v-if="startDate && endDate" class="range-info">
      已选择：{{ displayStart }} 至 {{ displayEnd }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import OhhhVueCalendar from './packages/Calendar/Calendar.vue'
import '/src/packages/Calendar/style/index.scss'

const leftCal = ref(null)
const rightCal = ref(null)

const today = new Date()
const leftStart = new Date(today.getFullYear(), today.getMonth(), 1)
const rightStart = new Date(today.getFullYear(), today.getMonth() + 1, 1)

const startDate = ref(null)
const endDate = ref(null)

const leftYear = ref(leftStart.getFullYear())
const leftMonth = ref(leftStart.getMonth())
const rightYear = ref(rightStart.getFullYear())
const rightMonth = ref(rightStart.getMonth())

const canRightGoBack = computed(() => {
  const leftNext = new Date(leftYear.value, leftMonth.value + 1, 1)
  const rightNow = new Date(rightYear.value, rightMonth.value, 1)
  return rightNow > leftNext
})

const displayStart = computed(() => {
  if (!startDate.value) return ''
  const y = startDate.value.getFullYear()
  const m = String(startDate.value.getMonth() + 1).padStart(2, '0')
  const d = String(startDate.value.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
})

const displayEnd = computed(() => {
  if (!endDate.value) return ''
  const y = endDate.value.getFullYear()
  const m = String(endDate.value.getMonth() + 1).padStart(2, '0')
  const d = String(endDate.value.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
})

function isBefore(d1, d2) {
  const a = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate())
  const b = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate())
  return a < b
}

function isAfter(d1, d2) {
  const a = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate())
  const b = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate())
  return a > b
}

function syncRightToLeftNext() {
  const target = new Date(leftYear.value, leftMonth.value + 1, 1)
  rightYear.value = target.getFullYear()
  rightMonth.value = target.getMonth()
  if (rightCal.value) {
    rightCal.value.changePageTo(target)
  }
}

function leftPrevYear() {
  leftYear.value -= 1
  const target = new Date(leftYear.value, leftMonth.value, 1)
  if (leftCal.value) {
    leftCal.value.changePageTo(target)
  }
  syncRightToLeftNext()
}

function leftPrevMonth() {
  leftMonth.value -= 1
  const target = new Date(leftYear.value, leftMonth.value, 1)
  leftYear.value = target.getFullYear()
  leftMonth.value = target.getMonth()
  if (leftCal.value) {
    leftCal.value.changePageTo(target)
  }
  syncRightToLeftNext()
}

function leftNextMonth() {
  leftMonth.value += 1
  const target = new Date(leftYear.value, leftMonth.value, 1)
  leftYear.value = target.getFullYear()
  leftMonth.value = target.getMonth()
  if (leftCal.value) {
    leftCal.value.changePageTo(target)
  }
  syncRightToLeftNext()
}

function leftNextYear() {
  leftYear.value += 1
  const target = new Date(leftYear.value, leftMonth.value, 1)
  if (leftCal.value) {
    leftCal.value.changePageTo(target)
  }
  syncRightToLeftNext()
}

function rightPrevYear() {
  if (!canRightGoBack.value) return
  rightYear.value -= 1
  const target = new Date(rightYear.value, rightMonth.value, 1)
  const leftNext = new Date(leftYear.value, leftMonth.value + 1, 1)
  if (target >= leftNext) {
    if (rightCal.value) {
      rightCal.value.changePageTo(target)
    }
  } else {
    rightYear.value += 1
  }
}

function rightPrevMonth() {
  if (!canRightGoBack.value) return
  rightMonth.value -= 1
  const target = new Date(rightYear.value, rightMonth.value, 1)
  rightYear.value = target.getFullYear()
  rightMonth.value = target.getMonth()
  const leftNext = new Date(leftYear.value, leftMonth.value + 1, 1)
  if (target >= leftNext) {
    if (rightCal.value) {
      rightCal.value.changePageTo(target)
    }
  } else {
    rightMonth.value += 1
    const reset = new Date(rightYear.value, rightMonth.value, 1)
    rightYear.value = reset.getFullYear()
    rightMonth.value = reset.getMonth()
  }
}

function rightNextMonth() {
  rightMonth.value += 1
  const target = new Date(rightYear.value, rightMonth.value, 1)
  rightYear.value = target.getFullYear()
  rightMonth.value = target.getMonth()
  if (rightCal.value) {
    rightCal.value.changePageTo(target)
  }
}

function rightNextYear() {
  rightYear.value += 1
  const target = new Date(rightYear.value, rightMonth.value, 1)
  if (rightCal.value) {
    rightCal.value.changePageTo(target)
  }
}

function onLeftSelect(date) {
  if (endDate.value && isAfter(date, endDate.value)) {
    return
  }
  startDate.value = new Date(date)
  if (endDate.value && isBefore(endDate.value, startDate.value)) {
    endDate.value = null
  }
  emitRange()
}

function onRightSelect(date) {
  if (startDate.value && isBefore(date, startDate.value)) {
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
</script>

<style scoped>
.app-container {
  padding: 24px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.picker-wrapper {
  display: flex;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.calendar-box {
  width: 50%;
  padding: 16px;
  box-sizing: border-box;
}

.calendar-box:first-child {
  border-right: 1px solid #ebeef5;
}

.calendar-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  text-align: center;
  margin-bottom: 12px;
}

.calendar-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.nav-btn {
  width: 28px;
  height: 28px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background-color: #ffffff;
  color: #606266;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  padding: 0;
}

.nav-btn:hover:not(.btn-disabled) {
  border-color: #409eff;
  color: #409eff;
  background-color: #ecf5ff;
}

.nav-btn.btn-disabled {
  color: #c0c4cc;
  cursor: not-allowed;
  opacity: 0.5;
}

.current-date {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.range-info {
  margin-top: 16px;
  padding: 12px 20px;
  background-color: #f5f7fa;
  border-radius: 6px;
  font-size: 14px;
  color: #606266;
  text-align: center;
}
</style>

<style>
.ohhh-calendar-days {
  inset-inline-end: auto !important;
  right: auto !important;
  transform: none !important;
}
</style>
