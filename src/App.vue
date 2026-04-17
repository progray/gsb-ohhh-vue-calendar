<template>
  <div class="app-container">
    <ohhh-vue-calendar ref="calendarRef" :week-start="1" :markerDates="markerDates" @select-change="onSelectChange" />
    <transition name="slide-up">
      <div v-if="selectedWorkout" class="workout-card">
        <div class="workout-card-header">
          <span class="workout-date">{{ formatDate(selectedWorkout.date) }}</span>
          <span class="workout-type" :class="selectedWorkout.type">{{ selectedWorkout.type === 'workout' ? '训练日' : '休息日' }}</span>
          <button class="close-btn" @click="closeWorkoutCard">✕</button>
        </div>
        <div v-if="selectedWorkout.type === 'workout'" class="workout-content">
          <h3 class="workout-title">{{ selectedWorkout.title }}</h3>
          <div class="workout-stats">
            <div class="stat-item">
              <span class="stat-value">{{ selectedWorkout.duration }}</span>
              <span class="stat-label">时长</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ selectedWorkout.calories }}</span>
              <span class="stat-label">消耗卡路里</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ selectedWorkout.exercises.length }}</span>
              <span class="stat-label">动作数量</span>
            </div>
          </div>
          <div class="exercises-list">
            <h4>训练动作</h4>
            <div v-for="(exercise, index) in selectedWorkout.exercises" :key="index" class="exercise-item">
              <span class="exercise-index">{{ index + 1 }}</span>
              <div class="exercise-info">
                <span class="exercise-name">{{ exercise.name }}</span>
                <span class="exercise-detail">{{ exercise.detail }}</span>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="rest-content">
          <div class="rest-icon">💤</div>
          <p class="rest-text">今天是休息日，好好休息一下吧！</p>
          <p class="rest-tip">{{ selectedWorkout.tip || '充足的睡眠和营养是恢复的关键。' }}</p>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useTemplateRef } from 'vue'
import OhhhVueCalendar from './packages/Calendar/Calendar.vue'
import '/src/packages/Calendar/style/mobile/mobile.scss'

const calendarRef = useTemplateRef('calendarRef')

const trainingRecords = [
  {
    date: '2026-04-08',
    type: 'workout',
    color: '#22c55e',
    title: '胸部力量训练',
    duration: '60分钟',
    calories: '450卡',
    exercises: [
      { name: '杠铃平板卧推', detail: '4组 × 12次' },
      { name: '上斜哑铃飞鸟', detail: '3组 × 15次' },
      { name: '俯卧撑', detail: '3组 × 20次' },
      { name: '蝴蝶机夹胸', detail: '3组 × 12次' }
    ]
  },
  {
    date: '2026-04-10',
    type: 'workout',
    color: '#22c55e',
    title: '背部力量训练',
    duration: '55分钟',
    calories: '380卡',
    exercises: [
      { name: '引体向上', detail: '4组 × 10次' },
      { name: '杠铃划船', detail: '4组 × 12次' },
      { name: '单臂哑铃划船', detail: '3组 × 12次' },
      { name: '坐姿绳索划船', detail: '3组 × 15次' }
    ]
  },
  {
    date: '2026-04-12',
    type: 'rest',
    color: '#6b7280',
    tip: '让肌肉有时间恢复，为下一次训练做准备。'
  },
  {
    date: '2026-04-14',
    type: 'workout',
    color: '#22c55e',
    title: '腿部力量训练',
    duration: '70分钟',
    calories: '520卡',
    exercises: [
      { name: '杠铃深蹲', detail: '5组 × 10次' },
      { name: '腿举', detail: '4组 × 15次' },
      { name: '腿弯举', detail: '3组 × 12次' },
      { name: '站立提踵', detail: '4组 × 20次' }
    ]
  },
  {
    date: '2026-04-15',
    type: 'workout',
    color: '#22c55e',
    title: '肩部力量训练',
    duration: '50分钟',
    calories: '350卡',
    exercises: [
      { name: '杠铃推举', detail: '4组 × 12次' },
      { name: '侧平举', detail: '3组 × 15次' },
      { name: '前平举', detail: '3组 × 12次' },
      { name: '俯身飞鸟', detail: '3组 × 12次' }
    ]
  },
  {
    date: '2026-04-16',
    type: 'rest',
    color: '#6b7280',
    tip: '休息日也可以做一些轻度拉伸活动。'
  },
  {
    date: '2026-04-18',
    type: 'workout',
    color: '#22c55e',
    title: '手臂力量训练',
    duration: '45分钟',
    calories: '300卡',
    exercises: [
      { name: '杠铃弯举', detail: '4组 × 12次' },
      { name: '锤式弯举', detail: '3组 × 12次' },
      { name: '仰卧臂屈伸', detail: '4组 × 12次' },
      { name: '绳索下压', detail: '3组 × 15次' }
    ]
  },
  {
    date: '2026-04-20',
    type: 'workout',
    color: '#22c55e',
    title: '核心训练',
    duration: '40分钟',
    calories: '280卡',
    exercises: [
      { name: '卷腹', detail: '4组 × 20次' },
      { name: '平板支撑', detail: '4组 × 60秒' },
      { name: '空中蹬车', detail: '3组 × 20次' },
      { name: '俄罗斯转体', detail: '3组 × 30次' }
    ]
  },
  {
    date: '2026-04-21',
    type: 'workout',
    color: '#22c55e',
    title: '有氧训练',
    duration: '45分钟',
    calories: '400卡',
    exercises: [
      { name: '慢跑', detail: '30分钟' },
      { name: '开合跳', detail: '3组 × 1分钟' },
      { name: '高抬腿跑', detail: '3组 × 30秒' },
      { name: '箭步蹲跳', detail: '3组 × 10次' }
    ]
  },
  {
    date: '2026-04-23',
    type: 'rest',
    color: '#6b7280',
    tip: '保持充足的水分摄入，帮助身体恢复。'
  }
]

