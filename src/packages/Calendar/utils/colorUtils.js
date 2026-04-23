const colorCache = new Map()

const traditionalColors = [
  { name: '暮云灰', hsl: [0, 0, 60] },
  { name: '薄荷青', hsl: [150, 60, 70] },
  { name: '月白', hsl: [210, 40, 90] },
  { name: '缃叶', hsl: [45, 70, 70] },
  { name: '天青', hsl: [200, 50, 85] },
  { name: '胭脂', hsl: [0, 70, 50] },
  { name: '朱砂', hsl: [0, 85, 55] },
  { name: '鸦青', hsl: [210, 30, 25] },
  { name: '黛紫', hsl: [270, 40, 35] },
  { name: '松花', hsl: [90, 60, 70] },
  { name: '丁香', hsl: [270, 40, 70] },
  { name: '品红', hsl: [330, 80, 55] },
  { name: '桃红', hsl: [350, 70, 70] },
  { name: '海棠红', hsl: [350, 60, 55] },
  { name: '玫瑰红', hsl: [340, 70, 60] },
  { name: '石榴红', hsl: [0, 75, 50] },
  { name: '樱桃红', hsl: [5, 80, 50] },
  { name: '银红', hsl: [0, 50, 75] },
  { name: '朱红', hsl: [0, 80, 55] },
  { name: '丹红', hsl: [10, 80, 55] },
  { name: '火红', hsl: [15, 85, 50] },
  { name: '赫赤', hsl: [20, 80, 45] },
  { name: '嫣红', hsl: [340, 60, 65] },
  { name: '洋红', hsl: [330, 90, 60] },
  { name: '茜红', hsl: [5, 75, 50] },
  { name: '杏黄', hsl: [35, 80, 60] },
  { name: '橘黄', hsl: [30, 90, 55] },
  { name: '橙黄', hsl: [40, 90, 60] },
  { name: '姜黄', hsl: [45, 70, 55] },
  { name: '缃色', hsl: [50, 70, 75] },
  { name: '鹅黄', hsl: [45, 80, 70] },
  { name: '鸭黄', hsl: [40, 70, 75] },
  { name: '柳黄', hsl: [60, 60, 70] },
  { name: '秋香', hsl: [45, 50, 60] },
  { name: '金黄', hsl: [45, 90, 50] },
  { name: '牙色', hsl: [40, 30, 85] },
  { name: '驼色', hsl: [35, 40, 65] },
  { name: '檀香', hsl: [30, 50, 55] },
  { name: '琥珀', hsl: [35, 80, 50] },
  { name: '茶色', hsl: [30, 30, 50] },
  { name: '棕黑', hsl: [25, 40, 25] },
  { name: '棕红', hsl: [10, 50, 40] },
  { name: '赭色', hsl: [20, 60, 40] },
  { name: '赭石', hsl: [15, 55, 45] },
  { name: '咖啡', hsl: [25, 40, 35] },
  { name: '褐色', hsl: [30, 40, 40] },
  { name: '黄栌', hsl: [25, 60, 45] },
  { name: '秋色', hsl: [35, 70, 45] },
  { name: '秋香色', hsl: [40, 60, 60] },
  { name: '缟色', hsl: [0, 0, 95] },
  { name: '素色', hsl: [0, 0, 90] },
  { name: '霜色', hsl: [0, 0, 92] },
  { name: '象牙白', hsl: [40, 20, 90] },
  { name: '雪白', hsl: [0, 0, 98] },
  { name: '缟白', hsl: [0, 0, 95] },
  { name: '莹白', hsl: [0, 0, 96] },
  { name: '鱼肚白', hsl: [180, 10, 95] },
  { name: '精白', hsl: [0, 0, 100] },
  { name: '石青', hsl: [210, 60, 50] },
  { name: '靛青', hsl: [240, 60, 40] },
  { name: '碧蓝', hsl: [200, 70, 60] },
  { name: '蔚蓝', hsl: [210, 80, 70] },
  { name: '宝蓝', hsl: [220, 80, 50] },
  { name: '蓝灰色', hsl: [210, 20, 60] },
  { name: '藏青', hsl: [220, 70, 30] },
  { name: '黛蓝', hsl: [220, 50, 40] },
  { name: '品蓝', hsl: [230, 70, 50] },
  { name: '靛蓝', hsl: [240, 70, 40] },
  { name: '海蓝', hsl: [200, 70, 50] },
  { name: '湖蓝', hsl: [190, 80, 60] },
  { name: '暗蓝', hsl: [220, 60, 35] },
  { name: '群青', hsl: [240, 70, 50] },
  { name: '雪青', hsl: [270, 40, 70] },
  { name: '黛色', hsl: [240, 30, 40] },
  { name: '苍色', hsl: [180, 20, 50] },
  { name: '灰鼠', hsl: [240, 20, 40] },
  { name: '墨色', hsl: [0, 0, 20] },
  { name: '墨灰', hsl: [0, 0, 30] },
  { name: '玄青', hsl: [240, 40, 20] },
  { name: '乌色', hsl: [0, 0, 25] },
  { name: '铅灰', hsl: [240, 10, 50] },
  { name: '暗绿', hsl: [120, 50, 30] },
  { name: '碧绿', hsl: [150, 70, 50] },
  { name: '翠绿', hsl: [150, 80, 50] },
  { name: '葱绿', hsl: [120, 60, 60] },
  { name: '豆绿', hsl: [120, 40, 50] },
  { name: '橄榄绿', hsl: [120, 40, 40] },
  { name: '草绿', hsl: [120, 60, 50] },
  { name: '柳绿', hsl: [120, 70, 60] },
  { name: '竹青', hsl: [150, 50, 50] },
  { name: '葱倩', hsl: [140, 60, 45] },
  { name: '青葱', hsl: [140, 70, 50] },
  { name: '玉色', hsl: [150, 50, 80] },
  { name: '松绿', hsl: [150, 50, 55] },
  { name: '铜绿', hsl: [150, 50, 40] },
  { name: '绿沈', hsl: [120, 50, 35] },
  { name: '嫩绿', hsl: [120, 70, 70] },
  { name: '黄绿', hsl: [90, 60, 60] },
  { name: '粉绿', hsl: [140, 50, 80] },
  { name: '水绿', hsl: [150, 50, 85] },
  { name: '鸭绿', hsl: [140, 60, 70] },
  { name: '蟹壳青', hsl: [150, 30, 60] },
  { name: '青色', hsl: [180, 70, 50] },
  { name: '青翠', hsl: [170, 70, 60] },
  { name: '碧色', hsl: [170, 60, 70] },
  { name: '蓝绿', hsl: [180, 50, 50] },
  { name: '青碧', hsl: [180, 60, 65] },
  { name: '翡翠', hsl: [160, 60, 55] },
  { name: '碧霄', hsl: [200, 50, 80] },
  { name: '艾绿', hsl: [120, 40, 70] },
  { name: '瑟瑟', hsl: [180, 60, 55] },
  { name: '墨绿', hsl: [150, 50, 30] },
  { name: '青墨', hsl: [180, 30, 30] },
  { name: '螺青', hsl: [210, 40, 40] },
  { name: '青紫', hsl: [270, 60, 50] },
  { name: '紫檀', hsl: [0, 40, 30] },
  { name: '青金', hsl: [210, 30, 45] },
  { name: '藕色', hsl: [330, 30, 70] },
  { name: '酡红', hsl: [10, 50, 70] },
  { name: '酡颜', hsl: [10, 50, 75] },
  { name: '粉紫', hsl: [300, 50, 70] },
  { name: '酱紫', hsl: [270, 50, 40] },
  { name: '紫酱', hsl: [280, 50, 35] },
  { name: '幽紫', hsl: [280, 50, 45] },
  { name: '紫棠', hsl: [290, 50, 40] },
  { name: '赤金', hsl: [40, 80, 45] },
  { name: '铅白', hsl: [0, 0, 90] },
  { name: '胡粉', hsl: [0, 0, 95] },
  { name: '太白', hsl: [0, 0, 98] },
  { name: '粉白', hsl: [350, 20, 95] },
  { name: '米白', hsl: [40, 20, 92] },
  { name: '乳白', hsl: [40, 20, 95] },
  { name: '古铜', hsl: [35, 60, 40] },
  { name: '铜青', hsl: [180, 50, 50] },
  { name: '石黄', hsl: [45, 80, 50] },
  { name: '雄黄', hsl: [50, 80, 50] },
  { name: '雌黄', hsl: [55, 80, 55] },
  { name: '空青', hsl: [200, 60, 60] },
  { name: '曾青', hsl: [210, 60, 55] },
  { name: '白青', hsl: [200, 50, 70] },
  { name: '扁青', hsl: [210, 55, 50] },
  { name: '朱丹', hsl: [0, 85, 50] },
  { name: '绛', hsl: [0, 70, 40] },
  { name: '绯', hsl: [0, 75, 55] },
  { name: '殷', hsl: [0, 60, 35] },
  { name: '彤', hsl: [10, 70, 55] },
  { name: '赫', hsl: [20, 80, 45] },
  { name: '赪', hsl: [0, 80, 55] },
  { name: '绾', hsl: [0, 50, 60] },
  { name: '檀', hsl: [0, 30, 50] },
  { name: '赭', hsl: [20, 60, 40] },
  { name: '炎', hsl: [15, 85, 50] },
  { name: '橙', hsl: [30, 80, 55] },
  { name: '橘', hsl: [30, 90, 55] },
  { name: '杏', hsl: [35, 80, 60] },
  { name: '黄', hsl: [45, 90, 55] },
  { name: '缃', hsl: [50, 70, 75] },
  { name: '金', hsl: [45, 90, 50] },
  { name: '缥', hsl: [180, 50, 70] },
  { name: '碧', hsl: [170, 60, 70] },
  { name: '绿', hsl: [120, 60, 50] },
  { name: '青', hsl: [180, 70, 50] },
  { name: '苍', hsl: [180, 20, 50] },
  { name: '翠', hsl: [150, 80, 50] },
  { name: '葱', hsl: [120, 60, 60] },
  { name: '蓝', hsl: [230, 70, 50] },
  { name: '靛', hsl: [240, 60, 40] },
  { name: '紫', hsl: [270, 60, 50] },
  { name: '黑', hsl: [0, 0, 15] },
  { name: '玄', hsl: [0, 0, 25] },
  { name: '缁', hsl: [0, 0, 30] },
  { name: '皂', hsl: [0, 0, 35] },
  { name: '黯', hsl: [0, 0, 40] },
  { name: '乌', hsl: [0, 0, 25] },
  { name: '骊', hsl: [0, 0, 15] },
  { name: '白', hsl: [0, 0, 95] },
  { name: '素', hsl: [0, 0, 90] },
  { name: '缟', hsl: [0, 0, 95] },
  { name: '霜', hsl: [0, 0, 92] },
  { name: '雪', hsl: [0, 0, 98] },
  { name: '皓', hsl: [0, 0, 96] },
  { name: '皎', hsl: [0, 0, 97] },
  { name: '皑', hsl: [0, 0, 99] },
  { name: '皤', hsl: [0, 0, 98] },
  { name: '练', hsl: [0, 0, 93] },
  { name: '缣', hsl: [40, 20, 88] },
  { name: '缯', hsl: [40, 15, 90] },
  { name: '褐', hsl: [30, 40, 40] },
  { name: '黄褐', hsl: [40, 40, 50] },
  { name: '棕褐', hsl: [30, 40, 45] },
  { name: '茶褐', hsl: [25, 40, 40] },
  { name: '栗壳', hsl: [20, 50, 35] },
  { name: '酱色', hsl: [20, 60, 30] },
  { name: '朱膘', hsl: [0, 80, 60] },
  { name: '大红', hsl: [0, 85, 50] },
  { name: '曙红', hsl: [340, 80, 55] },
  { name: '猩红', hsl: [5, 90, 55] },
  { name: '西洋红', hsl: [350, 80, 60] },
  { name: '藤黄', hsl: [50, 80, 60] },
  { name: '土黄', hsl: [35, 50, 50] },
  { name: '棕色', hsl: [30, 40, 40] },
  { name: '象牙', hsl: [40, 20, 90] }
]

