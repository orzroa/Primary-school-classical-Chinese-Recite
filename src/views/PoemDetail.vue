<template>
  <div class="container py-4">
    <div class="d-flex align-items-center mb-4">
      <button class="btn me-3" style="background: #2c3e50; color: #fff6e5; border: none; box-shadow: 0 4px 12px rgba(44, 62, 80, 0.15); font-family: 'ZCOOL XiaoWei', serif;" @click="goBack">
        ← 返回
      </button>
      <h4 class="mb-0" style="color: #2c3e50; font-weight: 800; font-family: 'ZCOOL XiaoWei', serif; letter-spacing: 2px;">{{ poem.title }}</h4>
    </div>
    
    <div class="card mb-3" style="animation: fadeInUp 0.6s ease;">
      <div class="card-body" style="padding: 28px;">
        <h5 class="mb-4 text-center" style="color: #785448; font-weight: 700; font-family: 'ZCOOL XiaoWei', serif; letter-spacing: 1px; font-size: 1.25rem;">{{ poem.author }}</h5>
        <div v-if="!hideContent" class="poem-content">
          <div v-for="(line, index) in formattedContent" :key="index" class="poem-line">
            {{ line }}
          </div>
        </div>
        <div v-else class="text-center py-5" style="color: #8c7e6c;">
          <div class="display-4 mb-3" style="animation: pulse 2s infinite;">🙈</div>
          <p style="font-size: 1.15rem; font-weight: 500; font-family: 'Noto Serif SC', serif;">原文已隐藏，请尝试背诵</p>
        </div>
      </div>
    </div>
    
    <div class="row g-2 mb-3" style="animation: fadeInUp 0.6s ease 0.1s both;">
      <div class="col-6">
        <button 
          class="btn w-100"
          :disabled="isTodayLearned"
          @click="markAsLearned"
          :style="isTodayLearned ? 'background: #e5dfd3; color: #8c7e6c;' : 'background: #274a78; color: #fff6e5; box-shadow: 0 4px 15px rgba(39, 74, 120, 0.25);'"
        >
          {{ isTodayLearned ? '今日已学 ✓' : '标记学习' }}
        </button>
      </div>
      <div class="col-6">
        <button 
          class="btn w-100"
          @click="toggleHideContent"
          style="background: transparent; color: #2c3e50; border: 2px solid #2c3e50; box-shadow: 0 4px 12px rgba(44, 62, 80, 0.08);"
        >
          {{ hideContent ? '显示原文' : '隐藏原文' }}
        </button>
      </div>
    </div>
    
    <div class="card mb-3" style="animation: fadeInUp 0.6s ease 0.2s both;">
      <div class="card-header" style="background: #274a78; color: #fff6e5;">
        <h5 class="mb-0"><span class="me-2">📚</span> 过去的学习过程</h5>
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
            <div v-for="(date, index) in record.reviewDates" :key="index" class="ms-4 my-1">
              复习于{{ formatDate(date) }}
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="card" style="animation: fadeInUp 0.6s ease 0.3s both;">
      <div class="card-header" style="background: #4c7d6c; color: #fff6e5;">
        <h5 class="mb-0"><span class="me-2">📅</span> 将来的复习计划</h5>
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
import { getLocalDateStr, formatDateReadable, isToday, isPast } from '../utils/dateUtils'

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
  computed: {
    formattedContent() {
      if (!this.poem || !this.poem.content) return [];
      const lines = this.poem.content.split('\n');
      const result = [];
      lines.forEach(line => {
        const parts = line.split(/(?<=[，。？！；])/g).filter(p => p.trim());
        result.push(...parts);
      });
      return result;
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
      this.$router.back()
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
      return formatDateReadable(dateStr)
    },
    getReviewStatus(date) {
      if (isToday(date)) {
        return '今日'
      } else if (isPast(date)) {
        return '已过'
      } else {
        return '待复习'
      }
    },
    getReviewStatusClass(date) {
      if (isToday(date)) {
        return 'bg-danger'
      } else if (isPast(date)) {
        return 'bg-secondary'
      } else {
        return 'bg-light text-dark'
      }
    }
  }
}
</script>