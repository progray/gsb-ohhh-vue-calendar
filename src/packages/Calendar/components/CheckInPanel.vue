<template>
  <transition name="panel">
    <div v-if="visible" class="checkin-panel-overlay" @click.self="handleClose">
      <div class="checkin-panel">
        <div class="checkin-panel--header">
          <div class="checkin-panel--header-left">
          <span class="checkin-panel--date-icon">📅</span>
          <span class="checkin-panel--date">{{ formattedDate }}</span>
          <span v-if="isToday" class="checkin-panel--today-badge">今天</span>
        </div>
          <button class="checkin-panel--close-btn" @click="handleClose">×</button>
        </div>
        
        <div class="checkin-panel--summary" v-if="goals.length === 0">
          <div class="checkin-panel--empty">
            <span class="checkin-panel--empty-icon">🎯</span>
            <span class="checkin-panel--empty-title">暂无目标</span>
            <span class="checkin-panel--empty-desc">请先在顶部工具栏添加健身目标</span>
          </div>
        </div>
        
        <div v-else class="checkin-panel--goals">
          <div
            v-for="goal in goals"
            :key="goal.id"
            class="checkin-panel--goal-item"
            :class="{ 'is-completed': getProgress(goal).isCompleted }"
            :style="{ '--goal-color': getProgressColor(getProgress(goal).percentage, goal.color) }"
          >
            <div class="checkin-panel--goal-header">
              <div class="checkin-panel--goal-info">
                <span class="checkin-panel--goal-emoji">{{ goal.emoji }}</span>
                <div class="checkin-panel--goal-name">{{ goal.name }}</div>
              </div>
              <ProgressRing
                :percentage="getProgress(goal).percentage"
                :size="64"
                :stroke-width="6"
                :progress-color="getProgressColor(getProgress(goal).percentage, goal.color)"
                :show-text="true"
                :show-details="true"
                :current-value="getProgress(goal).current"
                :target-value="goal.target"
              />
            </div>
            
            <div class="checkin-panel--input-section">
              <div class="checkin-panel--input-controls">
                <button
                  class="checkin-panel--control-btn"
                  @mousedown="startDecrement(goal)"
                  @mouseup="stopAdjust"
                  @mouseleave="stopAdjust"
                  @touchstart="startDecrement(goal)"
                  @touchend="stopAdjust"
                >
                  −
                </button>
                <div class="checkin-panel--value-display">
                  <span class="checkin-panel--current-value">{{ getRecord(date, goal.id) }}</span>
                  <span class="checkin-panel--unit">{{ goal.unit }}</span>
                </div>
                <button
                  class="checkin-panel--control-btn"
                  @mousedown="startIncrement(goal)"
                  @mouseup="stopAdjust"
                  @mouseleave="stopAdjust"
                  @touchstart="startIncrement(goal)"
                  @touchend="stopAdjust"
                >
                  +
                </button>
              </div>
              
              <div class="checkin-panel--slider-container">
                <input
                  type="range"
                  :value="getRecord(date, goal.id)"
                  @input="handleSliderInput($event, goal)"
                  :min="0"
                  :max="goal.target * 2"
                  :step="goal.target > 100 ? 10 : 1"
                  class="checkin-panel--slider"
                  :style="{ '--slider-color': getProgressColor(getProgress(goal).percentage, goal.color) }"
                />
                <div class="checkin-panel--slider-labels">
                  <span class="checkin-panel--slider-min">0</span>
                  <span class="checkin-panel--slider-target">目标: {{ goal.target }}{{ goal.unit }}</span>
                  <span class="checkin-panel--slider-max">{{ goal.target * 2 }}{{ goal.unit }}</span>
                </div>
              </div>
            </div>
            
            <div class="checkin-panel--quick-add">
              <button
              v-for="quick in getQuickValues(goal.target)"
              :key="quick"
              class="checkin-panel--quick-btn"
              @click="quickAdd(goal, quick)"
            >
              +{{ quick }}
            </button>
            </div>
          </div>
        </div>
        
        <div class="checkin-panel--footer">
          <div class="checkin-panel--overall-progress">
            <div class="checkin-panel--overall-bar">
              <div
                class="checkin-panel--overall-fill"
                :style="{ width: overallProgress + '%' }"
              ></div>
            </div>
            <span class="checkin-panel--overall-text">
              今日完成: {{ completedCount }}/{{ goals.length }} 项
            </span>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import ProgressRing from './ProgressRing.vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  date: {
    type: Date,
    default: () => new Date()
  },
  goals: {
    type: Array,
    default: () => []
  },
  getRecord: {
    type: Function,
    required: true
  },
  setRecord: {
    type: Function,
    required: true
  },
  getProgress: {
    type: Function,
    required: true
  },
  getProgressColor: {
    type: Function,
    required: true
  }
})

const emit = defineEmits(['close'])

let adjustTimer = null
let adjustInterval = null

const formattedDate = computed(() => {
  const d = new Date(props.date)
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return `${d.getMonth() + 1}月${d.getDate()}日 ${weekdays[d.getDay()]}`
})

const isToday = computed(() => {
  const today = new Date()
  const d = new Date(props.date)
  return (
    today.getFullYear() === d.getFullYear() &&
    today.getMonth() === d.getMonth() &&
    today.getDate() === d.getDate()
  )
})

const completedCount = computed(() => {
  return props.goals.filter(goal => props.getProgress(goal).isCompleted).length
})

const overallProgress = computed(() => {
  if (props.goals.length === 0) return 0
  return Math.round((completedCount.value / props.goals.length) * 100)
})

function getQuickValues(target) {
  const step = Math.max(1, Math.floor(target / 5))
  return [step, step * 2, step * 5]
}

