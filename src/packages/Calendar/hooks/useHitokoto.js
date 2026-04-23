import { ref, computed, watch } from 'vue'
import { HitokotoService } from '../services/hitokoto.js'
import { isSameDay } from '../utils/index.js'

const SESSION_KEY = 'hitokoto_cache'

function _getDateKey(date) {
  if (date instanceof Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }
  return String(date)
}

function _getSessionCache() {
  try {
    const data = sessionStorage.getItem(SESSION_KEY)
    return data ? JSON.parse(data) : {}
  } catch (e) {
    return {}
  }
}

function _setSessionCache(dateKey, value) {
  try {
    const cache = _getSessionCache()
    cache[dateKey] = value
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(cache))
  } catch (e) {
    console.warn('Failed to save to sessionStorage:', e)
  }
}

function _getCacheForDate(date) {
  const dateKey = _getDateKey(date)
  const cache = _getSessionCache()
  return cache[dateKey] || null
}

export function useHitokoto(selectedDate) {
  const hitokotoData = ref(null)
  const isLoading = ref(false)
  const error = ref(null)
  const isOpened = ref(false)
  const showToast = ref(false)
  const toastMessage = ref('')

  const cachedData = computed(() => _getCacheForDate(selectedDate.value))

  const hasOpenedToday = computed(() => {
    const cache = cachedData.value
    return cache && cache.isOpened === true
  })

  watch(
    selectedDate,
    (newDate, oldDate) => {
      if (oldDate && !isSameDay(newDate, oldDate)) {
        resetState()
      }
    }
  )

  function resetState() {
    hitokotoData.value = null
    isLoading.value = false
    error.value = null
    isOpened.value = false
  }

  async function openHitokoto() {
    if (isLoading.value) return

    const cache = cachedData.value
    if (cache && cache.data) {
      hitokotoData.value = cache.data
      isOpened.value = true
      _setSessionCache(_getDateKey(selectedDate.value), {
        isOpened: true,
        data: cache.data,
        openedAt: Date.now()
      })
      return
    }

    isLoading.value = true
    error.value = null

    try {
      const data = await HitokotoService.fetchHitokoto()
      hitokotoData.value = data
      isOpened.value = true

      _setSessionCache(_getDateKey(selectedDate.value), {
        isOpened: true,
        data: data,
        openedAt: Date.now()
      })
    } catch (err) {
      error.value = err.message || '获取一言失败'
      showToastMessage(error.value)
    } finally {
      isLoading.value = false
    }
  }

  async function copyToClipboard() {
    if (!hitokotoData.value) return

    try {
      const formatted = HitokotoService.formatHitokoto(hitokotoData.value)
      const textToCopy = formatted.fullText

      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(textToCopy)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = textToCopy
        textarea.style.position = 'fixed'
        textarea.style.left = '-9999px'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }

      showToastMessage('已复制到剪贴板')
    } catch (err) {
      showToastMessage('复制失败，请手动复制')
      console.error('Copy failed:', err)
    }
  }

  function showToastMessage(message) {
    toastMessage.value = message
    showToast.value = true

    setTimeout(() => {
      showToast.value = false
    }, 2000)
  }

  const formattedHitokoto = computed(() => {
    if (!hitokotoData.value) return null
    return HitokotoService.formatHitokoto(hitokotoData.value)
  })

  return {
    hitokotoData,
    isLoading,
    error,
    isOpened,
    showToast,
    toastMessage,
    hasOpenedToday,
    formattedHitokoto,
    openHitokoto,
    resetState,
    copyToClipboard
  }
}

export default useHitokoto
