<template>
  <div
    class="ohhh-calendar-container"
    :style="{
      '--calendar-rows': renderRows,
      '--calendar-transition-duration': duration,
      '--translate-distance': transformDistance,
      '--transition-duration': transitionDuration
    }"
  >
    <!-- 顶部工具栏 -->
    <div v-if="showToolbar" class="ohhh-calendar-toolbar">
      <slot name="toolbar" :year="currentYear" :month="currentMonth" :viewMode="viewMode">
        <div v-html="icons.arrowDoubleLeft" class="ohhh-calendar-toolbar--icon" @click="changePageTo('prev-year')" />
        <div v-html="icons.arrowLeft" class="ohhh-calendar-toolbar--icon" @click="changePageTo('prev-page')" />
        <div class="ohhh-calendar-toolbar--text">{{ headerLabel }}</div>
        <div v-html="icons.arrowRight" class="ohhh-calendar-toolbar--icon" @click="changePageTo('next-page')" />
        <div v-html="icons.arrowDoubleRight" class="ohhh-calendar-toolbar--icon" @click="changePageTo('next-year')" />
      </slot>
    </div>

    <!-- 关键日操作工具栏 -->
    <div class="ohhh-calendar-key-date-toolbar">
      <button
        class="ohhh-calendar-key-date-btn"
        :class="{ 'is-disabled': !hasSelectedDates }"
        :disabled="!hasSelectedDates"
        @click="openKeyDatePanel"
      >
        设置关键日
      </button>
      <button
        class="ohhh-calendar-key-date-btn ohhh-calendar-key-date-btn--secondary"
        :class="{ 'is-disabled': keyDates.length === 0 }"
        :disabled="keyDates.length === 0"
        @click="clearAllKeyDates"
      >
        清除所有关键日
      </button>
      <button
        v-if="hasSelectedDates"
        class="ohhh-calendar-key-date-btn ohhh-calendar-key-date-btn--secondary"
        @click="clearMultiSelect"
      >
        取消选择
      </button>
    </div>

    <!-- 星期栏 -->
    <div v-if="showWeekdays" class="ohhh-calendar-weekdays">
      <div v-for="(day, index) in weekdays" :key="day" class="ohhh-calendar-weekdays--weekday">
        <slot name="weekday" :weekday="day" :index="(index + weekStart) % 7">{{ day }}</slot>
      </div>
    </div>

    <!-- 日历主体 -->
    <div
      ref="swp"
      class="ohhh-calendar-wrapper"
      @mousedown="onWrapperMouseDown"
      @mousemove="onWrapperMouseMove"
      @mouseup="onWrapperMouseUp"
      @mouseleave="onWrapperMouseUp"
      @keydown="onKeyDown"
      @keyup="onKeyUp"
      tabindex="0"
    >
      <div
        v-for="(item, index) in allRenderDates"
        :key="index"
        :style="{ left: 100 * (index - 1) + '%' }"
        class="ohhh-calendar-days"
        @transitionend="onTransitionEnd"
      >
        <div
          v-for="dateObj in item"
          :key="dateObj.key"
          class="ohhh-calendar-day"
          :class="{
            'is-selected': isSameDay(dateObj.date, selected),
            'is-today': isSameDay(dateObj.date, new Date()),
            'is-multi-selected': isMultiSelected(dateObj.date) || isDateInSelection(dateObj),
            'is-key-date': !!getKeyDate(dateObj.date),
            'other-month': !dateObj.current
          }"
          :style="getKeyDateStyle(dateObj.date)"
          @mousedown="onDayMouseDown($event, dateObj)"
          @mouseenter="onDayMouseEnter(dateObj)"
          @click="onDayClick($event, dateObj)"
        >
          <div class="ohhh-calendar-day--inner">
            <div class="ohhh-calendar-day--inner-value">{{ dateObj.fullDate.date }}</div>
            <div class="ohhh-calendar-day--inner-label" v-if="$slots['day-label']">
              <slot name="day-label" :date="dateObj.date" />
            </div>
          </div>
          <div class="ohhh-calendar-day--marker" :style="{ background: _getMarkerColor(dateObj.date) }" />
          
          <!-- Tooltip -->
          <div v-if="getKeyDate(dateObj.date)?.description" class="ohhh-calendar-day--tooltip">
            {{ getKeyDate(dateObj.date).description }}
          </div>
        </div>
      </div>
    </div>

    <!-- 底部工具栏 -->
    <div v-if="showFooter" class="ohhh-calendar-footer">
      <slot name="footer" :year="currentYear" :month="currentMonth" :viewMode="viewMode">
        <div
          v-html="viewMode === 'week' ? icons.arrowDown : icons.arrowUp"
          class="ohhh-calendar-footer--icon"
          @click="toggleViewMode"
        />
      </slot>
    </div>

    <!-- 关键日设置面板 -->
    <div v-if="showKeyDatePanel" class="ohhh-calendar-modal-overlay" @click.self="closeKeyDatePanel">
      <div class="ohhh-calendar-modal">
        <div class="ohhh-calendar-modal--header">
          <h3>设置关键日</h3>
          <button class="ohhh-calendar-modal--close" @click="closeKeyDatePanel">×</button>
        </div>
        <div class="ohhh-calendar-modal--body">
          <div class="ohhh-calendar-form-item">
            <label class="ohhh-calendar-form--label">选择颜色</label>
            <div class="ohhh-calendar-color-picker">
              <div
                v-for="color in presetColors"
                :key="color.value"
                class="ohhh-calendar-color-option"
                :class="{ 'is-selected': keyDateForm.color === color.value }"
                :style="{ backgroundColor: color.value }"
                @click="keyDateForm.color = color.value"
              />
              <input
                type="color"
                v-model="keyDateForm.color"
                class="ohhh-calendar-color-input"
              />
            </div>
          </div>
          <div class="ohhh-calendar-form-item">
            <label class="ohhh-calendar-form--label">描述（最多100字）</label>
            <textarea
              v-model="keyDateForm.description"
              class="ohhh-calendar-form--textarea"
              placeholder="请输入描述..."
              maxlength="100"
              rows="3"
            ></textarea>
            <div class="ohhh-calendar-form--char-count">
              {{ keyDateForm.description.length }}/100
            </div>
          </div>
        </div>
        <div class="ohhh-calendar-modal--footer">
          <button class="ohhh-calendar-modal-btn ohhh-calendar-modal-btn--secondary" @click="closeKeyDatePanel">
            取消
          </button>
          <button class="ohhh-calendar-modal-btn" @click="confirmKeyDate">
            确认
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, useTemplateRef, toRefs, ref, reactive } from 'vue'
import { useSwipe } from '@vueuse/core'
import { useCalendar } from './hooks/useCalendar.js'
import { isSameDay, createWeekdays } from './utils'
import { icons } from './utils/icons.js'

