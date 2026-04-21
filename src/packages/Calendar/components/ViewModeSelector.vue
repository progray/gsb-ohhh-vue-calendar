<template>
  <div class="view-mode-selector">
    <button
      class="view-mode-btn"
      :class="{ 'is-active': currentView === 'day' }"
      @click="selectView('day')"
    >
      <span class="btn-icon">☀️</span>
      <span class="btn-text">白天</span>
    </button>
    <button
      class="view-mode-btn"
      :class="{ 'is-active': currentView === 'night' }"
      @click="selectView('night')"
    >
      <span class="btn-icon">🌙</span>
      <span class="btn-text">夜晚</span>
    </button>
    <button
      class="view-mode-btn"
      :class="{ 'is-active': currentView === 'both' }"
      @click="selectView('both')"
    >
      <span class="btn-icon">🔄</span>
      <span class="btn-text">双面</span>
    </button>
  </div>
</template>

<script setup>
const props = defineProps({
  currentView: {
    type: String,
    default: 'both'
  }
})

const emit = defineEmits(['change'])

function selectView(view) {
  emit('change', view)
}
</script>