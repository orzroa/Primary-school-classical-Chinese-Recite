import test from 'node:test'
import assert from 'node:assert/strict'
import { storage } from '../src/utils/storage.js'
import { addDays, getLocalDateStr } from '../src/utils/dateUtils.js'

class MemoryStorage {
  constructor() { this.data = new Map() }
  getItem(key) { return this.data.has(key) ? this.data.get(key) : null }
  setItem(key, value) { this.data.set(key, String(value)) }
  removeItem(key) { this.data.delete(key) }
  clear() { this.data.clear() }
}

globalThis.localStorage = new MemoryStorage()

const poemId = '1-1'

function seedRecord(record) {
  localStorage.setItem('poem_current_person', 'self')
  localStorage.setItem('poem_learning_records_self', JSON.stringify({ [poemId]: record }))
}

test.beforeEach(() => localStorage.clear())

test('“有点生”不完成当前阶段，并按本次实际间隔 M 天后重试', () => {
  const today = getLocalDateStr()
  const firstLearnDate = addDays(today, -4)
  const schedule = storage.initReviewSchedule(firstLearnDate)
  schedule[0] = {
    ...schedule[0],
    status: 'on-time',
    actualDate: addDays(today, -3),
    rating: 'normal'
  }
  seedRecord({
    firstLearnDate,
    reviewDates: [addDays(today, -3)],
    reviewSchedule: schedule
  })

  const record = storage.addLearningRecord(poemId, 'extend')
  const currentStage = record.reviewSchedule[1]

  assert.deepEqual(record.reviewSchedule.map(item => item.days), [1, 4, 8, 15, 30])
  assert.equal(currentStage.days, 4)
  assert.equal(currentStage.status, 'pending')
  assert.equal(currentStage.actualDate, null)
  assert.equal(currentStage.plannedDate, addDays(today, 3))
  assert.deepEqual(currentStage.attempts, [
    { date: today, rating: 'extend', intervalDays: 3 }
  ])
})

test('当前阶段重试通过后才推进下一阶段', () => {
  const today = getLocalDateStr()
  const firstLearnDate = addDays(today, -7)
  const schedule = storage.initReviewSchedule(firstLearnDate)
  schedule[0] = {
    ...schedule[0],
    status: 'on-time',
    actualDate: addDays(today, -6),
    rating: 'normal'
  }
  schedule[1] = {
    ...schedule[1],
    plannedDate: today,
    intervalDays: 3,
    attempts: [{ date: addDays(today, -3), rating: 'extend', intervalDays: 3 }]
  }
  seedRecord({
    firstLearnDate,
    reviewDates: [addDays(today, -3), addDays(today, -6)],
    reviewSchedule: schedule
  })

  const record = storage.addLearningRecord(poemId, 'normal')

  assert.equal(record.reviewSchedule[1].status, 'on-time')
  assert.equal(record.reviewSchedule[1].actualDate, today)
  assert.equal(record.reviewSchedule[2].days, 8)
  assert.equal(record.reviewSchedule[2].plannedDate, addDays(today, 4))
})

test('在后续节点选择“非常熟”能正确标记整首诗已掌握', () => {
  const today = getLocalDateStr()
  const firstLearnDate = addDays(today, -4)
  const schedule = storage.initReviewSchedule(firstLearnDate)
  schedule[0] = {
    ...schedule[0],
    status: 'on-time',
    actualDate: addDays(firstLearnDate, 1),
    rating: 'normal'
  }
  seedRecord({ firstLearnDate, reviewDates: [], reviewSchedule: schedule })

  const record = storage.addLearningRecord(poemId, 'mastered')

  assert.equal(record.masteredAt, today)
  assert.equal(storage.isMastered(record), true)
  assert.equal(record.reviewSchedule.some(item => item.status === 'pending'), false)
})

