<template>
  <div class="app-container">
    <div class="dual-calendar-container">
      <!-- 左侧日历 - 开始日期 -->
      <div class="calendar-wrapper left-calendar">
        <ohhh-vue-calendar
          ref="leftCalendarRef"
          :week-start="1"
          :show-footer="false"
          @select-change="onLeftSelectChange"
        >
          <!-- 自定义工具栏 -->
          <template #toolbar="{ year, month }">
            <div class="custom-toolbar">
              {{ trackLeftCalendarDate(year, month) }}
              <div class="toolbar-icon" @click="navigateLeftCalendar('prev-year')">
                <span class="icon-double-left">«</span>
              </div>
              <div class="toolbar-icon" @click="navigateLeftCalendar('prev-page')">
                <span class="icon-left">‹</span>
              </div>
              <div class="toolbar-text">{{ leftDisplayYear }}年{{ leftDisplayMonth + 1 }}月</div>
              <div class="toolbar-icon" @click="navigateLeftCalendar('next-page')">
                <span class="icon-right">›</span>
              </div>
              <div class="toolbar-icon" @click="navigateLeftCalendar('next-year')">
                <span class="icon-double-right">»</span>
              </div>
            </div>
          </template>
          
          <!-- 日期覆盖层 -->
          <template #day-label="{ date }">
            <div
              class="day-overlay-wrapper"
              :class="{
                'is-disabled': isDateDisabled(date, 'left'),
                'is-in-range': isDateInRange(date),
                'is-hover-preview': isHoverPreviewDate(date)
              }"
              @click="handleDayClick(date, 'left', $event)"
            ></div>
          </template>
        </ohhh-vue-calendar>
      </div>

      <!-- 右侧日历 - 结束日期 -->
      <div class="calendar-wrapper right-calendar">
        <ohhh-vue-calendar
          ref="rightCalendarRef"
          :week-start="1"
          :show-footer="false"
          @select-change="onRightSelectChange"
        >
          <!-- 自定义工具栏 -->
          <template #toolbar="{ year, month }">
            <div class="custom-toolbar">
              {{ trackRightCalendarDate(year, month) }}
              <div 
                class="toolbar-icon" 
                :class="{ 'is-disabled': isRightNavDisabled('prev-year') }"
                @click="navigateRightCalendar('prev-year')"
              >
                <span class="icon-double-left">«</span>
              </div>
              <div 
                class="toolbar-icon" 
                :class="{ 'is-disabled': isRightNavDisabled('prev-page') }"
                @click="navigateRightCalendar('prev-page')"
              >
                <span class="icon-left">‹</span>
              </div>
              <div class="toolbar-text">{{ rightDisplayYear }}年{{ rightDisplayMonth + 1 }}月</div>
              <div class="toolbar-icon" @click="navigateRightCalendar('next-page')">
                <span class="icon-right">›</span>
              </div>
              <div class="toolbar-icon" @click="navigateRightCalendar('next-year')">
                <span class="icon-double-right">»</span>
              </div>
            </div>
          </template>
          
          <!-- 日期覆盖层 -->
          <template #day-label="{ date }">
            <div
              class="day-overlay-wrapper"
              :class="{
                'is-disabled': isDateDisabled(date, 'right'),
                'is-in-range': isDateInRange(date),
                'is-hover-preview': isHoverPreviewDate(date)
              }"
              @click="handleDayClick(date, 'right', $event)"
              @mouseenter="handleRightDateHover(date)"
              @mouseleave="handleRightDateLeave"
            ></div>
          </template>
        </ohhh-vue-calendar>
      </div>
    </div>

    <!-- 选中的日期显示 -->
    <div v-if="startDate || endDate" class="selected-dates-display">
      <div class="date-item">
        <span class="date-label">开始日期：</span>
        <span class="date-value">{{ formatDate(startDate) }}</span>
      </div>
      <div class="date-item">
        <span class="date-label">结束日期：</span>
        <span class="date-value">{{ formatDate(endDate) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import OhhhVueCalendar from './packages/Calendar/Calendar.vue'
import { isSameDay } from './packages/Calendar/utils/index.js'
import '/src/packages/Calendar/style/mobile/mobile.scss'

const leftCalendarRef = ref(null)
const rightCalendarRef = ref(null)

// 选中的日期
const startDate = ref(null)
const endDate = ref(null)

// 左侧日历当前显示的年/月
const leftDisplayYear = ref(new Date().getFullYear())
const leftDisplayMonth = ref(new Date().getMonth())

// 右侧日历当前显示的年/月
const rightDisplayYear = ref(new Date().getFullYear())
const rightDisplayMonth = ref(new Date().getMonth() + 1)

// 悬停预览的日期
const hoverDate = ref(null)

// 标记是否需要忽略下一次选择事件
const ignoreNextLeftSelect = ref(false)
const ignoreNextRightSelect = ref(false)

// 初始化右侧日历显示下一个月
watch([leftDisplayYear, leftDisplayMonth], ([newYear, newMonth]) => {
  // 计算下一个月
  const nextMonthDate = new Date(newYear, newMonth + 1, 1)
  const targetYear = nextMonthDate.getFullYear()
  const targetMonth = nextMonthDate.getMonth()
  
  // 检查右侧日历当前显示的月份是否早于下一个月
  if (rightDisplayYear.value < targetYear || 
      (rightDisplayYear.value === targetYear && rightDisplayMonth.value < targetMonth)) {
    // 让右侧日历显示下一个月
    rightDisplayYear.value = targetYear
    rightDisplayMonth.value = targetMonth
    
    if (rightCalendarRef.value) {
      rightCalendarRef.value.changePageTo(nextMonthDate)
    }
  }
}, { immediate: true })

// 跟踪左侧日历当前显示的年/月（通过 toolbar slot 调用）
function trackLeftCalendarDate(year, month) {
  leftDisplayYear.value = year
  leftDisplayMonth.value = month
  return ''
}

// 跟踪右侧日历当前显示的年/月（通过 toolbar slot 调用）
function trackRightCalendarDate(year, month) {
  rightDisplayYear.value = year
  rightDisplayMonth.value = month
  return ''
}

// 格式化日期
function formatDate(date) {
  if (!date) return '未选择'
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 比较日期（只比较年月日）
function isDateBefore(date1, date2) {
  if (!date1 || !date2) return false
  const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate())
  const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate())
  return d1 < d2
}

function isDateAfter(date1, date2) {
  if (!date1 || !date2) return false
  const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate())
  const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate())
  return d1 > d2
}

