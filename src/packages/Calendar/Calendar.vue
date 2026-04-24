<template>
  <div
    ref="containerRef"
    class="ohhh-calendar-container"
    :class="{ 'ohhh-calendar--glass': enableGlassEffect }"
    :style="containerStyle"
    @mousemove="onMouseMove"
    @mouseleave="onMouseLeave"
  >
    <div v-if="enableBackground" class="ohhh-calendar-background" :style="backgroundStyle">
      <div class="ohhh-calendar-background--layer" :style="backgroundStyle"></div>
    </div>

    <div v-if="enableBackground" class="ohhh-calendar-glass-glow" :style="{ '--glow-color': glowColor }"></div>

    <div v-if="showSettingsBar && enableBackground" class="ohhh-calendar-settings-bar">
      <button class="ohhh-calendar-settings-bar--toggle" @click="isSettingsExpanded = !isSettingsExpanded">
        <span class="ohhh-calendar-settings-bar--icon" :class="{ 'is-expanded': isSettingsExpanded }">⚙</span>
        <span class="ohhh-calendar-settings-bar--label">{{ isSettingsExpanded ? '收起' : '背景设置' }}</span>
      </button>

      <div class="ohhh-calendar-settings-bar--quick">
        <div
          v-for="preset in quickPresets"
          :key="preset.id"
          class="ohhh-calendar-settings-bar--preset"
          :class="{ 'is-active': selectedPreset === preset.id && backgroundType === 'preset' }"
          :style="{ background: preset.value }"
          @click="onPresetClick(preset.id)"
          :title="preset.name"
        ></div>
        <label class="ohhh-calendar-settings-bar--upload" :class="{ 'is-active': backgroundType === 'custom' }" title="上传自定义背景">
          <input type="file" accept="image/*" @change="onImageUpload" style="display: none" />
          <span v-if="!hasCustomImage" class="ohhh-calendar-settings-bar--upload-icon">📷</span>
          <span v-else class="ohhh-calendar-settings-bar--upload-preview" :style="{ backgroundImage: `url(${customImage})` }"></span>
        </label>
      </div>

      <button class="ohhh-calendar-settings-bar--screenshot" @click="onScreenshotClick" :disabled="isTakingScreenshot" title="截图并复制到剪贴板">
        {{ isTakingScreenshot ? '...' : '📷' }}
      </button>
    </div>

    <transition name="settings-expand">
      <div v-if="showSettingsBar && enableBackground && isSettingsExpanded" class="ohhh-calendar-settings-panel">
        <div class="ohhh-calendar-settings-panel--section">
          <div class="ohhh-calendar-settings-panel--title">渐变预设</div>
          <div class="ohhh-calendar-settings-panel--presets">
            <div
              v-for="preset in gradientPresets"
              :key="preset.id"
              class="ohhh-calendar-settings-panel--preset"
              :class="{ 'is-active': selectedPreset === preset.id && backgroundType === 'preset' }"
              :style="{ background: preset.value }"
              @click="onPresetClick(preset.id)"
              :title="preset.name"
            >
              <span class="ohhh-calendar-settings-panel--preset-name">{{ preset.name }}</span>
            </div>
          </div>
        </div>

        <div class="ohhh-calendar-settings-panel--section">
          <div class="ohhh-calendar-settings-panel--title">显示设置</div>
          <div class="ohhh-calendar-settings-panel--controls">
            <div class="ohhh-calendar-settings-panel--control">
              <label>显示方式</label>
              <select class="ohhh-calendar-settings-panel--select" :value="displayMode" @change="onDisplayModeChange">
                <option v-for="mode in displayModes" :key="mode.value" :value="mode.value">{{ mode.label }}</option>
              </select>
            </div>

            <div class="ohhh-calendar-settings-panel--control">
              <label>模糊度: {{ blurAmount }}px</label>
              <input
                type="range"
                min="0"
                max="50"
                :value="blurAmount"
                class="ohhh-calendar-settings-panel--slider"
                @input="onBlurChange"
              />
            </div>

            <div class="ohhh-calendar-settings-panel--control">
              <label>旋转: {{ rotationAngle }}°</label>
              <input
                type="range"
                min="-180"
                max="180"
                :value="rotationAngle"
                class="ohhh-calendar-settings-panel--slider"
                @input="onRotationChange"
              />
            </div>

            <div class="ohhh-calendar-settings-panel--control">
              <label>视差: {{ parallaxIntensity }}px</label>
              <input
                type="range"
                min="0"
                max="100"
                :value="parallaxIntensity"
                class="ohhh-calendar-settings-panel--slider"
                @input="onParallaxChange"
              />
            </div>
          </div>
        </div>

        <div v-if="hasCustomImage" class="ohhh-calendar-settings-panel--section">
          <div class="ohhh-calendar-settings-panel--title">自定义图片</div>
          <div class="ohhh-calendar-settings-panel--custom-image">
            <div class="ohhh-calendar-settings-panel--preview" :style="{ backgroundImage: `url(${customImage})` }"></div>
            <button class="ohhh-calendar-settings-panel--clear-btn" @click="onClearCustomImage">
              清除自定义图片
            </button>
          </div>
        </div>
      </div>
    </transition>

    <div v-if="showToolbar" class="ohhh-calendar-toolbar ohhh-calendar--glass-panel ohhh-calendar--glass-light" :style="glassPanelStyle">
      <slot name="toolbar" :year="currentYear" :month="currentMonth" :viewMode="viewMode">
        <div v-html="icons.arrowDoubleLeft" class="ohhh-calendar-toolbar--icon" @click="changePageTo('prev-year')" />
        <div v-html="icons.arrowLeft" class="ohhh-calendar-toolbar--icon" @click="changePageTo('prev-page')" />
        <div class="ohhh-calendar-toolbar--text">{{ headerLabel }}</div>
        <div v-html="icons.arrowRight" class="ohhh-calendar-toolbar--icon" @click="changePageTo('next-page')" />
        <div v-html="icons.arrowDoubleRight" class="ohhh-calendar-toolbar--icon" @click="changePageTo('next-year')" />
      </slot>
    </div>

    <div v-if="showWeekdays" class="ohhh-calendar-weekdays ohhh-calendar--glass-panel ohhh-calendar--glass-light" :style="glassPanelStyle">
      <div v-for="(day, index) in weekdays" :key="day" class="ohhh-calendar-weekdays--weekday">
        <slot name="weekday" :weekday="day" :index="(index + weekStart) % 7">{{ day }}</slot>
      </div>
    </div>

    <div ref="swp" class="ohhh-calendar-wrapper ohhh-calendar--glass-panel ohhh-calendar--glass-heavy" :style="glassPanelStyle">
      <div
        v-for="(item, index) in allRenderDates"
        :key="index"
        :style="{ left: 100 * (index - 1) + '%' }"
        class="ohhh-calendar-days"
        @transitionend="onTransitionEnd"
      >
        <div
          v-for="dateObj in item"
          :key="dateObj.key"
          class="ohhh-calendar-day"
          :class="{
            'is-selected': isSameDay(dateObj.date, selected),
            'is-today': isSameDay(dateObj.date, new Date()),
            'other-month': !dateObj.current
          }"
          @click="changeSelectedDate(dateObj.date)"
        >
          <div class="ohhh-calendar-day--inner">
            <div class="ohhh-calendar-day--inner-value">{{ dateObj.fullDate.date }}</div>
            <div class="ohhh-calendar-day--inner-label" v-if="$slots['day-label']">
              <slot name="day-label" :date="dateObj.date" />
            </div>
          </div>
          <div class="ohhh-calendar-day--marker" :style="{ background: _getMarkerColor(dateObj.date) }" />
        </div>
      </div>
    </div>

    <div v-if="showFooter" class="ohhh-calendar-footer ohhh-calendar--glass-panel ohhh-calendar--glass-medium" :style="glassPanelStyle">
      <slot name="footer" :year="currentYear" :month="currentMonth" :viewMode="viewMode">
        <div
          v-html="viewMode === 'week' ? icons.arrowDown : icons.arrowUp"
          class="ohhh-calendar-footer--icon"
          @click="toggleViewMode"
        />
      </slot>
    </div>
  </div>