test('自动把旧版错误的“有点生已完成”还原为当前阶段待重试', () => {
  const today = getLocalDateStr()
  const firstLearnDate = addDays(today, -8)
  seedRecord({
    firstLearnDate,
    reviewDates: [today, addDays(today, -4)],
    reviewSchedule: [
      {
        days: 4,
        plannedDate: addDays(today, -4),
        status: 'on-time',
        actualDate: addDays(today, -4),
        rating: 'normal'
      },
      {
        days: 8,
        plannedDate: today,
        status: 'on-time',
        actualDate: today,
        rating: 'extend'
      },
      ...storage.initReviewSchedule(today)
    ]
  })

  const record = storage.getPoemRecord(poemId)
  const currentStage = record.reviewSchedule[1]

  assert.deepEqual(record.reviewSchedule.map(item => item.days), [4, 8, 15, 30])
  assert.equal(currentStage.days, 8)
  assert.equal(currentStage.status, 'pending')
  assert.equal(currentStage.plannedDate, addDays(today, 4))
  assert.deepEqual(currentStage.attempts, [
    { date: today, rating: 'extend', intervalDays: 4 }
  ])
})

test('测验选择“有点生”同样保持当前阶段和实际步长', () => {
  const today = getLocalDateStr()
  const firstLearnDate = addDays(today, -3)
  seedRecord({
    firstLearnDate,
    reviewDates: [],
    reviewSchedule: storage.initReviewSchedule(firstLearnDate)
  })

  const record = storage.rateFromQuiz(poemId, 'extend')
  const currentStage = record.reviewSchedule[0]

  assert.deepEqual(record.reviewDates, [])
  assert.equal(currentStage.days, 1)
  assert.equal(currentStage.status, 'pending')
  assert.equal(currentStage.plannedDate, addDays(today, 3))
  assert.deepEqual(record.quizRatings[0], { date: today, rating: 'extend' })
})

test('已掌握的诗在测验中选择“有点生”后安排 4 天后的巩固复习', () => {
  const today = getLocalDateStr()
  const firstLearnDate = addDays(today, -60)
  seedRecord({
    firstLearnDate,
    firstMasteredAt: addDays(today, -2),
    masteredAt: addDays(today, -2),
    reviewDates: [addDays(today, -2)],
    reviewSchedule: [{
      days: 8,
      plannedDate: addDays(today, -2),
      status: 'mastered',
      actualDate: addDays(today, -2),
      rating: 'mastered'
    }]
  })

  const record = storage.rateFromQuiz(poemId, 'extend')
  const recovery = record.reviewSchedule[0]

  assert.equal(record.masteredAt, undefined)
  assert.equal(record.firstMasteredAt, addDays(today, -2))
  assert.equal(storage.isMastered(record), false)
  assert.equal(recovery.status, 'pending')
  assert.equal(recovery.isRecovery, true)
  assert.equal(recovery.plannedDate, addDays(today, 4))
  assert.equal(recovery.intervalDays, 4)
  assert.deepEqual(recovery.attempts, [
    { date: today, rating: 'extend', intervalDays: 4 }
  ])
  // 曾经掌握的事实保留在完成记录里，星星不会丢失
  assert.deepEqual(record.reviewCompletions, [{
    days: 8,
    plannedDate: addDays(today, -2),
    actualDate: addDays(today, -2),
    status: 'mastered'
  }])

  const rewards = storage.getRewardStats()
  assert.equal(rewards.breakdown.reviews, 3)
  assert.equal(rewards.breakdown.retries, 1)
  assert.equal(rewards.breakdown.mastery, 3)
})

test('巩固复习节点通过后重新掌握整首诗', () => {
  const today = getLocalDateStr()
  const firstLearnDate = addDays(today, -10)
  seedRecord({
    firstLearnDate,
    firstMasteredAt: addDays(today, -4),
    reviewDates: [addDays(today, -4)],
    reviewSchedule: [{
      days: 8,
      intervalDays: 4,
      plannedDate: today,
      status: 'pending',
      actualDate: null,
      rating: null,
      isRecovery: true,
      attempts: [{ date: addDays(today, -4), rating: 'extend', intervalDays: 4 }]
    }]
  })

  // 巩固复习日到了，评“正常”即重新掌握
  const record = storage.addLearningRecord(poemId, 'normal')

  assert.equal(record.masteredAt, today)
  assert.equal(storage.isMastered(record), true)
  assert.equal(record.reviewSchedule.length, 1)
  assert.equal(record.reviewSchedule[0].status, 'on-time')
})

