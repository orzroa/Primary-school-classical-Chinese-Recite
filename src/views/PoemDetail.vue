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
          :disabled="!canMark"
          @click="markAsLearned"
          :style="canMark ? 'background: #274a78; color: #fff6e5; box-shadow: 0 4px 15px rgba(39, 74, 120, 0.25);' : 'background: #e5dfd3; color: #8c7e6c;'"
        >
          {{ buttonText }}
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
        <h5 class="mb-0"><span class="me-2">📚</span> 学习过程</h5>
      </div>
      <div class="card-body">
        <div v-if="!record" class="text-muted text-center py-3">
          暂无学习记录
        </div>
        <div v-else>
          <!-- 初学记录 -->
          <div class="mb-3">
            <span class="badge bg-success me-2">初学</span>
            <span>初学于 {{ formatDate(record.firstLearnDate) }}</span>
          </div>

          <!-- 复习计划状态 -->
          <div v-if="reviewSchedule.length > 0">
            <div class="mb-2">
              <span class="badge bg-info">复习计划</span>
            </div>
            <div
              v-for="(item, index) in reviewSchedule"
              :key="index"
              class="ms-4 my-2 d-flex justify-content-between align-items-center"
            >
              <span>
                第{{ item.days }}天 · {{ formatDate(item.plannedDate) }}
              </span>
              <span class="badge" :class="getStatusBadgeClass(item.status)">
                {{ getStatusText(item) }}
              </span>
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
          <div v-if="futureSchedule.length === 0" class="text-muted text-center py-3">
            所有复习计划已完成 ✓
          </div>
          <div
            v-for="(item, index) in futureSchedule"
            :key="index"
            class="d-flex justify-content-between align-items-center mb-2"
          >
            <span>
              <span class="badge bg-secondary me-2">第{{ item.days }}天</span>
              {{ formatDate(item.plannedDate) }}
            </span>
            <span class="badge bg-primary">
              待复习
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
import { getLocalDateStr, formatDateReadable, isToday, isPast, compareDates } from '../utils/dateUtils'
import { eventBus, PERSON_CHANGED, RECORDS_CHANGED } from '../utils/eventBus'

export default {
  name: 'PoemDetail',
  props: ['id'],
  data() {
    return {
      poem: this.findPoem(),
      record: null,
      hideContent: false,
      reviewSchedule: [],
      futureSchedule: []
    }
  },
  computed: {
    formattedContent() {
      if (!this.poem || !this.poem.content) return [];
      const content = this.poem.content;

      if (content.includes('\n\n')) {
        return content.split('\n\n').filter(p => p.trim()).map(p => p.replace(/\n/g, ''));
      }

      return content.split('\n').filter(line => line.trim());
    },
    // 是否可以点击按钮
    canMark() {
      // 未学习，可以初学
      if (!this.record) return true

      // 学习当天不能复习
      if (this.record.firstLearnDate === getLocalDateStr()) return false

      // 今天还没复习，可以复习
      return storage.needsReviewToday(this.id)
    },
    // 按钮文本
    buttonText() {
      if (!this.record) return '标记初学'

      if (this.record.firstLearnDate === getLocalDateStr()) return '今日已学 ✓'

      if (storage.reviewedToday(this.id)) return '今日已复习 ✓'

      if (storage.needsReviewToday(this.id)) return '今日复习'

      return '复习完成 ✓'
    }
  },
  mounted() {
    this.loadData()
    eventBus.on(PERSON_CHANGED, this.handleRefresh)
    eventBus.on(RECORDS_CHANGED, this.handleRefresh)
  },
  beforeUnmount() {
    eventBus.off(PERSON_CHANGED, this.handleRefresh)
    eventBus.off(RECORDS_CHANGED, this.handleRefresh)
  },
  methods: {
    handleRefresh() {
      this.loadData()
    },
    findPoem() {
      const grade = parseInt(this.id.split('-')[0])
      const poemList = poems[grade]
      return poemList ? poemList.find(p => p.id === this.id) : null
    },
    loadData() {
      this.record = storage.getPoemRecord(this.id)

      if (this.record) {
        this.hideContent = true
        this.reviewSchedule = this.record.reviewSchedule || []
        this.futureSchedule = this.reviewSchedule.filter(
          item => item.status === 'pending' && compareDates(item.plannedDate, getLocalDateStr()) > 0
        )
      }
    },
    goBack() {
      this.$router.back()
    },
    markAsLearned() {
      this.record = storage.addLearningRecord(this.id)
      this.reviewSchedule = this.record.reviewSchedule || []
      this.futureSchedule = this.reviewSchedule.filter(
        item => item.status === 'pending' && compareDates(item.plannedDate, getLocalDateStr()) > 0
      )
    },
    toggleHideContent() {
      this.hideContent = !this.hideContent
    },
    formatDate(dateStr) {
      return formatDateReadable(dateStr)
    },
    getStatusBadgeClass(status) {
      switch (status) {
        case 'on-time':
          return 'bg-success'
        case 'makeup':
          return 'bg-warning'
        case 'pending':
          return 'bg-secondary'
        default:
          return 'bg-secondary'
      }
    },
    getStatusText(item) {
      switch (item.status) {
        case 'on-time':
          return '已按时复习'
        case 'makeup':
          return '已补复习'
        case 'pending':
          if (isToday(item.plannedDate)) {
            return '今日待复习'
          } else if (isPast(item.plannedDate)) {
            return '已过期'
          } else {
            return '待复习'
          }
        default:
          return ''
      }
    }
  }
}
</script>