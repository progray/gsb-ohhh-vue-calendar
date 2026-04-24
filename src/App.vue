<template>
  <div class="app-container">
    <ohhh-vue-calendar
      ref="calendarRef"
      :week-start="1"
      :subscriptions="subscriptions"
      @select-change="onSelectChange"
      @subscription-change="onSubscriptionChange"
    />
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useTemplateRef } from 'vue'
import OhhhVueCalendar from './packages/Calendar/Calendar.vue'
import '/src/packages/Calendar/style/mobile/mobile.scss'

const calendarRef = useTemplateRef('calendarRef')

const subscriptions = reactive({})

const STORAGE_KEY = 'subscription-calendar-data'

function loadSubscriptions() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const data = JSON.parse(saved)
      Object.assign(subscriptions, data)
    }
  } catch (e) {
    console.error('Failed to load subscriptions:', e)
  }
}

function saveSubscriptions() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(subscriptions))
  } catch (e) {
    console.error('Failed to save subscriptions:', e)
  }
}

function onSelectChange(date) {
  console.log('Selected date:', date)
}

function onSubscriptionChange(payload) {
  const { dateKey, subscription, action } = payload
  
  if (action === 'delete') {
    delete subscriptions[dateKey]
  } else {
    subscriptions[dateKey] = subscription
  }
  
  saveSubscriptions()
  console.log('Subscription changed:', { dateKey, subscription, action })
}

loadSubscriptions()
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body {
  background: #000000;
  min-height: 100vh;
}

#app {
  background: #000000;
  min-height: 100vh;
}

.app-container {
  background: #000000;
  min-height: 100vh;
  padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
}
</style>
