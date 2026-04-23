const textureCache = new Map()

const textureNames = [
  { key: 'diagonal', name: '斜织' },
  { key: 'grid', name: '星格' },
  { key: 'dots', name: '星点' },
  { key: 'hexagon', name: '蜂巢' },
  { key: 'diamond', name: '菱纹' },
  { key: 'wave', name: '波浪' },
  { key: 'concentric', name: '同心圆' },
  { key: 'zigzag', name: '锯齿' },
  { key: 'weave', name: '编织' },
  { key: 'radial', name: '放射线' }
]

const colorPalettes = [
  { primary: '#667eea', secondary: '#764ba2', accent: '#f093fb' },
  { primary: '#4facfe', secondary: '#00f2fe', accent: '#43e97b' },
  { primary: '#fa709a', secondary: '#fee140', accent: '#f093fb' },
  { primary: '#30cfd0', secondary: '#330867', accent: '#00f2fe' },
  { primary: '#a8edea', secondary: '#fed6e3', accent: '#f093fb' },
  { primary: '#ffecd2', secondary: '#fcb69f', accent: '#ff9a9e' },
  { primary: '#89f7fe', secondary: '#66a6ff', accent: '#4facfe' },
  { primary: '#fddb92', secondary: '#d1fdff', accent: '#89f7fe' },
  { primary: '#84fab0', secondary: '#8fd3f4', accent: '#30cfd0' },
  { primary: '#ffecd2', secondary: '#fcb69f', accent: '#ff9a9e' },
  { primary: '#48c6ef', secondary: '#6f86d6', accent: '#667eea' },
  { primary: '#a18cd1', secondary: '#fbc2eb', accent: '#f093fb' }
]

function simpleHash(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

function hashToRange(hash, min, max) {
  return min + (hash % (max - min + 1))
}

function darkenColor(hex, percent) {
  const num = parseInt(hex.slice(1), 16)
  const amt = Math.round(2.55 * percent)
  const R = Math.max((num >> 16) - amt, 0)
  const G = Math.max((num >> 8 & 0x00FF) - amt, 0)
  const B = Math.max((num & 0x0000FF) - amt, 0)
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)
}

function lightenColor(hex, percent) {
  const num = parseInt(hex.slice(1), 16)
  const amt = Math.round(2.55 * percent)
  const R = Math.min((num >> 16) + amt, 255)
  const G = Math.min((num >> 8 & 0x00FF) + amt, 255)
  const B = Math.min((num & 0x0000FF) + amt, 255)
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 }
}

function generateDiagonalPattern(hash, size, primary, secondary) {
  const isBackslash = hash % 2 === 0
  const spacing = hashToRange(hash, 10, 20)
  const strokeWidth = hashToRange(hash, 1, 3)
  
  let lines = ''
  const diagonalLength = size * Math.sqrt(2)
  const linesCount = Math.ceil(diagonalLength / spacing) + 2
  
  if (isBackslash) {
    for (let i = -linesCount; i <= linesCount; i++) {
      const offset = i * spacing
      lines += `<line x1="${offset}" y1="0" x2="${offset + size}" y2="${size}" stroke="${secondary}" stroke-width="${strokeWidth}"/>`
    }
  } else {
    for (let i = -linesCount; i <= linesCount; i++) {
      const offset = i * spacing
      lines += `<line x1="${offset}" y1="${size}" x2="${offset + size}" y2="0" stroke="${secondary}" stroke-width="${strokeWidth}"/>`
    }
  }
  
  return `
    <rect width="${size}" height="${size}" fill="${primary}"/>
    ${lines}
  `
}

function generateGridPattern(hash, size, primary, secondary) {
  const spacing = hashToRange(hash, 10, 20)
  const strokeWidth = hashToRange(hash, 1, 2)
  
  let lines = ''
  for (let i = 0; i <= size; i += spacing) {
    lines += `<line x1="${i}" y1="0" x2="${i}" y2="${size}" stroke="${secondary}" stroke-width="${strokeWidth}"/>`
    lines += `<line x1="0" y1="${i}" x2="${size}" y2="${i}" stroke="${secondary}" stroke-width="${strokeWidth}"/>`
  }
  
  return `
    <rect width="${size}" height="${size}" fill="${primary}"/>
    ${lines}
  `
}

function generateDotsPattern(hash, size, primary, secondary) {
  const spacing = hashToRange(hash, 15, 30)
  const dotRadius = hashToRange(hash, 3, 6)
  
  let circles = ''
  for (let y = spacing/2; y <= size + spacing; y += spacing) {
    for (let x = spacing/2; x <= size + spacing; x += spacing) {
      circles += `<circle cx="${x}" cy="${y}" r="${dotRadius}" fill="${secondary}"/>`
    }
  }
  
  return `
    <rect width="${size}" height="${size}" fill="${primary}"/>
    ${circles}
  `
}

