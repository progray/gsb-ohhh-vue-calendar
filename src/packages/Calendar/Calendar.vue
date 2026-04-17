<template>
  <div
    class="ohhh-calendar-container"
    :style="{
      '--calendar-rows': renderRows,
      '--calendar-transition-duration': duration,
      '--translate-distance': transformDistance,
      '--transition-duration': transitionDuration
    }"
  >
    <!-- 顶部工具栏 -->
    <div v-if="showToolbar" class="ohhh-calendar-toolbar">
      <slot name="toolbar" :year="currentYear" :month="currentMonth" :viewMode="viewMode">
        <div v-html="icons.arrowDoubleLeft" class="ohhh-calendar-toolbar--icon" @click="changePageTo('prev-year')" />
        <div v-html="icons.arrowLeft" class="ohhh-calendar-toolbar--icon" @click="changePageTo('prev-page')" />
        <div class="ohhh-calendar-toolbar--text">{{ headerLabel }}</div>
        <div v-html="icons.arrowRight" class="ohhh-calendar-toolbar--icon" @click="changePageTo('next-page')" />
        <div v-html="icons.arrowDoubleRight" class="ohhh-calendar-toolbar--icon" @click="changePageTo('next-year')" />
      </slot>
    </div>

    <!-- 星期栏 -->
    <div v-if="showWeekdays" class="ohhh-calendar-weekdays">
      <div v-for="(day, index) in weekdays" :key="day" class="ohhh-calendar-weekdays--weekday">
        <slot name="weekday" :weekday="day" :index="(index + weekStart) % 7">{{ day }}</slot>
      </div>
    </div>

    <!-- 日历主体 -->
    <div ref="swp" class="ohhh-calendar-wrapper">
      <div
        v-for="(item, index) in allRenderDates"
        :key="index"
        :style="{ left: 100 * (index - 1) + '%' }"
        class="ohhh-calendar-days"
        @transitionend="onTransitionEnd"
      >
        <div
          v-for="dateObj in item"
          :key="dateObj.key"
          class="ohhh-calendar-day"
          :class="{
            'is-selected': isSameDay(dateObj.date, selected),
            'is-today': isSameDay(dateObj.date, new Date()),
            'other-month': !dateObj.current
          }"
          @click="handleDayClick(dateObj.date, $event)"
        >
          <div class="ohhh-calendar-day--inner">
            <div class="ohhh-calendar-day--inner-value">{{ dateObj.fullDate.date }}</div>
            <div class="ohhh-calendar-day--inner-label" v-if="$slots['day-label']">
              <slot name="day-label" :date="dateObj.date" />
            </div>
          </div>
          <div class="ohhh-calendar-day--marker" :style="{ background: _getMarkerColor(dateObj.date) }" />
          
          <!-- Emoji 状态显示区域 -->
          <div 
            v-if="getEmojisForDate(dateObj.date).length > 0" 
            class="ohhh-calendar-day--emojis"
          >
            <div
              v-for="(status, idx) in getEmojisForDate(dateObj.date)"
              :key="idx"
              class="ohhh-calendar-day--emoji"
              :style="{ zIndex: getEmojisForDate(dateObj.date).length - idx }"
              @click.stop="handleEmojiClick(dateObj.date, status.emoji, $event)"
              @mouseenter="showTooltip(status, $event)"
              @mouseleave="hideTooltip"
            >
              {{ status.emoji }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部工具栏 -->
    <div v-if="showFooter" class="ohhh-calendar-footer">
      <slot name="footer" :year="currentYear" :month="currentMonth" :viewMode="viewMode">
        <div
          v-html="viewMode === 'week' ? icons.arrowDown : icons.arrowUp"
          class="ohhh-calendar-footer--icon"
          @click="toggleViewMode"
        />
      </slot>
    </div>

    <!-- Emoji 选择器 -->
    <EmojiPicker
      :visible="showEmojiPicker"
      :target-date="activeDate"
      :position="pickerPosition"
      @select="handleEmojiSelect"
      @close="closeEmojiPicker"
    />

    <!-- Emoji 输入框 -->
    <EmojiInput
      :visible="showEmojiInput"
      :selected-emoji="selectedEmoji"
      :position="inputPosition"
      :initial-description="existingDescription"
      @confirm="handleInputConfirm"
      @close="closeEmojiInput"
    />

    <!-- 悬浮提示 -->
    <Teleport to="body">
      <Transition name="tooltip-fade">
        <div
          v-if="showTooltipFlag"
          class="emoji-tooltip"
          :style="tooltipStyle"
        >
          {{ tooltipContent }}
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, useTemplateRef, toRefs, ref } from 'vue'
import { useSwipe } from '@vueuse/core'
import { useCalendar } from './hooks/useCalendar.js'
import { useEmojiStatus } from './hooks/useEmojiStatus.js'
import { isSameDay, createWeekdays } from './utils'
import { icons } from './utils/icons.js'
import EmojiPicker from './components/EmojiPicker.vue'
import EmojiInput from './components/EmojiInput.vue'

