import { getLocalDateStr, addDays, compareDates } from './dateUtils'

const STORAGE_KEY = 'poem_learning_records'

export const storage = {
  getRecords() {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : {}
  },

  saveRecords(records) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  },

  getPoemRecord(poemId) {
    const records = this.getRecords()
    return records[poemId] || null
  },

  addLearningRecord(poemId) {
    const records = this.getRecords()
    const today = getLocalDateStr()
    
    if (!records[poemId]) {
      // 初学
      records[poemId] = {
        firstLearnDate: today,
        reviewDates: []
      }
    } else {
      // 复习，但学习当天不能复习
      if (records[poemId].firstLearnDate === today) {
        return records[poemId]
      }
      // 检查今天是否已经复习过
      const lastReview = records[poemId].reviewDates[0]
      if (lastReview !== today) {
        records[poemId].reviewDates.unshift(today)
      }
    }
    
    this.saveRecords(records)
    return records[poemId]
  },
  
  getAllRecordsSorted() {
    const records = this.getRecords()
    const allRecords = []
    
    for (const [poemId, record] of Object.entries(records)) {
      allRecords.push({
        poemId,
        ...record
      })
    }
    
    // 按最后学习日期排序
    allRecords.sort((a, b) => {
      const dateA = a.reviewDates[0] || a.firstLearnDate
      const dateB = b.reviewDates[0] || b.firstLearnDate
      return compareDates(dateB, dateA)
    })
    
    return allRecords
  },
  
  getTodayRecords() {
    const today = getLocalDateStr()
    const allRecords = this.getAllRecordsSorted()
    
    return allRecords.filter(record => {
      return record.firstLearnDate === today || record.reviewDates.includes(today)
    })
  },
  
  getReviewSchedule(poemId) {
    const record = this.getPoemRecord(poemId)
    if (!record) return []

    const intervals = [1, 4, 8, 15, 30]
    const schedule = []

    intervals.forEach(days => {
      schedule.push({
        days,
        date: addDays(record.firstLearnDate, days)
      })
    })

    return schedule
  },
  
  isReviewedToday(poemId) {
    const record = this.getPoemRecord(poemId)
    if (!record) return false

    const today = getLocalDateStr()
    return record.firstLearnDate === today || record.reviewDates.includes(today)
  }
}