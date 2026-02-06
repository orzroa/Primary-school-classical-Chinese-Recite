<template>
  <div class="container py-4">
    <div class="d-flex align-items-center mb-4" style="animation: fadeInDown 0.6s ease;">
      <button class="btn me-2" style="background: rgba(255,255,255,0.25); color: white; border: none; backdrop-filter: blur(10px); box-shadow: 0 4px 15px rgba(0,0,0,0.1);" @click="goBack">
        ← 返回
      </button>
      <h4 class="mb-0" style="color: white; font-weight: 800; text-shadow: 0 4px 20px rgba(0,0,0,0.3); letter-spacing: 1px;">{{ grade }}年级诗词</h4>
    </div>
    
    <div class="row g">
      <div 
        v-for="(poem, index) in poems" 
        :key="poem.id"
        class="col-12"
        :style="{ animation: `fadeInUp 0.6s ease ${index * 0.05}s both` }"
      >
        <div class="card poem-card" @click="goToPoem(poem.id)" style="padding: 14px 20px;">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <h5 class="card-title mb-1" style="font-weight: 700; color: #2c3e50; letter-spacing: 0.5px;">{{ poem.title }}</h5>
              <p class="card-text" style="color: #7a8a9a; margin: 0; font-weight: 500;">{{ poem.author }}</p>
            </div>
            <span class="badge" :class="getPoemBadgeClass(poem.id)">
              {{ getPoemStatus(poem.id) }}
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
  name: 'PoemList',
  props: ['grade'],
  data() {
    return {
      poems: poems[this.grade] || []
    }
  },
  methods: {
    goBack() {
      this.$router.push({ name: 'Home' })
    },
    goToPoem(poemId) {
      this.$router.push({ name: 'PoemDetail', params: { id: poemId } })
    },
    getPoemBadgeClass(poemId) {
      const record = storage.getPoemRecord(poemId)
      if (!record) {
        return 'bg-secondary'
      }
      if (storage.isReviewedToday(poemId)) {
        return 'bg-success'
      }
      return 'bg-primary'
    },
    getPoemStatus(poemId) {
      const record = storage.getPoemRecord(poemId)
      if (!record) {
        return '未学'
      }
      if (storage.isReviewedToday(poemId)) {
        return '已学'
      }
      return '需复习'
    }
  }
}
</script>