const swipeRef = useTemplateRef('swp')

const emit = defineEmits(['select-change', 'view-change', 'emoji-change'])

const props = defineProps({
  initialSelectedDate: {
    type: Date,
    default: () => new Date()
  },
  initialViewMode: {
    type: String,
    default: 'month'
  },
  weekStart: {
    type: Number,
    default: 0
  },
  markerDates: {
    type: Array,
    default: () => []
  },
  showToolbar: {
    type: Boolean,
    default: true
  },
  showFooter: {
    type: Boolean,
    default: true
  },
  showWeekdays: {
    type: Boolean,
    default: true
  },
  duration: {
    type: String,
    default: '0.3s'
  }
})

const { initialSelectedDate, initialViewMode, weekStart, markerDates, duration } = toRefs(props)

const {
  selected,
  viewMode,
  currentYear,
  currentMonth,
  currentRenderDates,
  allRenderDates,
  transformDistance,
  transitionDuration,
  isInTransition,
  renderRows,
  switchPageToTargetDate,
  startTransitionAnimation,
  onTransitionEnd,
  toggleViewMode
} = useCalendar({ initialSelectedDate, initialViewMode, weekStart, duration }, emit)

const {
  getEmojisForDate,
  addEmojiStatus,
  removeEmojiStatus,
  hasEmoji
} = useEmojiStatus()

const showEmojiPicker = ref(false)
const showEmojiInput = ref(false)
const activeDate = ref(null)
const selectedEmoji = ref('')
const existingDescription = ref('')
const pickerPosition = ref({ x: 0, y: 0 })
const inputPosition = ref({ x: 0, y: 0 })

const showTooltipFlag = ref(false)
const tooltipContent = ref('')
const tooltipStyle = ref({})

const headerLabel = computed(() => `${currentYear.value}年${currentMonth.value + 1}月`)
const weekdays = createWeekdays(weekStart.value)
const markerDateList = computed(() =>
  markerDates.value.map(item => ({
    date: new Date(typeof item === 'object' && item.date ? item.date : item),
    color: typeof item === 'object' && item.color ? item.color : 'var(--calendar-theme-color)'
  }))
)

const { lengthX } = useSwipe(swipeRef, {
  threshold: 0,
  onSwipe: () => {
    if (isInTransition.value) return
    transformDistance.value = -lengthX.value + 'px'
  },
  onSwipeEnd: (_, direction) => {
    if (isInTransition.value) return
    if (direction === 'left') {
      changePageTo('next-page')
    } else if (direction === 'right') {
      changePageTo('prev-page')
    } else {
      startTransitionAnimation(direction)
    }
  }
})

function _normalize(param) {
  if (!param) {
    throw new Error('参数不能为空')
  }
  if (param === 'prev-page') {
    if (viewMode.value === 'week') {
      return new Date(
        new Date(currentRenderDates.value[0].date).setDate(currentRenderDates.value[0].date.getDate() - 1)
      )
    } else if (viewMode.value === 'month') {
      return new Date(currentYear.value, currentMonth.value - 1)
    }
  }
  if (param === 'next-page') {
    if (viewMode.value === 'week') {
      return new Date(
        new Date(currentRenderDates.value[6].date).setDate(currentRenderDates.value[6].date.getDate() + 1)
      )
    } else if (viewMode.value === 'month') {
      return new Date(currentYear.value, currentMonth.value + 1)
    }
  }
  if (param === 'prev-year') {
    return new Date(currentYear.value - 1, currentMonth.value)
  }
  if (param === 'next-year') {
    return new Date(currentYear.value + 1, currentMonth.value)
  }
  const targetDate = new Date(param)
  if (!Number.isNaN(targetDate.getTime())) {
    return targetDate
  }
  throw new Error('日期不合法')
}