function isDateBetween(date, start, end) {
  if (!date || !start || !end) return false
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const s = new Date(start.getFullYear(), start.getMonth(), start.getDate())
  const e = new Date(end.getFullYear(), end.getMonth(), end.getDate())
  return d > s && d < e
}

// 左侧日历导航
function navigateLeftCalendar(direction) {
  let targetYear = leftDisplayYear.value
  let targetMonth = leftDisplayMonth.value
  
  switch (direction) {
    case 'prev-year':
      targetYear -= 1
      break
    case 'prev-page':
      targetMonth -= 1
      if (targetMonth < 0) {
        targetMonth = 11
        targetYear -= 1
      }
      break
    case 'next-page':
      targetMonth += 1
      if (targetMonth > 11) {
        targetMonth = 0
        targetYear += 1
      }
      break
    case 'next-year':
      targetYear += 1
      break
  }
  
  const targetDate = new Date(targetYear, targetMonth, 1)
  
  if (leftCalendarRef.value) {
    leftCalendarRef.value.changePageTo(targetDate)
  }
}

// 右侧日历导航
function navigateRightCalendar(direction) {
  // 检查是否可以导航
  if (isRightNavDisabled(direction)) {
    return
  }
  
  let targetYear = rightDisplayYear.value
  let targetMonth = rightDisplayMonth.value
  
  switch (direction) {
    case 'prev-year':
      targetYear -= 1
      break
    case 'prev-page':
      targetMonth -= 1
      if (targetMonth < 0) {
        targetMonth = 11
        targetYear -= 1
      }
      break
    case 'next-page':
      targetMonth += 1
      if (targetMonth > 11) {
        targetMonth = 0
        targetYear += 1
      }
      break
    case 'next-year':
      targetYear += 1
      break
  }
  
  const targetDate = new Date(targetYear, targetMonth, 1)
  
  if (rightCalendarRef.value) {
    rightCalendarRef.value.changePageTo(targetDate)
  }
}

// 检查右侧日历导航是否禁用
function isRightNavDisabled(direction) {
  // 只有向前导航才需要检查
  if (direction !== 'prev-page' && direction !== 'prev-year') {
    return false
  }
  
  let targetYear = rightDisplayYear.value
  let targetMonth = rightDisplayMonth.value
  
  switch (direction) {
    case 'prev-page':
      targetMonth -= 1
      if (targetMonth < 0) {
        targetMonth = 11
        targetYear -= 1
      }
      break
    case 'prev-year':
      targetYear -= 1
      break
  }
  
  // 检查目标月份是否早于或等于左侧当前月份
  if (targetYear < leftDisplayYear.value) {
    return true
  }
  if (targetYear === leftDisplayYear.value && targetMonth <= leftDisplayMonth.value) {
    return true
  }
  
  return false
}

// 处理日期点击
function handleDayClick(date, side, event) {
  // 检查日期是否禁用
  if (isDateDisabled(date, side)) {
    event.stopPropagation()
    event.preventDefault()
    
    // 设置标记，忽略下一次选择事件
    if (side === 'left') {
      ignoreNextLeftSelect.value = true
    } else {
      ignoreNextRightSelect.value = true
    }
    
    return
  }
}