function _hashDate(date) {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const dateStr = `${year}-${month}-${day}`
  let hash = 0
  for (let i = 0; i < dateStr.length; i++) {
    const char = dateStr.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

function generateColorFromDate(date) {
  const dateStr = date.toDateString()
  if (colorCache.has(dateStr)) {
    return colorCache.get(dateStr)
  }

  const hash = _hashDate(date)
  
  const h = hash % 360
  const s = 40 + (hash % 31)
  const l = 55 + (hash % 21)

  const color = { h, s, l }
  colorCache.set(dateStr, color)
  return color
}

function hslToRgb(h, s, l) {
  s /= 100
  l /= 100
  const k = n => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  return [
    Math.round(f(0) * 255),
    Math.round(f(8) * 255),
    Math.round(f(4) * 255)
  ]
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }).join('').toUpperCase()
}

function hslToHex(h, s, l) {
  const [r, g, b] = hslToRgb(h, s, l)
  return rgbToHex(r, g, b)
}

function getComplementaryColor(h, s, l) {
  return { h: (h + 180) % 360, s, l }
}

function getAnalogousColors(h, s, l) {
  return [
    { h: (h - 30 + 360) % 360, s, l: Math.min(l + 5, 100) },
    { h: (h + 30) % 360, s, l: Math.min(l + 5, 100) }
  ]
}

