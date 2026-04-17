<template>
  <div class="app-container">
    <div class="calendar-wrapper">
      <ohhh-vue-calendar
        ref="calendarRef"
        :initial-selected-date="initialDate"
        :week-start="1"
        :marker-dates="markerDates"
        :show-footer="false"
        @select-change="onSelectChange"
        @view-change="onViewChange"
      />
    </div>

    <div class="monthly-stats">
      <div class="stats-item">
        <div class="stats-label">本月收入</div>
        <div class="stats-value income">+¥{{ monthlyIncome.toFixed(2) }}</div>
      </div>
      <div class="stats-divider"></div>
      <div class="stats-item">
        <div class="stats-label">本月支出</div>
        <div class="stats-value expense">-¥{{ monthlyExpense.toFixed(2) }}</div>
      </div>
      <div class="stats-divider"></div>
      <div class="stats-item">
        <div class="stats-label">本月结余</div>
        <div class="stats-value" :class="monthlyBalance >= 0 ? 'income' : 'expense'">
          {{ monthlyBalance >= 0 ? '+' : '' }}¥{{ monthlyBalance.toFixed(2) }}
        </div>
      </div>
    </div>

    <TransactionModal
      :visible="modalVisible"
      :date="selectedDate"
      :transactions="selectedDateTransactions"
      @close="closeModal"
    />
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import OhhhVueCalendar from './packages/Calendar/Calendar.vue'
import TransactionModal from './packages/TransactionModal/TransactionModal.vue'
import { transactionData, INCOME_COLOR, EXPENSE_COLOR } from './data/transactions.js'
import { isSameMonth, formatDateYYYYMMDD } from './packages/TransactionModal/utils/dateUtils.js'
import './packages/Calendar/style/mobile/mobile.scss'

const calendarRef = ref(null)
const initialDate = new Date(2026, 3, 15)
const currentMonth = ref(3)
const currentYear = ref(2026)

const modalVisible = ref(false)
const selectedDate = ref(null)

const selectedDateTransactions = computed(() => {
  if (!selectedDate.value) return []
  const dateStr = formatDateYYYYMMDD(selectedDate.value)
  return transactionData.filter(t => t.date === dateStr)
})

const markerDates = computed(() => {
  const markers = []
  const dateMap = new Map()

  transactionData.forEach(t => {
    if (!dateMap.has(t.date)) {
      dateMap.set(t.date, { income: false, expense: false })
    }
    if (t.type === 'income') {
      dateMap.get(t.date).income = true
    } else {
      dateMap.get(t.date).expense = true
    }
  })

  dateMap.forEach((types, date) => {
    if (types.income) {
      markers.push({
        date: new Date(date),
        color: INCOME_COLOR
      })
    }
    if (types.expense) {
      markers.push({
        date: new Date(date),
        color: EXPENSE_COLOR
      })
    }
  })

  return markers
})

const monthlyTransactions = computed(() => {
  return transactionData.filter(t => {
    const date = new Date(t.date)
    return date.getFullYear() === currentYear.value && date.getMonth() === currentMonth.value
  })
})

const monthlyIncome = computed(() => {
  return monthlyTransactions.value
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
})

const monthlyExpense = computed(() => {
  return monthlyTransactions.value
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)
})

const monthlyBalance = computed(() => monthlyIncome.value - monthlyExpense.value)

function onSelectChange(date) {
  selectedDate.value = date
  modalVisible.value = true
}

function onViewChange(viewMode) {
  console.log('view mode changed:', viewMode)
}

function closeModal() {
  modalVisible.value = false
}
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  background: linear-gradient(180deg, #11111b 0%, #1e1e2e 100%);
  display: flex;
  flex-direction: column;
  padding: 20px;
}

.calendar-wrapper {
  background: #1e1e2e;
  border-radius: 20px;
  padding: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.monthly-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #1e1e2e;
  border-radius: 20px;
  padding: 24px 20px;
  margin-top: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.stats-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.stats-label {
  font-size: 14px;
  color: #9399b2;
  font-weight: 500;
}

.stats-value {
  font-size: 20px;
  font-weight: 700;
}

.stats-value.income {
  color: #22c55e;
}

.stats-value.expense {
  color: #ef4444;
}

.stats-divider {
  width: 1px;
  height: 48px;
  background: #313244;
}
</style>
