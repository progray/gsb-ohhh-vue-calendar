<template>
  <div class="app-container" :style="containerStyle">
    <!-- Debug 模式开关 -->
    <div class="debug-toggle">
      <label class="debug-label">
        <input type="checkbox" v-model="debugMode" class="debug-checkbox" />
        <span class="debug-text">Debug 模式</span>
      </label>
    </div>

    <!-- 状态说明 -->
    <div class="status-info">
      <span>当前月份开花数量: {{ currentMonthFlowerCount }}</span>
    </div>

    <ohhh-vue-calendar
      ref="calendarRef"
      :week-start="1"
      @select-change="onSelectChange"
    >
      <template #day-label="{ date }">
        <div
          class="plant-wrapper"
          @click.stop="handleDateClick(date)"
        >
          <div
            v-if="shouldShowPlant(date)"
            class="plant-container"
            :class="getPlantClass(date)"
          >
            <div class="plant">
              <div class="plant-stem"></div>
              <div class="plant-leaves">
                <div class="leaf leaf-1"></div>
                <div class="leaf leaf-2"></div>
                <div class="leaf leaf-3"></div>
                <div class="leaf leaf-4"></div>
              </div>
              <div class="plant-flowers" v-if="getPlantState(date) === 'flower'">
                <div class="flower flower-1"></div>
                <div class="flower flower-2"></div>
                <div class="flower flower-3"></div>
                <div class="flower flower-4"></div>
                <div class="flower flower-5"></div>
                <div class="flower-center"></div>
              </div>
            </div>
          </div>
          <div v-else class="plant-placeholder"></div>
        </div>
      </template>
    </ohhh-vue-calendar>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import OhhhVueCalendar from './packages/Calendar/Calendar.vue'
import '/src/packages/Calendar/style/mobile/mobile.scss'

const calendarRef = ref(null)
const debugMode = ref(false)

// 打卡记录：存储日期字符串 YYYY-MM-DD
const checkinDates = ref([
  '2026-04-20',
  '2026-04-21',
  '2026-04-22',
  '2026-04-23',
  '2026-04-24',
  '2026-04-25',
  '2026-04-26',
  '2026-04-27'
])

// 获取今天的日期字符串
function getTodayStr() {
  const now = new Date()
  return formatDate(now)
}

// 格式化日期为 YYYY-MM-DD
function formatDate(date) {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 检查日期是否在未来
function isFutureDate(date) {
  const dateStr = formatDate(date)
  const todayStr = getTodayStr()
  return dateStr > todayStr
}

// 检查日期是否已打卡
function isCheckedIn(date) {
  const dateStr = formatDate(date)
  return checkinDates.value.includes(dateStr)
}

// 获取前一天的日期
function getPrevDay(date) {
  const d = new Date(date)
  d.setDate(d.getDate() - 1)
  return d
}

// 计算从某一天向前的连续打卡天数
function getConsecutiveDays(date) {
  let consecutive = 0
  let currentDate = new Date(date)

  while (isCheckedIn(currentDate)) {
    consecutive++
    currentDate = getPrevDay(currentDate)
  }

  return consecutive
}

// 检查是否断签（前一天打卡了，今天没打卡）
function isWithered(date) {
  const targetDateStr = formatDate(date)
  const todayStr = getTodayStr()

  // 如果日期在未来，不显示枯萎
  if (targetDateStr > todayStr) {
    return false
  }

  // 如果当天已打卡，不是枯萎
  if (isCheckedIn(date)) {
    return false
  }

  // 检查前一天是否打卡了
  const prevDay = getPrevDay(date)
  if (isCheckedIn(prevDay)) {
    // 检查前一天是否有连续打卡记录（至少1天）
    const prevConsecutive = getConsecutiveDays(prevDay)
    return prevConsecutive >= 1
  }

  return false
}

// 检查是否应该显示植物
function shouldShowPlant(date) {
  const state = getPlantState(date)
  return state !== 'none'
}

// 获取植物状态
function getPlantState(date) {
  const targetDateStr = formatDate(date)
  const todayStr = getTodayStr()

  // 未来日期不显示植物（除非在Debug模式下）
  if (targetDateStr > todayStr && !debugMode.value) {
    return 'none'
  }

  // 检查是否枯萎
  if (isWithered(date)) {
    return 'withered'
  }

  // 检查是否打卡
  if (!isCheckedIn(date)) {
    return 'none'
  }

  // 计算连续打卡天数
  const consecutive = getConsecutiveDays(date)

  if (consecutive >= 7) {
    return 'flower'
  } else if (consecutive >= 3) {
    return 'tree'
  } else if (consecutive >= 1) {
    return 'seedling'
  }

  return 'none'
}

// 获取植物的 CSS 类名
function getPlantClass(date) {
  const state = getPlantState(date)
  return {
    'plant-seedling': state === 'seedling',
    'plant-tree': state === 'tree',
    'plant-flower': state === 'flower',
    'plant-withered': state === 'withered'
  }
}

// 处理日期点击
function handleDateClick(date) {
  const dateStr = formatDate(date)
  const todayStr = getTodayStr()

  if (debugMode.value) {
    // Debug 模式：切换打卡状态
    const index = checkinDates.value.indexOf(dateStr)
    if (index > -1) {
      checkinDates.value.splice(index, 1)
    } else {
      checkinDates.value.push(dateStr)
    }
    // 触发响应式更新
    checkinDates.value = [...checkinDates.value]
  } else {
    // 正常模式：只能打卡今天
    if (dateStr === todayStr) {
      if (!checkinDates.value.includes(dateStr)) {
        checkinDates.value.push(dateStr)
        checkinDates.value = [...checkinDates.value]
      }
    }
  }
}

function onSelectChange(date) {
  console.log('selected:', formatDate(date), 'state:', getPlantState(date))
}

// 计算当前月份的开花数量
const currentMonthFlowerCount = computed(() => {
  let count = 0
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()

  // 遍历当月所有日期
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day)
    if (getPlantState(date) === 'flower') {
      count++
    }
  }
  return count
})

