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

    <!-- 搜索栏 -->
    <div v-if="showSearch" class="ohhh-calendar-search">
      <input
        v-model="searchKeyword"
        type="text"
        placeholder="搜索日程..."
        class="ohhh-calendar-search--input"
        @input="handleSearch"
      />
      <div v-if="searchKeyword" class="ohhh-calendar-search--clear" @click="clearSearch">×</div>
      <!-- 搜索结果统计和导航 -->
      <div v-if="searchKeyword && filteredEventsCount > 0" class="ohhh-calendar-search--stats">
        <span class="ohhh-calendar-search--count">{{ currentSearchIndex + 1 }}/{{ filteredEventsCount }}</span>
        <button 
          class="ohhh-calendar-search--nav-btn"
          @click.stop="navigateToPrevSearchResult"
          :disabled="currentSearchIndex <= 0"
        >
          ‹
        </button>
        <button 
          class="ohhh-calendar-search--nav-btn"
          @click.stop="navigateToNextSearchResult"
          :disabled="currentSearchIndex >= filteredEventsCount - 1"
        >
          ›
        </button>
      </div>
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
            'other-month': !dateObj.current,
            'has-events': getDayEvents(dateObj.date).length > 0
          }"
          @click="changeSelectedDate(dateObj.date)"
          @dblclick.stop="openCreateModal(dateObj.date)"
          @drop="handleDrop($event, dateObj.date)"
          @dragover.prevent
        >
          <div class="ohhh-calendar-day--inner">
            <div class="ohhh-calendar-day--inner-value">{{ dateObj.fullDate.date }}</div>
            <div class="ohhh-calendar-day--inner-label" v-if="$slots['day-label']">
              <slot name="day-label" :date="dateObj.date" />
            </div>
          </div>
          <div class="ohhh-calendar-day--marker" :style="{ background: _getMarkerColor(dateObj.date) }" />
          
          <!-- 事件列表 -->
          <div class="ohhh-calendar-day--events" @dblclick.stop="openCreateModal(dateObj.date)">
            <div
              v-for="event in getDisplayEvents(dateObj.date)"
              :key="event.id"
              class="ohhh-calendar-day--event"
              :class="{
                'has-conflict': hasConflict(event),
                'is-highlighted': isSearchResultHighlighted(event)
              }"
              :style="{
                '--event-color': event.color,
                '--event-bg-color': event.color + '20'
              }"
              :draggable="draggable"
              @click.stop="handleEventClick(event)"
              @dblclick.stop="openEditModal(event)"
              @dragstart="handleDragStart($event, event)"
              @dragend="handleDragEnd"
            >
              <div class="ohhh-calendar-day--event-dot"></div>
              <span class="ohhh-calendar-day--event-title">{{ event.title }}</span>
              <div v-if="hasConflict(event) && showConflictWarning" class="ohhh-calendar-day--event-conflict">⚠</div>
            </div>
            <div 
              v-if="getDayEvents(dateObj.date).length > maxEventsPerDay" 
              class="ohhh-calendar-day--event-more"
              @click.stop="showMoreEvents(dateObj.date)"
            >
              +{{ getDayEvents(dateObj.date).length - maxEventsPerDay }}
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
    
    <!-- 事件编辑弹窗 -->
    <EventModal
      v-model:visible="modalVisible"
      :event="editingEvent"
      :initial-date="modalInitialDate"
      @close="closeModal"
      @submit="handleModalSubmit"
      @delete="handleModalDelete"
    />
  </div>
</template>

<script setup>
import { computed, useTemplateRef, toRefs, ref } from 'vue'
import { useSwipe } from '@vueuse/core'
import { useCalendar } from './hooks/useCalendar.js'
import { isSameDay, createWeekdays } from './utils'
import { icons } from './utils/icons.js'
import { getEventsByDate, checkEventConflict, CalendarEvent } from './utils/eventUtils.js'
import EventModal from './components/EventModal.vue'

const swipeRef = useTemplateRef('swp')

const emit = defineEmits(['select-change', 'view-change', 'event-add', 'event-update', 'event-delete', 'event-click'])

