<template>
  <div class="pixel-calendar-container">
    <div class="template-selector">
      <button
        v-for="template in pixelArtTemplates"
        :key="template.id"
        class="template-button"
        :class="{ active: currentTemplate.id === template.id }"
        @click="switchTemplate(template)"
      >
        {{ template.name }}
      </button>
    </div>

    <div class="calendar-wrapper">
      <ohhh-vue-calendar
        ref="calendarRef"
        :week-start="1"
        :show-footer="false"
      >
        <template #day="{ date, isOtherMonth }">
          <div
            class="pixel-day-wrapper"
            :class="getDayClasses(date, isOtherMonth)"
            :style="{ '--pixel-color': getPixelColorForDate(date) }"
            @click.stop="onDateClick(date, isOtherMonth)"
          >
            <div class="ohhh-calendar-day--inner">
              <div class="ohhh-calendar-day--inner-value">{{ date.getDate() }}</div>
            </div>
            <div
              v-if="isAnimating(date)"
              class="pixel-ripple animating"
              :style="{ '--pixel-color': getPixelColorForDate(date) }"
            ></div>
          </div>
        </template>
      </ohhh-vue-calendar>
    </div>

    <div class="progress-section">
      <div class="progress-title">解锁进度</div>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
        <div class="progress-text">{{ progressText }}</div>
      </div>
    </div>

    <div class="preview-section">
      <div class="preview-title">{{ currentTemplate.name }} - 实时预览</div>
      <div class="preview-grid">
        <template v-for="(row, rowIndex) in currentTemplate.grid" :key="rowIndex">
          <div
            v-for="(pixel, colIndex) in row"
            :key="`${rowIndex}-${colIndex}`"
            class="preview-pixel"
            :class="getPreviewPixelClasses(rowIndex, colIndex, pixel)"
            :style="{ '--pixel-color': currentTemplate.colors.pixel }"
          ></div>
        </template>
      </div>

      <div v-if="isComplete" class="complete-message">
        🎉 恭喜！{{ currentTemplate.name }}已完全解锁！
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import OhhhVueCalendar from './packages/Calendar/Calendar.vue'
import { pixelArtTemplates, getTotalPixels, isPixelDate, getDatePositionInGrid } from './utils/pixelArtTemplates'
import { isSameDay } from './packages/Calendar/utils'
import './packages/Calendar/style/mobile/mobile.scss'
import './style/pixelCalendar.scss'

const calendarRef = ref(null)

const currentTemplate = ref(pixelArtTemplates[0])
const unlockedDates = ref(new Set())
const animatingDates = ref(new Set())

const currentYear = ref(new Date().getFullYear())
const currentMonth = ref(new Date().getMonth())

const totalPixels = computed(() => getTotalPixels(currentTemplate.value))

const unlockedPixelCount = computed(() => {
  let count = 0
  const daysInMonth = new Date(currentYear.value, currentMonth.value + 1, 0).getDate()
  
  for (let day = 1; day <= daysInMonth; day++) {
    if (isPixelDate(currentTemplate.value, day)) {
      const dateStr = formatDate(currentYear.value, currentMonth.value, day)
      if (unlockedDates.value.has(dateStr)) {
        count++
      }
    }
  }
  return count
})

const progressPercentage = computed(() => {
  if (totalPixels.value === 0) return 0
  return Math.round((unlockedPixelCount.value / totalPixels.value) * 100)
})

const progressText = computed(() => {
  return `${unlockedPixelCount.value} / ${totalPixels.value} (${progressPercentage.value}%)`
})

const isComplete = computed(() => {
  return unlockedPixelCount.value === totalPixels.value && totalPixels.value > 0
})

function formatDate(year, month, day) {
  return `${year}-${month + 1}-${day}`
}

function formatDateFromDateObj(date) {
  const d = new Date(date)
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

function getPixelColorForDate(date) {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = d.getMonth()
  const day = d.getDate()
  
  if (year !== currentYear.value || month !== currentMonth.value) {
    return currentTemplate.value.colors.bg
  }
  
  const isUnlocked = unlockedDates.value.has(formatDate(year, month, day))
  
  const pos = getDatePositionInGrid(day)
  if (!pos || pos.row >= currentTemplate.value.grid.length || pos.col >= currentTemplate.value.grid[0].length) {
    return currentTemplate.value.colors.bg
  }
  
  const isPixel = currentTemplate.value.grid[pos.row][pos.col] === 1
  if (!isPixel) {
    return currentTemplate.value.colors.bg
  }
  
  return isUnlocked ? currentTemplate.value.colors.pixel : '#d0d0d0'
}

function getDayClasses(date, isOtherMonth) {
  const classes = []
  const d = new Date(date)
  const year = d.getFullYear()
  const month = d.getMonth()
  const day = d.getDate()
  
  if (isOtherMonth) {
    classes.push('other-month')
  } else {
    if (isPixelDate(currentTemplate.value, day)) {
      classes.push('is-pixel')
    }
    
    const dateStr = formatDate(year, month, day)
    if (unlockedDates.value.has(dateStr)) {
      classes.push('unlocked')
    } else {
      classes.push('locked')
    }
  }
  
  if (isSameDay(date, new Date())) {
    classes.push('is-today')
  }
  
  return classes
}

function getPreviewPixelClasses(rowIndex, colIndex, pixel) {
  if (pixel === 0) return 'bg'
  
  const dayOfMonth = rowIndex * 7 + colIndex + 1
  const daysInMonth = new Date(currentYear.value, currentMonth.value + 1, 0).getDate()
  
  if (dayOfMonth > daysInMonth) {
    return 'bg'
  }
  
  const dateStr = formatDate(currentYear.value, currentMonth.value, dayOfMonth)
  return unlockedDates.value.has(dateStr) ? 'unlocked' : 'locked'
}

function isAnimating(date) {
  return animatingDates.value.has(formatDateFromDateObj(date))
}

function onDateClick(date, isOtherMonth) {
  if (isOtherMonth) return
  
  const d = new Date(date)
  const year = d.getFullYear()
  const month = d.getMonth()
  const day = d.getDate()
  
  if (year !== currentYear.value || month !== currentMonth.value) {
    return
  }
  
  if (!isPixelDate(currentTemplate.value, day)) {
    return
  }
  
  const dateStr = formatDate(year, month, day)
  if (unlockedDates.value.has(dateStr)) {
    return
  }
  
  const newUnlocked = new Set(unlockedDates.value)
  newUnlocked.add(dateStr)
  unlockedDates.value = newUnlocked
  
  const newAnimating = new Set()
  newAnimating.add(dateStr)
  animatingDates.value = newAnimating
  
  setTimeout(() => {
    animatingDates.value = new Set()
  }, 600)
}

function switchTemplate(template) {
  currentTemplate.value = template
  unlockedDates.value = new Set()
  animatingDates.value = new Set()
  initializeUnlockedDates()
}

function initializeUnlockedDates() {
  const daysInMonth = new Date(currentYear.value, currentMonth.value + 1, 0).getDate()
  const halfDays = Math.floor(daysInMonth / 2)
  
  const newUnlocked = new Set()
  
  for (let day = 1; day <= halfDays; day++) {
    if (isPixelDate(currentTemplate.value, day)) {
      newUnlocked.add(formatDate(currentYear.value, currentMonth.value, day))
    }
  }
  
  unlockedDates.value = newUnlocked
}

onMounted(() => {
  initializeUnlockedDates()
})
</script>
