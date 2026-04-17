<template>
  <div class="app-container">
    <ohhh-vue-calendar
      ref="calendarRef"
      :week-start="1"
      :markerDates
      :countDownEnabled="true"
      :countDownDate="countDownDate"
      :countDownTitle="countDownTitle"
      :countDownColor="countDownColor"
      @select-change="onSelectChange"
    />
  </div>
</template>

<script setup>
import { useTemplateRef, computed } from 'vue'
import OhhhVueCalendar from './packages/Calendar/Calendar.vue'
import '/src/packages/Calendar/style/mobile/mobile.scss'

const calendarRef = useTemplateRef('calendarRef')

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

// 倒计时功能测试数据
// 设置一个未来的日期（比如从今天开始的30天后）
const countDownDate = computed(() => {
  const date = new Date()
  date.setDate(date.getDate() + 30)
  return date
})

const countDownTitle = '产品上线'
const countDownColor = '#ff6b6b' // 使用一个醒目的红色

function onSelectChange(date) {
  console.log(date)
}
</script>