const swipeRef = useTemplateRef('swp')

const emit = defineEmits(['select-change', 'view-change', 'key-date-change'])

const props = defineProps({
  initialSelectedDate: {
    type: Date,
    default: () => new Date()
  },
  initialViewMode: {
    type: String,
    default: 'month'
  },
  weekStart: {
    type: Number,
    default: 0
  },
  markerDates: {
    type: Array,
    default: () => []
  },
  showToolbar: {
    type: Boolean,
    default: true
  },
  showFooter: {
    type: Boolean,
    default: true
  },
  showWeekdays: {
    type: Boolean,
    default: true
  },
  duration: {
    type: String,
    default: '0.3s'
  }
})

const { initialSelectedDate, initialViewMode, weekStart, markerDates, duration } = toRefs(props)

const {
  selected,
  viewMode,
  currentYear,
  currentMonth,
  currentRenderDates,
  allRenderDates,
  transformDistance,
  transitionDuration,
  isInTransition,
  renderRows,
  switchPageToTargetDate,
  startTransitionAnimation,
  onTransitionEnd,
  toggleViewMode,
  multiSelectedDates,
  keyDates,
  hasSelectedDates,
  isMultiSelected,
  toggleMultiSelect,
  addMultiSelect,
  clearMultiSelect,
  getKeyDate,
  setKeyDates,
  clearAllKeyDates: _clearAllKeyDates
} = useCalendar({ initialSelectedDate, initialViewMode, weekStart, duration }, emit)

