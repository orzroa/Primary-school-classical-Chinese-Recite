import { getLocalDateStr, addDays, compareDates, daysBetween } from './dateUtils.js'
import { eventBus, PERSON_CHANGED, RECORDS_CHANGED } from './eventBus.js'

const REVIEW_INTERVALS = [1, 4, 8, 15, 30]
const REVIEW_GAPS = REVIEW_INTERVALS.map((days, index) =>
  index === 0 ? days : days - REVIEW_INTERVALS[index - 1]
)

// 已掌握的诗在测验中发现"有点生"后，安排 N 天后的巩固复习，通过即重新掌握。
export const RECOVERY_INTERVAL_DAYS = 4

// 奖励以学习记录为事实来源，旧数据也能自动得到星星，不需要单独迁移积分。
export const REWARD_RULES = Object.freeze({
  firstLearn: 2,
  onTimeReview: 3,
  makeupReview: 2,
  retry: 1,
  firstMastery: 3,
  quizPerPoemPerDay: 1,
  quizDailyCap: 5,
  dailyGoal: 5
})

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
      // 兼容旧版"非常熟"：旧实现只截断后续节点，没有记录整首诗的完成状态。
      const masteredItem = record.reviewSchedule?.find(item =>
        item.status === 'mastered' || item.rating === 'mastered'
      )
      const hasPending = record.reviewSchedule?.some(item => item.status === 'pending')
      if (!record.masteredAt && masteredItem && !hasPending) {
        record.masteredAt = masteredItem.actualDate || getLocalDateStr()
        changed = true
      }

      // "首次掌握"是永久里程碑。以后测验发现生疏，可以重新复习，但不收回奖励。
      if (!record.firstMasteredAt && (record.masteredAt || masteredItem)) {
        record.firstMasteredAt = record.masteredAt || masteredItem.actualDate || getLocalDateStr()
        changed = true
      }

      // 兼容旧版"有点生"：旧实现错误地把当前阶段标记为完成，并生成了
      // 新计划。若之后尚未完成其他节点，则还原为"当前阶段待重试"。
      const schedule = record.reviewSchedule || []
      for (let i = schedule.length - 1; i >= 0; i--) {
        const item = schedule[i]
        if (item.rating !== 'extend' || !item.actualDate) continue

        const tail = schedule.slice(i + 1)
        const tailHasCompleted = tail.some(next => next.status !== 'pending')

        if (!tailHasCompleted) {
          const previousDate = this.getPreviousPracticeDate(record, item.actualDate)
          const intervalDays = Math.max(1, daysBetween(previousDate, item.actualDate))
          const retryItem = {
            ...item,
            plannedDate: addDays(item.actualDate, intervalDays),
            status: 'pending',
            actualDate: null,
            rating: null,
            intervalDays,
            attempts: [
              ...(item.attempts || []),
              { date: item.actualDate, rating: 'extend', intervalDays }
            ]
          }
          record.reviewSchedule = [
            ...schedule.slice(0, i),
            retryItem,
            ...this.buildPendingTail(item.days, retryItem.plannedDate)
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
    return REVIEW_INTERVALS.map((days, index) => ({
      days,
      intervalDays: REVIEW_GAPS[index],
      plannedDate: addDays(firstLearnDate, days),
      status: 'pending',
      actualDate: null,
      rating: null
    }))
  },

  // 从当前阶段的计划日期继续生成后续阶段。
  buildPendingTail(currentDays, currentPlannedDate) {
    const currentStage = REVIEW_INTERVALS.indexOf(currentDays)
    if (currentStage < 0) return []

    let cursor = currentPlannedDate
    return REVIEW_INTERVALS.slice(currentStage + 1).map((days, offset) => {
      const stageIndex = currentStage + offset + 1
      cursor = addDays(cursor, REVIEW_GAPS[stageIndex])
      return {
        days,
        intervalDays: REVIEW_GAPS[stageIndex],
        plannedDate: cursor,
        status: 'pending',
        actualDate: null,
        rating: null
      }
    })
  },

  getPreviousPracticeDate(record, beforeDate) {
    const dates = [
      record.firstLearnDate,
      ...(record.reviewDates || []),
      ...(record.quizRatings || []).map(item => item.date)
    ].filter(date => date && compareDates(date, beforeDate) < 0)

    return dates.sort((a, b) => compareDates(b, a))[0] || record.firstLearnDate
  },

  keepCurrentStageForRetry(record, currentIdx, attemptDate, previousDate) {
    const currentItem = record.reviewSchedule[currentIdx]
    const intervalDays = Math.max(1, daysBetween(previousDate, attemptDate))
    const retryDate = addDays(attemptDate, intervalDays)

    // 已完成的阶段后来发现生疏时，保留当时确实完成过的事实，避免星星倒退。
    if (currentItem.actualDate && ['on-time', 'makeup', 'mastered'].includes(currentItem.status)) {
      if (!Array.isArray(record.reviewCompletions)) record.reviewCompletions = []
      const completionKey = `${currentItem.days}:${currentItem.actualDate}`
      const alreadySaved = record.reviewCompletions.some(item =>
        `${item.days}:${item.actualDate}` === completionKey
      )
      if (!alreadySaved) {
        record.reviewCompletions.push({
          days: currentItem.days,
          plannedDate: currentItem.plannedDate,
          actualDate: currentItem.actualDate,
          status: currentItem.status
        })
      }
    }

    currentItem.status = 'pending'
    currentItem.actualDate = null
    currentItem.rating = null
    currentItem.intervalDays = intervalDays
    currentItem.plannedDate = retryDate
    currentItem.attempts = [
      ...(currentItem.attempts || []),
      { date: attemptDate, rating: 'extend', intervalDays }
    ]
    delete record.masteredAt

    record.reviewSchedule = [
      ...record.reviewSchedule.slice(0, currentIdx + 1),
      ...this.buildPendingTail(currentItem.days, retryDate)
    ]
  },

  completeCurrentStage(record, currentIdx, completedDate, rating, isOnTime) {
    const currentItem = record.reviewSchedule[currentIdx]
    currentItem.status = rating === 'mastered'
      ? 'mastered'
      : (isOnTime ? 'on-time' : 'makeup')
    currentItem.actualDate = completedDate
    currentItem.rating = rating

    // 巩固复习节点通过（正常/非常熟）即重新掌握整首诗；
    // 走完全部间隔计划（完成最后一个 30 天节点）同样毕业掌握，无需点“非常熟”。
    const isLastStage = currentItem.days === REVIEW_INTERVALS[REVIEW_INTERVALS.length - 1]
    if (rating === 'mastered' || currentItem.isRecovery || isLastStage) {
      if (!record.firstMasteredAt) record.firstMasteredAt = completedDate
      record.masteredAt = completedDate
      record.reviewSchedule = record.reviewSchedule.slice(0, currentIdx + 1)
      return
    }

    // 当前阶段通过后，才从实际完成日开始推进下一阶段。
    record.reviewSchedule = [
      ...record.reviewSchedule.slice(0, currentIdx + 1),
      ...this.buildPendingTail(currentItem.days, completedDate)
    ]
  },

  // 已掌握的诗在测验中发现"有点生"：保留历史完成事实，降级为待巩固状态，
  // 安排 RECOVERY_INTERVAL_DAYS 天后的巩固复习，通过即重新掌握。
  scheduleRecovery(record, today) {
    const schedule = record.reviewSchedule || []

    if (!Array.isArray(record.reviewCompletions)) record.reviewCompletions = []
    schedule.forEach(item => {
      if (!item.actualDate || !['on-time', 'makeup', 'mastered'].includes(item.status)) return
      const completionKey = `${item.days}:${item.actualDate}`
      const alreadySaved = record.reviewCompletions.some(c =>
        `${c.days}:${c.actualDate}` === completionKey
      )
      if (!alreadySaved) {
        record.reviewCompletions.push({
          days: item.days,
          plannedDate: item.plannedDate,
          actualDate: item.actualDate,
          status: item.status
        })
      }
    })

    const lastDays = schedule.length
      ? schedule[schedule.length - 1].days
      : REVIEW_INTERVALS[REVIEW_INTERVALS.length - 1]

    delete record.masteredAt
    record.reviewSchedule = [{
      days: lastDays,
      intervalDays: RECOVERY_INTERVAL_DAYS,
      plannedDate: addDays(today, RECOVERY_INTERVAL_DAYS),
      status: 'pending',
      actualDate: null,
      rating: null,
      isRecovery: true,
      attempts: [{ date: today, rating: 'extend', intervalDays: RECOVERY_INTERVAL_DAYS }]
    }]
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

  // 判断一首诗是否已掌握：任一节点评过“非常熟”、或走完全部间隔计划（30 天节点完成）。
  // 兼容历史上全部评“正常”走完 30 天的诗，它们同样算毕业掌握。
  isMastered(record) {
    if (!record) return false
    if (record.masteredAt) return true
    const schedule = record.reviewSchedule || []
    if (schedule.some(item => item.status === 'pending')) return false
    if (schedule.some(item => item.status === 'mastered' || item.rating === 'mastered')) return true
    const lastItem = schedule[schedule.length - 1]
    return !!lastItem
      && lastItem.days === REVIEW_INTERVALS[REVIEW_INTERVALS.length - 1]
      && !!lastItem.actualDate
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

      const previousPracticeDate = this.getPreviousPracticeDate(record, today)

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

          if (rating === 'extend') {
            // 有点生：记录一次尝试，但当前阶段不完成，按本次间隔 M 天后重试。
            this.keepCurrentStageForRetry(record, currentIdx, today, previousPracticeDate)
          } else {
            this.completeCurrentStage(record, currentIdx, today, rating, isOnTime)
          }
        } else {
          // 没有到期节点时不制造一条无法归属的计划内复习记录。
          record.reviewDates.shift()
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
    let currentIdx = record.reviewSchedule.findIndex(
      item => (item.status === 'on-time' || item.status === 'makeup')
        && item.actualDate === today
    )

    if (currentIdx < 0) {
      currentIdx = record.reviewSchedule.findIndex(item =>
        item.status === 'pending' && item.attempts?.some(attempt => attempt.date === today)
      )
    }

    if (currentIdx < 0) return null

    const currentItem = record.reviewSchedule[currentIdx]
    if (rating === 'extend') {
      if (!currentItem.attempts?.some(attempt => attempt.date === today)) {
        const previousDate = this.getPreviousPracticeDate(record, today)
        this.keepCurrentStageForRetry(record, currentIdx, today, previousDate)
      }
    } else {
      this.completeCurrentStage(
        record,
        currentIdx,
        today,
        rating,
        currentItem.plannedDate === today
      )
    }

    this.saveRecords(records)
    return record
  },

  // 测验中的自评会同步到复习计划，但不冒充一次计划内复习。
  // 非常熟=确认掌握；正常=维持现状；有点生=已掌握诗安排巩固复习，未掌握诗保留当前阶段按实际间隔重试。
  rateFromQuiz(poemId, rating) {
    const records = this.getRecords()
    const record = records[poemId]
    if (!record) return null

    const today = getLocalDateStr()
    if (!record.firstMasteredAt && this.isMastered(record)) {
      record.firstMasteredAt = record.masteredAt || today
    }
    if (!Array.isArray(record.quizRatings)) record.quizRatings = []
    record.quizRatings.unshift({ date: today, rating })

    const wasMastered = this.isMastered(record)

    if (rating === 'mastered') {
      if (!record.firstMasteredAt) record.firstMasteredAt = today
      record.masteredAt = today
      record.reviewSchedule = (record.reviewSchedule || []).filter(
        item => item.status !== 'pending'
      )
    } else if (rating === 'extend') {
      if (wasMastered) {
        // 已掌握后发现生疏：降级并安排巩固复习，通过后重新掌握。
        this.scheduleRecovery(record, today)
      } else {
        // 未掌握：保留当前阶段不完成，按本次实际间隔 M 天后重试。
        const currentIdx = (record.reviewSchedule || []).findIndex(item => item.status === 'pending')
        if (currentIdx >= 0) {
          const previousPracticeDate = this.getPreviousPracticeDate(record, today)
          this.keepCurrentStageForRetry(record, currentIdx, today, previousPracticeDate)
        }
      }
    }

    this.saveRecords(records)
    return record
  },

  // 星星只奖励可验证的学习行为；测验按"同一首诗同一天一次"去重并设置每日上限。
  getRewardStats() {
    const today = getLocalDateStr()
    const records = this.getAllRecordsSorted()
    const activityDates = new Set()
    const quizPoemsByDate = new Map()
    const starsByDate = new Map()
    const breakdown = {
      firstLearn: 0,
      reviews: 0,
      retries: 0,
      mastery: 0,
      quizzes: 0
    }

    const addStars = (date, amount) => {
      if (!date || !amount) return
      starsByDate.set(date, (starsByDate.get(date) || 0) + amount)
    }

    records.forEach(record => {
      if (record.firstLearnDate) {
        activityDates.add(record.firstLearnDate)
        breakdown.firstLearn += REWARD_RULES.firstLearn
        addStars(record.firstLearnDate, REWARD_RULES.firstLearn)
      }

      ;(record.reviewSchedule || []).forEach(item => {
        if (item.actualDate && ['on-time', 'makeup', 'mastered'].includes(item.status)) {
          const onTime = item.actualDate === item.plannedDate
          const points = onTime ? REWARD_RULES.onTimeReview : REWARD_RULES.makeupReview
          activityDates.add(item.actualDate)
          breakdown.reviews += points
          addStars(item.actualDate, points)
        }

        ;(item.attempts || []).forEach(attempt => {
          if (!attempt.date) return
          activityDates.add(attempt.date)
          breakdown.retries += REWARD_RULES.retry
          addStars(attempt.date, REWARD_RULES.retry)
        })
      })

      ;(record.reviewCompletions || []).forEach(item => {
        if (!item.actualDate) return
        const onTime = item.actualDate === item.plannedDate
        const points = onTime ? REWARD_RULES.onTimeReview : REWARD_RULES.makeupReview
        activityDates.add(item.actualDate)
        breakdown.reviews += points
        addStars(item.actualDate, points)
      })

      ;(record.quizRatings || []).forEach(rating => {
        if (!rating.date) return
        activityDates.add(rating.date)
        if (!quizPoemsByDate.has(rating.date)) quizPoemsByDate.set(rating.date, new Set())
        quizPoemsByDate.get(rating.date).add(record.poemId)
      })

      const masteredDate = record.firstMasteredAt
        || record.masteredAt
        || (record.reviewSchedule || []).find(item =>
          item.status === 'mastered' || item.rating === 'mastered'
        )?.actualDate
        || (record.quizRatings || []).find(item => item.rating === 'mastered')?.date
        // 历史上走完全部计划（30 天节点完成）的诗，以最后节点完成日为首次掌握日
        || (this.isMastered(record)
          ? (record.reviewSchedule || [])[(record.reviewSchedule || []).length - 1]?.actualDate
          : undefined)

      if (masteredDate) {
        breakdown.mastery += REWARD_RULES.firstMastery
        addStars(masteredDate, REWARD_RULES.firstMastery)
      }
    })

    quizPoemsByDate.forEach((poemIds, date) => {
      const points = Math.min(poemIds.size, REWARD_RULES.quizDailyCap)
        * REWARD_RULES.quizPerPoemPerDay
      breakdown.quizzes += points
      addStars(date, points)
    })

    const totalStars = Object.values(breakdown).reduce((sum, value) => sum + value, 0)
    const todayStars = starsByDate.get(today) || 0
    let streakDays = 0
    let cursor = activityDates.has(today) ? today : addDays(today, -1)
    while (activityDates.has(cursor)) {
      streakDays++
      cursor = addDays(cursor, -1)
    }

    const title = totalStars >= 100
      ? '诗词小博士'
      : totalStars >= 60
        ? '诗词达人'
        : totalStars >= 30
          ? '背诗能手'
          : totalStars >= 10
            ? '诵读新星'
            : '小小诗芽'
    const nextMilestone = (Math.floor(totalStars / 10) + 1) * 10

    return {
      totalStars,
      todayStars,
      dailyGoal: REWARD_RULES.dailyGoal,
      streakDays,
      title,
      nextMilestone,
      milestoneProgress: totalStars % 10,
      breakdown
    }
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

        ;(item.attempts || []).forEach(attempt => {
          history.push({
            poemId: record.poemId,
            firstLearnDate: record.firstLearnDate,
            days: item.days,
            plannedDate: attempt.date,
            actualDate: attempt.date,
            status: 'retry',
            rating: attempt.rating,
            intervalDays: attempt.intervalDays
          })
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
  },

  // 从已掌握的诗词中均衡抽取 count 首：优先抽被抽中次数最少的，同次数的随机。
  // 抽中即持久化计数（quizPicks），与是否完成作答无关，长期机会严格均等。
  pickMasteredQuizPoems(count) {
    const records = this.getRecords()
    const pool = Object.keys(records)
      .filter(poemId => this.isMastered(records[poemId]))
      .map(poemId => ({
        poemId,
        pickCount: records[poemId].quizPicks || 0
      }))

    // 先洗牌再按次数稳定排序：同次数的保持随机顺序，次数少的优先被抽中。
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[pool[i], pool[j]] = [pool[j], pool[i]]
    }
    pool.sort((a, b) => a.pickCount - b.pickCount)

    const picked = pool.slice(0, count)
    picked.forEach(item => {
      const record = records[item.poemId]
      record.quizPicks = (record.quizPicks || 0) + 1
    })
    if (picked.length > 0) this.saveRecords(records)

    return picked.map(item => item.poemId)
  },

  // 获取所有测验记录（按日期倒序），用于首页展示
  getAllQuizHistory() {
    const history = []

    this.getAllRecordsSorted().forEach(record => {
      ;(record.quizRatings || []).forEach(item => {
        if (!item.date) return
        history.push({
          poemId: record.poemId,
          date: item.date,
          rating: item.rating
        })
      })
    })

    return history.sort((a, b) => compareDates(b.date, a.date))
  }
}