function generateHexagonPattern(hash, size, primary, secondary) {
  const hexSize = hashToRange(hash, 15, 25)
  const strokeWidth = hashToRange(hash, 1, 2)
  const hexRadius = hexSize / 2
  const hexHeight = hexSize * Math.sqrt(3) / 2
  const hexWidth = hexSize * 1.5
  
  let hexagons = ''
  for (let row = 0; row <= Math.ceil(size / hexHeight) + 2; row++) {
    const offsetX = row % 2 === 0 ? 0 : hexWidth / 2
    for (let col = -1; col <= Math.ceil(size / hexWidth) + 2; col++) {
      const x = col * hexWidth + offsetX
      const y = row * hexHeight
      
      const points = [
        `${x + hexRadius},${y}`,
        `${x + hexSize},${y + hexHeight/4}`,
        `${x + hexSize},${y + hexHeight*3/4}`,
        `${x + hexRadius},${y + hexHeight}`,
        `${x},${y + hexHeight*3/4}`,
        `${x},${y + hexHeight/4}`
      ].join(' ')
      
      hexagons += `<polygon points="${points}" stroke="${secondary}" stroke-width="${strokeWidth}" fill="none"/>`
    }
  }
  
  return `
    <rect width="${size}" height="${size}" fill="${primary}"/>
    ${hexagons}
  `
}

function generateDiamondPattern(hash, size, primary, secondary) {
  const diamondSize = hashToRange(hash, 15, 30)
  const strokeWidth = hashToRange(hash, 1, 2)
  const halfSize = diamondSize / 2
  
  let diamonds = ''
  const count = Math.ceil(size / diamondSize) + 2
  
  for (let row = -1; row <= count; row++) {
    for (let col = -1; col <= count; col++) {
      const x = col * diamondSize
      const y = row * diamondSize
      
      const points = [
        `${x + halfSize},${y}`,
        `${x + diamondSize},${y + halfSize}`,
        `${x + halfSize},${y + diamondSize}`,
        `${x},${y + halfSize}`
      ].join(' ')
      
      diamonds += `<polygon points="${points}" stroke="${secondary}" stroke-width="${strokeWidth}" fill="none"/>`
    }
  }
  
  return `
    <rect width="${size}" height="${size}" fill="${primary}"/>
    ${diamonds}
  `
}

function generateWavePattern(hash, size, primary, secondary) {
  const waveWidth = hashToRange(hash, 30, 50)
  const waveHeight = hashToRange(hash, 8, 15)
  const strokeWidth = hashToRange(hash, 1, 2)
  const spacing = hashToRange(hash, 10, 20)
  
  let paths = ''
  const segments = Math.ceil(size / waveWidth) + 2
  
  for (let y = -waveHeight; y <= size + waveHeight; y += spacing) {
    let pathD = `M ${-waveWidth},${y}`
    for (let i = 0; i <= segments; i++) {
      const x1 = i * waveWidth + waveWidth/4
      const y1 = y - waveHeight
      const x2 = i * waveWidth + waveWidth/2
      const y2 = y
      const x3 = i * waveWidth + waveWidth*3/4
      const y3 = y + waveHeight
      const x4 = (i + 1) * waveWidth
      const y4 = y
      
      pathD += ` Q ${x1},${y1} ${x2},${y2} Q ${x3},${y3} ${x4},${y4}`
    }
    paths += `<path d="${pathD}" stroke="${secondary}" stroke-width="${strokeWidth}" fill="none"/>`
  }
  
  return `
    <rect width="${size}" height="${size}" fill="${primary}"/>
    ${paths}
  `
}

function generateConcentricPattern(hash, size, primary, secondary) {
  const centerX = size / 2
  const centerY = size / 2
  const maxRadius = Math.max(size, size) / 2 + 20
  const spacing = hashToRange(hash, 6, 12)
  const strokeWidth = hashToRange(hash, 1, 2)
  
  let circles = ''
  for (let r = spacing; r <= maxRadius; r += spacing) {
    circles += `<circle cx="${centerX}" cy="${centerY}" r="${r}" stroke="${secondary}" stroke-width="${strokeWidth}" fill="none"/>`
  }
  
  return `
    <rect width="${size}" height="${size}" fill="${primary}"/>
    ${circles}
  `
}