const props = defineProps({
  // 初始选中的日期
  initialSelectedDate: {
    type: Date,
    default: () => new Date()
  },
  // 初始视图模式
  initialViewMode: {
    type: String,
    default: 'month' // month or week
  },
  // 以周几作为每周的起始
  weekStart: {
    type: Number,
    default: 0 // 0: Sunday, 1: Monday, etc.
  },
  // 标记的日期
  markerDates: {
    type: Array,
    default: () => []
  },
  // 是否显示顶部工具栏
  showToolbar: {
    type: Boolean,
    default: true
  },
  // 是否显示底部工具栏
  showFooter: {
    type: Boolean,
    default: true
  },
  // 是否显示weekdays栏
  showWeekdays: {
    type: Boolean,
    default: true
  },
  // 是否显示搜索栏
  showSearch: {
    type: Boolean,
    default: true
  },
  // 过渡动画时长
  duration: {
    type: String,
    default: '0.3s'
  },
  // 事件数据
  events: {
    type: Array,
    default: () => []
  },
  // 是否允许拖拽事件
  draggable: {
    type: Boolean,
    default: true
  },
  // 每个日期格子显示的最大事件数
  maxEventsPerDay: {
    type: Number,
    default: 3
  },
  // 是否显示事件冲突警告
  showConflictWarning: {
    type: Boolean,
    default: true
  }
})

const { initialSelectedDate, initialViewMode, weekStart, markerDates, duration, events, draggable, maxEventsPerDay, showConflictWarning, showSearch } = toRefs(props)

// 搜索相关
const searchKeyword = ref('')
const currentSearchIndex = ref(0)
const filteredEvents = computed(() => {
  if (!searchKeyword.value) {
    return events.value
  }
  const keyword = searchKeyword.value.toLowerCase()
  return events.value.filter(event => 
    event.title.toLowerCase().includes(keyword) ||
    (event.description && event.description.toLowerCase().includes(keyword))
  )
})
const filteredEventsCount = computed(() => filteredEvents.value.length)

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

// 顶部工具栏标题
const headerLabel = computed(() => `${currentYear.value}年${currentMonth.value + 1}月`)
// 星期栏
const weekdays = createWeekdays(weekStart.value)
// 标记日期
const markerDateList = computed(() =>
  markerDates.value.map(item => ({
    date: new Date(typeof item === 'object' && item.date ? item.date : item),
    color: typeof item === 'object' && item.color ? item.color : 'var(--calendar-theme-color)'
  }))
)

// 监听滑动事件
const { lengthX } = useSwipe(swipeRef, {
  // 滑动阈值
  threshold: 0,
  // 手指滑动过程中
  onSwipe: () => {
    if (isInTransition.value) return
    transformDistance.value = -lengthX.value + 'px'
  },
  // 手指抬起滑动结束，开始滑动动画
  onSwipeEnd: (_, direction) => {
    if (isInTransition.value) return
    if (direction === 'left') {
      changePageTo('next-page')
    } else if (direction === 'right') {
      changePageTo('prev-page')
    } else {
      // 如果方向不是左右，则将页面复位
      startTransitionAnimation(direction)
    }
  }
})

// 归一化参数
// 支持 'prev-page', 'next-page', 'prev-year', 'next-year', 以及合法的日期
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

// 切换日历页面
function changePageTo(param) {
  const targetDate = _normalize(param)
  switchPageToTargetDate(targetDate)
}

// 切换选中的日期
function changeSelectedDate(date) {
  changePageTo(date)
  if (!isSameDay(new Date(date), selected.value)) {
    selected.value = new Date(date)
    emit('select-change', selected.value)
  }
}

// 获取 marker 颜色
function _getMarkerColor(date) {
  return markerDateList.value.find(d => isSameDay(d.date, date))?.color
}

// 事件相关方法
function getDayEvents(date) {
  return getEventsByDate(filteredEvents.value, date)
}

function getDisplayEvents(date) {
  const dayEvents = getDayEvents(date)
  return dayEvents.slice(0, maxEventsPerDay.value)
}

function hasConflict(event) {
  const conflicts = checkEventConflict(filteredEvents.value, event, event.id)
  return conflicts.length > 0
}

function handleEventClick(event) {
  const index = events.value.findIndex(e => e.id === event.id)
  emit('event-click', { event, index })
  openEditModal(event)
}

function showMoreEvents(date) {
  const dayEvents = getDayEvents(date)
  emit('event-click', { date, events: dayEvents, isMore: true })
}

// 搜索相关方法
function handleSearch() {
  currentSearchIndex.value = 0
  highlightCurrentSearchResult()
}

function clearSearch() {
  searchKeyword.value = ''
  currentSearchIndex.value = 0
}

function navigateToPrevSearchResult() {
  if (currentSearchIndex.value > 0) {
    currentSearchIndex.value--
    highlightCurrentSearchResult()
  }
}