function _deltaE94(lab1, lab2) {
  const [L1, a1, b1] = lab1
  const [L2, a2, b2] = lab2
  
  const dL = L1 - L2
  const dA = a1 - a2
  const dB = b1 - b2
  
  const C1 = Math.sqrt(a1 * a1 + b1 * b1)
  const C2 = Math.sqrt(a2 * a2 + b2 * b2)
  const dC = C1 - C2
  
  const dH = Math.sqrt(Math.max(0, dA * dA + dB * dB - dC * dC))
  
  const SL = 1
  const KC = 1
  const KH = 1
  const K1 = 0.045
  const K2 = 0.015
  
  const SC = 1 + K1 * C1
  const SH = 1 + K2 * C1
  
  const term1 = dL / SL
  const term2 = dC / (KC * SC)
  const term3 = dH / (KH * SH)
  
  return Math.sqrt(term1 * term1 + term2 * term2 + term3 * term3)
}

function _rgbToLab(r, g, b) {
  let rn = r / 255
  let gn = g / 255
  let bn = b / 255
  
  rn = rn > 0.04045 ? Math.pow((rn + 0.055) / 1.055, 2.4) : rn / 12.92
  gn = gn > 0.04045 ? Math.pow((gn + 0.055) / 1.055, 2.4) : gn / 12.92
  bn = bn > 0.04045 ? Math.pow((bn + 0.055) / 1.055, 2.4) : bn / 12.92
  
  let x = (rn * 0.4124 + gn * 0.3576 + bn * 0.1805) / 0.95047
  let y = (rn * 0.2126 + gn * 0.7152 + bn * 0.0722) / 1.00000
  let z = (rn * 0.0193 + gn * 0.1192 + bn * 0.9505) / 1.08883
  
  x = x > 0.008856 ? Math.pow(x, 1 / 3) : (7.787 * x) + 16 / 116
  y = y > 0.008856 ? Math.pow(y, 1 / 3) : (7.787 * y) + 16 / 116
  z = z > 0.008856 ? Math.pow(z, 1 / 3) : (7.787 * z) + 16 / 116
  
  return [
    116 * y - 16,
    500 * (x - y),
    200 * (y - z)
  ]
}

