<template>
  <div class="app-container">
    <div class="control-panel">
      <h3>选择模式</h3>
      <button 
        :class="{ active: selectionMode === 'single' }"
        @click="setSelectionMode('single')"
      >
        单选模式
      </button>
      <button 
        :class="{ active: selectionMode === 'multiple' }"
        @click="setSelectionMode('multiple')"
      >
        多选模式
      </button>
      
      <div v-if="selectionMode === 'multiple'" class="range-control">
        <h4>范围选择</h4>
        <label>
          <input type="checkbox" v-model="isRangeMode" @change="toggleRangeMode" />
          启用范围选择
        </label>
        
        <div class="max-select-control">
          <h4>最大可选数量</h4>
          <input 
            type="number" 
            v-model.number="maxSelectCount" 
            min="1" 
            @change="updateMaxSelectCount"
          />
          <span>(设置为 Infinity 表示不限制)</span>
        </div>
      </div>
    </div>
    
    <ohhh-vue-calendar 
      ref="calendarRef" 
      :week-start="1" 
      :markerDates 
      :selection-mode="selectionMode"
      :range-mode="isRangeMode"
      :max-select-count="maxSelectCount"
      @select-change="onSelectChange" 
    />
  </div>
</template>

<script setup>
import { ref, useTemplateRef } from 'vue'
import OhhhVueCalendar from './packages/Calendar/Calendar.vue'
import '/src/packages/Calendar/style/mobile/mobile.scss'

const calendarRef = useTemplateRef('calendarRef')

// 选择模式：'single' | 'multiple'
const selectionMode = ref('multiple')
// 范围选择模式
const isRangeMode = ref(false)
// 最大可选数量
const maxSelectCount = ref(5)

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

function onSelectChange(date) {
  console.log('选中的日期:', date)
  if (Array.isArray(date)) {
    console.log('选中数量:', date.length)
  }
}

function setSelectionMode(mode) {
  selectionMode.value = mode
  if (calendarRef.value) {
    calendarRef.value.setSelectionMode(mode)
  }
}

function toggleRangeMode() {
  if (calendarRef.value) {
    calendarRef.value.setRangeMode(isRangeMode.value)
  }
}

function updateMaxSelectCount() {
  if (calendarRef.value) {
    calendarRef.value.setMaxSelectCount(maxSelectCount.value)
  }
}
</script>

<style scoped>
.app-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.control-panel {
  margin-bottom: 20px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.control-panel h3 {
  margin-top: 0;
  margin-bottom: 12px;
  font-size: 16px;
  color: #303133;
}

.control-panel h4 {
  margin: 16px 0 8px;
  font-size: 14px;
  color: #606266;
}

.control-panel button {
  padding: 8px 16px;
  margin-right: 8px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.control-panel button:hover {
  border-color: #409eff;
  color: #409eff;
}

.control-panel button.active {
  background: #409eff;
  border-color: #409eff;
  color: #fff;
}

.range-control {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e4e7ed;
}

.range-control label {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 14px;
  color: #606266;
}

.range-control input[type="checkbox"] {
  margin-right: 8px;
}

.max-select-control {
  margin-top: 12px;
}

.max-select-control input[type="number"] {
  padding: 6px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  width: 80px;
}

.max-select-control span {
  margin-left: 8px;
  font-size: 12px;
  color: #909399;
}
</style>