function generateZigzagPattern(hash, size, primary, secondary) {
  const segmentWidth = hashToRange(hash, 15, 30)
  const amplitude = hashToRange(hash, 8, 15)
  const strokeWidth = hashToRange(hash, 1, 2)
  const spacing = hashToRange(hash, 10, 20)
  
  let paths = ''
  const segments = Math.ceil(size / segmentWidth) + 4
  
  for (let y = -amplitude; y <= size + amplitude; y += spacing) {
    let pathD = `M ${-segmentWidth},${y}`
    for (let i = 0; i <= segments; i++) {
      const x1 = i * segmentWidth + segmentWidth/2
      const y1 = y + amplitude
      const x2 = (i + 1) * segmentWidth
      const y2 = y
      
      pathD += ` L ${x1},${y1} L ${x2},${y2}`
    }
    paths += `<path d="${pathD}" stroke="${secondary}" stroke-width="${strokeWidth}" fill="none"/>`
  }
  
  return `
    <rect width="${size}" height="${size}" fill="${primary}"/>
    ${paths}
  `
}

function generateWeavePattern(hash, size, primary, secondary) {
  const blockSize = hashToRange(hash, 15, 25)
  const strokeWidth = hashToRange(hash, 1, 2)
  const darkSecondary = darkenColor(secondary, 15)
  
  let rects = ''
  for (let y = -blockSize; y <= size + blockSize; y += blockSize * 2) {
    for (let x = -blockSize; x <= size + blockSize; x += blockSize * 2) {
      rects += `<rect x="${x}" y="${y}" width="${blockSize}" height="${blockSize}" fill="${secondary}"/>`
      rects += `<rect x="${x + blockSize}" y="${y + blockSize}" width="${blockSize}" height="${blockSize}" fill="${secondary}"/>`
    }
  }
  
  let lines = ''
  for (let i = 0; i <= size + blockSize; i += blockSize) {
    lines += `<line x1="0" y1="${i}" x2="${size}" y2="${i}" stroke="${darkSecondary}" stroke-width="1"/>`
    lines += `<line x1="${i}" y1="0" x2="${i}" y2="${size}" stroke="${darkSecondary}" stroke-width="1"/>`
  }
  
  return `
    <rect width="${size}" height="${size}" fill="${primary}"/>
    ${rects}
    ${lines}
  `
}

function generateRadialPattern(hash, size, primary, secondary) {
  const centerX = size / 2
  const centerY = size / 2
  const lineCount = hashToRange(hash, 12, 24)
  const strokeWidth = hashToRange(hash, 1, 2)
  const maxLength = Math.max(size, size) * 0.8
  
  let lines = ''
  for (let i = 0; i < lineCount; i++) {
    const angle = (i / lineCount) * Math.PI * 2
    const endX = centerX + Math.cos(angle) * maxLength
    const endY = centerY + Math.sin(angle) * maxLength
    lines += `<line x1="${centerX}" y1="${centerY}" x2="${endX}" y2="${endY}" stroke="${secondary}" stroke-width="${strokeWidth}"/>`
  }
  
  return `
    <rect width="${size}" height="${size}" fill="${primary}"/>
    ${lines}
  `
}

const textureGenerators = {
  diagonal: generateDiagonalPattern,
  grid: generateGridPattern,
  dots: generateDotsPattern,
  hexagon: generateHexagonPattern,
  diamond: generateDiamondPattern,
  wave: generateWavePattern,
  concentric: generateConcentricPattern,
  zigzag: generateZigzagPattern,
  weave: generateWeavePattern,
  radial: generateRadialPattern
}

export function generateTexture(dateKey, size = 200) {
  if (textureCache.has(dateKey)) {
    return textureCache.get(dateKey)
  }
  
  const hash = simpleHash(dateKey)
  
  const textureIndex = hash % textureNames.length
  const textureInfo = textureNames[textureIndex]
  const textureKey = textureInfo.key
  const textureName = textureInfo.name
  
  const paletteIndex = hashToRange(hash, 0, colorPalettes.length - 1)
  const palette = colorPalettes[paletteIndex]
  
  const shouldSwap = hash % 2 === 0
  const primary = shouldSwap ? palette.secondary : palette.primary
  const secondary = shouldSwap ? palette.primary : palette.secondary
  const accent = palette.accent
  
  const strokeColor = accent
  const shadowColor = hexToRgb(accent)
  const shadowRgba = `rgba(${shadowColor.r}, ${shadowColor.g}, ${shadowColor.b}, 0.6)`
  
  const generator = textureGenerators[textureKey]
  const patternContent = generator(hash, size, primary, secondary)
  
  const svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      ${patternContent}
    </svg>
  `
  
  const dataUrl = 'data:image/svg+xml;utf8,' + encodeURIComponent(svgContent.trim())
  
  const result = {
    svgContent: svgContent.trim(),
    dataUrl,
    textureName,
    textureKey,
    colors: {
      primary,
      secondary,
      accent,
      strokeColor,
      shadowColor,
      shadowRgba
    }
  }
  
  textureCache.set(dateKey, result)
  return result
}

export function clearTextureCache() {
  textureCache.clear()
}
