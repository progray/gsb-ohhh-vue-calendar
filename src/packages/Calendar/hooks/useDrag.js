import { ref, onUnmounted } from 'vue'

export function useDrag(element, options = {}) {
  const isDragging = ref(false)
  const dragStartX = ref(0)
  const dragStartY = ref(0)
  const currentX = ref(0)
  const currentY = ref(0)
  const deltaX = ref(0)
  const deltaY = ref(0)

  const { onDragStart, onDrag, onDragEnd } = options

  let isTouch = false
  let isCanceled = false

  function handleStart(e) {
    isCanceled = false
    isTouch = e.type === 'touchstart'
    
    const point = isTouch ? e.touches[0] : e
    
    if (point.button !== undefined && point.button !== 0) return

    if (onDragStart && onDragStart(e, { x: point.clientX, y: point.clientY }) === false) {
      return
    }

    isDragging.value = true
    dragStartX.value = point.clientX
    dragStartY.value = point.clientY
    currentX.value = point.clientX
    currentY.value = point.clientY
    deltaX.value = 0
    deltaY.value = 0

    if (isTouch) {
      document.addEventListener('touchmove', handleMove, { passive: false })
      document.addEventListener('touchend', handleEnd)
      document.addEventListener('touchcancel', handleEnd)
    } else {
      document.addEventListener('mousemove', handleMove)
      document.addEventListener('mouseup', handleEnd)
    }
  }

  function handleMove(e) {
    if (!isDragging.value || isCanceled) return

    const point = isTouch ? e.touches[0] : e
    
    currentX.value = point.clientX
    currentY.value = point.clientY
    deltaX.value = currentX.value - dragStartX.value
    deltaY.value = currentY.value - dragStartY.value

    if (onDrag) {
      onDrag(e, {
        x: point.clientX,
        y: point.clientY,
        deltaX: deltaX.value,
        deltaY: deltaY.value
      })
    }
  }

  function handleEnd(e) {
    if (!isDragging.value) return

    const point = isTouch ? (e.changedTouches ? e.changedTouches[0] : null) : e

    if (isTouch) {
      document.removeEventListener('touchmove', handleMove)
      document.removeEventListener('touchend', handleEnd)
      document.removeEventListener('touchcancel', handleEnd)
    } else {
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseup', handleEnd)
    }

    isDragging.value = false

    if (onDragEnd && !isCanceled) {
      onDragEnd(e, {
        x: point ? point.clientX : currentX.value,
        y: point ? point.clientY : currentY.value,
        deltaX: deltaX.value,
        deltaY: deltaY.value
      })
    }
  }

  function cancel() {
    isCanceled = true
    if (isTouch) {
      document.removeEventListener('touchmove', handleMove)
      document.removeEventListener('touchend', handleEnd)
      document.removeEventListener('touchcancel', handleEnd)
    } else {
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseup', handleEnd)
    }
    isDragging.value = false
  }

  function setup() {
    if (element.value) {
      element.value.addEventListener('mousedown', handleStart)
      element.value.addEventListener('touchstart', handleStart, { passive: false })
    }
  }

  onUnmounted(() => {
    if (element.value) {
      element.value.removeEventListener('mousedown', handleStart)
      element.value.removeEventListener('touchstart', handleStart)
    }
    cancel()
  })

  return {
    isDragging,
    dragStartX,
    dragStartY,
    currentX,
    currentY,
    deltaX,
    deltaY,
    setup,
    cancel
  }
}
