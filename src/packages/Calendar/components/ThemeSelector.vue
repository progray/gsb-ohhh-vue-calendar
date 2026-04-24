<template>
  <div class="theme-selector-wrapper">
    <div
      class="theme-selector-trigger"
      :class="{ 'is-open': isOpen }"
      @click="toggleSelector"
    >
      <div class="theme-selector-thumbnail">
        <div
          v-for="(hue, index) in currentTheme.ribbonHues.slice(0, 4)"
          :key="index"
          class="theme-ribbon-bar"
          :style="getRibbonStyle(hue, index)"
        />
      </div>
      <span class="theme-selector-name">{{ currentTheme.name }}</span>
    </div>

    <Transition name="fade">
      <div
        v-if="isOpen"
        class="theme-selector-dropdown"
        ref="dropdownRef"
      >
        <div
          v-for="theme in themes"
          :key="theme.id"
          class="theme-selector-item"
          :class="{ 'is-selected': theme.id === currentTheme.id }"
          @click="selectTheme(theme)"
        >
          <div class="theme-item-thumbnail">
            <div
              v-for="(hue, index) in theme.ribbonHues.slice(0, 4)"
              :key="index"
              class="theme-ribbon-bar"
              :style="getRibbonStyleForTheme(theme, hue, index)"
            />
          </div>
          <span class="theme-item-name">{{ theme.name }}</span>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { hslToCss } from '../themes/index.js'

const props = defineProps({
  currentTheme: {
    type: Object,
    required: true
  },
  themes: {
    type: Array,
    required: true
  },
  isOpen: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['toggle', 'select'])

function toggleSelector() {
  emit('toggle')
}

function selectTheme(theme) {
  emit('select', theme.id)
}

function getRibbonStyle(hue, index) {
  return {
    backgroundColor: hslToCss(
      hue,
      props.currentTheme.saturation,
      props.currentTheme.lightness
    )
  }
}

function getRibbonStyleForTheme(theme, hue, index) {
  return {
    backgroundColor: hslToCss(hue, theme.saturation, theme.lightness)
  }
}
</script>

<style scoped>
.theme-selector-wrapper {
  position: relative;
}

.theme-selector-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.theme-selector-trigger:hover {
  background: rgba(0, 0, 0, 0.05);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.theme-selector-trigger.is-open {
  background: rgba(0, 0, 0, 0.08);
}

.theme-selector-thumbnail {
  display: flex;
  flex-direction: column;
  width: 32px;
  height: 16px;
  border-radius: 4px;
  overflow: hidden;
}

.theme-item-thumbnail {
  display: flex;
  flex-direction: column;
  width: 40px;
  height: 20px;
  border-radius: 4px;
  overflow: hidden;
}

.theme-ribbon-bar {
  flex: 1;
}

.theme-selector-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--theme-text-primary);
}

.theme-selector-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  padding: 8px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(0, 0, 0, 0.05);
  min-width: 160px;
  z-index: 1000;
}

.theme-selector-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.theme-selector-item:hover {
  background: rgba(0, 0, 0, 0.05);
}

.theme-selector-item.is-selected {
  background: rgba(0, 0, 0, 0.1);
}

.theme-item-name {
  font-size: 14px;
  color: var(--theme-text-primary);
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