test('巩固复习节点再次“有点生”时保持 4 天节奏重试', () => {
  const today = getLocalDateStr()
  const firstLearnDate = addDays(today, -10)
  seedRecord({
    firstLearnDate,
    firstMasteredAt: addDays(today, -4),
    reviewDates: [addDays(today, -4)],
    quizRatings: [{ date: addDays(today, -4), rating: 'extend' }],
    reviewSchedule: [{
      days: 8,
      intervalDays: 4,
      plannedDate: today,
      status: 'pending',
      actualDate: null,
      rating: null,
      isRecovery: true,
      attempts: [{ date: addDays(today, -4), rating: 'extend', intervalDays: 4 }]
    }]
  })

  const record = storage.addLearningRecord(poemId, 'extend')
  const recovery = record.reviewSchedule[0]

  assert.equal(storage.isMastered(record), false)
  assert.equal(recovery.status, 'pending')
  assert.equal(recovery.plannedDate, addDays(today, 4))
  assert.equal(recovery.attempts.length, 2)
})

test('均衡抽样只从已掌握的诗中抽取，且长期机会均等', () => {
  const today = getLocalDateStr()
  const records = {}

  // 12 首已掌握 + 3 首未掌握（还有 pending 节点）
  for (let index = 1; index <= 15; index++) {
    const mastered = index <= 12
    records[`1-${index}`] = mastered
      ? {
          firstLearnDate: addDays(today, -30),
          firstMasteredAt: addDays(today, -1),
          masteredAt: addDays(today, -1),
          reviewDates: [],
          reviewSchedule: [{
            days: 30,
            plannedDate: addDays(today, -1),
            status: 'mastered',
            actualDate: addDays(today, -1),
            rating: 'mastered'
          }]
        }
      : {
          firstLearnDate: addDays(today, -30),
          reviewDates: [],
          reviewSchedule: storage.initReviewSchedule(addDays(today, -30))
        }
  }
  localStorage.setItem('poem_current_person', 'self')
  localStorage.setItem('poem_learning_records_self', JSON.stringify(records))

  const counts = new Map()
  // 每次抽 3 首，抽 40 次 = 120 人次，12 首诗应各 10 次左右，差距不超过 1
  for (let round = 0; round < 40; round++) {
    const picked = storage.pickMasteredQuizPoems(3)
    assert.equal(picked.length, 3)
    picked.forEach(id => {
      assert.ok(/^1-(?:[1-9]|1[0-2])$/.test(id), `未掌握的诗被抽中: ${id}`)
      counts.set(id, (counts.get(id) || 0) + 1)
    })
  }

  const values = [...counts.values()]
  assert.equal(counts.size, 12)
  assert.ok(Math.max(...values) - Math.min(...values) <= 1, `抽中次数不均衡: ${values}`)
})

test('均衡抽样优先抽测验次数少的诗', () => {
  const today = getLocalDateStr()
  const records = {}

  for (let index = 1; index <= 5; index++) {
    records[`1-${index}`] = {
      firstLearnDate: addDays(today, -30),
      reviewDates: [],
      reviewSchedule: [{
        days: 30,
        plannedDate: addDays(today, -1),
        status: 'mastered',
        actualDate: addDays(today, -1),
        rating: 'mastered'
      }],
      masteredAt: addDays(today, -1),
      firstMasteredAt: addDays(today, -1),
      // 1-1 被抽中过 3 次，其他没被抽过
      quizPicks: index === 1 ? 3 : 0
    }
  }
  localStorage.setItem('poem_current_person', 'self')
  localStorage.setItem('poem_learning_records_self', JSON.stringify(records))

  // 抽 4 首：没被抽过的 4 首优先被抽中，被抽过 3 次的 1-1 落选
  const picked = storage.pickMasteredQuizPoems(4)
  assert.deepEqual(picked.sort(), ['1-2', '1-3', '1-4', '1-5'])

  // 抽中计数被持久化
  const after = JSON.parse(localStorage.getItem('poem_learning_records_self'))
  assert.equal(after['1-2'].quizPicks, 1)
  assert.equal(after['1-1'].quizPicks, 3)
})