const markerDates = computed(() => {
  return trainingRecords.map(record => ({
    date: record.date,
    color: record.color
  }))
})

const selectedWorkout = ref(null)

function formatDate(dateStr) {
  const date = new Date(dateStr)
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return `${date.getMonth() + 1}月${date.getDate()}日 ${weekDays[date.getDay()]}`
}

function isSameDay(date1, date2) {
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  )
}

function onSelectChange(date) {
  const record = trainingRecords.find(r => isSameDay(r.date, date))
  selectedWorkout.value = record || null
}

function closeWorkoutCard() {
  selectedWorkout.value = null
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
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;
}

.ohhh-calendar-container {
  --calendar-theme-color: #f97316;
  --calendar-theme-color-light: rgba(249, 115, 22, 0.2);

  --calendar-text-color-level-1: #f9fafb;
  --calendar-text-color-level-2: #d1d5db;
  --calendar-text-color-level-3: #9ca3af;
  --calendar-text-color-level-4: #6b7280;
  --calendar-text-color-level-5: #4b5563;

  --calendar-background: #1f2937;
  --calendar-row-height: 70px;

  --calendar-icon-size: 24px;
  --calendar-icon-color: #9ca3af;

  --calendar-toolbar-font-size: 18px;
  --calendar-toolbar-icon-size: 24px;
  --calendar-toolbar-icon-color: #9ca3af;
  --calendar-toolbar-column-gap: 16px;
  --calendar-toolbar-padding: 16px 20px;

  --calendar-footer-icon-size: 24px;
  --calendar-footer-icon-color: #9ca3af;
  --calendar-footer-padding: 16px;

  --calendar-weekdays-height: 40px;
  --calendar-weekdays-font-size: 14px;
  --calendar-weekdays-color: #9ca3af;

  --calendar-days-value-font-size: 16px;
  --calendar-days-value-color: #f9fafb;
  --calendar-days-label-font-size: 10px;
  --calendar-days-label-color: #d1d5db;

  --calendar-days-today-color: #f9fafb;
  --calendar-days-today-background: rgba(249, 115, 22, 0.3);
  --calendar-days-selected-color: #fff;
  --calendar-days-selected-background: #f97316;
  --calendar-days-other-month-color: #4b5563;

  --calendar-days-inner-size: 40px;
  --calendar-days-inner-width: var(--calendar-days-inner-size);
  --calendar-days-inner-height: var(--calendar-days-inner-size);
  --calendar-days-inner-padding: 4px;
  --calendar-days-inner-radius: 50%;
  --calendar-days-inner-background: transparent;

  --calendar-days-marker-top-gap: 6px;
  --calendar-days-marker-size: 6px;
  --calendar-days-marker-color: #f97316;

  background: var(--calendar-background);
  border-radius: 16px;
  padding: 8px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.ohhh-calendar-weekdays--weekday:nth-child(6),
.ohhh-calendar-weekdays--weekday:nth-child(7),
.ohhh-calendar-day:not(.other-month) .ohhh-calendar-day--inner-value[data-weekend="true"] {
  color: #ef4444 !important;
}

.ohhh-calendar-day.is-today .ohhh-calendar-day--inner {
  border: 2px solid #f97316;
}

.ohhh-calendar-day.is-today .ohhh-calendar-day--inner-value {
  color: #f97316;
  font-weight: 700;
}

.workout-card {
  margin-top: 20px;
  background: #1f2937;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.workout-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #374151;
}

.workout-date {
  font-size: 16px;
  font-weight: 600;
  color: #f9fafb;
}

.workout-type {
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
}

.workout-type.workout {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.workout-type.rest {
  background: rgba(107, 114, 128, 0.2);
  color: #9ca3af;
}

.close-btn {
  background: transparent;
  border: none;
  color: #9ca3af;
  font-size: 20px;
  cursor: pointer;
  padding: 4px;
  line-height: 1;
}

.close-btn:hover {
  color: #f9fafb;
}

.workout-content .workout-title {
  font-size: 20px;
  font-weight: 700;
  color: #f9fafb;
  margin-bottom: 16px;
}

.workout-stats {
  display: flex;
  justify-content: space-around;
  margin-bottom: 24px;
  padding: 16px;
  background: #111827;
  border-radius: 12px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 20px;
  font-weight: 700;
  color: #f97316;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: #9ca3af;
  margin-top: 4px;
}

.exercises-list h4 {
  font-size: 16px;
  font-weight: 600;
  color: #f9fafb;
  margin-bottom: 12px;
}

.exercise-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #374151;
}

.exercise-item:last-child {
  border-bottom: none;
}

.exercise-index {
  width: 28px;
  height: 28px;
  background: rgba(249, 115, 22, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  color: #f97316;
  margin-right: 12px;
}

.exercise-info {
  display: flex;
  flex-direction: column;
}

.exercise-name {
  font-size: 15px;
  font-weight: 500;
  color: #f9fafb;
}

.exercise-detail {
  font-size: 13px;
  color: #9ca3af;
  margin-top: 2px;
}

.rest-content {
  text-align: center;
  padding: 20px 0;
}

.rest-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.rest-text {
  font-size: 18px;
  font-weight: 600;
  color: #f9fafb;
  margin-bottom: 12px;
}

.rest-tip {
  font-size: 14px;
  color: #9ca3af;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
