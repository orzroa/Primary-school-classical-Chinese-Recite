import { getLocalDateStr, addDays, compareDates } from './dateUtils.js'
import { eventBus, RECORDS_CHANGED } from './eventBus.js'

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
    if (!data) return {}
    try {
      const parsed = JSON.parse(data)
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
    } catch (e) {
      console.error('学习记录读取失败，已保留原始数据：', e)
      return {}
    }
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
    let changed = false

    if (record && (typeof record !== 'object' || Array.isArray(record))) {
      return null
    }

    if (record && !Array.isArray(record.reviewDates)) {
      record.reviewDates = []
      changed = true
    }

    // 旧数据迁移：如果只有 reviewDates，自动生成 reviewSchedule
    if (record && !record.reviewSchedule && record.reviewDates) {
      record = this.migrateRecord(record)
      records[poemId] = record
      changed = true
    }

    if (record) {
      // 兼容旧版“非常熟”：旧实现只截断后续节点，没有记录整首诗的完成状态。
      const masteredItem = record.reviewSchedule?.find(item =>
        item.status === 'mastered' || item.rating === 'mastered'
      )
      const hasPending = record.reviewSchedule?.some(item => item.status === 'pending')
      if (!record.masteredAt && masteredItem && !hasPending) {
        record.masteredAt = masteredItem.actualDate || getLocalDateStr()
        changed = true
      }

      // 修复旧版“有点生”只生成剩余尾段的问题。仅在延期后的节点尚未被
      // 用户继续完成时修复，避免覆盖已经产生的真实历史。
      const schedule = record.reviewSchedule || []
      for (let i = schedule.length - 1; i >= 0; i--) {
        const item = schedule[i]
        if (item.rating !== 'extend' || !item.actualDate) continue

        const tail = schedule.slice(i + 1)
        const tailHasCompleted = tail.some(next => next.status !== 'pending')
        const hasRestartDayOne = tail.some(next =>
          next.status === 'pending' && next.plannedDate === addDays(item.actualDate, 1)
        )

        if (!tailHasCompleted && !hasRestartDayOne) {
          record.reviewSchedule = [
            ...schedule.slice(0, i + 1),
            ...this.initReviewScheduleFrom(item.actualDate)
          ]
          changed = true
        }
        break
      }
    }

    if (changed) {
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
      actualDate: null,
      rating: null
    }))
  },

  // 从给定基准日期生成新的复习计划（用于"有点生"延期）
  initReviewScheduleFrom(baseDate) {
    return REVIEW_INTERVALS.map(days => ({
      days,
      plannedDate: addDays(baseDate, days),
      status: 'pending',
      actualDate: null,
      rating: null
    }))
  },

  // 判断今天是否需要复习（有 pending 且 plannedDate <= 今天）
  needsReviewToday(poemId) {
    const record = this.getPoemRecord(poemId)
    if (!record || !record.reviewSchedule) return false

    const today = getLocalDateStr()

    // 学习当天不算复习
    if (record.firstLearnDate === today) return false

    // 如果全部 5 个节点都已 mastered（已掌握），不再需要复习
    if (this.isMastered(record)) return false

    return record.reviewSchedule.some(item =>
      item.status === 'pending' && compareDates(item.plannedDate, today) <= 0
    )
  },

  // 判断一首诗是否已掌握（所有 5 个节点都已 mastered）
  isMastered(record) {
    if (!record) return false
    if (record.masteredAt) return true
    const schedule = record.reviewSchedule || []
    return !schedule.some(item => item.status === 'pending') && schedule.some(item =>
      item.status === 'mastered' || item.rating === 'mastered'
    )
  },

  getNextPendingReview(poemId) {
    const record = this.getPoemRecord(poemId)
    if (!record || this.isMastered(record)) return null
    return (record.reviewSchedule || [])
      .filter(item => item.status === 'pending')
      .sort((a, b) => compareDates(a.plannedDate, b.plannedDate))[0] || null
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
  // rating: 'mastered' | 'normal' | 'extend' | null（仅复习时使用；null 表示未评级，稍后由 UI 决定）
  addLearningRecord(poemId, rating = null) {
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

      if (record.reviewSchedule) {
        // 找到当前应当复习的节点（最早的过期 pending）
        const currentIdx = record.reviewSchedule.findIndex(
          item => item.status === 'pending' && compareDates(item.plannedDate, today) <= 0
        )

        if (currentIdx >= 0) {
          const currentItem = record.reviewSchedule[currentIdx]
          const isOnTime = today === currentItem.plannedDate

          // 标记当前节点为完成（status 总是 on-time/makeup/mastered，最终态由 rating 决定）
          currentItem.status = isOnTime ? 'on-time' : 'makeup'
          currentItem.actualDate = today
          currentItem.rating = rating  // 可能为 null，等 UI 选

          if (rating === 'mastered') {
            // 非常熟：终止后续所有节点
            currentItem.status = 'mastered'
            record.masteredAt = today
            record.reviewSchedule = record.reviewSchedule.slice(0, currentIdx + 1)
          } else if (rating === 'extend') {
            // 有点生：保留历史，从今天开始完整重启 1/4/8/15/30 天计划。
            delete record.masteredAt
            record.reviewSchedule = [
              ...record.reviewSchedule.slice(0, currentIdx + 1),
              ...this.initReviewScheduleFrom(today)
            ]
          }
          // 'normal' 或 null：保持原计划不变
        } else {
          // 找不到应当复习的节点（理论上不应到这里），全部过期 pending 标记为 makeup
          record.reviewSchedule.forEach(item => {
            if (item.status === 'pending' && compareDates(item.plannedDate, today) <= 0) {
              item.status = today === item.plannedDate ? 'on-time' : 'makeup'
              item.actualDate = today
              item.rating = rating
            }
          })
        }
      }
    }

    this.saveRecords(records)
    return records[poemId]
  },

  // 对今天复习的节点补充评级（独立调用，避免 UI 重复存储）
  rateTodayReview(poemId, rating) {
    const records = this.getRecords()
    const record = records[poemId]
    if (!record || !record.reviewSchedule) return null

    const today = getLocalDateStr()
    const currentIdx = record.reviewSchedule.findIndex(
      item => (item.status === 'on-time' || item.status === 'makeup')
        && item.actualDate === today
    )

    if (currentIdx < 0) return null

    const currentItem = record.reviewSchedule[currentIdx]
    currentItem.rating = rating

    if (rating === 'mastered') {
      currentItem.status = 'mastered'
      record.masteredAt = today
      record.reviewSchedule = record.reviewSchedule.slice(0, currentIdx + 1)
    } else if (rating === 'extend') {
      delete record.masteredAt
      record.reviewSchedule = [
        ...record.reviewSchedule.slice(0, currentIdx + 1),
        ...this.initReviewScheduleFrom(today)
      ]
    }
    // 'normal'：保持原计划

    this.saveRecords(records)
    return record
  },

  // 测验中的自评会同步到复习计划，但不冒充一次计划内复习。
  rateFromQuiz(poemId, rating) {
    const records = this.getRecords()
    const record = records[poemId]
    if (!record) return null

    const today = getLocalDateStr()
    if (!Array.isArray(record.quizRatings)) record.quizRatings = []
    record.quizRatings.unshift({ date: today, rating })

    if (rating === 'mastered') {
      record.masteredAt = today
      record.reviewSchedule = (record.reviewSchedule || []).filter(
        item => item.status !== 'pending'
      )
    } else if (rating === 'extend') {
      delete record.masteredAt
      const completed = (record.reviewSchedule || []).filter(
        item => item.status !== 'pending'
      )
      record.reviewSchedule = [
        ...completed,
        ...this.initReviewScheduleFrom(today)
      ]
    }

    this.saveRecords(records)
    return record
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

      // 已掌握的诗不再显示
      if (this.isMastered(record)) return

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