// 计算容器背景样式
const containerStyle = computed(() => {
  const maxFlowers = 15
  const flowerCount = Math.min(currentMonthFlowerCount.value, maxFlowers)
  const greenIntensity = flowerCount / maxFlowers

  // 从淡灰色到淡绿色的渐变
  const baseR = 245
  const baseG = 245
  const baseB = 245

  const r = Math.round(baseR - greenIntensity * 30)
  const g = Math.round(baseG + greenIntensity * 10)
  const b = Math.round(baseB - greenIntensity * 20)

  return {
    '--forest-bg-rgb': `${r}, ${g}, ${b}`,
    '--forest-bg': `rgb(${r}, ${g}, ${b})`
  }
})
</script>

<style lang="scss">
.app-container {
  min-height: 100vh;
  background: var(--forest-bg, #f5f5f5);
  transition: background 0.5s ease;
  padding: 16px;
}

.debug-toggle {
  display: flex;
  justify-content: center;
  margin-bottom: 8px;
}

.debug-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}

.debug-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #409eff;
}

.debug-text {
  font-size: 14px;
  color: #606266;
}

.status-info {
  text-align: center;
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}

.plant-wrapper {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  width: 100%;
  height: 100%;
  cursor: pointer;
}

.plant-placeholder {
  width: 28px;
  height: 24px;
  background: rgba(0, 255, 0, 0.3);
}

.plant-container {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  width: 28px;
  height: 24px;
  cursor: pointer;
  position: relative;
  background: rgba(255, 0, 0, 0.3);
}

.plant {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  animation: plantGrowUp 0.5s ease-out forwards;
  transform-origin: bottom center;
}

@keyframes plantGrowUp {
  0% {
    transform: translateY(24px);
    opacity: 0;
  }
  60% {
    transform: translateY(-2px);
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
}

.plant-stem {
  width: 2px;
  border-radius: 1px;
  transition: all 0.3s ease;
}

.plant-leaves {
  position: relative;
  width: 16px;
  height: 12px;
  transition: all 0.3s ease;
}

.leaf {
  position: absolute;
  border-radius: 50% 0 50% 0;
  transition: all 0.3s ease;
}

.plant-flowers {
  position: absolute;
  top: -1px;
  left: 50%;
  transform: translateX(-50%);
  width: 14px;
  height: 14px;
  animation: flowerBloom 0.6s ease-out 0.3s forwards;
  opacity: 0;
}

@keyframes flowerBloom {
  0% {
    transform: translateX(-50%) scale(0);
    opacity: 0;
  }
  50% {
    transform: translateX(-50%) scale(1.2);
  }
  100% {
    transform: translateX(-50%) scale(1);
    opacity: 1;
  }
}

.flower {
  position: absolute;
  width: 5px;
  height: 5px;
  border-radius: 50%;
}

.flower-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #ffd93d;
}

