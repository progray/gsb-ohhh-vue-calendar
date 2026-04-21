import { ref, computed } from 'vue'

const BEIJING_LAT = 39.9042
const BEIJING_LNG = 116.4074

const weatherData = ref(null)
const loading = ref(false)
const error = ref(null)
const location = ref({ lat: BEIJING_LAT, lng: BEIJING_LNG, name: '北京' })

const weatherCodeMap = {
  0: { type: 'sunny', icon: '☀️', description: '晴天' },
  1: { type: 'partlyCloudy', icon: '🌤️', description: '大部晴朗' },
  2: { type: 'partlyCloudy', icon: '⛅', description: '局部多云' },
  3: { type: 'cloudy', icon: '☁️', description: '阴天' },
  45: { type: 'fog', icon: '🌫️', description: '雾' },
  48: { type: 'fog', icon: '🌫️', description: '冻雾' },
  51: { type: 'drizzle', icon: '🌧️', description: '毛毛雨' },
  53: { type: 'drizzle', icon: '🌧️', description: '毛毛雨' },
  55: { type: 'drizzle', icon: '🌧️', description: '毛毛雨' },
  56: { type: 'drizzle', icon: '🌧️', description: '冻毛毛雨' },
  57: { type: 'drizzle', icon: '🌧️', description: '冻毛毛雨' },
  61: { type: 'rain', icon: '🌧️', description: '小雨' },
  63: { type: 'rain', icon: '🌧️', description: '中雨' },
  65: { type: 'rain', icon: '🌧️', description: '大雨' },
  66: { type: 'rain', icon: '🌧️', description: '冻雨' },
  67: { type: 'rain', icon: '🌧️', description: '冻雨' },
  71: { type: 'snow', icon: '🌨️', description: '小雪' },
  73: { type: 'snow', icon: '🌨️', description: '中雪' },
  75: { type: 'snow', icon: '🌨️', description: '大雪' },
  77: { type: 'snow', icon: '🌨️', description: '雪粒' },
  80: { type: 'rain', icon: '🌦️', description: '阵雨' },
  81: { type: 'rain', icon: '🌦️', description: '阵雨' },
  82: { type: 'rain', icon: '🌦️', description: '强阵雨' },
  85: { type: 'snow', icon: '🌨️', description: '阵雪' },
  86: { type: 'snow', icon: '🌨️', description: '阵雪' },
  95: { type: 'thunderstorm', icon: '⛈️', description: '雷雨' },
  96: { type: 'thunderstorm', icon: '⛈️', description: '雷雨伴有冰雹' },
  99: { type: 'thunderstorm', icon: '⛈️', description: '雷雨伴有冰雹' }
}

const CACHE_KEY_PREFIX = 'weather_cache_'
const CACHE_EXPIRE_KEY = 'weather_cache_expire'

function getTodayDateKey() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function isCacheValid() {
  const expireDate = localStorage.getItem(CACHE_EXPIRE_KEY)
  const todayKey = getTodayDateKey()
  return expireDate === todayKey
}

function getCacheKey(lat, lng) {
  return `${CACHE_KEY_PREFIX}${lat.toFixed(2)}_${lng.toFixed(2)}`
}

function loadFromCache(lat, lng) {
  if (!isCacheValid()) {
    return null
  }
  const cacheKey = getCacheKey(lat, lng)
  const cached = localStorage.getItem(cacheKey)
  if (cached) {
    try {
      return JSON.parse(cached)
    } catch {
      return null
    }
  }
  return null
}

function saveToCache(lat, lng, data) {
  const todayKey = getTodayDateKey()
  localStorage.setItem(CACHE_EXPIRE_KEY, todayKey)
  
  const cacheKey = getCacheKey(lat, lng)
  localStorage.setItem(cacheKey, JSON.stringify(data))
}

function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getWeatherInfo(code) {
  return weatherCodeMap[code] || { type: 'unknown', icon: '❓', description: '未知' }
}

async function fetchWeather(lat, lng) {
  const cached = loadFromCache(lat, lng)
  if (cached) {
    weatherData.value = cached
    return cached
  }

  loading.value = true
  error.value = null

  try {
    const today = new Date()
    const startDate = new Date(today)
    startDate.setDate(today.getDate() - 2)
    const endDate = new Date(today)
    endDate.setDate(today.getDate() + 2)

    const startDateStr = formatDate(startDate)
    const endDateStr = formatDate(endDate)

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&start_date=${startDateStr}&end_date=${endDateStr}`

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    
    const processedData = processWeatherData(data)
    
    saveToCache(lat, lng, processedData)
    weatherData.value = processedData
    return processedData
  } catch (err) {
    error.value = err.message
    console.error('Failed to fetch weather:', err)
    return null
  } finally {
    loading.value = false
  }
}

function processWeatherData(data) {
  const { daily } = data
  if (!daily) {
    return null
  }

  const weatherByDate = {}
  const dates = daily.time || []
  const weatherCodes = daily.weather_code || []
  const maxTemps = daily.temperature_2m_max || []
  const minTemps = daily.temperature_2m_min || []

  dates.forEach((date, index) => {
    const weatherInfo = getWeatherInfo(weatherCodes[index])
    weatherByDate[date] = {
      date,
      weatherCode: weatherCodes[index],
      weatherType: weatherInfo.type,
      icon: weatherInfo.icon,
      description: weatherInfo.description,
      tempMax: maxTemps[index],
      tempMin: minTemps[index]
    }
  })

  return {
    weatherByDate,
    location: {
      latitude: data.latitude,
      longitude: data.longitude,
      timezone: data.timezone
    },
    fetchedAt: new Date().toISOString()
  }
}

async function getUserLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ lat: BEIJING_LAT, lng: BEIJING_LNG, name: '北京' })
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        location.value = { lat: latitude, lng: longitude, name: '当前位置' }
        resolve(location.value)
      },
      () => {
        resolve({ lat: BEIJING_LAT, lng: BEIJING_LNG, name: '北京' })
      }
    )
  })
}

function getWeatherForDate(date) {
  if (!weatherData.value) {
    return null
  }
  const dateKey = formatDate(new Date(date))
  return weatherData.value.weatherByDate?.[dateKey] || null
}

const hasWeatherData = computed(() => {
  return weatherData.value && Object.keys(weatherData.value.weatherByDate || {}).length > 0
})

export function useWeather() {
  return {
    weatherData,
    loading,
    error,
    location,
    hasWeatherData,
    fetchWeather,
    getUserLocation,
    getWeatherForDate,
    formatDate,
    BEIJING_LAT,
    BEIJING_LNG
  }
}
