export const SEASONS = {
  SPRING: 'spring',
  SUMMER: 'summer',
  AUTUMN: 'autumn',
  WINTER: 'winter'
}

export function getSeasonByMonth(month) {
  if (month >= 2 && month <= 4) {
    return SEASONS.SPRING
  } else if (month >= 5 && month <= 7) {
    return SEASONS.SUMMER
  } else if (month >= 8 && month <= 10) {
    return SEASONS.AUTUMN
  } else {
    return SEASONS.WINTER
  }
}

export function isSameSeason(month1, month2) {
  return getSeasonByMonth(month1) === getSeasonByMonth(month2)
}

export const defaultSeasonThemes = {
  [SEASONS.SPRING]: {
    name: '春季',
    themeColor: '#f06292',
    themeColorLight: 'rgba(240, 98, 146, 0.2)',
    textColorLevel1: '#5d4037',
    textColorLevel2: '#795548',
    textColorLevel3: '#8d6e63',
    textColorLevel4: '#a1887f',
    textColorLevel5: '#bcaaa4',
    backgroundColor: 'linear-gradient(135deg, #fce4ec 0%, #f8bbd9 100%)',
    backgroundPattern: 'radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 182, 193, 0.3) 0%, transparent 50%)'
  },
  [SEASONS.SUMMER]: {
    name: '夏季',
    themeColor: '#29b6f6',
    themeColorLight: 'rgba(41, 182, 246, 0.2)',
    textColorLevel1: '#01579b',
    textColorLevel2: '#0277bd',
    textColorLevel3: '#0288d1',
    textColorLevel4: '#039be5',
    textColorLevel5: '#03a9f4',
    backgroundColor: 'linear-gradient(135deg, #e1f5fe 0%, #81d4fa 100%)',
    backgroundPattern: 'radial-gradient(circle at 30% 70%, rgba(255, 255, 255, 0.2) 0%, transparent 40%), radial-gradient(circle at 70% 30%, rgba(100, 218, 255, 0.2) 0%, transparent 40%)'
  },
  [SEASONS.AUTUMN]: {
    name: '秋季',
    themeColor: '#ff7043',
    themeColorLight: 'rgba(255, 112, 67, 0.2)',
    textColorLevel1: '#3e2723',
    textColorLevel2: '#4e342e',
    textColorLevel3: '#5d4037',
    textColorLevel4: '#6d4c41',
    textColorLevel5: '#795548',
    backgroundColor: 'linear-gradient(135deg, #fff3e0 0%, #ffcc80 100%)',
    backgroundPattern: 'radial-gradient(circle at 25% 75%, rgba(255, 255, 255, 0.2) 0%, transparent 45%), radial-gradient(circle at 75% 25%, rgba(255, 204, 128, 0.3) 0%, transparent 45%)'
  },
  [SEASONS.WINTER]: {
    name: '冬季',
    themeColor: '#7e57c2',
    themeColorLight: 'rgba(126, 87, 194, 0.2)',
    textColorLevel1: '#311b92',
    textColorLevel2: '#4527a0',
    textColorLevel3: '#512da8',
    textColorLevel4: '#5e35b1',
    textColorLevel5: '#673ab7',
    backgroundColor: 'linear-gradient(135deg, #ede7f6 0%, #b39ddb 100%)',
    backgroundPattern: 'radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(200, 180, 255, 0.2) 0%, transparent 50%)'
  }
}
