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
    <div v-if="showToolbar" class="ohhh-calendar-toolbar">
      <slot name="toolbar" :year="currentYear" :month="currentMonth" :viewMode="viewMode">
        <div v-html="icons.arrowDoubleLeft" class="ohhh-calendar-toolbar--icon" @click="changePageTo('prev-year')" />
        <div v-html="icons.arrowLeft" class="ohhh-calendar-toolbar--icon" @click="changePageTo('prev-page')" />
        <div class="ohhh-calendar-toolbar--text">{{ headerLabel }}</div>
        <div v-html="icons.arrowRight" class="ohhh-calendar-toolbar--icon" @click="changePageTo('next-page')" />
        <div v-html="icons.arrowDoubleRight" class="ohhh-calendar-toolbar--icon" @click="changePageTo('next-year')" />
      </slot>
    </div>

    <div v-if="showWeekdays" class="ohhh-calendar-weekdays">
      <div v-for="(day, index) in weekdays" :key="day" class="ohhh-calendar-weekdays--weekday">
        <slot name="weekday" :weekday="day" :index="(index + weekStart) % 7">{{ day }}</slot>
      </div>
    </div>

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
          @click="handleDayClick(dateObj)"
        >
          <div class="ohhh-calendar-day--inner">
            <div v-if="getSubscription(dateObj.date)" class="ohhh-calendar-day--app-icon">
              <div v-html="getAppSvg(getSubscription(dateObj.date)?.appKey)" />
            </div>
            <div class="ohhh-calendar-day--inner-value">{{ dateObj.fullDate.date }}</div>
            <div class="ohhh-calendar-day--inner-label" v-if="$slots['day-label']">
              <slot name="day-label" :date="dateObj.date" />
            </div>
          </div>
          <div
            v-if="getSubscription(dateObj.date)"
            class="ohhh-calendar-day--marker"
            :class="{
              'is-unused': !getSubscription(dateObj.date)?.isUsed,
              'is-used': getSubscription(dateObj.date)?.isUsed
            }"
            @click.stop="toggleSubscriptionStatus(dateObj.date)"
          />
        </div>
      </div>
    </div>

    <div v-if="showFooter" class="ohhh-calendar-footer">
      <slot name="footer" :year="currentYear" :month="currentMonth" :viewMode="viewMode">
        <div
          v-html="viewMode === 'week' ? icons.arrowDown : icons.arrowUp"
          class="ohhh-calendar-footer--icon"
          @click="toggleViewMode"
        />
      </slot>
    </div>

    <Teleport to="body">
      <div v-if="showPanel" class="ohhh-calendar-panel-overlay" @click.self="closePanel">
        <div class="ohhh-calendar-panel" @click.stop>
          <div class="ohhh-calendar-panel--header">
            <div class="ohhh-calendar-panel--title">
              {{ editingSubscription ? '编辑订阅' : '添加订阅' }}
              <span style="font-size: 13px; color: var(--calendar-text-tertiary); margin-left: 8px;">
                {{ formatDate(panelDate) }}
              </span>
            </div>
            <div class="ohhh-calendar-panel--close" @click="closePanel">
              <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
            </div>
          </div>

          <div class="ohhh-calendar-panel--section">
            <div class="ohhh-calendar-panel--label">选择服务</div>
            <div class="ohhh-calendar-panel--apps">
              <div
                v-for="app in appIcons"
                :key="app.key"
                class="ohhh-calendar-panel--app-item"
                :class="{ 'is-selected': selectedAppKey === app.key }"
                @click="selectApp(app.key)"
              >
                <div class="ohhh-calendar-panel--app-icon">
                  <div v-html="getAppSvg(app.key)" />
                </div>
                <div class="ohhh-calendar-panel--app-name">{{ app.name }}</div>
              </div>
            </div>
          </div>

          <div class="ohhh-calendar-panel--section">
            <div class="ohhh-calendar-panel--label">消费金额</div>
            <div class="ohhh-calendar-panel--price">
              <span class="ohhh-calendar-panel--currency">¥</span>
              <input
                ref="priceInputRef"
                v-model="priceValue"
                type="number"
                class="ohhh-calendar-panel--price-input"
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>
          </div>

          <div class="ohhh-calendar-panel--actions">
            <button class="ohhh-calendar-panel--btn secondary" @click="closePanel">取消</button>
            <button class="ohhh-calendar-panel--btn primary" @click="confirmSubscription">确定</button>
          </div>

          <div v-if="editingSubscription" class="ohhh-calendar-panel--delete">
            <button class="ohhh-calendar-panel--delete-btn" @click="deleteSubscription">
              删除此订阅
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, useTemplateRef, toRefs, ref, nextTick } from 'vue'
import { useSwipe } from '@vueuse/core'
import { useCalendar } from './hooks/useCalendar.js'
import { isSameDay, createWeekdays } from './utils'
import { icons } from './utils/icons.js'
import { appIcons, getAppIconByKey, getAppSvgByKey } from './utils/appIcons.js'

