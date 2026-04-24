<template>
  <svg 
    :width="width" 
    :height="height" 
    :viewBox="`0 0 ${width} ${height}`"
    class="sparkline"
    :class="{ 'sparkline--empty': !hasData }"
  >
    <defs>
      <filter id="sparkline-shadow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow 
          dx="0" 
          dy="1" 
          stdDeviation="1.5" 
          :flood-color="shadowColor"
          flood-opacity="0.6"
        />
      </filter>
      <filter id="sparkline-glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="0.8" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    
    <g v-if="hasData">
      <path 
        :d="shadowPathData" 
        fill="none"
        :stroke="shadowColor"
        :stroke-width="shadowStrokeWidth"
        stroke-linecap="round"
        stroke-linejoin="round"
        opacity="0.3"
      />
      <path 
        :d="pathData" 
        :fill="fill"
        :stroke="stroke"
        :stroke-width="strokeWidth"
        stroke-linecap="round"
        stroke-linejoin="round"
        filter="url(#sparkline-glow)"
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
    default: '#8a8aa0'
  },
  strokeWidth: {
    type: Number,
    default: 2.5
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
const shadowColor = computed(() => '#1a1a2a')
const shadowStrokeWidth = computed(() => props.strokeWidth + 1)

const pathData = computed(() => {
  const { data, width, height, minValue, maxValue } = props
  
  if (data.length < 2) return ''
  
  const padding = props.strokeWidth + 2
  const chartWidth = width - padding * 2
  const chartHeight = height - padding * 2
  
  const valueRange = maxValue - minValue
  
  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * chartWidth
    const y = padding + chartHeight - ((value - minValue) / valueRange) * chartHeight
    return { x, y }
  })
  
  return createSmoothPath(points)
})

const shadowPathData = computed(() => {
  const { data, width, height, minValue, maxValue } = props
  
  if (data.length < 2) return ''
  
  const padding = props.strokeWidth + 2
  const chartWidth = width - padding * 2
  const chartHeight = height - padding * 2
  
  const valueRange = maxValue - minValue
  
  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * chartWidth
    const y = padding + chartHeight - ((value - minValue) / valueRange) * chartHeight + 1
    return { x, y }
  })
  
  return createSmoothPath(points)
})

function createSmoothPath(points) {
  if (points.length < 2) return ''
  
  if (points.length === 2) {
    return `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)} L ${points[1].x.toFixed(2)} ${points[1].y.toFixed(2)}`
  }
  
  let path = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`
  
  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i]
    const next = points[i + 1]
    const nextNext = points[i + 2] || next
    const prev = points[i - 1] || current
    
    let cp1x, cp1y, cp2x, cp2y
    
    if (i === 0) {
      const controlScale = 0.3
      cp1x = current.x + (next.x - current.x) * controlScale
      cp1y = current.y + (next.y - current.y) * controlScale
      cp2x = next.x - (nextNext.x - current.x) * controlScale
      cp2y = next.y - (nextNext.y - current.y) * controlScale
    } else if (i === points.length - 2) {
      const controlScale = 0.3
      cp1x = current.x + (next.x - prev.x) * controlScale
      cp1y = current.y + (next.y - prev.y) * controlScale
      cp2x = next.x - (next.x - current.x) * controlScale
      cp2y = next.y - (next.y - current.y) * controlScale
    } else {
      const controlScale = 0.25
      cp1x = current.x + (next.x - prev.x) * controlScale
      cp1y = current.y + (next.y - prev.y) * controlScale
      cp2x = next.x - (nextNext.x - current.x) * controlScale
      cp2y = next.y - (nextNext.y - current.y) * controlScale
    }
    
    path += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${next.x.toFixed(2)} ${next.y.toFixed(2)}`
  }
  
  return path
}
</script>

<style lang="scss" scoped>
.sparkline {
  display: inline-block;
  vertical-align: middle;
  
  path {
    transition: d 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  }
}

.sparkline--empty {
  opacity: 0.5;
}
</style>
