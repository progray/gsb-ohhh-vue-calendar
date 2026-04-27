<template>
  <Teleport to="body">
    <div v-if="visible" class="time-capsule-countdown-overlay" @click="handleOverlayClick">
      <div class="time-capsule-countdown" @click.stop>
        <div class="time-capsule-countdown-header">
          <div class="time-capsule-countdown-icon">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
              <rect x="8" y="24" width="48" height="32" rx="4" fill="#8B5CF6" />
              <rect x="16" y="24" width="32" height="8" rx="2" fill="#A78BFA" />
              <path d="M24 24V16C24 11.5817 27.5817 8 32 8C36.4183 8 40 11.5817 40 16V24" stroke="#F59E0B" stroke-width="3" stroke-linecap="round" />
              <circle cx="32" cy="36" r="4" fill="#FCD34D" />
              <path d="M32 32V40" stroke="#F59E0B" stroke-width="2" stroke-linecap="round" />
              <path d="M28 36H36" stroke="#F59E0B" stroke-width="2" stroke-linecap="round" />
            </svg>
          </div>
          <h3 class="time-capsule-countdown-title">🔒 时光胶囊已锁定</h3>
          <p class="time-capsule-countdown-subtitle">距离解封还有</p>
        </div>
        
        <div class="time-capsule-countdown-body">
          <div class="time-capsule-countdown-display">
            <div class="time-capsule-countdown-item">
              <div class="time-capsule-countdown-value">{{ timeLeft.days }}</div>
              <div class="time-capsule-countdown-label">天</div>
            </div>
            <div class="time-capsule-countdown-separator">:</div>
            <div class="time-capsule-countdown-item">
              <div class="time-capsule-countdown-value">{{ timeLeft.hours.toString().padStart(2, '0') }}</div>
              <div class="time-capsule-countdown-label">时</div>
            </div>
            <div class="time-capsule-countdown-separator">:</div>
            <div class="time-capsule-countdown-item">
              <div class="time-capsule-countdown-value">{{ timeLeft.minutes.toString().padStart(2, '0') }}</div>
              <div class="time-capsule-countdown-label">分</div>
            </div>
            <div class="time-capsule-countdown-separator">:</div>
            <div class="time-capsule-countdown-item">
              <div class="time-capsule-countdown-value">{{ timeLeft.seconds.toString().padStart(2, '0') }}</div>
              <div class="time-capsule-countdown-label">秒</div>
            </div>
          </div>
          
          <div class="time-capsule-countdown-info">
            <div class="time-capsule-countdown-date">
              <span>解封日期：</span>
              <span class="time-capsule-countdown-date-value">{{ formattedDate }}</span>
            </div>
            <div class="time-capsule-countdown-hint">
              🔮 耐心等待，时光会给你惊喜
            </div>
          </div>
        </div>
        
        <div class="time-capsule-countdown-footer">
          <button
            class="time-capsule-btn time-capsule-btn-primary"
            @click="handleClose"
          >
            知道了
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { calculateTimeLeft, formatDateKey } from '../utils/timeCapsule.js'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  date: {
    type: Date,
    default: null
  }
})

const emit = defineEmits(['close'])

const timeLeft = ref({
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
  total: 0
})

let timer = null

const formattedDate = computed(() => {
  if (!props.date) return ''
  return `${props.date.getFullYear()}年${props.date.getMonth() + 1}月${props.date.getDate()}日`
})

function updateTimeLeft() {
  console.log('TimeCapsuleCountdown: updateTimeLeft called')
  console.log('  props.date =', props.date)
  
  if (props.date) {
    timeLeft.value = calculateTimeLeft(props.date)
    console.log('  timeLeft =', timeLeft.value)
    
    if (timeLeft.value.total <= 0) {
      clearTimer()
      emit('close')
    }
  }
}

function startTimer() {
  if (timer) return
  updateTimeLeft()
  timer = setInterval(() => {
    updateTimeLeft()
  }, 1000)
}

function clearTimer() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

function handleClose() {
  emit('close')
}

function handleOverlayClick() {
  handleClose()
}

onMounted(() => {
  console.log('TimeCapsuleCountdown: onMounted')
  if (props.visible) {
    updateTimeLeft()
    startTimer()
  }
})

onUnmounted(() => {
  console.log('TimeCapsuleCountdown: onUnmounted')
  clearTimer()
})

watch(
  () => props.visible,
  (newVisible) => {
    console.log('TimeCapsuleCountdown: visible changed to', newVisible)
    if (newVisible) {
      updateTimeLeft()
      startTimer()
    } else {
      clearTimer()
    }
  }
)

watch(
  () => props.date,
  (newDate, oldDate) => {
    console.log('TimeCapsuleCountdown: date changed', oldDate, '->', newDate)
    if (props.visible) {
      updateTimeLeft()
    }
  }
)
</script>
