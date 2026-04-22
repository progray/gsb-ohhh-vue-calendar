const WEEKDAY_NAMES = ['日', '一', '二', '三', '四', '五', '六']

const COMMAND_TYPES = {
  VIEW_SWITCH: 'viewSwitch',
  DATE_NAVIGATE: 'dateNavigate',
  DATE_SELECT: 'dateSelect',
  PAGE_NAVIGATE: 'pageNavigate'
}

const VIEW_COMMANDS = [
  { keywords: ['月视图', '月', '切换到月', '显示月'], type: COMMAND_TYPES.VIEW_SWITCH, target: 'month', label: '切换到月视图' },
  { keywords: ['周视图', '周', '切换到周', '显示周'], type: COMMAND_TYPES.VIEW_SWITCH, target: 'week', label: '切换到周视图' }
]

const PAGE_COMMANDS = [
  { keywords: ['上一页', '上页', '前一页'], type: COMMAND_TYPES.PAGE_NAVIGATE, target: 'prev-page', label: '上一页' },
  { keywords: ['下一页', '下页', '后一页'], type: COMMAND_TYPES.PAGE_NAVIGATE, target: 'next-page', label: '下一页' },
  { keywords: ['上一年', '去年'], type: COMMAND_TYPES.PAGE_NAVIGATE, target: 'prev-year', label: '上一年' },
  { keywords: ['下一年', '明年'], type: COMMAND_TYPES.PAGE_NAVIGATE, target: 'next-year', label: '下一年' },
  { keywords: ['今天', '今日'], type: COMMAND_TYPES.DATE_NAVIGATE, target: 'today', label: '回到今天' }
]

const QUICK_SELECT_COMMANDS = [
  { keywords: ['明天'], type: COMMAND_TYPES.DATE_SELECT, target: 'tomorrow', label: '选中明天' },
  { keywords: ['后天'], type: COMMAND_TYPES.DATE_SELECT, target: 'dayAfterTomorrow', label: '选中后天' },
  { keywords: ['昨天'], type: COMMAND_TYPES.DATE_SELECT, target: 'yesterday', label: '选中昨天' },
  { keywords: ['前天'], type: COMMAND_TYPES.DATE_SELECT, target: 'dayBeforeYesterday', label: '选中前天' }
]

function fuzzyMatch(input, keywords) {
  const normalizedInput = input.toLowerCase()
  for (const keyword of keywords) {
    const normalizedKeyword = keyword.toLowerCase()
    if (normalizedInput.includes(normalizedKeyword) || normalizedKeyword.includes(normalizedInput)) {
      return true
    }
  }
  return false
}

function calculateMatchScore(input, keywords) {
  const normalizedInput = input.toLowerCase()
  let score = 0
  for (const keyword of keywords) {
    const normalizedKeyword = keyword.toLowerCase()
    if (normalizedInput === normalizedKeyword) {
      score += 100
    } else if (normalizedInput.includes(normalizedKeyword)) {
      score += 50
    } else if (normalizedKeyword.includes(normalizedInput)) {
      score += 30
    }
    for (let i = 0; i < normalizedInput.length; i++) {
      if (normalizedKeyword.includes(normalizedInput[i])) {
        score += 1
      }
    }
  }
  return score
}

function parseYearMonth(input) {
  const yearMatch = input.match(/(\d{4})年/)
  const monthMatch = input.match(/(\d{1,2})月/)
  
  if (yearMatch || monthMatch) {
    const now = new Date()
    const year = yearMatch ? parseInt(yearMatch[1]) : now.getFullYear()
    const month = monthMatch ? parseInt(monthMatch[1]) - 1 : now.getMonth()
    
    return {
      year,
      month,
      date: new Date(year, month, 1)
    }
  }
  return null
}

function parseRelativeWeekday(input) {
  for (let i = 0; i < WEEKDAY_NAMES.length; i++) {
    const weekdayName = WEEKDAY_NAMES[i]
    if (input.includes(weekdayName)) {
      const now = new Date()
      const currentWeekday = now.getDay()
      let daysToAdd = (i - currentWeekday + 7) % 7
      
      if (input.includes('上') || input.includes('前')) {
        daysToAdd = daysToAdd === 0 ? -7 : daysToAdd - 7
      } else if (input.includes('下') || input.includes('后')) {
        daysToAdd = daysToAdd === 0 ? 7 : daysToAdd
      } else if (daysToAdd === 0) {
        daysToAdd = 0
      }
      
      const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysToAdd)
      return {
        weekday: i,
        date: targetDate,
        isPast: daysToAdd < 0,
        isFuture: daysToAdd > 0
      }
    }
  }
  return null
}

function parseRelativeDay(input) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  if (input.includes('明天')) {
    return { type: 'tomorrow', date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1) }
  }
  if (input.includes('后天')) {
    return { type: 'dayAfterTomorrow', date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2) }
  }
  if (input.includes('昨天')) {
    return { type: 'yesterday', date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1) }
  }
  if (input.includes('前天')) {
    return { type: 'dayBeforeYesterday', date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2) }
  }
  return null
}

