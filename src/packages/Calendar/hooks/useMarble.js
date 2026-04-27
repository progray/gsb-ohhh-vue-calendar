import { ref, computed } from 'vue'
import { generateId, getRandomColor, formatDateKey } from '../utils/marble.js'
import { isSameDay } from '../utils/index.js'

export function useMarble() {
  const marbles = ref([])
  const connections = ref([])

  const activeMarbleId = ref(null)
  const connectionStart = ref(null)

  const marblesMap = computed(() => {
    const map = {}
    marbles.value.forEach(marble => {
      const key = formatDateKey(marble.date)
      if (!map[key]) {
        map[key] = []
      }
      map[key].push(marble)
    })
    return map
  })

  function createMarble(date, x = 0.5, y = 0.5) {
    const marble = {
      id: generateId(),
      date: new Date(date),
      x: x,
      y: y,
      color: getRandomColor(),
      isRemoving: false
    }
    marbles.value.push(marble)
    return marble
  }

  function removeMarble(marbleId) {
    const marbleIndex = marbles.value.findIndex(m => m.id === marbleId)
    if (marbleIndex !== -1) {
      marbles.value[marbleIndex].isRemoving = true
      setTimeout(() => {
        const idx = marbles.value.findIndex(m => m.id === marbleId)
        if (idx !== -1) {
          marbles.value.splice(idx, 1)
        }
      }, 300)
    }

    const connectionsToRemove = connections.value.filter(
      conn => conn.fromId === marbleId || conn.toId === marbleId
    )
    connectionsToRemove.forEach(conn => {
      const idx = connections.value.findIndex(c => c.id === conn.id)
      if (idx !== -1) {
        connections.value.splice(idx, 1)
      }
    })
  }

  function updateMarblePosition(marbleId, x, y) {
    const marble = marbles.value.find(m => m.id === marbleId)
    if (marble) {
      marble.x = x
      marble.y = y
    }
  }

  function updateMarbleDate(marbleId, newDate) {
    const marble = marbles.value.find(m => m.id === marbleId)
    if (marble) {
      marble.date = new Date(newDate)
    }
  }

  function startConnection(marbleId) {
    connectionStart.value = marbleId
  }

  function cancelConnection() {
    connectionStart.value = null
  }

  function createConnection(marbleId) {
    if (!connectionStart.value || connectionStart.value === marbleId) {
      connectionStart.value = null
      return null
    }

    const existingConnection = connections.value.find(
      conn => (conn.fromId === connectionStart.value && conn.toId === marbleId) ||
              (conn.fromId === marbleId && conn.toId === connectionStart.value)
    )

    if (existingConnection) {
      connectionStart.value = null
      return null
    }

    const connection = {
      id: generateId(),
      fromId: connectionStart.value,
      toId: marbleId
    }
    connections.value.push(connection)
    connectionStart.value = null
    return connection
  }

  function removeConnection(fromId, toId) {
    const idx = connections.value.findIndex(
      conn => (conn.fromId === fromId && conn.toId === toId) ||
              (conn.fromId === toId && conn.toId === fromId)
    )
    if (idx !== -1) {
      connections.value.splice(idx, 1)
    }
  }

  function getMarblesByDate(date) {
    const key = formatDateKey(date)
    return marblesMap.value[key] || []
  }

  function getMarbleById(id) {
    return marbles.value.find(m => m.id === id)
  }

  return {
    marbles,
    connections,
    activeMarbleId,
    connectionStart,
    marblesMap,
    createMarble,
    removeMarble,
    updateMarblePosition,
    updateMarbleDate,
    startConnection,
    cancelConnection,
    createConnection,
    removeConnection,
    getMarblesByDate,
    getMarbleById
  }
}
