<template>
  <div class="minimal-mode-view"
    :style="{
      '--calendar-rows': renderRows,
      '--calendar-transition-duration': duration,
      '--translate-distance': transformDistance,
      '--transition-duration': transitionDuration
    }"
  >
    <StarField class="star-field-bg" />

    <div v-if="showToolbar" class="ohhh-calendar-toolbar">
      <slot name="toolbar" :year="currentYear" :month="currentMonth" :viewMode="viewMode">
        <div v-html="icons.arrowDoubleLeft" class="ohhh-calendar-toolbar--icon" @click="$emit('change-page-to', 'prev-year')" />
        <div v-html="icons.arrowLeft" class="ohhh-calendar-toolbar--icon" @click="$emit('change-page-to', 'prev-page')" />
        <div class="ohhh-calendar-toolbar--text">{{ headerLabel }}</div>
        <div v-html="icons.arrowRight" class="ohhh-calendar-toolbar--icon" @click="$emit('change-page-to', 'next-page')" />
        <div v-html="icons.arrowDoubleRight" class="ohhh-calendar-toolbar--icon" @click="$emit('change-page-to', 'next-year')" />
      </slot>
    </div>

    <div v-if="showWeekdays" class="ohhh-calendar-weekdays">
      <div v-for="(day, index) in weekdays" :key="day" class="ohhh-calendar-weekdays--weekday">
        <slot name="weekday" :weekday="day" :index="(index + weekStart) % 7">{{ day }}</slot>
      </div>
    </div>

    <div class="ohhh-calendar-wrapper">
      <div
        v-for="(item, index) in allRenderDates"
        :key="index"
        :style="{ left: 100 * (index - 1) + '%' }"
        class="ohhh-calendar-days"
        @transitionend="onTransitionEnd"
      >
        <div
          v-for="dateObj in item"
          :key="dateObj.key"
          class="ohhh-calendar-day"
          :class="{
            'is-selected': isSameDay(dateObj.date, selected),
            'is-today': isToday(dateObj.date),
            'other-month': !dateObj.current,
            'is-clicked': isDateClicked(dateObj.date)
          }"
          @click="handleDateClick(dateObj.date)"
        >
          <div class="glow-dot" v-if="isDateClicked(dateObj.date)">
            <div class="glow-dot-inner"></div>
            <div class="glow-dot-outer"></div>
          </div>
          <div class="date-indicator" v-else-if="isToday(dateObj.date)">
            <div class="today-pulse"></div>
          </div>
          <div class="hover-indicator" v-else></div>
        </div>
      </div>
    </div>

    <div v-if="showFooter" class="ohhh-calendar-footer">
      <slot name="footer" :year="currentYear" :month="currentMonth" :viewMode="viewMode">
        <div
          v-html="viewMode === 'week' ? icons.arrowDown : icons.arrowUp"
          class="ohhh-calendar-footer--icon"
          @click="$emit('toggle-view-mode')"
        />
      </slot>
    </div>
  </div>
</template>

<script setup>
import StarField from './StarField.vue'
import { isSameDay, formatDateKey, isToday } from '../utils'

const props = defineProps({
  allRenderDates: {
    type: Array,
    required: true
  },
  currentRenderDates: {
    type: Array,
    required: true
  },
  clickedDates: {
    type: Set,
    required: true
  },
  selected: {
    type: Date,
    required: true
  },
  currentYear: {
    type: Number,
    required: true
  },
  currentMonth: {
    type: Number,
    required: true
  },
  showWeekdays: {
    type: Boolean,
    default: true
  },
  showToolbar: {
    type: Boolean,
    default: true
  },
  showFooter: {
    type: Boolean,
    default: true
  },
  headerLabel: {
    type: String,
    required: true
  },
  viewMode: {
    type: String,
    required: true
  },
  icons: {
    type: Object,
    required: true
  },
  weekdays: {
    type: Array,
    required: true
  },
  weekStart: {
    type: Number,
    default: 0
  },
  transformDistance: {
    type: String,
    default: '0px'
  },
  transitionDuration: {
    type: String,
    default: '0s'
  },
  renderRows: {
    type: Number,
    default: 6
  },
  duration: {
    type: String,
    default: '0.3s'
  }
})

const emit = defineEmits(['change-page-to', 'change-selected-date', 'toggle-view-mode', 'transition-end'])

function isDateClicked(date) {
  const key = formatDateKey(date)
  return props.clickedDates.has(key)
}

