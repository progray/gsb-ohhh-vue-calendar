<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="transaction-modal-overlay" @click.self="close">
        <div class="transaction-modal">
          <div class="transaction-modal--header">
            <span class="transaction-modal--date">{{ formattedDate }}</span>
            <div class="transaction-modal--close" @click="close">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>
          <div class="transaction-modal--body">
            <div v-if="transactions.length === 0" class="transaction-modal--empty">
              当日暂无记录
            </div>
            <div v-else class="transaction-modal--list">
              <div
                v-for="transaction in transactions"
                :key="transaction.id"
                class="transaction-modal--item"
                :class="{
                  'is-income': transaction.type === 'income',
                  'is-expense': transaction.type === 'expense'
                }"
              >
                <div class="transaction-modal--item-left">
                  <div class="transaction-modal--item-category">{{ transaction.category }}</div>
                  <div v-if="transaction.remark" class="transaction-modal--item-remark">{{ transaction.remark }}</div>
                </div>
                <div class="transaction-modal--item-right">
                  <span class="transaction-modal--item-amount" :class="{
                    'text-income': transaction.type === 'income',
                    'text-expense': transaction.type === 'expense'
                  }">
                    {{ transaction.type === 'income' ? '+' : '-' }}¥{{ transaction.amount.toFixed(2) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div class="transaction-modal--footer">
            <div class="transaction-modal--summary">
              <div class="transaction-modal--summary-item">
                <span class="transaction-modal--summary-label">当日收入:</span>
                <span class="transaction-modal--summary-value text-income">+¥{{ dailyIncome.toFixed(2) }}</span>
              </div>
              <div class="transaction-modal--summary-item">
                <span class="transaction-modal--summary-label">当日支出:</span>
                <span class="transaction-modal--summary-value text-expense">-¥{{ dailyExpense.toFixed(2) }}</span>
              </div>
              <div class="transaction-modal--summary-item total">
                <span class="transaction-modal--summary-label">当日结余:</span>
                <span
                  class="transaction-modal--summary-value"
                  :class="dailyBalance >= 0 ? 'text-income' : 'text-expense'"
                >
                  {{ dailyBalance >= 0 ? '+' : '' }}¥{{ dailyBalance.toFixed(2) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'
import { formatDate } from './utils/dateUtils'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  date: {
    type: Date,
    default: () => new Date()
  },
  transactions: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close'])

const formattedDate = computed(() => formatDate(props.date))

const dailyIncome = computed(() => {
  return props.transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
})

const dailyExpense = computed(() => {
  return props.transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)
})

const dailyBalance = computed(() => dailyIncome.value - dailyExpense.value)

function close() {
  emit('close')
}
</script>

<style scoped>
.text-income {
  color: #22c55e;
}

.text-expense {
  color: #ef4444;
}

.transaction-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  padding: 20px;
}

.transaction-modal {
  width: 100%;
  max-width: 480px;
  max-height: 80vh;
  background: #1e1e2e;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

.transaction-modal--header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #313244;
  flex-shrink: 0;
}

.transaction-modal--date {
  font-size: 18px;
  font-weight: 600;
  color: #cdd6f4;
}

.transaction-modal--close {
  cursor: pointer;
  color: #9399b2;
  transition: color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 8px;
}

.transaction-modal--close:hover {
  color: #cdd6f4;
  background: #313244;
}

.transaction-modal--body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 24px;
}

.transaction-modal--empty {
  text-align: center;
  padding: 40px 20px;
  color: #9399b2;
  font-size: 14px;
}

.transaction-modal--list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.transaction-modal--item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px;
  background: #313244;
  border-radius: 12px;
  transition: background 0.2s;
}

.transaction-modal--item:hover {
  background: #45475a;
}

.transaction-modal--item-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.transaction-modal--item-category {
  font-size: 15px;
  font-weight: 500;
  color: #cdd6f4;
}

.transaction-modal--item-remark {
  font-size: 13px;
  color: #9399b2;
}

.transaction-modal--item-right {
  display: flex;
  align-items: center;
}

.transaction-modal--item-amount {
  font-size: 16px;
  font-weight: 600;
}

.transaction-modal--footer {
  flex-shrink: 0;
  padding: 16px 24px 24px;
  border-top: 1px solid #313244;
  background: #1e1e2e;
}

.transaction-modal--summary {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.transaction-modal--summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.transaction-modal--summary-item.total {
  padding-top: 12px;
  margin-top: 4px;
  border-top: 1px solid #45475a;
}

.transaction-modal--summary-label {
  font-size: 14px;
  color: #9399b2;
}

.transaction-modal--summary-value {
  font-size: 16px;
  font-weight: 600;
}

.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .transaction-modal,
.modal-leave-to .transaction-modal {
  transform: scale(0.95);
  opacity: 0;
}
</style>
