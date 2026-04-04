<template>
  <div ref="swp" class="ohhh-calendar-wrapper" :style="{ transform: transformDistance, transitionDuration: transitionDuration }">
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
      >
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
</template>

<script setup>
import { inject, useTemplateRef } from 'vue'
import { useSwipe } from '@vueuse/core'
import { isSameDay } from '../utils'

const swp = useTemplateRef('swp')

const {
  selected,
  allRenderDates,
  transformDistance,
  transitionDuration,
  onTransitionEnd,
  changeSelectedDate,
  markerDateList,
  changePageTo,
  isInTransition,
  startTransitionAnimation
} = inject('calendarContext')

const { lengthX } = useSwipe(swp, {
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

function _getMarkerColor(date) {
  return markerDateList.value.find(d => isSameDay(d.date, date))?.color
}
</script>
