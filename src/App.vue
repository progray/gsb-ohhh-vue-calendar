<template>
  <div class="app-container">
    <div class="animation-control-panel">
      <div class="panel-header">
        <span class="panel-title">动画控制</span>
        <div class="toggle-wrapper" :class="{ 'is-active': animationEnabled }">
          <div class="toggle-track" @click="toggleAnimationEnabled">
            <div class="toggle-thumb"></div>
          </div>
        </div>
      </div>

      <div class="panel-section">
        <div class="section-label">翻页风格</div>
        <div class="style-selector">
          <button
            class="style-option"
            :class="{ 'is-active': pageAnimationStyle === 'slide' }"
            @click="pageAnimationStyle = 'slide'"
            :disabled="!animationEnabled"
          >
            <svg class="style-icon" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="4" width="18" height="16" rx="2" stroke="currentColor" stroke-width="2"/>
              <path d="M8 8L12 12L8 16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>滑动</span>
          </button>
          <button
            class="style-option"
            :class="{ 'is-active': pageAnimationStyle === 'stack' }"
            @click="pageAnimationStyle = 'stack'"
            :disabled="!animationEnabled"
          >
            <svg class="style-icon" viewBox="0 0 24 24" fill="none">
              <rect x="4" y="8" width="16" height="12" rx="2" stroke="currentColor" stroke-width="2"/>
              <rect x="6" y="4" width="16" height="12" rx="2" stroke="currentColor" stroke-width="2"/>
            </svg>
            <span>堆叠</span>
          </button>
        </div>
      </div>

      <div class="panel-section">
        <div class="section-label">
          <span>动画时长</span>
          <span class="duration-value">{{ formattedDuration }}</span>
        </div>
        <div class="slider-container">
          <input
            type="range"
            min="100"
            max="1000"
            step="50"
            v-model.number="animationDuration"
            class="slider-input"
            :disabled="!animationEnabled"
          />
          <div class="slider-track">
            <div class="slider-fill" :style="{ width: sliderFillPercent }"></div>
          </div>
          <div class="slider-marks">
            <span class="slider-mark" style="left: 0%">快</span>
            <span class="slider-mark" style="left: 50%">中</span>
            <span class="slider-mark" style="left: 100%">慢</span>
          </div>
        </div>
      </div>
    </div>

    <ohhh-vue-calendar
      ref="calendarRef"
      :week-start="1"
      :markerDates
      :animation-enabled="animationEnabled"
      :page-animation-style="pageAnimationStyle"
      :duration="formattedDuration"
      @select-change="onSelectChange"
    />
  </div>
</template>

<script setup>
import { useTemplateRef, ref, computed } from 'vue'
import OhhhVueCalendar from './packages/Calendar/Calendar.vue'
import '/src/packages/Calendar/style/mobile/mobile.scss'

const calendarRef = useTemplateRef('calendarRef')

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

const animationEnabled = ref(true)
const pageAnimationStyle = ref('slide')
const animationDuration = ref(300)

const formattedDuration = computed(() => {
  return `${animationDuration.value / 1000}s`
})

const sliderFillPercent = computed(() => {
  const min = 100
  const max = 1000
  return `${((animationDuration.value - min) / (max - min)) * 100}%`
})

function toggleAnimationEnabled() {
  animationEnabled.value = !animationEnabled.value
}

function onSelectChange(date) {
  console.log(date)
}
</script>

<style lang="scss">
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.app-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.animation-control-panel {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  max-width: 500px;
  margin: 0 auto;
  width: 100%;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.panel-title {
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  letter-spacing: 0.5px;
}

.toggle-wrapper {
  .toggle-track {
    width: 52px;
    height: 28px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 14px;
    position: relative;
    cursor: pointer;
    transition: background 0.3s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    .toggle-thumb {
      width: 22px;
      height: 22px;
      background: #fff;
      border-radius: 50%;
      position: absolute;
      top: 3px;
      left: 3px;
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }
  }

  &.is-active {
    .toggle-track {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

      .toggle-thumb {
        transform: translateX(24px);
      }
    }
  }
}

.panel-section {
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }
}

.section-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 12px;
  font-weight: 500;

  .duration-value {
    font-size: 14px;
    font-weight: 600;
    color: #fff;
    background: rgba(255, 255, 255, 0.15);
    padding: 4px 10px;
    border-radius: 8px;
  }
}

.style-selector {
  display: flex;
  gap: 12px;
}

.style-option {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid transparent;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
  font-weight: 500;

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.2);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &.is-active {
    background: rgba(255, 255, 255, 0.25);
    border-color: rgba(255, 255, 255, 0.4);
    color: #fff;
  }

  .style-icon {
    width: 32px;
    height: 32px;
  }
}

.slider-container {
  position: relative;
  padding: 10px 0;

  .slider-input {
    position: absolute;
    top: 50%;
    left: 0;
    width: 100%;
    height: 4px;
    transform: translateY(-50%);
    opacity: 0;
    cursor: pointer;
    z-index: 10;

    &:disabled {
      cursor: not-allowed;
    }
  }

  .slider-track {
    height: 4px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 2px;
    position: relative;
    pointer-events: none;

    .slider-fill {
      height: 100%;
      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
      border-radius: 2px;
      position: relative;
      transition: width 0.1s ease;

      &::after {
        content: '';
        position: absolute;
        right: -6px;
        top: 50%;
        transform: translateY(-50%);
        width: 16px;
        height: 16px;
        background: #fff;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      }
    }
  }

  .slider-marks {
    display: flex;
    justify-content: space-between;
    margin-top: 8px;
    pointer-events: none;

    .slider-mark {
      font-size: 11px;
      color: rgba(255, 255, 255, 0.5);
      transform: translateX(-50%);
      position: relative;

      &:first-child {
        transform: none;
      }

      &:last-child {
        transform: translateX(-100%);
      }
    }
  }
}
</style>
