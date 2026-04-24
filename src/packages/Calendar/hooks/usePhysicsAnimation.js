import { ref, reactive, onUnmounted, computed } from 'vue'

const SPRING_CONFIG = {
  stiffness: 38,
  damping: 4.2,
  mass: 1
}

const RIPPLE_CONFIG = {
  maxRadius: 500,
  speed: 380,
  strength: 75
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

      const rotationSpring = stiffness * 0.035
      const rotationDamping = damping * 0.35
      const rotForce = -rotationSpring * state.rotation - rotationDamping * state.rotationVelocity
      state.rotationVelocity += (rotForce / mass) * dt
      state.rotation += state.rotationVelocity * dt

      const kineticEnergy = 0.5 * mass * (
        state.velocity.x * state.velocity.x + state.velocity.y * state.velocity.y
      ) + 0.5 * mass * (state.rotationVelocity * state.rotationVelocity)

      const potentialEnergy = 0.5 * stiffness * (
        state.position.x * state.position.x + state.position.y * state.position.y
      ) + 0.5 * rotationSpring * state.rotation * state.rotation

      const totalEnergy = kineticEnergy + potentialEnergy

      const energyThreshold = 0.25
      if (totalEnergy < energyThreshold &&
          Math.abs(state.velocity.x) < 0.15 &&
          Math.abs(state.velocity.y) < 0.15 &&
          Math.abs(state.rotationVelocity) < 0.03) {
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

    if (now - state.lastActivationTime < 60) return

    state.lastActivationTime = now
    state.isActive = true

    const baseForce = 65 * intensity
    const randomY = (Math.random() - 0.5) * 45
    const randomRotation = (Math.random() - 0.5) * 0.8

    state.velocity.x = direction === 'right' ? baseForce : -baseForce
    state.velocity.y = randomY
    state.rotationVelocity = (direction === 'right' ? 1.8 : -1.8) * intensity + randomRotation

    startAnimation()
  }

  function triggerRippleWithCenter(centerX, centerY, totalCells, cols = 7) {
    rippleEffects.value.push({
      centerX,
      centerY,
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
    triggerRipple: triggerRippleWithCenter,
    getCellTransform,
    isCellActive,
    resetAllCells,
    startAnimation,
    RIPPLE_CONFIG
  }
}
