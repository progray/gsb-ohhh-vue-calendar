<template>
  <div class="app-container">
    <ohhh-vue-calendar
      ref="calendarRef"
      :week-start="1"
      :markerDates="markerDates"
      :events="events"
      @select-change="onSelectChange"
      @view-change="onViewChange"
      @create-event="onCreateEvent"
      @click-event="onClickEvent"
    />
  </div>
</template>

<script setup>
import { useTemplateRef, ref } from 'vue'
import OhhhVueCalendar from './packages/Calendar/Calendar.vue'
import '/src/packages/Calendar/style/mobile/mobile.scss'

const calendarRef = useTemplateRef('calendarRef')

const today = new Date()
const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)
const dayAfterTomorrow = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000)

const markerDates = [
  today,
  tomorrow,
  {
    date: dayAfterTomorrow,
    color: '#ff6a6a'
  }
]

const events = ref([
  {
    id: '1',
    date: new Date(today),
    title: '项目周会',
    startTime: '09:00',
    endTime: '10:30',
    description: '讨论本周项目进度',
    color: '#409eff'
  },
  {
    id: '2',
    date: new Date(today),
    title: '代码评审',
    startTime: '14:00',
    endTime: '15:00',
    description: '审查新功能代码',
    color: '#67c23a'
  },
  {
    id: '3',
    date: new Date(today),
    title: '客户电话会议',
    startTime: '16:30',
    endTime: '17:30',
    description: '与客户讨论需求',
    color: '#e6a23c'
  },
  {
    id: '4',
    date: new Date(tomorrow),
    title: '技术分享会',
    startTime: '10:00',
    endTime: '11:30',
    description: '分享新技术栈',
    color: '#909399'
  }
])

function onSelectChange(date) {
  console.log('选中日期:', date)
}

function onViewChange(mode) {
  console.log('视图切换:', mode)
}

function onCreateEvent(event) {
  console.log('创建新日程:', event)
  events.value.push(event)
}

function onClickEvent(event) {
  console.log('点击日程:', event)
}
</script>
