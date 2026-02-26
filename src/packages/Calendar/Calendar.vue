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
        v-for="(item, pageIndex) in allRenderDates"
        :key="pageIndex"
        :style="{ left: 100 * (pageIndex - 1) + '%' }"
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
            'drag-over': dragOverDate && isSameDay(dateObj.date, dragOverDate)
          }"
          @click="onDayClick(dateObj.date)"
          @dragover.prevent="onDragOver(dateObj.date)"
          @drop.prevent="onDrop(dateObj.date)"
        >
          <div class="ohhh-calendar-day--header">
            <div class="ohhh-calendar-day--inner">
              <div class="ohhh-calendar-day--inner-value">{{ dateObj.fullDate.date }}</div>
            </div>
            <!-- 添加事件按钮 -->
            <div
              v-if="showAddButton && dateObj.current"
              class="ohhh-calendar-day--add"
              @click.stop="onAddEvent(dateObj.date)"
            >
              <span>+</span>
            </div>
          </div>

          <!-- 事件列表 - 最多显示3个 -->
          <div class="ohhh-calendar-day--events" v-if="getEventsByDate(dateObj.date).length > 0">
            <div
              v-for="event in getDisplayEvents(dateObj.date)"
              :key="event.id"
              class="ohhh-calendar-event"
              :class="{
                'is-conflict': event.hasConflict,
                [`event-color-${event.color || 'default'}`]: true,
                'is-dragging': draggedEvent && draggedEvent.id === event.id
              }"
              :draggable="enableDragDrop"
              :title="event.title + (event.time ? ' ' + event.time : '') + (event.hasConflict ? ' (冲突)' : '')"
              @click.stop="onEventClick(event, $event)"
              @dragstart="onDragStart(event, $event)"
              @dragend="onDragEnd"
            >
              <slot name="event" :event="event" :date="dateObj.date">
                <span class="ohhh-calendar-event--title">{{ event.title }}</span>
                <span v-if="event.time" class="ohhh-calendar-event--time">{{ event.time }}</span>
              </slot>
            </div>
            <!-- 更多事件提示 -->
            <div v-if="getEventsByDate(dateObj.date).length > 3" class="ohhh-calendar-event-more">
              +{{ getEventsByDate(dateObj.date).length - 3 }} 更多
            </div>
          </div>

          <div class="ohhh-calendar-day--marker" :style="{ background: _getMarkerColor(dateObj.date) }" />
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
    <Teleport to="body" v-if="showEventModal">
      <div class="ohhh-calendar-modal-overlay" @click.self="closeEventModal">
        <div class="ohhh-calendar-modal">
          <div class="ohhh-calendar-modal--header">
            <h3>{{ editingEvent?.id ? '编辑事件' : '添加事件' }}</h3>
            <button class="ohhh-calendar-modal--close" @click="closeEventModal">&times;</button>
          </div>
          <div class="ohhh-calendar-modal--body">
            <div class="ohhh-calendar-form-group">
              <label>标题 <span class="required">*</span></label>
              <input
                ref="titleInput"
                v-model="eventForm.title"
                type="text"
                name="title"
                placeholder="请输入事件标题"
                maxlength="50"
                @keydown.enter="saveEvent"
              />
            </div>
            <div class="ohhh-calendar-form-row">
              <div class="ohhh-calendar-form-group">
                <label>日期</label>
                <div class="ohhh-calendar-date-picker">
                  <input
                    ref="dateInput"
                    v-model="eventForm.date"
                    type="date"
                  />
                </div>
              </div>
              <div class="ohhh-calendar-form-group">
                <label>时间</label>
                <div class="ohhh-calendar-time-picker">
                  <input
                    ref="timeInput"
                    v-model="eventForm.time"
                    type="time"
                  />
                </div>
              </div>
            </div>
            <div class="ohhh-calendar-form-group">
              <label>颜色标记</label>
              <div class="ohhh-calendar-color-picker">
                <div
                  v-for="color in colorOptions"
                  :key="color.value"
                  class="ohhh-calendar-color-option"
                  :class="{ 'is-selected': eventForm.color === color.value }"
                  :style="{ background: color.color }"
                  @click="eventForm.color = color.value"
                  :title="color.label"
                />
              </div>
            </div>
            <div class="ohhh-calendar-form-group">
              <label>描述</label>
              <textarea
                ref="descInput"
                v-model="eventForm.description"
                name="description"
                rows="3"
                placeholder="请输入事件描述（可选）"
                maxlength="200"
              />
            </div>
            <div v-if="conflictWarning" class="ohhh-calendar-conflict-warning">
              {{ conflictWarning }}
            </div>
          </div>
          <div class="ohhh-calendar-modal--footer">
            <button v-if="editingEvent?.id" class="ohhh-calendar-btn ohhh-calendar-btn--danger" @click="deleteEvent">
              删除
            </button>
            <button class="ohhh-calendar-btn ohhh-calendar-btn--default" @click="closeEventModal">取消</button>
            <button
              class="ohhh-calendar-btn ohhh-calendar-btn--primary"
              :disabled="!eventForm.title.trim()"
              @click="saveEvent"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 拖拽时的幽灵元素 -->
    <div
      v-if="draggedEvent && dragGhostPosition"
      class="ohhh-calendar-drag-ghost"
      :class="[`event-color-${draggedEvent.color || 'default'}`]"
      :style="{
        left: dragGhostPosition.x + 'px',
        top: dragGhostPosition.y + 'px'
      }"
    >
      <span class="ohhh-calendar-drag-ghost--title">{{ draggedEvent.title }}</span>
      <span v-if="draggedEvent.time" class="ohhh-calendar-drag-ghost--time">{{ draggedEvent.time }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed, useTemplateRef, toRefs, ref, watch, nextTick } from 'vue'