function findClosestTraditionalColor(h, s, l) {
  const [r, g, b] = hslToRgb(h, s, l)
  const targetLab = _rgbToLab(r, g, b)
  
  let minDistance = Infinity
  let closestColor = traditionalColors[0]
  
  for (const color of traditionalColors) {
    const [cr, cg, cb] = hslToRgb(color.hsl[0], color.hsl[1], color.hsl[2])
    const colorLab = _rgbToLab(cr, cg, cb)
    const distance = _deltaE94(targetLab, colorLab)
    
    if (distance < minDistance) {
      minDistance = distance
      closestColor = color
    }
  }
  
  return closestColor.name
}

function formatColorInfo(date) {
  const { h, s, l } = generateColorFromDate(date)
  const [r, g, b] = hslToRgb(h, s, l)
  const hex = rgbToHex(r, g, b)
  const name = findClosestTraditionalColor(h, s, l)
  
  const complementary = getComplementaryColor(h, s, l)
  const analogous = getAnalogousColors(h, s, l)
  
  return {
    name,
    hsl: `hsl(${h}, ${s}%, ${l}%)`,
    hslRaw: { h, s, l },
    rgb: `rgb(${r}, ${g}, ${b})`,
    rgbRaw: { r, g, b },
    hex,
    complementary: {
      hsl: `hsl(${complementary.h}, ${complementary.s}%, ${complementary.l}%)`,
      hex: hslToHex(complementary.h, complementary.s, complementary.l),
      hslRaw: complementary
    },
    analogous: analogous.map(a => ({
      hsl: `hsl(${a.h}, ${a.s}%, ${a.l}%)`,
      hex: hslToHex(a.h, a.s, a.l),
      hslRaw: a
    })),
    date: date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
  }
}

function getMonthColors(year, month) {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const colors = []
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day)
    colors.push(generateColorFromDate(date))
  }
  return colors
}

function generateGradientFromColors(colors) {
  const colorSteps = colors.map((c, i) => {
    const percent = (i / (colors.length - 1)) * 100
    return `hsl(${c.h}, ${c.s}%, ${c.l}%) ${percent}%`
  })
  return `linear-gradient(to right, ${colorSteps.join(', ')})`
}

export {
  generateColorFromDate,
  hslToRgb,
  rgbToHex,
  hslToHex,
  getComplementaryColor,
  getAnalogousColors,
  findClosestTraditionalColor,
  formatColorInfo,
  getMonthColors,
  generateGradientFromColors
}