import { ref, computed } from 'vue'
import { formatDate, parseDate, getMonthRange, isSameDay } from '../utils'

export function useFinanceRecords() {
  const records = ref({})

  function loadRecords() {
    try {
      const saved = localStorage.getItem('financeRecords')
      if (saved) {
        records.value = JSON.parse(saved)
      }
    } catch (e) {
      console.error('Failed to load records:', e)
    }
  }

  function saveRecords() {
    try {
      localStorage.setItem('financeRecords', JSON.stringify(records.value))
    } catch (e) {
      console.error('Failed to save records:', e)
    }
  }

  function getRecord(date) {
    const key = typeof date === 'string' ? date : formatDate(date)
    return records.value[key] || null
  }

  function setRecord(date, record) {
    const key = typeof date === 'string' ? date : formatDate(date)
    records.value[key] = {
      ...record,
      date: key
    }
    saveRecords()
  }

  function deleteRecord(date) {
    const key = typeof date === 'string' ? date : formatDate(date)
    delete records.value[key]
    saveRecords()
  }

  function getMonthlySummary(date) {
    const { start, end } = getMonthRange(date)
    let totalIncome = 0
    let totalExpense = 0

    for (const key in records.value) {
      const recordDate = parseDate(key)
      if (recordDate >= start && recordDate <= end) {
        totalIncome += records.value[key].income || 0
        totalExpense += records.value[key].expense || 0
      }
    }

    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      hasData: totalIncome > 0 || totalExpense > 0
    }
  }

  function hasRecord(date) {
    const key = typeof date === 'string' ? date : formatDate(date)
    return !!records.value[key]
  }

  function initDemoData() {
    const today = new Date()
    const demoData = generateDemoData(today)
    
    for (const key in demoData) {
      if (!records.value[key]) {
        records.value[key] = demoData[key]
      }
    }
    saveRecords()
  }

  function generateDemoData(today) {
    const data = {}
    const year = today.getFullYear()
    const month = today.getMonth()

    const demoRecords = [
      { monthOffset: 0, day: 1, income: 15000, expense: 0, remark: '工资' },
      { monthOffset: 0, day: 3, income: 0, expense: 3500, remark: '房租' },
      { monthOffset: 0, day: 5, income: 0, expense: 89, remark: '超市购物' },
      { monthOffset: 0, day: 8, income: 500, expense: 0, remark: '奖金' },
      { monthOffset: 0, day: 10, income: 0, expense: 120, remark: '聚餐' },
      { monthOffset: 0, day: 12, income: 0, expense: 45, remark: '地铁充值' },
      { monthOffset: 0, day: 15, income: 2000, expense: 0, remark: '兼职收入' },
      { monthOffset: 0, day: 18, income: 0, expense: 256, remark: '网购' },
      { monthOffset: 0, day: 20, income: 0, expense: 68, remark: '外卖' },
      { monthOffset: 0, day: 22, income: 800, expense: 0, remark: '红包' },
      { monthOffset: 0, day: 25, income: 0, expense: 150, remark: '电影票' },

      { monthOffset: -1, day: 1, income: 15000, expense: 0, remark: '工资' },
      { monthOffset: -1, day: 2, income: 0, expense: 3500, remark: '房租' },
      { monthOffset: -1, day: 6, income: 0, expense: 1200, remark: '买衣服' },
      { monthOffset: -1, day: 10, income: 1000, expense: 0, remark: '理财收益' },
      { monthOffset: -1, day: 15, income: 0, expense: 280, remark: '聚餐' },
      { monthOffset: -1, day: 18, income: 0, expense: 59, remark: '水果' },
      { monthOffset: -1, day: 22, income: 300, expense: 0, remark: '稿费' },
      { monthOffset: -1, day: 25, income: 0, expense: 89, remark: '打车' },
      { monthOffset: -1, day: 28, income: 0, expense: 45, remark: '早餐' },

      { monthOffset: -2, day: 1, income: 15000, expense: 0, remark: '工资' },
      { monthOffset: -2, day: 3, income: 0, expense: 3500, remark: '房租' },
      { monthOffset: -2, day: 8, income: 0, expense: 2500, remark: '电子产品' },
      { monthOffset: -2, day: 12, income: 0, expense: 180, remark: '健身卡' },
      { monthOffset: -2, day: 15, income: 500, expense: 0, remark: '红包' },
      { monthOffset: -2, day: 20, income: 0, expense: 320, remark: '聚餐' },
      { monthOffset: -2, day: 25, income: 0, expense: 78, remark: '日用品' },
      { monthOffset: -2, day: 28, income: 1200, expense: 0, remark: '兼职' }
    ]

    const currentDay = today.getDate()
    demoRecords.forEach((item, index) => {
      let recordYear = year
      let recordMonth = month + item.monthOffset
      
      if (recordMonth < 0) {
        recordYear -= 1
        recordMonth += 12
      }

      if (item.monthOffset === 0 && item.day > currentDay) {
        return
      }

      const key = `${recordYear}-${String(recordMonth + 1).padStart(2, '0')}-${String(item.day).padStart(2, '0')}`
      data[key] = {
        date: key,
        income: item.income,
        expense: item.expense,
        remark: item.remark
      }
    })

    return data
  }

  return {
    records,
    loadRecords,
    saveRecords,
    getRecord,
    setRecord,
    deleteRecord,
    getMonthlySummary,
    hasRecord,
    initDemoData
  }
}
