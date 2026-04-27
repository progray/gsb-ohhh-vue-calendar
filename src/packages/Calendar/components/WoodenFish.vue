<template>
  <div class="wooden-fish-wrapper">
    <div
      class="wooden-fish-icon"
      :class="{ 'is-animating': isAnimating }"
      @click="handleClick"
    >
      <div class="wooden-fish-body">
        <div class="wooden-fish-eyes">
          <div class="wooden-fish-eye"></div>
          <div class="wooden-fish-eye"></div>
        </div>
        <div class="wooden-fish-mouth"></div>
      </div>
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
import { ref } from 'vue'

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
  transition: transform 0.15s ease;
  cursor: pointer;
}

.wooden-fish-icon.is-animating {
  transform: scale(1.4);
}

.wooden-fish-body {
  position: relative;
  width: 100%;
  height: 100%;
  background: #8B4513;
  border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
  clip-path: ellipse(50% 45% at 50% 45%);
}

.wooden-fish-eyes {
  position: absolute;
  top: 30%;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 6px;
}

.wooden-fish-eye {
  width: 3px;
  height: 3px;
  background: #3D2314;
  border-radius: 50%;
}

.wooden-fish-mouth {
  position: absolute;
  top: 58%;
  left: 55%;
  transform: translateX(-50%);
  width: 10px;
  height: 4px;
  border: none;
  border-bottom: 2px solid #3D2314;
  border-radius: 0 0 10px 10px;
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
