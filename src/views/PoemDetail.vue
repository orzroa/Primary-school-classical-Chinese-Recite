<template>
  <div class="container py-4">
    <div class="d-flex align-items-center mb-4">
      <button class="btn me-3" style="background: #2c3e50; color: #fff6e5; border: none; box-shadow: 0 4px 12px rgba(44, 62, 80, 0.15); font-family: 'ZCOOL XiaoWei', serif;" @click="goBack">
        ← 返回
      </button>
      <h4 class="mb-0" style="color: #2c3e50; font-weight: 800; font-family: 'ZCOOL XiaoWei', serif; letter-spacing: 2px;">{{ poem.title }}</h4>
    </div>

    <div class="card mb-3 poem-card-clickable" style="animation: fadeInUp 0.6s ease;" @click="toggleHideContent">
      <div class="card-body" style="padding: 28px;">
        <h5 class="mb-4 text-center" style="color: #785448; font-weight: 700; font-family: 'ZCOOL XiaoWei', serif; letter-spacing: 1px; font-size: 1.25rem;">{{ poem.author }}</h5>
        <div v-if="!hideContent" class="poem-content">
          <div v-for="(line, index) in formattedContent" :key="index" class="poem-line">
            {{ line }}
          </div>
        </div>
        <div v-else class="text-center py-5" style="color: #8c7e6c;">
          <div class="display-4 mb-3" style="animation: pulse 2s infinite;">🙈</div>
          <p style="font-size: 1.15rem; font-weight: 500; font-family: 'Noto Serif SC', serif;">点击任意位置显示原文</p>
        </div>
      </div>
    </div>

    <!-- 操作按钮区：未学习=标记初学单按钮；可复习=三选项；其他=三选项禁用+状态文字 -->
    <div class="mb-3" style="animation: fadeInUp 0.6s ease 0.1s both;">
      <!-- 未学习 - 单按钮 -->
      <div v-if="!record" class="row g-2">
        <div class="col-12">
          <button
            class="btn w-100"
            @click="markAsLearned"
            style="background: #274a78; color: #fff6e5; padding: 14px; box-shadow: 0 4px 15px rgba(39, 74, 120, 0.25); font-weight: 700; font-size: 1.05rem; letter-spacing: 2px;"
          >
            ✏️ 标记初学
          </button>
        </div>
      </div>

      <!-- 可复习 - 三选项可点 -->
      <div v-else-if="canReview" class="row g-2">
        <div class="col-12 mb-2">
          <div class="text-center text-muted" style="font-size: 0.85rem;">
            ✨ 复习完成后，请选择熟悉程度
          </div>
        </div>
        <div class="col-4">
          <button
            class="btn w-100 rating-btn"
            style="background: #6c757d; color: #fff6e5; padding: 14px 6px;"
            @click="markAndRate('mastered')"
          >
            <div style="font-size: 1.4rem; font-weight: 800;">🌟</div>
            <div style="font-size: 0.95rem; font-weight: 700;">非常熟</div>
            <div style="font-size: 0.7rem; opacity: 0.9;">终止复习</div>
          </button>
        </div>
        <div class="col-4">
          <button
            class="btn w-100 rating-btn"
            style="background: #4c7d6c; color: #fff6e5; padding: 14px 6px;"
            @click="markAndRate('normal')"
          >
            <div style="font-size: 1.4rem; font-weight: 800;">👍</div>
            <div style="font-size: 0.95rem; font-weight: 700;">正常</div>
            <div style="font-size: 0.7rem; opacity: 0.9;">按计划走</div>
          </button>
        </div>
        <div class="col-4">
          <button
            class="btn w-100 rating-btn"
            style="background: #b07a3e; color: #fff6e5; padding: 14px 6px;"
            @click="markAndRate('extend')"
          >
            <div style="font-size: 1.4rem; font-weight: 800;">🤔</div>
            <div style="font-size: 0.95rem; font-weight: 700;">有点生</div>
            <div style="font-size: 0.7rem; opacity: 0.9;">延期复习</div>
          </button>
        </div>
      </div>

      <!-- 已复习 / 已掌握 / 今日已学 - 三选项禁用+显示状态 -->
      <div v-else class="row g-2">
        <div class="col-12 mb-2">
          <div class="text-center" style="font-size: 0.95rem; color: #4c7d6c; font-weight: 700;">
            {{ buttonText }}
          </div>
        </div>
        <div class="col-4">
          <button class="btn w-100 rating-btn" disabled style="background: #e5dfd3; color: #8c7e6c; padding: 14px 6px;">
            <div style="font-size: 1.4rem; font-weight: 800;">🌟</div>
            <div style="font-size: 0.95rem; font-weight: 700;">非常熟</div>
          </button>
        </div>
        <div class="col-4">
          <button class="btn w-100 rating-btn" disabled style="background: #e5dfd3; color: #8c7e6c; padding: 14px 6px;">
            <div style="font-size: 1.4rem; font-weight: 800;">👍</div>
            <div style="font-size: 0.95rem; font-weight: 700;">正常</div>
          </button>
        </div>
        <div class="col-4">
          <button class="btn w-100 rating-btn" disabled style="background: #e5dfd3; color: #8c7e6c; padding: 14px 6px;">
            <div style="font-size: 1.4rem; font-weight: 800;">🤔</div>
            <div style="font-size: 0.95rem; font-weight: 700;">有点生</div>
          </button>
        </div>
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
              <span class="badge" :class="getStatusBadgeClass(item)">
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
import { getLocalDateStr, formatDateReadable, isToday, isPast, compareDates, addDays } from '../utils/dateUtils'
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
    // 是否可以点击"今日复习"按钮
    canReview() {
      if (!this.record) return false
      // 学习当天不能复习
      if (this.record.firstLearnDate === getLocalDateStr()) return false
      // 今天已复习过
      if (storage.reviewedToday(this.id)) return false
      // 已掌握
      if (storage.isMastered(this.record)) return false
      // 今天有待复习节点
      return storage.needsReviewToday(this.id)
    },
    // 按钮文本（用于禁用状态）
    buttonText() {
      if (!this.record) return '标记初学'

      if (this.record.firstLearnDate === getLocalDateStr()) return '今日已学 ✓'

      if (storage.isMastered(this.record)) return '已掌握 ✓'

      if (storage.reviewedToday(this.id)) return '今日已复习 ✓'

      if (storage.needsReviewToday(this.id)) return '今日复习'

      return '复习完成 ✓'
    },
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
        // 已学过的诗默认隐藏内容（让用户先尝试背诵）
        this.hideContent = true
        this.reviewSchedule = this.record.reviewSchedule || []
        this.futureSchedule = this.reviewSchedule.filter(
          item => item.status === 'pending' && compareDates(item.plannedDate, getLocalDateStr()) > 0
        )
      } else {
        // 未学过的诗默认显示原文
        this.hideContent = false
      }
    },
    goBack() {
      this.$router.back()
    },
    markAsLearned() {
      // 初学：直接标记，不评级
      this.record = storage.addLearningRecord(this.id)
      this.reviewSchedule = this.record.reviewSchedule || []
      this.futureSchedule = this.reviewSchedule.filter(
        item => item.status === 'pending' && compareDates(item.plannedDate, getLocalDateStr()) > 0
      )
      this.hideContent = true
    },
    markAndRate(rating) {
      // 复习 + 评级：atomic 一步完成
      this.record = storage.addLearningRecord(this.id, rating)
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
    getStatusBadgeClass(item) {
      switch (item.status) {
        case 'mastered':
          return 'bg-secondary'
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
        case 'mastered':
          return '已掌握 🌟'
        case 'on-time':
          if (item.rating === 'extend') return '已延期复习'
          return '已按时复习'
        case 'makeup':
          if (item.rating === 'extend') return '已延期复习'
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

<style scoped>
.poem-card-clickable {
  cursor: pointer;
  transition: transform 0.2s ease;
  user-select: none;
}

.poem-card-clickable:active {
  transform: scale(0.99);
}

.rating-btn {
  transition: all 0.2s ease;
}

.rating-btn:not(:disabled):hover {
  transform: translateY(-2px);
  filter: brightness(1.1);
}

.rating-btn:not(:disabled):active {
  transform: translateY(0);
}
</style>