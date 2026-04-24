const SLEEP_COLORS = [
  '#1a237e',
  '#4a148c',
  '#3949ab',
  '#00897b',
  '#ff8f00'
]

const SLEEP_COLOR_NAMES = [
  'deep-indigo',
  'dark-purple',
  'slate-blue',
  'mint-green',
  'warm-amber'
]

function interpolateColor(color1, color2, ratio) {
  const hex = (c) => parseInt(c, 16)
  const r1 = hex(color1.slice(1, 3))
  const g1 = hex(color1.slice(3, 5))
  const b1 = hex(color1.slice(5, 7))
  const r2 = hex(color2.slice(1, 3))
  const g2 = hex(color2.slice(3, 5))
  const b2 = hex(color2.slice(5, 7))

  const r = Math.round(r1 + (r2 - r1) * ratio)
  const g = Math.round(g1 + (g2 - g1) * ratio)
  const b = Math.round(b1 + (b2 - b1) * ratio)

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

function getSleepColor(rating) {
  if (rating === null || rating === undefined) return null
  
  const clampedRating = Math.max(1, Math.min(5, rating))
  const index = clampedRating - 1
  
  if (Number.isInteger(clampedRating)) {
    return SLEEP_COLORS[index]
  }
  
  const lowerIndex = Math.floor(index)
  const upperIndex = Math.min(4, lowerIndex + 1)
  const ratio = index - lowerIndex
  
  return interpolateColor(SLEEP_COLORS[lowerIndex], SLEEP_COLORS[upperIndex], ratio)
}

function createGradient() {
  return `linear-gradient(to right, ${SLEEP_COLORS.join(', ')})`
}

export {
  SLEEP_COLORS,
  SLEEP_COLOR_NAMES,
  getSleepColor,
  interpolateColor,
  createGradient
}
