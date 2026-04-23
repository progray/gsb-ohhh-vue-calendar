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
                :class="{ 'is-active': currentPreset === key && !isCustomMode }"
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
                    >
                      {{ i }}
                    </div>
                  </div>
                </div>
                <div class="ohhh-theme-panel--preset-info">
                  <span class="ohhh-theme-panel--preset-name">{{ theme.name }}</span>
                  <span class="ohhh-theme-panel--preset-desc">{{ theme.description }}</span>
                </div>
                <div v-if="currentPreset === key && !isCustomMode" class="ohhh-theme-panel--preset-check">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div class="ohhh-theme-panel--divider"></div>

          <div class="ohhh-theme-panel--custom">
            <h4>自定义主题
              <span v-if="isCustomMode" class="ohhh-theme-panel--custom-active">（自定义模式）</span>
            </h4>
            <div class="ohhh-theme-panel--custom-grid">
              <div class="ohhh-theme-panel--color-item">
                <label>背景色</label>
                <div class="ohhh-theme-panel--color-input-wrapper">
                  <input
                    type="color"
                    v-model="tempConfig.background"
                    class="ohhh-theme-panel--color-picker"
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
                  />
                  <input
                    type="text"
                    v-model="tempConfig.todayMarker"
                    class="ohhh-theme-panel--color-text"
                  />
                </div>
              </div>

              <div class="ohhh-theme-panel--select-item">
                <label>阴影强度</label>
                <select v-model="tempConfig.shadow" class="ohhh-theme-panel--select">
                  <option v-for="option in shadowOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </option>
                </select>
              </div>

              <div class="ohhh-theme-panel--select-item">
                <label>字体</label>
                <select v-model="tempConfig.font" class="ohhh-theme-panel--select">
                  <option v-for="option in fontOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </option>
                </select>
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

const emit = defineEmits(['close', 'select-preset', 'update-config', 'preview', 'apply', 'cancel-preview'])

const tempConfig = ref({ ...props.customConfig })

const isCustomMode = computed(() => props.currentPreset === 'custom')

watch(() => props.customConfig, (newVal) => {
  tempConfig.value = { ...newVal }
}, { deep: true })

watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    tempConfig.value = { ...props.customConfig }
  }
})

function getThumbnailStyle(config) {
  return {
    backgroundColor: config.background
  }
}

function handlePresetClick(presetKey) {
  emit('select-preset', presetKey)
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
  emit('update-config', { ...tempConfig.value })
  emit('apply')
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
  width: 480px;
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
  color: inherit;
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
  color: inherit;
}

.ohhh-theme-panel--thumbnail-day.is-today {
  background: rgba(245, 108, 108, 0.2);
  color: #f56c6c;
}

.ohhh-theme-panel--thumbnail-day.is-selected {
  background: #409eff;
  color: #fff;
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
  display: flex;
  align-items: center;
  gap: 8px;
}

.ohhh-theme-panel--custom-active {
  font-size: 12px;
  color: #409eff;
  font-weight: 500;
}

.ohhh-theme-panel--custom-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.ohhh-theme-panel--color-item,
.ohhh-theme-panel--select-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ohhh-theme-panel--color-item label,
.ohhh-theme-panel--select-item label {
  font-size: 12px;
  color: #909399;
}

.ohhh-theme-panel--color-input-wrapper {
  display: flex;
  gap: 8px;
  align-items: center;
}

.ohhh-theme-panel--color-picker {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  padding: 0;
  background: none;
}

.ohhh-theme-panel--color-picker::-webkit-color-swatch-wrapper {
  padding: 0;
}

.ohhh-theme-panel--color-picker::-webkit-color-swatch {
  border: 1px solid #dcdfe6;
  border-radius: 6px;
}

.ohhh-theme-panel--color-text {
  flex: 1;
  height: 32px;
  padding: 0 8px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  font-size: 12px;
  font-family: monospace;
  outline: none;
  transition: border-color 0.2s;
}

.ohhh-theme-panel--color-text:focus {
  border-color: #409eff;
}

.ohhh-theme-panel--select {
  height: 32px;
  padding: 0 8px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  font-size: 12px;
  outline: none;
  cursor: pointer;
  background: #fff;
  transition: border-color 0.2s;
}

.ohhh-theme-panel--select:focus {
  border-color: #409eff;
}

.ohhh-theme-panel--actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.ohhh-theme-panel--btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
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
}

.ohhh-theme-panel--btn-cancel {
  background: #fff;
  border-color: #dcdfe6;
  color: #606266;
}

.ohhh-theme-panel--btn-cancel:hover {
  border-color: #c0c4cc;
  color: #303133;
}

.ohhh-theme-panel--btn-apply {
  background: #409eff;
  border-color: #409eff;
  color: #fff;
}

.ohhh-theme-panel--btn-apply:hover {
  background: #66b1ff;
  border-color: #66b1ff;
}
</style>