test('30 天最后节点评“正常”同样毕业掌握整首诗', () => {
  const today = getLocalDateStr()
  const firstLearnDate = addDays(today, -30)
  const schedule = storage.initReviewSchedule(firstLearnDate)
  // 前 4 个节点都已按时完成
  for (let i = 0; i < 4; i++) {
    schedule[i] = {
      ...schedule[i],
      status: 'on-time',
      actualDate: schedule[i].plannedDate,
      rating: 'normal'
    }
  }
  // 30 天节点今天到期
  schedule[4].plannedDate = today
  seedRecord({ firstLearnDate, reviewDates: [], reviewSchedule: schedule })

  const record = storage.addLearningRecord(poemId, 'normal')

  assert.equal(record.masteredAt, today)
  assert.equal(record.firstMasteredAt, today)
  assert.equal(storage.isMastered(record), true)
  assert.equal(record.reviewSchedule.some(item => item.status === 'pending'), false)
})

test('历史上走完全部计划但从未点“非常熟”的诗也算掌握', () => {
  const today = getLocalDateStr()
  const firstLearnDate = addDays(today, -40)
  // 5 个节点全部评“正常”按时完成，无 masteredAt 字段
  const schedule = storage.initReviewSchedule(firstLearnDate).map(item => ({
    ...item,
    status: 'on-time',
    actualDate: item.plannedDate,
    rating: 'normal'
  }))
  seedRecord({ firstLearnDate, reviewDates: [], reviewSchedule: schedule })

  // 兜底判定为掌握，且能进入均衡抽测池
  assert.equal(storage.isMastered(storage.getPoemRecord(poemId)), true)
  const picked = storage.pickMasteredQuizPoems(1)
  assert.deepEqual(picked, [poemId])

  // 测出“有点生”时按已掌握处理：安排 4 天后巩固复习
  const record = storage.rateFromQuiz(poemId, 'extend')
  assert.equal(record.reviewSchedule[0].isRecovery, true)
  assert.equal(record.reviewSchedule[0].plannedDate, addDays(today, 4))
})

test('未走完全部计划的诗不会被误判为掌握', () => {
  const today = getLocalDateStr()
  const firstLearnDate = addDays(today, -3)
  // 只完成了第 1 天节点（评“正常”），后续还有 pending
  const schedule = storage.initReviewSchedule(firstLearnDate)
  schedule[0] = { ...schedule[0], status: 'on-time', actualDate: schedule[0].plannedDate, rating: 'normal' }
  seedRecord({ firstLearnDate, reviewDates: [], reviewSchedule: schedule })

  assert.equal(storage.isMastered(storage.getPoemRecord(poemId)), false)
})

test('历史全计划毕业的诗以最后节点完成日计入首次掌握星星', () => {
  const today = getLocalDateStr()
  const firstLearnDate = addDays(today, -40)
  const schedule = storage.initReviewSchedule(firstLearnDate).map(item => ({
    ...item,
    status: 'on-time',
    actualDate: item.plannedDate,
    rating: 'normal'
  }))
  seedRecord({ firstLearnDate, reviewDates: [], reviewSchedule: schedule })

  const rewards = storage.getRewardStats()
  // 初学 2 + 按时复习 5 次 ×3 = 15 + 首次掌握 3
  assert.deepEqual(rewards.breakdown, {
    firstLearn: 2,
    reviews: 15,
    retries: 0,
    mastery: 3,
    quizzes: 0
  })
  assert.equal(rewards.totalStars, 20)
})

test('getAllQuizHistory 按日期倒序汇总所有测验记录', () => {
  const today = getLocalDateStr()
  localStorage.setItem('poem_current_person', 'self')
  localStorage.setItem('poem_learning_records_self', JSON.stringify({
    '1-1': {
      firstLearnDate: addDays(today, -3),
      reviewDates: [],
      reviewSchedule: storage.initReviewSchedule(addDays(today, -3)),
      quizRatings: [
        { date: today, rating: 'extend' },
        { date: addDays(today, -1), rating: 'normal' }
      ]
    },
    '1-2': {
      firstLearnDate: addDays(today, -3),
      reviewDates: [],
      reviewSchedule: storage.initReviewSchedule(addDays(today, -3)),
      quizRatings: [
        { date: today, rating: 'mastered' }
      ]
    }
  }))

  const history = storage.getAllQuizHistory()

  assert.deepEqual(history, [
    { poemId: '1-1', date: today, rating: 'extend' },
    { poemId: '1-2', date: today, rating: 'mastered' },
    { poemId: '1-1', date: addDays(today, -1), rating: 'normal' }
  ])
})

