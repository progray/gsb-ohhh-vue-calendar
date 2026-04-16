<template>
  <div class="app-container">
    <ohhh-vue-calendar 
      ref="calendarRef" 
      :week-start="1" 
      :marker-dates="markerDates"
      :events="events" 
      @select-change="onSelectChange" 
    />
  </div>
</template>

<script setup>
import { useTemplateRef } from 'vue'
import OhhhVueCalendar from './packages/Calendar/Calendar.vue'
import '/src/packages/Calendar/style/mobile/mobile.scss'

const calendarRef = useTemplateRef('calendarRef')

// 获取当前日期
const today = new Date()
const year = today.getFullYear()
const month = today.getMonth()

// 测试标记日期数据
const markerDates = [
  new Date(year, month, today.getDate() + 3),
  {
    date: new Date(year, month, today.getDate() + 4),
    color: '#ff6a6a'
  },
  new Date(year, month, today.getDate() + 5)
]

// 测试事件数据
const events = [
  // 今天的事件
  {
    date: new Date(year, month, today.getDate()),
    title: '团队会议',
    color: '#409eff'
  },
  {
    date: new Date(year, month, today.getDate()),
    title: '项目评审',
    color: '#67c23a'
  },
  {
    date: new Date(year, month, today.getDate()),
    title: '客户沟通',
    color: '#e6a23c'
  },
  {
    date: new Date(year, month, today.getDate()),
    title: '代码审查',
    color: '#f56c6c'
  },
  // 明天的事件
  {
    date: new Date(year, month, today.getDate() + 1),
    title: '产品发布会',
    color: '#909399'
  },
  // 后天的事件
  {
    date: new Date(year, month, today.getDate() + 2),
    title: '技术分享会',
    color: '#409eff'
  },
  {
    date: new Date(year, month, today.getDate() + 2),
    title: '需求讨论会',
    color: '#67c23a'
  }
]

function onSelectChange(date) {
  console.log(date)
}
</script>
