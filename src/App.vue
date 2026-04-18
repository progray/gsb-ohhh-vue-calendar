<template>
  <div class="date-range-picker">
    <div class="calendar-wrapper" ref="leftCalendarWrapper">
      <ohhh-vue-calendar
        ref="leftCalendarRef"
        :week-start="1"
        :show-footer="false"
        :initial-selected-date="initialDate"
        @select-change="onLeftSelectChange"
      >
        <template #toolbar="{ year, month, viewMode }">
          <div class="custom-toolbar">
            <div class="toolbar-title">开始日期</div>
            <div class="toolbar-controls">
              <div
                class="toolbar-icon"
                @click="navigateLeftCalendar('prev-year')"
              >
                <span class="icon-double-arrow">«</span>
              </div>
              <div
                class="toolbar-icon"
                @click="navigateLeftCalendar('prev-page')"
              >
                <span class="icon-arrow">‹</span>
              </div>
              <div class="toolbar-text">{{ year }}年{{ month + 1 }}月</div>
              <div
                class="toolbar-icon"
                @click="navigateLeftCalendar('next-page')"
              >
                <span class="icon-arrow">›</span>
              </div>
              <div
                class="toolbar-icon"
                @click="navigateLeftCalendar('next-year')"
              >
                <span class="icon-double-arrow">»</span>
              </div>
            </div>
          </div>
        </template>
        <template #day-label="{ date }">
          <div
            class="custom-day-label"
            :class="getLeftDayClass(date)"
            @mouseenter="onLeftDayHover(date)"
            @mouseleave="onLeftDayLeave()"
          >
            {{ date.getDate() }}
          </div>
        </template>
      </ohhh-vue-calendar>
    </div>

    <div class="calendar-wrapper" ref="rightCalendarWrapper">
      <ohhh-vue-calendar
        ref="rightCalendarRef"
        :week-start="1"
        :show-footer="false"
        :initial-selected-date="initialNextMonth"
        @select-change="onRightSelectChange"
      >
        <template #toolbar="{ year, month, viewMode }">
          <div class="custom-toolbar">
            <div class="toolbar-title">结束日期</div>
            <div class="toolbar-controls">
              <div
                class="toolbar-icon"
                :class="{ 'is-disabled': !canRightGoPrev }"
                @click="navigateRightCalendar('prev-year')"
              >
                <span class="icon-double-arrow">«</span>
              </div>
              <div
                class="toolbar-icon"
                :class="{ 'is-disabled': !canRightGoPrev }"
                @click="navigateRightCalendar('prev-page')"
              >
                <span class="icon-arrow">‹</span>
              </div>
              <div class="toolbar-text">{{ year }}年{{ month + 1 }}月</div>
              <div
                class="toolbar-icon"
                @click="navigateRightCalendar('next-page')"
              >
                <span class="icon-arrow">›</span>
              </div>
              <div
                class="toolbar-icon"
                @click="navigateRightCalendar('next-year')"
              >
                <span class="icon-double-arrow">»</span>
              </div>
            </div>
          </div>
        </template>
        <template #day-label="{ date }">
          <div
            class="custom-day-label"
            :class="getRightDayClass(date)"
            @mouseenter="onRightDayHover(date)"
            @mouseleave="onRightDayLeave()"
          >
            {{ date.getDate() }}
          </div>
        </template>
      </ohhh-vue-calendar>
    </div>
  </div>

  <div v-if="startDate && endDate" class="selected-range">
    已选择：{{ formatDate(startDate) }} 至 {{ formatDate(endDate) }}
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import OhhhVueCalendar from './packages/Calendar/Calendar.vue'
import '/src/packages/Calendar/style/mobile/mobile.scss'

const leftCalendarRef = ref(null)
const rightCalendarRef = ref(null)
const leftCalendarWrapper = ref(null)
const rightCalendarWrapper = ref(null)

const initialDate = new Date()
const initialNextMonth = new Date(initialDate.getFullYear(), initialDate.getMonth() + 1, 1)

const startDate = ref(null)
const endDate = ref(null)
const hoverDate = ref(null)
const isRightCalendar = ref(false)

const leftCalendarState = ref({
  year: initialDate.getFullYear(),
  month: initialDate.getMonth()
})

const rightCalendarState = ref({
  year: initialNextMonth.getFullYear(),
  month: initialNextMonth.getMonth()
})

const canRightGoPrev = computed(() => {
  const leftDate = new Date(leftCalendarState.value.year, leftCalendarState.value.month + 1, 1)
  const rightDate = new Date(rightCalendarState.value.year, rightCalendarState.value.month, 1)
  return rightDate > leftDate
})

function isSameDay(date1, date2) {
  if (!date1 || !date2) return false
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}

