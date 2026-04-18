<template>
  <div class="app-container">
    <div class="dual-calendar-container">
      <!-- 左侧日历 - 开始日期 -->
      <div class="calendar-wrapper">
        <div class="calendar-label">开始日期</div>
        <ohhh-vue-calendar
          ref="leftCal"
          :week-start="1"
          :show-footer="false"
          @select-change="onLeftSelect"
        >
          <template #toolbar="{ year, month }">
            <div class="toolbar">
              <span class="nav-btn" @click="navLeft('prev-year')">«</span>
              <span class="nav-btn" @click="navLeft('prev-page')">‹</span>
              <span class="title">{{ year }}年{{ month + 1 }}月</span>
              <span class="nav-btn" @click="navLeft('next-page')">›</span>
              <span class="nav-btn" @click="navLeft('next-year')">»</span>
            </div>
            {{ trackLeftDate(year, month) }}
          </template>
          
          <template #day-label="{ date }">
            <div
              class="range-overlay"
              :class="{
                'in-range': isLeftDateInRange(date),
                'hover-preview': isLeftDateInHoverPreview(date)
              }"
            ></div>
          </template>
        </ohhh-vue-calendar>
      </div>

      <!-- 右侧日历 - 结束日期 -->
      <div class="calendar-wrapper">
        <div class="calendar-label">结束日期</div>
        <ohhh-vue-calendar
          ref="rightCal"
          :week-start="1"
          :show-footer="false"
          @select-change="onRightSelect"
        >
          <template #toolbar="{ year, month }">
            <div class="toolbar">
              <span 
                class="nav-btn" 
                :class="{ disabled: isRightNavDisabled('prev-year') }"
                @click="navRight('prev-year')"
              >«</span>
              <span 
                class="nav-btn" 
                :class="{ disabled: isRightNavDisabled('prev-page') }"
                @click="navRight('prev-page')"
              >‹</span>
              <span class="title">{{ year }}年{{ month + 1 }}月</span>
              <span class="nav-btn" @click="navRight('next-page')">›</span>
              <span class="nav-btn" @click="navRight('next-year')">»</span>
            </div>
            {{ trackRightDate(year, month) }}
          </template>
          
          <template #day-label="{ date }">
            <div
              class="range-overlay"
              :class="{
                'in-range': isRightDateInRange(date),
                'hover-preview': isRightDateInHoverPreview(date),
                'disabled': isRightDateDisabled(date)
              }"
              @mouseenter="onRightDateHover(date)"
              @mouseleave="onRightDateLeave"
            ></div>
          </template>
        </ohhh-vue-calendar>
      </div>
    </div>

    <!-- 选中的日期显示 -->
    <div v-if="start || end" class="result">
      <div class="result-item">
        <span class="label">开始：</span>
        <span class="value">{{ fmt(start) }}</span>
      </div>
      <div class="result-item">
        <span class="label">结束：</span>
        <span class="value">{{ fmt(end) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import OhhhVueCalendar from './packages/Calendar/Calendar.vue'
import { isSameDay } from './packages/Calendar/utils/index.js'
import '/src/packages/Calendar/style/mobile/mobile.scss'

const leftCal = ref(null)
const rightCal = ref(null)

const start = ref(null)
const end = ref(null)

const leftY = ref(new Date().getFullYear())
const leftM = ref(new Date().getMonth())

const rightY = ref(new Date().getFullYear())
const rightM = ref(new Date().getMonth() + 1)

const hoverDate = ref(null)

// 格式化日期
function fmt(d) {
  if (!d) return '未选择'
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// 比较日期
function before(d1, d2) {
  if (!d1 || !d2) return false
  const a = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate())
  const b = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate())
  return a < b
}

function after(d1, d2) {
  if (!d1 || !d2) return false
  const a = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate())
  const b = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate())
  return a > b
}

function between(d, s, e) {
  if (!d || !s || !e) return false
  const a = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const b = new Date(s.getFullYear(), s.getMonth(), s.getDate())
  const c = new Date(e.getFullYear(), e.getMonth(), e.getDate())
  return a > b && a < c
}

// 跟踪左侧日期
function trackLeftDate(y, m) {
  const changed = leftY.value !== y || leftM.value !== m
  leftY.value = y
  leftM.value = m
  
  if (changed) {
    syncRightToNextMonth()
  }
  return ''
}

// 跟踪右侧日期
function trackRightDate(y, m) {
  rightY.value = y
  rightM.value = m
  return ''
}

// 同步右侧到左侧下一个月
function syncRightToNextMonth() {
  const nextMonth = new Date(leftY.value, leftM.value + 1, 1)
  const tY = nextMonth.getFullYear()
  const tM = nextMonth.getMonth()
  
  const needSync = rightY.value < tY || (rightY.value === tY && rightM.value < tM)
  
  if (needSync && rightCal.value) {
    rightCal.value.changePageTo(nextMonth)
  }
}