function changePageTo(param) {
  const targetDate = _normalize(param)
  switchPageToTargetDate(targetDate)
}

function changeSelectedDate(date) {
  changePageTo(date)
  if (!isSameDay(new Date(date), selected.value)) {
    selected.value = new Date(date)
    emit('select-change', selected.value)
  }
}

function _getMarkerColor(date) {
  return markerDateList.value.find(d => isSameDay(d.date, date))?.color
}

function handleDayClick(date, event) {
  changeSelectedDate(date)
  activeDate.value = date
  
  const rect = event.currentTarget.getBoundingClientRect()
  pickerPosition.value = {
    x: rect.left + rect.width / 2 - 140,
    y: rect.bottom + 8
  }
  
  showEmojiPicker.value = true
}

function handleEmojiClick(date, emoji, event) {
  event.stopPropagation()
  
  const emojis = getEmojisForDate(date)
  const status = emojis.find(s => s.emoji === emoji)
  
  if (status) {
    activeDate.value = date
    selectedEmoji.value = emoji
    existingDescription.value = status.description || ''
    
    const rect = event.currentTarget.getBoundingClientRect()
    inputPosition.value = {
      x: rect.left - 100,
      y: rect.bottom + 8
    }
    
    showEmojiInput.value = true
  }
}

function handleEmojiSelect(emoji) {
  selectedEmoji.value = emoji
  
  if (hasEmoji(activeDate.value, emoji)) {
    removeEmojiStatus(activeDate.value, emoji)
    emit('emoji-change', {
      date: activeDate.value,
      emoji: emoji,
      action: 'remove',
      emojis: getEmojisForDate(activeDate.value)
    })
    closeEmojiPicker()
  } else {
    existingDescription.value = ''
    inputPosition.value = { ...pickerPosition.value }
    showEmojiPicker.value = false
    showEmojiInput.value = true
  }
}

function handleInputConfirm(description) {
  addEmojiStatus(activeDate.value, selectedEmoji.value, description)
  emit('emoji-change', {
    date: activeDate.value,
    emoji: selectedEmoji.value,
    description: description,
    action: 'add',
    emojis: getEmojisForDate(activeDate.value)
  })
  closeEmojiInput()
}

function closeEmojiPicker() {
  showEmojiPicker.value = false
  activeDate.value = null
}

function closeEmojiInput() {
  showEmojiInput.value = false
  selectedEmoji.value = ''
  existingDescription.value = ''
}

function showTooltip(status, event) {
  if (!status.description) return
  
  tooltipContent.value = status.description
  
  const rect = event.currentTarget.getBoundingClientRect()
  tooltipStyle.value = {
    left: rect.left + rect.width / 2 + 'px',
    top: rect.top - 8 + 'px'
  }
  
  showTooltipFlag.value = true
}

function hideTooltip() {
  showTooltipFlag.value = false
}

defineExpose({
  toggleViewMode,
  changePageTo,
  changeSelectedDate,
  getEmojisForDate,
  addEmojiStatus,
  removeEmojiStatus
})
</script>

<style scoped>
.ohhh-calendar-day {
  position: relative;
}

.ohhh-calendar-day--emojis {
  position: absolute;
  bottom: 2px;
  right: 4px;
  display: flex;
  flex-direction: row-reverse;
  pointer-events: auto;
}

.ohhh-calendar-day--emoji {
  font-size: 14px;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  transition: transform 0.2s ease, z-index 0.2s ease;
  margin-left: -6px;
  border: 1px solid rgba(255, 255, 255, 0.8);
}

.ohhh-calendar-day--emoji:first-child {
  margin-left: 0;
}

.ohhh-calendar-day--emoji:hover {
  transform: scale(1.3);
  z-index: 100 !important;
}

.emoji-tooltip {
  position: fixed;
  transform: translate(-50%, -100%);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 13px;
  color: #303133;
  box-shadow: 
    0 4px 16px rgba(0, 0, 0, 0.12),
    0 2px 4px rgba(0, 0, 0, 0.08);
  z-index: 10000;
  max-width: 200px;
  word-break: break-word;
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.emoji-tooltip::after {
  content: '';
  position: absolute;
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 6px solid rgba(255, 255, 255, 0.95);
}

.tooltip-fade-enter-active,
.tooltip-fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.tooltip-fade-enter-from,
.tooltip-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, -100%) translateY(-4px);
}
</style>
