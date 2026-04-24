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

    <!-- 符号工具栏 -->
    <div v-if="showAnnotationToolbar" class="ohhh-calendar-symbol-toolbar">
      <div
        v-for="symbol in symbolKeys"
        :key="symbol"
        class="ohhh-calendar-symbol-toolbar--item"
        :class="{ 'is-selected': selectedSymbol === symbol, 'is-active': isAddingAnnotation }"
        :style="{ '--symbol-color': annotationSymbols[symbol].color }"
        @click="selectSymbol(symbol)"
        v-html="annotationSymbols[symbol].svg"
        :title="annotationSymbols[symbol].name"
      />
    </div>

    <!-- 标签索引栏 -->
    <div v-if="showTagIndex && uniqueTags.length > 0" class="ohhh-calendar-tag-index">
      <div
        v-for="tag in uniqueTags"
        :key="tag.label"
        class="ohhh-calendar-tag-index--tag"
        :class="{ 'is-active': selectedTag?.label === tag.label }"
        :style="{ '--tag-color': annotationSymbols[tag.symbol]?.color || 'var(--calendar-theme-color)' }"
        @click="onTagClick(tag)"
      >
        <span class="ohhh-calendar-tag-index--tag-label">{{ tag.label }}</span>
        <span class="ohhh-calendar-tag-index--tag-count">{{ tag.count }}</span>
      </div>
    </div>

    <!-- 标签下拉列表 -->
    <transition name="slide-down">
      <div v-if="showTagDropdown && tagDropdownDates.length > 0" class="ohhh-calendar-tag-dropdown">
        <div class="ohhh-calendar-tag-dropdown--header">
          <span class="ohhh-calendar-tag-dropdown--header-text">选择日期跳转</span>
          <button class="ohhh-calendar-tag-dropdown--close" @click="closeTagDropdown">×</button>
        </div>
        <div class="ohhh-calendar-tag-dropdown--list">
          <div
            v-for="(date, index) in tagDropdownDates"
            :key="index"
            class="ohhh-calendar-tag-dropdown--item"
            @click="onTagDateSelect(date)"
          >
            <span class="ohhh-calendar-tag-dropdown--item-date">{{ formatDateForDisplay(date) }}</span>
          </div>
        </div>
      </div>
    </transition>

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
            'has-annotation': getAnnotationForDate(dateObj.date),
            'is-deleting': deletingAnnotation === getAnnotationForDate(dateObj.date)?.id,
            'annotation-mode': isAddingAnnotation
          }"
          @click="onDayClick(dateObj.date)"
          @contextmenu.prevent="onDayRightClick(dateObj.date)"
          @mouseenter="onDayMouseEnter(dateObj.date, $event)"
          @mouseleave="onDayMouseLeave"
        >
          <div class="ohhh-calendar-day--annotation-wrapper">
            <div
              v-if="getAnnotationForDate(dateObj.date)"
              class="ohhh-calendar-day--annotation-symbol"
              :style="{ '--annotation-color': getAnnotationSymbolColor(dateObj.date) }"
              v-html="getAnnotationSvg(dateObj.date)"
            />
          </div>
          <div class="ohhh-calendar-day--inner">
            <div class="ohhh-calendar-day--inner-value">{{ dateObj.fullDate.date }}</div>
            <div class="ohhh-calendar-day--inner-label" v-if="$slots['day-label']">
              <slot name="day-label" :date="dateObj.date" />
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

    <!-- 标签输入弹窗 -->
    <transition name="fade">
      <div v-if="showLabelInput" class="ohhh-calendar-label-input-overlay" @click.self="cancelAnnotation">
        <div class="ohhh-calendar-label-input-modal">
          <div class="ohhh-calendar-label-input--header">
            <span class="ohhh-calendar-label-input--title">添加标注</span>
            <span class="ohhh-calendar-label-input--date">{{ formatDateForDisplay(pendingAnnotationDate) }}</span>
          </div>
          <div class="ohhh-calendar-label-input--preview">
            <div
              class="ohhh-calendar-label-input--preview-symbol"
              :style="{ '--annotation-color': annotationSymbols[selectedSymbol]?.color }"
              v-html="annotationSymbols[selectedSymbol]?.svg"
            />
          </div>
          <input
            ref="labelInputRef"
            v-model="pendingLabel"
            type="text"
            class="ohhh-calendar-label-input--input"
            placeholder="输入标签文字（可选）..."
            @keyup.enter="confirmAnnotation"
            @keyup.esc="cancelAnnotation"
          />
          <div class="ohhh-calendar-label-input--actions">
            <button class="ohhh-calendar-label-input--btn ohhh-calendar-label-input--btn-cancel" @click="cancelAnnotation">
              取消
            </button>
            <button class="ohhh-calendar-label-input--btn ohhh-calendar-label-input--btn-confirm" @click="confirmAnnotation">
              确认
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Tooltip -->
    <transition name="fade">
      <div
        v-if="showTooltip && tooltipData"
        class="ohhh-calendar-tooltip"
        :style="{
          left: tooltipPosition.x + 'px',
          top: tooltipPosition.y + 'px'
        }"
      >
        <div class="ohhh-calendar-tooltip--content">
          <span class="ohhh-calendar-tooltip--label">{{ tooltipData.label }}</span>
          <span class="ohhh-calendar-tooltip--date">{{ formatDateForDisplay(tooltipData.date) }}</span>
        </div>
        <div class="ohhh-calendar-tooltip--arrow"></div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { computed, useTemplateRef, toRefs, watch, nextTick } from 'vue'
