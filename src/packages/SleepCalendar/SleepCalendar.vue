<template>
  <div class="sleep-calendar-container">
    <ohhh-vue-calendar 
      ref="calendarRef" 
      :week-start="1" 
      :show-footer="true"
      :duration="'0.5s'"
      @select-change="handleSelectChange"
      @view-change="handleViewChange"
    >
      <template #toolbar="{ year, month, viewMode }">
        <div class="sleep-calendar-toolbar">
          <div class="sleep-calendar-toolbar--left">
            <div 
              class="sleep-calendar-toolbar--icon" 
              @click="handlePrevYear"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M18 17L12 11L6 17" stroke="#8a8aa0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M18 7L12 1L6 7" stroke="#8a8aa0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div 
              class="sleep-calendar-toolbar--icon" 
              @click="handlePrevPage"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M15 18L9 12L15 6" stroke="#8a8aa0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>
          <div class="sleep-calendar-toolbar--text">{{ year }}年{{ month + 1 }}月</div>
          <div class="sleep-calendar-toolbar--right">
            <div 
              class="sleep-calendar-toolbar--icon" 
              @click="handleNextPage"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M9 6L15 12L9 18" stroke="#8a8aa0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div 
              class="sleep-calendar-toolbar--icon" 
              @click="handleNextYear"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M6 7L12 13L18 7" stroke="#8a8aa0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M6 17L12 23L18 17" stroke="#8a8aa0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>
        </div>
      </template>
      
      <template #weekday="{ weekday, index }">
        <span class="sleep-calendar-weekday">{{ weekday }}</span>
      </template>
      
      <template #day-label="{ date }">
        <div class="sleep-calendar-day-label">
          <div 
            v-if="getSleepRating(date) !== null" 
            class="sleep-calendar-color-bar"
            :style="{ background: getSleepColor(getSleepRating(date)) }"
          ></div>
          <div 
            v-else 
            class="sleep-calendar-color-bar sleep-calendar-color-bar--empty"
          ></div>
        </div>
      </template>
      
      <template #footer="{ year, month, viewMode }">
        <div class="sleep-calendar-footer">
          <div 
            class="sleep-calendar-footer--icon" 
            @click="handleToggleViewMode"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path 
                v-if="viewMode === 'week'"
                d="M6 9L12 15L18 9" 
                stroke="#8a8aa0" 
                stroke-width="2" 
                stroke-linecap="round" 
                stroke-linejoin="round"
              />
              <path 
                v-else
                d="M6 15L12 9L18 15" 
                stroke="#8a8aa0" 
                stroke-width="2" 
                stroke-linecap="round" 
                stroke-linejoin="round"
              />
            </svg>
          </div>
        </div>
      </template>
    </ohhh-vue-calendar>
    
    <div class="sleep-calendar-overview">
      <div class="sleep-calendar-overview--left">
        <div class="sleep-calendar-overview--average">
          <span class="sleep-calendar-overview--average-label">本月平均</span>
          <span class="sleep-calendar-overview--average-value">
            {{ formattedAverage }}
          </span>
        </div>
        <div class="sleep-calendar-overview--emoji" v-if="monthAverage !== null">
          <SleepEmoji :rating="roundedAverage" :size="40" variant="outline" />
        </div>
      </div>
      <div class="sleep-calendar-overview--sparkline">
        <Sparkline 
          :data="sortedRatings" 
          :width="120" 
          :height="32"
          stroke="#6a6a80"
          :stroke-width="1.5"
          :min-value="1"
          :max-value="5"
        />
      </div>
    </div>
    
    <SleepEditor 
      v-model:visible="editorVisible"
      :date="selectedDate"
      :initial-rating="selectedRating"
      @save="handleSaveRating"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import OhhhVueCalendar from '../Calendar/Calendar.vue'
import SleepEmoji from './components/SleepEmoji.vue'
import Sparkline from './components/Sparkline.vue'
import SleepEditor from './components/SleepEditor.vue'
import { getSleepColor } from './utils/colors.js'
import { 
  getSleepRating, 
  setSleepRating, 
  calculateMonthAverage,
  getSortedMonthRatings
} from './utils/storage.js'

const calendarRef = ref(null)
const editorVisible = ref(false)
const selectedDate = ref(new Date())
const currentViewMode = ref('month')

const selectedRating = computed(() => {
  return getSleepRating(selectedDate.value)
})

const currentYear = computed(() => selectedDate.value.getFullYear())
const currentMonth = computed(() => selectedDate.value.getMonth())

const monthAverage = computed(() => {
  return calculateMonthAverage(currentYear.value, currentMonth.value)
})

const formattedAverage = computed(() => {
  if (monthAverage.value === null) return '--'
  return monthAverage.value.toFixed(1)
})