const headerLabel = computed(() => `${currentYear.value}年${currentMonth.value + 1}月`)
const weekdays = createWeekdays(weekStart.value)
const markerDateList = computed(() =>
  markerDates.value.map(item => ({
    date: new Date(typeof item === 'object' && item.date ? item.date : item),
    color: typeof item === 'object' && item.color ? item.color : 'var(--calendar-theme-color)'
  }))
)

const isCtrlPressed = ref(false)
const isSelecting = ref(false)
const selectionStartDate = ref(null)
const currentSelectionDates = ref(new Set())

const showKeyDatePanel = ref(false)
const keyDateForm = reactive({
  color: '#ff6b6b',
  description: ''
})

const presetColors = [
  { value: '#ff6b6b', label: '红色' },
  { value: '#ffa94d', label: '橙色' },
  { value: '#ffd43b', label: '黄色' },
  { value: '#69db7c', label: '绿色' },
  { value: '#74c0fc', label: '蓝色' },
  { value: '#b197fc', label: '紫色' },
  { value: '#f783ac', label: '粉色' }
]

const { lengthX } = useSwipe(swipeRef, {
  threshold: 0,
  onSwipe: () => {
    if (isInTransition.value) return
    transformDistance.value = -lengthX.value + 'px'
  },
  onSwipeEnd: (_, direction) => {
    if (isInTransition.value) return
    if (direction === 'left') {
      changePageTo('next-page')
    } else if (direction === 'right') {
      changePageTo('prev-page')
    } else {
      startTransitionAnimation(direction)
    }
  }
})

function _normalize(param) {
  if (!param) {
    throw new Error('参数不能为空')
  }
  if (param === 'prev-page') {
    if (viewMode.value === 'week') {
      return new Date(
        new Date(currentRenderDates.value[0].date).setDate(currentRenderDates.value[0].date.getDate() - 1)
      )
    } else if (viewMode.value === 'month') {
      return new Date(currentYear.value, currentMonth.value - 1)
    }
  }
  if (param === 'next-page') {
    if (viewMode.value === 'week') {
      return new Date(
        new Date(currentRenderDates.value[6].date).setDate(currentRenderDates.value[6].date.getDate() + 1)
      )
    } else if (viewMode.value === 'month') {
      return new Date(currentYear.value, currentMonth.value + 1)
    }
  }
  if (param === 'prev-year') {
    return new Date(currentYear.value - 1, currentMonth.value)
  }
  if (param === 'next-year') {
    return new Date(currentYear.value + 1, currentMonth.value)
  }
  const targetDate = new Date(param)
  if (!Number.isNaN(targetDate.getTime())) {
    return targetDate
  }
  throw new Error('日期不合法')
}

function changePageTo(param) {
  const targetDate = _normalize(param)
  switchPageToTargetDate(targetDate)
}

function changeSelectedDate(date) {
  changePageTo(date)
  if (!isSameDay(new Date(date), selected.value)) {
    selected.value = new Date(date)
    emit('select-change', selected.value)
  }
}

function _getMarkerColor(date) {
  return markerDateList.value.find(d => isSameDay(d.date, date))?.color
}

function getKeyDateStyle(date) {
  const keyDate = getKeyDate(date)
  if (keyDate) {
    return {
      '--key-date-color': keyDate.color
    }
  }
  return {}
}

function onKeyDown(e) {
  if (e.key === 'Control' || e.key === 'Meta') {
    isCtrlPressed.value = true
  }
}

