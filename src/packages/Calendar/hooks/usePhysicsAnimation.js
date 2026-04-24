import { ref, onUnmounted } from 'vue'

const SPRING_CONFIG = {
  stiffness: 80,
  damping: 12,
  mass: 1
}

const RIPPLE_CONFIG = {
  maxRadius: 300,
  speed: 200,
  strength: 40
}

export function usePhysicsAnimation() {
  const cellStates = new Map()
  const animationFrameId = ref(null)
  const isAnimating = ref(false)
  const rippleEffects = ref([])
  const pageTransitionState = ref(null)

  function getOrCreateCellState(cellKey) {
    if (!cellStates.has(cellKey)) {
      cellStates.set(cellKey, {
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
    return cellStates.get(cellKey)
  }

  function springUpdate(deltaTime) {
    const dt = deltaTime / 1000
    const { stiffness, damping, mass } = SPRING_CONFIG

    cellStates.forEach((state) => {
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

      const rotationSpring = stiffness * 0.01
      const rotationDamping = damping * 0.5
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

    springUpdate(deltaTime)
    rippleUpdate(deltaTime)

    const hasActiveCells = Array.from(cellStates.values()).some(s => s.isActive)
    const hasRipples = rippleEffects.value.length > 0
    const hasPageTransition = pageTransitionState.value && pageTransitionState.value.isActive

    if (hasActiveCells || hasRipples || hasPageTransition) {
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

    if (now - state.lastActivationTime < 100) return

    state.lastActivationTime = now
    state.isActive = true

    const baseForce = 30 * intensity
    const randomY = (Math.random() - 0.5) * 20

    state.velocity.x = direction === 'right' ? baseForce : -baseForce
    state.velocity.y = randomY
    state.rotationVelocity = (direction === 'right' ? 0.8 : -0.8) * intensity

    startAnimation()
  }

  function triggerRipple(centerIndex, totalCells, cols = 7) {
    const centerRow = Math.floor(centerIndex / cols)
    const centerCol = centerIndex % cols

    for (let i = 0; i < totalCells; i++) {
      const row = Math.floor(i / cols)
      const col = i % cols

      const distance = Math.sqrt(
        Math.pow(row - centerRow, 2) + Math.pow(col - centerCol, 2)
      )

      const maxDistance = Math.sqrt(Math.pow(cols, 2) + Math.pow(Math.ceil(totalCells / cols), 2))
      const normalizedDistance = distance / maxDistance

      const delay = normalizedDistance * 150

      setTimeout(() => {
        const state = getOrCreateCellState(i)
        state.isActive = true

        const angle = Math.atan2(row - centerRow, col - centerCol)
        const force = RIPPLE_CONFIG.strength * (1 - normalizedDistance * 0.7)

        state.velocity.x = Math.cos(angle) * force
        state.velocity.y = Math.sin(angle) * force
        state.rotationVelocity = (Math.random() - 0.5) * 0.5

        startAnimation()
      }, delay)
    }

    rippleEffects.value.push({
      centerIndex,
      radius: 0,
      alpha: 1,
      startTime: performance.now()
    })

    startAnimation()
  }

  function startPageTransition(direction, totalCells) {
    pageTransitionState.value = {
      direction,
      totalCells,
      startTime: performance.now(),
      isActive: true,
      phase: 'out'
    }

    for (let i = 0; i < totalCells; i++) {
      const row = Math.floor(i / 7)
      const col = i % 7
      const delay = (row * 50 + col * 30) * (direction === 'next' ? 1 : -1)

      setTimeout(() => {
        const state = getOrCreateCellState(i)
        state.isActive = true

        if (direction === 'next') {
          state.velocity.y = 80
          state.velocity.x = (Math.random() - 0.5) * 40
          state.rotationVelocity = (Math.random() - 0.5) * 2
        } else {
          state.velocity.y = -60
          state.velocity.x = (Math.random() - 0.5) * 30
          state.rotationVelocity = (Math.random() - 0.5) * 1.5
        }

        startAnimation()
      }, Math.abs(delay))
    }

    startAnimation()
  }

  function endPageTransition() {
    pageTransitionState.value = null
  }

  function getCellTransform(cellKey) {
    const state = getOrCreateCellState(cellKey)
    return {
      x: state.position.x,
      y: state.position.y,
      rotation: state.rotation,
      scale: state.scale
    }
  }

  function resetAllCells() {
    cellStates.clear()
  }

  onUnmounted(() => {
    if (animationFrameId.value) {
      cancelAnimationFrame(animationFrameId.value)
    }
  })

  return {
    cellStates,
    rippleEffects,
    pageTransitionState,
    isAnimating,
    triggerWindChime,
    triggerRipple,
    startPageTransition,
    endPageTransition,
    getCellTransform,
    resetAllCells,
    startAnimation
  }
}
