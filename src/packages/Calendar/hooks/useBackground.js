import { ref, computed, watch } from 'vue'

const gradientPresets = [
  {
    id: 'sunset',
    name: '日落',
    value: 'linear-gradient(135deg, #ff6b6b, #feca57, #48dbfb)',
    colors: ['#ff6b6b', '#feca57', '#48dbfb']
  },
  {
    id: 'ocean',
    name: '海洋',
    value: 'linear-gradient(135deg, #667eea, #764ba2, #6B8DD6)',
    colors: ['#667eea', '#764ba2', '#6B8DD6']
  },
  {
    id: 'forest',
    name: '森林',
    value: 'linear-gradient(135deg, #11998e, #38ef7d, #a8e063)',
    colors: ['#11998e', '#38ef7d', '#a8e063']
  },
  {
    id: 'aurora',
    name: '极光',
    value: 'linear-gradient(135deg, #00c6ff, #0072ff, #7f53ac)',
    colors: ['#00c6ff', '#0072ff', '#7f53ac']
  },
  {
    id: 'rose',
    name: '玫瑰',
    value: 'linear-gradient(135deg, #f093fb, #f5576c, #ff9a9e)',
    colors: ['#f093fb', '#f5576c', '#ff9a9e']
  },
  {
    id: 'golden',
    name: '金色',
    value: 'linear-gradient(135deg, #f7971e, #ffd200, #fff200)',
    colors: ['#f7971e', '#ffd200', '#fff200']
  },
  {
    id: 'midnight',
    name: '午夜',
    value: 'linear-gradient(135deg, #232526, #414345, #000000)',
    colors: ['#232526', '#414345', '#000000']
  },
  {
    id: 'rainbow',
    name: '彩虹',
    value: 'linear-gradient(135deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #8b00ff)',
    colors: ['#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#0000ff', '#8b00ff']
  }
]

const displayModes = [
  { value: 'cover', label: '填充', css: 'background-size: cover;' },
  { value: 'contain', label: '适应', css: 'background-size: contain;' },
  { value: 'stretch', label: '拉伸', css: 'background-size: 100% 100%;' },
  { value: 'center', label: '居中', css: 'background-size: auto; background-position: center;' },
  { value: 'repeat', label: '平铺', css: 'background-size: auto; background-repeat: repeat;' }
]

