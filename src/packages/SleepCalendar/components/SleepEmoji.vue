<template>
  <svg 
    :width="size" 
    :height="size" 
    viewBox="0 0 100 100"
    :class="['sleep-emoji', `sleep-emoji--${variant}`]"
  >
    <g :transform="`translate(50, 50) scale(${scale})`">
      <ellipse 
        cx="0" 
        cy="0" 
        rx="38" 
        ry="36" 
        :fill="fillColor" 
        :stroke="strokeColor" 
        :stroke-width="strokeWidth"
        :stroke-linecap="strokeLinecap"
        :stroke-linejoin="strokeLinejoin"
      />
      
      <g v-if="rating === 1">
        <ellipse cx="-16" cy="-8" rx="10" ry="4" :fill="strokeColor" transform="rotate(-10 -16 -8)" />
        <ellipse cx="16" cy="-8" rx="10" ry="4" :fill="strokeColor" transform="rotate(10 16 -8)" />
        <path 
          d="M -18 18 Q -8 10 0 18 Q 8 26 18 18" 
          :fill="none" 
          :stroke="strokeColor" 
          :stroke-width="strokeWidth"
          :stroke-linecap="strokeLinecap"
        />
      </g>
      
      <g v-else-if="rating === 2">
        <ellipse cx="-16" cy="-6" rx="9" ry="3" :fill="strokeColor" transform="rotate(-5 -16 -6)" />
        <ellipse cx="16" cy="-6" rx="9" ry="3" :fill="strokeColor" transform="rotate(5 16 -6)" />
        <path 
          d="M -14 16 Q -8 14 0 16 Q 8 18 14 16" 
          :fill="none" 
          :stroke="strokeColor" 
          :stroke-width="strokeWidth"
          :stroke-linecap="strokeLinecap"
        />
      </g>
      
      <g v-else-if="rating === 3">
        <circle cx="-16" cy="-6" r="6" :fill="strokeColor" />
        <circle cx="16" cy="-6" r="6" :fill="strokeColor" />
        <line 
          x1="-12" 
          y1="16" 
          x2="12" 
          y2="16" 
          :stroke="strokeColor" 
          :stroke-width="strokeWidth"
          :stroke-linecap="strokeLinecap"
        />
      </g>
      
      <g v-else-if="rating === 4">
        <circle cx="-16" cy="-8" r="7" :fill="strokeColor" />
        <circle cx="16" cy="-8" r="7" :fill="strokeColor" />
        <path 
          d="M -14 12 Q -8 20 0 20 Q 8 20 14 12" 
          :fill="none" 
          :stroke="strokeColor" 
          :stroke-width="strokeWidth"
          :stroke-linecap="strokeLinecap"
        />
      </g>
      
      <g v-else-if="rating === 5">
        <circle cx="-16" cy="-10" r="8" :fill="strokeColor" />
        <circle cx="16" cy="-10" r="8" :fill="strokeColor" />
        <path 
          d="M -18 10 Q -8 26 0 26 Q 8 26 18 10" 
          :fill="none" 
          :stroke="strokeColor" 
          :stroke-width="strokeWidth"
          :stroke-linecap="strokeLinecap"
        />
      </g>
    </g>
  </svg>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  rating: {
    type: Number,
    default: 3,
    validator: (v) => v >= 1 && v <= 5
  },
  size: {
    type: Number,
    default: 48
  },
  variant: {
    type: String,
    default: 'outline',
    validator: (v) => ['outline', 'filled'].includes(v)
  }
})

const fillColor = computed(() => props.variant === 'filled' ? '#2a2a3a' : 'transparent')
const strokeColor = computed(() => '#8a8aa0')
const strokeWidth = computed(() => 2.5)
const strokeLinecap = computed(() => 'round')
const strokeLinejoin = computed(() => 'round')
const scale = computed(() => 0.92)
</script>

<style lang="scss" scoped>
.sleep-emoji {
  display: inline-block;
  vertical-align: middle;
}

.sleep-emoji--outline {
  svg {
    circle, ellipse, path, line {
      transition: all 0.3s ease;
    }
  }
}
</style>
