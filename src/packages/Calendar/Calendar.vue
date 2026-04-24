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

    <!-- 月度汇总栏 -->
    <div class="monthly-summary" v-if="showMonthlySummary">
      <template v-if="monthlySummary.hasData">
        <div class="monthly-summary--header">
          <span class="monthly-summary--income">
            <span class="monthly-summary--label">收入</span>
            <span class="monthly-summary--amount">¥{{ monthlySummary.totalIncome.toFixed(2) }}</span>
          </span>
          <span
            class="monthly-summary--balance"
            :class="{
              'is-positive': monthlySummary.balance >= 0,
              'is-negative': monthlySummary.balance < 0
            }"
          >
            <span class="monthly-summary--label">结余</span>
            <span class="monthly-summary--amount">
              {{ monthlySummary.balance >= 0 ? '+' : '' }}¥{{ monthlySummary.balance.toFixed(2) }}
            </span>
          </span>
          <span class="monthly-summary--expense">
            <span class="monthly-summary--label">支出</span>
            <span class="monthly-summary--amount">¥{{ monthlySummary.totalExpense.toFixed(2) }}</span>
          </span>
        </div>
        <div class="monthly-summary--bar">
          <BalanceBar
            :income="monthlySummary.totalIncome"
            :expense="monthlySummary.totalExpense"
            size="large"
          />
        </div>
      </template>
      <div class="monthly-summary--empty" v-else>
        暂无记录
      </div>
    </div>

    <!-- 星期栏 -->
    <div v-if="showWeekdays" class="ohhh-calendar-weekdays">
      <div v-for="(day, index) in weekdays" :key="day" class="ohhh-calendar-weekdays--weekday">
        <slot name="weekday" :weekday="day" :index="(index + weekStart) % 7">{{ day }}</slot>
      </div>
    </div>

    <!-- 日历主体 -->
    <div ref="swp" class="ohhh-calendar-wrapper">
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
            'other-month': !dateObj.current,
            'has-record': hasFinanceRecord(dateObj.date)
          }"
          @click="handleDateClick(dateObj.date)"
          @mouseenter="handleDateHover(dateObj.date, $event)"
          @mouseleave="handleDateLeave"
        >
          <div class="ohhh-calendar-day--inner">
            <div class="ohhh-calendar-day--inner-value">{{ dateObj.fullDate.date }}</div>
            <div class="ohhh-calendar-day--inner-label" v-if="$slots['day-label']">
              <slot name="day-label" :date="dateObj.date" />
            </div>
          </div>
          <div class="ohhh-calendar-day--balance-bar" v-if="hasFinanceRecord(dateObj.date)">
            <BalanceBar
              :income="getRecordIncome(dateObj.date)"
              :expense="getRecordExpense(dateObj.date)"
              size="small"
            />
          </div>
          <div class="ohhh-calendar-day--marker" :style="{ background: _getMarkerColor(dateObj.date) }" />
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

    <!-- 录入浮层 -->
    <RecordModal
      v-model:visible="modalVisible"
      :date="selectedDate"
      :record="selectedRecord"
      @save="handleRecordSave"
      @delete="handleRecordDelete"
    />

    <!-- Tooltip -->
    <div
      ref="tooltipRef"
      v-if="tooltipVisible"
      class="calendar-tooltip"
      :class="tooltipClass"
      :style="{
        left: tooltipPosition.x + 'px',
        top: tooltipPosition.y + 'px',
        '--tooltip-arrow-offset': tooltipArrowOffset + 'px'
      }"
    >
      <div class="calendar-tooltip--header">
        <span class="calendar-tooltip--date">{{ tooltipDate }}</span>
        <span
          class="calendar-tooltip--balance"
          :class="{
            'is-positive': tooltipRecord.balance >= 0,
            'is-negative': tooltipRecord.balance < 0
          }"
        >
          {{ tooltipRecord.balance >= 0 ? '+' : '' }}¥{{ tooltipRecord.balance.toFixed(2) }}
        </span>
      </div>
      <div class="calendar-tooltip--details">
        <div class="calendar-tooltip--item">
          <span class="calendar-tooltip--label">收入</span>
          <span class="calendar-tooltip--value income">¥{{ tooltipRecord.income.toFixed(2) }}</span>
        </div>
        <div class="calendar-tooltip--item">
          <span class="calendar-tooltip--label">支出</span>
          <span class="calendar-tooltip--value expense">¥{{ tooltipRecord.expense.toFixed(2) }}</span>
        </div>
      </div>
      <div class="calendar-tooltip--remark" v-if="tooltipRecord.remark">
        <span class="calendar-tooltip--label">备注</span>
        <span class="calendar-tooltip--value">{{ tooltipRecord.remark }}</span>
      </div>
      <div class="calendar-tooltip--bar">
        <BalanceBar
          :income="tooltipRecord.income"
          :expense="tooltipRecord.expense"
          size="small"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, useTemplateRef, toRefs, ref, watch, onMounted, nextTick } from 'vue'
