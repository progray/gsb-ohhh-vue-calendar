import { ref, computed, watch, onMounted } from 'vue'

const STORAGE_KEY = 'ohhh-vue-calendar-theme'

const DEFAULT_THEME = {
  mode: 'light',
  themeColor: '#409eff'
}

function hexToRgba(hex, alpha = 1) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function loadThemeFromStorage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    console.warn('Failed to load theme from localStorage:', e)
  }
  return null
}

function saveThemeToStorage(theme) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(theme))
  } catch (e) {
    console.warn('Failed to save theme to localStorage:', e)
  }
}

export function useTheme(props = {}) {
  const storedTheme = loadThemeFromStorage()
  
  const mode = ref(storedTheme?.mode || props.initialMode || DEFAULT_THEME.mode)
  const themeColor = ref(storedTheme?.themeColor || props.initialThemeColor || DEFAULT_THEME.themeColor)

  const themeColorLight = computed(() => hexToRgba(themeColor.value, 0.2))

  const cssVariables = computed(() => ({
    '--calendar-theme-color': themeColor.value,
    '--calendar-theme-color-light': themeColorLight.value,
    '--calendar-text-color-level-1': mode.value === 'dark' ? '#fafafa' : '#303133',
    '--calendar-text-color-level-2': mode.value === 'dark' ? '#d4d4d4' : '#606266',
    '--calendar-text-color-level-3': mode.value === 'dark' ? '#a3a3a3' : '#909399',
    '--calendar-text-color-level-4': mode.value === 'dark' ? '#737373' : '#a8abb2',
    '--calendar-text-color-level-5': mode.value === 'dark' ? '#525252' : '#c0c4cc',
    '--calendar-background': mode.value === 'dark' ? '#171717' : 'transparent',
    '--calendar-icon-color': mode.value === 'dark' ? '#a3a3a3' : 'var(--calendar-text-color-level-3)',
    '--calendar-weekdays-color': mode.value === 'dark' ? '#fafafa' : 'var(--calendar-text-color-level-1)',
    '--calendar-days-value-color': mode.value === 'dark' ? '#fafafa' : 'var(--calendar-text-color-level-1)',
    '--calendar-days-label-color': mode.value === 'dark' ? '#d4d4d4' : 'var(--calendar-text-color-level-2)',
    '--calendar-days-other-month-color': mode.value === 'dark' ? '#525252' : 'var(--calendar-text-color-level-5)',
    '--calendar-days-today-color': themeColor.value,
    '--calendar-days-today-background': themeColorLight.value,
    '--calendar-days-selected-color': '#ffffff',
    '--calendar-days-selected-background': themeColor.value
  }))

  function toggleMode() {
    mode.value = mode.value === 'light' ? 'dark' : 'light'
  }

  function setMode(newMode) {
    if (newMode === 'light' || newMode === 'dark') {
      mode.value = newMode
    }
  }

  function setThemeColor(color) {
    if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
      themeColor.value = color
    }
  }

  function resetTheme() {
    mode.value = DEFAULT_THEME.mode
    themeColor.value = DEFAULT_THEME.themeColor
  }

  watch(
    [mode, themeColor],
    () => {
      saveThemeToStorage({
        mode: mode.value,
        themeColor: themeColor.value
      })
    },
    { deep: true }
  )

  onMounted(() => {
    if (props.initialMode && !storedTheme) {
      mode.value = props.initialMode
    }
    if (props.initialThemeColor && !storedTheme) {
      themeColor.value = props.initialThemeColor
    }
  })

  return {
    mode,
    themeColor,
    themeColorLight,
    cssVariables,
    toggleMode,
    setMode,
    setThemeColor,
    resetTheme
  }
}
