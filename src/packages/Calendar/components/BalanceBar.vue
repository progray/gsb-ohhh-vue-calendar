<template>
  <div class="balance-bar">
    <div
      class="balance-bar--segment balance-bar--income"
      :style="{ width: incomeWidth }"
    ></div>
    <div
      class="balance-bar--segment balance-bar--expense"
      :style="{ width: expenseWidth }"
    ></div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  income: {
    type: Number,
    default: 0
  },
  expense: {
    type: Number,
    default: 0
  },
  size: {
    type: String,
    default: 'small' // 'small' | 'large'
  }
})

const total = computed(() => props.income + props.expense)

const incomeWidth = computed(() => {
  if (total.value === 0) return '0%'
  if (props.expense === 0) return '100%'
  if (props.income === 0) return '0%'
  return `${(props.income / total.value) * 100}%`
})

const expenseWidth = computed(() => {
  if (total.value === 0) return '0%'
  if (props.income === 0) return '100%'
  if (props.expense === 0) return '0%'
  return `${(props.expense / total.value) * 100}%`
})
</script>

<style scoped lang="scss">
.balance-bar {
  display: flex;
  width: 100%;
  height: var(--balance-bar-height, 8px);
  border-radius: var(--balance-bar-radius, 4px);
  overflow: hidden;
  box-shadow: var(--balance-bar-shadow, 0 1px 3px rgba(0, 0, 0, 0.15));
}

.balance-bar--segment {
  transition: width 0.3s ease;
}

.balance-bar--income {
  background: var(--balance-bar-income-color, #8fbc8f);
  border-radius: var(--balance-bar-radius, 4px) 0 0 var(--balance-bar-radius, 4px);
}

.balance-bar--expense {
  background: var(--balance-bar-expense-color, #e64340);
  border-radius: 0 var(--balance-bar-radius, 4px) var(--balance-bar-radius, 4px) 0;
}

.balance-bar--income + .balance-bar--expense {
  border-radius: 0 var(--balance-bar-radius, 4px) var(--balance-bar-radius, 4px) 0;
}

.balance-bar--income:not(:last-child) {
  border-radius: var(--balance-bar-radius, 4px) 0 0 var(--balance-bar-radius, 4px);
}

.balance-bar--expense:first-child {
  border-radius: var(--balance-bar-radius, 4px);
}

.balance-bar--income:only-child,
.balance-bar--expense:only-child {
  border-radius: var(--balance-bar-radius, 4px);
}
</style>
