<template>
  <div ref="swp" class="ohhh-calendar-wrapper">
    <div
      v-for="(item, index) in context.allRenderDates"
      :key="index"
      :style="{ left: 100 * (index - 1) + '%' }"
      class="ohhh-calendar-days"
      @transitionend="context.onTransitionEnd"
    >
      <div
        v-for="dateObj in item"
        :key="dateObj.key"
        class="ohhh-calendar-day"
        :class="{
          'is-selected': context.isSameDay(dateObj.date, context.selected),
          'is-today': context.isSameDay(dateObj.date, new Date()),
          'other-month': !dateObj.current
        }"
        @click="context.changeSelectedDate(dateObj.date)"
      >
        <div class="ohhh-calendar-day--inner">
          <div class="ohhh-calendar-day--inner-value">{{ dateObj.fullDate.date }}</div>
          <div class="ohhh-calendar-day--inner-label" v-if="$slots['day-label']">
            <slot name="day-label" :date="dateObj.date" />
          </div>
        </div>
        <div class="ohhh-calendar-day--marker" :style="{ background: context.getMarkerColor(dateObj.date) }" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { inject, useTemplateRef } from 'vue'
import { useSwipe } from '@vueuse/core'

const context = inject('calendarContext')
const swipeRef = useTemplateRef('swp')

const { lengthX } = useSwipe(swipeRef, {
  threshold: 0,
  onSwipe: () => {
    if (context.isInTransition) return
    context.transformDistance = -lengthX.value + 'px'
  },
  onSwipeEnd: (_, direction) => {
    if (context.isInTransition) return
    if (direction === 'left') {
      context.changePageTo('next-page')
    } else if (direction === 'right') {
      context.changePageTo('prev-page')
    } else {
      context.startTransitionAnimation(direction)
    }
  }
})
</script>