// 左侧导航
function navLeft(dir) {
  let y = leftY.value
  let m = leftM.value
  
  switch (dir) {
    case 'prev-year': y--; break
    case 'prev-page': m--; if (m < 0) { m = 11; y--; }; break
    case 'next-page': m++; if (m > 11) { m = 0; y++; }; break
    case 'next-year': y++; break
  }
  
  if (leftCal.value) {
    leftCal.value.changePageTo(new Date(y, m, 1))
  }
}

// 右侧导航
function navRight(dir) {
  if (isRightNavDisabled(dir)) return
  
  let y = rightY.value
  let m = rightM.value
  
  switch (dir) {
    case 'prev-year': y--; break
    case 'prev-page': m--; if (m < 0) { m = 11; y--; }; break
    case 'next-page': m++; if (m > 11) { m = 0; y++; }; break
    case 'next-year': y++; break
  }
  
  if (rightCal.value) {
    rightCal.value.changePageTo(new Date(y, m, 1))
  }
}

// 检查右侧导航是否禁用
function isRightNavDisabled(dir) {
  if (dir !== 'prev-page' && dir !== 'prev-year') return false
  
  let y = rightY.value
  let m = rightM.value
  
  switch (dir) {
    case 'prev-page': m--; if (m < 0) { m = 11; y--; }; break
    case 'prev-year': y--; break
  }
  
  return y < leftY.value || (y === leftY.value && m <= leftM.value)
}

// 检查左侧日期是否在范围内
function isLeftDateInRange(date) {
  if (!start.value || !end.value) return false
  return between(date, start.value, end.value)
}

// 检查右侧日期是否在范围内
function isRightDateInRange(date) {
  if (!start.value || !end.value) return false
  return between(date, start.value, end.value)
}

// 检查左侧日期是否在悬停预览范围内
function isLeftDateInHoverPreview(date) {
  if (!start.value || end.value || !hoverDate.value) return false
  return between(date, start.value, hoverDate.value) || isSameDay(date, hoverDate.value)
}

// 检查右侧日期是否在悬停预览范围内
function isRightDateInHoverPreview(date) {
  if (!start.value || end.value || !hoverDate.value) return false
  return between(date, start.value, hoverDate.value) || isSameDay(date, hoverDate.value)
}

// 检查右侧日期是否禁用
function isRightDateDisabled(date) {
  if (!start.value) return false
  return before(date, start.value)
}

// 右侧日期悬停
function onRightDateHover(date) {
  if (start.value && !end.value) {
    if (!before(date, start.value)) {
      hoverDate.value = date
    }
  }
}

// 右侧日期悬停离开
function onRightDateLeave() {
  hoverDate.value = null
}

// 左侧选择
function onLeftSelect(date) {
  console.log('左侧选中:', fmt(date))
  
  // 如果选择的日期晚于结束日期，清空结束日期
  if (end.value && after(date, end.value)) {
    end.value = null
  }
  
  start.value = date
  emitRange()
}

// 右侧选择
function onRightSelect(date) {
  console.log('右侧选中:', fmt(date))
  
  // 如果选择的日期早于开始日期，忽略
  if (start.value && before(date, start.value)) {
    console.log('早于开始日期，忽略')
    return
  }
  
  end.value = date
  emitRange()
}

// 发出范围
function emitRange() {
  if (start.value && end.value) {
    console.log('范围:', {
      start: fmt(start.value),
      end: fmt(end.value)
    })
  }
}
</script>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  min-height: 100vh;
  background: #f5f5f5;
}

.dual-calendar-container {
  display: flex;
  gap: 20px;
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.calendar-wrapper {
  flex: 1;
  min-width: 300px;
}

.calendar-label {
  text-align: center;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  width: 100%;
}

.nav-btn {
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 18px;
  color: #666;
  user-select: none;
  transition: background-color 0.2s;
}

.nav-btn:hover {
  background-color: #f0f0f0;
}

.nav-btn.disabled {
  opacity: 0.3;
  cursor: not-allowed;
  pointer-events: none;
}

.title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

/* 范围覆盖层样式 - 关键修复 */
:deep(.ohhh-calendar-day--inner) {
  position: relative;
}

:deep(.ohhh-calendar-day--inner-label) {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 0;
  margin: 0;
  z-index: 1;
  pointer-events: none;
}

.range-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
  pointer-events: none;
}

.range-overlay.in-range,
.range-overlay.hover-preview {
  background-color: rgba(66, 153, 225, 0.15);
}

.range-overlay.disabled {
  cursor: not-allowed;
  pointer-events: auto;
}

/* 确保日期数字在覆盖层上面 */
:deep(.ohhh-calendar-day--inner-value) {
  position: relative;
  z-index: 2;
}

/* 结果显示 */
.result {
  margin-top: 20px;
  padding: 16px 24px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  display: flex;
  gap: 32px;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.label {
  font-size: 14px;
  color: #666;
}

.value {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}
</style>