function navigateToNextSearchResult() {
  if (currentSearchIndex.value < filteredEventsCount.value - 1) {
    currentSearchIndex.value++
    highlightCurrentSearchResult()
  }
}

function highlightCurrentSearchResult() {
  if (filteredEventsCount.value > 0 && currentSearchIndex.value < filteredEventsCount.value) {
    const event = filteredEvents.value[currentSearchIndex.value]
    const eventDate = new Date(event.startDate)
    changeSelectedDate(eventDate)
  }
}

function isSearchResultHighlighted(event) {
  if (!searchKeyword.value || filteredEventsCount.value === 0) {
    return false
  }
  const currentEvent = filteredEvents.value[currentSearchIndex.value]
  return currentEvent && currentEvent.id === event.id
}

// 弹窗相关
const modalVisible = ref(false)
const editingEvent = ref(null)
const modalInitialDate = ref(new Date())

function openCreateModal(date) {
  editingEvent.value = null
  modalInitialDate.value = date
  modalVisible.value = true
}

function openEditModal(event) {
  editingEvent.value = event
  modalInitialDate.value = new Date(event.startDate)
  modalVisible.value = true
}

function closeModal() {
  modalVisible.value = false
  editingEvent.value = null
}

function handleModalSubmit(eventData) {
  if (editingEvent.value) {
    // 更新事件
    const updatedEvent = {
      ...editingEvent.value,
      ...eventData,
      updatedAt: new Date()
    }
    const index = events.value.findIndex(e => e.id === editingEvent.value.id)
    emit('event-update', {
      event: updatedEvent,
      index
    })
  } else {
    // 新建事件
    const newEvent = new CalendarEvent(eventData)
    emit('event-add', newEvent)
  }
  closeModal()
}

function handleModalDelete(event) {
  emit('event-delete', event)
  closeModal()
}

// 拖拽相关
const draggedEvent = ref(null)

function handleDragStart(event, calendarEvent) {
  if (!draggable.value) return
  draggedEvent.value = calendarEvent
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/plain', calendarEvent.id)
  
  // 创建拖拽缩略图
  const dragImage = event.target.cloneNode(true)
  dragImage.style.position = 'fixed'
  dragImage.style.top = '-1000px'
  dragImage.style.left = '-1000px'
  dragImage.style.width = '150px'
  dragImage.style.opacity = '0.8'
  dragImage.style.zIndex = '1000'
  document.body.appendChild(dragImage)
  event.dataTransfer.setDragImage(dragImage, 75, 10)
  
  // 拖拽结束后移除缩略图
  setTimeout(() => {
    document.body.removeChild(dragImage)
  }, 0)
}

function handleDragEnd() {
  draggedEvent.value = null
}

function handleDrop(event, newDate) {
  event.preventDefault()
  if (!draggable.value || !draggedEvent.value) return
  
  const eventId = event.dataTransfer.getData('text/plain')
  if (eventId !== draggedEvent.value.id) return
  
  const oldStartDate = new Date(draggedEvent.value.startDate)
  const oldEndDate = new Date(draggedEvent.value.endDate)
  
  // 清除时间部分，只比较日期
  const oldDateOnly = new Date(oldStartDate.getFullYear(), oldStartDate.getMonth(), oldStartDate.getDate())
  const newDateOnly = new Date(newDate.getFullYear(), newDate.getMonth(), newDate.getDate())
  
  const daysDiff = Math.round((newDateOnly - oldDateOnly) / (1000 * 60 * 60 * 24))
  
  if (daysDiff === 0) {
    draggedEvent.value = null
    return
  }
  
  const newStartDate = new Date(oldStartDate)
  newStartDate.setDate(oldStartDate.getDate() + daysDiff)
  
  const newEndDate = new Date(oldEndDate)
  newEndDate.setDate(oldEndDate.getDate() + daysDiff)
  
  const updatedEvent = {
    ...draggedEvent.value,
    startDate: newStartDate,
    endDate: newEndDate,
    updatedAt: new Date()
  }
  
  const index = events.value.findIndex(e => e.id === draggedEvent.value.id)
  emit('event-update', {
    event: updatedEvent,
    index
  })
  
  draggedEvent.value = null
}

defineExpose({
  // 切换周/月视图
  toggleViewMode,
  // 切换日历页
  changePageTo,
  // 切换选中日期
  changeSelectedDate,
  // 打开新建事件弹窗
  openCreateModal,
  // 打开编辑事件弹窗
  openEditModal,
  // 关闭弹窗
  closeModal
})
</script>
