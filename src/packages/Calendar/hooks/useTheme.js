import { ref, computed, watch } from 'vue'

const STORAGE_KEY = 'ohhh-calendar-theme'

const PRESET_THEMES = {
  light: {
    name: '亮色清新',
    description: '白底蓝绿高亮，清新简洁',
    config: {
      background: '#ffffff',
      selected: '#409eff',
      highlight: '#67c23a',
      text: '#303133',
      border: '#dcdfe6',
      todayMarker: '#f56c6c',
      shadow: 'light',
      font: 'default'
    }
  },
  dark: {
    name: '暗色沉稳',
    description: '深灰底金色高亮，沉稳大气',
    config: {
      background: '#1e1e2e',
      selected: '#f9c74f',
      highlight: '#ffd700',
      text: '#e0e0e0',
      border: '#3a3a4a',
      todayMarker: '#ff6b6b',
      shadow: 'medium',
      font: 'default'
    }
  },
  colorful: {
    name: '彩色活力',
    description: '暖色底撞色高亮，活力四射',
    config: {
      background: '#fef3e2',
      selected: '#ff6b6b',
      highlight: '#4ecdc4',
      text: '#2d3436',
      border: '#e17055',
      todayMarker: '#6c5ce7',
      shadow: 'medium',
      font: 'default'
    }
  }
}

const SHADOW_OPTIONS = [
  { value: 'none', label: '无', boxShadow: 'none' },
  { value: 'light', label: '轻', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)' },
  { value: 'medium', label: '中', boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)' },
  { value: 'heavy', label: '重', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)' }
]

const FONT_OPTIONS = [
  { value: 'default', label: '系统默认', fontFamily: 'Open Sans, -apple-system, BlinkMacSystemFont, Helvetica Neue, Helvetica, Segoe UI, Arial, Roboto, PingFang SC, miui, Hiragino Sans GB, Microsoft Yahei, sans-serif' },
  { value: 'song', label: '宋体类', fontFamily: 'SimSun, NSimSun, FangSong, STKaiti, KaiTi, serif' },
  { value: 'kai', label: '楷体类', fontFamily: 'KaiTi, STKaiti, Microsoft YaHei, sans-serif' },
  { value: 'monospace', label: '等宽类', fontFamily: 'Consolas, Monaco, Courier New, monospace' }
]

const DEFAULT_CONFIG = PRESET_THEMES.light.config

function loadFromStorage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (e) {
    console.warn('Failed to load theme from localStorage:', e)
  }
  return null
}

function saveToStorage(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.warn('Failed to save theme to localStorage:', e)
  }
}

export function useTheme() {
  const currentPreset = ref('light')
  const customConfig = ref({ ...DEFAULT_CONFIG })
  const previewConfig = ref(null)
  const isPanelOpen = ref(false)

  const savedTheme = loadFromStorage()
  if (savedTheme) {
    currentPreset.value = savedTheme.preset || 'light'
    if (savedTheme.config) {
      customConfig.value = { ...DEFAULT_CONFIG, ...savedTheme.config }
    }
  }

  const shadowOptions = SHADOW_OPTIONS
  const fontOptions = FONT_OPTIONS
  const presetThemes = PRESET_THEMES

  const activeConfig = computed(() => {
    if (previewConfig.value) {
      return previewConfig.value
    }
    if (currentPreset.value === 'custom') {
      return customConfig.value
    }
    return PRESET_THEMES[currentPreset.value]?.config || DEFAULT_CONFIG
  })

  const cssVariables = computed(() => {
    const config = activeConfig.value
    const shadow = SHADOW_OPTIONS.find(s => s.value === config.shadow) || SHADOW_OPTIONS[1]
    const font = FONT_OPTIONS.find(f => f.value === config.font) || FONT_OPTIONS[0]

    const selectedLight = hexToRgba(config.selected, 0.2)
    const highlightLight = hexToRgba(config.highlight, 0.2)

    return {
      '--calendar-background': config.background,
      '--calendar-theme-color': config.selected,
      '--calendar-theme-color-light': selectedLight,
      '--calendar-highlight-color': config.highlight,
      '--calendar-highlight-color-light': highlightLight,
      '--calendar-text-color-level-1': config.text,
      '--calendar-text-color-level-2': adjustBrightness(config.text, 20),
      '--calendar-text-color-level-3': adjustBrightness(config.text, 40),
      '--calendar-text-color-level-4': adjustBrightness(config.text, 55),
      '--calendar-text-color-level-5': adjustBrightness(config.text, 70),
      '--calendar-icon-color': adjustBrightness(config.text, 40),
      '--calendar-toolbar-icon-color': adjustBrightness(config.text, 40),
      '--calendar-footer-icon-color': adjustBrightness(config.text, 40),
      '--calendar-weekdays-color': config.text,
      '--calendar-days-value-color': config.text,
      '--calendar-days-label-color': adjustBrightness(config.text, 20),
      '--calendar-days-other-month-color': adjustBrightness(config.text, 70),
      '--calendar-days-selected-color': getContrastColor(config.selected),
      '--calendar-days-selected-background': config.selected,
      '--calendar-days-today-color': config.todayMarker,
      '--calendar-days-today-background': hexToRgba(config.todayMarker, 0.2),
      '--calendar-days-marker-color': config.highlight,
      '--calendar-border-color': config.border,
      '--calendar-box-shadow': shadow.boxShadow,
      '--calendar-font-family': font.fontFamily
    }
  })

  function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  function adjustBrightness(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16)
    const amt = Math.round(2.55 * percent)
    const R = (num >> 16) + amt
    const G = ((num >> 8) & 0x00ff) + amt
    const B = (num & 0x0000ff) + amt
    return '#' + (
      0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    ).toString(16).slice(1)
  }

  function getContrastColor(hex) {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000
    return brightness > 128 ? '#000000' : '#ffffff'
  }

  function applyPreset(presetName) {
    if (PRESET_THEMES[presetName]) {
      currentPreset.value = presetName
      previewConfig.value = null
      saveToStorage({
        preset: presetName,
        config: PRESET_THEMES[presetName].config
      })
    }
  }

  function updateCustomConfig(key, value) {
    customConfig.value = {
      ...customConfig.value,
      [key]: value
    }
  }

  function applyPreview() {
    previewConfig.value = { ...customConfig.value }
  }

  function applyCustomTheme() {
    currentPreset.value = 'custom'
    previewConfig.value = null
    saveToStorage({
      preset: 'custom',
      config: { ...customConfig.value }
    })
  }

  function cancelPreview() {
    previewConfig.value = null
  }

  function togglePanel() {
    isPanelOpen.value = !isPanelOpen.value
  }

  function closePanel() {
    isPanelOpen.value = false
  }

  return {
    currentPreset,
    customConfig,
    previewConfig,
    isPanelOpen,
    shadowOptions,
    fontOptions,
    presetThemes,
    activeConfig,
    cssVariables,
    applyPreset,
    updateCustomConfig,
    applyPreview,
    applyCustomTheme,
    cancelPreview,
    togglePanel,
    closePanel
  }
}