const swipeRef = useTemplateRef('swp')
const priceInputRef = useTemplateRef('priceInputRef')

const emit = defineEmits(['select-change', 'view-change', 'subscription-change'])

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
  subscriptions: {
    type: Object,
    default: () => ({})
  }
})

const { initialSelectedDate, initialViewMode, weekStart, markerDates, duration, subscriptions } = toRefs(props)

const showPanel = ref(false)
const panelDate = ref(null)
const selectedAppKey = ref(null)
const priceValue = ref('')
const editingSubscription = ref(null)

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

function getDateKey(date) {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getSubscription(date) {
  const key = getDateKey(date)
  return subscriptions.value[key]
}

function getAppSvg(appKey) {
  return getAppSvgByKey(appKey) || ''
}

function selectApp(appKey) {
  selectedAppKey.value = appKey
}

function formatDate(date) {
  if (!date) return ''
  const d = new Date(date)
  const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }
  return d.toLocaleDateString('zh-CN', options)
}

function handleDayClick(dateObj) {
  changeSelectedDate(dateObj.date)
  openPanel(dateObj.date)
}

function openPanel(date) {
  panelDate.value = date
  const existingSub = getSubscription(date)
  
  if (existingSub) {
    editingSubscription.value = existingSub
    selectedAppKey.value = existingSub.appKey
    priceValue.value = String(existingSub.price)
  } else {
    editingSubscription.value = null
    selectedAppKey.value = null
    priceValue.value = ''
  }
  
  showPanel.value = true
  
  nextTick(() => {
    if (priceInputRef.value) {
      priceInputRef.value.focus()
    }
  })
}

function closePanel() {
  showPanel.value = false
  panelDate.value = null
  selectedAppKey.value = null
  priceValue.value = ''
  editingSubscription.value = null
}

function confirmSubscription() {
  if (!selectedAppKey.value) {
    return
  }
  
  const price = parseFloat(priceValue.value) || 0
  const dateKey = getDateKey(panelDate.value)
  
  const subscription = {
    date: panelDate.value,
    appKey: selectedAppKey.value,
    price: price,
    isUsed: editingSubscription.value ? editingSubscription.value.isUsed : false
  }
  
  emit('subscription-change', {
    dateKey,
    subscription,
    action: editingSubscription.value ? 'update' : 'add'
  })
  
  closePanel()
}

function deleteSubscription() {
  if (!editingSubscription.value) return
  
  const dateKey = getDateKey(panelDate.value)
  emit('subscription-change', {
    dateKey,
    subscription: null,
    action: 'delete'
  })
  
  closePanel()
}

function toggleSubscriptionStatus(date) {
  const dateKey = getDateKey(date)
  const existingSub = getSubscription(date)
  
  if (!existingSub) return
  
  const updatedSub = {
    ...existingSub,
    isUsed: !existingSub.isUsed
  }
  
  emit('subscription-change', {
    dateKey,
    subscription: updatedSub,
    action: 'update'
  })
}

defineExpose({
  toggleViewMode,
  changePageTo,
  changeSelectedDate,
  openPanel,
  closePanel
})
</script>
