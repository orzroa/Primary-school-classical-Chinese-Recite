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
        :style="index < 6 ? { animation: `fadeInUp 0.45s ease ${index * 0.04}s both` } : null"
      >
        <div
          class="card poem-card poem-list-item"
          role="button"
          tabindex="0"
          @click="goToPoem(poem.id)"
          @keydown.enter="goToPoem(poem.id)"
          @keydown.space.prevent="goToPoem(poem.id)"
        >
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <h5 class="card-title mb-1" style="font-weight: 700; color: #2c3e50; letter-spacing: 0.5px;">
                <span style="color: var(--color-warning); font-size: 0.85rem; margin-right: 6px;">第 {{ poem.order }} 首</span>{{ poem.title }}
              </h5>
              <p class="card-text" style="color: var(--color-muted); margin: 0; font-weight: 500;">{{ poem.author }}</p>
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
import { formatDateReadable, getLocalDateStr } from '../utils/dateUtils'
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
      if (storage.isMastered(record)) return 'bg-success'
      if (storage.needsReviewToday(poemId)) return 'bg-danger'
      if (storage.isReviewedToday(poemId)) return 'bg-success'
      return 'bg-primary'
    },
    poemStatus(poemId) {
      void this.refreshKey
      const record = storage.getPoemRecord(poemId)
      if (!record) return '未学'
      if (storage.isMastered(record)) return '已掌握'
      if (record.firstLearnDate === getLocalDateStr()) return '今日已学'
      if (storage.isReviewedToday(poemId)) return '今日已复习'
      if (storage.needsReviewToday(poemId)) return '今日待复习'

      const next = storage.getNextPendingReview(poemId)
      return next ? `${formatDateReadable(next.plannedDate)}复习` : '计划完成'
    }
  }
}
</script>

<style scoped>
.poem-list-item {
  min-height: 72px;
  margin-bottom: 10px;
  padding: 12px 16px;
}

.poem-list-item:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 2px;
}

@media (max-width: 380px) {
  .poem-list-item .badge {
    max-width: 112px;
    white-space: normal;
    line-height: 1.35;
    text-align: center;
  }
}
</style>
