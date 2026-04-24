import { ref, reactive, onUnmounted, computed } from 'vue'

const SPRING_CONFIG = {
  stiffness: 45,
  damping: 5,
  mass: 1
}

const RIPPLE_CONFIG = {
  maxRadius: 300,
  speed: 250,
  strength: 50
}

export function usePhysicsAnimation() {
  const cellStates = reactive({})
  const animationTick = ref(0)
  const animationFrameId = ref(null)
  const isAnimating = ref(false)
  const rippleEffects = ref([])

  function getOrCreateCellState(cellKey) {
    if (!cellStates[cellKey]) {
      cellStates[cellKey] = reactive({
        position: { x: 0, y: 0 },
        velocity: { x: 0, y: 0 },
        rotation: 0,
        rotationVelocity: 0,
        scale: 1,
        targetPosition: { x: 0, y: 0 },
        isActive: false,
        lastActivationTime: 0
      })
    }
    return cellStates[cellKey]
  }

  function springUpdate(deltaTime) {
    const dt = deltaTime / 1000
    const { stiffness, damping, mass } = SPRING_CONFIG
    let hasActive = false

    Object.keys(cellStates).forEach((cellKey) => {
      const state = cellStates[cellKey]
      if (!state.isActive) return

      hasActive = true

      const dx = state.targetPosition.x - state.position.x
      const dy = state.targetPosition.y - state.position.y

      const forceX = stiffness * dx - damping * state.velocity.x
      const forceY = stiffness * dy - damping * state.velocity.y

      const accelerationX = forceX / mass
      const accelerationY = forceY / mass

      state.velocity.x += accelerationX * dt
      state.velocity.y += accelerationY * dt

      state.position.x += state.velocity.x * dt
      state.position.y += state.velocity.y * dt

      const rotationSpring = stiffness * 0.04
      const rotationDamping = damping * 0.4
      const rotForce = -rotationSpring * state.rotation - rotationDamping * state.rotationVelocity
      state.rotationVelocity += (rotForce / mass) * dt
      state.rotation += state.rotationVelocity * dt

      if (Math.abs(state.position.x) < 0.1 && Math.abs(state.position.y) < 0.1 &&
          Math.abs(state.velocity.x) < 0.5 && Math.abs(state.velocity.y) < 0.5 &&
          Math.abs(state.rotation) < 0.01 && Math.abs(state.rotationVelocity) < 0.1) {
        state.position.x = 0
        state.position.y = 0
        state.velocity.x = 0
        state.velocity.y = 0
        state.rotation = 0
        state.rotationVelocity = 0
        state.isActive = false
      }
    })

    animationTick.value++

    return hasActive
  }

  function rippleUpdate(deltaTime) {
    const dt = deltaTime / 1000

    rippleEffects.value = rippleEffects.value.filter(ripple => {
      ripple.radius += RIPPLE_CONFIG.speed * dt
      ripple.alpha = Math.max(0, 1 - ripple.radius / RIPPLE_CONFIG.maxRadius)
      return ripple.alpha > 0
    })
  }

  function animate(timestamp) {
    const lastTime = animate.lastTime || timestamp
    const deltaTime = Math.min(timestamp - lastTime, 32)
    animate.lastTime = timestamp

    const hasActiveCells = springUpdate(deltaTime)
    rippleUpdate(deltaTime)

    if (hasActiveCells || rippleEffects.value.length > 0) {
      animationFrameId.value = requestAnimationFrame(animate)
    } else {
      isAnimating.value = false
      animationFrameId.value = null
    }
  }

  function startAnimation() {
    if (!isAnimating.value) {
      isAnimating.value = true
      animate.lastTime = performance.now()
      animationFrameId.value = requestAnimationFrame(animate)
    }
  }

  function triggerWindChime(cellKey, direction = 'right', intensity = 1) {
    const state = getOrCreateCellState(cellKey)
    const now = performance.now()

    if (now - state.lastActivationTime < 80) return

    state.lastActivationTime = now
    state.isActive = true

    const baseForce = 55 * intensity
    const randomY = (Math.random() - 0.5) * 35

    state.velocity.x = direction === 'right' ? baseForce : -baseForce
    state.velocity.y = randomY
    state.rotationVelocity = (direction === 'right' ? 1.5 : -1.5) * intensity

    startAnimation()
  }

  function triggerRipple(centerIndex, totalCells, cols = 7) {
    rippleEffects.value.push({
      centerIndex,
      radius: 0,
      alpha: 1,
      startTime: performance.now()
    })

    startAnimation()
  }

  function getCellTransform(cellKey) {
    const tick = animationTick.value
    const state = getOrCreateCellState(cellKey)
    return {
      x: state.position.x,
      y: state.position.y,
      rotation: state.rotation,
      scale: state.scale
    }
  }

  function isCellActive(cellKey) {
    const state = cellStates[cellKey]
    return state ? state.isActive : false
  }

  function resetAllCells() {
    Object.keys(cellStates).forEach(key => {
      const state = cellStates[key]
      if (state) {
        state.position.x = 0
        state.position.y = 0
        state.velocity.x = 0
        state.velocity.y = 0
        state.rotation = 0
        state.rotationVelocity = 0
        state.isActive = false
      }
    })
    animationTick.value++
  }

  onUnmounted(() => {
    if (animationFrameId.value) {
      cancelAnimationFrame(animationFrameId.value)
    }
  })

  return {
    cellStates,
    rippleEffects,
    animationTick,
    isAnimating,
    triggerWindChime,
    triggerRipple,
    getCellTransform,
    isCellActive,
    resetAllCells,
    startAnimation
  }
}
