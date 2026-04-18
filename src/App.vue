<template>
  <div class="app-container">
    <ohhh-vue-calendar
      ref="calendarRef"
      :week-start="1"
      :time-axis-start="8"
      :time-axis-end="22"
      :events="events"
      :initial-selected-date="currentDate"
      :marker-dates="markerDates"
      :events="events"
      :show-event-time="true"
      @select-change="onSelectChange"
      @event-click="onEventClick"
    />
  </div>
</template>

<script setup>
import { useTemplateRef } from 'vue'
import OhhhVueCalendar from './packages/Calendar/Calendar.vue'
import '/src/packages/Calendar/style/mobile/mobile.scss'

const calendarRef = useTemplateRef('calendarRef')

const currentDate = new Date()

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

const today = new Date()
const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
const tomorrow = new Date(today)
tomorrow.setDate(tomorrow.getDate() + 1)
const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`
const dayAfter = new Date(today)
dayAfter.setDate(dayAfter.getDate() + 2)
const dayAfterStr = `${dayAfter.getFullYear()}-${String(dayAfter.getMonth() + 1).padStart(2, '0')}-${String(dayAfter.getDate()).padStart(2, '0')}`

const events = [
  {
    date: todayStr,
    startTime: '09:00',
    endTime: '10:30',
    title: '晨会',
    color: '#409eff'
  },
  {
    date: todayStr,
    startTime: '11:00',
    endTime: '12:00',
    title: '项目评审会议',
    color: '#67c23a'
  },
  {
    date: todayStr,
    startTime: '14:00',
    endTime: '16:00',
    title: '客户沟通会议',
    color: '#e6a23c'
  },
  {
    date: todayStr,
    startTime: '19:00',
    endTime: '21:00',
    title: '技术分享会',
    color: '#f56c6c'
  },
  {
    date: tomorrowStr,
    startTime: '08:30',
    endTime: '11:30',
    title: '产品设计讨论',
    color: '#909399'
  },
  {
    date: tomorrowStr,
    startTime: '13:00',
    endTime: '14:30',
    title: '午餐会议',
    color: '#409eff'
  },
  {
    date: dayAfterStr,
    startTime: '10:00',
    endTime: '12:00',
    title: '代码审查',
    color: '#67c23a'
  },
  {
    date: dayAfterStr,
    startTime: '15:00',
    endTime: '17:30',
    title: '团队周会',
    color: '#e6a23c'
  }
]

function onSelectChange(date) {
  console.log('Selected date:', date)
}

function onEventClick(event) {
  console.log('Event clicked:', event)
}
</script>