export function useBackground(props) {
  const {
    enableBackground,
    backgroundType,
    selectedPreset,
    customImage,
    displayMode,
    blurAmount,
    rotationAngle,
    parallaxIntensity,
    themeColor
  } = props || {}

  const backgroundTypeLocal = ref(backgroundType?.value || backgroundType || 'preset')
  const selectedPresetLocal = ref(selectedPreset?.value || selectedPreset || 'sunset')
  const customImageLocal = ref(customImage?.value || customImage || null)
  const displayModeLocal = ref(displayMode?.value || displayMode || 'cover')
  const blurAmountLocal = ref(blurAmount?.value ?? blurAmount ?? 10)
  const rotationAngleLocal = ref(rotationAngle?.value ?? rotationAngle ?? 0)
  const parallaxIntensityLocal = ref(parallaxIntensity?.value ?? parallaxIntensity ?? 20)

  const parallaxX = ref(0)
  const parallaxY = ref(0)
  const isTransitioning = ref(false)
  const transitionProgress = ref(0)

  const currentPreset = computed(() => {
    return gradientPresets.find(p => p.id === selectedPresetLocal.value) || gradientPresets[0]
  })

  const currentDisplayMode = computed(() => {
    return displayModes.find(m => m.value === displayModeLocal.value) || displayModes[0]
  })

  const hasCustomImage = computed(() => {
    return !!customImageLocal.value
  })

  const backgroundValue = computed(() => {
    if (backgroundTypeLocal.value === 'custom' && customImageLocal.value) {
      return `url(${customImageLocal.value})`
    }
    return currentPreset.value.value
  })

  const backgroundStyle = computed(() => {
    const mode = currentDisplayMode.value
    let style = {
      background: backgroundValue.value,
      transform: `rotate(${rotationAngleLocal.value}deg)`,
      filter: `blur(${blurAmountLocal.value}px)`,
      transition: 'all 0.5s ease'
    }

    if (mode.value === 'cover') {
      style.backgroundSize = 'cover'
      style.backgroundPosition = 'center'
    } else if (mode.value === 'contain') {
      style.backgroundSize = 'contain'
      style.backgroundPosition = 'center'
      style.backgroundRepeat = 'no-repeat'
    } else if (mode.value === 'stretch') {
      style.backgroundSize = '100% 100%'
    } else if (mode.value === 'center') {
      style.backgroundSize = 'auto'
      style.backgroundPosition = 'center'
      style.backgroundRepeat = 'no-repeat'
    } else if (mode.value === 'repeat') {
      style.backgroundSize = 'auto'
      style.backgroundRepeat = 'repeat'
    }

    if (enableBackground?.value) {
      style.transform += `translate(${parallaxX.value}px, ${parallaxY.value}px)`
    }

    return style
  })

  const isBackgroundDark = computed(() => {
    const colors = currentPreset.value.colors
    if (colors.length === 0) return false

    const avgBrightness = colors.reduce((sum, color) => {
      const brightness = _getColorBrightness(color)
      return sum + brightness
    }, 0) / colors.length

    return avgBrightness < 128
  })

  const glassOverlayColor = computed(() => {
    if (isBackgroundDark.value) {
      return 'rgba(0, 0, 0, 0.3)'
    }
    return 'rgba(255, 255, 255, 0.7)'
  })

  const textColor = computed(() => {
    if (isBackgroundDark.value) {
      return '#ffffff'
    }
    return '#303133'
  })

  const glowColor = computed(() => {
    if (themeColor?.value) {
      return themeColor.value + '60'
    }
    if (isBackgroundDark.value) {
      return 'rgba(255, 255, 255, 0.3)'
    }
    return 'rgba(0, 0, 0, 0.15)'
  })

  function _hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        }
      : null
  }

  function _getColorBrightness(hexColor) {
    const rgb = _hexToRgb(hexColor)
    if (!rgb) return 128
    return (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000
  }

  function setBackgroundType(type) {
    backgroundTypeLocal.value = type
  }

  function setPreset(presetId) {
    selectedPresetLocal.value = presetId
  }

  function setCustomImage(imageUrl) {
    customImageLocal.value = imageUrl
    backgroundTypeLocal.value = 'custom'
  }

  function clearCustomImage() {
    customImageLocal.value = null
    backgroundTypeLocal.value = 'preset'
  }

  function setDisplayMode(mode) {
    displayModeLocal.value = mode
  }

  function setBlurAmount(amount) {
    blurAmountLocal.value = Math.max(0, Math.min(50, amount))
  }

  function setRotationAngle(angle) {
    rotationAngleLocal.value = Math.max(-180, Math.min(180, angle))
  }

  function setParallaxIntensity(intensity) {
    parallaxIntensityLocal.value = Math.max(0, Math.min(100, intensity))
  }

  function updateParallax(mouseX, mouseY, containerRect) {
    const isEnabled = enableBackground?.value ?? enableBackground ?? true
    if (!isEnabled) return

    const centerX = containerRect.left + containerRect.width / 2
    const centerY = containerRect.top + containerRect.height / 2

    const offsetX = (mouseX - centerX) / containerRect.width
    const offsetY = (mouseY - centerY) / containerRect.height

    parallaxX.value = -offsetX * parallaxIntensityLocal.value
    parallaxY.value = -offsetY * parallaxIntensityLocal.value
  }

  function resetParallax() {
    parallaxX.value = 0
    parallaxY.value = 0
  }

  function startTransition() {
    isTransitioning.value = true
    transitionProgress.value = 0
  }

  function endTransition() {
    isTransitioning.value = false
    transitionProgress.value = 0
  }

  return {
    gradientPresets,
    displayModes,

    backgroundType: backgroundTypeLocal,
    selectedPreset: selectedPresetLocal,
    customImage: customImageLocal,
    displayMode: displayModeLocal,
    blurAmount: blurAmountLocal,
    rotationAngle: rotationAngleLocal,
    parallaxIntensity: parallaxIntensityLocal,

    currentPreset,
    currentDisplayMode,
    hasCustomImage,
    backgroundValue,
    backgroundStyle,
    isBackgroundDark,
    glassOverlayColor,
    textColor,
    glowColor,
    parallaxX,
    parallaxY,
    isTransitioning,
    transitionProgress,

    setBackgroundType,
    setPreset,
    setCustomImage,
    clearCustomImage,
    setDisplayMode,
    setBlurAmount,
    setRotationAngle,
    setParallaxIntensity,
    updateParallax,
    resetParallax,
    startTransition,
    endTransition
  }
}
