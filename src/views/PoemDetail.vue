<template>
  <div class="container py-4">
    <div class="d-flex align-items-center mb-4">
      <button class="btn me-2" style="background: rgba(255,255,255,0.25); color: white; border: none; backdrop-filter: blur(10px); box-shadow: 0 4px 15px rgba(0,0,0,0.1);" @click="goBack">
        ← 返回
      </button>
      <h4 class="mb-0" style="color: white; font-weight: 800; text-shadow: 0 4px 20px rgba(0,0,0,0.3); letter-spacing: 1px;">{{ poem.title }}</h4>
    </div>
    
    <div class="card mb-3" style="animation: fadeInUp 0.6s ease;">
      <div class="card-body" style="padding: 28px;">
        <h5 class="mb-4" style="color: #667eea; font-weight: 700; letter-spacing: 1px; font-size: 1.1rem;">{{ poem.author }}</h5>
        <div v-if="!hideContent" class="poem-content">
          {{ poem.content }}
        </div>
        <div v-else class="text-center py-5" style="color: #999;">
          <div class="display-4 mb-3" style="animation: pulse 2s infinite;">🙈</div>
          <p style="font-size: 1.15rem; font-weight: 500;">原文已隐藏，请尝试背诵</p>
        </div>
      </div>
    </div>
    
    <div class="row g-2 mb-3" style="animation: fadeInUp 0.6s ease 0.1s both;">
      <div class="col-6">
        <button 
          class="btn w-100"
          :disabled="isTodayLearned"
          @click="markAsLearned"
          :style="isTodayLearned ? 'background: #e0e0e0; color: #999;' : 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);'"
        >
          {{ isTodayLearned ? '今日已学 ✓' : '标记学习' }}
        </button>
      </div>
      <div class="col-6">
        <button 
          class="btn w-100"
          @click="toggleHideContent"
          style="background: rgba(102, 126, 234, 0.12); color: #667eea; border: 2px solid #667eea; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.2);"
        >
          {{ hideContent ? '显示原文' : '隐藏原文' }}
        </button>
      </div>
    </div>
    
    <div class="card mb-3" style="animation: fadeInUp 0.6s ease 0.2s both;">
      <div class="card-header" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white;">
        <h5 class="mb-0">📚 过去的学习过程</h5>
      </div>
      <div class="card-body">
        <div v-if="!record" class="text-muted text-center py-3">
          暂无学习记录
        </div>
        <div v-else>
          <div class="mb-2">
            <span class="badge bg-success me-2">初学</span>
            <span>初学于{{ formatDate(record.firstLearnDate) }}</span>
          </div>
          <div v-if="record.reviewDates.length > 0">
            <div class="mb-2">
              <span class="badge bg-info">复习</span>
            </div>
            <div v-for="(date, index) in record.reviewDates" :key="index" class="ms-4">
              复习于{{ formatDate(date) }}
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="card" style="animation: fadeInUp 0.6s ease 0.3s both;">
      <div class="card-header" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white;">
        <h5 class="mb-0">📅 将来的复习计划</h5>
      </div>
      <div class="card-body">
        <div v-if="!record" class="text-muted text-center py-3">
          请先标记初学，复习计划将在此显示
        </div>
        <div v-else>
          <div 
            v-for="(item, index) in reviewSchedule" 
            :key="index"
            class="d-flex justify-content-between align-items-center mb-2"
          >
            <span>
              <span class="badge bg-secondary me-2">{{ item.days }}天后</span>
              {{ formatDate(item.date) }}
            </span>
            <span 
              class="badge" 
              :class="getReviewStatusClass(item.date)"
            >
              {{ getReviewStatus(item.date) }}
            </span>
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
  name: 'PoemDetail',
  props: ['id'],
  data() {
    return {
      poem: this.findPoem(),
      record: null,
      hideContent: false,
      reviewSchedule: [],
      isTodayLearned: false
    }
  },
  mounted() {
    this.loadData()
  },
  methods: {
    findPoem() {
      const grade = parseInt(this.id.split('-')[0])
      const poemList = poems[grade]
      return poemList ? poemList.find(p => p.id === this.id) : null
    },
    loadData() {
      this.record = storage.getPoemRecord(this.id)
      this.isTodayLearned = storage.isReviewedToday(this.id)
      
      // 如果已经初学过，默认隐藏原文
      if (this.record) {
        this.hideContent = true
      }
      
      this.reviewSchedule = storage.getReviewSchedule(this.id)
    },
    goBack() {
      const grade = parseInt(this.id.split('-')[0])
      this.$router.push({ name: 'PoemList', params: { grade } })
    },
    markAsLearned() {
      this.record = storage.addLearningRecord(this.id)
      this.isTodayLearned = true
      this.reviewSchedule = storage.getReviewSchedule(this.id)
    },
    toggleHideContent() {
      this.hideContent = !this.hideContent
    },
    formatDate(dateStr) {
      const date = new Date(dateStr)
      return `${date.getMonth() + 1}月${date.getDate()}日`
    },
    getReviewStatus(date) {
      const today = new Date().toISOString().split('T')[0]
      const targetDate = new Date(date)
      const todayDate = new Date(today)
      
      if (date === today) {
        return '今日'
      } else if (targetDate < todayDate) {
        return '已过'
      } else {
        return '待复习'
      }
    },
    getReviewStatusClass(date) {
      const today = new Date().toISOString().split('T')[0]
      const targetDate = new Date(date)
      const todayDate = new Date(today)
      
      if (date === today) {
        return 'bg-danger'
      } else if (targetDate < todayDate) {
        return 'bg-secondary'
      } else {
        return 'bg-light text-dark'
      }
    }
  }
}
</script>