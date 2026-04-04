<template>
  <div class="ohhh-calendar-toolbar">
    <slot name="toolbar" :year="context.currentYear" :month="context.currentMonth" :viewMode="context.viewMode">
      <div v-html="context.icons.arrowDoubleLeft" class="ohhh-calendar-toolbar--icon" @click="context.changePageTo('prev-year')" />
      <div v-html="context.icons.arrowLeft" class="ohhh-calendar-toolbar--icon" @click="context.changePageTo('prev-page')" />
      <div class="ohhh-calendar-toolbar--text">{{ context.currentYear }}年{{ context.currentMonth + 1 }}月</div>
      <div v-html="context.icons.arrowRight" class="ohhh-calendar-toolbar--icon" @click="context.changePageTo('next-page')" />
      <div v-html="context.icons.arrowDoubleRight" class="ohhh-calendar-toolbar--icon" @click="context.changePageTo('next-year')" />
    </slot>
  </div>
</template>

<script setup>
import { inject } from 'vue'

const context = inject('calendarContext')
</script>
