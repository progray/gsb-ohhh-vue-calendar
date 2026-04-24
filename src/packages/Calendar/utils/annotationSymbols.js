const viewboxSize = 100
const centerOffset = 50

function createWobblyCircle() {
  const points = []
  const radius = 38
  const segments = 36

  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2
    const wobble = Math.sin(i * 0.8) * 2.5 + Math.cos(i * 1.2) * 1.5
    const r = radius + wobble
    const x = centerOffset + Math.cos(angle) * r
    const y = centerOffset + Math.sin(angle) * r
    points.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`)
  }

  const circlePath = `${points.join(' ')} Z`

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewboxSize} ${viewboxSize}" class="annotation-symbol">
      <path d="${circlePath}" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  `
}

function createWobblyCheck() {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewboxSize} ${viewboxSize}" class="annotation-symbol">
      <path d="M 25 52 L 42 68 L 76 34" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M 18 60 Q 25 52 32 48 M 38 72 Q 42 68 46 64 M 68 40 Q 76 34 82 30" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="2,2" opacity="0.5" />
    </svg>
  `
}

function createWobblyCross() {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewboxSize} ${viewboxSize}" class="annotation-symbol">
      <path d="M 28 28 L 72 72" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M 72 28 L 28 72" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M 22 34 Q 28 28 34 24 M 66 24 Q 72 28 78 34 M 22 66 Q 28 72 34 76 M 66 76 Q 72 72 78 66" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="2,2" opacity="0.5" />
    </svg>
  `
}

function createWobblyArrow() {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewboxSize} ${viewboxSize}" class="annotation-symbol">
      <path d="M 20 50 Q 35 48 50 50 Q 65 52 80 50" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M 70 42 L 80 50 L 70 58" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M 20 50 Q 25 47 30 50" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="0.6" />
    </svg>
  `
}

function createWobblyStar() {
  const points = []
  const outerRadius = 35
  const innerRadius = 15
  const wobbleAmount = 2

  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 2 - Math.PI / 2
    const isOuter = i % 2 === 0
    const radius = isOuter ? outerRadius : innerRadius
    const wobble = Math.sin(i * 1.5) * wobbleAmount + Math.cos(i * 0.7) * wobbleAmount * 0.5
    const r = radius + wobble
    const x = centerOffset + Math.cos(angle) * r
    const y = centerOffset + Math.sin(angle) * r
    points.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`)
  }

  const starPath = `${points.join(' ')} Z`

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewboxSize} ${viewboxSize}" class="annotation-symbol">
      <path d="${starPath}" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  `
}

function createWobblyHeart() {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewboxSize} ${viewboxSize}" class="annotation-symbol">
      <path d="M 50 75 Q 25 60 25 45 Q 25 30 40 30 Q 50 30 50 42 Q 50 30 60 30 Q 75 30 75 45 Q 75 60 50 75" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M 45 40 Q 48 44 52 40" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.5" />
    </svg>
  `
}

function createWobblyFlag() {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewboxSize} ${viewboxSize}" class="annotation-symbol">
      <path d="M 30 25 L 30 80" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M 30 25 L 75 35 L 30 50" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M 35 28 Q 50 32 65 36" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="2,2" opacity="0.4" />
    </svg>
  `
}

function createWobblyLightning() {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewboxSize} ${viewboxSize}" class="annotation-symbol">
      <path d="M 60 20 L 35 48 L 55 48 L 40 80" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M 65 25 Q 60 20 55 25 M 30 53 Q 35 48 40 53 M 50 53 Q 55 48 60 53 M 35 85 Q 40 80 45 85" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.4" />
    </svg>
  `
}

export const annotationSymbols = {
  circle: {
    name: '圈圈',
    svg: createWobblyCircle(),
    color: 'var(--calendar-theme-color)'
  },
  check: {
    name: '勾',
    svg: createWobblyCheck(),
    color: '#67c23a'
  },
  cross: {
    name: '叉',
    svg: createWobblyCross(),
    color: '#f56c6c'
  },
  arrow: {
    name: '箭头',
    svg: createWobblyArrow(),
    color: '#e6a23c'
  },
  star: {
    name: '星星',
    svg: createWobblyStar(),
    color: '#f0b90b'
  },
  heart: {
    name: '爱心',
    svg: createWobblyHeart(),
    color: '#ff6b6b'
  },
  flag: {
    name: '旗帜',
    svg: createWobblyFlag(),
    color: '#909399'
  },
  lightning: {
    name: '闪电',
    svg: createWobblyLightning(),
    color: '#409eff'
  }
}

export const symbolKeys = Object.keys(annotationSymbols)
