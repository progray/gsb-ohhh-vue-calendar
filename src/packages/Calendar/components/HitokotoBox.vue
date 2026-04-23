<template>
  <div class="hitokoto-box" :class="{ 'is-opened': isOpened }">
    <transition name="box-open">
      <div v-if="!isOpened && !isLoading" class="hitokoto-box--closed" @click.stop="handleOpen">
        <div v-html="envelopeIcon" class="hitokoto-box--icon" />
      </div>
    </transition>

    <transition name="loading-spin">
      <div v-if="isLoading" class="hitokoto-box--loading">
        <div class="hitokoto-box--spinner" />
      </div>
    </transition>

    <transition name="content-fade">
      <div v-if="isOpened && formattedHitokoto" class="hitokoto-box--content">
        <p class="hitokoto-box--content-text">{{ formattedHitokoto.content }}</p>
        <p class="hitokoto-box--content-source">{{ formattedHitokoto.source }}</p>
        <div class="hitokoto-box--actions">
          <div v-html="copyIcon" class="hitokoto-box--copy-btn" @click.stop="handleCopy" title="复制到剪贴板" />
        </div>
      </div>
    </transition>

    <transition name="toast-fade">
      <div v-if="showToast" class="hitokoto-box--toast">{{ toastMessage }}</div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { icons } from '../utils/icons.js'

const props = defineProps({
  isOpened: {
    type: Boolean,
    default: false
  },
  isLoading: {
    type: Boolean,
    default: false
  },
  formattedHitokoto: {
    type: Object,
    default: null
  },
  showToast: {
    type: Boolean,
    default: false
  },
  toastMessage: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['open', 'copy'])

const envelopeIcon = computed(() => icons.envelope || icons.giftBox || '')
const copyIcon = computed(() => icons.copy || '')

function handleOpen() {
  emit('open')
}

function handleCopy() {
  emit('copy')
}
</script>
