export const pixelArtTemplates = [
  {
    id: 'heart',
    name: '爱心',
    colors: {
      bg: '#f0f0f0',
      pixel: '#ff6b6b'
    },
    grid: [
      [0, 1, 1, 0, 1, 1, 0],
      [1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1],
      [0, 1, 1, 1, 1, 1, 0],
      [0, 0, 1, 1, 1, 0, 0]
    ]
  },
  {
    id: 'star',
    name: '星星',
    colors: {
      bg: '#f0f0f0',
      pixel: '#ffd93d'
    },
    grid: [
      [0, 0, 0, 1, 0, 0, 0],
      [0, 0, 1, 1, 1, 0, 0],
      [1, 1, 1, 1, 1, 1, 1],
      [0, 1, 1, 1, 1, 1, 0],
      [0, 1, 0, 0, 0, 1, 0]
    ]
  },
  {
    id: 'smile',
    name: '笑脸',
    colors: {
      bg: '#f0f0f0',
      pixel: '#6bcb77'
    },
    grid: [
      [0, 1, 1, 1, 1, 1, 0],
      [1, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 0, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 1, 1, 0, 1]
    ]
  },
  {
    id: 'flower',
    name: '花朵',
    colors: {
      bg: '#f0f0f0',
      pixel: '#ff9a9e'
    },
    grid: [
      [0, 0, 1, 0, 1, 0, 0],
      [0, 1, 0, 1, 0, 1, 0],
      [1, 0, 1, 1, 1, 0, 1],
      [0, 1, 0, 1, 0, 1, 0],
      [0, 0, 1, 0, 1, 0, 0]
    ]
  }
]

export function getDatePositionInGrid(dayOfMonth) {
  if (dayOfMonth < 1 || dayOfMonth > 31) return null
  return {
    row: Math.floor((dayOfMonth - 1) / 7),
    col: (dayOfMonth - 1) % 7
  }
}

export function getPixelColor(template, dayOfMonth, isUnlocked) {
  const pos = getDatePositionInGrid(dayOfMonth)
  if (!pos || pos.row >= template.grid.length || pos.col >= template.grid[0].length) {
    return template.colors.bg
  }
  const isPixel = template.grid[pos.row][pos.col] === 1
  if (!isPixel) {
    return template.colors.bg
  }
  return isUnlocked ? template.colors.pixel : '#d0d0d0'
}

export function getTotalPixels(template) {
  let count = 0
  for (let row of template.grid) {
    for (let pixel of row) {
      if (pixel === 1) count++
    }
  }
  return count
}

export function isPixelDate(template, dayOfMonth) {
  const pos = getDatePositionInGrid(dayOfMonth)
  if (!pos || pos.row >= template.grid.length || pos.col >= template.grid[0].length) {
    return false
  }
  return template.grid[pos.row][pos.col] === 1
}
