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
            @click.stop="onDateClick(date)"
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
        <template v-for="(week, weekIndex) in currentTemplate.grid" :key="weekIndex">
          <div
            v-for="(pixel, dayIndex) in week"
            :key="`${weekIndex}-${dayIndex}`"
            class="preview-pixel"
            :class="getPreviewPixelClasses(weekIndex, dayIndex, pixel)"
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
import { pixelArtTemplates, getTotalPixels } from './utils/pixelArtTemplates'
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
  for (let weekIndex = 0; weekIndex < currentTemplate.value.grid.length; weekIndex++) {
    for (let dayIndex = 0; dayIndex < currentTemplate.value.grid[weekIndex].length; dayIndex++) {
      if (currentTemplate.value.grid[weekIndex][dayIndex] === 1) {
        const dateStr = getDateFromGridPosition(weekIndex, dayIndex)
        if (dateStr && unlockedDates.value.has(dateStr)) {
          count++
        }
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

function formatDate(date) {
  const d = new Date(date)
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

function getDateFromGridPosition(weekIndex, dayIndex) {
  const firstDayOfMonth = new Date(currentYear.value, currentMonth.value, 1)
  const firstDayWeekday = firstDayOfMonth.getDay()
  const offset = (firstDayWeekday - 1 + 7) % 7
  
  const dayOfMonth = weekIndex * 7 + dayIndex - offset + 1
  
  if (dayOfMonth < 1) return null
  
  const date = new Date(currentYear.value, currentMonth.value, dayOfMonth)
  if (date.getMonth() !== currentMonth.value) return null
  
  return formatDate(date)
}

function getGridPositionFromDate(date) {
  const d = new Date(date)
  if (d.getFullYear() !== currentYear.value || d.getMonth() !== currentMonth.value) {
    return null
  }
  
  const dayOfMonth = d.getDate()
  const firstDayOfMonth = new Date(currentYear.value, currentMonth.value, 1)
  const firstDayWeekday = firstDayOfMonth.getDay()
  const offset = (firstDayWeekday - 1 + 7) % 7
  
  const position = dayOfMonth + offset - 1
  const weekIndex = Math.floor(position / 7)
  const dayIndex = position % 7
  
  return { weekIndex, dayIndex }
}

function getPixelColorForDate(date) {
  const position = getGridPositionFromDate(date)
  if (!position) return currentTemplate.value.colors.bg
  
  const { weekIndex, dayIndex } = position
  
  if (weekIndex >= currentTemplate.value.grid.length || dayIndex >= currentTemplate.value.grid[0].length) {
    return currentTemplate.value.colors.bg
  }
  
  const isPixel = currentTemplate.value.grid[weekIndex][dayIndex] === 1
  if (!isPixel) return currentTemplate.value.colors.bg
  
  const dateStr = formatDate(date)
  return unlockedDates.value.has(dateStr) ? currentTemplate.value.colors.pixel : '#d0d0d0'
}

function getDayClasses(date, isOtherMonth) {
  const classes = []
  const position = getGridPositionFromDate(date)
  const dateStr = formatDate(date)
  
  if (isOtherMonth) {
    classes.push('other-month')
  }
  
  if (position) {
    const { weekIndex, dayIndex } = position
    if (weekIndex < currentTemplate.value.grid.length && dayIndex < currentTemplate.value.grid[0].length) {
      if (currentTemplate.value.grid[weekIndex][dayIndex] === 1) {
        classes.push('is-pixel')
      }
    }
  }
  
  if (unlockedDates.value.has(dateStr)) {
    classes.push('unlocked')
  } else {
    classes.push('locked')
  }
  
  if (isSameDay(date, new Date())) {
    classes.push('is-today')
  }
  
  return classes
}

function getPreviewPixelClasses(weekIndex, dayIndex, pixel) {
  if (pixel === 0) return 'bg'
  
  const dateStr = getDateFromGridPosition(weekIndex, dayIndex)
  if (!dateStr) return 'locked'
  
  return unlockedDates.value.has(dateStr) ? 'unlocked' : 'locked'
}

function isAnimating(date) {
  return animatingDates.value.has(formatDate(date))
}

function onDateClick(date) {
  const dateStr = formatDate(date)
  
  const position = getGridPositionFromDate(date)
  if (!position) return
  
  const { weekIndex, dayIndex } = position
  if (weekIndex >= currentTemplate.value.grid.length || dayIndex >= currentTemplate.value.grid[0].length) {
    return
  }
  
  if (currentTemplate.value.grid[weekIndex][dayIndex] !== 1) {
    return
  }
  
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
    const date = new Date(currentYear.value, currentMonth.value, day)
    const position = getGridPositionFromDate(date)
    
    if (position) {
      const { weekIndex, dayIndex } = position
      if (weekIndex < currentTemplate.value.grid.length && 
          dayIndex < currentTemplate.value.grid[0].length &&
          currentTemplate.value.grid[weekIndex][dayIndex] === 1) {
        newUnlocked.add(formatDate(date))
      }
    }
  }
  
  unlockedDates.value = newUnlocked
}

onMounted(() => {
  initializeUnlockedDates()
})
</script>
