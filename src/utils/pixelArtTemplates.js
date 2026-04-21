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
      [0, 0, 1, 1, 1, 0, 0],
      [0, 0, 0, 1, 0, 0, 0]
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
      [0, 1, 0, 0, 0, 1, 0],
      [1, 0, 0, 0, 0, 0, 1]
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
      [1, 0, 1, 1, 1, 0, 1],
      [0, 1, 0, 0, 0, 1, 0]
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
      [0, 0, 1, 0, 1, 0, 0],
      [0, 0, 0, 1, 0, 0, 0]
    ]
  }
]

export function getPixelColor(template, weekIndex, dayIndex, isUnlocked) {
  if (weekIndex >= template.grid.length || dayIndex >= template.grid[0].length) {
    return isUnlocked ? template.colors.pixel : template.colors.bg
  }
  const isPixel = template.grid[weekIndex][dayIndex] === 1
  if (!isPixel) {
    return template.colors.bg
  }
  return isUnlocked ? template.colors.pixel : '#d0d0d0'
}

export function getTotalPixels(template) {
  let count = 0
  for (let week of template.grid) {
    for (let pixel of week) {
      if (pixel === 1) count++
    }
  }
  return count
}
