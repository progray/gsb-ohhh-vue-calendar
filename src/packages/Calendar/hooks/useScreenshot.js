import { ref } from 'vue'

export function useScreenshot() {
  const isTakingScreenshot = ref(false)
  const lastScreenshot = ref(null)

  function _getComputedStyleValue(element, property) {
    const computedStyle = window.getComputedStyle(element)
    return computedStyle.getPropertyValue(property)
  }

  function _getElementTransform(element) {
    const computedStyle = window.getComputedStyle(element)
    const transform = computedStyle.getPropertyValue('transform')

    if (transform === 'none' || transform === '') {
      return { x: 0, y: 0, scaleX: 1, scaleY: 1 }
    }

    const matrix = transform.match(/matrix\((.+)\)/)
    if (matrix) {
      const values = matrix[1].split(',').map(Number)
      return {
        x: values[4] || 0,
        y: values[5] || 0,
        scaleX: values[0] || 1,
        scaleY: values[3] || 1
      }
    }

    const matrix3d = transform.match(/matrix3d\((.+)\)/)
    if (matrix3d) {
      const values = matrix3d[1].split(',').map(Number)
      return {
        x: values[12] || 0,
        y: values[13] || 0,
        scaleX: values[0] || 1,
        scaleY: values[5] || 1
      }
    }

    return { x: 0, y: 0, scaleX: 1, scaleY: 1 }
  }

  function _parseColor(color) {
    const hexMatch = color.match(/^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i)
    if (hexMatch) {
      return {
        r: parseInt(hexMatch[1], 16),
        g: parseInt(hexMatch[2], 16),
        b: parseInt(hexMatch[3], 16),
        a: hexMatch[4] ? parseInt(hexMatch[4], 16) / 255 : 1
      }
    }

    const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/)
    if (rgbMatch) {
      return {
        r: parseInt(rgbMatch[1]),
        g: parseInt(rgbMatch[2]),
        b: parseInt(rgbMatch[3]),
        a: rgbMatch[4] ? parseFloat(rgbMatch[4]) : 1
      }
    }

    return null
  }

  function _colorToRgba(color, defaultAlpha = 1) {
    const parsed = _parseColor(color)
    if (parsed) {
      const alpha = parsed.a !== undefined ? parsed.a : defaultAlpha
      return `rgba(${parsed.r}, ${parsed.g}, ${parsed.b}, ${alpha})`
    }
    return color
  }

  function _getBoxShadow(element) {
    const boxShadow = _getComputedStyleValue(element, 'box-shadow')
    if (!boxShadow || boxShadow === 'none') return null

    const shadows = boxShadow.split(/,(?![^(]*\))/).map(s => s.trim())
    return shadows
  }

  function _drawBorderRadius(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2)
    if (r <= 0) {
      ctx.rect(x, y, width, height)
      return
    }

    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + width - r, y)
    ctx.arcTo(x + width, y, x + width, y + r, r)
    ctx.lineTo(x + width, y + height - r)
    ctx.arcTo(x + width, y + height, x + width - r, y + height, r)
    ctx.lineTo(x + r, y + height)
    ctx.arcTo(x, y + height, x, y + height - r, r)
    ctx.lineTo(x, y + r)
    ctx.arcTo(x, y, x + r, y, r)
    ctx.closePath()
  }

  function _drawBoxShadow(ctx, shadows, x, y, width, height, borderRadius) {
    if (!shadows || shadows.length === 0) return

    shadows.forEach(shadow => {
      const parts = shadow.split(' ').filter(p => p)
      let offsetX = 0,
        offsetY = 0,
        blurRadius = 0,
        spreadRadius = 0,
        color = 'rgba(0,0,0,0.5)'

      let isInset = false
      let colorParts = []

      parts.forEach((part, index) => {
        if (part === 'inset') {
          isInset = true
        } else if (part.includes('px') || part === '0') {
          const value = parseFloat(part)
          if (offsetX === 0 && parts[index + 1]?.includes('px')) {
            offsetX = value
          } else if (offsetY === 0) {
            offsetY = value
          } else if (blurRadius === 0) {
            blurRadius = value
          } else if (spreadRadius === 0) {
            spreadRadius = value
          }
        } else {
          colorParts.push(part)
        }
      })

      if (colorParts.length > 0) {
        color = colorParts.join(' ')
      }

      if (isInset) return

      const shadowX = x + offsetX - spreadRadius
      const shadowY = y + offsetY - spreadRadius
      const shadowWidth = width + spreadRadius * 2
      const shadowHeight = height + spreadRadius * 2

      ctx.save()
      const gradient = ctx.createRadialGradient(
        shadowX + shadowWidth / 2,
        shadowY + shadowHeight / 2,
        Math.max(0, blurRadius / 2),
        shadowX + shadowWidth / 2,
        shadowY + shadowHeight / 2,
        Math.max(shadowWidth, shadowHeight) / 2 + blurRadius
      )

      const shadowColor = _parseColor(color)
      if (shadowColor) {
        gradient.addColorStop(0, `rgba(${shadowColor.r}, ${shadowColor.g}, ${shadowColor.b}, ${shadowColor.a})`)
        gradient.addColorStop(1, `rgba(${shadowColor.r}, ${shadowColor.g}, ${shadowColor.b}, 0)`)

        ctx.fillStyle = gradient
        _drawBorderRadius(ctx, shadowX, shadowY, shadowWidth, shadowHeight, borderRadius)
        ctx.fill()
      }
      ctx.restore()
    })
  }

  function _drawBackground(ctx, element, x, y, width, height) {
    const backgroundImage = _getComputedStyleValue(element, 'background-image')
    const backgroundColor = _getComputedStyleValue(element, 'background-color')
    const backgroundPosition = _getComputedStyleValue(element, 'background-position')
    const backgroundSize = _getComputedStyleValue(element, 'background-size')
    const backgroundRepeat = _getComputedStyleValue(element, 'background-repeat')
    const borderRadius = parseFloat(_getComputedStyleValue(element, 'border-radius')) || 0

    if (backgroundColor && backgroundColor !== 'transparent' && backgroundColor !== 'rgba(0, 0, 0, 0)') {
      ctx.fillStyle = backgroundColor
      _drawBorderRadius(ctx, x, y, width, height, borderRadius)
      ctx.fill()
    }

    const gradientMatch = backgroundImage.match(/linear-gradient\(([^)]+)\)/)
    if (gradientMatch) {
      const gradientStr = gradientMatch[1]
      const parts = gradientStr.split(',').map(p => p.trim())

      let angle = 135
      const colors = []

      parts.forEach(part => {
        if (part.includes('deg')) {
          angle = parseInt(part)
        } else if (part.match(/^#[a-f\d]+/i) || part.includes('rgb')) {
          colors.push(part)
        }
      })

      const angleRad = ((angle - 90) * Math.PI) / 180
      const startX = x + width / 2 + Math.cos(angleRad + Math.PI) * (Math.max(width, height) / 2)
      const startY = y + height / 2 + Math.sin(angleRad + Math.PI) * (Math.max(width, height) / 2)
      const endX = x + width / 2 + Math.cos(angleRad) * (Math.max(width, height) / 2)
      const endY = y + height / 2 + Math.sin(angleRad) * (Math.max(width, height) / 2)

      const gradient = ctx.createLinearGradient(startX, startY, endX, endY)

      colors.forEach((color, index) => {
        const position = index / Math.max(colors.length - 1, 1)
        gradient.addColorStop(position, color)
      })

      ctx.save()
      _drawBorderRadius(ctx, x, y, width, height, borderRadius)
      ctx.clip()
      ctx.fillStyle = gradient
      ctx.fillRect(x, y, width, height)
      ctx.restore()
    }
  }

  function _drawGlassEffect(ctx, x, y, width, height, blurLevel = 'medium', isDark = false) {
    let blurAmount = 10
    let opacity = 0.3

    if (blurLevel === 'light') {
      blurAmount = 5
      opacity = isDark ? 0.15 : 0.4
    } else if (blurLevel === 'medium') {
      blurAmount = 10
      opacity = isDark ? 0.25 : 0.5
    } else if (blurLevel === 'heavy') {
      blurAmount = 20
      opacity = isDark ? 0.35 : 0.6
    }

    const overlayColor = isDark ? `rgba(0, 0, 0, ${opacity})` : `rgba(255, 255, 255, ${opacity})`

    ctx.fillStyle = overlayColor
    ctx.fillRect(x, y, width, height)
  }

  function _drawText(ctx, text, x, y, element, baseline = 'alphabetic') {
    const fontSize = _getComputedStyleValue(element, 'font-size')
    const fontWeight = _getComputedStyleValue(element, 'font-weight')
    const fontFamily = _getComputedStyleValue(element, 'font-family')
    const color = _getComputedStyleValue(element, 'color')
    const textAlign = _getComputedStyleValue(element, 'text-align')

    ctx.font = `${fontWeight} ${fontSize} ${fontFamily}`
    ctx.fillStyle = color
    ctx.textAlign = textAlign === 'center' ? 'center' : 'left'
    ctx.textBaseline = baseline

    ctx.fillText(text, x, y)
  }

  function _drawCircle(ctx, x, y, radius, fillColor, strokeColor = null) {
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)

    if (fillColor) {
      ctx.fillStyle = fillColor
      ctx.fill()
    }

    if (strokeColor) {
      ctx.strokeStyle = strokeColor
      ctx.stroke()
    }
  }

  function _renderCalendarToCanvas(element, options = {}) {
    const { scale = 2, isDark = false } = options
    const rect = element.getBoundingClientRect()
    const width = Math.ceil(rect.width * scale)
    const height = Math.ceil(rect.height * scale)

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    ctx.scale(scale, scale)

    const padding = parseFloat(_getComputedStyleValue(element, 'padding')) || 0
    const borderRadius = parseFloat(_getComputedStyleValue(element, 'border-radius')) || 0
    const boxShadows = _getBoxShadow(element)

    _drawBackground(ctx, element, 0, 0, rect.width, rect.height)

    if (boxShadows) {
      _drawBoxShadow(ctx, boxShadows, 0, 0, rect.width, rect.height, borderRadius)
    }

    _drawGlassEffect(ctx, padding, padding, rect.width - padding * 2, rect.height - padding * 2, 'medium', isDark)

    return { canvas, ctx, rect, scale }
  }

  function _renderCalendarDay(ctx, dayElement, dayData, options = {}) {
    const { scale = 1, isDark = false, isSelected = false, isToday = false, isOtherMonth = false } = options
    const rect = dayElement.getBoundingClientRect()

    const innerElement = dayElement.querySelector('.ohhh-calendar-day--inner')
    const valueElement = dayElement.querySelector('.ohhh-calendar-day--inner-value')
    const markerElement = dayElement.querySelector('.ohhh-calendar-day--marker')

    const borderRadius = innerElement ? parseFloat(_getComputedStyleValue(innerElement, 'border-radius')) || 0 : 0
    const innerWidth = innerElement ? innerElement.offsetWidth : rect.width
    const innerHeight = innerElement ? innerElement.offsetHeight : rect.height

    const innerX = rect.left
    const innerY = rect.top

    if (isSelected) {
      const themeColor = _getComputedStyleValue(document.documentElement, '--calendar-theme-color') || '#409eff'
      ctx.save()
      _drawBorderRadius(ctx, innerX, innerY, innerWidth, innerHeight, borderRadius)
      ctx.clip()
      ctx.fillStyle = themeColor
      ctx.fillRect(innerX, innerY, innerWidth, innerHeight)
      ctx.restore()
    } else if (isToday) {
      const themeColorLight =
        _getComputedStyleValue(document.documentElement, '--calendar-theme-color-light') || 'rgba(64, 158, 255, 0.2)'
      ctx.save()
      _drawBorderRadius(ctx, innerX, innerY, innerWidth, innerHeight, borderRadius)
      ctx.clip()
      ctx.fillStyle = themeColorLight
      ctx.fillRect(innerX, innerY, innerWidth, innerHeight)
      ctx.restore()
    }

    if (valueElement) {
      const valueRect = valueElement.getBoundingClientRect()
      let textColor = _getComputedStyleValue(valueElement, 'color')

      if (isOtherMonth) {
        textColor = isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.3)'
      }

      if (isSelected) {
        textColor = '#ffffff'
      } else if (isToday) {
        const themeColor = _getComputedStyleValue(document.documentElement, '--calendar-theme-color') || '#409eff'
        textColor = themeColor
      }

      ctx.fillStyle = textColor
      ctx.font = _getComputedStyleValue(valueElement, 'font')
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      const textX = valueRect.left + valueRect.width / 2
      const textY = valueRect.top + valueRect.height / 2

      ctx.fillText(dayData.date.toString(), textX, textY)
    }

    if (markerElement && dayData.hasMarker) {
      const markerRect = markerElement.getBoundingClientRect()
      const markerColor = _getComputedStyleValue(markerElement, 'background')

      _drawCircle(
        ctx,
        markerRect.left + markerRect.width / 2,
        markerRect.top + markerRect.height / 2,
        markerRect.width / 2,
        markerColor
      )
    }
  }

  async function captureElement(element, options = {}) {
    const { scale = 2, isDark = false } = options
    isTakingScreenshot.value = true

    try {
      const { canvas, ctx, rect } = _renderCalendarToCanvas(element, { scale, isDark })

      const toolbar = element.querySelector('.ohhh-calendar-toolbar')
      const weekdays = element.querySelector('.ohhh-calendar-weekdays')
      const daysWrapper = element.querySelector('.ohhh-calendar-wrapper')
      const footer = element.querySelector('.ohhh-calendar-footer')

      if (toolbar) {
        const toolbarRect = toolbar.getBoundingClientRect()
        const relativeLeft = toolbarRect.left - rect.left
        const relativeTop = toolbarRect.top - rect.top
        _drawGlassEffect(ctx, relativeLeft, relativeTop, toolbarRect.width, toolbarRect.height, 'light', isDark)

        const title = toolbar.querySelector('.ohhh-calendar-toolbar--text')
        if (title) {
          const titleRect = title.getBoundingClientRect()
          _drawText(
            ctx,
            title.textContent,
            titleRect.left - rect.left + titleRect.width / 2,
            titleRect.top - rect.top + titleRect.height / 2,
            title,
            'middle'
          )
        }
      }

      if (weekdays) {
        const weekdaysRect = weekdays.getBoundingClientRect()
        const relativeLeft = weekdaysRect.left - rect.left
        const relativeTop = weekdaysRect.top - rect.top
        _drawGlassEffect(ctx, relativeLeft, relativeTop, weekdaysRect.width, weekdaysRect.height, 'light', isDark)

        const weekdayElements = weekdays.querySelectorAll('.ohhh-calendar-weekdays--weekday')
        weekdayElements.forEach(weekdayEl => {
          const weekdayRect = weekdayEl.getBoundingClientRect()
          _drawText(
            ctx,
            weekdayEl.textContent,
            weekdayRect.left - rect.left + weekdayRect.width / 2,
            weekdayRect.top - rect.top + weekdayRect.height / 2,
            weekdayEl,
            'middle'
          )
        })
      }

      if (daysWrapper) {
        const wrapperRect = daysWrapper.getBoundingClientRect()
        const relativeLeft = wrapperRect.left - rect.left
        const relativeTop = wrapperRect.top - rect.top
        _drawGlassEffect(ctx, relativeLeft, relativeTop, wrapperRect.width, wrapperRect.height, 'heavy', isDark)

        const activeDays = daysWrapper.querySelector('.ohhh-calendar-days:not([style*="left: -100%"])')
        if (activeDays) {
          const dayElements = activeDays.querySelectorAll('.ohhh-calendar-day')
          dayElements.forEach((dayEl, index) => {
            const isSelected = dayEl.classList.contains('is-selected')
            const isToday = dayEl.classList.contains('is-today')
            const isOtherMonth = dayEl.classList.contains('other-month')

            const valueEl = dayEl.querySelector('.ohhh-calendar-day--inner-value')
            const markerEl = dayEl.querySelector('.ohhh-calendar-day--marker')

            _renderCalendarDay(ctx, dayEl, {
              date: valueEl ? parseInt(valueEl.textContent) : index + 1,
              hasMarker: !!markerEl
            }, {
              scale,
              isDark,
              isSelected,
              isToday,
              isOtherMonth
            })
          })
        }
      }

      if (footer) {
        const footerRect = footer.getBoundingClientRect()
        const relativeLeft = footerRect.left - rect.left
        const relativeTop = footerRect.top - rect.top
        _drawGlassEffect(ctx, relativeLeft, relativeTop, footerRect.width, footerRect.height, 'medium', isDark)
      }

      const dataUrl = canvas.toDataURL('image/png')
      lastScreenshot.value = dataUrl

      return {
        dataUrl,
        canvas,
        width: rect.width,
        height: rect.height
      }
    } finally {
      isTakingScreenshot.value = false
    }
  }

  async function copyToClipboard(dataUrl) {
    try {
      const response = await fetch(dataUrl)
      const blob = await response.blob()
      const clipboardItem = new ClipboardItem({ [blob.type]: blob })
      await navigator.clipboard.write([clipboardItem])
      return true
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
      return false
    }
  }

  async function takeScreenshotAndCopy(element, options = {}) {
    const result = await captureElement(element, options)
    if (result) {
      const copied = await copyToClipboard(result.dataUrl)
      return { ...result, copied }
    }
    return null
  }

  return {
    isTakingScreenshot,
    lastScreenshot,
    captureElement,
    copyToClipboard,
    takeScreenshotAndCopy
  }
}
