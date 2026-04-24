<template>
  <div
    class="ohhh-calendar-container"
    :class="{ 'theme-dark': currentTheme.isDark }"
    :style="containerStyle"
  >
    <!-- 顶部工具栏 -->
    <div v-if="showToolbar" class="ohhh-calendar-toolbar">
      <slot name="toolbar" :year="currentYear" :month="currentMonth" :viewMode="viewMode">
        <div v-html="icons.arrowDoubleLeft" class="ohhh-calendar-toolbar--icon" @click="changePageTo('prev-year')" />
        <div v-html="icons.arrowLeft" class="ohhh-calendar-toolbar--icon" @click="changePageTo('prev-page')" />
        <div class="ohhh-calendar-toolbar--text">{{ headerLabel }}</div>
        <div v-html="icons.arrowRight" class="ohhh-calendar-toolbar--icon" @click="changePageTo('next-page')" />
        <div v-html="icons.arrowDoubleRight" class="ohhh-calendar-toolbar--icon" @click="changePageTo('next-year')" />
        <ThemeSelector
          :currentTheme="currentTheme"
          :themes="themes"
          :isOpen="showThemeSelector"
          @toggle="toggleThemeSelector"
          @select="onThemeSelect"
        />
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
        <template v-for="(dateObj, dateIndex) in item" :key="dateObj.key">
          <div
            v-if="dateIndex % 7 === 0"
            class="ohhh-calendar-row-bg"
            :style="getRowBackgroundStyle(Math.floor(dateIndex / 7))"
          />
          <div
            class="ohhh-calendar-day"
            :class="{
              'is-selected': isSameDay(dateObj.date, selected),
              'is-today': isSameDay(dateObj.date, new Date()),
              'other-month': !dateObj.current
            }"
            :style="getDayStyle(dateIndex)"
            @click="changeSelectedDate(dateObj.date)"
          >
            <div class="ohhh-calendar-day--inner">
              <div class="ohhh-calendar-day--inner-value">{{ dateObj.fullDate.date }}</div>
              <div class="ohhh-calendar-day--inner-label" v-if="$slots['day-label']">
                <slot name="day-label" :date="dateObj.date" />
              </div>
            </div>
            <div class="ohhh-calendar-day--marker" :style="{ background: _getMarkerColor(dateObj.date) }" />
          </div>
        </template>
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
  </div>
</template>

<script setup>
import { computed, useTemplateRef, toRefs, watch } from 'vue'
import { useSwipe } from '@vueuse/core'
import { useCalendar } from './hooks/useCalendar.js'
import { useTheme } from './hooks/useTheme.js'
import { isSameDay, createWeekdays } from './utils'
import { icons } from './utils/icons.js'
import { getThemeRibbonColor, getThemeAccentColor, hslToCss } from './themes/index.js'
import ThemeSelector from './components/ThemeSelector.vue'

const swipeRef = useTemplateRef('swp')

const emit = defineEmits(['select-change', 'view-change', 'theme-change'])

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
  },
  initialThemeId: {
    type: String,
    default: null
  },
  randomThemeOnMonthChange: {
    type: Boolean,
    default: true
  }
})

const { initialSelectedDate, initialViewMode, weekStart, markerDates, duration, initialThemeId, randomThemeOnMonthChange } = toRefs(props)

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
  weekIndex,
  currentMonthDates,
  switchPageToTargetDate,
  startTransitionAnimation,
  onTransitionEnd,
  toggleViewMode
} = useCalendar({ initialSelectedDate, initialViewMode, weekStart, duration }, emit)

const {
  currentTheme,
  themes,
  showThemeSelector,
  setTheme,
  setRandomTheme,
  toggleThemeSelector,
  closeThemeSelector
} = useTheme(initialThemeId.value)

const previousMonth = { year: currentYear.value, month: currentMonth.value }

watch([currentYear, currentMonth], ([newYear, newMonth]) => {
  if (randomThemeOnMonthChange.value) {
    const isMonthChanged = newYear !== previousMonth.year || newMonth !== previousMonth.month
    if (isMonthChanged) {
      setRandomTheme(true)
      emit('theme-change', currentTheme.value)
    }
  }
  previousMonth.year = newYear
  previousMonth.month = newMonth
})

const headerLabel = computed(() => `${currentYear.value}年${currentMonth.value + 1}月`)
const weekdays = createWeekdays(weekStart.value)

const markerDateList = computed(() =>
  markerDates.value.map(item => ({
    date: new Date(typeof item === 'object' && item.date ? item.date : item),
    color: typeof item === 'object' && item.color ? item.color : 'var(--calendar-theme-color)'
  }))
)

const containerStyle = computed(() => {
  const theme = currentTheme.value
  return {
    '--calendar-rows': renderRows.value,
    '--calendar-transition-duration': duration.value,
    '--translate-distance': transformDistance.value,
    '--transition-duration': transitionDuration.value,
    '--theme-background': theme.background,
    '--theme-accent-background': theme.accentBackground,
    '--theme-text-primary': theme.primaryText,
    '--theme-text-secondary': theme.secondaryText,
    '--theme-selected-text': theme.selectedText,
    '--theme-base-hue': theme.baseHue,
    '--theme-saturation': `${theme.saturation}%`,
    '--theme-lightness': `${theme.lightness}%`,
    '--theme-font-family': theme.fontFamily || 'inherit',
    '--theme-accent-lightness': `${theme.accentLightness}%`
  }
})

function getEffectiveRowIndex(dateIndex) {
  if (viewMode.value === 'week') {
    return weekIndex.value
  }
  return Math.floor(dateIndex / 7)
}

function getRowBackgroundStyle(rowIndex) {
  const theme = currentTheme.value
  const effectiveRowIndex = viewMode.value === 'week' ? weekIndex.value : rowIndex
  return {
    backgroundColor: getThemeRibbonColor(theme, effectiveRowIndex),
    top: `calc(var(--calendar-row-height) * ${rowIndex})`
  }
}

function getDayStyle(dateIndex) {
  const theme = currentTheme.value
  const effectiveRowIndex = getEffectiveRowIndex(dateIndex)
  const accentColor = getThemeAccentColor(theme, effectiveRowIndex)
  return {
    '--theme-row-accent': accentColor
  }
}

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

function onThemeSelect(themeId) {
  setTheme(themeId)
  closeThemeSelector()
  emit('theme-change', currentTheme.value)
}

function _getMarkerColor(date) {
  return markerDateList.value.find(d => isSameDay(d.date, date))?.color
}

defineExpose({
  toggleViewMode,
  changePageTo,
  changeSelectedDate,
  setTheme,
  setRandomTheme,
  currentTheme
})
</script>