import { useSwipe } from '@vueuse/core'
import { useCalendar } from './hooks/useCalendar.js'
import { useFinanceRecords } from './hooks/useFinanceRecords.js'
import { isSameDay, createWeekdays, formatDate } from './utils'
import { icons } from './utils/icons.js'
import BalanceBar from './components/BalanceBar.vue'
import RecordModal from './components/RecordModal.vue'

const swipeRef = useTemplateRef('swp')
const tooltipRef = useTemplateRef('tooltipRef')

const emit = defineEmits(['select-change', 'view-change', 'record-change'])

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
  showMonthlySummary: {
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
  toggleViewMode
} = useCalendar({ initialSelectedDate, initialViewMode, weekStart, duration }, emit)

const {
  records,
  loadRecords,
  getRecord,
  setRecord,
  deleteRecord,
  getMonthlySummary,
  hasRecord,
  initDemoData
} = useFinanceRecords()

const modalVisible = ref(false)
const selectedDate = ref(null)
const selectedRecord = ref(null)

const tooltipVisible = ref(false)
const tooltipPosition = ref({ x: 0, y: 0 })
const tooltipClass = ref('')
const tooltipArrowOffset = ref(0)
const tooltipDate = ref('')
const tooltipRecord = ref({ income: 0, expense: 0, balance: 0, remark: '' })

const headerLabel = computed(() => `${currentYear.value}年${currentMonth.value + 1}月`)
const weekdays = createWeekdays(weekStart.value)

const markerDateList = computed(() =>
  markerDates.value.map(item => ({
    date: new Date(typeof item === 'object' && item.date ? item.date : item),
    color: typeof item === 'object' && item.color ? item.color : 'var(--calendar-theme-color)'
  }))
)

const monthlySummary = computed(() => {
  const date = new Date(currentYear.value, currentMonth.value, 15)
  return getMonthlySummary(date)
})

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

function hasFinanceRecord(date) {
  return hasRecord(date)
}

function getRecordIncome(date) {
  const record = getRecord(date)
  return record ? record.income || 0 : 0
}

function getRecordExpense(date) {
  const record = getRecord(date)
  return record ? record.expense || 0 : 0
}

function handleDateClick(date) {
  changeSelectedDate(date)
  selectedDate.value = new Date(date)
  selectedRecord.value = getRecord(date)
  modalVisible.value = true
}

function handleDateHover(date, event) {
  const record = getRecord(date)
  if (!record) return

  tooltipDate.value = formatDate(date, 'MM月DD日')
  tooltipRecord.value = {
    income: record.income || 0,
    expense: record.expense || 0,
    balance: (record.income || 0) - (record.expense || 0),
    remark: record.remark || ''
  }

  const rect = event.currentTarget.getBoundingClientRect()
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  
  const estimatedTooltipWidth = 200
  const estimatedTooltipHeight = 150
  const gap = 10

  const cellCenterX = rect.left + rect.width / 2
  
  let x = cellCenterX
  let y = rect.top - gap
  
  let tooltipClasses = []
  let arrowOffset = 0
  
  const tooltipLeft = x - estimatedTooltipWidth / 2
  const tooltipRight = x + estimatedTooltipWidth / 2
  
  if (tooltipLeft < 0) {
    const neededOffset = -tooltipLeft
    x += neededOffset
    arrowOffset = -neededOffset
  } else if (tooltipRight > viewportWidth) {
    const neededOffset = tooltipRight - viewportWidth
    x -= neededOffset
    arrowOffset = neededOffset
  }
  
  const tooltipTop = y - estimatedTooltipHeight
  if (tooltipTop < 0) {
    y = rect.bottom + gap
    tooltipClasses.push('position-bottom')
  }
  
  tooltipPosition.value = { x, y }
  tooltipClass.value = tooltipClasses.join(' ')
  tooltipArrowOffset.value = arrowOffset
  tooltipVisible.value = true
}

