const WEATHER_TYPES = {
  temperature: {
    key: 'temperature_2m',
    label: '温度',
    unit: '°C',
    color: '#ff6b6b',
    gradient: ['#ff6b6b', '#ffa502', '#ff4757']
  },
  humidity: {
    key: 'relative_humidity_2m',
    label: '湿度',
    unit: '%',
    color: '#74b9ff',
    gradient: ['#74b9ff', '#0984e3', '#6c5ce7']
  },
  pressure: {
    key: 'pressure_msl',
    label: '气压',
    unit: 'hPa',
    color: '#00b894',
    gradient: ['#00b894', '#55efc4', '#81ecec']
  },
  windSpeed: {
    key: 'wind_speed_10m',
    label: '风速',
    unit: 'km/h',
    color: '#fdcb6e',
    gradient: ['#fdcb6e', '#f39c12', '#e17055']
  },
  precipitation: {
    key: 'precipitation',
    label: '降水量',
    unit: 'mm',
    color: '#a29bfe',
    gradient: ['#a29bfe', '#6c5ce7', '#a29bfe']
  }
}

const BASE_URL = 'https://api.open-meteo.com/v1/forecast'

function getDefaultCoordinates() {
  return {
    latitude: 39.9042,
    longitude: 116.4074
  }
}

async function fetchWeatherData(coordinates, forecastDays = 16) {
  const { latitude, longitude } = coordinates || getDefaultCoordinates()
  
  const hourlyParams = Object.values(WEATHER_TYPES).map(type => type.key).join(',')
  
  const url = `${BASE_URL}?latitude=${latitude}&longitude=${longitude}&hourly=${hourlyParams}&forecast_days=${forecastDays}&timezone=auto`
  
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.error('Failed to fetch weather data:', error)
    return null
  }
}

function processWeatherData(rawData) {
  if (!rawData || !rawData.hourly) {
    return null
  }
  
  const { hourly } = rawData
  const { time } = hourly
  
  const processedData = {
    hours: time.length,
    hourlyData: {},
    dates: []
  }
  
  Object.keys(WEATHER_TYPES).forEach(type => {
    const key = WEATHER_TYPES[type].key
    if (hourly[key]) {
      processedData.hourlyData[type] = hourly[key]
    }
  })
  
  const dateMap = new Map()
  time.forEach((timeStr, index) => {
    const date = timeStr.split('T')[0]
    if (!dateMap.has(date)) {
      dateMap.set(date, {
        date,
        startIndex: index,
        endIndex: index + 23
      })
      processedData.dates.push(date)
    }
  })
  
  processedData.dateMap = dateMap
  
  return processedData
}

function getHourlyDataForDate(processedData, date) {
  if (!processedData || !processedData.dateMap || !processedData.dateMap.has(date)) {
    return null
  }
  
  const dateInfo = processedData.dateMap.get(date)
  const result = {
    date,
    hours: [],
    values: {}
  }
  
  for (let i = dateInfo.startIndex; i <= dateInfo.endIndex && i < processedData.hours; i++) {
    result.hours.push(i - dateInfo.startIndex)
  }
  
  Object.keys(processedData.hourlyData).forEach(type => {
    result.values[type] = processedData.hourlyData[type].slice(
      dateInfo.startIndex,
      dateInfo.endIndex + 1
    )
  })
  
  return result
}

function normalizeData(values, minVal, maxVal) {
  const min = minVal !== undefined ? minVal : Math.min(...values)
  const max = maxVal !== undefined ? maxVal : Math.max(...values)
  
  if (max === min) {
    return values.map(() => 0.5)
  }
  
  return values.map(val => (val - min) / (max - min))
}

export {
  WEATHER_TYPES,
  getDefaultCoordinates,
  fetchWeatherData,
  processWeatherData,
  getHourlyDataForDate,
  normalizeData
}