function getStaticCommands() {
  return [...VIEW_COMMANDS, ...PAGE_COMMANDS, ...QUICK_SELECT_COMMANDS]
}

function searchCommands(input) {
  if (!input || input.trim() === '') {
    return getStaticCommands().map(cmd => ({
      ...cmd,
      score: 0
    }))
  }

  const trimmedInput = input.trim()
  const results = []

  const staticCommands = getStaticCommands()
  for (const cmd of staticCommands) {
    if (fuzzyMatch(trimmedInput, cmd.keywords)) {
      results.push({
        ...cmd,
        score: calculateMatchScore(trimmedInput, cmd.keywords)
      })
    }
  }

  const yearMonth = parseYearMonth(trimmedInput)
  if (yearMonth) {
    let actionType = COMMAND_TYPES.DATE_NAVIGATE
    let labelPrefix = '跳转到'
    
    if (trimmedInput.includes('选') || trimmedInput.includes('选中')) {
      actionType = COMMAND_TYPES.DATE_SELECT
      labelPrefix = '选中'
    }
    
    results.push({
      type: actionType,
      target: 'yearMonth',
      date: yearMonth.date,
      label: `${labelPrefix}${yearMonth.year}年${yearMonth.month + 1}月`,
      score: 80
    })
  }

  const relativeWeekday = parseRelativeWeekday(trimmedInput)
  if (relativeWeekday) {
    let actionType = COMMAND_TYPES.DATE_SELECT
    let labelPrefix = '选中'
    
    if (trimmedInput.includes('跳') || trimmedInput.includes('跳转')) {
      actionType = COMMAND_TYPES.DATE_NAVIGATE
      labelPrefix = '跳转到'
    }
    
    const weekdayText = WEEKDAY_NAMES[relativeWeekday.weekday]
    let directionText = ''
    if (relativeWeekday.isPast) {
      directionText = '上'
    } else if (relativeWeekday.isFuture) {
      directionText = '下'
    }
    
    results.push({
      type: actionType,
      target: 'weekday',
      date: relativeWeekday.date,
      label: `${labelPrefix}${directionText}周${weekdayText}`,
      score: 70
    })
  }

  const relativeDay = parseRelativeDay(trimmedInput)
  if (relativeDay && !results.some(r => r.target === relativeDay.type)) {
    let actionType = COMMAND_TYPES.DATE_SELECT
    let labelPrefix = '选中'
    
    if (trimmedInput.includes('跳') || trimmedInput.includes('跳转')) {
      actionType = COMMAND_TYPES.DATE_NAVIGATE
      labelPrefix = '跳转到'
    }
    
    results.push({
      type: actionType,
      target: relativeDay.type,
      date: relativeDay.date,
      label: `${labelPrefix}${trimmedInput.includes('明天') ? '明天' : trimmedInput.includes('后天') ? '后天' : trimmedInput.includes('昨天') ? '昨天' : '前天'}`,
      score: 90
    })
  }

  return results.sort((a, b) => b.score - a.score)
}

function _getCalendarInstance(calendarRef) {
  if (!calendarRef) return null
  if (calendarRef.value) return calendarRef.value
  return calendarRef
}

function executeCommand(command, calendarRef) {
  const calendarInstance = _getCalendarInstance(calendarRef)
  if (!calendarInstance) return false

  switch (command.type) {
    case COMMAND_TYPES.VIEW_SWITCH:
      if (typeof calendarInstance.toggleViewMode === 'function') {
        calendarInstance.toggleViewMode()
      }
      return true

    case COMMAND_TYPES.PAGE_NAVIGATE:
      if (typeof calendarInstance.changePageTo === 'function') {
        if (command.target === 'today') {
          calendarInstance.changePageTo(new Date())
        } else {
          calendarInstance.changePageTo(command.target)
        }
      }
      return true

    case COMMAND_TYPES.DATE_NAVIGATE:
      if (typeof calendarInstance.changePageTo === 'function') {
        if (command.date) {
          calendarInstance.changePageTo(command.date)
        } else if (command.target === 'today') {
          calendarInstance.changePageTo(new Date())
        }
      }
      return true

    case COMMAND_TYPES.DATE_SELECT:
      if (typeof calendarInstance.changeSelectedDate === 'function') {
        if (command.date) {
          calendarInstance.changeSelectedDate(command.date)
        } else if (command.target === 'today') {
          calendarInstance.changeSelectedDate(new Date())
        }
      }
      return true

    default:
      return false
  }
}

export {
  COMMAND_TYPES,
  searchCommands,
  executeCommand,
  getStaticCommands,
  fuzzyMatch,
  parseYearMonth,
  parseRelativeWeekday,
  parseRelativeDay
}