import { useSwipe } from '@vueuse/core'
import { useCalendar } from './hooks/useCalendar.js'
import { isSameDay, createWeekdays, formatDate, parseDate } from './utils'
import { icons } from './utils/icons.js'

const swipeRef = useTemplateRef('swp')
const titleInput = useTemplateRef('titleInput')
const dateInput = useTemplateRef('dateInput')
const timeInput = useTemplateRef('timeInput')
const descInput = useTemplateRef('descInput')

const emit = defineEmits([
  'select-change',
  'view-change',
  'event-add',
  'event-update',
  'event-delete',
  'event-click',
  'event-drag'
])

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
  // 过渡动画时长
  duration: {
    type: String,
    default: '0.3s'
  },
  // 事件列表
  events: {
    type: Array,
    default: () => []
  },
  // 是否显示添加按钮
  showAddButton: {
    type: Boolean,
    default: true
  },
  // 是否启用拖拽
  enableDragDrop: {
    type: Boolean,
    default: true
  },
  // 是否启用冲突检测
  enableConflictCheck: {
    type: Boolean,
    default: true
  },
  // 每天最大事件数
  maxEventsPerDay: {
    type: Number,
    default: 5
  }
})

const { initialSelectedDate, initialViewMode, weekStart, markerDates, duration, events, enableConflictCheck } = toRefs(props)

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

// 内部事件列表（用于本地管理）
const internalEvents = ref([])

// 同步外部 events 到内部
watch(() => props.events, (newEvents) => {
  internalEvents.value = newEvents.map(event => ({
    ...event,
    id: event.id || generateId(),
    hasConflict: false
  }))
  checkConflicts()
}, { immediate: true, deep: true })

