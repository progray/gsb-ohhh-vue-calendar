import { ref, computed, watch } from 'vue'
import {
  saveCapsule,
  loadCapsule,
  loadAllCapsules,
  deleteCapsule,
  deleteAllExpiredCapsules,
  updateScratchProgress,
  hasCapsule,
  getDatesWithCapsules,
  formatDateKey,
  getCapsuleStatus,
  isPastDate,
  isFutureDate,
  isToday,
  calculateTimeLeft,
  CapsuleStatus,
  MAX_CONTENT_LENGTH
} from '../utils/timeCapsule.js'

export function useTimeCapsule() {
  const capsules = ref(loadAllCapsules())
  const selectedDate = ref(null)
  const selectedCapsule = ref(null)
  const isEditModalOpen = ref(false)
  const isCountdownModalOpen = ref(false)
  const isScratchModalOpen = ref(false)

  const datesWithCapsules = computed(() => {
    return Object.keys(capsules.value).map(key => ({
      date: key,
      capsule: capsules.value[key],
      status: getCapsuleStatus(key)
    }))
  })

  const lockedCapsules = computed(() => {
    return datesWithCapsules.value.filter(item => item.status === CapsuleStatus.LOCKED)
  })

  const unlockedCapsules = computed(() => {
    return datesWithCapsules.value.filter(item => item.status === CapsuleStatus.UNLOCKED)
  })

  const expiredCapsules = computed(() => {
    return datesWithCapsules.value.filter(item => item.status === CapsuleStatus.EXPIRED)
  })

  function refreshCapsules() {
    capsules.value = loadAllCapsules()
  }

  function getCapsuleForDate(date) {
    const dateKey = formatDateKey(date)
    return capsules.value[dateKey] || null
  }

  function hasCapsuleForDate(date) {
    return getCapsuleForDate(date) !== null
  }

  function getCapsuleStatusForDate(date) {
    return getCapsuleStatus(date)
  }

  function saveNewCapsule(date, content) {
    if (!content || content.trim().length === 0) {
      throw new Error('内容不能为空')
    }
    if (content.length > MAX_CONTENT_LENGTH) {
      throw new Error(`内容不能超过 ${MAX_CONTENT_LENGTH} 字`)
    }
    
    const saved = saveCapsule(date, content)
    refreshCapsules()
    return saved
  }

  function deleteExistingCapsule(date) {
    const result = deleteCapsule(date)
    if (result) {
      refreshCapsules()
    }
    return result
  }

  function clearAllExpired() {
    const count = deleteAllExpiredCapsules()
    refreshCapsules()
    return count
  }

  function updateProgress(date, progress) {
    const result = updateScratchProgress(date, progress)
    if (result) {
      refreshCapsules()
    }
    return result
  }

  function handleDateClick(date) {
    const capsule = getCapsuleForDate(date)
    const status = getCapsuleStatusForDate(date)
    
    selectedDate.value = date
    selectedCapsule.value = capsule
    
    if (capsule) {
      if (status === CapsuleStatus.LOCKED) {
        isCountdownModalOpen.value = true
      } else {
        isScratchModalOpen.value = true
      }
    } else {
      if (status === CapsuleStatus.EXPIRED) {
        isEditModalOpen.value = true
      } else {
        isEditModalOpen.value = true
      }
    }
  }

  function openEditModal(date) {
    selectedDate.value = date
    selectedCapsule.value = getCapsuleForDate(date)
    isEditModalOpen.value = true
  }

  function closeEditModal() {
    isEditModalOpen.value = false
    selectedDate.value = null
    selectedCapsule.value = null
  }

  function closeCountdownModal() {
    isCountdownModalOpen.value = false
    selectedDate.value = null
    selectedCapsule.value = null
  }

  function closeScratchModal() {
    isScratchModalOpen.value = false
    selectedDate.value = null
    selectedCapsule.value = null
  }

  return {
    capsules,
    selectedDate,
    selectedCapsule,
    isEditModalOpen,
    isCountdownModalOpen,
    isScratchModalOpen,
    datesWithCapsules,
    lockedCapsules,
    unlockedCapsules,
    expiredCapsules,
    
    refreshCapsules,
    getCapsuleForDate,
    hasCapsuleForDate,
    getCapsuleStatusForDate,
    saveNewCapsule,
    deleteExistingCapsule,
    clearAllExpired,
    updateProgress,
    handleDateClick,
    openEditModal,
    closeEditModal,
    closeCountdownModal,
    closeScratchModal,
    
    // 导出工具函数
    isPastDate,
    isFutureDate,
    isToday,
    calculateTimeLeft,
    CapsuleStatus,
    MAX_CONTENT_LENGTH
  }
}
