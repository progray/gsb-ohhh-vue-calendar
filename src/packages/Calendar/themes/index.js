function generateRibbonColors(baseHue, count = 6) {
  const colors = []
  for (let i = 0; i < count; i++) {
    const hue = (baseHue + i * 60) % 360
    colors.push(hue)
  }
  return colors
}

function generateGentleGrayRibbonColors() {
  return [0, 200, 60, 160, 30, 240]
}

function hslToCss(hue, saturation, lightness) {
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`
}

const THEMES = [
  {
    id: 'gentle-gray',
    name: '温和淡灰',
    isDark: false,
    fontFamily: null,
    baseHue: 0,
    saturation: 30,
    lightness: 90,
    accentLightness: 70,
    textLightness: 30,
    textSecondaryLightness: 50,
    background: '#fafafa',
    accentBackground: '#f0f0f0',
    primaryText: '#333333',
    secondaryText: '#666666',
    selectedText: '#ffffff',
    ribbonHues: generateGentleGrayRibbonColors()
  },
  {
    id: 'sport-bold',
    name: '运动醒目',
    isDark: false,
    fontFamily: null,
    baseHue: 0,
    saturation: 80,
    lightness: 72,
    accentLightness: 55,
    textLightness: 20,
    textSecondaryLightness: 40,
    background: '#ffffff',
    accentBackground: '#fff5f5',
    primaryText: '#1a1a1a',
    secondaryText: '#4a4a4a',
    selectedText: '#ffffff',
    ribbonHues: generateRibbonColors(0, 6)
  },
  {
    id: 'calm-elegant',
    name: '沉静素雅',
    isDark: false,
    fontFamily: null,
    baseHue: 180,
    saturation: 30,
    lightness: 85,
    accentLightness: 65,
    textLightness: 25,
    textSecondaryLightness: 45,
    background: '#f5f8f8',
    accentBackground: '#e8eeee',
    primaryText: '#2d3333',
    secondaryText: '#5a6666',
    selectedText: '#ffffff',
    ribbonHues: generateRibbonColors(180, 6)
  },
  {
    id: 'tech-future',
    name: '科技未来',
    isDark: true,
    fontFamily: null,
    baseHue: 200,
    saturation: 85,
    lightness: 45,
    accentLightness: 60,
    textLightness: 90,
    textSecondaryLightness: 70,
    background: '#0a0e14',
    accentBackground: '#1a2332',
    primaryText: '#e0e8f0',
    secondaryText: '#8fa4b8',
    selectedText: '#0a0e14',
    ribbonHues: generateRibbonColors(200, 6)
  },
  {
    id: 'japanese-fresh',
    name: '日式清新',
    isDark: false,
    fontFamily: null,
    baseHue: 150,
    saturation: 50,
    lightness: 85,
    accentLightness: 65,
    textLightness: 20,
    textSecondaryLightness: 40,
    background: '#f7fbf9',
    accentBackground: '#e8f5ed',
    primaryText: '#1a2e1f',
    secondaryText: '#4a6652',
    selectedText: '#ffffff',
    ribbonHues: generateRibbonColors(150, 6)
  },
  {
    id: 'korean-modern',
    name: '韩流现代',
    isDark: false,
    fontFamily: null,
    baseHue: 330,
    saturation: 70,
    lightness: 80,
    accentLightness: 55,
    textLightness: 15,
    textSecondaryLightness: 35,
    background: '#fffafd',
    accentBackground: '#ffeaf4',
    primaryText: '#1a0f14',
    secondaryText: '#4a2a38',
    selectedText: '#ffffff',
    ribbonHues: generateRibbonColors(330, 6)
  },
  {
    id: 'chinese-classic',
    name: '中国古风',
    isDark: false,
    fontFamily: '"Times New Roman", "SimSun", "Songti SC", serif',
    baseHue: 25,
    saturation: 55,
    lightness: 78,
    accentLightness: 50,
    textLightness: 15,
    textSecondaryLightness: 35,
    background: '#faf6f2',
    accentBackground: '#f0e8e0',
    primaryText: '#1a1510',
    secondaryText: '#4a3a2a',
    selectedText: '#ffffff',
    ribbonHues: generateRibbonColors(25, 6)
  },
  {
    id: 'morandi',
    name: '莫兰迪',
    isDark: false,
    fontFamily: null,
    baseHue: 30,
    saturation: 35,
    lightness: 75,
    accentLightness: 50,
    textLightness: 25,
    textSecondaryLightness: 45,
    background: '#f5f2ef',
    accentBackground: '#e8e2db',
    primaryText: '#2d2a25',
    secondaryText: '#5a544a',
    selectedText: '#ffffff',
    ribbonHues: generateRibbonColors(30, 6)
  },
  {
    id: 'cyber-neon',
    name: '赛博霓虹',
    isDark: true,
    fontFamily: null,
    baseHue: 280,
    saturation: 95,
    lightness: 50,
    accentLightness: 70,
    textLightness: 95,
    textSecondaryLightness: 75,
    background: '#0d001a',
    accentBackground: '#1a0033',
    primaryText: '#f0e6ff',
    secondaryText: '#b899e6',
    selectedText: '#0d001a',
    ribbonHues: generateRibbonColors(280, 6)
  },
  {
    id: 'earth-warm',
    name: '大地暖调',
    isDark: false,
    fontFamily: null,
    baseHue: 30,
    saturation: 55,
    lightness: 78,
    accentLightness: 52,
    textLightness: 20,
    textSecondaryLightness: 40,
    background: '#faf5f0',
    accentBackground: '#f0e6d8',
    primaryText: '#1a140d',
    secondaryText: '#4a3a2a',
    selectedText: '#ffffff',
    ribbonHues: generateRibbonColors(30, 6)
  }
]

function getThemeById(id) {
  return THEMES.find(theme => theme.id === id) || THEMES[0]
}

function getRandomTheme(excludeId = null) {
  let filtered = THEMES
  if (excludeId) {
    filtered = THEMES.filter(theme => theme.id !== excludeId)
  }
  const randomIndex = Math.floor(Math.random() * filtered.length)
  return filtered[randomIndex]
}

function getThemeRibbonColor(theme, rowIndex) {
  const hue = theme.ribbonHues[rowIndex % theme.ribbonHues.length]
  return hslToCss(hue, theme.saturation, theme.lightness)
}

function getThemeAccentColor(theme, rowIndex) {
  const hue = theme.ribbonHues[rowIndex % theme.ribbonHues.length]
  let accentLightness
  let accentSaturation = theme.saturation
  if (theme.isDark) {
    accentLightness = Math.min(theme.lightness + 30, 95)
    accentSaturation = Math.min(theme.saturation + 10, 100)
  } else {
    accentLightness = Math.max(theme.lightness - 35, 15)
    accentSaturation = Math.min(theme.saturation + 15, 100)
  }
  return hslToCss(hue, accentSaturation, accentLightness)
}

export {
  THEMES,
  getThemeById,
  getRandomTheme,
  getThemeRibbonColor,
  getThemeAccentColor,
  hslToCss
}
