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

    <div v-if="showSettingsBar && enableBackground" class="ohhh-calendar-settings">
      <div class="ohhh-calendar-settings--section">
        <div class="ohhh-calendar-settings--label">背景</div>
        <div class="ohhh-calendar-settings--presets">
          <div
            v-for="preset in gradientPresets"
            :key="preset.id"
            class="ohhh-calendar-settings--preset"
            :class="{ 'is-active': selectedPreset === preset.id && backgroundType === 'preset' }"
            :style="{ background: preset.value }"
            @click="onPresetClick(preset.id)"
          ></div>
          <label class="ohhh-calendar-settings--preset ohhh-calendar-settings--upload" :class="{ 'is-active': backgroundType === 'custom' }">
            <input type="file" accept="image/*" @change="onImageUpload" style="display: none" />
            <span v-if="!hasCustomImage">+</span>
            <span v-else class="ohhh-calendar-settings--upload-preview" :style="{ backgroundImage: `url(${customImage})` }"></span>
          </label>
        </div>
      </div>

      <div class="ohhh-calendar-settings--section">
        <div class="ohhh-calendar-settings--label">显示</div>
        <select class="ohhh-calendar-settings--select" :value="displayMode" @change="onDisplayModeChange">
          <option v-for="mode in displayModes" :key="mode.value" :value="mode.value">{{ mode.label }}</option>
        </select>
      </div>

      <div class="ohhh-calendar-settings--section">
        <div class="ohhh-calendar-settings--label">模糊: {{ blurAmount }}px</div>
        <input
          type="range"
          min="0"
          max="50"
          :value="blurAmount"
          class="ohhh-calendar-settings--slider"
          @input="onBlurChange"
        />
      </div>

      <div class="ohhh-calendar-settings--section">
        <div class="ohhh-calendar-settings--label">旋转: {{ rotationAngle }}°</div>
        <input
          type="range"
          min="-180"
          max="180"
          :value="rotationAngle"
          class="ohhh-calendar-settings--slider"
          @input="onRotationChange"
        />
      </div>

      <div class="ohhh-calendar-settings--section">
        <div class="ohhh-calendar-settings--label">视差: {{ parallaxIntensity }}px</div>
        <input
          type="range"
          min="0"
          max="100"
          :value="parallaxIntensity"
          class="ohhh-calendar-settings--slider"
          @input="onParallaxChange"
        />
      </div>

      <div class="ohhh-calendar-settings--section">
        <button
          class="ohhh-calendar-settings--screenshot-btn"
          :disabled="isTakingScreenshot"
          @click="onScreenshotClick"
        >
          {{ isTakingScreenshot ? '截图中...' : '截图' }}
        </button>
      </div>
    </div>

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
import { computed, useTemplateRef, toRefs, watch, nextTick } from 'vue'
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
  '--calendar-rows': renderRows,
  '--calendar-transition-duration': duration,
  '--translate-distance': transformDistance,
  '--transition-duration': transitionDuration,
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

  const mainArea = containerRef.value.querySelector('.ohhh-calendar-toolbar, .ohhh-calendar-weekdays, .ohhh-calendar-wrapper, .ohhh-calendar-footer')
  if (!mainArea) return

  const settingsBar = containerRef.value.querySelector('.ohhh-calendar-settings')
  const background = containerRef.value.querySelector('.ohhh-calendar-background')
  const glow = containerRef.value.querySelector('.ohhh-calendar-glass-glow')

  if (settingsBar) {
    settingsBar.style.display = 'none'
  }

  await nextTick()

  const result = await takeScreenshotAndCopy(containerRef.value, {
    isDark: isBackgroundDark.value,
    scale: 2
  })

  if (settingsBar) {
    settingsBar.style.display = ''
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