import { useSwipe } from '@vueuse/core'
import { useCalendar } from './hooks/useCalendar.js'
import { useAnnotation } from './hooks/useAnnotation.js'
import { isSameDay, createWeekdays, formatDate } from './utils/index.js'
import { icons } from './utils/icons.js'
import { annotationSymbols, symbolKeys } from './utils/annotationSymbols.js'

const swipeRef = useTemplateRef('swp')
const labelInputRef = useTemplateRef('labelInputRef')

const emit = defineEmits(['select-change', 'view-change', 'annotation-add', 'annotation-delete'])

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
  showAnnotationToolbar: {
    type: Boolean,
    default: true
  },
  showTagIndex: {
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
  selectedSymbol,
  isAddingAnnotation,
  pendingAnnotationDate,
  pendingLabel,
  showLabelInput,
  tooltipData,
  tooltipPosition,
  showTooltip,
  deletingAnnotation,
  showTagDropdown,
  selectedTag,
  tagDropdownDates,
  uniqueTags,
  getAnnotationForDate,
  selectSymbol,
  startAnnotation,
  confirmAnnotation: _confirmAnnotation,
  cancelAnnotation: _cancelAnnotation,
  deleteAnnotation: _deleteAnnotation,
  showAnnotationTooltip,
  hideAnnotationTooltip,
  handleTagClick,
  closeTagDropdown
} = useAnnotation()

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

watch(showLabelInput, (val) => {
  if (val && labelInputRef.value) {
    nextTick(() => {
      labelInputRef.value.focus()
    })
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

function getAnnotationSvg(date) {
  const annotation = getAnnotationForDate(date)
  if (annotation && annotationSymbols[annotation.symbol]) {
    return annotationSymbols[annotation.symbol].svg
  }
  return ''
}

function getAnnotationSymbolColor(date) {
  const annotation = getAnnotationForDate(date)
  if (annotation && annotationSymbols[annotation.symbol]) {
    return annotationSymbols[annotation.symbol].color
  }
  return 'var(--calendar-theme-color)'
}

function formatDateForDisplay(date) {
  if (!date) return ''
  const d = new Date(date)
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

function onDayClick(date) {
  if (isAddingAnnotation.value && selectedSymbol.value) {
    const existing = getAnnotationForDate(date)
    if (!existing) {
      startAnnotation(date)
    }
  } else {
    changeSelectedDate(date)
  }
}

function onDayRightClick(date) {
  const annotation = getAnnotationForDate(date)
  if (annotation) {
    _deleteAnnotation(annotation)
    emit('annotation-delete', annotation)
  }
}

function onDayMouseEnter(date, event) {
  const annotation = getAnnotationForDate(date)
  if (annotation && annotation.label) {
    showAnnotationTooltip(annotation, event)
  }
}

function onDayMouseLeave() {
  hideAnnotationTooltip()
}

function confirmAnnotation() {
  _confirmAnnotation()
  emit('annotation-add', {
    date: pendingAnnotationDate.value,
    symbol: selectedSymbol.value,
    label: pendingLabel.value
  })
}

function cancelAnnotation() {
  _cancelAnnotation()
}

function onTagClick(tag) {
  const result = handleTagClick(tag)
  if (result.action === 'jump') {
    changeSelectedDate(result.date)
  }
}

function onTagDateSelect(date) {
  changeSelectedDate(date)
  closeTagDropdown()
}

defineExpose({
  toggleViewMode,
  changePageTo,
  changeSelectedDate,
  getAnnotationForDate,
  selectSymbol,
  deleteAnnotation: _deleteAnnotation
})
</script>