.plant-container.plant-seedling .plant-stem {
  height: 8px;
  background: linear-gradient(to top, #52b788, #74c69d);
}

.plant-container.plant-seedling .plant-leaves {
  width: 12px;
  height: 8px;
}

.plant-container.plant-seedling .leaf {
  width: 5px;
  height: 4px;
}

.plant-container.plant-seedling .leaf-1 {
  top: 2px;
  left: 0;
  background: #74c69d;
  transform: rotate(-30deg);
}

.plant-container.plant-seedling .leaf-2 {
  top: 2px;
  right: 0;
  background: #74c69d;
  transform: rotate(30deg) scaleX(-1);
}

.plant-container.plant-seedling .leaf-3,
.plant-container.plant-seedling .leaf-4 {
  display: none;
}

.plant-container.plant-tree .plant-stem {
  height: 10px;
  background: linear-gradient(to top, #2d6a4f, #40916c, #52b788);
}

.plant-container.plant-tree .plant-leaves {
  width: 14px;
  height: 10px;
}

.plant-container.plant-tree .leaf {
  width: 6px;
  height: 5px;
}

.plant-container.plant-tree .leaf-1 {
  top: 3px;
  left: 0;
  background: #52b788;
  transform: rotate(-40deg);
}

.plant-container.plant-tree .leaf-2 {
  top: 3px;
  right: 0;
  background: #52b788;
  transform: rotate(40deg) scaleX(-1);
}

.plant-container.plant-tree .leaf-3 {
  top: 0;
  left: 2px;
  background: #74c69d;
  transform: rotate(-60deg);
  width: 5px;
  height: 3px;
}

.plant-container.plant-tree .leaf-4 {
  top: 0;
  right: 2px;
  background: #74c69d;
  transform: rotate(60deg) scaleX(-1);
  width: 5px;
  height: 3px;
}

.plant-container.plant-flower .plant-stem {
  height: 11px;
  background: linear-gradient(to top, #1b4332, #2d6a4f, #40916c);
}

.plant-container.plant-flower .plant-leaves {
  width: 16px;
  height: 12px;
}

.plant-container.plant-flower .leaf {
  width: 7px;
  height: 5px;
}

.plant-container.plant-flower .leaf-1 {
  top: 4px;
  left: 0;
  background: #40916c;
  transform: rotate(-45deg);
}

.plant-container.plant-flower .leaf-2 {
  top: 4px;
  right: 0;
  background: #40916c;
  transform: rotate(45deg) scaleX(-1);
}

.plant-container.plant-flower .leaf-3 {
  top: 1px;
  left: 2px;
  background: #52b788;
  transform: rotate(-65deg);
  width: 5px;
  height: 4px;
}

.plant-container.plant-flower .leaf-4 {
  top: 1px;
  right: 2px;
  background: #52b788;
  transform: rotate(65deg) scaleX(-1);
  width: 5px;
  height: 4px;
}

.plant-container.plant-flower .flower-1 {
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #ff6b9d, #ff8fab);
}

.plant-container.plant-flower .flower-2 {
  top: 3px;
  right: 0;
  background: linear-gradient(135deg, #ff6b9d, #ff8fab);
}

.plant-container.plant-flower .flower-3 {
  bottom: 0;
  right: 1px;
  background: linear-gradient(135deg, #ff6b9d, #ff8fab);
}

.plant-container.plant-flower .flower-4 {
  bottom: 0;
  left: 1px;
  background: linear-gradient(135deg, #ff6b9d, #ff8fab);
}

.plant-container.plant-flower .flower-5 {
  top: 3px;
  left: 0;
  background: linear-gradient(135deg, #ff6b9d, #ff8fab);
}

.plant-container.plant-withered .plant {
  animation: none;
  opacity: 1;
}

.plant-container.plant-withered .plant-stem {
  height: 9px;
  background: linear-gradient(to top, #8b7355, #a0896c, #b8a88a);
  transform: rotate(-8deg);
  transform-origin: bottom center;
}

.plant-container.plant-withered .plant-leaves {
  width: 12px;
  height: 9px;
  transform: rotate(-8deg);
  transform-origin: bottom center;
}

.plant-container.plant-withered .leaf {
  width: 5px;
  height: 3px;
  border-radius: 40% 0 40% 0;
}

.plant-container.plant-withered .leaf-1 {
  top: 3px;
  left: 0;
  background: #a0896c;
  transform: rotate(-20deg) scale(0.8);
  opacity: 0.8;
}

.plant-container.plant-withered .leaf-2 {
  top: 3px;
  right: 0;
  background: #a0896c;
  transform: rotate(20deg) scaleX(-1) scale(0.8);
  opacity: 0.8;
}

.plant-container.plant-withered .leaf-3 {
  top: 0;
  left: 2px;
  background: #b8a88a;
  transform: rotate(-40deg) scale(0.6);
  opacity: 0.6;
}

.plant-container.plant-withered .leaf-4 {
  top: 0;
  right: 2px;
  background: #b8a88a;
  transform: rotate(40deg) scaleX(-1) scale(0.6);
  opacity: 0.6;
}

.plant-container.plant-withered .plant-flowers {
  animation: none;
  opacity: 0.4;
  transform: translateX(-50%) scale(0.7);
}

.plant-container.plant-withered .flower {
  background: linear-gradient(135deg, #8b7355, #a0896c);
}

.plant-container.plant-withered .flower-center {
  background: #8b7355;
}

.plant-container:hover .plant {
  transform: scale(1.15);
  transition: transform 0.2s ease;
}

.plant-container:active .plant {
  transform: scale(0.9);
}

.ohhh-calendar-day {
  position: relative;
  overflow: visible !important;
}

.ohhh-calendar-day--inner {
  overflow: visible !important;
  position: relative;
  height: auto !important;
  min-height: 50px !important;
  border-radius: 8px !important;
  padding: 4px 2px !important;
  flex-direction: column !important;
  justify-content: flex-start !important;
}

.ohhh-calendar-day--inner-value {
  line-height: 1.2;
  margin-bottom: 2px;
}

.ohhh-calendar-day--inner-label {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  width: 100%;
  height: 24px;
  min-height: 24px;
  flex-shrink: 0;
  margin-top: auto;
}
</style>
