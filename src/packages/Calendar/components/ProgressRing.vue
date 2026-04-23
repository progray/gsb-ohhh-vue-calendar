<template>
  <div class="progress-ring" :style="{ width: size + 'px', height: size + 'px' }">
    <svg class="progress-ring--svg" :viewBox="`0 0 ${svgSize} ${svgSize}`">
      <circle
        class="progress-ring--circle-bg"
        :stroke="bgColor"
        :stroke-width="strokeWidth"
        :cx="center"
        :cy="center"
        :r="radius"
      />
      <circle
        class="progress-ring--circle-progress"
        :class="{ 'is-animated': animated }"
        :stroke="progressColor"
        :stroke-width="strokeWidth"
        :stroke-linecap="strokeLinecap"
        :cx="center"
        :cy="center"
        :r="radius"
        :style="circleStyle"
      />
    </svg>
    <div v-if="showText" class="progress-ring--text">
      <span class="progress-ring--percentage">{{ displayPercentage }}%</span>
      <span v-if="showDetails" class="progress-ring--details">{{ currentValue }}/{{ targetValue }}</span>
    </div>
    <div v-if="showEmoji && emoji" class="progress-ring--emoji">{{ emoji }}</div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  percentage: {
    type: Number,
    default: 0
  },
  size: {
    type: Number,
    default: 80
  },
  strokeWidth: {
    type: Number,
    default: 6
  },
  bgColor: {
    type: String,
    default: '#e0e0e0'
  },
  progressColor: {
    type: String,
    default: '#4CAF50'
  },
  strokeLinecap: {
    type: String,
    default: 'round'
  },
  animated: {
    type: Boolean,
    default: true
  },
  showText: {
    type: Boolean,
    default: true
  },
  showDetails: {
    type: Boolean,
    default: false
  },
  currentValue: {
    type: [Number, String],
    default: 0
  },
  targetValue: {
    type: [Number, String],
    default: 0
  },
  showEmoji: {
    type: Boolean,
    default: false
  },
  emoji: {
    type: String,
    default: ''
  }
})

const svgSize = computed(() => props.size)
const center = computed(() => props.size / 2)
const radius = computed(() => (props.size - props.strokeWidth) / 2)
const circumference = computed(() => 2 * Math.PI * radius.value)

const displayPercentage = computed(() => Math.round(props.percentage))

const circleStyle = computed(() => {
  const offset = circumference.value - (props.percentage / 100) * circumference.value
  return {
    strokeDasharray: circumference.value,
    strokeDashoffset: offset
  }
})
</script>

<style scoped lang="scss">
.progress-ring {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.progress-ring--svg {
  transform: rotate(-90deg);
}

.progress-ring--circle-bg {
  fill: none;
}

.progress-ring--circle-progress {
  fill: none;
  transition: stroke-dashoffset 0.5s ease-out, stroke 0.3s ease;
}

.progress-ring--text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.progress-ring--percentage {
  font-size: 12px;
  font-weight: 600;
  color: #303133;
}

.progress-ring--details {
  font-size: 8px;
  color: #909399;
  margin-top: 2px;
}

.progress-ring--emoji {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 18px;
}
</style>
