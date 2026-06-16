<template>
  <div class="container py-4">
    <div class="d-flex align-items-center mb-4" style="animation: fadeInDown 0.6s ease;">
      <button class="btn me-3" style="background: #2c3e50; color: #fff6e5; border: none; box-shadow: 0 4px 12px rgba(44, 62, 80, 0.15); font-family: 'ZCOOL XiaoWei', serif;" @click="goBack">
        ← 返回
      </button>
      <h4 class="mb-0" style="color: #2c3e50; font-weight: 800; font-family: 'ZCOOL XiaoWei', serif; letter-spacing: 2px;">{{ grade }}年级诗词</h4>
    </div>
    
    <div class="row g-2">
      <div 
        v-for="(poem, index) in poems" 
        :key="poem.id"
        class="col-12"
        :style="{ animation: `fadeInUp 0.6s ease ${index * 0.05}s both` }"
      >
        <div class="card poem-card" @click="goToPoem(poem.id)" style="padding: 10px 16px;">
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
      this.$router.back()
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