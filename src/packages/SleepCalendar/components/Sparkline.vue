<template>
  <svg 
    :width="width" 
    :height="height" 
    :viewBox="`0 0 ${width} ${height}`"
    class="sparkline"
    :class="{ 'sparkline--empty': !hasData }"
  >
    <g v-if="hasData">
      <path 
        :d="pathData" 
        :fill="fill"
        :stroke="stroke"
        :stroke-width="strokeWidth"
        :stroke-linecap="strokeLinecap"
        :stroke-linejoin="strokeLinejoin"
      />
    </g>
    <g v-else>
      <line 
        :x1="0" 
        :y1="height / 2" 
        :x2="width" 
        :y2="height / 2"
        :stroke="emptyStroke"
        :stroke-width="1"
        stroke-dasharray="4 4"
      />
    </g>
  </svg>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  data: {
    type: Array,
    default: () => []
  },
  width: {
    type: Number,
    default: 120
  },
  height: {
    type: Number,
    default: 32
  },
  stroke: {
    type: String,
    default: '#6a6a80'
  },
  strokeWidth: {
    type: Number,
    default: 1.5
  },
  fill: {
    type: String,
    default: 'none'
  },
  minValue: {
    type: Number,
    default: 1
  },
  maxValue: {
    type: Number,
    default: 5
  }
})

const hasData = computed(() => props.data.length > 1)
const emptyStroke = computed(() => '#3a3a4a')
const strokeLinecap = computed(() => 'round')
const strokeLinejoin = computed(() => 'round')

const pathData = computed(() => {
  const { data, width, height, minValue, maxValue } = props
  
  if (data.length < 2) return ''
  
  const padding = props.strokeWidth
  const chartWidth = width - padding * 2
  const chartHeight = height - padding * 2
  
  const valueRange = maxValue - minValue
  
  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * chartWidth
    const y = padding + chartHeight - ((value - minValue) / valueRange) * chartHeight
    return { x, y }
  })
  
  if (points.length < 2) return ''
  
  let path = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`
  
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]
    const curr = points[i]
    
    const cpX = (prev.x + curr.x) / 2
    path += ` Q ${prev.x + (curr.x - prev.x) * 0.5} ${prev.y}, ${cpX} ${(prev.y + curr.y) / 2}`
  }
  
  const last = points[points.length - 1]
  const secondLast = points[points.length - 2]
  path += ` Q ${secondLast.x + (last.x - secondLast.x) * 0.5} ${last.y}, ${last.x.toFixed(2)} ${last.y.toFixed(2)}`
  
  return path
})
</script>

<style lang="scss" scoped>
.sparkline {
  display: inline-block;
  vertical-align: middle;
  
  path {
    transition: d 0.5s ease;
  }
}

.sparkline--empty {
  opacity: 0.5;
}
</style>