function isDateInRange(date, start, end) {
  if (!start || !end || !date) return false
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const s = new Date(start.getFullYear(), start.getMonth(), start.getDate())
  const e = new Date(end.getFullYear(), end.getMonth(), end.getDate())
  return d > s && d < e
}

function isDateBefore(date, reference) {
  if (!date || !reference) return false
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const r = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate())
  return d < r
}

function isDateAfter(date, reference) {
  if (!date || !reference) return false
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const r = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate())
  return d > r
}

function getLeftDayClass(date) {
  const classes = []
  
  if (startDate.value && isSameDay(date, startDate.value)) {
    classes.push('is-start', 'is-active')
  }
  
  if (endDate.value && isSameDay(date, endDate.value)) {
    classes.push('is-end', 'is-active')
  }
  
  if (isDateInRange(date, startDate.value, endDate.value)) {
    classes.push('in-range')
  }
  
  if (startDate.value && !endDate.value && hoverDate.value && isRightCalendar.value) {
    if (isDateInRange(date, startDate.value, hoverDate.value)) {
      classes.push('in-preview-range')
    }
    if (isSameDay(date, hoverDate.value)) {
      classes.push('is-hover-end')
    }
  }
  
  if (endDate.value && isDateAfter(date, endDate.value)) {
    classes.push('is-disabled')
  }
  
  return classes
}

function getRightDayClass(date) {
  const classes = []
  
  if (startDate.value && isSameDay(date, startDate.value)) {
    classes.push('is-start', 'is-active')
  }
  
  if (endDate.value && isSameDay(date, endDate.value)) {
    classes.push('is-end', 'is-active')
  }
  
  if (isDateInRange(date, startDate.value, endDate.value)) {
    classes.push('in-range')
  }
  
  if (startDate.value && !endDate.value && hoverDate.value && isRightCalendar.value) {
    if (isDateInRange(date, startDate.value, hoverDate.value)) {
      classes.push('in-preview-range')
    }
    if (isSameDay(date, hoverDate.value)) {
      classes.push('is-hover-end', 'is-active')
    }
    if (isSameDay(date, startDate.value)) {
      classes.push('is-active')
    }
  }
  
  if (startDate.value && isDateBefore(date, startDate.value)) {
    classes.push('is-disabled')
  }
  
  return classes
}

function navigateLeftCalendar(direction) {
  if (leftCalendarRef.value) {
    leftCalendarRef.value.changePageTo(direction)
    
    setTimeout(() => {
      const leftDate = new Date(leftCalendarState.value.year, leftCalendarState.value.month)
      let targetDate
      
      if (direction === 'prev-page') {
        targetDate = new Date(leftDate.getFullYear(), leftDate.getMonth() - 1)
      } else if (direction === 'next-page') {
        targetDate = new Date(leftDate.getFullYear(), leftDate.getMonth() + 1)
      } else if (direction === 'prev-year') {
        targetDate = new Date(leftDate.getFullYear() - 1, leftDate.getMonth())
      } else if (direction === 'next-year') {
        targetDate = new Date(leftDate.getFullYear() + 1, leftDate.getMonth())
      }
      
      if (targetDate) {
        leftCalendarState.value = {
          year: targetDate.getFullYear(),
          month: targetDate.getMonth()
        }
        
        const rightTarget = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 1)
        rightCalendarState.value = {
          year: rightTarget.getFullYear(),
          month: rightTarget.getMonth()
        }
        
        if (rightCalendarRef.value) {
          rightCalendarRef.value.changePageTo(rightTarget)
        }
      }
    }, 100)
  }
}

function navigateRightCalendar(direction) {
  if (direction === 'prev-page' || direction === 'prev-year') {
    if (!canRightGoPrev.value) return
  }
  
  if (rightCalendarRef.value) {
    rightCalendarRef.value.changePageTo(direction)
    
    setTimeout(() => {
      const rightDate = new Date(rightCalendarState.value.year, rightCalendarState.value.month)
      let targetDate
      
      if (direction === 'prev-page') {
        targetDate = new Date(rightDate.getFullYear(), rightDate.getMonth() - 1)
      } else if (direction === 'next-page') {
        targetDate = new Date(rightDate.getFullYear(), rightDate.getMonth() + 1)
      } else if (direction === 'prev-year') {
        targetDate = new Date(rightDate.getFullYear() - 1, rightDate.getMonth())
      } else if (direction === 'next-year') {
        targetDate = new Date(rightDate.getFullYear() + 1, rightDate.getMonth())
      }
      
      if (targetDate) {
        const leftDate = new Date(leftCalendarState.value.year, leftCalendarState.value.month + 1, 1)
        const newRightDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1)
        
        if (newRightDate >= leftDate) {
          rightCalendarState.value = {
            year: targetDate.getFullYear(),
            month: targetDate.getMonth()
          }
        }
      }
    }, 100)
  }
}

