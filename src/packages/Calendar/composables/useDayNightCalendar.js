import { ref, computed } from 'vue'

const STORAGE_KEY = 'day-night-calendar-data-v2'

const defaultTags = ['工作', '学习', '运动', '娱乐', '休息', '约会', '购物', '其他']

function formatDateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function generateInitialData() {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  
  const data = {}
  
  const dayDates = []
  while (dayDates.length < 15) {
    const randomDay = Math.floor(Math.random() * daysInMonth) + 1
    const dateKey = formatDateKey(new Date(year, month, randomDay))
    if (!dayDates.includes(dateKey)) {
      dayDates.push(dateKey)
    }
  }
  
  const nightDates = []
  const overlapCount = Math.min(6, dayDates.length)
  for (let i = 0; i < overlapCount; i++) {
    nightDates.push(dayDates[i])
  }
  
  while (nightDates.length < 10) {
    const randomDay = Math.floor(Math.random() * daysInMonth) + 1
    const dateKey = formatDateKey(new Date(year, month, randomDay))
    if (!nightDates.includes(dateKey)) {
      nightDates.push(dateKey)
    }
  }
  
  const dayContents = [
    '完成项目报告',
    '参加团队会议',
    '学习新技术',
    '代码审查',
    '客户拜访',
    '文档编写',
    'Bug修复',
    '需求分析',
    '系统设计',
    '代码重构',
    '性能优化',
    '测试用例',
    '部署上线',
    '技术分享',
    '代码培训'
  ]
  
  const nightContents = [
    '看电影放松',
    '阅读书籍',
    '健身房锻炼',
    '朋友聚餐',
    '追剧时间',
    '游戏娱乐',
    '散步放松',
    '冥想静心',
    '学习课程',
    '整理家务'
  ]
  
  dayDates.forEach((dateKey, index) => {
    if (!data[dateKey]) {
      data[dateKey] = { dateKey, day: null, night: null }
    }
    data[dateKey].day = {
      content: dayContents[index % dayContents.length],
      tags: [defaultTags[Math.floor(Math.random() * 4)]]
    }
  })
  
  nightDates.forEach((dateKey, index) => {
    if (!data[dateKey]) {
      data[dateKey] = { dateKey, day: null, night: null }
    }
    data[dateKey].night = {
      content: nightContents[index % nightContents.length],
      tags: [defaultTags[4 + Math.floor(Math.random() * 4)]]
    }
  })
  
  return data
}

function loadFromStorage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    console.error('Failed to load from storage:', e)
  }
  return null
}

function saveToStorage(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.error('Failed to save to storage:', e)
  }
}

export function useDayNightCalendar() {
  const viewMode = ref('both')
  
  let initialData = loadFromStorage()
  if (!initialData) {
    initialData = generateInitialData()
    saveToStorage(initialData)
  }
  
  const calendarData = ref(initialData)
  const selectedDate = ref(null)
  const isEditPanelOpen = ref(false)
  
  const dayStats = computed(() => {
    const stats = {
      totalDays: 0,
      tagCounts: {}
    }
    
    Object.values(calendarData.value).forEach(record => {
      if (record.day) {
        stats.totalDays++
        record.day.tags.forEach(tag => {
          stats.tagCounts[tag] = (stats.tagCounts[tag] || 0) + 1
        })
      }
    })
    
    return stats
  })
  
  const nightStats = computed(() => {
    const stats = {
      totalDays: 0,
      tagCounts: {}
    }
    
    Object.values(calendarData.value).forEach(record => {
      if (record.night) {
        stats.totalDays++
        record.night.tags.forEach(tag => {
          stats.tagCounts[tag] = (stats.tagCounts[tag] || 0) + 1
        })
      }
    })
    
    return stats
  })
  
  const topDayTags = computed(() => {
    const tags = Object.entries(dayStats.value.tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
    return tags
  })
  
  const topNightTags = computed(() => {
    const tags = Object.entries(nightStats.value.tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
    return tags
  })
  
  function setViewMode(mode) {
    viewMode.value = mode
  }
  
  function getRecordByDate(date) {
    const dateKey = formatDateKey(date)
    return calendarData.value[dateKey] || null
  }
  
  function openEditPanel(date) {
    selectedDate.value = date
    isEditPanelOpen.value = true
  }
  
  function closeEditPanel() {
    isEditPanelOpen.value = false
    selectedDate.value = null
  }
  
  function saveDayRecord(date, content, tags) {
    const dateKey = formatDateKey(date)
    if (!calendarData.value[dateKey]) {
      calendarData.value[dateKey] = { dateKey, day: null, night: null }
    }
    
    if (content || (tags && tags.length > 0)) {
      calendarData.value[dateKey].day = {
        content: content || '',
        tags: tags || []
      }
    } else {
      calendarData.value[dateKey].day = null
    }
    
    if (!calendarData.value[dateKey].day && !calendarData.value[dateKey].night) {
      delete calendarData.value[dateKey]
    }
    
    saveToStorage(calendarData.value)
  }
  
  function saveNightRecord(date, content, tags) {
    const dateKey = formatDateKey(date)
    if (!calendarData.value[dateKey]) {
      calendarData.value[dateKey] = { dateKey, day: null, night: null }
    }
    
    if (content || (tags && tags.length > 0)) {
      calendarData.value[dateKey].night = {
        content: content || '',
        tags: tags || []
      }
    } else {
      calendarData.value[dateKey].night = null
    }
    
    if (!calendarData.value[dateKey].day && !calendarData.value[dateKey].night) {
      delete calendarData.value[dateKey]
    }
    
    saveToStorage(calendarData.value)
  }
  
  function saveBothRecords(date, dayContent, dayTags, nightContent, nightTags) {
    saveDayRecord(date, dayContent, dayTags)
    saveNightRecord(date, nightContent, nightTags)
  }
  
  function clearDayRecord(date) {
    const dateKey = formatDateKey(date)
    if (calendarData.value[dateKey]) {
      calendarData.value[dateKey].day = null
      if (!calendarData.value[dateKey].night) {
        delete calendarData.value[dateKey]
      }
      saveToStorage(calendarData.value)
    }
  }
  
  function clearNightRecord(date) {
    const dateKey = formatDateKey(date)
    if (calendarData.value[dateKey]) {
      calendarData.value[dateKey].night = null
      if (!calendarData.value[dateKey].day) {
        delete calendarData.value[dateKey]
      }
      saveToStorage(calendarData.value)
    }
  }
  
  return {
    viewMode,
    calendarData,
    selectedDate,
    isEditPanelOpen,
    dayStats,
    nightStats,
    topDayTags,
    topNightTags,
    defaultTags,
    setViewMode,
    getRecordByDate,
    openEditPanel,
    closeEditPanel,
    saveDayRecord,
    saveNightRecord,
    saveBothRecords,
    clearDayRecord,
    clearNightRecord,
    formatDateKey
  }
}