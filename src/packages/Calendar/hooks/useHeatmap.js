import { ref, computed, watch } from 'vue'
import { isSameDay } from '../utils/index.js'

const DEFAULT_COLOR_SCALE = [
  '#ebedf0',
  '#9be9a8',
  '#40c463',
  '#30a14e',
  '#216e39'
]

const DEFAULT_LEVELS = 5

function formatDateKey(date) {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getValueRange(values) {
  if (!values || values.length === 0) {
    return { min: 0, max: 0 }
  }
  const validValues = values.filter(v => typeof v === 'number' && !isNaN(v))
  if (validValues.length === 0) {
    return { min: 0, max: 0 }
  }
  const min = Math.min(...validValues)
  const max = Math.max(...validValues)
  return { min, max }
}

function calculateIntervals(min, max, levels) {
  if (min === max) {
    return [{ min, max, colorIndex: 0 }]
  }
  const intervalSize = (max - min) / levels
  const intervals = []
  
  for (let i = 0; i < levels; i++) {
    intervals.push({
      min: min + i * intervalSize,
      max: i === levels - 1 ? max : min + (i + 1) * intervalSize,
      colorIndex: i
    })
  }
  return intervals
}

function getColorIndexForValue(value, intervals, min, max) {
  if (typeof value !== 'number' || isNaN(value)) {
    return 0
  }
  if (min === max) {
    return 1
  }
  for (let i = 0; i < intervals.length; i++) {
    const interval = intervals[i]
    if (value >= interval.min && (value < interval.max || i === intervals.length - 1)) {
      return i + 1
    }
  }
  return 0
}

export function useHeatmap(props, emit) {
  const selectedIntervalIndex = ref(null)
  const hoveredDateValue = ref(null)
  const hoveredDate = ref(null)

  const heatmapDataMap = computed(() => {
    const map = new Map()
    if (!props.heatmapData || !Array.isArray(props.heatmapData)) {
      return map
    }
    for (const item of props.heatmapData) {
      if (item && item.date !== undefined && item.value !== undefined) {
        const key = formatDateKey(item.date)
        map.set(key, item.value)
      }
    }
    return map
  })

  const valueRange = computed(() => {
    const values = Array.from(heatmapDataMap.value.values())
    return getValueRange(values)
  })

  const colorScale = computed(() => {
    if (props.colorScale && Array.isArray(props.colorScale) && props.colorScale.length > 0) {
      return props.colorScale
    }
    return DEFAULT_COLOR_SCALE
  })

  const levels = computed(() => {
    if (props.levels && typeof props.levels === 'number' && props.levels > 0) {
      return Math.min(props.levels, colorScale.value.length - 1)
    }
    return Math.min(DEFAULT_LEVELS, colorScale.value.length - 1)
  })

  const intervals = computed(() => {
    return calculateIntervals(valueRange.value.min, valueRange.value.max, levels.value)
  })

  const legendData = computed(() => {
    const data = []
    data.push({
      min: null,
      max: null,
      colorIndex: 0,
      color: colorScale.value[0],
      count: 0,
      label: '无数据'
    })
    
    for (const interval of intervals.value) {
      const count = Array.from(heatmapDataMap.value.values()).filter(v => {
        if (typeof v !== 'number' || isNaN(v)) return false
        return v >= interval.min && (v < interval.max || interval.colorIndex === intervals.value.length - 1)
      }).length
      
      data.push({
        min: interval.min,
        max: interval.max,
        colorIndex: interval.colorIndex + 1,
        color: colorScale.value[interval.colorIndex + 1] || colorScale.value[colorScale.value.length - 1],
        count,
        label: interval.colorIndex === intervals.value.length - 1
          ? `${interval.min.toFixed(1)} - ${interval.max.toFixed(1)}`
          : `${interval.min.toFixed(1)} - ${interval.max.toFixed(1)}`
      })
    }
    return data
  })

  function getHeatmapColor(date) {
    if (!props.showHeatmap) {
      return null
    }
    const key = formatDateKey(date)
    const value = heatmapDataMap.value.get(key)
    
    if (value === undefined) {
      return colorScale.value[0]
    }
    
    const colorIndex = getColorIndexForValue(value, intervals.value, valueRange.value.min, valueRange.value.max)
    return colorScale.value[colorIndex] || colorScale.value[0]
  }

  function getDateValue(date) {
    const key = formatDateKey(date)
    return heatmapDataMap.value.get(key)
  }

  function isDateHighlighted(date) {
    if (selectedIntervalIndex.value === null) {
      return true
    }
    if (selectedIntervalIndex.value === 0) {
      const key = formatDateKey(date)
      return !heatmapDataMap.value.has(key)
    }
    
    const key = formatDateKey(date)
    const value = heatmapDataMap.value.get(key)
    if (value === undefined) {
      return false
    }
    
    const intervalIndex = selectedIntervalIndex.value - 1
    if (intervalIndex < 0 || intervalIndex >= intervals.value.length) {
      return false
    }
    
    const interval = intervals.value[intervalIndex]
    return value >= interval.min && (value < interval.max || intervalIndex === intervals.value.length - 1)
  }

  function handleDateHover(date) {
    if (!props.showHeatmap) return
    const key = formatDateKey(date)
    const value = heatmapDataMap.value.get(key)
    hoveredDate.value = date
    hoveredDateValue.value = value
    emit('heatmap-hover', { date, value })
  }

  function handleDateLeave() {
    hoveredDate.value = null
    hoveredDateValue.value = null
  }

  function handleLegendClick(legendItem) {
    if (selectedIntervalIndex.value === legendItem.colorIndex) {
      selectedIntervalIndex.value = null
    } else {
      selectedIntervalIndex.value = legendItem.colorIndex
    }
    emit('heatmap-filter-change', {
      selectedInterval: selectedIntervalIndex.value !== null ? legendItem : null,
      selectedIntervalIndex
    })
  }

  function clearFilter() {
    selectedIntervalIndex.value = null
    emit('heatmap-filter-change', {
      selectedInterval: null,
      selectedIntervalIndex: null
    })
  }

  watch(() => props.heatmapData, () => {
    selectedIntervalIndex.value = null
    hoveredDate.value = null
    hoveredDateValue.value = null
  }, { deep: true })

  return {
    showHeatmap: computed(() => !!props.showHeatmap),
    selectedIntervalIndex,
    hoveredDateValue,
    hoveredDate,
    heatmapDataMap,
    valueRange,
    colorScale,
    levels,
    intervals,
    legendData,
    getHeatmapColor,
    getDateValue,
    isDateHighlighted,
    handleDateHover,
    handleDateLeave,
    handleLegendClick,
    clearFilter
  }
}