function onLeftSelectChange(date) {
  if (endDate.value && isDateAfter(date, endDate.value)) {
    return
  }
  
  startDate.value = new Date(date)
  
  if (endDate.value && isDateBefore(endDate.value, startDate.value)) {
    endDate.value = null
  }
  
  emitRangeChange()
}

function onRightSelectChange(date) {
  if (startDate.value && isDateBefore(date, startDate.value)) {
    return
  }
  
  if (!startDate.value) {
    startDate.value = new Date(date)
    return
  }
  
  endDate.value = new Date(date)
  emitRangeChange()
}

function onLeftDayHover(date) {
  isRightCalendar.value = false
  hoverDate.value = date
}

function onLeftDayLeave() {
  hoverDate.value = null
}

function onRightDayHover(date) {
  isRightCalendar.value = true
  hoverDate.value = date
}

function onRightDayLeave() {
  hoverDate.value = null
}

function emitRangeChange() {
  if (startDate.value && endDate.value) {
    console.log('Range selected:', {
      startDate: startDate.value,
      endDate: endDate.value
    })
  }
}

function formatDate(date) {
  if (!date) return ''
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

onMounted(() => {
  leftCalendarState.value = {
    year: initialDate.getFullYear(),
    month: initialDate.getMonth()
  }
  rightCalendarState.value = {
    year: initialNextMonth.getFullYear(),
    month: initialNextMonth.getMonth()
  }
})
</script>

<style scoped>
.date-range-picker {
  display: flex;
  gap: 20px;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.calendar-wrapper {
  flex: 1;
  min-width: 300px;
}

.selected-range {
  margin-top: 20px;
  padding: 12px 20px;
  background: #f5f7fa;
  border-radius: 6px;
  font-size: 14px;
  color: #606266;
  text-align: center;
}

.custom-toolbar {
  width: 100%;
}

.toolbar-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
  text-align: center;
}

.toolbar-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  column-gap: 16px;
}

.toolbar-icon {
  display: flex;
  cursor: pointer;
  fill: #909399;
  transition: fill 0.2s;
}

.toolbar-icon:hover {
  fill: #409eff;
}

.toolbar-icon.is-disabled {
  cursor: not-allowed;
  opacity: 0.4;
  pointer-events: none;
}

.toolbar-text {
  margin: 0 auto;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.icon-arrow {
  font-size: 20px;
  color: #909399;
  line-height: 1;
}

.icon-double-arrow {
  font-size: 16px;
  color: #909399;
  line-height: 1;
}

:deep(.ohhh-calendar-day--inner-value) {
  display: none;
}

:deep(.ohhh-calendar-day--inner-label) {
  position: absolute;
  inset: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 0 !important;
}

:deep(.ohhh-calendar-day) {
  position: relative;
}

:deep(.ohhh-calendar-day.is-selected .ohhh-calendar-day--inner) {
  background: transparent;
}

:deep(.ohhh-calendar-day.is-selected .ohhh-calendar-day--inner-value) {
  color: inherit;
}

:deep(.ohhh-calendar-day--inner) {
  position: relative;
  z-index: 1;
  background: transparent !important;
  border-radius: 0 !important;
}

.custom-day-label {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 34px;
  height: 34px;
  font-size: 14px;
  color: #303133;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  z-index: 2;
}

.custom-day-label:hover:not(.is-disabled) {
  background: rgba(64, 158, 255, 0.1);
}

.custom-day-label.is-active {
  background: #409eff;
  color: #fff;
  font-weight: 500;
}

.custom-day-label.is-active:hover {
  background: #409eff;
}

.custom-day-label.is-disabled {
  color: #c0c4cc;
  cursor: not-allowed;
  pointer-events: none;
}

.custom-day-label.in-range,
.custom-day-label.in-preview-range {
  background: rgba(64, 158, 255, 0.1);
  border-radius: 0;
}

.custom-day-label.in-range:hover,
.custom-day-label.in-preview-range:hover {
  background: rgba(64, 158, 255, 0.2);
}

.custom-day-label.is-start,
.custom-day-label.is-end,
.custom-day-label.is-hover-end {
  border-radius: 50%;
}

.custom-day-label.is-start.in-range,
.custom-day-label.is-start.in-preview-range {
  background: #409eff;
  color: #fff;
}

.custom-day-label.is-end.in-range,
.custom-day-label.is-hover-end.in-preview-range {
  background: #409eff;
  color: #fff;
}
</style>
