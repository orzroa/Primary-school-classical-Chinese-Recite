<template>
  <div class="container py-4">
    <div class="d-flex align-items-center mb-4">
      <button class="btn me-3" style="background: #2c3e50; color: #fff6e5; border: none; box-shadow: 0 4px 12px rgba(44, 62, 80, 0.15); font-family: 'ZCOOL XiaoWei', serif;" @click="goBack">
        ← 返回
      </button>
      <h4 class="mb-0" style="color: #2c3e50; font-weight: 800; font-family: 'ZCOOL XiaoWei', serif; letter-spacing: 2px;">{{ poem.title }}</h4>
    </div>

    <div
      class="card mb-3 poem-card-clickable"
      role="button"
      tabindex="0"
      :aria-expanded="!hideContent"
      aria-label="显示或隐藏诗词原文"
      @click="toggleHideContent"
      @keydown.enter="toggleHideContent"
      @keydown.space.prevent="toggleHideContent"
    >
      <div class="card-body" style="padding: 28px;">
        <h5 class="mb-4 text-center" style="color: #785448; font-weight: 700; font-family: 'ZCOOL XiaoWei', serif; letter-spacing: 1px; font-size: 1.25rem;">{{ poem.author }}</h5>
        <div v-if="!hideContent" class="poem-content">
          <div v-for="(line, index) in formattedContent" :key="index" class="poem-line">
            {{ line }}
          </div>
        </div>
        <div v-else class="text-center py-5" style="color: var(--color-muted);">
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
            class="btn w-100 rating-btn rating-retry"
            @click="markAndRate('extend')"
          >
            <div class="rating-icon">🤔</div>
            <div class="rating-title">有点生</div>
            <div class="rating-effect">保持当前步长</div>
          </button>
        </div>
        <div class="col-4">
          <button
            class="btn w-100 rating-btn rating-normal"
            @click="markAndRate('normal')"
          >
            <div class="rating-icon">👍</div>
            <div class="rating-title">正常</div>
            <div class="rating-effect">保持计划</div>
          </button>
        </div>
        <div class="col-4">
          <button
            class="btn w-100 rating-btn rating-mastered"
            @click="markAndRate('mastered')"
          >
            <div class="rating-icon">🌟</div>
            <div class="rating-title">非常熟</div>
            <div class="rating-effect">结束本轮</div>
          </button>
        </div>
      </div>

      <!-- 非复习日只显示有用的状态，不占用空间展示禁用按钮 -->
      <div v-else class="review-status-card">
        <div class="review-status-title">{{ buttonText }}</div>
        <div v-if="nextReview" class="review-status-next">
          下次复习：{{ formatDate(nextReview.plannedDate) }}
        </div>
      </div>

      <div v-if="feedback" class="review-feedback mt-3" role="status">
        <span>{{ feedback }}</span>
        <button v-if="lastRecordSnapshot" class="btn btn-sm undo-btn" @click="undoLastRating">撤销</button>
      </div>
    </div>

    <div class="card mb-3" style="animation: fadeInUp 0.6s ease 0.2s both;">
      <div class="card-header" style="background: #274a78; color: #fff6e5;">
        <h5 class="mb-0"><span class="me-2">📚</span> 复习进度</h5>
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
              class="schedule-row"
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
      futureSchedule: [],
      feedback: '',
      lastRecordSnapshot: null,
      feedbackTimer: null
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
    nextReview() {
      if (!this.record || storage.isMastered(this.record)) return null
      return this.reviewSchedule
        .filter(item => item.status === 'pending')
        .sort((a, b) => compareDates(a.plannedDate, b.plannedDate))[0] || null
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
    if (this.feedbackTimer) clearTimeout(this.feedbackTimer)
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
      this.lastRecordSnapshot = JSON.parse(JSON.stringify(this.record))
      this.record = storage.addLearningRecord(this.id, rating)
      this.reviewSchedule = this.record.reviewSchedule || []
      this.futureSchedule = this.reviewSchedule.filter(
        item => item.status === 'pending' && compareDates(item.plannedDate, getLocalDateStr()) > 0
      )
      this.showRatingFeedback(rating)
    },
    showRatingFeedback(rating) {
      if (rating === 'mastered') {
        this.feedback = '已标记为非常熟，本轮复习已结束。'
      } else if (rating === 'extend') {
        const next = this.nextReview
        const attempt = next?.attempts?.[next.attempts.length - 1]
        this.feedback = next
          ? `当前阶段暂未完成，保持 ${attempt?.intervalDays || next.intervalDays} 天步长，${this.formatDate(next.plannedDate)}重试。`
          : '当前阶段暂未完成，稍后会按当前步长安排重试。'
      } else {
        const next = this.nextReview
        this.feedback = next
          ? `已记录，计划保持不变。下一次是${this.formatDate(next.plannedDate)}。`
          : '已记录，本轮计划已经完成。'
      }

      if (this.feedbackTimer) clearTimeout(this.feedbackTimer)
      this.feedbackTimer = setTimeout(() => {
        this.feedback = ''
        this.lastRecordSnapshot = null
      }, 8000)
    },
    undoLastRating() {
      if (!this.lastRecordSnapshot) return
      const records = storage.getRecords()
      records[this.id] = this.lastRecordSnapshot
      storage.saveRecords(records)
      this.lastRecordSnapshot = null
      this.feedback = '已撤销刚才的评级。'
      this.loadData()
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
          if (item.attempts?.length) {
            const lastAttempt = item.attempts[item.attempts.length - 1]
            return `有点生 · ${lastAttempt.intervalDays}天后重试`
          }
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

.poem-card-clickable:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 2px;
}