</template>

<script setup>
import { computed, useTemplateRef, toRefs, watch, nextTick, ref } from 'vue'
import { useSwipe } from '@vueuse/core'
import { useCalendar } from './hooks/useCalendar.js'
import { useBackground } from './hooks/useBackground.js'
import { useScreenshot } from './hooks/useScreenshot.js'
import { isSameDay, createWeekdays } from './utils'
import { icons } from './utils/icons.js'

const swipeRef = useTemplateRef('swp')
const containerRef = useTemplateRef('containerRef')

const emit = defineEmits(['select-change', 'view-change', 'screenshot-complete', 'background-change'])

const props = defineProps({
  initialSelectedDate: {
    type: Date,
    default: () => new Date()
  },
  initialViewMode: {
    type: String,
    default: 'month'
  },
  weekStart: {
    type: Number,
    default: 0
  },
  markerDates: {
    type: Array,
    default: () => []
  },
  showToolbar: {
    type: Boolean,
    default: true
  },
  showFooter: {
    type: Boolean,
    default: true
  },
  showWeekdays: {
    type: Boolean,
    default: true
  },
  duration: {
    type: String,
    default: '0.3s'
  },
  enableGlassEffect: {
    type: Boolean,
    default: true
  },
  enableBackground: {
    type: Boolean,
    default: true
  },
  showSettingsBar: {
    type: Boolean,
    default: true
  },
  themeColor: {
    type: String,
    default: '#409eff'
  },
  initialBackgroundType: {
    type: String,
    default: 'preset'
  },
  initialPreset: {
    type: String,
    default: 'sunset'
  },
  initialCustomImage: {
    type: String,
    default: null
  },
  initialDisplayMode: {
    type: String,
    default: 'cover'
  },
  initialBlurAmount: {
    type: Number,
    default: 10
  },
  initialRotationAngle: {
    type: Number,
    default: 0
  },
  initialParallaxIntensity: {
    type: Number,
    default: 20
  }
})

