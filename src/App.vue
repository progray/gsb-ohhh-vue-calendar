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
.animation-control-panel {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 20px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  max-width: 500px;
  margin: 0 auto 20px;
  width: 100%;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.panel-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.toggle-wrapper {
  .toggle-track {
    width: 48px;
    height: 26px;
    background: #dcdfe6;
    border-radius: 13px;
    position: relative;
    cursor: pointer;
    transition: background 0.3s ease;

    &:hover {
      background: #c0c4cc;
    }

    .toggle-thumb {
      width: 20px;
      height: 20px;
      background: #fff;
      border-radius: 50%;
      position: absolute;
      top: 3px;
      left: 3px;
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
  }

  &.is-active {
    .toggle-track {
      background: #409eff;

      &:hover {
        background: #66b1ff;
      }

      .toggle-thumb {
        transform: translateX(22px);
      }
    }
  }
}

.panel-section {
  margin-bottom: 16px;

  &:last-child {
    margin-bottom: 0;
  }
}

.section-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: #909399;
  margin-bottom: 10px;
  font-weight: 500;

  .duration-value {
    font-size: 13px;
    font-weight: 600;
    color: #409eff;
    background: rgba(64, 158, 255, 0.1);
    padding: 2px 8px;
    border-radius: 4px;
  }
}

.style-selector {
  display: flex;
  gap: 10px;
}

.style-option {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px;
  background: #f5f7fa;
  border: 2px solid transparent;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #909399;
  font-size: 12px;
  font-weight: 500;
  outline: none;

  &:hover:not(:disabled) {
    background: #ecf5ff;
    color: #409eff;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &.is-active {
    background: #ecf5ff;
    border-color: #409eff;
    color: #409eff;
  }

  .style-icon {
    width: 28px;
    height: 28px;
  }
}

.slider-container {
  position: relative;
  padding: 8px 0;

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
    background: #e4e7ed;
    border-radius: 2px;
    position: relative;
    pointer-events: none;

    .slider-fill {
      height: 100%;
      background: #409eff;
      border-radius: 2px;
      position: relative;
      transition: width 0.1s ease;

      &::after {
        content: '';
        position: absolute;
        right: -6px;
        top: 50%;
        transform: translateY(-50%);
        width: 14px;
        height: 14px;
        background: #fff;
        border: 2px solid #409eff;
        border-radius: 50%;
        box-sizing: border-box;
      }
    }
  }

  .slider-marks {
    display: flex;
    justify-content: space-between;
    margin-top: 6px;
    pointer-events: none;

    .slider-mark {
      font-size: 10px;
      color: #c0c4cc;
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
