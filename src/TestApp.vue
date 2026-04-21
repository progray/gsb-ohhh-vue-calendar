<template>
  <div class="test-container">
    <h1>Test Calendar</h1>
    <ohhh-vue-calendar :week-start="1" />
  </div>
</template>

<script setup>
import OhhhVueCalendar from './packages/Calendar/Calendar.vue'
import './packages/Calendar/style/mobile/mobile.scss'
</script>

<style>
.test-container {
  padding: 20px;
}
</style>