function handleDateLeave() {
  tooltipVisible.value = false
}

function handleRecordSave(record) {
  setRecord(record.date, record)
  emit('record-change', {
    type: 'save',
    date: record.date,
    record: record
  })
}

function handleRecordDelete({ date }) {
  deleteRecord(date)
  emit('record-change', {
    type: 'delete',
    date: date
  })
}

onMounted(() => {
  loadRecords()
  nextTick(() => {
    initDemoData()
  })
})

defineExpose({
  toggleViewMode,
  changePageTo,
  changeSelectedDate,
  getRecord,
  setRecord,
  deleteRecord,
  getMonthlySummary
})
</script>

<style scoped lang="scss">
@use './style/variable.scss';

.monthly-summary {
  padding: 12px 16px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.monthly-summary--empty {
  text-align: center;
  color: #909399;
  font-size: 14px;
  padding: 8px 0;
}

.monthly-summary--header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.monthly-summary--income,
.monthly-summary--expense,
.monthly-summary--balance {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.monthly-summary--label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 2px;
}

.monthly-summary--amount {
  font-size: 16px;
  font-weight: 600;
}

.monthly-summary--income .monthly-summary--amount {
  color: #8fbc8f;
}

.monthly-summary--expense .monthly-summary--amount {
  color: #e64340;
}

.monthly-summary--balance .monthly-summary--amount.is-positive {
  color: #8fbc8f;
}

.monthly-summary--balance .monthly-summary--amount.is-negative {
  color: #e64340;
}

.monthly-summary--bar {
  --balance-bar-height: 14px;
  --balance-bar-radius: 7px;
  --balance-bar-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.ohhh-calendar-day {
  position: relative;
}

.ohhh-calendar-day--balance-bar {
  position: absolute;
  bottom: 6px;
  left: 50%;
  transform: translateX(-50%);
  width: 36px;
  --balance-bar-height: 6px;
  --balance-bar-radius: 3px;
  --balance-bar-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
}

.ohhh-calendar-day.has-record .ohhh-calendar-day--marker {
  display: none;
}

.calendar-tooltip {
  position: fixed;
  z-index: 2000;
  transform: translateX(-50%) translateY(-100%);
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 12px;
  min-width: 180px;
  pointer-events: none;
}

.calendar-tooltip.position-bottom {
  transform: translateX(-50%);
}

.calendar-tooltip::before {
  content: '';
  position: absolute;
  bottom: -6px;
  left: 50%;
  transform: translateX(calc(-50% + var(--tooltip-arrow-offset, 0px)));
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 6px solid #fff;
}

.calendar-tooltip.position-bottom::before {
  bottom: auto;
  top: -6px;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-bottom: 6px solid #fff;
  border-top: none;
}

.calendar-tooltip--header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}

.calendar-tooltip--date {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.calendar-tooltip--balance {
  font-size: 14px;
  font-weight: 600;
}

.calendar-tooltip--balance.is-positive {
  color: #8fbc8f;
}

.calendar-tooltip--balance.is-negative {
  color: #e64340;
}

.calendar-tooltip--details {
  margin-bottom: 8px;
}

.calendar-tooltip--item {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  margin-bottom: 4px;
}

.calendar-tooltip--label {
  color: #909399;
}

.calendar-tooltip--value {
  font-weight: 500;
}

.calendar-tooltip--value.income {
  color: #8fbc8f;
}

.calendar-tooltip--value.expense {
  color: #e64340;
}

.calendar-tooltip--remark {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  margin-bottom: 8px;
  padding-top: 8px;
  border-top: 1px solid #eee;
}

.calendar-tooltip--bar {
  --balance-bar-height: 8px;
  --balance-bar-radius: 4px;
}
</style>
