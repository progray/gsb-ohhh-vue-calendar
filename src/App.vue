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
      
      <div class="app-subscription-section">
        <div class="app-subscription-header" @click="toggleSubscriptionPanel">
          <div class="app-subscription-header-left">
            <span class="app-subscription-icon">📅</span>
            <span class="app-subscription-title">日历订阅</span>
            <span v-if="subscriptions.length > 0" class="app-subscription-count">
              {{ subscriptions.length }} 个订阅
            </span>
          </div>
          <div class="app-subscription-toggle" :class="{ 'is-expanded': isSubscriptionExpanded }">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>
        </div>
        
        <Transition name="subscription-panel">
          <div v-if="isSubscriptionExpanded" class="app-subscription-panel">
            <SubscriptionManager
              :subscriptions="subscriptions"
              @import="handleImportFiles"
              @update-name="handleUpdateName"
              @update-color="handleUpdateColor"
              @delete="handleDeleteSubscription"
            />
          </div>
        </Transition>
      </div>
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
const isSubscriptionExpanded = ref(false)

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

function toggleSubscriptionPanel() {
  isSubscriptionExpanded.value = !isSubscriptionExpanded.value
}

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
}

.app-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 900px;
  margin: 0 auto;
  width: 100%;
}

.app-subscription-section {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.06),
    0 0 0 1px rgba(0, 0, 0, 0.04);
}

.app-subscription-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.app-subscription-header:hover {
  background: rgba(0, 0, 0, 0.02);
}

.app-subscription-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.app-subscription-icon {
  font-size: 18px;
}

.app-subscription-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--calendar-text-color-level-1, #303133);
}

.app-subscription-count {
  font-size: 12px;
  color: var(--calendar-text-color-level-3, #909399);
  background: rgba(0, 0, 0, 0.05);
  padding: 2px 8px;
  border-radius: 10px;
}

.app-subscription-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  color: var(--calendar-text-color-level-3, #909399);
  transition: transform 0.2s ease;
}

.app-subscription-toggle svg {
  width: 18px;
  height: 18px;
}

.app-subscription-toggle.is-expanded {
  transform: rotate(180deg);
}

.app-subscription-panel {
  padding: 0 20px 20px 20px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  padding-top: 16px;
}

.subscription-panel-enter-active,
.subscription-panel-leave-active {
  transition: all 0.25s ease;
  overflow: hidden;
}

.subscription-panel-enter-from,
.subscription-panel-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.subscription-panel-enter-to,
.subscription-panel-leave-from {
  max-height: 600px;
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
