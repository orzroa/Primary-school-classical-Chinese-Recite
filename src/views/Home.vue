<template>
  <div class="container py-4">
    <div class="text-center mb-5" style="animation: fadeInDown 0.8s ease;">
      <h1 class="mb-1" style="color: #2c3e50; font-size: 2.5rem; font-weight: 800; font-family: 'ZCOOL XiaoWei', serif; letter-spacing: 4px;">古诗词背诵</h1>
      <p style="color: #785448; font-family: 'Long Cang', cursive; font-size: 1.35rem; margin-top: 5px;">温故而知新，可以为师矣</p>
    </div>
    
    <div class="row g-3 mb-5">
      <div v-for="grade in 6" :key="grade" class="col-4">
        <button 
          class="btn btn-grade"
          :class="'btn-grade-' + grade"
          @click="goToGrade(grade)"
        >
          {{ grade }}年级
        </button>
      </div>
    </div>
    
    <div class="card">
      <div class="card-header" style="background: #c8392f; color: #fff6e5;">
        <h5 class="mb-0"><span class="me-2">🎯</span> 今日待学</h5>
      </div>
      <div class="card-body p-0">
        <div v-if="todayTodos.length === 0" class="text-center py-4 text-muted">
          今天没有任务，休息一下吧 ✨
        </div>
        <div v-else class="list-group list-group-flush">
          <div
            v-for="item in todayTodos"
            :key="item.poemId"
            class="list-group-item poem-card"
            @click="goToPoem(item.poemId)"
          >
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <strong>{{ getPoemTitle(item.poemId) }}</strong>
                <div class="text-muted small">{{ getPoemAuthor(item.poemId) }}</div>
              </div>
              <span class="badge bg-danger">
                今天 · 待复习
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card mt-3">
      <div class="card-header" style="background: #274a78; color: #fff6e5;">
        <h5 class="mb-0"><span class="me-2">📝</span> 过去的学习记录</h5>
      </div>
      <div class="card-body p-0">
        <div v-if="Object.keys(groupedRecords).length === 0" class="text-center py-4 text-muted">
          暂无学习记录
        </div>

        <div v-else>
          <div 
            v-for="(group, date) in groupedRecords" 
            :key="date"
            class="mb-3"
          >
            <div class="bg-light px-3 py-2 border-bottom">
              <strong>{{ date }}</strong>
            </div>
            <div class="list-group list-group-flush">
              <div 
                v-for="record in group" 
                :key="record.poemId"
                class="list-group-item poem-card"
                @click="goToPoem(record.poemId)"
              >
                <div class="d-flex justify-content-between align-items-center">
                  <div>
                    <strong>{{ getPoemTitle(record.poemId) }}</strong>
                    <div class="text-muted small">{{ getPoemAuthor(record.poemId) }}</div>
                  </div>
                  <span class="badge" :class="getRecordBadgeClass(record)">
                    {{ getRecordType(record) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="card mt-3">
      <div class="card-header" style="background: #4c7d6c; color: #fff6e5;">
        <h5 class="mb-0"><span class="me-2">📅</span> 将来的复习计划</h5>
      </div>
      <div class="card-body p-0">
        <div v-if="Object.keys(groupedReviewPlan).length === 0" class="text-center py-4 text-muted">
          暂无复习计划
        </div>
        <div v-else>
          <div
            v-for="group in groupedReviewPlan"
            :key="group.date"
            class="mb-3"
          >
            <div class="bg-light px-3 py-2 border-bottom">
              <strong>{{ group.date }}</strong>
            </div>
            <div class="list-group list-group-flush">
              <div
                v-for="item in group.items"
                :key="item.poemId"
                class="list-group-item poem-card"
                @click="goToPoem(item.poemId)"
              >
                <div class="d-flex justify-content-between align-items-center">
                  <div>
                    <strong>{{ getPoemTitle(item.poemId) }}</strong>
                    <div class="text-muted small">{{ getPoemAuthor(item.poemId) }}</div>
                  </div>
                  <span class="badge bg-secondary">
                    {{ item.days }}天后
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { poems } from '../data/poems'
import { storage } from '../utils/storage'
import { getLocalDateStr, formatDateReadable } from '../utils/dateUtils'

export default {
  name: 'Home',
  data() {
    return {
      poems,
      allRecords: [],
      groupedRecords: {},
      groupedReviewPlan: {},
      todayTodos: []
    }
  },
  mounted() {
    this.loadRecords()
  },
  methods: {
    loadRecords() {
      this.allRecords = storage.getAllRecordsSorted()
      this.groupedRecords = this.groupRecordsByDate()
      this.groupedReviewPlan = this.getReviewPlan()
      this.todayTodos = this.getTodayTodos()
    },
    getTodayTodos() {
      const today = getLocalDateStr()
      const todos = []

      this.allRecords.forEach(record => {
        const schedule = storage.getReviewSchedule(record.poemId)
        schedule.forEach(item => {
          if (item.date === today && !record.reviewDates.includes(today)) {
            todos.push({
              poemId: record.poemId,
              days: item.days
            })
          }
        })
      })

      return todos
    },
    getReviewPlan() {
      const grouped = {}
      const todayStr = getLocalDateStr()

      this.allRecords.forEach(record => {
        const schedule = storage.getReviewSchedule(record.poemId)

        schedule.forEach(item => {
          if (item.date >= todayStr) {
            const isReviewed = record.reviewDates.includes(item.date)
            if (!isReviewed) {
              const date = item.date
              if (!grouped[date]) {
                grouped[date] = []
              }
              grouped[date].push({
                poemId: record.poemId,
                days: item.days
              })
            }
          }
        })
      })

      // 按日期排序，返回有序数组
      const sortedDates = Object.keys(grouped).sort((a, b) => a.localeCompare(b))
      return sortedDates.map(date => ({
        date,
        items: grouped[date]
      }))
    },
    groupRecordsByDate() {
      const grouped = {}

      this.allRecords.forEach(record => {
        const lastDate = record.reviewDates[0] || record.firstLearnDate

        if (!grouped[lastDate]) {
          grouped[lastDate] = []
        }
        grouped[lastDate].push(record)
      })

      return grouped
    },
    goToGrade(grade) {
      this.$router.push({ name: 'PoemList', params: { grade } })
    },
    goToPoem(poemId) {
      this.$router.push({ name: 'PoemDetail', params: { id: poemId } })
    },
    getPoemTitle(poemId) {
      const grade = parseInt(poemId.split('-')[0])
      const poem = this.poems[grade].find(p => p.id === poemId)
      return poem ? poem.title : '未知'
    },
    getPoemAuthor(poemId) {
      const grade = parseInt(poemId.split('-')[0])
      const poem = this.poems[grade].find(p => p.id === poemId)
      return poem ? poem.author : '未知'
    },
    getRecordBadgeClass(record) {
      const lastDate = record.reviewDates[0] || record.firstLearnDate
      if (lastDate === record.firstLearnDate) {
        return 'bg-success'
      } else {
        return 'bg-info'
      }
    },
    getRecordType(record) {
      const lastDate = record.reviewDates[0] || record.firstLearnDate
      if (lastDate === record.firstLearnDate) {
        return '初学'
      } else {
        return '复习'
      }
    },
    formatDate(dateStr) {
      return formatDateReadable(dateStr)
    }
  }
}
</script>