function handleDateClick(date) {
  emit('change-selected-date', date)
}

function onTransitionEnd() {
  emit('transition-end')
}
</script>

<style lang="scss" scoped>
.minimal-mode-view {
  position: relative;
  background: var(--calendar-minimal-bg, #0a0a1a);
  border-radius: 16px;
  overflow: hidden;
  padding: 0;

  .star-field-bg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
  }

  .ohhh-calendar-toolbar {
    position: relative;
    z-index: 10;
    display: flex;
    justify-content: space-between;
    align-items: center;
    column-gap: 16px;
    padding: 16px 20px;
    background: linear-gradient(180deg, rgba(10, 10, 26, 0.9) 0%, transparent 100%);
  }

  .ohhh-calendar-toolbar--icon,
  .ohhh-calendar-footer--icon {
    display: flex;
    cursor: pointer;
    opacity: 0.5;
    transition: opacity 0.3s ease;

    &:hover {
      opacity: 1;
    }
  }

  .ohhh-calendar-toolbar--icon {
    fill: rgba(255, 255, 255, 0.6);
  }

  .ohhh-calendar-toolbar--icon svg {
    width: 24px;
    height: 24px;
  }

  .ohhh-calendar-toolbar--text {
    margin: 0 auto;
    font-size: 16px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.3);
    letter-spacing: 2px;
  }

  .ohhh-calendar-weekdays {
    position: relative;
    z-index: 10;
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    justify-items: center;
    align-items: center;
    height: 40px;
    padding: 0 8px;
  }

  .ohhh-calendar-weekdays--weekday {
    font-size: 12px;
    font-weight: 400;
    color: rgba(255, 255, 255, 0.15);
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .ohhh-calendar-wrapper {
    position: relative;
    z-index: 5;
    overflow: hidden;
    padding: 8px;
    height: calc(var(--calendar-rows) * 60px);
    transition: height var(--calendar-transition-duration) ease;
  }

  .ohhh-calendar-days {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
    position: absolute;
    inset: 0;
    width: 100%;
    padding: 8px;
    transform: translate3d(var(--translate-distance), 0, 0);
    transition: transform var(--transition-duration) ease;
  }

  .ohhh-calendar-day {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 60px;
    cursor: pointer;
    position: relative;
    border-radius: 8px;
    transition: all 0.3s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.03);
    }

    &.other-month {
      opacity: 0.3;
    }

    &.is-selected {
      background: rgba(0, 212, 255, 0.1);
    }
  }

  .glow-dot {
    position: relative;
    width: 12px;
    height: 12px;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .glow-dot-inner {
    width: 8px;
    height: 8px;
    background: var(--calendar-glow-dot-color, #00d4ff);
    border-radius: 50%;
    position: relative;
    z-index: 2;
    box-shadow: var(--calendar-glow-dot-glow, 0 0 10px #00d4ff, 0 0 20px #00d4ff);
    animation: glowPulse 2s ease-in-out infinite;
  }

  .glow-dot-outer {
    position: absolute;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: radial-gradient(
      circle,
      rgba(0, 212, 255, 0.3) 0%,
      rgba(0, 212, 255, 0.1) 40%,
      transparent 70%
    );
    animation: glowExpand 2s ease-in-out infinite;
  }

  .date-indicator {
    position: relative;
    width: 8px;
    height: 8px;
  }

  .today-pulse {
    width: 6px;
    height: 6px;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    animation: todayPulse 3s ease-in-out infinite;
  }

  .hover-indicator {
    width: 4px;
    height: 4px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 50%;
    transition: all 0.3s ease;
  }

  .ohhh-calendar-day:hover .hover-indicator {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.5);
  }

  .ohhh-calendar-footer {
    position: relative;
    z-index: 10;
    display: flex;
    justify-content: center;
    padding: 12px;
    background: linear-gradient(0deg, rgba(10, 10, 26, 0.9) 0%, transparent 100%);
  }

  .ohhh-calendar-footer--icon {
    fill: rgba(255, 255, 255, 0.4);
  }

  .ohhh-calendar-footer--icon svg {
    width: 20px;
    height: 20px;
  }
}

@keyframes glowPulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.8;
  }
}

@keyframes glowExpand {
  0%, 100% {
    transform: scale(1);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.5);
    opacity: 0.2;
  }
}

@keyframes todayPulse {
  0%, 100% {
    transform: scale(1);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.3);
    opacity: 0.8;
  }
}
</style>