const {
  initialSelectedDate,
  initialViewMode,
  weekStart,
  markerDates,
  duration,
  themeColor,
  initialBackgroundType,
  initialPreset,
  initialCustomImage,
  initialDisplayMode,
  initialBlurAmount,
  initialRotationAngle,
  initialParallaxIntensity
} = toRefs(props)

const {
  selected,
  viewMode,
  currentYear,
  currentMonth,
  currentRenderDates,
  allRenderDates,
  transformDistance,
  transitionDuration,
  isInTransition,
  renderRows,
  switchPageToTargetDate,
  startTransitionAnimation,
  onTransitionEnd: calendarOnTransitionEnd,
  toggleViewMode
} = useCalendar({ initialSelectedDate, initialViewMode, weekStart, duration }, emit)

const {
  gradientPresets,
  displayModes,
  backgroundType,
  selectedPreset,
  customImage,
  displayMode,
  blurAmount,
  rotationAngle,
  parallaxIntensity,
  backgroundStyle,
  isBackgroundDark,
  glassOverlayColor,
  textColor,
  glowColor,
  parallaxX,
  parallaxY,
  hasCustomImage,
  setBackgroundType,
  setPreset,
  setCustomImage,
  clearCustomImage,
  setDisplayMode,
  setBlurAmount,
  setRotationAngle,
  setParallaxIntensity,
  updateParallax,
  resetParallax,
  startTransition,
  endTransition
} = useBackground({
  backgroundType: initialBackgroundType,
  selectedPreset: initialPreset,
  customImage: initialCustomImage,
  displayMode: initialDisplayMode,
  blurAmount: initialBlurAmount,
  rotationAngle: initialRotationAngle,
  parallaxIntensity: initialParallaxIntensity,
  themeColor
})

const { isTakingScreenshot, takeScreenshotAndCopy } = useScreenshot()

const isSettingsExpanded = ref(false)

const quickPresets = computed(() => {
  return gradientPresets.slice(0, 4)
})

watch(themeColor, (newColor) => {
  if (newColor) {
    document.documentElement.style.setProperty('--calendar-theme-color', newColor)
  }
}, { immediate: true })

watch(isInTransition, (isTrans) => {
  if (isTrans) {
    startTransition()
  } else {
    endTransition()
  }
})

const headerLabel = computed(() => `${currentYear.value}年${currentMonth.value + 1}月`)
const weekdays = createWeekdays(weekStart.value)
const markerDateList = computed(() =>
  markerDates.value.map(item => ({
    date: new Date(typeof item === 'object' && item.date ? item.date : item),
    color: typeof item === 'object' && item.color ? item.color : 'var(--calendar-theme-color)'
  }))
)

const containerStyle = computed(() => ({
  '--calendar-rows': renderRows.value,
  '--calendar-transition-duration': duration.value,
  '--translate-distance': transformDistance.value,
  '--transition-duration': transitionDuration.value,
  '--calendar-glass-overlay': glassOverlayColor.value,
  '--calendar-text-color': textColor.value,
  '--calendar-theme-color': themeColor.value
}))

const glassPanelStyle = computed(() => ({
  '--glass-overlay': glassOverlayColor.value,
  '--text-color': textColor.value
}))

