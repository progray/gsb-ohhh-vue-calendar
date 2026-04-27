<template>
  <div class="wooden-fish-wrapper">
    <div
      class="wooden-fish-icon"
      :class="{ 'is-animating': isAnimating }"
      @click="handleClick"
    >
      <svg viewBox="0 0 24 24" width="100%" height="100%">
        <ellipse cx="12" cy="14" rx="9" ry="7" fill="#8B4513" stroke="#5D3A1A" stroke-width="1" />
        <ellipse cx="12" cy="14" rx="6" ry="4.5" fill="#A0522D" />
        <ellipse cx="12" cy="14" rx="3" ry="2" fill="#D2691E" opacity="0.6" />
        <circle cx="8" cy="12" r="1.5" fill="#3D2314" />
        <circle cx="16" cy="12" r="1.5" fill="#3D2314" />
        <path d="M9 16 Q12 18 15 16" stroke="#3D2314" stroke-width="1" fill="none" />
        <ellipse cx="12" cy="5" rx="2.5" ry="1.8" fill="#8B4513" stroke="#5D3A1A" stroke-width="0.5" />
        <rect x="11" y="3" width="2" height="3" fill="#8B4513" rx="0.5" />
      </svg>
    </div>
    <transition name="merit-pop">
      <div
        v-if="showMeritText"
        class="merit-plus-text"
        :style="textPosition"
      >
        功德 +1
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  isAnimating: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['click'])

const showMeritText = ref(false)
const textPosition = ref({ left: '50%', top: '50%' })

function handleClick(e) {
  e.stopPropagation()
  const rect = e.currentTarget.getBoundingClientRect()
  const parentRect = e.currentTarget.parentElement.parentElement.getBoundingClientRect()
  textPosition.value = {
    left: (rect.left + rect.width / 2 - parentRect.left) + 'px',
    top: (rect.top - parentRect.top) + 'px'
  }
  showMeritText.value = true
  setTimeout(() => {
    showMeritText.value = false
  }, 1000)
  emit('click')
}
</script>

<style scoped>
.wooden-fish-wrapper {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 18px;
  height: 18px;
  z-index: 10;
}

.wooden-fish-icon {
  width: 100%;
  height: 100%;
  opacity: 0.4;
  transition: opacity 0.3s ease, transform 0.15s ease;
  cursor: pointer;
}

.wooden-fish-icon:hover {
  opacity: 0.8;
}

.wooden-fish-icon.is-animating {
  transform: scale(1.4);
}

.merit-plus-text {
  position: absolute;
  transform: translateX(-50%);
  font-size: 12px;
  font-weight: 600;
  color: #FFD700;
  text-shadow: 0 0 4px rgba(255, 215, 0, 0.8), 0 0 8px rgba(255, 165, 0, 0.6);
  pointer-events: none;
  white-space: nowrap;
  z-index: 100;
}

.merit-pop-enter-active {
  animation: meritFloatUp 1s ease-out forwards;
}

@keyframes meritFloatUp {
  0% {
    opacity: 1;
    transform: translateX(-50%) translateY(0) scale(1);
  }
  50% {
    opacity: 1;
    transform: translateX(-50%) translateY(-20px) scale(1.2);
  }
  100% {
    opacity: 0;
    transform: translateX(-50%) translateY(-40px) scale(0.8);
  }
}
</style>
