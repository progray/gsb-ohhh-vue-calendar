<template>
  <div v-if="visible" class="record-modal" @click.self="handleClose">
    <div class="record-modal--content">
      <div class="record-modal--header">
        <span class="record-modal--title">{{ isEdit ? '编辑记录' : '添加记录' }}</span>
        <span class="record-modal--date">{{ formattedDate }}</span>
      </div>

      <div class="record-modal--body">
        <div class="record-modal--form-item">
          <label class="record-modal--label">收入</label>
          <input
            type="number"
            v-model.number="form.income"
            class="record-modal--input income-input"
            placeholder="请输入收入金额"
            min="0"
            step="0.01"
          />
        </div>

        <div class="record-modal--form-item">
          <label class="record-modal--label">支出</label>
          <input
            type="number"
            v-model.number="form.expense"
            class="record-modal--input expense-input"
            placeholder="请输入支出金额"
            min="0"
            step="0.01"
          />
        </div>

        <div class="record-modal--form-item">
          <label class="record-modal--label">备注</label>
          <input
            type="text"
            v-model="form.remark"
            class="record-modal--input"
            placeholder="可选，输入备注信息"
            maxlength="50"
          />
        </div>

        <div class="record-modal--preview" v-if="hasData">
          <span class="record-modal--preview-label">预览</span>
          <div class="record-modal--preview-bar">
            <BalanceBar
              :income="form.income"
              :expense="form.expense"
              size="small"
            />
          </div>
          <div class="record-modal--preview-summary">
            <span class="record-modal--preview-income">
              收入: ¥{{ form.income.toFixed(2) }}
            </span>
            <span
              class="record-modal--preview-balance"
              :class="{
                'is-positive': balance >= 0,
                'is-negative': balance < 0
              }"
            >
              结余: {{ balance >= 0 ? '+' : '' }}¥{{ balance.toFixed(2) }}
            </span>
            <span class="record-modal--preview-expense">
              支出: ¥{{ form.expense.toFixed(2) }}
            </span>
          </div>
        </div>
      </div>

      <div class="record-modal--footer">
        <button v-if="isEdit" class="record-modal--btn record-modal--btn-delete" @click="handleDelete">
          删除
        </button>
        <button class="record-modal--btn record-modal--btn-cancel" @click="handleClose">
          取消
        </button>
        <button class="record-modal--btn record-modal--btn-save" @click="handleSave">
          保存
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import BalanceBar from './BalanceBar.vue'
import { formatDate, parseDate } from '../utils'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  date: {
    type: [Date, String, null],
    default: null
  },
  record: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:visible', 'save', 'delete'])

const form = ref({
  income: 0,
  expense: 0,
  remark: ''
})

const formattedDate = computed(() => {
  if (!props.date) return ''
  const date = typeof props.date === 'string' ? parseDate(props.date) : props.date
  return formatDate(date, 'YYYY年MM月DD日')
})

const isEdit = computed(() => !!props.record)

const hasData = computed(() => form.value.income > 0 || form.value.expense > 0)

const balance = computed(() => form.value.income - form.value.expense)

watch(
  () => props.visible,
  (val) => {
    if (val) {
      if (props.record) {
        form.value = {
          income: props.record.income || 0,
          expense: props.record.expense || 0,
          remark: props.record.remark || ''
        }
      } else {
        form.value = {
          income: 0,
          expense: 0,
          remark: ''
        }
      }
    }
  }
)

function handleClose() {
  emit('update:visible', false)
}

function handleSave() {
  if (!form.value.income && !form.value.expense) {
    alert('请输入收入或支出金额')
    return
  }
  emit('save', {
    date: props.date,
    income: form.value.income,
    expense: form.value.expense,
    remark: form.value.remark
  })
  handleClose()
}

function handleDelete() {
  if (confirm('确定要删除这条记录吗？')) {
    emit('delete', { date: props.date })
    handleClose()
  }
}
</script>

<style scoped lang="scss">
.record-modal {
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

.record-modal--content {
  background: #fff;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.record-modal--header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
}

.record-modal--title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.record-modal--date {
  font-size: 14px;
  color: #909399;
}

.record-modal--body {
  padding: 20px;
}

.record-modal--form-item {
  margin-bottom: 16px;
}

.record-modal--label {
  display: block;
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}

.record-modal--input {
  width: 100%;
  height: 40px;
  padding: 0 12px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  font-size: 14px;
  color: #333;
  background: #fff;
  transition: border-color 0.3s;
  box-sizing: border-box;
}

.record-modal--input:focus {
  outline: none;
  border-color: #409eff;
}

.record-modal--input::placeholder {
  color: #c0c4cc;
}

.record-modal--input.income-input:focus {
  border-color: #8fbc8f;
}

.record-modal--input.expense-input:focus {
  border-color: #cd853f;
}

.record-modal--preview {
  margin-top: 20px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.record-modal--preview-label {
  display: block;
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}

.record-modal--preview-bar {
  --balance-bar-height: 12px;
  --balance-bar-radius: 6px;
  margin-bottom: 12px;
}

.record-modal--preview-summary {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

.record-modal--preview-income {
  color: #8fbc8f;
}

.record-modal--preview-expense {
  color: #cd853f;
}

.record-modal--preview-balance {
  font-weight: 600;
}

.record-modal--preview-balance.is-positive {
  color: #8fbc8f;
}

.record-modal--preview-balance.is-negative {
  color: #cd853f;
}

.record-modal--footer {
  display: flex;
  justify-content: flex-end;
  padding: 16px 20px;
  border-top: 1px solid #eee;
  gap: 12px;
}

.record-modal--btn {
  height: 36px;
  padding: 0 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: opacity 0.3s;
}

.record-modal--btn:hover {
  opacity: 0.8;
}

.record-modal--btn-cancel {
  background: #f5f7fa;
  color: #606266;
}

.record-modal--btn-save {
  background: #409eff;
  color: #fff;
}

.record-modal--btn-delete {
  background: #fef0f0;
  color: #f56c6c;
  margin-right: auto;
}
</style>
