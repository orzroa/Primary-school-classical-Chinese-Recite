import { getLocalDateStr, addDays, compareDates } from './dateUtils'
import { eventBus, PERSON_CHANGED, RECORDS_CHANGED } from './eventBus'

const REVIEW_INTERVALS = [1, 4, 8, 15, 30]

// 人员管理相关 keys
const PERSONS_KEY = 'poem_persons'
const CURRENT_PERSON_KEY = 'poem_current_person'
const RECORDS_KEY_PREFIX = 'poem_learning_records_'
// 旧版（无人员隔离）的 key，用于一次性迁移
const LEGACY_RECORDS_KEY = 'poem_learning_records'

const DEFAULT_PERSON = {
  id: 'self',
  name: '我',
  isDefault: true,
  createdAt: '2026-08-13'
}

function loadPersons() {
  const data = localStorage.getItem(PERSONS_KEY)
  if (data) {
    try {
      const parsed = JSON.parse(data)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    } catch (e) {
      // 忽略
    }
  }
  // 首次使用：初始化默认人员
  const list = [DEFAULT_PERSON]
  localStorage.setItem(PERSONS_KEY, JSON.stringify(list))
  return list
}

function savePersons(list) {
  localStorage.setItem(PERSONS_KEY, JSON.stringify(list))
}

function legacyMigrateIfNeeded() {
  // 旧的单一用户数据迁移到默认"我"账户
  const legacy = localStorage.getItem(LEGACY_RECORDS_KEY)
  if (!legacy) return

  const targetKey = RECORDS_KEY_PREFIX + DEFAULT_PERSON.id
  if (!localStorage.getItem(targetKey)) {
    localStorage.setItem(targetKey, legacy)
  }
  // 删除旧 key，避免重复迁移
  localStorage.removeItem(LEGACY_RECORDS_KEY)
}

function getCurrentPersonId() {
  let id = localStorage.getItem(CURRENT_PERSON_KEY)
  if (id) return id

  // 首次使用：使用默认人员
  const persons = loadPersons()
  id = persons[0].id
  localStorage.setItem(CURRENT_PERSON_KEY, id)
  return id
}

function getRecordsKey(personId) {
  return RECORDS_KEY_PREFIX + personId
}

