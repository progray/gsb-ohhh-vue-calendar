<template>
  <div class="ohhh-timeline-container" ref="timelineRef">
    <!-- 时间轴头部 - 显示选中日期 -->
    <div class="ohhh-timeline-header">
      <div class="ohhh-timeline-header--title">
        {{ formattedDate }}
      </div>
      <div class="ohhh-timeline-header--subtitle">
        {{ weekdayName }}
      </div>
    </div>

    <!-- 时间轴主体 -->
    <div class="ohhh-timeline-body">
      <!-- 左侧时间标签列 -->
      <div class="ohhh-timeline-time-labels">
        <div
          v-for="hour in 24"
          :key="hour"
          class="ohhh-timeline-time-label"
          :style="{ height: hourHeight + 'px' }"
        >
          <span>{{ formatHour(hour - 1) }}</span>
        </div>
      </div>

      <!-- 右侧时间网格和事件 -->
      <div
        class="ohhh-timeline-grid"
        @click="onGridClick"
      >
        <!-- 时间网格背景线 -->
        <div class="ohhh-timeline-grid-lines">
          <div
            v-for="hour in 24"
            :key="hour"
            class="ohhh-timeline-grid-line"
            :style="{ height: hourHeight + 'px' }"
          />
        </div>

        <!-- 日程卡片 -->
        <div class="ohhh-timeline-events">
          <div
            v-for="(event, index) in events"
            :key="event.id || index"
            class="ohhh-timeline-event-card"
            :style="getEventCardStyle(event)"
            @click.stop="onEventClick(event)"
          >
            <div class="ohhh-timeline-event-card--title">
              {{ event.title || '未命名日程' }}
            </div>
            <div class="ohhh-timeline-event-card--time">
              {{ event.startTime }} - {{ event.endTime }}
            </div>
            <div v-if="event.description" class="ohhh-timeline-event-card--description">
              {{ event.description }}
            </div>
          </div>
        </div>

        <!-- 当前时间指示线 -->
        <div
          v-if="showCurrentTimeIndicator"
          class="ohhh-timeline-current-time"
          :style="{ top: currentTimeTop + 'px' }"
        >
          <div class="ohhh-timeline-current-time--dot"></div>
          <div class="ohhh-timeline-current-time--line"></div>
        </div>
      </div>
    </div>

    <!-- 点击时间点后的新建日程弹窗 -->
    <div
      v-if="showCreateEvent"
      class="ohhh-timeline-modal-overlay"
      @click="closeCreateEvent"
    >
      <div
        class="ohhh-timeline-modal"
        @click.stop
      >
        <div class="ohhh-timeline-modal--header">
          <div class="ohhh-timeline-modal--title">新建日程</div>
          <div class="ohhh-timeline-modal--close" @click="closeCreateEvent">
            ×
          </div>
        </div>
        <div class="ohhh-timeline-modal--body">
          <div class="ohhh-timeline-modal--field">
            <label>标题</label>
            <input
              v-model="newEventForm.title"
              type="text"
              placeholder="请输入日程标题"
              class="ohhh-timeline-modal--input"
              ref="titleInputRef"
            />
          </div>
          <div class="ohhh-timeline-modal--field">
            <label>开始时间</label>
            <input
              v-model="newEventForm.startTime"
              type="time"
              class="ohhh-timeline-modal--input"
            />
          </div>
          <div class="ohhh-timeline-modal--field">
            <label>结束时间</label>
            <input
              v-model="newEventForm.endTime"
              type="time"
              class="ohhh-timeline-modal--input"
            />
          </div>
          <div class="ohhh-timeline-modal--field">
            <label>描述 (可选)</label>
            <textarea
              v-model="newEventForm.description"
              placeholder="请输入日程描述"
              class="ohhh-timeline-modal--textarea"
            ></textarea>
          </div>
        </div>
        <div class="ohhh-timeline-modal--footer">
          <button class="ohhh-timeline-modal--btn-cancel" @click="closeCreateEvent">
            取消
          </button>
          <button class="ohhh-timeline-modal--btn-confirm" @click="createNewEvent">
            确定
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { isSameDay } from './utils/index.js'

