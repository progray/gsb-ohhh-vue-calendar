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
        <div class="ohhh-calendar-toolbar--left">
          <div v-html="icons.arrowDoubleLeft" class="ohhh-calendar-toolbar--icon" @click="changePageTo('prev-year')" />
          <div v-html="icons.arrowLeft" class="ohhh-calendar-toolbar--icon" @click="changePageTo('prev-page')" />
          <div class="ohhh-calendar-toolbar--text">{{ headerLabel }}</div>
          <div v-html="icons.arrowRight" class="ohhh-calendar-toolbar--icon" @click="changePageTo('next-page')" />
          <div v-html="icons.arrowDoubleRight" class="ohhh-calendar-toolbar--icon" @click="changePageTo('next-year')" />
        </div>
        <div class="ohhh-calendar-toolbar--right">
          <div class="ohhh-calendar-search-box">
            <svg class="ohhh-calendar-search--icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              v-model="searchKeyword"
              type="text"
              class="ohhh-calendar-search--input"
              placeholder="搜索备注..."
              @input="handleSearch"
            />
            <button
              v-if="searchKeyword"
              class="ohhh-calendar-search--clear"
              @click="clearSearch"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
      </slot>
    </div>

    <!-- 搜索结果区域 -->
    <Transition name="search-results-fade">
      <div v-if="showSearchResults" class="ohhh-calendar-search-results">
        <template v-if="searchResults.length > 0">
          <div class="ohhh-calendar-search-results--header">
            <span>找到 {{ searchResults.length }} 条匹配的备注</span>
          </div>
          <div class="ohhh-calendar-search-results--tags">
            <div
              v-for="result in searchResults"
              :key="result.dateKey"
              class="ohhh-calendar-search-result--tag"
              @click="jumpToDate(result.dateKey)"
            >
              <span class="ohhh-calendar-search-result--date">{{ formatSearchDate(result.dateKey) }}</span>
              <span class="ohhh-calendar-search-result--preview" v-html="highlightKeyword(result.preview)"></span>
            </div>
          </div>
        </template>
        <template v-else>
          <div class="ohhh-calendar-search-results--empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              <line x1="8" y1="8" x2="14" y2="14"></line>
            </svg>
            <span>未找到匹配的备注</span>
          </div>
        </template>
      </div>
    </Transition>

    <!-- 星期栏 -->
    <div v-if="showWeekdays && !showSearchResults" class="ohhh-calendar-weekdays">
      <div v-for="(day, index) in weekdays" :key="day" class="ohhh-calendar-weekdays--weekday">
        <slot name="weekday" :weekday="day" :index="(index + weekStart) % 7">{{ day }}</slot>
      </div>
    </div>

    <!-- 日历主体 -->
    <div v-if="!showSearchResults" ref="swp" class="ohhh-calendar-wrapper">
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
          @click="changeSelectedDate(dateObj.date)"
          @mouseenter="handleDayHover(dateObj.key, true)"
          @mouseleave="handleDayHover(dateObj.key, false)"
        >
          <div class="ohhh-calendar-day--inner">
            <div class="ohhh-calendar-day--inner-value">{{ dateObj.fullDate.date }}</div>
            <div class="ohhh-calendar-day--inner-label" v-if="$slots['day-label']">
              <slot name="day-label" :date="dateObj.date" />
            </div>
          </div>
          <div class="ohhh-calendar-day--marker" :style="{ background: _getMarkerColor(dateObj.date) }" />
          
          <!-- 备注标签 -->
          <div
            class="ohhh-calendar-day--note-tag"
            :class="{
              'is-visible': hasNoteForDate(dateObj.key) || hoveredDateKey === dateObj.key,
              'has-note': hasNoteForDate(dateObj.key)
            }"
            @click.stop="openNoteEditor(dateObj.date)"
          >
            <svg v-if="hasNoteForDate(dateObj.key)" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部工具栏 -->
    <div v-if="showFooter && !showSearchResults" class="ohhh-calendar-footer">
      <slot name="footer" :year="currentYear" :month="currentMonth" :viewMode="viewMode">
        <div
          v-html="viewMode === 'week' ? icons.arrowDown : icons.arrowUp"
          class="ohhh-calendar-footer--icon"
          @click="toggleViewMode"
        />
      </slot>
    </div>

    <!-- 备注编辑器弹窗 -->
    <NoteEditor
      v-model:visible="showNoteEditor"
      :date="selectedNoteDate"
      @note-change="handleNoteChange"
    />
  </div>
</template>

<script setup>
import { computed, useTemplateRef, toRefs, ref, watch, nextTick } from 'vue'
import { useSwipe } from '@vueuse/core'
import { useCalendar } from './hooks/useCalendar.js'
import { isSameDay, createWeekdays } from './utils'
import { icons } from './utils/icons.js'
import NoteEditor from './components/NoteEditor.vue'
import {
  hasNote,
  searchNotes,
  parseDateKey,
  getHighlightedContent,
  formatDateKey,
  getAllNotesWithDates
} from './utils/noteStorage.js'

const swipeRef = useTemplateRef('swp')

const emit = defineEmits(['select-change', 'view-change', 'note-change'])

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

// ==================== 备注功能相关 ====================
const hoveredDateKey = ref(null)
const showNoteEditor = ref(false)
const selectedNoteDate = ref(null)

const searchKeyword = ref('')
const searchResults = ref([])
const showSearchResults = ref(false)

function handleDayHover(dateKey, isHover) {
  hoveredDateKey.value = isHover ? dateKey : null
}

function hasNoteForDate(dateKey) {
  return hasNote(dateKey)
}

function openNoteEditor(date) {
  selectedNoteDate.value = new Date(date)
  showNoteEditor.value = true
}

function handleNoteChange(dateKey, content) {
  emit('note-change', dateKey, content)
}

// ==================== 搜索功能相关 ====================
function handleSearch() {
  if (!searchKeyword.value.trim()) {
    searchResults.value = []
    showSearchResults.value = false
    return
  }
  
  const results = searchNotes(searchKeyword.value)
  searchResults.value = results.map(note => ({
    dateKey: note.dateKey,
    preview: getHighlightedContent(note.content, searchKeyword.value)
  }))
  showSearchResults.value = true
}

function clearSearch() {
  searchKeyword.value = ''
  searchResults.value = []
  showSearchResults.value = false
}

function formatSearchDate(dateKey) {
  const parsed = parseDateKey(dateKey)
  if (parsed) {
    return `${parsed.year}年${parsed.month + 1}月${parsed.date}日`
  }
  return dateKey
}

function highlightKeyword(text) {
  if (!searchKeyword.value || !searchKeyword.value.trim()) {
    return text
  }
  const keyword = searchKeyword.value.trim()
  const regex = new RegExp(`(${keyword})`, 'gi')
  return text.replace(regex, '<span class="ohhh-calendar-search-result--highlight">$1</span>')
}

function jumpToDate(dateKey) {
  const parsed = parseDateKey(dateKey)
  if (parsed) {
    const targetDate = new Date(parsed.year, parsed.month, parsed.date)
    clearSearch()
    nextTick(() => {
      changeSelectedDate(targetDate)
    })
  }
}

defineExpose({
  toggleViewMode,
  changePageTo,
  changeSelectedDate,
  openNoteEditor,
  clearSearch
})
</script>
