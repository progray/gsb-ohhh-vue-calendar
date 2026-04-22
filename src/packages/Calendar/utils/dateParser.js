const WEEKDAY_NAMES = ['日', '一', '二', '三', '四', '五', '六']
const WEEKDAY_ALIASES = {
  '周日': 0, '星期日': 0, '礼拜天': 0, '礼拜日': 0,
  '周一': 1, '星期一': 1, '礼拜一': 1,
  '周二': 2, '星期二': 2, '礼拜二': 2,
  '周三': 3, '星期三': 3, '礼拜三': 3,
  '周四': 4, '星期四': 4, '礼拜四': 4,
  '周五': 5, '星期五': 5, '礼拜五': 5,
  '周六': 6, '星期六': 6, '礼拜六': 6, '周末': [0, 6], '双休日': [0, 6]
}

function isSameDay(d1, d2) {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
}

function cloneDate(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function addDays(date, days) {
  const result = cloneDate(date)
  result.setDate(result.getDate() + days)
  return result
}

function addMonths(date, months) {
  const result = cloneDate(date)
  result.setMonth(result.getMonth() + months)
  return result
}

function addWeeks(date, weeks) {
  return addDays(date, weeks * 7)
}

function getNextWeekday(date, targetWeekday, includeToday = false) {
  let result = cloneDate(date)
  if (includeToday && result.getDay() === targetWeekday) {
    return result
  }
  do {
    result = addDays(result, 1)
  } while (result.getDay() !== targetWeekday)
  return result
}

function getPrevWeekday(date, targetWeekday, includeToday = false) {
  let result = cloneDate(date)
  if (includeToday && result.getDay() === targetWeekday) {
    return result
  }
  do {
    result = addDays(result, -1)
  } while (result.getDay() !== targetWeekday)
  return result
}

function getMonthStart(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function getMonthEnd(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

function getNextMonthStart(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1)
}

function getPrevMonthEnd(date) {
  return new Date(date.getFullYear(), date.getMonth(), 0)
}

function parseWeekday(str) {
  for (const [alias, value] of Object.entries(WEEKDAY_ALIASES)) {
    if (str.includes(alias)) {
      return { weekdays: Array.isArray(value) ? value : [value], matched: alias }
    }
  }
  const match = str.match(/[一二三四五六日天]/)
  if (match) {
    const idx = WEEKDAY_NAMES.indexOf(match[0])
    if (idx !== -1) {
      return { weekdays: [idx], matched: match[0] }
    }
  }
  return null
}

function parseNumber(str) {
  const match = str.match(/(\d+|一两?|两|三|四|五|六|七|八|九|十)/)
  if (match) {
    const numMap = { '一': 1, '一两': 1, '两': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '十': 10 }
    const num = match[1]
    return numMap[num] || parseInt(num, 10)
  }
  return null
}

const PARSERS = [
  {
    name: '上周的今天/上周今天',
    pattern: /上周的?今天/,
    parse: (baseDate) => {
      const start = addDays(baseDate, -7)
      return { type: 'range', start, end: cloneDate(start), description: '上周今天' }
    }
  },
  {
    name: '下周的今天/下周今天',
    pattern: /下周的?今天/,
    parse: (baseDate) => {
      const start = addDays(baseDate, 7)
      return { type: 'range', start, end: cloneDate(start), description: '下周今天' }
    }
  },
  {
    name: '上个月的今天/上月今天',
    pattern: /上[个]?月的?今天/,
    parse: (baseDate) => {
      const start = addMonths(baseDate, -1)
      return { type: 'range', start, end: cloneDate(start), description: '上月今天' }
    }
  },
  {
    name: '下个月的今天/下月今天',
    pattern: /下[个]?月的?今天/,
    parse: (baseDate) => {
      const start = addMonths(baseDate, 1)
      return { type: 'range', start, end: cloneDate(start), description: '下月今天' }
    }
  },
  {
    name: '上周的星期X',
    pattern: /上周的[个]?(?:星期|周|礼拜)?[一二三四五六日天]/,
    parse: (baseDate, weekStart, str) => {
      const weekdayInfo = parseWeekday(str)
      if (!weekdayInfo) return null
      const targetWeekday = weekdayInfo.weekdays[0]
      const weekDay = baseDate.getDay()
      const offsetToStart = (weekDay - weekStart + 7) % 7
      const thisWeekStart = addDays(baseDate, -offsetToStart)
      const lastWeekStart = addDays(thisWeekStart, -7)
      const daysToAdd = (targetWeekday - weekStart + 7) % 7
      const start = addDays(lastWeekStart, daysToAdd)
      return { type: 'range', start, end: cloneDate(start), description: `上周${WEEKDAY_NAMES[targetWeekday]}` }
    }
  },
  {
    name: '下周的星期X',
    pattern: /下周的[个]?(?:星期|周|礼拜)?[一二三四五六日天]/,
    parse: (baseDate, weekStart, str) => {
      const weekdayInfo = parseWeekday(str)
      if (!weekdayInfo) return null
      const targetWeekday = weekdayInfo.weekdays[0]
      const weekDay = baseDate.getDay()
      const offsetToStart = (weekDay - weekStart + 7) % 7
      const thisWeekStart = addDays(baseDate, -offsetToStart)
      const nextWeekStart = addDays(thisWeekStart, 7)
      const daysToAdd = (targetWeekday - weekStart + 7) % 7
      const start = addDays(nextWeekStart, daysToAdd)
      return { type: 'range', start, end: cloneDate(start), description: `下周${WEEKDAY_NAMES[targetWeekday]}` }
    }
  },
  {
    name: '今天',
    pattern: /^今天$|^今日$/,
    parse: (baseDate) => {
      const start = cloneDate(baseDate)
      return { type: 'range', start, end: cloneDate(start), description: '今天' }
    }
  },
  {
    name: '明天',
    pattern: /^明天$|^明日$/,
    parse: (baseDate) => {
      const start = addDays(baseDate, 1)
      return { type: 'range', start, end: cloneDate(start), description: '明天' }
    }
  },
  {
    name: '后天',
    pattern: /^后天$/,
    parse: (baseDate) => {
      const start = addDays(baseDate, 2)
      return { type: 'range', start, end: cloneDate(start), description: '后天' }
    }
  },
  {
    name: '昨天',
    pattern: /^昨天$|^昨日$/,
    parse: (baseDate) => {
      const start = addDays(baseDate, -1)
      return { type: 'range', start, end: cloneDate(start), description: '昨天' }
    }
  },
  {
    name: '前天',
    pattern: /^前天$/,
    parse: (baseDate) => {
      const start = addDays(baseDate, -2)
      return { type: 'range', start, end: cloneDate(start), description: '前天' }
    }
  },
  {
    name: '本周',
    pattern: /^本周$/,
    parse: (baseDate, weekStart) => {
      const weekDay = baseDate.getDay()
      const offsetToStart = (weekDay - weekStart + 7) % 7
      const start = addDays(baseDate, -offsetToStart)
      const end = addDays(start, 6)
      return { type: 'range', start, end, description: '本周' }
    }
  },
  {
    name: '下周',
    pattern: /^下周$/,
    parse: (baseDate, weekStart) => {
      const weekDay = baseDate.getDay()
      const offsetToStart = (weekDay - weekStart + 7) % 7
      const thisWeekStart = addDays(baseDate, -offsetToStart)
      const start = addDays(thisWeekStart, 7)
      const end = addDays(start, 6)
      return { type: 'range', start, end, description: '下周' }
    }
  },
  {
    name: '上周',
    pattern: /^上周$/,
    parse: (baseDate, weekStart) => {
      const weekDay = baseDate.getDay()
      const offsetToStart = (weekDay - weekStart + 7) % 7
      const thisWeekStart = addDays(baseDate, -offsetToStart)
      const start = addDays(thisWeekStart, -7)
      const end = addDays(start, 6)
      return { type: 'range', start, end, description: '上周' }
    }
  },
  {
    name: '下N周',
    pattern: /下[一两三四五六七八九十\d]+周$/,
    parse: (baseDate, weekStart, str) => {
      const num = parseNumber(str) || 1
      const weekDay = baseDate.getDay()
      const offsetToStart = (weekDay - weekStart + 7) % 7
      const thisWeekStart = addDays(baseDate, -offsetToStart)
      const start = addDays(thisWeekStart, 7)
      const end = addDays(start, num * 7 - 1)
      return { type: 'range', start, end, description: `下${num}周` }
    }
  },
  {
    name: '本月',
    pattern: /^本月$/,
    parse: (baseDate) => {
      const start = getMonthStart(baseDate)
      const end = getMonthEnd(baseDate)
      return { type: 'range', start, end, description: '本月' }
    }
  },
  {
    name: '下月',
    pattern: /^下月$|^下个月$/,
    parse: (baseDate) => {
      const start = getNextMonthStart(baseDate)
      const end = getMonthEnd(start)
      return { type: 'range', start, end, description: '下月' }
    }
  },
  {
    name: '上月',
    pattern: /^上月$|^上个月$/,
    parse: (baseDate) => {
      const end = getPrevMonthEnd(baseDate)
      const start = getMonthStart(end)
      return { type: 'range', start, end, description: '上月' }
    }
  },
  {
    name: '本季度',
    pattern: /^本季度$/,
    parse: (baseDate) => {
      const quarter = Math.floor(baseDate.getMonth() / 3)
      const start = new Date(baseDate.getFullYear(), quarter * 3, 1)
      const end = new Date(baseDate.getFullYear(), quarter * 3 + 3, 0)
      return { type: 'range', start, end, description: '本季度' }
    }
  },
  {
    name: '今年',
    pattern: /^今年$/,
    parse: (baseDate) => {
      const start = new Date(baseDate.getFullYear(), 0, 1)
      const end = new Date(baseDate.getFullYear(), 11, 31)
      return { type: 'range', start, end, description: '今年' }
    }
  },
  {
    name: '明年',
    pattern: /^明年$/,
    parse: (baseDate) => {
      const start = new Date(baseDate.getFullYear() + 1, 0, 1)
      const end = new Date(baseDate.getFullYear() + 1, 11, 31)
      return { type: 'range', start, end, description: '明年' }
    }
  },
  {
    name: '去年',
    pattern: /^去年$/,
    parse: (baseDate) => {
      const start = new Date(baseDate.getFullYear() - 1, 0, 1)
      const end = new Date(baseDate.getFullYear() - 1, 11, 31)
      return { type: 'range', start, end, description: '去年' }
    }
  },
  {
    name: '下N天/日',
    pattern: /下[一两三四五六七八九十\d]+[天日]$/,
    parse: (baseDate, weekStart, str) => {
      const num = parseNumber(str) || 1
      const start = addDays(baseDate, num)
      return { type: 'range', start, end: cloneDate(start), description: `${num}天后` }
    }
  },
  {
    name: 'N天后/日后',
    pattern: /[一两三四五六七八九十\d]+[天日]后$/,
    parse: (baseDate, weekStart, str) => {
      const num = parseNumber(str) || 1
      const start = addDays(baseDate, num)
      return { type: 'range', start, end: cloneDate(start), description: `${num}天后` }
    }
  },
  {
    name: 'N天前/日前',
    pattern: /[一两三四五六七八九十\d]+[天日]前$/,
    parse: (baseDate, weekStart, str) => {
      const num = parseNumber(str) || 1
      const start = addDays(baseDate, -num)
      return { type: 'range', start, end: cloneDate(start), description: `${num}天前` }
    }
  },
  {
    name: 'N个月后',
    pattern: /[一两三四五六七八九十\d]+个月后$/,
    parse: (baseDate, weekStart, str) => {
      const num = parseNumber(str) || 1
      const start = addMonths(baseDate, num)
      return { type: 'range', start, end: cloneDate(start), description: `${num}个月后` }
    }
  },
  {
    name: 'N个月前',
    pattern: /[一两三四五六七八九十\d]+个月前$/,
    parse: (baseDate, weekStart, str) => {
      const num = parseNumber(str) || 1
      const start = addMonths(baseDate, -num)
      return { type: 'range', start, end: cloneDate(start), description: `${num}个月前` }
    }
  },
  {
    name: '下星期X/下周一等',
    pattern: /下[个]?(?:星期|周|礼拜)[一二三四五六日天]/,
    parse: (baseDate, weekStart, str) => {
      const weekdayInfo = parseWeekday(str)
      if (!weekdayInfo) return null
      const targetWeekday = weekdayInfo.weekdays[0]
      const start = getNextWeekday(baseDate, targetWeekday, false)
      return { type: 'range', start, end: cloneDate(start), description: `下${WEEKDAY_NAMES[targetWeekday]}` }
    }
  },
  {
    name: '上星期X/上周一等',
    pattern: /上[个]?(?:星期|周|礼拜)[一二三四五六日天]/,
    parse: (baseDate, weekStart, str) => {
      const weekdayInfo = parseWeekday(str)
      if (!weekdayInfo) return null
      const targetWeekday = weekdayInfo.weekdays[0]
      const start = getPrevWeekday(baseDate, targetWeekday, false)
      return { type: 'range', start, end: cloneDate(start), description: `上${WEEKDAY_NAMES[targetWeekday]}` }
    }
  },
  {
    name: '本星期X/本周一等',
    pattern: /本[个]?(?:星期|周|礼拜)[一二三四五六日天]/,
    parse: (baseDate, weekStart, str) => {
      const weekdayInfo = parseWeekday(str)
      if (!weekdayInfo) return null
      const targetWeekday = weekdayInfo.weekdays[0]
      const weekDay = baseDate.getDay()
      const offsetToStart = (weekDay - weekStart + 7) % 7
      const thisWeekStart = addDays(baseDate, -offsetToStart)
      const daysToAdd = (targetWeekday - weekStart + 7) % 7
      const start = addDays(thisWeekStart, daysToAdd)
      return { type: 'range', start, end: cloneDate(start), description: `本周${WEEKDAY_NAMES[targetWeekday]}` }
    }
  },
  {
    name: '这(一)?周',
    pattern: /这[一]?周/,
    parse: (baseDate, weekStart) => {
      const weekDay = baseDate.getDay()
      const offsetToStart = (weekDay - weekStart + 7) % 7
      const start = addDays(baseDate, -offsetToStart)
      const end = addDays(start, 6)
      return { type: 'range', start, end, description: '这周' }
    }
  },
  {
    name: '这(一)?月',
    pattern: /这[一]?月/,
    parse: (baseDate) => {
      const start = getMonthStart(baseDate)
      const end = getMonthEnd(baseDate)
      return { type: 'range', start, end, description: '这月' }
    }
  },
  {
    name: '周末/双休日 (无范围限定)',
    pattern: /^(周末|双休日)$/,
    parse: (baseDate) => {
      return {
        type: 'periodic',
        weekdays: [0, 6],
        start: cloneDate(baseDate),
        end: addMonths(baseDate, 3),
        description: '周末'
      }
    }
  },
  {
    name: '本月所有周X',
    pattern: /本[月个]?所有?(?:星期|周|礼拜)?[一二三四五六日天]+/,
    parse: (baseDate, weekStart, str) => {
      const weekdayInfo = parseWeekday(str)
      if (!weekdayInfo) return null
      const start = getMonthStart(baseDate)
      const end = getMonthEnd(baseDate)
      return {
        type: 'periodic',
        weekdays: weekdayInfo.weekdays,
        start,
        end,
        description: `本月所有${weekdayInfo.matched}`
      }
    }
  },
  {
    name: '下月所有周X',
    pattern: /下[月个]所有?(?:星期|周|礼拜)?[一二三四五六日天]+/,
    parse: (baseDate, weekStart, str) => {
      const weekdayInfo = parseWeekday(str)
      if (!weekdayInfo) return null
      const start = getNextMonthStart(baseDate)
      const end = getMonthEnd(start)
      return {
        type: 'periodic',
        weekdays: weekdayInfo.weekdays,
        start,
        end,
        description: `下月所有${weekdayInfo.matched}`
      }
    }
  },
  {
    name: '本月周末/双休日',
    pattern: /本月所有?(周末|双休日)/,
    parse: (baseDate) => {
      const start = getMonthStart(baseDate)
      const end = getMonthEnd(baseDate)
      return {
        type: 'periodic',
        weekdays: [0, 6],
        start,
        end,
        description: '本月周末'
      }
    }
  },
  {
    name: '下月周末/双休日',
    pattern: /下月所有?(周末|双休日)/,
    parse: (baseDate) => {
      const start = getNextMonthStart(baseDate)
      const end = getMonthEnd(start)
      return {
        type: 'periodic',
        weekdays: [0, 6],
        start,
        end,
        description: '下月周末'
      }
    }
  },
  {
    name: '接下来N天/未来N天',
    pattern: /(?:接下来|未来)[一两三四五六七八九十\d]+[天日]/,
    parse: (baseDate, weekStart, str) => {
      const num = parseNumber(str) || 7
      const start = cloneDate(baseDate)
      const end = addDays(start, num - 1)
      return { type: 'range', start, end, description: `接下来${num}天` }
    }
  },
  {
    name: '过去N天',
    pattern: /过去[一两三四五六七八九十\d]+[天日]/,
    parse: (baseDate, weekStart, str) => {
      const num = parseNumber(str) || 7
      const end = cloneDate(baseDate)
      const start = addDays(end, -(num - 1))
      return { type: 'range', start, end, description: `过去${num}天` }
    }
  }
]

const INTERVAL_PARSERS = [
  {
    name: '每隔N天',
    pattern: /每隔[一两三四五六七八九十\d]+天/,
    parse: (baseDate, str) => {
      const num = parseNumber(str) || 2
      const start = cloneDate(baseDate)
      const end = addMonths(baseDate, 3)
      return {
        type: 'interval',
        interval: num,
        start,
        end,
        description: `每隔${num}天`
      }
    }
  },
  {
    name: '每N天',
    pattern: /每[一两三四五六七八九十\d]+天/,
    parse: (baseDate, str) => {
      const num = parseNumber(str) || 1
      const start = cloneDate(baseDate)
      const end = addMonths(baseDate, 3)
      return {
        type: 'interval',
        interval: num,
        start,
        end,
        description: `每${num}天`
      }
    }
  }
]

function expandQueryResult(result) {
  if (!result) return { dates: [], description: '' }

  const dates = []
  const { start, end, description } = result

  if (result.type === 'range') {
    let current = cloneDate(start)
    while (current <= end) {
      dates.push(cloneDate(current))
      current = addDays(current, 1)
    }
  } else if (result.type === 'periodic') {
    let current = cloneDate(start)
    while (current <= end) {
      if (result.weekdays.includes(current.getDay())) {
        dates.push(cloneDate(current))
      }
      current = addDays(current, 1)
    }
  } else if (result.type === 'interval') {
    let current = cloneDate(start)
    while (current <= end) {
      dates.push(cloneDate(current))
      current = addDays(current, result.interval)
    }
  }

  return { dates, description }
}

export function parseDateQuery(query, baseDate = new Date(), weekStart = 0) {
  if (!query || typeof query !== 'string') {
    return { dates: [], description: '', success: false }
  }

  const trimmedQuery = query.trim()
  if (!trimmedQuery) {
    return { dates: [], description: '', success: false }
  }

  for (const parser of PARSERS) {
    if (parser.pattern.test(trimmedQuery)) {
      const result = parser.parse(baseDate, weekStart, trimmedQuery)
      if (result) {
        const expanded = expandQueryResult(result)
        return { ...expanded, success: true }
      }
    }
  }

  for (const parser of INTERVAL_PARSERS) {
    if (parser.pattern.test(trimmedQuery)) {
      const result = parser.parse(baseDate, trimmedQuery)
      if (result) {
        const expanded = expandQueryResult(result)
        return { ...expanded, success: true }
      }
    }
  }

  return { dates: [], description: '', success: false }
}

export function getMonthsWithMatches(dates) {
  if (!dates || dates.length === 0) return []

  const monthSet = new Set()
  dates.forEach(date => {
    monthSet.add(`${date.getFullYear()}-${date.getMonth()}`)
  })

  return Array.from(monthSet)
    .map(key => {
      const [year, month] = key.split('-').map(Number)
      return { year, month, label: `${year}年${month + 1}月` }
    })
    .sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year
      return a.month - b.month
    })
}

export function isDateInArray(date, dateArray) {
  if (!dateArray || dateArray.length === 0) return false
  return dateArray.some(d => isSameDay(date, d))
}

export default {
  parseDateQuery,
  getMonthsWithMatches,
  isDateInArray
}
