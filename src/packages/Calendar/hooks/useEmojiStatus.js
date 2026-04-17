import { ref, computed } from 'vue'
import { formatDate, isSameDay } from '../utils/index.js'

const emojiStatusMap = ref(new Map())

const DEFAULT_EMOJIS = [
  '😊', '😢', '😡', '😍', '🎉',
  '😴', '🤔', '👍', '👎', '❤️',
  '💪', '🌟', '🔥', '💯', '✨',
  '🎯', '📅', '⏰', '💼', '🏠',
  '✈️', '🚗', '🎓', '💊', '🏥'
]

export function useEmojiStatus() {
  function getDateKey(date) {
    return formatDate(date)
  }

  function getEmojisForDate(date) {
    const key = getDateKey(date)
    return emojiStatusMap.value.get(key) || []
  }

  function addEmojiStatus(date, emoji, description = '') {
    const key = getDateKey(date)
    const existing = emojiStatusMap.value.get(key) || []
    
    const existingIndex = existing.findIndex(item => item.emoji === emoji)
    if (existingIndex !== -1) {
      existing.splice(existingIndex, 1)
    }
    
    existing.push({
      emoji,
      description,
      timestamp: Date.now()
    })
    
    emojiStatusMap.value.set(key, existing)
    return existing
  }

  function removeEmojiStatus(date, emoji) {
    const key = getDateKey(date)
    const existing = emojiStatusMap.value.get(key) || []
    
    const index = existing.findIndex(item => item.emoji === emoji)
    if (index !== -1) {
      existing.splice(index, 1)
      if (existing.length === 0) {
        emojiStatusMap.value.delete(key)
      }
    }
    
    return existing
  }

  function hasEmoji(date, emoji) {
    const emojis = getEmojisForDate(date)
    return emojis.some(item => item.emoji === emoji)
  }

  function clearAllEmojis() {
    emojiStatusMap.value.clear()
  }

  return {
    emojiStatusMap,
    DEFAULT_EMOJIS,
    getEmojisForDate,
    addEmojiStatus,
    removeEmojiStatus,
    hasEmoji,
    clearAllEmojis
  }
}
