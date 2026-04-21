<template>
  <div class="stats-panel">
    <div class="stats-section day-stats">
      <div class="stats-header">
        <span class="stats-icon">☀️</span>
        <span class="stats-title">白天</span>
      </div>
      <div class="stats-count">
        <span class="count-value">{{ dayStats.totalDays }}</span>
        <span class="count-label">天记录</span>
      </div>
      <div v-if="topDayTags.length > 0" class="stats-tags">
        <div class="tags-label">高频标签:</div>
        <div class="tags-list">
          <span
            v-for="tag in topDayTags"
            :key="tag.tag"
            class="stats-tag"
          >
            {{ tag.tag }}
            <span class="tag-count">({{ tag.count }})</span>
          </span>
        </div>
      </div>
    </div>
    
    <div class="stats-divider"></div>
    
    <div class="stats-section night-stats">
      <div class="stats-header">
        <span class="stats-icon">🌙</span>
        <span class="stats-title">夜晚</span>
      </div>
      <div class="stats-count">
        <span class="count-value">{{ nightStats.totalDays }}</span>
        <span class="count-label">天记录</span>
      </div>
      <div v-if="topNightTags.length > 0" class="stats-tags">
        <div class="tags-label">高频标签:</div>
        <div class="tags-list">
          <span
            v-for="tag in topNightTags"
            :key="tag.tag"
            class="stats-tag"
          >
            {{ tag.tag }}
            <span class="tag-count">({{ tag.count }})</span>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  dayStats: {
    type: Object,
    default: () => ({ totalDays: 0, tagCounts: {} })
  },
  nightStats: {
    type: Object,
    default: () => ({ totalDays: 0, tagCounts: {} })
  },
  topDayTags: {
    type: Array,
    default: () => []
  },
  topNightTags: {
    type: Array,
    default: () => []
  }
})
</script>