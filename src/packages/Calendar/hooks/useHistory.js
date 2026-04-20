import { ref, computed, watch } from 'vue'

const MAX_HISTORY_SIZE = 50
const MERGE_INTERVAL = 1000

export function useHistory() {
  const historyStack = ref([])
  const currentIndex = ref(-1)
  const lastActionTime = ref(0)

  const canUndo = computed(() => currentIndex.value > 0)
  const canRedo = computed(() => currentIndex.value < historyStack.value.length - 1)
  const currentHistory = computed(() => historyStack.value[currentIndex.value] || null)
  const historyList = computed(() => [...historyStack.value])

  function createHistoryItem(action, state, previousState) {
    return {
      id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      action: action,
      timestamp: Date.now(),
      state: { ...state },
      previousState: previousState ? { ...previousState } : null
    }
  }

  function getActionName(action, state) {
    switch (action) {
      case 'select-date':
        return `选择日期: ${_formatDate(state.selected)}`
      case 'change-month':
        return `切换到: ${state.year}年${state.month + 1}月`
      case 'change-view':
        return `切换视图: ${state.viewMode === 'month' ? '月视图' : '周视图'}`
      case 'change-year':
        return `切换到: ${state.year}年${state.month + 1}月`
      default:
        return action
    }
  }

  function _formatDate(date) {
    if (!date) return ''
    const d = new Date(date)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  function shouldMergeWithLast(action, state) {
    const now = Date.now()
    const lastItem = historyStack.value[currentIndex.value]

    if (!lastItem) return false
    if (now - lastActionTime.value > MERGE_INTERVAL) return false

    if (action === 'select-date' && lastItem.action === 'select-date') {
      return true
    }
    if (action === 'change-month' && lastItem.action === 'change-month') {
      return true
    }
    if (action === 'change-year' && lastItem.action === 'change-year') {
      return true
    }

    return false
  }

  function pushHistory(action, state, previousState) {
    if (currentIndex.value < historyStack.value.length - 1) {
      historyStack.value = historyStack.value.slice(0, currentIndex.value + 1)
    }

    if (shouldMergeWithLast(action, state)) {
      const lastItem = historyStack.value[currentIndex.value]
      lastItem.state = { ...state }
      lastItem.timestamp = Date.now()
      lastActionTime.value = Date.now()
      return
    }

    const historyItem = createHistoryItem(action, state, previousState)
    historyItem.displayName = getActionName(action, state)

    if (historyStack.value.length >= MAX_HISTORY_SIZE) {
      historyStack.value.shift()
      currentIndex.value = Math.max(0, currentIndex.value - 1)
    }

    historyStack.value.push(historyItem)
    currentIndex.value = historyStack.value.length - 1
    lastActionTime.value = Date.now()
  }

  function undo() {
    if (!canUndo.value) return null
    currentIndex.value--
    return currentHistory.value
  }

  function redo() {
    if (!canRedo.value) return null
    currentIndex.value++
    return currentHistory.value
  }

  function jumpTo(index) {
    if (index < 0 || index >= historyStack.value.length) return null
    if (index === currentIndex.value) return null
    currentIndex.value = index
    return currentHistory.value
  }

  function clearHistory() {
    historyStack.value = []
    currentIndex.value = -1
    lastActionTime.value = 0
  }

  function initializeWithState(initialState) {
    clearHistory()
    const initialItem = createHistoryItem('initial', initialState, null)
    initialItem.displayName = '初始状态'
    historyStack.value.push(initialItem)
    currentIndex.value = 0
    lastActionTime.value = Date.now()
  }

  function updateCurrentState(state) {
    if (currentIndex.value >= 0 && currentIndex.value < historyStack.value.length) {
      historyStack.value[currentIndex.value].state = { ...state }
      historyStack.value[currentIndex.value].displayName = getActionName(
        historyStack.value[currentIndex.value].action,
        state
      )
    }
  }

  return {
    historyStack,
    currentIndex,
    canUndo,
    canRedo,
    currentHistory,
    historyList,
    pushHistory,
    undo,
    redo,
    jumpTo,
    clearHistory,
    initializeWithState,
    updateCurrentState
  }
}