const roundedAverage = computed(() => {
  if (monthAverage.value === null) return 3
  return Math.max(1, Math.min(5, Math.round(monthAverage.value)))
})

const sortedRatings = computed(() => {
  return getSortedMonthRatings(currentYear.value, currentMonth.value)
})

function handleSelectChange(date) {
  selectedDate.value = new Date(date)
  editorVisible.value = true
}

function handleViewChange(viewMode) {
  currentViewMode.value = viewMode
}

function handleSaveRating({ date, rating }) {
  setSleepRating(date, rating)
}

function handlePrevPage() {
  if (calendarRef.value?.changePageTo) {
    calendarRef.value.changePageTo('prev-page')
    updateSelectedDateForPrevPage()
  }
}

function handleNextPage() {
  if (calendarRef.value?.changePageTo) {
    calendarRef.value.changePageTo('next-page')
    updateSelectedDateForNextPage()
  }
}

function handlePrevYear() {
  if (calendarRef.value?.changePageTo) {
    calendarRef.value.changePageTo('prev-year')
    selectedDate.value = new Date(
      selectedDate.value.getFullYear() - 1,
      selectedDate.value.getMonth(),
      Math.min(selectedDate.value.getDate(), new Date(selectedDate.value.getFullYear() - 1, selectedDate.value.getMonth() + 1, 0).getDate())
    )
  }
}

function handleNextYear() {
  if (calendarRef.value?.changePageTo) {
    calendarRef.value.changePageTo('next-year')
    selectedDate.value = new Date(
      selectedDate.value.getFullYear() + 1,
      selectedDate.value.getMonth(),
      Math.min(selectedDate.value.getDate(), new Date(selectedDate.value.getFullYear() + 1, selectedDate.value.getMonth() + 1, 0).getDate())
    )
  }
}

function handleToggleViewMode() {
  if (calendarRef.value?.toggleViewMode) {
    calendarRef.value.toggleViewMode()
  }
}

function updateSelectedDateForPrevPage() {
  const d = new Date(selectedDate.value)
  if (currentViewMode.value === 'week') {
    d.setDate(d.getDate() - 7)
  } else {
    d.setMonth(d.getMonth() - 1)
  }
  selectedDate.value = d
}

function updateSelectedDateForNextPage() {
  const d = new Date(selectedDate.value)
  if (currentViewMode.value === 'week') {
    d.setDate(d.getDate() + 7)
  } else {
    d.setMonth(d.getMonth() + 1)
  }
  selectedDate.value = d
}
</script>

<style lang="scss" scoped>
.sleep-calendar-container {
  background: linear-gradient(180deg, #1a1a2a 0%, #161622 100%);
  min-height: 100vh;
  padding: 16px;
  font-family: 
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    'Helvetica Neue',
    Arial,
    sans-serif;
}

.sleep-calendar-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 8px;
  column-gap: 12px;
}

.sleep-calendar-toolbar--left,
.sleep-calendar-toolbar--right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sleep-calendar-toolbar--icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 12px;
  background: #2a2a3a;
  transition: all 0.3s ease;
  
  &:hover {
    background: #3a3a4a;
  }
  
  &:active {
    transform: scale(0.95);
  }
}

.sleep-calendar-toolbar--text {
  font-size: 20px;
  font-weight: 600;
  color: #c0c0d0;
  letter-spacing: 0.5px;
  margin: 0 auto;
  white-space: nowrap;
}

.sleep-calendar-weekday {
  font-size: 14px;
  color: #6a6a80;
  font-weight: 500;
}

.sleep-calendar-footer {
  display: flex;
  justify-content: center;
  padding: 12px;
}

.sleep-calendar-footer--icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 12px;
  background: #2a2a3a;
  transition: all 0.3s ease;
  
  &:hover {
    background: #3a3a4a;
  }
  
  &:active {
    transform: scale(0.95);
  }
}

.sleep-calendar-day-label {
  position: absolute;
  bottom: 6px;
  left: 6px;
  right: 6px;
  height: 8px;
}

.sleep-calendar-color-bar {
  width: 100%;
  height: 100%;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.sleep-calendar-color-bar--empty {
  background: #2a2a3a;
  opacity: 0.5;
}

.sleep-calendar-overview {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 20px;
  padding: 16px;
  background: #1e1e2e;
  border-radius: 16px;
  box-shadow: 
    0 4px 24px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.sleep-calendar-overview--left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sleep-calendar-overview--average {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sleep-calendar-overview--average-label {
  font-size: 11px;
  color: #6a6a80;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.sleep-calendar-overview--average-value {
  font-size: 36px;
  font-weight: 700;
  color: #e0e0f0;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.sleep-calendar-overview--emoji {
  opacity: 0.9;
}

.sleep-calendar-overview--sparkline {
  padding: 6px;
  background: #252535;
  border-radius: 10px;
}
</style>
