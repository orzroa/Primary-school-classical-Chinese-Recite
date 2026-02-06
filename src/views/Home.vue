<template>
  <div class="container py-4">
    <h1 class="text-center mb-4" style="color: white; font-size: 2.2rem; font-weight: 800; text-shadow: 0 4px 20px rgba(0,0,0,0.3); letter-spacing: 2px; animation: fadeInDown 0.8s ease;">📚 古诗词背诵</h1>
    
    <div class="row g-2 mb-4">
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
      <div class="card-header" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
        <h5 class="mb-0">📝 过去的学习记录</h5>
      </div>
      <div class="card-body p-0">
        <div v-if="groupedRecords.length === 0" class="text-center py-4 text-muted">
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
      <div class="card-header" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white;">
        <h5 class="mb-0">📅 将来的复习计划</h5>
      </div>
      <div class="card-body p-0">
        <div v-if="groupedReviewPlan.length === 0" class="text-center py-4 text-muted">
          暂无复习计划
        </div>
        <div v-else>
          <div 
            v-for="(group, date) in groupedReviewPlan" 
            :key="date"
            class="mb-3"
          >
            <div class="bg-light px-3 py-2 border-bottom">
              <strong>{{ date }}</strong>
            </div>
            <div class="list-group list-group-flush">
              <div 
                v-for="item in group" 
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

export default {
  name: 'Home',
  data() {
    return {
      poems,
      allRecords: [],
      groupedRecords: {},
      groupedReviewPlan: {}
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
    },
    getReviewPlan() {
      const grouped = {}
      const today = new Date()
      const todayStr = today.toISOString().split('T')[0]
      
      this.allRecords.forEach(record => {
        const schedule = storage.getReviewSchedule(record.poemId)
        
        schedule.forEach(item => {
          // 只显示未来的复习计划
          if (item.date >= todayStr) {
            // 检查这一天是否已经复习过了
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
      
      return grouped
    },
    groupRecordsByDate() {
      const grouped = {}
      const today = new Date().toISOString().split('T')[0]
      
      this.allRecords.forEach(record => {
        const lastDate = record.reviewDates[0] || record.firstLearnDate
        const date = lastDate
        
        if (!grouped[date]) {
          grouped[date] = []
        }
        grouped[date].push(record)
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
      const date = new Date(dateStr)
      return `${date.getMonth() + 1}月${date.getDate()}日`
    }
  }
}
</script>