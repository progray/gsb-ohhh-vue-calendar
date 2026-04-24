import { ref, computed, watch } from 'vue'
import { THEMES, getThemeById, getRandomTheme } from '../themes/index.js'

export function useTheme(initialThemeId = null) {
  const currentThemeId = ref(initialThemeId || THEMES[0].id)
  const showThemeSelector = ref(false)

  const currentTheme = computed(() => getThemeById(currentThemeId.value))
  const themes = computed(() => THEMES)

  function setTheme(themeId) {
    if (THEMES.find(t => t.id === themeId)) {
      currentThemeId.value = themeId
    }
  }

  function setRandomTheme(excludeCurrent = true) {
    const excludeId = excludeCurrent ? currentThemeId.value : null
    const randomTheme = getRandomTheme(excludeId)
    currentThemeId.value = randomTheme.id
  }

  function toggleThemeSelector() {
    showThemeSelector.value = !showThemeSelector.value
  }

  function closeThemeSelector() {
    showThemeSelector.value = false
  }

  return {
    currentThemeId,
    currentTheme,
    themes,
    showThemeSelector,
    setTheme,
    setRandomTheme,
    toggleThemeSelector,
    closeThemeSelector
  }
}
