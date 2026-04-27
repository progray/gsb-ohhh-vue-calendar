<template>
  <div
    class="ohhh-calendar-container"
    :style="{
      '--calendar-rows': renderRows,
      '--calendar-transition-duration': duration,
      '--translate-distance': transformDistance,
      '--transition-duration': transitionDuration
    }"
    @mousemove="onMouseMove"
    @mouseup="onMouseUp"
    @mouseleave="onMouseUp"
    ref="calendarContainer"
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
          v-for="(dateObj, index) in item"
          :key="dateObj.key"
          class="ohhh-calendar-day"
          :class="{
            'is-selected': isSameDay(dateObj.date, selected),
            'is-today': isSameDay(dateObj.date, new Date()),
            'other-month': !dateObj.current,
            'is-dragging-source': isDraggingSource(dateObj.date),
            'is-dragging-target': isDraggingTarget(dateObj.date),
            'is-drop-animating': isDropAnimating(dateObj.date),
            'has-many-icons': hasManyIcons(dateObj.date)
          }"
          @click="onDayClick(dateObj.date, $event)"
          @mouseenter="onDayMouseEnter(dateObj.date)"
          @mouseleave="onDayMouseLeave(dateObj.date)"
          :data-date-key="dateObj.key"
        >
          <div class="ohhh-calendar-day--inner">
            <div class="ohhh-calendar-day--inner-value">{{ dateObj.fullDate.date }}</div>
            <div class="ohhh-calendar-day--inner-label" v-if="$slots['day-label']">
              <slot name="day-label" :date="dateObj.date" />
            </div>
          </div>
          <div class="ohhh-calendar-day--marker" :style="{ background: _getMarkerColor(dateObj.date) }" />
          
          <!-- 日记图标容器 - 堆叠显示 -->
          <div 
            class="ohhh-calendar-day--diary-wrapper"
            v-if="hasDiary(dateObj.date)"
            @mouseenter="onDiaryWrapperMouseEnter(dateObj.date, $event)"
            @mouseleave="onDiaryWrapperMouseLeave(dateObj.date)"
          >
            <!-- 堆叠显示的图标（默认状态） -->
            <div 
              class="ohhh-calendar-day--diary-icons ohhh-calendar-day--diary-icons-stacked"
              v-if="!isExpanded(dateObj.key)"
            >
              <div 
                v-for="(item, itemIndex) in getDiaryItems(dateObj.date)"
                :key="item.id"
                class="ohhh-calendar-day--diary-icon ohhh-calendar-day--diary-icon-stacked"
                :class="{
                  'is-dragging-item': isDraggingItem(dateObj.date, item.id)
                }"
                :style="{
                  zIndex: itemIndex + 1,
                  marginLeft: itemIndex > 0 ? '-6px' : '0px'
                }"
                @mousedown="onDiaryItemMouseDown($event, dateObj.date, item.id, item.content)"
                @click.stop
                :title="item.content"
              >
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
              </div>
            </div>
            
            <!-- 展开显示的图标（鼠标悬停时，横向滚动） -->
            <div 
              class="ohhh-calendar-day--diary-icons ohhh-calendar-day--diary-icons-expanded"
              v-if="isExpanded(dateObj.key)"
              ref="expandedIconsRef"
            >
              <div 
                v-for="(item, itemIndex) in getDiaryItems(dateObj.date)"
                :key="item.id"
                class="ohhh-calendar-day--diary-icon ohhh-calendar-day--diary-icon-expanded"
                :class="{
                  'is-dragging-item': isDraggingItem(dateObj.date, item.id)
                }"
                @mousedown="onDiaryItemMouseDown($event, dateObj.date, item.id, item.content)"
                @click.stop
                :title="item.content"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
              </div>
            </div>
          </div>
          
          <!-- 搬运中提示 -->
          <div class="ohhh-calendar-day--dragging-text" v-if="isDraggingSource(dateObj.date)">
            搬运中...
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

    <!-- 日记录入弹窗 -->
    <div 
      v-if="showDiaryInput" 
      class="ohhh-calendar-diary-modal"
      @click="closeDiaryInput"
    >
      <div class="ohhh-calendar-diary-modal--content" @click.stop>
        <div class="ohhh-calendar-diary-modal--title">
          {{ formatDateForDisplay(selectedDiaryDate) }}
        </div>
        <textarea
          ref="diaryInputRef"
          v-model="diaryInputValue"
          class="ohhh-calendar-diary-modal--textarea"
          placeholder="请输入一句话（不超过100字）"
          maxlength="100"
          @input="onDiaryInputChange"
        ></textarea>
        <div class="ohhh-calendar-diary-modal--footer">
          <span class="ohhh-calendar-diary-modal--char-count">
            {{ diaryInputValue.length }}/100
          </span>
          <div class="ohhh-calendar-diary-modal--actions">
            <button 
              class="ohhh-calendar-diary-modal--btn ohhh-calendar-diary-modal--btn-cancel"
              @click="closeDiaryInput"
            >取消</button>
            <button 
              class="ohhh-calendar-diary-modal--btn ohhh-calendar-diary-modal--btn-save"
              @click="saveDiary"
              :disabled="!diaryInputValue.trim()"
            >保存</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 覆盖/合并确认弹窗 -->
    <div 
      v-if="showMergeDialog" 
      class="ohhh-calendar-diary-modal"
    >
      <div class="ohhh-calendar-diary-modal--content ohhh-calendar-merge-modal--content">
        <div class="ohhh-calendar-diary-modal--title">
          目标日期已存在内容
        </div>
        <div class="ohhh-calendar-merge-modal--description">
          请选择操作方式
        </div>
        <div class="ohhh-calendar-merge-modal--options">
          <button 
            class="ohhh-calendar-merge-modal--option ohhh-calendar-merge-modal--option-overwrite"
            @click="handleMergeAction('overwrite')"
          >
            <div class="ohhh-calendar-merge-modal--option-title">覆盖</div>
            <div class="ohhh-calendar-merge-modal--option-desc">用新内容替换目标日期的内容</div>
          </button>
          <button 
            class="ohhh-calendar-merge-modal--option ohhh-calendar-merge-modal--option-merge"
            @click="handleMergeAction('merge')"
          >
            <div class="ohhh-calendar-merge-modal--option-title">合并</div>
            <div class="ohhh-calendar-merge-modal--option-desc">将两个日期的内容合并显示</div>
          </button>
        </div>
        <button 
          class="ohhh-calendar-merge-modal--cancel"
          @click="cancelMergeAction"
        >取消</button>
      </div>
    </div>

    <!-- 拖拽影子占位符 -->
    <div 
      v-if="isDragging" 
      class="ohhh-calendar-drag-ghost"
      :style="{
        left: dragGhostPosition.x + 'px',
        top: dragGhostPosition.y + 'px'
      }"
    >
      <div class="ohhh-calendar-drag-ghost--icon">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
      </div>
      <div class="ohhh-calendar-drag-ghost--text">{{ draggingDiaryContent }}</div>
    </div>

    <!-- 边缘检测区域（用于自动切换月份） -->
    <div 
      class="ohhh-calendar-edge-zone ohhh-calendar-edge-zone--left"
      @mouseenter="onEdgeZoneMouseEnter('left')"
      @mouseleave="onEdgeZoneMouseLeave"
    ></div>
    <div 
      class="ohhh-calendar-edge-zone ohhh-calendar-edge-zone--right"
      @mouseenter="onEdgeZoneMouseEnter('right')"
      @mouseleave="onEdgeZoneMouseLeave"
    ></div>
  </div>