const props = defineProps({
  selectedDate: {
    type: Date,
    default: () => new Date()
  },
  events: {
    type: Array,
    default: () => []
  },
  hourHeight: {
    type: Number,
    default: 60
  },
  showCurrentTimeIndicator: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['create-event', 'click-event'])

const timelineRef = ref(null)
const titleInputRef = ref(null)
const showCreateEvent = ref(false)
const clickedHour = ref(0)
const clickedMinute = ref(0)

const newEventForm = ref({
  title: '',
  startTime: '09:00',
  endTime: '10:00',
  description: ''
})

const WEEKDAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

const formattedDate = computed(() => {
  const date = props.selectedDate
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
})

const weekdayName = computed(() => {
  return WEEKDAYS[props.selectedDate.getDay()]
})

const currentTimeTop = computed(() => {
  const now = new Date()
  if (!isSameDay(now, props.selectedDate)) {
    return -100
  }
  const hours = now.getHours()
  const minutes = now.getMinutes()
  return (hours + minutes / 60) * props.hourHeight
})

function formatHour(hour) {
  return hour.toString().padStart(2, '0') + ':00'
}

function getEventCardStyle(event) {
  const startTime = event.startTime || '09:00'
  const endTime = event.endTime || '10:00'
  
  const [startHour, startMin] = startTime.split(':').map(Number)
  const [endHour, endMin] = endTime.split(':').map(Number)
  
  const top = (startHour + startMin / 60) * props.hourHeight
  const height = (endHour - startHour + (endMin - startMin) / 60) * props.hourHeight
  
  return {
    top: `${top}px`,
    height: `${Math.max(height, props.hourHeight * 0.5)}px`,
    backgroundColor: event.color || 'var(--calendar-theme-color)'
  }
}

function onGridClick(e) {
  const gridRect = e.currentTarget.getBoundingClientRect()
  const y = e.clientY - gridRect.top
  const scrollTop = e.currentTarget.scrollTop || 0
  const actualY = y + scrollTop
  
  const totalHours = actualY / props.hourHeight
  clickedHour.value = Math.floor(totalHours)
  clickedMinute.value = Math.floor((totalHours - clickedHour.value) * 60)
  
  clickedHour.value = Math.max(0, Math.min(23, clickedHour.value))
  
  const timeStr = `${clickedHour.value.toString().padStart(2, '0')}:${clickedMinute.value.toString().padStart(2, '0')}`
  newEventForm.value = {
    title: '',
    startTime: timeStr,
    endTime: `${(clickedHour.value + 1).toString().padStart(2, '0')}:${clickedMinute.value.toString().padStart(2, '0')}`,
    description: ''
  }
  
  showCreateEvent.value = true
  
  nextTick(() => {
    if (titleInputRef.value) {
      titleInputRef.value.focus()
    }
  })
}

function onEventClick(event) {
  emit('click-event', event)
}

function closeCreateEvent() {
  showCreateEvent.value = false
  newEventForm.value = {
    title: '',
    startTime: '09:00',
    endTime: '10:00',
    description: ''
  }
}

function createNewEvent() {
  if (!newEventForm.value.title.trim()) {
    return
  }
  
  const newEvent = {
    id: Date.now().toString(),
    date: new Date(props.selectedDate),
    ...newEventForm.value
  }
  
  emit('create-event', newEvent)
  closeCreateEvent()
}

onMounted(() => {
  const hourToScroll = 8
  if (timelineRef.value) {
    const grid = timelineRef.value.querySelector('.ohhh-timeline-grid')
    if (grid) {
      grid.scrollTop = hourToScroll * props.hourHeight
    }
  }
})
</script>

<style scoped>
.ohhh-timeline-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--calendar-background);
  font-family:
    Open Sans,
    -apple-system,
    BlinkMacSystemFont,
    Helvetica Neue,
    Helvetica,
    Segoe UI,
    Arial,
    Roboto,
    PingFang SC,
    miui,
    Hiragino Sans GB,
    Microsoft Yahei,
    sans-serif;
}

.ohhh-timeline-header {
  display: flex;
  align-items: baseline;
  gap: 12px;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.ohhh-timeline-header--title {
  font-size: 18px;
  font-weight: 600;
  color: var(--calendar-text-color-level-1);
}

.ohhh-timeline-header--subtitle {
  font-size: 14px;
  color: var(--calendar-text-color-level-3);
}

.ohhh-timeline-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.ohhh-timeline-time-labels {
  width: 60px;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.6);
  border-right: 1px solid rgba(0, 0, 0, 0.05);
}