function onKeyUp(e) {
  if (e.key === 'Control' || e.key === 'Meta') {
    isCtrlPressed.value = false
  }
}

function onDayClick(e, dateObj) {
  if (isCtrlPressed.value) {
    toggleMultiSelect(dateObj.date)
  } else {
    if (!isSelecting.value) {
      clearMultiSelect()
      changeSelectedDate(dateObj.date)
    }
  }
}

function onWrapperMouseDown(e) {
  if (e.button !== 0) return
  isCtrlPressed.value = e.ctrlKey || e.metaKey
}

function onDayMouseDown(e, dateObj) {
  if (e.button !== 0) return
  
  if (!isCtrlPressed.value && !isMultiSelected(dateObj.date)) {
    isSelecting.value = true
    selectionStartDate.value = dateObj
    currentSelectionDates.value = new Set()
    currentSelectionDates.value.add(dateObj.key)
  }
}

function onDayMouseEnter(dateObj) {
  if (!isSelecting.value || !selectionStartDate.value) return
  
  const start = selectionStartDate.value
  const dates = getAllCurrentMonthDates()
  
  const startIndex = dates.findIndex(d => d.key === start.key)
  const endIndex = dates.findIndex(d => d.key === dateObj.key)
  
  if (startIndex === -1 || endIndex === -1) return
  
  const minIndex = Math.min(startIndex, endIndex)
  const maxIndex = Math.max(startIndex, endIndex)
  
  currentSelectionDates.value.clear()
  for (let i = minIndex; i <= maxIndex; i++) {
    if (dates[i].current) {
      currentSelectionDates.value.add(dates[i].key)
    }
  }
}

function onWrapperMouseMove(e) {
  if (!isSelecting.value) return
}

function onWrapperMouseUp() {
  if (isSelecting.value && currentSelectionDates.value.size > 0) {
    const dates = getAllCurrentMonthDates()
    const selectedDates = dates.filter(d => currentSelectionDates.value.has(d.key)).map(d => d.date)
    
    if (!isCtrlPressed.value) {
      clearMultiSelect()
    }
    addMultiSelect(selectedDates)
  }
  
  isSelecting.value = false
  selectionStartDate.value = null
  currentSelectionDates.value.clear()
}

function getAllCurrentMonthDates() {
  const result = []
  for (const item of allRenderDates.value) {
    for (const d of item) {
      result.push(d)
    }
  }
  return result
}

function openKeyDatePanel() {
  if (!hasSelectedDates.value) return
  keyDateForm.color = '#ff6b6b'
  keyDateForm.description = ''
  showKeyDatePanel.value = true
}

function closeKeyDatePanel() {
  showKeyDatePanel.value = false
}

function confirmKeyDate() {
  const dates = []
  for (const item of allRenderDates.value) {
    for (const d of item) {
      if (isMultiSelected(d.date)) {
        dates.push(d.date)
      }
    }
  }
  
  setKeyDates(dates, keyDateForm.color, keyDateForm.description)
  clearMultiSelect()
  closeKeyDatePanel()
  emit('key-date-change', keyDates.value)
}

function clearAllKeyDates() {
  if (keyDates.value.length === 0) return
  if (confirm('确定要清除所有关键日吗？')) {
    _clearAllKeyDates()
    emit('key-date-change', keyDates.value)
  }
}

function isDateInSelection(dateObj) {
  return currentSelectionDates.value.has(dateObj.key)
}

defineExpose({
  toggleViewMode,
  changePageTo,
  changeSelectedDate,
  getKeyDates: () => keyDates.value,
  clearAllKeyDates: _clearAllKeyDates,
  clearMultiSelect
})
</script>

<style scoped>
.ohhh-calendar-key-date-toolbar {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  flex-wrap: wrap;
}

.ohhh-calendar-key-date-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  background: var(--calendar-theme-color);
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.ohhh-calendar-key-date-btn:hover:not(.is-disabled) {
  opacity: 0.9;
}

