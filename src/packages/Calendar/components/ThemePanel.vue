<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="isOpen" class="ohhh-theme-panel-overlay" @click="handleOverlayClick">
        <div class="ohhh-theme-panel" @click.stop>
          <div class="ohhh-theme-panel--header">
            <h3>主题设置</h3>
            <button class="ohhh-theme-panel--close" @click="$emit('close')">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          </div>

          <div class="ohhh-theme-panel--presets">
            <h4>预设主题</h4>
            <div class="ohhh-theme-panel--presets-grid">
              <div
                v-for="(theme, key) in presetThemes"
                :key="key"
                class="ohhh-theme-panel--preset-card"
                :class="{ 'is-active': selectedPreset === key }"
                @click="handlePresetClick(key)"
              >
                <div class="ohhh-theme-panel--preset-thumbnail" :style="getThumbnailStyle(theme.config)">
                  <div class="ohhh-theme-panel--thumbnail-weekdays">
                    <span v-for="i in 7" :key="i">日</span>
                  </div>
                  <div class="ohhh-theme-panel--thumbnail-days">
                    <div
                      v-for="i in 14"
                      :key="i"
                      class="ohhh-theme-panel--thumbnail-day"
                      :class="{
                        'is-today': i === 8,
                        'is-selected': i === 10
                      }"
                      :style="getThumbnailDayStyle(theme.config, i)"
                    >
                      {{ i }}
                    </div>
                  </div>
                </div>
                <div class="ohhh-theme-panel--preset-info">
                  <span class="ohhh-theme-panel--preset-name">{{ theme.name }}</span>
                  <span class="ohhh-theme-panel--preset-desc">{{ theme.description }}</span>
                </div>
                <div v-if="selectedPreset === key" class="ohhh-theme-panel--preset-check">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div class="ohhh-theme-panel--divider"></div>

          <div class="ohhh-theme-panel--custom">
            <h4>自定义主题</h4>
            <div class="ohhh-theme-panel--custom-grid">
              <div class="ohhh-theme-panel--color-item">
                <label>背景色</label>
                <div class="ohhh-theme-panel--color-input-wrapper">
                  <input
                    type="color"
                    v-model="tempConfig.background"
                    class="ohhh-theme-panel--color-picker"
                    @input="handleColorChange"
                  />
                  <input
                    type="text"
                    v-model="tempConfig.background"
                    class="ohhh-theme-panel--color-text"
                  />
                </div>
              </div>

              <div class="ohhh-theme-panel--color-item">
                <label>选中色</label>
                <div class="ohhh-theme-panel--color-input-wrapper">
                  <input
                    type="color"
                    v-model="tempConfig.selected"
                    class="ohhh-theme-panel--color-picker"
                    @input="handleColorChange"
                  />
                  <input
                    type="text"
                    v-model="tempConfig.selected"
                    class="ohhh-theme-panel--color-text"
                  />
                </div>
              </div>

              <div class="ohhh-theme-panel--color-item">
                <label>高亮色</label>
                <div class="ohhh-theme-panel--color-input-wrapper">
                  <input
                    type="color"
                    v-model="tempConfig.highlight"
                    class="ohhh-theme-panel--color-picker"
                    @input="handleColorChange"
                  />
                  <input
                    type="text"
                    v-model="tempConfig.highlight"
                    class="ohhh-theme-panel--color-text"
                  />
                </div>
              </div>

              <div class="ohhh-theme-panel--color-item">
                <label>文字色</label>
                <div class="ohhh-theme-panel--color-input-wrapper">
                  <input
                    type="color"
                    v-model="tempConfig.text"
                    class="ohhh-theme-panel--color-picker"
                    @input="handleColorChange"
                  />
                  <input
                    type="text"
                    v-model="tempConfig.text"
                    class="ohhh-theme-panel--color-text"
                  />
                </div>
              </div>

              <div class="ohhh-theme-panel--color-item">
                <label>边框色</label>
                <div class="ohhh-theme-panel--color-input-wrapper">
                  <input
                    type="color"
                    v-model="tempConfig.border"
                    class="ohhh-theme-panel--color-picker"
                    @input="handleColorChange"
                  />
                  <input
                    type="text"
                    v-model="tempConfig.border"
                    class="ohhh-theme-panel--color-text"
                  />
                </div>
              </div>

              <div class="ohhh-theme-panel--color-item">
                <label>今日标记色</label>
                <div class="ohhh-theme-panel--color-input-wrapper">
                  <input
                    type="color"
                    v-model="tempConfig.todayMarker"
                    class="ohhh-theme-panel--color-picker"
                    @input="handleColorChange"
                  />
                  <input
                    type="text"
                    v-model="tempConfig.todayMarker"
                    class="ohhh-theme-panel--color-text"
                  />
                </div>
              </div>

              <div class="ohhh-theme-panel--slider-item">
                <label>
                  阴影强度
                  <span class="ohhh-theme-panel--slider-value">{{ getShadowLabel(tempConfig.shadow) }}</span>
                </label>
                <div class="ohhh-theme-panel--slider-wrapper">
                  <input
                    type="range"
                    :min="0"
                    :max="shadowOptions.length - 1"
                    :step="1"
                    v-model="shadowSliderValue"
                    class="ohhh-theme-panel--slider"
                    @input="handleShadowChange"
                  />
                  <div class="ohhh-theme-panel--slider-labels">
                    <span v-for="option in shadowOptions" :key="option.value" class="ohhh-theme-panel--slider-label">
                      {{ option.label }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="ohhh-theme-panel--select-item">
                <label>字体</label>
                <div class="ohhh-theme-panel--select-wrapper">
                  <select v-model="tempConfig.font" class="ohhh-theme-panel--select" @change="handleFontChange">
                    <option v-for="option in fontOptions" :key="option.value" :value="option.value">
                      {{ option.label }}
                    </option>
                  </select>
                  <div class="ohhh-theme-panel--font-preview" :style="{ fontFamily: getFontFamily(tempConfig.font) }">
                    示例文字 Aa
                  </div>
                </div>
              </div>
            </div>

            <div class="ohhh-theme-panel--actions">
              <button class="ohhh-theme-panel--btn ohhh-theme-panel--btn-preview" @click="handlePreview">
                预览
              </button>
              <button class="ohhh-theme-panel--btn ohhh-theme-panel--btn-cancel" @click="handleCancelPreview">
                取消预览
              </button>
              <button class="ohhh-theme-panel--btn ohhh-theme-panel--btn-apply" @click="handleApply">
                应用主题
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  currentPreset: {
    type: String,
    default: 'light'
  },
  customConfig: {
    type: Object,
    default: () => ({})
  },
  presetThemes: {
    type: Object,
    default: () => ({})
  },
  shadowOptions: {
    type: Array,
    default: () => []
  },
  fontOptions: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close', 'select-preset', 'update-config', 'preview', 'apply', 'cancel-preview', 'apply-preset'])

const selectedPreset = ref(props.currentPreset === 'custom' ? null : props.currentPreset)
const tempConfig = ref({ ...props.customConfig })

const shadowSliderValue = ref(
  props.shadowOptions.findIndex(o => o.value === props.customConfig.shadow)
)

watch(() => props.currentPreset, (newPreset) => {
  if (newPreset === 'custom') {
    selectedPreset.value = null
  } else {
    selectedPreset.value = newPreset
  }
}, { immediate: true })

watch(() => props.customConfig, (newVal) => {
  tempConfig.value = { ...newVal }
  shadowSliderValue.value = props.shadowOptions.findIndex(o => o.value === newVal.shadow)
}, { deep: true })

watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    tempConfig.value = { ...props.customConfig }
    shadowSliderValue.value = props.shadowOptions.findIndex(o => o.value === props.customConfig.shadow)
    if (props.currentPreset === 'custom') {
      selectedPreset.value = null
    } else {
      selectedPreset.value = props.currentPreset
    }
  }
})

