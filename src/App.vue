<template>
  <div class="app-container">
    <div class="app-content">
      <OhhhVueCalendar
        ref="calendarRef"
        :week-start="1"
        :markerDates="markerDates"
        :eventSubscriptions="subscriptions"
        :showEventPopup="true"
        @select-change="onSelectChange"
        @event-hover="onEventHover"
      />
    </div>
    
    <div class="app-sidebar">
      <SubscriptionManager
        :subscriptions="subscriptions"
        @import="handleImportFiles"
        @update-name="handleUpdateName"
        @update-color="handleUpdateColor"
        @delete="handleDeleteSubscription"
      />
    </div>
  </div>
</template>

<script setup>
import { useTemplateRef, ref } from 'vue'
import OhhhVueCalendar from './packages/Calendar/Calendar.vue'
import SubscriptionManager from './packages/Calendar/components/SubscriptionManager.vue'
import { useCalendarSubscriptions } from './packages/Calendar/hooks/useSubscriptions.js'
import '/src/packages/Calendar/style/mobile/mobile.scss'

const calendarRef = useTemplateRef('calendarRef')

const markerDates = [
  '2025-08-04',
  '2025-08-05',
  '2025-08-06',
  '2025-08-07',
  {
    date: '2025-08-08',
    color: '#ff6a6a'
  }
]

const {
  subscriptions,
  importICSFiles,
  updateSubscriptionName,
  updateSubscriptionColor,
  deleteSubscription
} = useCalendarSubscriptions()

function onSelectChange(date) {
  console.log('选中日期:', date)
}

function onEventHover(date, events) {
  console.log('悬停日期:', date, '事件:', events)
}

async function handleImportFiles(files) {
  try {
    const errors = await importICSFiles(files)
    if (errors.length > 0) {
      console.warn('部分文件导入失败:', errors)
    }
  } catch (error) {
    console.error('导入文件失败:', error)
  }
}

function handleUpdateName(id, name) {
  updateSubscriptionName(id, name)
}

function handleUpdateColor(id, color) {
  updateSubscriptionColor(id, color)
}

function handleDeleteSubscription(id) {
  deleteSubscription(id)
}
</script>

<style scoped>
.app-container {
  display: flex;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
  padding: 24px;
  gap: 24px;
}

.app-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.app-sidebar {
  width: 320px;
  flex-shrink: 0;
}

.app-sidebar > div {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.06),
    0 0 0 1px rgba(0, 0, 0, 0.04);
}

.ohhh-calendar-container {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.06),
    0 0 0 1px rgba(0, 0, 0, 0.04);
}
</style>