.ohhh-calendar-key-date-btn.is-disabled {
  background: #c0c4cc;
  cursor: not-allowed;
}

.ohhh-calendar-key-date-btn--secondary {
  background: #f5f7fa;
  color: #606266;
  border: 1px solid #dcdfe6;
}

.ohhh-calendar-key-date-btn--secondary:hover:not(.is-disabled) {
  background: #ecf5ff;
  color: var(--calendar-theme-color);
  border-color: #c6e2ff;
}

.ohhh-calendar-day {
  position: relative;
  user-select: none;
}

.ohhh-calendar-day.is-multi-selected .ohhh-calendar-day--inner {
  border: 2px solid #66b1ff;
  box-sizing: border-box;
  box-shadow: 0 0 0 2px rgba(102, 177, 255, 0.3);
}

.ohhh-calendar-day.is-multi-selected.is-key-date .ohhh-calendar-day--inner {
  border: 2px solid #fff;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.4);
}

.ohhh-calendar-day.is-key-date {
  background: var(--key-date-color);
}

.ohhh-calendar-day.is-key-date .ohhh-calendar-day--inner-value,
.ohhh-calendar-day.is-key-date .ohhh-calendar-day--inner-label {
  color: #fff;
}

.ohhh-calendar-day--tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.85);
  color: #fff;
  font-size: 12px;
  border-radius: 4px;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s ease;
  z-index: 100;
  max-width: 200px;
  white-space: normal;
  word-break: break-word;
  text-align: center;
}

.ohhh-calendar-day--tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-top-color: rgba(0, 0, 0, 0.85);
}

.ohhh-calendar-day:hover .ohhh-calendar-day--tooltip {
  opacity: 1;
  visibility: visible;
  transform: translateX(-50%) translateY(-4px);
}

.ohhh-calendar-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.ohhh-calendar-modal {
  background: #fff;
  border-radius: 8px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.ohhh-calendar-modal--header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e4e7ed;
}

.ohhh-calendar-modal--header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.ohhh-calendar-modal--close {
  background: none;
  border: none;
  font-size: 24px;
  color: #909399;
  cursor: pointer;
  line-height: 1;
  padding: 0;
}

.ohhh-calendar-modal--close:hover {
  color: #606266;
}

.ohhh-calendar-modal--body {
  padding: 20px;
}

.ohhh-calendar-form-item {
  margin-bottom: 20px;
}

.ohhh-calendar-form-item:last-child {
  margin-bottom: 0;
}

.ohhh-calendar-form--label {
  display: block;
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}

.ohhh-calendar-color-picker {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}

.ohhh-calendar-color-option {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s ease;
}

.ohhh-calendar-color-option:hover {
  transform: scale(1.1);
}

.ohhh-calendar-color-option.is-selected {
  border-color: #303133;
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
}

.ohhh-calendar-color-input {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  padding: 0;
}

.ohhh-calendar-form--textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  resize: none;
  box-sizing: border-box;
  transition: border-color 0.2s ease;
}

.ohhh-calendar-form--textarea:focus {
  outline: none;
  border-color: var(--calendar-theme-color);
}

.ohhh-calendar-form--char-count {
  text-align: right;
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.ohhh-calendar-modal--footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #e4e7ed;
}

.ohhh-calendar-modal-btn {
  padding: 8px 20px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.ohhh-calendar-modal-btn {
  background: var(--calendar-theme-color);
  color: #fff;
}

.ohhh-calendar-modal-btn:hover {
  opacity: 0.9;
}

.ohhh-calendar-modal-btn--secondary {
  background: #f5f7fa;
  color: #606266;
  border: 1px solid #dcdfe6;
}

.ohhh-calendar-modal-btn--secondary:hover {
  background: #ecf5ff;
  color: var(--calendar-theme-color);
  border-color: #c6e2ff;
}
</style>
