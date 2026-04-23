const STORAGE_KEY = 'ohhh-calendar-notes'
const MAX_NOTE_LENGTH = 500

function formatDateKey(date) {
  if (typeof date === 'string') {
    return date
  }
  if (date instanceof Date) {
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
  }
  return ''
}

function getNotes() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : {}
  } catch (e) {
    console.error('Failed to parse notes from localStorage:', e)
    return {}
  }
}

function saveNotes(notes) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
  } catch (e) {
    console.error('Failed to save notes to localStorage:', e)
  }
}

function getNote(date) {
  const dateKey = formatDateKey(date)
  const notes = getNotes()
  return notes[dateKey] || ''
}

function saveNote(date, content) {
  const dateKey = formatDateKey(date)
  const notes = getNotes()
  
  if (content && content.trim()) {
    notes[dateKey] = content.substring(0, MAX_NOTE_LENGTH)
  } else {
    delete notes[dateKey]
  }
  
  saveNotes(notes)
}

function deleteNote(date) {
  const dateKey = formatDateKey(date)
  const notes = getNotes()
  delete notes[dateKey]
  saveNotes(notes)
}

function hasNote(date) {
  const dateKey = formatDateKey(date)
  const notes = getNotes()
  return !!notes[dateKey]
}

function getAllNotesWithDates() {
  const notes = getNotes()
  return Object.entries(notes).map(([dateKey, content]) => ({
    dateKey,
    content
  }))
}

function searchNotes(keyword) {
  if (!keyword || !keyword.trim()) {
    return []
  }
  
  const searchKeyword = keyword.toLowerCase()
  const allNotes = getAllNotesWithDates()
  
  return allNotes.filter(note => 
    note.content.toLowerCase().includes(searchKeyword)
  )
}

function parseDateKey(dateKey) {
  const parts = dateKey.split('-')
  if (parts.length === 3) {
    return {
      year: parseInt(parts[0], 10),
      month: parseInt(parts[1], 10) - 1,
      date: parseInt(parts[2], 10)
    }
  }
  return null
}

function getHighlightedContent(content, keyword) {
  if (!keyword || !keyword.trim()) {
    return content
  }
  
  const lowerKeyword = keyword.toLowerCase()
  const lowerContent = content.toLowerCase()
  const index = lowerContent.indexOf(lowerKeyword)
  
  if (index === -1) {
    return content.substring(0, 60) + (content.length > 60 ? '...' : '')
  }
  
  const start = Math.max(0, index - 30)
  const end = Math.min(content.length, index + keyword.length + 30)
  let snippet = content.substring(start, end)
  
  if (start > 0) {
    snippet = '...' + snippet
  }
  if (end < content.length) {
    snippet = snippet + '...'
  }
  
  return snippet
}

export {
  STORAGE_KEY,
  MAX_NOTE_LENGTH,
  formatDateKey,
  getNotes,
  saveNotes,
  getNote,
  saveNote,
  deleteNote,
  hasNote,
  getAllNotesWithDates,
  searchNotes,
  parseDateKey,
  getHighlightedContent
}