.ohhh-timeline-time-label {
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  padding-right: 8px;
  padding-top: 0;
  box-sizing: border-box;
  border-bottom: 1px solid rgba(0, 0, 0, 0.03);
}

.ohhh-timeline-time-label span {
  font-size: 12px;
  color: var(--calendar-text-color-level-3);
  transform: translateY(-6px);
}

.ohhh-timeline-grid {
  flex: 1;
  position: relative;
  overflow-y: auto;
  overflow-x: hidden;
  cursor: crosshair;
}

.ohhh-timeline-grid::-webkit-scrollbar {
  width: 6px;
}

.ohhh-timeline-grid::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.02);
}

.ohhh-timeline-grid::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
}

.ohhh-timeline-grid-lines {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.ohhh-timeline-grid-line {
  box-sizing: border-box;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.ohhh-timeline-events {
  position: absolute;
  inset: 8px 12px 8px 8px;
  pointer-events: none;
}

.ohhh-timeline-event-card {
  position: absolute;
  left: 0;
  right: 0;
  box-sizing: border-box;
  padding: 8px 10px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  opacity: 0.95;
  cursor: pointer;
  pointer-events: auto;
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.ohhh-timeline-event-card:hover {
  transform: scale(1.01);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.ohhh-timeline-event-card--title {
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ohhh-timeline-event-card--time {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.9);
  margin-top: 2px;
}

.ohhh-timeline-event-card--description {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 4px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.ohhh-timeline-current-time {
  position: absolute;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  pointer-events: none;
  z-index: 10;
}

.ohhh-timeline-current-time--dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ff4d4f;
  flex-shrink: 0;
}

.ohhh-timeline-current-time--line {
  flex: 1;
  height: 1px;
  background: #ff4d4f;
}

/* 新建日程弹窗 */
.ohhh-timeline-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.ohhh-timeline-modal {
  width: 90%;
  max-width: 400px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.ohhh-timeline-modal--header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.ohhh-timeline-modal--title {
  font-size: 16px;
  font-weight: 600;
  color: var(--calendar-text-color-level-1);
}

.ohhh-timeline-modal--close {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 20px;
  color: var(--calendar-text-color-level-3);
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.ohhh-timeline-modal--close:hover {
  background: rgba(0, 0, 0, 0.05);
}

.ohhh-timeline-modal--body {
  padding: 20px;
}

.ohhh-timeline-modal--field {
  margin-bottom: 16px;
}

.ohhh-timeline-modal--field:last-child {
  margin-bottom: 0;
}

.ohhh-timeline-modal--field label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--calendar-text-color-level-2);
  margin-bottom: 8px;
}

.ohhh-timeline-modal--input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  font-size: 14px;
  color: var(--calendar-text-color-level-1);
  background: rgba(255, 255, 255, 0.8);
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  box-sizing: border-box;
}

.ohhh-timeline-modal--input:focus {
  border-color: var(--calendar-theme-color);
  box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.1);
}

.ohhh-timeline-modal--textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  font-size: 14px;
  color: var(--calendar-text-color-level-1);
  background: rgba(255, 255, 255, 0.8);
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  resize: vertical;
  min-height: 80px;
  box-sizing: border-box;
  font-family: inherit;
}

.ohhh-timeline-modal--textarea:focus {
  border-color: var(--calendar-theme-color);
  box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.1);
}

.ohhh-timeline-modal--footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.ohhh-timeline-modal--btn-cancel,
.ohhh-timeline-modal--btn-confirm {
  padding: 8px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  outline: none;
}

.ohhh-timeline-modal--btn-cancel {
  background: rgba(0, 0, 0, 0.05);
  color: var(--calendar-text-color-level-2);
}

.ohhh-timeline-modal--btn-cancel:hover {
  background: rgba(0, 0, 0, 0.1);
}

.ohhh-timeline-modal--btn-confirm {
  background: var(--calendar-theme-color);
  color: #fff;
}

.ohhh-timeline-modal--btn-confirm:hover {
  opacity: 0.9;
}
</style>
