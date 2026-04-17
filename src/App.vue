<template>
  <div class="app-container">
    <ohhh-vue-calendar 
      ref="calendarRef" 
      :week-start="1" 
      :mood-data="moodData"
      :marker-dates="markerDates"
      @select-change="onSelectChange"
      @date-click="onDateClick"
    />
    
    <!-- 心情选择面板 -->
    <div 
      v-if="showMoodPanel" 
      class="mood-modal-overlay"
      @click="closeMoodPanel"
    >
      <div 
        class="mood-panel" 
        @click.stop
      >
        <div class="mood-panel-title">选择今日心情</div>
        <div class="mood-panel-options">
          <div 
            v-for="(mood, index) in moodOptions" 
            :key="mood.value"
            class="mood-option"
            :style="{ animationDelay: (index * 80) + 'ms' }"
            @click="selectMood(mood.value)"
          >
            <div class="mood-option-emoji">{{ mood.emoji }}</div>
            <div class="mood-option-label">{{ mood.label }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 本月心情分布图表 -->
    <div class="mood-chart-container">
      <div class="mood-chart-title">{{ currentMonthLabel }} 心情分布</div>
      <div class="mood-chart-bars">
        <div 
          v-for="(mood, index) in moodOptions" 
          :key="mood.value"
          class="mood-chart-bar-item"
          :style="{ animationDelay: (index * 100) + 'ms' }"
        >
          <div class="mood-chart-bar-emoji">{{ mood.emoji }}</div>
          <div class="mood-chart-bar-wrapper">
            <div 
              class="mood-chart-bar-fill"
              :style="{
                '--bar-width': getBarWidth(mood.value) + '%',
                background: mood.color
              }"
            ></div>
          </div>
          <div class="mood-chart-bar-count">{{ getMoodCount(mood.value) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useTemplateRef, ref, computed, watch, nextTick } from 'vue'
import OhhhVueCalendar from './packages/Calendar/Calendar.vue'
import '/src/packages/Calendar/style/mobile/mobile.scss'
import { formatDateKey } from './packages/Calendar/utils'

const calendarRef = useTemplateRef('calendarRef')

const moodOptions = [
  { value: 'happy', emoji: '😊', label: '开心', color: '#f59e0b' },
  { value: 'normal', emoji: '😐', label: '一般', color: '#6b7280' },
  { value: 'sad', emoji: '😢', label: '难过', color: '#3b82f6' },
  { value: 'angry', emoji: '😡', label: '生气', color: '#ef4444' },
  { value: 'tired', emoji: '😴', label: '疲惫', color: '#8b5cf6' }
]

const today = new Date()
const currentYearValue = today.getFullYear()
const currentMonthValue = today.getMonth() + 1

const moodData = ref({})

function generateTestData() {
  const data = {}
  const daysInMonth = new Date(currentYearValue, currentMonthValue, 0).getDate()
  const moods = ['happy', 'normal', 'sad', 'angry', 'tired']
  
  for (let day = 1; day <= Math.min(15, daysInMonth); day++) {
    const dateKey = `${currentYearValue}-${String(currentMonthValue).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const randomMood = moods[Math.floor(Math.random() * moods.length)]
    data[dateKey] = randomMood
  }
  
  return data
}

moodData.value = generateTestData()

const showMoodPanel = ref(false)
const selectedDate = ref(new Date())
const currentYear = ref(new Date().getFullYear())
const currentMonth = ref(new Date().getMonth())

const currentMonthLabel = computed(() => {
  return `${currentYear.value}年${currentMonth.value + 1}月`
})

const markerDates = computed(() => {
  return Object.keys(moodData.value).map(date => ({
    date,
    color: '#6366f1'
  }))
})

function getCurrentMonthMoods() {
  const moods = {}
  moodOptions.forEach(mood => {
    moods[mood.value] = 0
  })
  
  Object.entries(moodData.value).forEach(([dateKey, moodValue]) => {
    const [year, month] = dateKey.split('-').map(Number)
    if (year === currentYear.value && month === currentMonth.value + 1) {
      if (moods[moodValue] !== undefined) {
        moods[moodValue]++
      }
    }
  })
  
  return moods
}

function getMoodCount(moodValue) {
  const moods = getCurrentMonthMoods()
  return moods[moodValue] || 0
}

function getBarWidth(moodValue) {
  const moods = getCurrentMonthMoods()
  const total = Object.values(moods).reduce((sum, count) => sum + count, 0)
  
  if (total === 0) return 0
  
  const maxCount = Math.max(...Object.values(moods))
  if (maxCount === 0) return 0
  
  return (moods[moodValue] / maxCount) * 100
}

function onSelectChange(date) {
  console.log('选中日期:', date)
  selectedDate.value = date
  currentYear.value = date.getFullYear()
  currentMonth.value = date.getMonth()
}

function onDateClick(date, hasMood) {
  console.log('点击日期:', date, '是否已打卡:', hasMood)
  selectedDate.value = date
  currentYear.value = date.getFullYear()
  currentMonth.value = date.getMonth()
  
  if (!hasMood) {
    nextTick(() => {
      showMoodPanel.value = true
    })
  }
}

function selectMood(moodValue) {
  const dateKey = formatDateKey(selectedDate.value)
  moodData.value = {
    ...moodData.value,
    [dateKey]: moodValue
  }
  closeMoodPanel()
}

function closeMoodPanel() {
  showMoodPanel.value = false
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  background: #111827;
  min-height: 100vh;
}

.app-container {
  min-height: 100vh;
  background: #111827;
  padding: 20px;
}
</style>
