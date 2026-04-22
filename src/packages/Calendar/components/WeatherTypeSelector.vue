<template>
  <div class="weather-type-selector">
    <select 
      v-model="selectedType" 
      @change="handleChange"
      class="type-select"
    >
      <option v-for="(config, type) in weatherTypes" :key="type" :value="type">
        {{ config.label }} ({{ config.unit }})
      </option>
    </select>
    <div class="type-indicator" :style="{ background: currentTypeInfo.color }"></div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { WEATHER_TYPES } from '../services/weatherService.js'

const props = defineProps({
  modelValue: {
    type: String,
    default: 'temperature'
  }
})

const emit = defineEmits(['update:modelValue'])

const weatherTypes = WEATHER_TYPES
const selectedType = ref(props.modelValue)

const currentTypeInfo = computed(() => WEATHER_TYPES[selectedType.value] || WEATHER_TYPES.temperature)

watch(() => props.modelValue, (newVal) => {
  selectedType.value = newVal
})

function handleChange() {
  emit('update:modelValue', selectedType.value)
}
</script>

<style scoped>
.weather-type-selector {
  display: flex;
  align-items: center;
  gap: 8px;
}

.type-select {
  padding: 6px 12px;
  padding-right: 30px;
  border: 1px solid var(--calendar-text-color-level-4);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  color: var(--calendar-text-color-level-1);
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23606266' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
  transition: all 0.3s ease;
}

.type-select:hover {
  border-color: var(--calendar-theme-color);
}

.type-select:focus {
  outline: none;
  border-color: var(--calendar-theme-color);
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.type-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  transition: background-color 0.3s ease;
}
</style>
