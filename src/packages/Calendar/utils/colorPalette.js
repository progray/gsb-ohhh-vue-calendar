export const CALENDAR_PALETTE = [
  '#E67E22',
  '#E74C3C',
  '#9B59B6',
  '#27AE60',
  '#F39C12',
  '#C0392B',
  '#8E44AD',
  '#2ECC71',
  '#D35400',
  '#1ABC9C',
  '#D63031',
  '#27AE60',
  '#E17055',
  '#00B894',
  '#FD79A8',
  '#00CEC9',
  '#FDCB6E',
  '#6C5CE7',
  '#FA8231',
  '#26DE81',
  '#FC5C65',
  '#45AAF2',
  '#FED330',
  '#A55EEA'
]

export const EVENT_COLORS = CALENDAR_PALETTE

export function getColorByIndex(index) {
  return EVENT_COLORS[index % EVENT_COLORS.length]
}

export function generateCustomColor(seed) {
  const hash = String(seed).split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc)
  }, 0)
  
  const hue = Math.abs(hash % 360)
  const saturation = 55 + (Math.abs(hash >> 8) % 15)
  const lightness = 48 + (Math.abs(hash >> 16) % 12)
  
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`
}

export function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : null
}

export function hexToHsl(hex) {
  const rgb = hexToRgb(hex)
  if (!rgb) return null

  const r = rgb.r / 255
  const g = rgb.g / 255
  const b = rgb.b / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h, s, l = (max + min) / 2

  if (max === min) {
    h = s = 0
  } else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
      default:
        h = 0
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  }
}

export function getLighterColor(hex, percentage = 0.2) {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex

  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${1 - percentage})`
}

export function getDarkerColor(hex, percentage = 0.15) {
  const hsl = hexToHsl(hex)
  if (!hsl) return hex

  const newLightness = Math.max(0, hsl.l * (1 - percentage))
  return `hsl(${hsl.h}, ${hsl.s}%, ${newLightness}%)`
}

export function isValidEventColor(hex) {
  if (!/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex)) {
    return false
  }

  const hsl = hexToHsl(hex)
  if (!hsl) return false

  if (hsl.s < 25) return false

  if (hsl.l < 25 || hsl.l > 75) return false

  const grayHueRange = [[180, 240], [240, 300], [0, 30]]
  const isGrayish = grayHueRange.some(([min, max]) => hsl.h >= min && hsl.h <= max && hsl.s < 40)
  if (isGrayish && hsl.s < 40) return false

  return true
}

export function getAvailableColors() {
  return [...EVENT_COLORS]
}
