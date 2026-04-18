<template>
  <div class="app-container">
    <div style="padding: 16px; background: #f5f5f5; margin-bottom: 16px;">
      <h3 style="margin: 0 0 8px 0;">异步加载测试</h3>
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #666;">
        翻页时会自动触发 loadEvents 回调，模拟网络请求加载当前视图的事件数据
      </p>
      <p style="margin: 0; font-size: 14px; color: #666;">
        静态 events 数据和异步加载的数据会合并显示
      </p>
    </div>
    <ohhh-vue-calendar
      ref="calendarRef"
      :week-start="1"
      :markerDates="markerDates"
      :events="staticEvents"
      :load-events="loadEvents"
      :debounce="300"
      @select-change="onSelectChange"
      @events-loaded="onEventsLoaded"
      @load-error="onLoadError"
    />
  </div>
</template>

<script setup>
import { useTemplateRef } from 'vue'
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

// 静态 events 数据（兜底）
const staticEvents = [
  {
    id: 1,
    date: new Date(),
    title: '今天的静态事件',
    color: '#67c23a'
  },
  {
    id: 2,
    date: new Date(new Date().setDate(new Date().getDate() + 1)),
    title: '明天的静态事件',
    color: '#e6a23c'
  }
]

// 模拟异步加载事件的回调函数
async function loadEvents({ startDate, endDate }) {
  console.log('加载事件，范围:', startDate, '至', endDate)

  // 模拟网络请求延迟
  await new Promise(resolve => setTimeout(resolve, 800))

  // 生成模拟事件数据
  const events = []
  const currentDate = new Date(startDate)

  // 每隔几天生成一个事件
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay()

    // 只在工作日生成事件（模拟真实场景）
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      events.push({
        id: `event-${currentDate.getTime()}`,
        date: new Date(currentDate),
        title: `异步加载的事件 (${currentDate.getMonth() + 1}/${currentDate.getDate()})`,
        color: getRandomColor()
      })
    }

    currentDate.setDate(currentDate.getDate() + 3)
  }

  console.log('异步加载完成，事件数量:', events.length)
  return events
}

function getRandomColor() {
  const colors = ['#409eff', '#67c23a', '#e6a23c', '#909399', '#00d4ff']
  return colors[Math.floor(Math.random() * colors.length)]
}

function onSelectChange(date) {
  console.log('选中日期:', date)
}

function onEventsLoaded(events) {
  console.log('事件加载完成:', events)
}

function onLoadError(error) {
  console.error('事件加载失败:', error)
}
</script>