.rating-btn {
  min-height: 96px;
  padding: 13px 5px;
  transition: all 0.2s ease;
}

.rating-retry {
  color: #704a1f;
  background: #f6ead8;
  border: 1px solid #d7b77f;
}

.rating-normal {
  color: #fff;
  background: var(--color-brand);
  box-shadow: 0 5px 14px rgba(39, 74, 120, 0.2);
}

.rating-mastered {
  color: var(--color-success-dark);
  background: transparent;
  border: 1px solid var(--color-success);
}

.rating-icon {
  font-size: 1.25rem;
}

.rating-title {
  margin-top: 2px;
  font-size: 0.94rem;
  font-weight: 700;
}

.rating-btn:not(:disabled):hover {
  transform: translateY(-2px);
  filter: brightness(1.1);
}

.rating-btn:not(:disabled):active {
  transform: translateY(0);
}

.rating-effect {
  margin-top: 3px;
  font-size: 0.78rem;
  white-space: nowrap;
}

.schedule-row {
  display: flex;
  min-height: 42px;
  margin-left: 16px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid var(--color-border-subtle);
}

.schedule-row:last-child {
  border-bottom: 0;
}

.review-status-card {
  padding: 16px;
  text-align: center;
  border: 1px solid #ded8cc;
  border-radius: 12px;
  background: #f8f5ee;
}

.review-status-title {
  color: var(--color-success-dark);
  font-weight: 700;
}

.review-status-next {
  margin-top: 4px;
  color: #785448;
  font-size: 0.88rem;
}

.review-feedback {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  color: #315b4d;
  background: #e7f1ec;
  border: 1px solid #b9d2c7;
  border-radius: 10px;
  font-size: 0.9rem;
}

.undo-btn {
  flex: none;
  color: #274a78;
  border: 1px solid #274a78;
  background: transparent;
  padding: 5px 12px;
}

@media (max-width: 380px) {
  .rating-effect {
    font-size: 0.72rem;
    white-space: normal;
    line-height: 1.25;
  }

  .schedule-row {
    margin-left: 0;
    align-items: flex-start;
    flex-direction: column;
    gap: 4px;
    padding: 8px 0;
  }
}
</style>