test('星星按初学、复习、重试、测验和首次掌握计算', () => {
  const today = getLocalDateStr()
  const firstLearnDate = addDays(today, -2)
  const schedule = storage.initReviewSchedule(firstLearnDate)
  schedule[0] = {
    ...schedule[0],
    status: 'on-time',
    actualDate: addDays(today, -1),
    rating: 'normal'
  }
  schedule[1].attempts = [{ date: today, rating: 'extend', intervalDays: 1 }]

  seedRecord({
    firstLearnDate,
    firstMasteredAt: today,
    masteredAt: today,
    reviewDates: [addDays(today, -1)],
    reviewSchedule: schedule,
    quizRatings: [
      { date: today, rating: 'normal' },
      { date: today, rating: 'mastered' }
    ]
  })

  const rewards = storage.getRewardStats()

  assert.deepEqual(rewards.breakdown, {
    firstLearn: 2,
    reviews: 3,
    retries: 1,
    mastery: 3,
    quizzes: 1
  })
  assert.equal(rewards.totalStars, 10)
  assert.equal(rewards.todayStars, 5)
  assert.equal(rewards.streakDays, 3)
  assert.equal(rewards.title, '诵读新星')
})

test('星星按学习事实计算，并统计连续学习天数', () => {
  const today = getLocalDateStr()
  const dayBeforeYesterday = addDays(today, -2)
  const yesterday = addDays(today, -1)

  localStorage.setItem('poem_current_person', 'self')
  localStorage.setItem('poem_learning_records_self', JSON.stringify({
    '1-1': {
      firstLearnDate: dayBeforeYesterday,
      firstMasteredAt: today,
      masteredAt: today,
      reviewDates: [yesterday],
      reviewSchedule: [{
        days: 1,
        plannedDate: yesterday,
        status: 'on-time',
        actualDate: yesterday,
        rating: 'normal'
      }],
      quizRatings: [
        { date: today, rating: 'mastered' },
        { date: today, rating: 'normal' }
      ]
    },
    '1-2': {
      firstLearnDate: dayBeforeYesterday,
      reviewDates: [today],
      reviewSchedule: [{
        days: 1,
        plannedDate: yesterday,
        status: 'makeup',
        actualDate: today,
        rating: 'normal',
        attempts: [{ date: today, rating: 'extend', intervalDays: 1 }]
      }],
      quizRatings: [{ date: today, rating: 'extend' }]
    }
  }))

  const rewards = storage.getRewardStats()

  assert.deepEqual(rewards.breakdown, {
    firstLearn: 4,
    reviews: 5,
    retries: 1,
    mastery: 3,
    quizzes: 2
  })
  assert.equal(rewards.totalStars, 15)
  assert.equal(rewards.todayStars, 8)
  assert.equal(rewards.streakDays, 3)
  assert.equal(rewards.title, '诵读新星')
})

test('测验星星按同诗同日去重，且每天最多奖励 5 颗', () => {
  const today = getLocalDateStr()
  const records = {}

  for (let index = 1; index <= 6; index++) {
    records[`1-${index}`] = {
      firstLearnDate: today,
      reviewDates: [],
      reviewSchedule: storage.initReviewSchedule(today),
      quizRatings: [
        { date: today, rating: 'normal' },
        { date: today, rating: 'normal' }
      ]
    }
  }

  localStorage.setItem('poem_current_person', 'self')
  localStorage.setItem('poem_learning_records_self', JSON.stringify(records))

  const rewards = storage.getRewardStats()

  assert.equal(rewards.breakdown.quizzes, 5)
  assert.equal(rewards.totalStars, 17)
})
