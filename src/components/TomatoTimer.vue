<template>
  <div v-if="showTimer" class="tomato-timer-overlay" @click.self="closeTimer">
    <div class="tomato-timer-modal">
      <div class="tomato-timer-header">
        <span class="tomato-icon">🍅</span>
        <h3>番茄计时器</h3>
        <button class="close-btn" @click="closeTimer">&times;</button>
      </div>
      
      <div class="tomato-timer-body">
        <div class="target-date">
          目标日期：{{ formattedDate }}
        </div>
        
        <div class="timer-display">
          <div class="timer-circle" :style="{ '--progress': timerProgress }">
            <div class="timer-text">{{ formattedTime }}</div>
          </div>
        </div>
        
        <div class="timer-controls">
          <button 
            v-if="!isRunning && !isFinished" 
            class="control-btn start-btn" 
            @click="startTimer"
          >
            开始专注
          </button>
          <button 
            v-if="isRunning" 
            class="control-btn pause-btn" 
            @click="pauseTimer"
          >
            暂停
          </button>
          <button 
            v-if="isPaused" 
            class="control-btn resume-btn" 
            @click="resumeTimer"
          >
            继续
          </button>
          <button 
            v-if="!isFinished" 
            class="control-btn reset-btn" 
            @click="resetTimer"
          >
            重置
          </button>
          <button 
            v-if="isFinished" 
            class="control-btn done-btn" 
            @click="completeTomato"
          >
            完成！获得一颗番茄 🍅
          </button>
        </div>
        
        <div v-if="isFinished" class="timer-complete">
          <div class="complete-message">
            🎉 恭喜！您已完成25分钟专注！
          </div>
          <div class="complete-hint">
            点击上方按钮，为 {{ formattedDate }} 记录一颗番茄
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { addTomatoForDate } from '../utils/tomatoData.js'

const props = defineProps({
  showTimer: {
    type: Boolean,
    default: false
  },
  targetDate: {
    type: Date,
    default: () => new Date()
  }
})

const emit = defineEmits(['close', 'complete'])

const DURATION = 25 * 60
const remainingSeconds = ref(DURATION)
const isRunning = ref(false)
const isPaused = ref(false)
const isFinished = ref(false)
let timerInterval = null

const formattedDate = computed(() => {
  const year = props.targetDate.getFullYear()
  const month = props.targetDate.getMonth() + 1
  const day = props.targetDate.getDate()
  return `${year}年${month}月${day}日`
})

const formattedTime = computed(() => {
  const minutes = Math.floor(remainingSeconds.value / 60)
  const seconds = remainingSeconds.value % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
})

const timerProgress = computed(() => {
  const progress = ((DURATION - remainingSeconds.value) / DURATION) * 100
  return `${progress}%`
})

function startTimer() {
  if (isFinished.value) return
  isRunning.value = true
  isPaused.value = false
  
  timerInterval = setInterval(() => {
    remainingSeconds.value--
    if (remainingSeconds.value <= 0) {
      stopTimer()
      isFinished.value = true
    }
  }, 1000)
}

function pauseTimer() {
  isRunning.value = false
  isPaused.value = true
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

function resumeTimer() {
  startTimer()
}

function resetTimer() {
  stopTimer()
  remainingSeconds.value = DURATION
  isRunning.value = false
  isPaused.value = false
  isFinished.value = false
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

function closeTimer() {
  if (isRunning.value) {
    if (confirm('计时正在进行中，确定要关闭吗？')) {
      stopTimer()
      emit('close')
    }
  } else {
    emit('close')
  }
}

function completeTomato() {
  addTomatoForDate(props.targetDate)
  emit('complete', props.targetDate)
  emit('close')
}

watch(() => props.showTimer, (newVal) => {
  if (!newVal) {
    stopTimer()
  } else {
    resetTimer()
  }
})

onUnmounted(() => {
  stopTimer()
})
</script>

<style scoped>
.tomato-timer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.tomato-timer-modal {
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.tomato-timer-header {
  background: linear-gradient(135deg, #ff6b6b, #ff8e8e);
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
}

.tomato-icon {
  font-size: 32px;
}

.tomato-timer-header h3 {
  margin: 0;
  color: white;
  font-size: 20px;
  font-weight: 600;
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  font-size: 28px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.3s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.tomato-timer-body {
  padding: 30px;
}

.target-date {
  text-align: center;
  color: #666;
  font-size: 14px;
  margin-bottom: 20px;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 8px;
}

.timer-display {
  display: flex;
  justify-content: center;
  margin-bottom: 30px;
}

.timer-circle {
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: conic-gradient(
    #ff6b6b var(--progress),
    #f0f0f0 var(--progress)
  );
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 15px rgba(255, 107, 107, 0.2);
}

.timer-circle::before {
  content: '';
  width: 170px;
  height: 170px;
  border-radius: 50%;
  background: white;
  position: absolute;
}

.timer-text {
  position: relative;
  font-size: 48px;
  font-weight: bold;
  color: #333;
  font-family: 'Courier New', monospace;
}

.timer-controls {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
}

.control-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 25px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  min-width: 120px;
}

.start-btn, .done-btn {
  background: linear-gradient(135deg, #ff6b6b, #ff8e8e);
  color: white;
}

.start-btn:hover, .done-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(255, 107, 107, 0.4);
}

.pause-btn {
  background: #ffa726;
  color: white;
}

.pause-btn:hover {
  background: #ff9100;
}

.resume-btn {
  background: #66bb6a;
  color: white;
}

.resume-btn:hover {
  background: #4caf50;
}

.reset-btn {
  background: #f0f0f0;
  color: #666;
}

.reset-btn:hover {
  background: #e0e0e0;
}

.timer-complete {
  margin-top: 25px;
  text-align: center;
}

.complete-message {
  font-size: 18px;
  font-weight: 600;
  color: #4caf50;
  margin-bottom: 10px;
}

.complete-hint {
  font-size: 13px;
  color: #888;
}
</style>
