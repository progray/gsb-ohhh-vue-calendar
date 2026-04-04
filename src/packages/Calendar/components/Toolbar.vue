<template>
  <div v-if="showToolbar" class="ohhh-calendar-toolbar">
    <slot name="toolbar" :year="currentYear" :month="currentMonth" :viewMode="viewMode">
      <div v-html="icons.arrowDoubleLeft" class="ohhh-calendar-toolbar--icon" @click="changePageTo('prev-year')" />
      <div v-html="icons.arrowLeft" class="ohhh-calendar-toolbar--icon" @click="changePageTo('prev-page')" />
      <div class="ohhh-calendar-toolbar--text">{{ headerLabel }}</div>
      <div v-html="icons.arrowRight" class="ohhh-calendar-toolbar--icon" @click="changePageTo('next-page')" />
      <div v-html="icons.arrowDoubleRight" class="ohhh-calendar-toolbar--icon" @click="changePageTo('next-year')" />
    </slot>
  </div>
</template>

<script setup>
import { computed, inject } from 'vue'
import { icons } from '../utils/icons.js'

const props = defineProps({
  showToolbar: {
    type: Boolean,
    default: true
  }
})

// 从父组件注入状态
const currentYear = inject('currentYear')
const currentMonth = inject('currentMonth')
const viewMode = inject('viewMode')
const changePageTo = inject('changePageTo')

// 顶部工具栏标题
const headerLabel = computed(() => `${currentYear.value}年${currentMonth.value + 1}月`)
</script>
