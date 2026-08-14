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

test('已掌握的诗在测验中选择“有点生”后重新打开最后阶段', () => {
  const today = getLocalDateStr()
  const firstLearnDate = addDays(today, -10)
  seedRecord({
    firstLearnDate,
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

  assert.equal(record.masteredAt, undefined)
  assert.equal(storage.isMastered(record), false)
  assert.equal(storage.getNextPendingReview(poemId).plannedDate, addDays(today, 2))
})
