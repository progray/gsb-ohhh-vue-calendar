<template>
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

const swipeRef = useTemplateRef('swp')

// 从父组件注入状态
const selected = inject('selected')
const viewMode = inject('viewMode')
const currentRenderDates = inject('currentRenderDates')
const allRenderDates = inject('allRenderDates')
const transformDistance = inject('transformDistance')
const transitionDuration = inject('transitionDuration')
const isInTransition = inject('isInTransition')
const changePageTo = inject('changePageTo')
const changeSelectedDate = inject('changeSelectedDate')
const startTransitionAnimation = inject('startTransitionAnimation')
const onTransitionEnd = inject('onTransitionEnd')
const markerDateList = inject('markerDateList')

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

// 获取 marker 颜色
function _getMarkerColor(date) {
  return markerDateList.value.find(d => isSameDay(d.date, date))?.color
}
</script>
