import test from 'node:test'
import assert from 'node:assert/strict'
import { storage } from '../src/utils/storage.js'
import { addDays, getLocalDateStr } from '../src/utils/dateUtils.js'

class MemoryStorage {
  constructor() {
    this.data = new Map()
  }

  getItem(key) {
    return this.data.has(key) ? this.data.get(key) : null
  }

  setItem(key, value) {
    this.data.set(key, String(value))
  }

  removeItem(key) {
    this.data.delete(key)
  }

  clear() {
    this.data.clear()
  }
}

globalThis.localStorage = new MemoryStorage()

const poemId = '1-1'
const intervals = [1, 4, 8, 15, 30]

function seedRecord(record) {
  localStorage.setItem('poem_current_person', 'self')
  localStorage.setItem('poem_learning_records_self', JSON.stringify({ [poemId]: record }))
}

test.beforeEach(() => {
  localStorage.clear()
})

test('“有点生”会从今天完整重启 1/4/8/15/30 天计划', () => {
  const today = getLocalDateStr()
  const firstLearnDate = addDays(today, -1)
  seedRecord({
    firstLearnDate,
    reviewDates: [],
    reviewSchedule: storage.initReviewSchedule(firstLearnDate)
  })

  const record = storage.addLearningRecord(poemId, 'extend')
  const pending = record.reviewSchedule.filter(item => item.status === 'pending')

  assert.equal(record.reviewSchedule[0].rating, 'extend')
  assert.deepEqual(pending.map(item => item.days), intervals)
  assert.deepEqual(pending.map(item => item.plannedDate), intervals.map(days => addDays(today, days)))
})

test('在后续节点选择“非常熟”也能正确标记整首诗已掌握', () => {
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

test('自动修复旧版“有点生”遗漏明天复习的尾段', () => {
  const today = getLocalDateStr()
  const firstLearnDate = addDays(today, -10)
  seedRecord({
    firstLearnDate,
    reviewDates: [today],
    reviewSchedule: [
      {
        days: 8,
        plannedDate: addDays(firstLearnDate, 8),
        status: 'makeup',
        actualDate: today,
        rating: 'extend'
      },
      ...[15, 30].map(days => ({
        days,
        plannedDate: addDays(today, days),
        status: 'pending',
        actualDate: null,
        rating: null
      }))
    ]
  })

  const record = storage.getPoemRecord(poemId)
  const pending = record.reviewSchedule.filter(item => item.status === 'pending')

  assert.deepEqual(pending.map(item => item.days), intervals)
  assert.equal(pending[0].plannedDate, addDays(today, 1))
})

test('测验选择“有点生”会同步重启计划，但不计作计划内复习', () => {
  const today = getLocalDateStr()
  const firstLearnDate = addDays(today, -2)
  seedRecord({
    firstLearnDate,
    reviewDates: [],
    reviewSchedule: storage.initReviewSchedule(firstLearnDate)
  })

  const record = storage.rateFromQuiz(poemId, 'extend')
  const pending = record.reviewSchedule.filter(item => item.status === 'pending')

  assert.deepEqual(record.reviewDates, [])
  assert.deepEqual(pending.map(item => item.plannedDate), intervals.map(days => addDays(today, days)))
  assert.deepEqual(record.quizRatings[0], { date: today, rating: 'extend' })
})

test('已掌握的诗选择“有点生”后会重新进入复习状态', () => {
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
  assert.equal(storage.getNextPendingReview(poemId).plannedDate, addDays(today, 1))
})
