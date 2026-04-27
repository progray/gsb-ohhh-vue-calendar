export const MARBLE_COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4',
  '#FFEAA7',
  '#DDA0DD',
  '#98D8C8',
  '#F7DC6F',
  '#BB8FCE',
  '#85C1E9',
  '#F8B500',
  '#FF69B4',
  '#00CED1',
  '#FF7F50',
  '#9370DB'
]

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

export function getRandomColor() {
  return MARBLE_COLORS[Math.floor(Math.random() * MARBLE_COLORS.length)]
}

export function formatDateKey(date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
}