export const storage = {
  // ============ 人员管理 ============
  getPersons() {
    legacyMigrateIfNeeded()
    return loadPersons()
  },

  getCurrentPerson() {
    legacyMigrateIfNeeded()
    const persons = loadPersons()
    const currentId = getCurrentPersonId()
    return persons.find(p => p.id === currentId) || persons[0]
  },

  setCurrentPerson(personId) {
    const persons = loadPersons()
    if (persons.find(p => p.id === personId)) {
      const changed = getCurrentPersonId() !== personId
      localStorage.setItem(CURRENT_PERSON_KEY, personId)
      if (changed) {
        eventBus.emit(PERSON_CHANGED, loadPersons().find(p => p.id === personId))
      }
      return true
    }
    return false
  },

  addPerson(name) {
    const trimmed = (name || '').trim()
    if (!trimmed) return null

    const persons = loadPersons()
    const id = 'p_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)
    const newPerson = {
      id,
      name: trimmed,
      isDefault: false,
      createdAt: getLocalDateStr()
    }
    persons.push(newPerson)
    savePersons(persons)
    return newPerson
  },

  updatePersonName(personId, newName) {
    const trimmed = (newName || '').trim()
    if (!trimmed) return false

    const persons = loadPersons()
    const person = persons.find(p => p.id === personId)
    if (!person) return false
    person.name = trimmed
    savePersons(persons)
    return true
  },

  deletePerson(personId) {
    const persons = loadPersons()
    // 至少保留 1 个人员
    if (persons.length <= 1) return false

    const idx = persons.findIndex(p => p.id === personId)
    if (idx === -1) return false

    persons.splice(idx, 1)
    savePersons(persons)

    // 删除对应的记录
    localStorage.removeItem(getRecordsKey(personId))

    // 如果删的是当前人员，切换到第一个
    if (getCurrentPersonId() === personId) {
      localStorage.setItem(CURRENT_PERSON_KEY, persons[0].id)
    }
    return true
  },

  getPersonStats(personId) {
    const records = this.getRecordsByPerson(personId)
    const ids = Object.keys(records)
    return {
      total: ids.length,
      learned: ids.length
    }
  },

  // ============ 记录管理（按人员隔离） ============
  getRecords() {
    legacyMigrateIfNeeded()
    const personId = getCurrentPersonId()
    return this.getRecordsByPerson(personId)
  },

  getRecordsByPerson(personId) {
    const data = localStorage.getItem(getRecordsKey(personId))
    return data ? JSON.parse(data) : {}
  },

  saveRecords(records) {
    const personId = getCurrentPersonId()
    localStorage.setItem(getRecordsKey(personId), JSON.stringify(records))
    eventBus.emit(RECORDS_CHANGED, { reason: 'save' })
  },

  saveRecordsByPerson(personId, records) {
    localStorage.setItem(getRecordsKey(personId), JSON.stringify(records))
  },

  getPoemRecord(poemId) {
    const records = this.getRecords()
    let record = records[poemId] || null

    // 旧数据迁移：如果只有 reviewDates，自动生成 reviewSchedule
    if (record && !record.reviewSchedule && record.reviewDates) {
      record = this.migrateRecord(record)
      records[poemId] = record
      this.saveRecords(records)
    }

    return record
  },

  // 迁移旧数据格式
  migrateRecord(record) {
    const schedule = []
    const usedReviewDates = new Set()

    REVIEW_INTERVALS.forEach(days => {
      const plannedDate = addDays(record.firstLearnDate, days)

      let actualDate = null
      let status = 'pending'

      // 检查计划日期当天复习
      if (record.reviewDates.includes(plannedDate)) {
        actualDate = plannedDate
        status = 'on-time'
        usedReviewDates.add(plannedDate)
      } else {
        // 检查是否有补复习
        for (const reviewDate of record.reviewDates) {
          if (usedReviewDates.has(reviewDate)) continue

          if (compareDates(reviewDate, plannedDate) > 0) {
            const nextPlannedDate = addDays(record.firstLearnDate, REVIEW_INTERVALS[REVIEW_INTERVALS.indexOf(days) + 1] || 999)
            if (REVIEW_INTERVALS.indexOf(days) === REVIEW_INTERVALS.length - 1 || compareDates(reviewDate, nextPlannedDate) < 0) {
              actualDate = reviewDate
              status = 'makeup'
              usedReviewDates.add(reviewDate)
              break
            }
          }
        }
      }

      schedule.push({
        days,
        plannedDate,
        status,
        actualDate
      })
    })

    return {
      firstLearnDate: record.firstLearnDate,
      reviewSchedule: schedule,
      reviewDates: record.reviewDates
    }
  },

  // 初始化复习计划
  initReviewSchedule(firstLearnDate) {
    return REVIEW_INTERVALS.map(days => ({
      days,
      plannedDate: addDays(firstLearnDate, days),
      status: 'pending',
      actualDate: null
    }))
  },

  // 判断今天是否需要复习（有 pending 且 plannedDate <= 今天）
  needsReviewToday(poemId) {
    const record = this.getPoemRecord(poemId)
    if (!record || !record.reviewSchedule) return false

    const today = getLocalDateStr()

    // 学习当天不算复习
    if (record.firstLearnDate === today) return false

    return record.reviewSchedule.some(item =>
      item.status === 'pending' && compareDates(item.plannedDate, today) <= 0
    )
  },

  // 判断今天是否已经复习过
  reviewedToday(poemId) {
    const record = this.getPoemRecord(poemId)
    if (!record) return false

    const today = getLocalDateStr()
    return record.reviewDates.includes(today)
  },

  // 别名，兼容旧代码
  isReviewedToday(poemId) {
    return this.reviewedToday(poemId)
  },

  // 添加学习/复习记录
  addLearningRecord(poemId) {
    const records = this.getRecords()
    const today = getLocalDateStr()

    if (!records[poemId]) {
      // 初学
      records[poemId] = {
        firstLearnDate: today,
        reviewSchedule: this.initReviewSchedule(today),
        reviewDates: []
      }
    } else {
      const record = records[poemId]

      // 学习当天不能复习
      if (record.firstLearnDate === today) {
        return record
      }

      // 今天已经复习过
      if (record.reviewDates.includes(today)) {
        return record
      }

      // 添加今日复习记录
      record.reviewDates.unshift(today)

      // 把所有过期的 pending 节点标记为完成
      if (record.reviewSchedule) {
        record.reviewSchedule.forEach(item => {
          if (item.status === 'pending' && compareDates(item.plannedDate, today) <= 0) {
            if (today === item.plannedDate) {
              item.status = 'on-time'
            } else {
              item.status = 'makeup'
            }
            item.actualDate = today
          }
        })
      }
    }

    this.saveRecords(records)
    eventBus.emit(RECORDS_CHANGED, { poemId })
    return records[poemId]
  },

  getAllRecordsSorted() {
    const records = this.getRecords()
    const allRecords = []

    for (const poemId of Object.keys(records)) {
      const record = this.getPoemRecord(poemId)
      if (record) {
        allRecords.push({
          poemId,
          ...record
        })
      }
    }

    allRecords.sort((a, b) => {
      const dateA = a.reviewDates[0] || a.firstLearnDate
      const dateB = b.reviewDates[0] || b.firstLearnDate
      return compareDates(dateB, dateA)
    })

    return allRecords
  },

  // 获取所有复习计划历史
  getAllReviewHistory() {
    const allRecords = this.getAllRecordsSorted()
    const history = []

    allRecords.forEach(record => {
      if (!record.reviewSchedule) return

      record.reviewSchedule.forEach(item => {
        history.push({
          poemId: record.poemId,
          firstLearnDate: record.firstLearnDate,
          ...item
        })
      })
    })

    history.sort((a, b) => compareDates(b.plannedDate, a.plannedDate))

    return history
  },

  getReviewSchedule(poemId) {
    const record = this.getPoemRecord(poemId)
    if (!record) return []

    return record.reviewSchedule || this.initReviewSchedule(record.firstLearnDate)
  },

  // 获取今日待复习列表
  getTodayPendingReviews() {
    const today = getLocalDateStr()
    const allRecords = this.getAllRecordsSorted()
    const pending = []

    allRecords.forEach(record => {
      // 先检查今天是否已复习过（优先级最高）
      if (record.reviewDates.includes(today)) return

      if (!record.reviewSchedule) return

      // 检查是否有今天需要复习的节点
      const hasPendingToday = record.reviewSchedule.some(item =>
        item.status === 'pending' && compareDates(item.plannedDate, today) <= 0
      )

      if (hasPendingToday) {
        // 找到最早过期的节点用于显示
        const earliest = record.reviewSchedule
          .filter(item => item.status === 'pending' && compareDates(item.plannedDate, today) <= 0)
          .sort((a, b) => compareDates(a.plannedDate, b.plannedDate))[0]

        pending.push({
          poemId: record.poemId,
          days: earliest.days,
          plannedDate: earliest.plannedDate
        })
      }
    })

    return pending
  }
}