function getThumbnailStyle(config) {
  return {
    backgroundColor: config.background,
    color: config.text
  }
}

function getThumbnailDayStyle(config, day) {
  if (day === 8) {
    return {
      backgroundColor: hexToRgba(config.todayMarker, 0.2),
      color: config.todayMarker
    }
  }
  if (day === 10) {
    return {
      backgroundColor: config.selected,
      color: getContrastColor(config.selected)
    }
  }
  return {}
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function getContrastColor(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  return brightness > 128 ? '#000000' : '#ffffff'
}

function getShadowLabel(value) {
  const option = props.shadowOptions.find(o => o.value === value)
  return option ? option.label : ''
}

function getFontFamily(value) {
  const option = props.fontOptions.find(o => o.value === value)
  return option ? option.fontFamily : ''
}

function handlePresetClick(presetKey) {
  selectedPreset.value = presetKey
  const theme = props.presetThemes[presetKey]
  if (theme) {
    tempConfig.value = { ...theme.config }
    shadowSliderValue.value = props.shadowOptions.findIndex(o => o.value === theme.config.shadow)
  }
}

function handleShadowChange() {
  const index = parseInt(shadowSliderValue.value)
  if (props.shadowOptions[index]) {
    tempConfig.value.shadow = props.shadowOptions[index].value
    selectedPreset.value = null
  }
}

function handleFontChange() {
  selectedPreset.value = null
}

function handleColorChange() {
  selectedPreset.value = null
}

function handleOverlayClick() {
  emit('close')
}

function handlePreview() {
  emit('preview', { ...tempConfig.value })
}

function handleCancelPreview() {
  emit('cancel-preview')
}

function handleApply() {
  if (selectedPreset.value && props.presetThemes[selectedPreset.value]) {
    emit('apply-preset', selectedPreset.value)
  } else {
    emit('update-config', { ...tempConfig.value })
    emit('apply')
  }
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.ohhh-theme-panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.ohhh-theme-panel {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  width: 520px;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.ohhh-theme-panel--header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
}

.ohhh-theme-panel--header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.ohhh-theme-panel--close {
  background: none;
  border: none;
  cursor: pointer;
  color: #909399;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}

.ohhh-theme-panel--close:hover {
  color: #606266;
}

.ohhh-theme-panel--presets {
  padding: 16px 20px;
}

.ohhh-theme-panel--presets h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #606266;
}

.ohhh-theme-panel--presets-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.ohhh-theme-panel--preset-card {
  position: relative;
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  padding: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.ohhh-theme-panel--preset-card:hover {
  border-color: #409eff;
  transform: translateY(-2px);
}

.ohhh-theme-panel--preset-card.is-active {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.ohhh-theme-panel--preset-thumbnail {
  border-radius: 6px;
  padding: 6px;
  margin-bottom: 8px;
  transition: all 0.3s ease;
}

.ohhh-theme-panel--thumbnail-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  margin-bottom: 4px;
}

.ohhh-theme-panel--thumbnail-weekdays span {
  font-size: 6px;
  text-align: center;
  opacity: 0.7;
}

.ohhh-theme-panel--thumbnail-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.ohhh-theme-panel--thumbnail-day {
  font-size: 6px;
  text-align: center;
  padding: 2px 0;
  border-radius: 50%;
  transition: all 0.2s;
}

.ohhh-theme-panel--preset-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ohhh-theme-panel--preset-name {
  font-size: 12px;
  font-weight: 600;
  color: #303133;
}

.ohhh-theme-panel--preset-desc {
  font-size: 10px;
  color: #909399;
  line-height: 1.3;
}

.ohhh-theme-panel--preset-check {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  background: #409eff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.ohhh-theme-panel--divider {
  height: 1px;
  background: #eee;
  margin: 0 20px;
}

.ohhh-theme-panel--custom {
  padding: 16px 20px;
}

.ohhh-theme-panel--custom h4 {
  margin: 0 0 16px 0;
  font-size: 14px;
  font-weight: 600;
  color: #606266;
}

.ohhh-theme-panel--custom-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.ohhh-theme-panel--color-item,
.ohhh-theme-panel--select-item,
.ohhh-theme-panel--slider-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ohhh-theme-panel--color-item label,
.ohhh-theme-panel--select-item label,
.ohhh-theme-panel--slider-item label {
  font-size: 13px;
  color: #606266;
  font-weight: 500;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ohhh-theme-panel--slider-value {
  font-size: 12px;
  color: #409eff;
  font-weight: 600;
}

.ohhh-theme-panel--color-input-wrapper {
  display: flex;
  gap: 10px;
  align-items: center;
}

.ohhh-theme-panel--color-picker {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  padding: 0;
  background: none;
  flex-shrink: 0;
}

.ohhh-theme-panel--color-picker::-webkit-color-swatch-wrapper {
  padding: 2px;
}

.ohhh-theme-panel--color-picker::-webkit-color-swatch {
  border: 2px solid #e4e7ed;
  border-radius: 6px;
}

.ohhh-theme-panel--color-picker:hover::-webkit-color-swatch {
  border-color: #409eff;
}

.ohhh-theme-panel--color-text {
  flex: 1;
  height: 36px;
  padding: 0 12px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  font-size: 13px;
  font-family: 'Consolas', 'Monaco', monospace;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.ohhh-theme-panel--color-text:focus {
  border-color: #409eff;
  box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.1);
}

.ohhh-theme-panel--slider-wrapper {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ohhh-theme-panel--slider {
  width: 100%;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: linear-gradient(to right, #e4e7ed, #409eff);
  border-radius: 3px;
  outline: none;
  cursor: pointer;
}

.ohhh-theme-panel--slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  background: #fff;
  border: 2px solid #409eff;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(64, 158, 255, 0.3);
  transition: transform 0.2s, box-shadow 0.2s;
}

.ohhh-theme-panel--slider::-webkit-slider-thumb:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 10px rgba(64, 158, 255, 0.4);
}

.ohhh-theme-panel--slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  background: #fff;
  border: 2px solid #409eff;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(64, 158, 255, 0.3);
}

.ohhh-theme-panel--slider-labels {
  display: flex;
  justify-content: space-between;
  padding: 0 2px;
}

.ohhh-theme-panel--slider-label {
  font-size: 11px;
  color: #909399;
}

.ohhh-theme-panel--select-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ohhh-theme-panel--select {
  height: 36px;
  padding: 0 12px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  font-size: 13px;
  outline: none;
  cursor: pointer;
  background: #fff;
  transition: border-color 0.2s, box-shadow 0.2s;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23909399' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 36px;
}

.ohhh-theme-panel--select:focus {
  border-color: #409eff;
  box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.1);
}

.ohhh-theme-panel--select:hover {
  border-color: #c0c4cc;
}

.ohhh-theme-panel--font-preview {
  padding: 10px 14px;
  background: #f5f7fa;
  border-radius: 8px;
  font-size: 14px;
  color: #303133;
  text-align: center;
  border: 1px dashed #dcdfe6;
}

.ohhh-theme-panel--actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.ohhh-theme-panel--btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid;
}

.ohhh-theme-panel--btn-preview {
  background: #f4f4f5;
  border-color: #e4e7ed;
  color: #606266;
}

.ohhh-theme-panel--btn-preview:hover {
  background: #e4e7ed;
  border-color: #dcdfe6;
  color: #303133;
}

.ohhh-theme-panel--btn-cancel {
  background: #fff;
  border-color: #dcdfe6;
  color: #606266;
}

.ohhh-theme-panel--btn-cancel:hover {
  border-color: #c0c4cc;
  color: #303133;
  background: #f5f7fa;
}

.ohhh-theme-panel--btn-apply {
  background: linear-gradient(135deg, #409eff, #66b1ff);
  border-color: #409eff;
  color: #fff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.ohhh-theme-panel--btn-apply:hover {
  background: linear-gradient(135deg, #66b1ff, #409eff);
  border-color: #66b1ff;
  box-shadow: 0 6px 16px rgba(64, 158, 255, 0.4);
  transform: translateY(-1px);
}

.ohhh-theme-panel--btn-apply:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
}
</style>
