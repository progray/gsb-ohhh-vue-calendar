<template>
  <div class="date-range-picker">
    <div class="calendar-wrapper">
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
              <button
                type="button"
                class="toolbar-btn"
                @click="navigateLeftCalendar('prev-year')"
              >
                YY
              </button>
              <button
                type="button"
                class="toolbar-btn"
                @click="navigateLeftCalendar('prev-page')"
              >
                MM
              </button>
              <span class="toolbar-text">{{ year }}年{{ month + 1 }}月</span>
              <button
                type="button"
                class="toolbar-btn"
                @click="navigateLeftCalendar('next-page')"
              >
                MM
              </button>
              <button
                type="button"
                class="toolbar-btn"
                @click="navigateLeftCalendar('next-year')"
              >
                YY
              </button>
            </div>
          </div>
        </template>
      </ohhh-vue-calendar>
    </div>

    <div class="calendar-wrapper">
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
              <button
                type="button"
                class="toolbar-btn"
                :class="{ 'is-disabled': !canRightGoPrev }"
                @click="navigateRightCalendar('prev-year')"
              >
                YY
              </button>
              <button
                type="button"
                class="toolbar-btn"
                :class="{ 'is-disabled': !canRightGoPrev }"
                @click="navigateRightCalendar('prev-page')"
              >
                MM
              </button>
              <span class="toolbar-text">{{ year }}年{{ month + 1 }}月</span>
              <button
                type="button"
                class="toolbar-btn"
                @click="navigateRightCalendar('next-page')"
              >
                MM
              </button>
              <button
                type="button"
                class="toolbar-btn"
                @click="navigateRightCalendar('next-year')"
              >
                YY
              </button>
            </div>
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

const today = new Date()
const initialDate = new Date(today.getFullYear(), today.getMonth(), 1)
const initialNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1)

const startDate = ref(null)
const endDate = ref(null)

const leftCalendarState = ref({
  year: initialDate.getFullYear(),
  month: initialDate.getMonth()
})

const rightCalendarState = ref({
  year: initialNextMonth.getFullYear(),
  month: initialNextMonth.getMonth()
})

const canRightGoPrev = computed(() => {
  const leftNextMonth = new Date(leftCalendarState.value.year, leftCalendarState.value.month + 1, 1)
  const rightCurrent = new Date(rightCalendarState.value.year, rightCalendarState.value.month, 1)
  return rightCurrent > leftNextMonth
})

function isSameDay(date1, date2) {
  if (!date1 || !date2) return false
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
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

function navigateLeftCalendar(direction) {
  const current = new Date(leftCalendarState.value.year, leftCalendarState.value.month, 1)
  let target
  
  if (direction === 'prev-page') {
    target = new Date(current.getFullYear(), current.getMonth() - 1, 1)
  } else if (direction === 'next-page') {
    target = new Date(current.getFullYear(), current.getMonth() + 1, 1)
  } else if (direction === 'prev-year') {
    target = new Date(current.getFullYear() - 1, current.getMonth(), 1)
  } else if (direction === 'next-year') {
    target = new Date(current.getFullYear() + 1, current.getMonth(), 1)
  }
  
  if (target) {
    leftCalendarState.value = {
      year: target.getFullYear(),
      month: target.getMonth()
    }
    
    if (leftCalendarRef.value) {
      leftCalendarRef.value.changePageTo(target)
    }
    
    const rightTarget = new Date(target.getFullYear(), target.getMonth() + 1, 1)
    rightCalendarState.value = {
      year: rightTarget.getFullYear(),
      month: rightTarget.getMonth()
    }
    
    if (rightCalendarRef.value) {
      rightCalendarRef.value.changePageTo(rightTarget)
    }
  }
}

function navigateRightCalendar(direction) {
  if (direction === 'prev-page' || direction === 'prev-year') {
    if (!canRightGoPrev.value) return
  }
  
  const current = new Date(rightCalendarState.value.year, rightCalendarState.value.month, 1)
  let target
  
  if (direction === 'prev-page') {
    target = new Date(current.getFullYear(), current.getMonth() - 1, 1)
  } else if (direction === 'next-page') {
    target = new Date(current.getFullYear(), current.getMonth() + 1, 1)
  } else if (direction === 'prev-year') {
    target = new Date(current.getFullYear() - 1, current.getMonth(), 1)
  } else if (direction === 'next-year') {
    target = new Date(current.getFullYear() + 1, current.getMonth(), 1)
  }
  
  if (target) {
    const leftNextMonth = new Date(leftCalendarState.value.year, leftCalendarState.value.month + 1, 1)
    
    if (target >= leftNextMonth) {
      rightCalendarState.value = {
        year: target.getFullYear(),
        month: target.getMonth()
      }
      
      if (rightCalendarRef.value) {
        rightCalendarRef.value.changePageTo(target)
      }
    }
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
  return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0')
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
  gap: 24px;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.calendar-wrapper {
  flex: 1;
  min-width: 280px;
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
  column-gap: 8px;
}

.toolbar-btn {
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 32px;
  height: 28px;
  padding: 0 8px;
  font-size: 12px;
  color: #909399;
  background: transparent;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.toolbar-btn:hover:not(.is-disabled) {
  color: #409eff;
  border-color: #409eff;
  background: rgba(64, 158, 255, 0.1);
}

.toolbar-btn.is-disabled {
  color: #c0c4cc;
  border-color: #e4e7ed;
  cursor: not-allowed;
}

.toolbar-text {
  margin: 0 8px;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  white-space: nowrap;
}
</style>