function quickAdd(goal, amount) {
  const current = props.getRecord(props.date, goal.id)
  props.setRecord(props.date, goal.id, current + amount)
}

function handleSliderInput(event, goal) {
  const value = parseFloat(event.target.value)
  props.setRecord(props.date, goal.id, value)
}

function incrementValue(goal) {
  const current = props.getRecord(props.date, goal.id)
  const step = goal.target > 100 ? 10 : 1
  props.setRecord(props.date, goal.id, current + step)
}

function decrementValue(goal) {
  const current = props.getRecord(props.date, goal.id)
  const step = goal.target > 100 ? 10 : 1
  props.setRecord(props.date, goal.id, Math.max(0, current - step))
}

function startIncrement(goal) {
  incrementValue(goal)
  adjustTimer = setTimeout(() => {
    adjustInterval = setInterval(() => incrementValue(goal), 50)
  }, 300)
}

function startDecrement(goal) {
  decrementValue(goal)
  adjustTimer = setTimeout(() => {
    adjustInterval = setInterval(() => decrementValue(goal), 50)
  }, 300)
}

function stopAdjust() {
  if (adjustTimer) {
    clearTimeout(adjustTimer)
    adjustTimer = null
  }
  if (adjustInterval) {
    clearInterval(adjustInterval)
    adjustInterval = null
  }
}

function handleClose() {
  stopAdjust()
  emit('close')
}

onUnmounted(() => {
  stopAdjust()
})
</script>

<style scoped lang="scss">
.checkin-panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 1000;
}

.checkin-panel {
  width: 100%;
  max-width: 480px;
  max-height: 85vh;
  background: white;
  border-radius: 24px 24px 0 0;
  display: flex;
  flex-direction: column;
  animation: panelSlideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes panelSlideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.checkin-panel--header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 20px 0;
  flex-shrink: 0;
}

.checkin-panel--header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.checkin-panel--date-icon {
  font-size: 20px;
}

.checkin-panel--date {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
}

.checkin-panel--today-badge {
  padding: 2px 8px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  font-size: 11px;
  font-weight: 500;
  border-radius: 10px;
}

.checkin-panel--close-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f1f5f9;
  border: none;
  border-radius: 50%;
  font-size: 20px;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #e2e8f0;
    color: #1e293b;
  }
}

.checkin-panel--goals {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
}

.checkin-panel--goal-item {
  background: #f8fafc;
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 12px;
  border: 2px solid transparent;
  transition: all 0.3s ease;
  
  &.is-completed {
    border-color: #4CAF50;
    background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  }
  
  &:last-child {
    margin-bottom: 0;
  }
}

.checkin-panel--goal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.checkin-panel--goal-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.checkin-panel--goal-emoji {
  font-size: 28px;
}

.checkin-panel--goal-name {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.checkin-panel--input-section {
  background: white;
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 12px;
}

.checkin-panel--input-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 12px;
}

.checkin-panel--control-btn {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  border: none;
  border-radius: 14px;
  font-size: 24px;
  font-weight: 300;
  color: #475569;
  cursor: pointer;
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    transform: scale(1.1);
    background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
  }
  
  &:active {
    transform: scale(0.95);
  }
}

.checkin-panel--value-display {
  display: flex;
  align-items: baseline;
  gap: 4px;
  min-width: 100px;
  justify-content: center;
}

.checkin-panel--current-value {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  transition: transform 0.2s ease;
}

.checkin-panel--unit {
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
}

.checkin-panel--slider-container {
  padding: 0 8px;
}

.checkin-panel--slider {
  width: 100%;
  height: 8px;
  -webkit-appearance: none;
  appearance: none;
  background: linear-gradient(to right, var(--slider-color) var(--slider-percent, 0%), #e2e8f0 var(--slider-percent, 0%));
  border-radius: 4px;
  cursor: pointer;
  outline: none;
  
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 24px;
    height: 24px;
    background: white;
    border: 3px solid var(--slider-color);
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    transition: all 0.2s ease;
    
    &:hover {
      transform: scale(1.15);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }
    
    &:active {
      transform: scale(1);
    }
  }
  
  &::-moz-range-thumb {
    width: 24px;
    height: 24px;
    background: white;
    border: 3px solid var(--slider-color);
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }
}

.checkin-panel--slider-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 6px;
  font-size: 11px;
  color: #94a3b8;
}

.checkin-panel--slider-target {
  color: #6366f1;
  font-weight: 500;
}

.checkin-panel--quick-add {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.checkin-panel--quick-btn {
  flex: 1;
  padding: 8px 12px;
  background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  color: #4f46e5;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(79, 70, 229, 0.2);
  }
  
  &:active {
    transform: translateY(0);
  }
}

.checkin-panel--footer {
  padding: 16px 20px 24px;
  flex-shrink: 0;
  background: linear-gradient(180deg, transparent 0%, rgba(248, 250, 252, 0.9) 100%);
}

.checkin-panel--overall-progress {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.checkin-panel--overall-bar {
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}

.checkin-panel--overall-fill {
  height: 100%;
  background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 50%, #4CAF50 100%);
  border-radius: 4px;
  transition: width 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.checkin-panel--overall-text {
  text-align: center;
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
}

.checkin-panel--empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  gap: 12px;
}

.checkin-panel--empty-icon {
  font-size: 48px;
}

.checkin-panel--empty-title {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
}

.checkin-panel--empty-desc {
  font-size: 14px;
  color: #64748b;
  text-align: center;
}

.panel-enter-active,
.panel-leave-active {
  transition: all 0.3s ease;
}

.panel-enter-from,
.panel-leave-to {
  opacity: 0;
}

.panel-enter-from .checkin-panel,
.panel-leave-to .checkin-panel {
  transform: translateY(100%);
}
</style>