const { lengthX } = useSwipe(swipeRef, {
  threshold: 0,
  onSwipe: () => {
    if (isInTransition.value) return
    transformDistance.value = -lengthX.value + 'px'
  },
  onSwipeEnd: (_, direction) => {
    if (isInTransition.value) return
    if (direction === 'left') {
      changePageTo('next-page')
    } else if (direction === 'right') {
      changePageTo('prev-page')
    } else {
      startTransitionAnimation(direction)
    }
  }
})

function _normalize(param) {
  if (!param) {
    throw new Error('参数不能为空')
  }
  if (param === 'prev-page') {
    if (viewMode.value === 'week') {
      return new Date(
        new Date(currentRenderDates.value[0].date).setDate(currentRenderDates.value[0].date.getDate() - 1)
      )
    } else if (viewMode.value === 'month') {
      return new Date(currentYear.value, currentMonth.value - 1)
    }
  }
  if (param === 'next-page') {
    if (viewMode.value === 'week') {
      return new Date(
        new Date(currentRenderDates.value[6].date).setDate(currentRenderDates.value[6].date.getDate() + 1)
      )
    } else if (viewMode.value === 'month') {
      return new Date(currentYear.value, currentMonth.value + 1)
    }
  }
  if (param === 'prev-year') {
    return new Date(currentYear.value - 1, currentMonth.value)
  }
  if (param === 'next-year') {
    return new Date(currentYear.value + 1, currentMonth.value)
  }
  const targetDate = new Date(param)
  if (!Number.isNaN(targetDate.getTime())) {
    return targetDate
  }
  throw new Error('日期不合法')
}

function changePageTo(param) {
  const targetDate = _normalize(param)
  switchPageToTargetDate(targetDate)
}

function changeSelectedDate(date) {
  changePageTo(date)
  if (!isSameDay(new Date(date), selected.value)) {
    selected.value = new Date(date)
    emit('select-change', selected.value)
  }
}

function onTransitionEnd() {
  calendarOnTransitionEnd()
  endTransition()
}

function _getMarkerColor(date) {
  return markerDateList.value.find(d => isSameDay(d.date, date))?.color
}

function onPresetClick(presetId) {
  setPreset(presetId)
  setBackgroundType('preset')
  emit('background-change', { type: 'preset', preset: presetId })
}

function onImageUpload(event) {
  const file = event.target.files?.[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const imageUrl = e.target.result
      setCustomImage(imageUrl)
      emit('background-change', { type: 'custom', image: imageUrl })
    }
    reader.readAsDataURL(file)
  }
}

function onClearCustomImage() {
  clearCustomImage()
  emit('background-change', { type: 'preset', preset: selectedPreset.value })
}

function onDisplayModeChange(event) {
  setDisplayMode(event.target.value)
}

function onBlurChange(event) {
  setBlurAmount(parseInt(event.target.value))
}

function onRotationChange(event) {
  setRotationAngle(parseInt(event.target.value))
}

function onParallaxChange(event) {
  setParallaxIntensity(parseInt(event.target.value))
}

function onMouseMove(event) {
  if (!props.enableBackground || !containerRef.value) return
  const rect = containerRef.value.getBoundingClientRect()
  updateParallax(event.clientX, event.clientY, rect)
}

function onMouseLeave() {
  resetParallax()
}

async function onScreenshotClick() {
  if (!containerRef.value) return

  const settingsBar = containerRef.value.querySelector('.ohhh-calendar-settings-bar')
  const settingsPanel = containerRef.value.querySelector('.ohhh-calendar-settings-panel')

  if (settingsBar) {
    settingsBar.style.display = 'none'
  }
  if (settingsPanel) {
    settingsPanel.style.display = 'none'
  }

  await nextTick()

  const result = await takeScreenshotAndCopy(containerRef.value, {
    isDark: isBackgroundDark.value,
    scale: 2
  })

  if (settingsBar) {
    settingsBar.style.display = ''
  }
  if (settingsPanel) {
    settingsPanel.style.display = ''
  }

  emit('screenshot-complete', {
    success: result?.copied || false,
    dataUrl: result?.dataUrl
  })
}

defineExpose({
  toggleViewMode,
  changePageTo,
  changeSelectedDate,
  setPreset,
  setCustomImage,
  clearCustomImage,
  setDisplayMode,
  setBlurAmount,
  setRotationAngle,
  setParallaxIntensity,
  takeScreenshot: async () => {
    if (!containerRef.value) return null
    const result = await takeScreenshotAndCopy(containerRef.value, {
      isDark: isBackgroundDark.value,
      scale: 2
    })
    return result
  }
})
</script>
