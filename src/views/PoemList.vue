<template>
  <div class="container py-4">
    <div class="d-flex align-items-center mb-4" style="animation: fadeInDown 0.6s ease;">
      <button class="btn me-3" style="background: #2c3e50; color: #fff6e5; border: none; box-shadow: 0 4px 12px rgba(44, 62, 80, 0.15); font-family: 'ZCOOL XiaoWei', serif;" @click="goBack">
        ← 返回
      </button>
      <h4 class="mb-0" style="color: #2c3e50; font-weight: 800; font-family: 'ZCOOL XiaoWei', serif; letter-spacing: 2px;">{{ getGradeName(grade) }}诗词</h4>
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
              <h5 class="card-title mb-1" style="font-weight: 700; color: #2c3e50; letter-spacing: 0.5px;">
                <span style="color: #b07a3e; font-size: 0.85rem; margin-right: 6px;">第 {{ poem.order }} 首</span>{{ poem.title }}
              </h5>
              <p class="card-text" style="color: #7a8a9a; margin: 0; font-weight: 500;">{{ poem.author }}</p>
            </div>
            <span class="badge" :class="poemBadgeClass(poem.id)">
              {{ poemStatus(poem.id) }}
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
import { eventBus, PERSON_CHANGED, RECORDS_CHANGED } from '../utils/eventBus'

export default {
  name: 'PoemList',
  props: ['grade'],
  data() {
    return {
      poems: poems[this.grade] || [],
      // 用于触发响应式刷新
      refreshKey: 0
    }
  },
  mounted() {
    eventBus.on(PERSON_CHANGED, this.handleRefresh)
    eventBus.on(RECORDS_CHANGED, this.handleRefresh)
  },
  beforeUnmount() {
    eventBus.off(PERSON_CHANGED, this.handleRefresh)
    eventBus.off(RECORDS_CHANGED, this.handleRefresh)
  },
  methods: {
    handleRefresh() {
      this.refreshKey++
    },
    getGradeName(grade) {
      const g = parseInt(grade)
      if (g === 7) return '附加一'
      if (g === 8) return '附加二'
      return g + '年级'
    },
    goBack() {
      this.$router.back()
    },
    goToPoem(poemId) {
      this.$router.push({ name: 'PoemDetail', params: { id: poemId } })
    },
    poemBadgeClass(poemId) {
      // 引用 refreshKey 让模板响应 refresh
      void this.refreshKey
      const record = storage.getPoemRecord(poemId)
      if (!record) return 'bg-secondary'
      if (storage.isReviewedToday(poemId)) return 'bg-success'
      return 'bg-primary'
    },
    poemStatus(poemId) {
      void this.refreshKey
      const record = storage.getPoemRecord(poemId)
      if (!record) return '未学'
      if (storage.isReviewedToday(poemId)) return '已学'
      return '需复习'
    }
  }
}
</script>