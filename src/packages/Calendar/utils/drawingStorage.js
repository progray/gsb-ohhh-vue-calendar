const STORAGE_KEY = 'ohhh-calendar-drawings'

function getStorage() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : {}
  } catch (e) {
    console.error('Failed to read drawing storage:', e)
    return {}
  }
}

function setStorage(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.error('Failed to save drawing storage:', e)
  }
}

function formatDateKey(date) {
  if (!(date instanceof Date)) {
    date = new Date(date)
  }
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatMonthKey(date) {
  if (!(date instanceof Date)) {
    date = new Date(date)
  }
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

export function saveDrawing(date, imageData) {
  const storage = getStorage()
  const dateKey = formatDateKey(date)
  storage[dateKey] = imageData
  setStorage(storage)
}

export function getDrawing(date) {
  const storage = getStorage()
  const dateKey = formatDateKey(date)
  return storage[dateKey] || null
}

export function hasDrawing(date) {
  const storage = getStorage()
  const dateKey = formatDateKey(date)
  return !!storage[dateKey]
}

export function deleteDrawing(date) {
  const storage = getStorage()
  const dateKey = formatDateKey(date)
  delete storage[dateKey]
  setStorage(storage)
}

export function getMonthDrawings(year, month) {
  const storage = getStorage()
  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`
  const drawings = {}
  
  for (const [dateKey, imageData] of Object.entries(storage)) {
    if (dateKey.startsWith(monthKey)) {
      drawings[dateKey] = imageData
    }
  }
  
  return drawings
}

export function getMonthDrawingCount(year, month) {
  const drawings = getMonthDrawings(year, month)
  return Object.keys(drawings).length
}

export function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function generateRandomDrawing(canvasWidth, canvasHeight) {
  const canvas = document.createElement('canvas')
  canvas.width = canvasWidth
  canvas.height = canvasHeight
  const ctx = canvas.getContext('2d')
  
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)
  
  const colors = ['#ff6a6a', '#4a9eff', '#5cd859', '#ffca3a', '#9b59b6', '#1abc9c', '#e74c3c', '#333333']
  const type = Math.floor(Math.random() * 3)
  
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  
  if (type === 0) {
    // 随机曲线
    const color = colors[Math.floor(Math.random() * colors.length)]
    ctx.strokeStyle = color
    ctx.lineWidth = 3 + Math.random() * 8
    
    ctx.beginPath()
    const startX = 50 + Math.random() * (canvasWidth - 100)
    const startY = 50 + Math.random() * (canvasHeight - 100)
    ctx.moveTo(startX, startY)
    
    for (let i = 0; i < 15; i++) {
      const x = 50 + Math.random() * (canvasWidth - 100)
      const y = 50 + Math.random() * (canvasHeight - 100)
      ctx.lineTo(x, y)
    }
    ctx.stroke()
  } else if (type === 1) {
    // 随机方块/色块
    const count = 3 + Math.floor(Math.random() * 5)
    for (let i = 0; i < count; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)]
      ctx.fillStyle = color
      
      const x = 30 + Math.random() * (canvasWidth - 150)
      const y = 30 + Math.random() * (canvasHeight - 150)
      const size = 30 + Math.random() * 80
      
      ctx.fillRect(x, y, size, size)
    }
  } else {
    // 随机圆形
    const count = 3 + Math.floor(Math.random() * 8)
    for (let i = 0; i < count; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)]
      ctx.fillStyle = color
      
      const x = 50 + Math.random() * (canvasWidth - 100)
      const y = 50 + Math.random() * (canvasHeight - 100)
      const radius = 10 + Math.random() * 40
      
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  
  return canvas.toDataURL('image/png')
}

export function initRandomDrawingsForCurrentMonth() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const daysInMonth = getDaysInMonth(year, month)
  
  const existingDrawings = getMonthDrawings(year, month)
  const existingCount = Object.keys(existingDrawings).length
  
  if (existingCount >= 10) {
    return
  }
  
  const needToCreate = 10 - existingCount
  const availableDays = []
  
  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    if (!existingDrawings[dateKey]) {
      availableDays.push(day)
    }
  }
  
  const shuffled = availableDays.sort(() => Math.random() - 0.5)
  const selectedDays = shuffled.slice(0, needToCreate)
  
  const storage = getStorage()
  for (const day of selectedDays) {
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    storage[dateKey] = generateRandomDrawing(400, 300)
  }
  
  setStorage(storage)
}

export function clearAllDrawings() {
  localStorage.removeItem(STORAGE_KEY)
}
