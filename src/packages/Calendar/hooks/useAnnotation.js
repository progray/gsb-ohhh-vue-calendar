import { ref, computed, watch } from 'vue'
import { isSameDay, formatDate } from '../utils/index.js'

const STORAGE_KEY = 'ohhh-calendar-annotations'

function loadAnnotations() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return parsed.map(item => ({
        ...item,
        date: new Date(item.date)
      }))
    }
  } catch (e) {
    console.error('Failed to load annotations:', e)
  }
  return []
}

function saveAnnotations(annotations) {
  try {
    const toSave = annotations.value.map(item => ({
      ...item,
      date: formatDate(item.date)
    }))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
  } catch (e) {
    console.error('Failed to save annotations:', e)
  }
}

export function useAnnotation() {
  const annotations = ref(loadAnnotations())
  const selectedSymbol = ref(null)
  const isAddingAnnotation = ref(false)
  const pendingAnnotationDate = ref(null)
  const pendingLabel = ref('')
  const showLabelInput = ref(false)
  const tooltipData = ref(null)
  const tooltipPosition = ref({ x: 0, y: 0 })
  const tooltipPlacement = ref('top')
  const showTooltip = ref(false)
  const deletingAnnotation = ref(null)
  const showTagDropdown = ref(false)
  const selectedTag = ref(null)
  const tagDropdownDates = ref([])

  const TOOLTIP_WIDTH_ESTIMATE = 180
  const TOOLTIP_HEIGHT_ESTIMATE = 60
  const TOOLTIP_OFFSET = 12
  const TOOLTIP_ARROW_HEIGHT = 8

  watch(annotations, () => {
    saveAnnotations(annotations)
  }, { deep: true })

  const uniqueTags = computed(() => {
    const tagMap = new Map()
    annotations.value.forEach(annotation => {
      if (annotation.label) {
        const existing = tagMap.get(annotation.label)
        if (existing) {
          existing.dates.push(annotation.date)
          existing.count++
        } else {
          tagMap.set(annotation.label, {
            label: annotation.label,
            symbol: annotation.symbol,
            dates: [annotation.date],
            count: 1
          })
        }
      }
    })
    return Array.from(tagMap.values())
  })

  function getAnnotationForDate(date) {
    return annotations.value.find(a => isSameDay(a.date, date))
  }

  function selectSymbol(symbol) {
    if (selectedSymbol.value === symbol) {
      selectedSymbol.value = null
      isAddingAnnotation.value = false
    } else {
      selectedSymbol.value = symbol
      isAddingAnnotation.value = true
    }
  }

  function startAnnotation(date) {
    if (!isAddingAnnotation.value || !selectedSymbol.value) return

    const existing = getAnnotationForDate(date)
    if (existing) {
      return
    }

    pendingAnnotationDate.value = date
    pendingLabel.value = ''
    showLabelInput.value = true
  }

  function confirmAnnotation() {
    if (!pendingAnnotationDate.value || !selectedSymbol.value) return

    const newAnnotation = {
      id: Date.now().toString(),
      date: new Date(pendingAnnotationDate.value),
      symbol: selectedSymbol.value,
      label: pendingLabel.value.trim()
    }

    annotations.value.push(newAnnotation)

    resetAnnotationState()
  }

  function cancelAnnotation() {
    resetAnnotationState()
  }

  function resetAnnotationState() {
    pendingAnnotationDate.value = null
    pendingLabel.value = ''
    showLabelInput.value = false
    selectedSymbol.value = null
    isAddingAnnotation.value = false
  }

  function deleteAnnotation(annotation) {
    deletingAnnotation.value = annotation.id
    setTimeout(() => {
      const index = annotations.value.findIndex(a => a.id === annotation.id)
      if (index !== -1) {
        annotations.value.splice(index, 1)
      }
      deletingAnnotation.value = null
    }, 300)
  }

  function calculateTooltipPosition(mouseX, mouseY) {
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    
    const tooltipHalfWidth = TOOLTIP_WIDTH_ESTIMATE / 2
    
    let x = mouseX
    let y = mouseY
    let placement = 'top'
    
    const spaceAbove = mouseY - TOOLTIP_OFFSET - TOOLTIP_HEIGHT_ESTIMATE
    const spaceBelow = viewportHeight - mouseY - TOOLTIP_OFFSET - TOOLTIP_HEIGHT_ESTIMATE
    
    if (spaceAbove >= 0) {
      placement = 'top'
      y = mouseY - TOOLTIP_OFFSET - TOOLTIP_ARROW_HEIGHT
    } else if (spaceBelow >= 0) {
      placement = 'bottom'
      y = mouseY + TOOLTIP_OFFSET + TOOLTIP_ARROW_HEIGHT
    } else {
      placement = 'top'
      y = Math.max(TOOLTIP_OFFSET, mouseY - TOOLTIP_OFFSET - TOOLTIP_HEIGHT_ESTIMATE)
    }
    
    x = Math.max(tooltipHalfWidth + TOOLTIP_OFFSET, Math.min(viewportWidth - tooltipHalfWidth - TOOLTIP_OFFSET, x))
    
    return { x, y, placement }
  }

  function showAnnotationTooltip(annotation, event) {
    if (!annotation.label) return

    const pos = calculateTooltipPosition(event.clientX, event.clientY)
    
    tooltipData.value = annotation
    tooltipPosition.value = {
      x: pos.x,
      y: pos.y
    }
    tooltipPlacement.value = pos.placement
    showTooltip.value = true
  }

  function hideAnnotationTooltip() {
    showTooltip.value = false
    tooltipData.value = null
  }

  function handleTagClick(tag) {
    if (tag.count === 1) {
      selectedTag.value = null
      showTagDropdown.value = false
      return { action: 'jump', date: tag.dates[0] }
    } else {
      selectedTag.value = tag
      tagDropdownDates.value = [...tag.dates]
      showTagDropdown.value = true
      return { action: 'show', dates: tag.dates }
    }
  }

  function closeTagDropdown() {
    showTagDropdown.value = false
    selectedTag.value = null
    tagDropdownDates.value = []
  }

  return {
    annotations,
    selectedSymbol,
    isAddingAnnotation,
    pendingAnnotationDate,
    pendingLabel,
    showLabelInput,
    tooltipData,
    tooltipPosition,
    tooltipPlacement,
    showTooltip,
    deletingAnnotation,
    showTagDropdown,
    selectedTag,
    tagDropdownDates,
    uniqueTags,
    getAnnotationForDate,
    selectSymbol,
    startAnnotation,
    confirmAnnotation,
    cancelAnnotation,
    resetAnnotationState,
    deleteAnnotation,
    showAnnotationTooltip,
    hideAnnotationTooltip,
    handleTagClick,
    closeTagDropdown
  }
}