// 左侧日期选择
function onLeftSelectChange(date) {
  // 检查是否需要忽略这次选择
  if (ignoreNextLeftSelect.value) {
    ignoreNextLeftSelect.value = false
    return
  }
  
  // 检查是否选择了禁用的日期
  if (isDateDisabled(date, 'left')) {
    return
  }
  
  // 如果已经选择了结束日期，且新的开始日期晚于结束日期，则清空结束日期
  if (endDate.value && isDateAfter(date, endDate.value)) {
    endDate.value = null
  }
  
  startDate.value = date
  emitDateRange()
}

// 右侧日期选择
function onRightSelectChange(date) {
  // 检查是否需要忽略这次选择
  if (ignoreNextRightSelect.value) {
    ignoreNextRightSelect.value = false
    return
  }
  
  // 检查是否选择了禁用的日期
  if (isDateDisabled(date, 'right')) {
    return
  }
  
  // 如果已经选择了开始日期，且新的结束日期早于开始日期，则不更新
  if (startDate.value && isDateBefore(date, startDate.value)) {
    return
  }
  
  endDate.value = date
  emitDateRange()
}

// 发出日期范围事件
function emitDateRange() {
  if (startDate.value && endDate.value) {
    console.log('日期范围选择完成：', {
      startDate: startDate.value,
      endDate: endDate.value,
      startDateFormatted: formatDate(startDate.value),
      endDateFormatted: formatDate(endDate.value)
    })
  }
}

// 检查日期是否禁用
function isDateDisabled(date, side) {
  if (side === 'right') {
    // 右侧日历：早于开始日期的日期禁用
    if (startDate.value && isDateBefore(date, startDate.value)) {
      return true
    }
  } else if (side === 'left') {
    // 左侧日历：晚于结束日期的日期禁用
    if (endDate.value && isDateAfter(date, endDate.value)) {
      return true
    }
  }
  return false
}

// 检查日期是否在范围内
function isDateInRange(date) {
  if (!startDate.value || !endDate.value) return false
  return isDateBetween(date, startDate.value, endDate.value)
}

// 检查日期是否在悬停预览范围内
function isHoverPreviewDate(date) {
  if (!startDate.value || endDate.value || !hoverDate.value) return false
  return isDateBetween(date, startDate.value, hoverDate.value) || 
         isSameDay(date, hoverDate.value)
}

// 处理右侧日期悬停
function handleRightDateHover(date) {
  // 只有当只选择了开始日期时，才显示悬停预览
  if (startDate.value && !endDate.value) {
    // 只预览晚于开始日期的日期
    if (!isDateBefore(date, startDate.value)) {
      hoverDate.value = date
    }
  }
}

// 处理右侧日期悬停离开
function handleRightDateLeave() {
  hoverDate.value = null
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

.left-calendar,
.right-calendar {
  :deep(.ohhh-calendar-container) {
    background: transparent;
  }
}

.custom-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  column-gap: 8px;
  padding: 12px 16px;
  width: 100%;
}

.toolbar-icon {
  display: flex;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f0f0f0;
  }

  &.is-disabled {
    opacity: 0.3;
    cursor: not-allowed;
    pointer-events: none;
  }
}

.toolbar-text {
  margin: 0 auto;
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.icon-double-left,
.icon-double-right,
.icon-left,
.icon-right {
  font-size: 18px;
  color: #666;
  user-select: none;
}

/* 日期覆盖层 - 用于实现范围高亮和禁用状态 */
:deep(.ohhh-calendar-day) {
  position: relative;
}

:deep(.ohhh-calendar-day--inner) {
  position: relative;
  z-index: 1;
}

:deep(.ohhh-calendar-day--inner-label) {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10;
  pointer-events: auto;
}

.day-overlay-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: auto;
  z-index: 10;
  cursor: pointer;
}

.day-overlay-wrapper.is-disabled {
  cursor: not-allowed;
  background-color: rgba(0, 0, 0, 0.03);
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.06);
  }
  
  /* 覆盖禁用日期的文字颜色 */
  & ~ :deep(.ohhh-calendar-day--inner) {
    .ohhh-calendar-day--inner-value {
      color: #ccc !important;
    }
  }
}

.day-overlay-wrapper.is-in-range,
.day-overlay-wrapper.is-hover-preview {
  background-color: rgba(66, 153, 225, 0.15);
}

/* 选中日期显示 */
.selected-dates-display {
  margin-top: 20px;
  padding: 16px 24px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  display: flex;
  gap: 32px;
}

.date-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.date-label {
  font-size: 14px;
  color: #666;
}

.date-value {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}
</style>
