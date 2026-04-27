<template>
  <div class="app-container">
    <!-- 任务创建表单 -->
    <div class="task-creator">
      <h3 class="task-creator--title">创建新任务</h3>
      <div class="task-creator--form">
        <div class="task-creator--field">
          <label class="task-creator--label">任务名称</label>
          <input 
            type="text" 
            v-model="newTask.title" 
            class="task-creator--input"
            placeholder="请输入任务名称"
          />
        </div>
        <div class="task-creator--field">
          <label class="task-creator--label">开始日期</label>
          <input 
            type="date" 
            v-model="newTask.startDateStr" 
            class="task-creator--input"
          />
        </div>
        <div class="task-creator--field">
          <label class="task-creator--label">结束日期</label>
          <input 
            type="date" 
            v-model="newTask.endDateStr" 
            class="task-creator--input"
          />
        </div>
        <div class="task-creator--field">
          <label class="task-creator--label">任务颜色</label>
          <div class="task-creator--color-options">
            <div 
              v-for="(color, key) in colorOptions" 
              :key="key"
              class="task-creator--color-option"
              :class="{ 'is-selected': newTask.color === key }"
              :style="{ background: color.primary }"
              @click="newTask.color = key"
              :title="color.name"
            />
          </div>
        </div>
        <div class="task-creator--actions">
          <button class="task-creator--btn task-creator--btn-primary" @click="createTask">
            创建任务
          </button>
          <button class="task-creator--btn task-creator--btn-secondary" @click="resetForm">
            重置
          </button>
        </div>
        <div v-if="errorMessage" class="task-creator--error">
          {{ errorMessage }}
        </div>
      </div>
    </div>
    
    <ohhh-vue-calendar ref="calendarRef" :week-start="1" :markerDates @select-change="onSelectChange" />
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useTemplateRef } from 'vue'
import OhhhVueCalendar from './packages/Calendar/Calendar.vue'
import { useTaskStore } from './packages/Calendar/hooks/useTaskStore.js'
import '/src/packages/Calendar/style/mobile/mobile.scss'

const calendarRef = useTemplateRef('calendarRef')

const { addTask, TASK_COLORS } = useTaskStore()

const markerDates = [
  '2025-08-04',
  '2025-08-05',
  '2025-08-06',
  '2025-08-07',
  {
    date: '2025-08-08',
    color: '#ff6a6a'
  }
]

// 颜色选项
const colorOptions = {
  kleinianBlue: {
    primary: '#002FA7',
    name: '克莱因蓝'
  },
  emeraldGreen: {
    primary: '#046307',
    name: '祖母绿'
  },
  sunsetOrange: {
    primary: '#FF4500',
    name: '日落橙'
  },
  royalPurple: {
    primary: '#7851A9',
    name: '皇家紫'
  }
}

// 新任务表单数据
const today = new Date()
const todayStr = formatDateForInput(today)

const newTask = reactive({
  title: '',
  startDateStr: todayStr,
  endDateStr: todayStr,
  color: 'kleinianBlue'
})

const errorMessage = ref('')

// 格式化日期为 input type="date" 所需的格式 (YYYY-MM-DD)
function formatDateForInput(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 解析日期字符串为 Date 对象
function parseDate(dateStr) {
  if (!dateStr) return null
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

// 创建任务
function createTask() {
  errorMessage.value = ''
  
  // 验证任务名称
  if (!newTask.title.trim()) {
    errorMessage.value = '请输入任务名称'
    return
  }
  
  // 验证日期
  const startDate = parseDate(newTask.startDateStr)
  const endDate = parseDate(newTask.endDateStr)
  
  if (!startDate || !endDate) {
    errorMessage.value = '请选择有效的日期'
    return
  }
  
  // 验证结束日期不早于开始日期
  if (endDate < startDate) {
    errorMessage.value = '结束日期不能早于开始日期'
    return
  }
  
  // 创建任务
  addTask({
    title: newTask.title.trim(),
    startDate: startDate,
    endDate: endDate,
    color: newTask.color
  })
  
  // 重置表单（保持颜色选择）
  const currentColor = newTask.color
  resetForm()
  newTask.color = currentColor
}

// 重置表单
function resetForm() {
  newTask.title = ''
  newTask.startDateStr = todayStr
  newTask.endDateStr = todayStr
  newTask.color = 'kleinianBlue'
  errorMessage.value = ''
}

function onSelectChange(date) {
  console.log(date)
}
</script>

<style scoped lang="scss">
.app-container {
  padding: 16px;
  max-width: 1200px;
  margin: 0 auto;
}

.task-creator {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.task-creator--title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0 0 16px 0;
}

.task-creator--form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.task-creator--field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.task-creator--label {
  font-size: 14px;
  font-weight: 500;
  color: #555;
}

.task-creator--input {
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #002FA7;
    box-shadow: 0 0 0 2px rgba(0, 47, 167, 0.1);
  }
}

.task-creator--color-options {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.task-creator--color-option {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  border: 2px solid transparent;
  
  &:hover {
    transform: scale(1.1);
  }
  
  &.is-selected {
    border-color: #333;
    box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
  }
}

.task-creator--actions {
  display: flex;
  gap: 12px;
  grid-column: 1 / -1;
  margin-top: 8px;
}

.task-creator--btn {
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.task-creator--btn-primary {
  background: #002FA7;
  color: #fff;
  
  &:hover {
    background: #001F6E;
  }
  
  &:active {
    transform: scale(0.98);
  }
}

.task-creator--btn-secondary {
  background: #f5f5f5;
  color: #555;
  
  &:hover {
    background: #e5e5e5;
  }
  
  &:active {
    transform: scale(0.98);
  }
}

.task-creator--error {
  grid-column: 1 / -1;
  padding: 10px 12px;
  background: #fff1f0;
  border: 1px solid #ffa39e;
  border-radius: 6px;
  color: #cf1322;
  font-size: 14px;
}
</style>