// 生成唯一ID
function generateId() {
  return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// 颜色选项
const colorOptions = [
  { value: 'default', label: '默认', color: '#409eff' },
  { value: 'red', label: '红色', color: '#f56c6c' },
  { value: 'orange', label: '橙色', color: '#e6a23c' },
  { value: 'green', label: '绿色', color: '#67c23a' },
  { value: 'cyan', label: '青色', color: '#13c2c2' },
  { value: 'blue', label: '蓝色', color: '#1890ff' },
  { value: 'purple', label: '紫色', color: '#722ed1' },
  { value: 'pink', label: '粉色', color: '#eb2f96' }
]

// 弹窗相关
const showEventModal = ref(false)
const editingEvent = ref(null)
const conflictWarning = ref('')
const eventForm = ref({
  title: '',
  date: '',
  time: '',
  color: 'default',
  description: ''
})



// 拖拽相关
const draggedEvent = ref(null)
const dragOverDate = ref(null)
const dragGhostPosition = ref(null)

// 获取某日期的事件列表
function getEventsByDate(date) {
  const dateStr = formatDate(date)
  return internalEvents.value.filter(event => {
    const eventDateStr = typeof event.date === 'string' ? event.date : formatDate(event.date)
    return eventDateStr === dateStr
  })
}

// 获取要显示的事件（最多3个）
function getDisplayEvents(date) {
  const events = getEventsByDate(date)
  return events.slice(0, 3)
}

// 检查事件冲突
function checkConflicts() {
  if (!enableConflictCheck.value) return

  // 重置所有事件的冲突状态
  internalEvents.value.forEach(event => {
    event.hasConflict = false
  })

  // 按日期分组检查
  const eventsByDate = {}
  internalEvents.value.forEach(event => {
    const dateStr = typeof event.date === 'string' ? event.date : formatDate(event.date)
    if (!eventsByDate[dateStr]) {
      eventsByDate[dateStr] = []
    }
    eventsByDate[dateStr].push(event)
  })

  // 检查每天的冲突
  Object.values(eventsByDate).forEach(dayEvents => {
    // 按时间排序
    dayEvents.sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00'))

    for (let i = 0; i < dayEvents.length; i++) {
      for (let j = i + 1; j < dayEvents.length; j++) {
        const event1 = dayEvents[i]
        const event2 = dayEvents[j]

        if (hasTimeConflict(event1, event2)) {
          event1.hasConflict = true
          event2.hasConflict = true
        }
      }
    }
  })
}

// 检查两个事件是否有时间冲突
function hasTimeConflict(event1, event2) {
  // 如果没有时间信息，认为全天事件，可能有冲突
  if (!event1.time || !event2.time) {
    return true
  }

  const start1 = event1.time
  const end1 = event1.endTime || addMinutes(event1.time, 60)
  const start2 = event2.time
  const end2 = event2.endTime || addMinutes(event2.time, 60)

  return (start1 < end2 && end1 > start2)
}

// 添加分钟到时间字符串
function addMinutes(timeStr, minutes) {
  const [hours, mins] = timeStr.split(':').map(Number)
  const date = new Date(2000, 0, 1, hours, mins + minutes)
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 检查表单冲突
function checkFormConflict() {
  if (!enableConflictCheck.value || !eventForm.value.date) {
    conflictWarning.value = ''
    return
  }

  const currentId = editingEvent.value?.id
  const sameDayEvents = internalEvents.value.filter(event => {
    const eventDateStr = typeof event.date === 'string' ? event.date : formatDate(event.date)
    return eventDateStr === eventForm.value.date && event.id !== currentId
  })

  const formEvent = {
    time: eventForm.value.time,
    endTime: eventForm.value.endTime
  }

  const hasConflict = sameDayEvents.some(event => hasTimeConflict(formEvent, event))
  conflictWarning.value = hasConflict ? '警告：该时间段与其他事件存在冲突' : ''
}

// 监听表单变化检查冲突
watch(() => [eventForm.value.date, eventForm.value.time], checkFormConflict, { immediate: true })

// 日期点击
function onDayClick(date) {
  changeSelectedDate(date)
}

// 事件点击
function onEventClick(event, e) {
  e.stopPropagation()
  emit('event-click', event)
  openEditModal(event)
}

// 添加事件
function onAddEvent(date) {
  openAddModal(date)
}

// 打开添加弹窗
function openAddModal(date) {
  editingEvent.value = null
  eventForm.value = {
    title: '',
    date: formatDate(date),
    time: '',
    color: 'default',
    description: ''
  }
  conflictWarning.value = ''
  showEventModal.value = true
  // 聚焦到标题输入框
  nextTick(() => {
    titleInput.value?.focus()
  })
}

// 打开编辑弹窗
function openEditModal(event) {
  editingEvent.value = event
  const eventDate = typeof event.date === 'string' ? event.date : formatDate(event.date)
  eventForm.value = {
    title: event.title || '',
    date: eventDate,
    time: event.time || '',
    color: event.color || 'default',
    description: event.description || ''
  }
  conflictWarning.value = ''
  showEventModal.value = true
}

// 关闭弹窗
function closeEventModal() {
  showEventModal.value = false
  editingEvent.value = null
  conflictWarning.value = ''
}

// 保存事件
function saveEvent() {
  if (!eventForm.value.title.trim()) {
    return
  }

  const eventData = {
    ...eventForm.value,
    title: eventForm.value.title.trim()
  }

  if (editingEvent.value?.id) {
    // 更新事件
    const index = internalEvents.value.findIndex(e => e.id === editingEvent.value.id)
    if (index > -1) {
      internalEvents.value[index] = {
        ...internalEvents.value[index],
        ...eventData
      }
      emit('event-update', { ...internalEvents.value[index] })
    }
  } else {
    // 添加事件
    const newEvent = {
      id: generateId(),
      ...eventData,
      hasConflict: false
    }
    internalEvents.value.push(newEvent)
    emit('event-add', { ...newEvent })
  }

  checkConflicts()
  closeEventModal()
}

// 删除事件
function deleteEvent() {
  if (!editingEvent.value?.id) return

  const index = internalEvents.value.findIndex(e => e.id === editingEvent.value.id)
  if (index > -1) {
    const deletedEvent = internalEvents.value[index]
    internalEvents.value.splice(index, 1)
    emit('event-delete', { ...deletedEvent })
  }

  checkConflicts()
  closeEventModal()
}

// 拖拽开始
function onDragStart(event, e) {
  if (!props.enableDragDrop) return
  draggedEvent.value = event

  // 设置拖拽幽灵元素位置
  const updateGhostPosition = (ev) => {
    dragGhostPosition.value = {
      x: ev.clientX + 10,
      y: ev.clientY + 10
    }
  }
  updateGhostPosition(e)

  // 监听鼠标移动更新幽灵位置
  document.addEventListener('dragover', updateGhostPosition)

  // 存储清理函数
  draggedEvent.value._cleanup = () => {
    document.removeEventListener('dragover', updateGhostPosition)
  }

  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('text/plain', event.id)

  // 设置拖拽图像（透明像素，使用自定义幽灵元素）
  const img = new Image()
  img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
  e.dataTransfer.setDragImage(img, 0, 0)
}

// 拖拽经过
function onDragOver(date) {
  if (!props.enableDragDrop || !draggedEvent.value) return
  dragOverDate.value = date
}

// 拖拽放下
function onDrop(date) {
  if (!props.enableDragDrop || !draggedEvent.value) return

  const newDate = formatDate(date)
  const oldDate = typeof draggedEvent.value.date === 'string'
    ? draggedEvent.value.date
    : formatDate(draggedEvent.value.date)

  if (newDate !== oldDate) {
    const index = internalEvents.value.findIndex(e => e.id === draggedEvent.value.id)
    if (index > -1) {
      internalEvents.value[index] = {
        ...internalEvents.value[index],
        date: newDate
      }
      emit('event-update', { ...internalEvents.value[index] })
      emit('event-drag', {
        event: { ...internalEvents.value[index] },
        oldDate,
        newDate
      })
    }
    checkConflicts()
  }

  // 清理事件监听
  if (draggedEvent.value._cleanup) {
    draggedEvent.value._cleanup()
  }

  draggedEvent.value = null
  dragGhostPosition.value = null
  dragOverDate.value = null
}

// 拖拽结束
function onDragEnd() {
  // 清理事件监听
  if (draggedEvent.value?._cleanup) {
    draggedEvent.value._cleanup()
  }
  draggedEvent.value = null
  dragGhostPosition.value = null
  dragOverDate.value = null
}

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

// 查询方法
function queryEvents(query) {
  if (!query) return internalEvents.value.map(e => ({ ...e }))

  return internalEvents.value.filter(event => {
    // 按日期查询
    if (query.date) {
      const eventDateStr = typeof event.date === 'string' ? event.date : formatDate(event.date)
      const queryDateStr = typeof query.date === 'string' ? query.date : formatDate(query.date)
      if (eventDateStr !== queryDateStr) return false
    }

    // 按日期范围查询
    if (query.startDate || query.endDate) {
      const eventDate = new Date(event.date)
      if (query.startDate && eventDate < new Date(query.startDate)) return false
      if (query.endDate && eventDate > new Date(query.endDate)) return false
    }

    // 按标题模糊查询
    if (query.title && !event.title?.toLowerCase().includes(query.title.toLowerCase())) {
      return false
    }

    // 按颜色查询
    if (query.color && event.color !== query.color) {
      return false
    }

    // 按是否有冲突查询
    if (query.hasConflict !== undefined && event.hasConflict !== query.hasConflict) {
      return false
    }

    return true
  }).map(e => ({ ...e }))
}

defineExpose({
  // 切换周/月视图
  toggleViewMode,
  // 切换日历页
  changePageTo,
  // 切换选中日期
  changeSelectedDate,
  // 获取所有事件
  getEvents: () => internalEvents.value.map(e => ({ ...e })),
  // 查询事件
  queryEvents,
  // 添加事件
  addEvent: (eventData) => {
    const newEvent = {
      id: generateId(),
      ...eventData,
      hasConflict: false
    }
    internalEvents.value.push(newEvent)
    checkConflicts()
    emit('event-add', { ...newEvent })
    return newEvent
  },
  // 更新事件
  updateEvent: (id, eventData) => {
    const index = internalEvents.value.findIndex(e => e.id === id)
    if (index > -1) {
      internalEvents.value[index] = { ...internalEvents.value[index], ...eventData }
      checkConflicts()
      emit('event-update', { ...internalEvents.value[index] })
      return internalEvents.value[index]
    }
    return null
  },
  // 删除事件
  removeEvent: (id) => {
    const index = internalEvents.value.findIndex(e => e.id === id)
    if (index > -1) {
      const deletedEvent = internalEvents.value[index]
      internalEvents.value.splice(index, 1)
      checkConflicts()
      emit('event-delete', { ...deletedEvent })
      return deletedEvent
    }
    return null
  },
  // 获取某天的事件
  getEventsByDate: (date) => getEventsByDate(date).map(e => ({ ...e })),
  // 检查冲突
  checkConflicts
})
</script>