</template>

<script setup>
import { computed, useTemplateRef, toRefs, ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useSwipe } from '@vueuse/core'
import { useCalendar } from './hooks/useCalendar.js'
import { isSameDay, createWeekdays } from './utils'
import { icons } from './utils/icons.js'
import { useDiary } from './hooks/useDiary.js'

const swipeRef = useTemplateRef('swp')
const calendarContainer = useTemplateRef('calendarContainer')
const diaryInputRef = useTemplateRef('diaryInputRef')
const expandedIconsRef = useTemplateRef('expandedIconsRef')

const emit = defineEmits(['select-change', 'view-change', 'diary-change', 'diary-drag'])

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
  diaries,
  getDiaryByDate,
  getDiaryItems,
  getDiaryItemById,
  addDiaryItem,
  removeDiaryItem,
  moveDiaryItem,
  updateDiaryItem,
  addDiary,
  removeDiary,
  moveDiary,
  hasDiary,
  hasDiaryItems
} = useDiary()

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
    if (isInTransition.value || isDragging.value) return
    transformDistance.value = -lengthX.value + 'px'
  },
  onSwipeEnd: (_, direction) => {
    if (isInTransition.value || isDragging.value) return
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

// 日记录入相关状态
const showDiaryInput = ref(false)
const selectedDiaryDate = ref(null)
const diaryInputValue = ref('')

// 拖拽相关状态
const isDragging = ref(false)
const draggingDate = ref(null)
const draggingItemId = ref(null)
const dragGhostPosition = ref({ x: 0, y: 0 })
const draggingDiaryContent = ref('')
const hoverDate = ref(null)

// 展开状态
const expandedDateKeys = ref(new Set())

// 合并确认弹窗状态
const showMergeDialog = ref(false)
const pendingMoveFrom = ref(null)
const pendingMoveTo = ref(null)
const pendingMoveItemId = ref(null)

// 掉落动画相关
const dropAnimatingDates = ref(new Set())

// 边缘切换月份相关
let edgeZoneTimer = null

function onDayClick(date, event) {
  if (isDragging.value) return
  
  changeSelectedDate(date)
  
  // 显示日记录入弹窗
  openDiaryInput(date)
}

function openDiaryInput(date) {
  selectedDiaryDate.value = date
  const existingItems = getDiaryItems(date)
  // 如果有多个条目，显示第一个供编辑
  diaryInputValue.value = existingItems.length > 0 ? existingItems[0].content : ''
  showDiaryInput.value = true
  
  nextTick(() => {
    if (diaryInputRef.value) {
      diaryInputRef.value.focus()
    }
  })
}

function closeDiaryInput() {
  showDiaryInput.value = false
  selectedDiaryDate.value = null
  diaryInputValue.value = ''
}

function onDiaryInputChange() {
  if (diaryInputValue.value.length > 100) {
    diaryInputValue.value = diaryInputValue.value.slice(0, 100)
  }
}

function saveDiary() {
  if (!diaryInputValue.value.trim()) return
  
  const existingItems = getDiaryItems(selectedDiaryDate.value)
  
  if (existingItems.length > 0) {
    // 更新第一个条目
    const updated = updateDiaryItem(selectedDiaryDate.value, existingItems[0].id, diaryInputValue.value)
    if (updated) {
      emit('diary-change', {
        type: 'update',
        date: selectedDiaryDate.value,
        itemId: updated.id,
        content: updated.content
      })
    }
  } else {
    // 添加新条目
    const saved = addDiaryItem(selectedDiaryDate.value, diaryInputValue.value)
    if (saved) {
      emit('diary-change', {
        type: 'add',
        date: selectedDiaryDate.value,
        itemId: saved.id,
        content: saved.content
      })
    }
  }
  
  closeDiaryInput()
}

function isExpanded(dateKey) {
  return expandedDateKeys.value.has(dateKey)
}

function hasManyIcons(date) {
  const items = getDiaryItems(date)
  return items.length > 1
}

function onDiaryWrapperMouseEnter(date, event) {
  if (isDragging.value) return
  
  const dateKey = _dateToKey(date)
  const items = getDiaryItems(date)
  
  // 只有当有多个图标时才展开
  if (items.length > 1) {
    expandedDateKeys.value.add(dateKey)
  }
}

function onDiaryWrapperMouseLeave(date) {
  if (isDragging.value) return
  
  const dateKey = _dateToKey(date)
  expandedDateKeys.value.delete(dateKey)
}

function isDraggingSource(date) {
  if (!isDragging.value || !draggingDate.value) return false
  return isSameDay(date, draggingDate.value)
}

function isDraggingItem(date, itemId) {
  if (!isDragging.value || !draggingDate.value || !draggingItemId.value) return false
  return isSameDay(date, draggingDate.value) && draggingItemId.value === itemId
}

function isDraggingTarget(date) {
  if (!isDragging.value || !hoverDate.value) return false
  return isSameDay(date, hoverDate.value) && !isSameDay(date, draggingDate.value)
}

function isDropAnimating(date) {
  return dropAnimatingDates.value.has(_dateToKey(date))
}

function _dateToKey(date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
}

function onDiaryItemMouseDown(event, date, itemId, content) {
  event.preventDefault()
  event.stopPropagation()
  
  const item = getDiaryItemById(date, itemId)
  if (!item) return
  
  isDragging.value = true
  draggingDate.value = date
  draggingItemId.value = itemId
  draggingDiaryContent.value = item.content.length > 20 ? item.content.substring(0, 20) + '...' : item.content
  
  // 收起所有展开的图标
  expandedDateKeys.value.clear()
  
  // 初始位置
  updateDragGhostPosition(event)
}

function updateDragGhostPosition(event) {
  if (!isDragging.value) return
  
  const container = calendarContainer.value
  if (!container) return
  
  const rect = container.getBoundingClientRect()
  dragGhostPosition.value = {
    x: event.clientX - rect.left + 15,
    y: event.clientY - rect.top + 15
  }
}

function onMouseMove(event) {
  if (!isDragging.value) return
  
  updateDragGhostPosition(event)
  
  // 检测当前鼠标下的日期格子
  const dayElement = document.elementFromPoint(event.clientX, event.clientY)
  if (dayElement) {
    const dayCell = dayElement.closest('.ohhh-calendar-day')
    if (dayCell && dayCell.dataset.dateKey) {
      const [year, month, day] = dayCell.dataset.dateKey.split('-').map(Number)
      hoverDate.value = new Date(year, month - 1, day)
    } else {
      hoverDate.value = null
    }
  }
}

function onDayMouseEnter(date) {
  if (!isDragging.value) return
  hoverDate.value = date
}

function onDayMouseLeave(date) {
  if (!isDragging.value) return
}

function onMouseUp() {
  if (!isDragging.value) return
  
  if (hoverDate.value && draggingDate.value && draggingItemId.value && 
      !isSameDay(hoverDate.value, draggingDate.value)) {
    
    // 检查目标日期是否已有内容
    const targetHasItems = hasDiaryItems(hoverDate.value)
    
    if (targetHasItems) {
      // 显示合并确认弹窗
      pendingMoveFrom.value = draggingDate.value
      pendingMoveTo.value = hoverDate.value
      pendingMoveItemId.value = draggingItemId.value
      showMergeDialog.value = true
    } else {
      // 直接移动单个条目
      performMoveItem(draggingDate.value, hoverDate.value, draggingItemId.value, 'overwrite')
    }
  }
  
  isDragging.value = false
  draggingDate.value = null
  draggingItemId.value = null
  hoverDate.value = null
}

function performMoveItem(fromDate, toDate, itemId, action) {
  const result = moveDiaryItem(fromDate, toDate, itemId, action)
  
  if (result) {
    // 添加掉落动画
    triggerDropAnimation(toDate)
    
    emit('diary-change', {
      type: 'drag',
      action: result,
      fromDate: fromDate,
      toDate: toDate,
      itemId: itemId
    })
  }
  
  pendingMoveFrom.value = null
  pendingMoveTo.value = null
  pendingMoveItemId.value = null
}

function handleMergeAction(action) {
  showMergeDialog.value = false
  
  if (pendingMoveFrom.value && pendingMoveTo.value && pendingMoveItemId.value) {
    performMoveItem(pendingMoveFrom.value, pendingMoveTo.value, pendingMoveItemId.value, action)
  }
}

function cancelMergeAction() {
  showMergeDialog.value = false
  pendingMoveFrom.value = null
  pendingMoveTo.value = null
  pendingMoveItemId.value = null
}

function triggerDropAnimation(date) {
  const key = _dateToKey(date)
  dropAnimatingDates.value.add(key)
  
  setTimeout(() => {
    dropAnimatingDates.value.delete(key)
  }, 600)
}

// 边缘切换月份
function onEdgeZoneMouseEnter(direction) {
  if (!isDragging.value || isInTransition.value) return
  
  // 开始计时器，悬停一段时间后自动切换
  edgeZoneTimer = setTimeout(() => {
    if (isDragging.value) {
      if (direction === 'left') {
        changePageTo('prev-page')
      } else if (direction === 'right') {
        changePageTo('next-page')
      }
      
      // 继续计时器，支持连续切换
      onEdgeZoneMouseEnter(direction)
    }
  }, 800)
}

function onEdgeZoneMouseLeave() {
  if (edgeZoneTimer) {
    clearTimeout(edgeZoneTimer)
    edgeZoneTimer = null
  }
}

function formatDateForDisplay(date) {
  if (!date) return ''
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${year}年${month}月${day}日`
}

onUnmounted(() => {
  onEdgeZoneMouseLeave()
})

defineExpose({
  toggleViewMode,
  changePageTo,
  changeSelectedDate,
  getDiaryByDate,
  getDiaryItems,
  addDiaryItem,
  removeDiaryItem,
  moveDiaryItem
})
</script>
