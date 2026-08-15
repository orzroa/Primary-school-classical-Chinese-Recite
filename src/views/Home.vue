<template>
  <div class="container py-4">
    <header class="app-hero text-center">
      <h1 class="app-title">古诗词背诵</h1>
      <p class="app-subtitle">温故而知新，可以为师矣</p>
      <div class="d-flex justify-content-center align-items-center mt-3" style="gap: 10px; flex-wrap: wrap;">
        <div class="person-switcher">
          <span style="color: #785448; font-size: 0.85rem; margin-right: 6px;">当前：</span>
          <button
            v-for="p in persons"
            :key="p.id"
            class="btn btn-sm person-chip"
            :class="{ active: p.id === currentPersonId }"
            :aria-pressed="p.id === currentPersonId"
            @click.stop="switchPerson(p.id)"
          >
            {{ p.name }}
          </button>
        </div>
        <button class="btn btn-sm" style="background: #f6f3eb; color: #785448; border: 1px solid #785448; font-size: 0.85rem;" @click="goToSettings">
          ⚙️ 设置
        </button>
      </div>
    </header>

    <!-- 今日待复习 -->
    <div class="card today-card" :class="{ 'is-clear': todayPending.length === 0 }">
      <button
        type="button"
        class="card-header collapsible-header"
        :aria-expanded="!collapsed.today"
        @click="toggleCollapse('today')"
      >
        <h5 class="mb-0 d-flex justify-content-between align-items-center">
          <span><span class="me-2">🎯</span> 今日待复习 <span class="header-count">{{ todayPending.length }}</span></span>
          <span class="collapse-icon">{{ collapsed.today ? '▼' : '▲' }}</span>
        </h5>
      </button>
      <div class="card-body p-0 collapse-body" :class="{ 'collapsed': collapsed.today }">
        <div v-if="todayPending.length === 0" class="empty-state">
          <span class="empty-state-icon">✓</span>
          <strong>今日任务已完成</strong>
          <span>可以自由学习新诗，或者来一组轻量测验。</span>
        </div>
        <div v-else>
          <div class="today-summary">
            <div>
              <strong>今天有 {{ todayPending.length }} 首待复习</strong>
              <span>预计 {{ Math.max(2, Math.ceil(todayPending.length * 0.8)) }} 分钟</span>
            </div>
            <button class="btn primary-action" @click.stop="startTodayReview">开始复习</button>
          </div>
          <div class="list-group list-group-flush">
          <div
            v-for="item in todayPending"
            :key="item.poemId + '-' + item.days"
            class="list-group-item poem-card"
            role="button"
            tabindex="0"
            @click="goToPoem(item.poemId)"
            @keydown.enter="goToPoem(item.poemId)"
            @keydown.space.prevent="goToPoem(item.poemId)"
          >
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <strong>{{ getPoemTitle(item.poemId) }}</strong>
                <div class="text-muted small">{{ getPoemAuthor(item.poemId) }}</div>
              </div>
              <span class="badge bg-danger">
                第{{ item.days }}天 · 待复习
              </span>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>

    <div class="section-heading">
      <div>
        <h2>按年级学习</h2>
        <p>选择课本范围，学习或查看进度</p>
      </div>
    </div>
    <div class="row g-2 mb-3">
      <div v-for="grade in 8" :key="grade" class="col-6">
        <button
          class="btn btn-grade"
          @click="goToGrade(grade)"
        >
          <span>{{ getGradeName(grade) }}</span>
          <small>{{ getGradePoemCount(grade) }} 首</small>
        </button>
      </div>
    </div>

    <div class="text-center mb-4">
      <button
        class="btn secondary-action"
        @click="goToQuiz"
      >
        📝 开始专项测验
      </button>
    </div>

    <!-- 学习记录（过去和今天的复习计划） -->
    <div class="card mt-3">
      <button
        type="button"
        class="card-header collapsible-header history-header"
        :aria-expanded="!collapsed.history"
        @click="toggleCollapse('history')"
      >
        <h5 class="mb-0 d-flex justify-content-between align-items-center">
          <span><span class="me-2">📝</span> 学习记录（过去）</span>
          <span class="collapse-icon">{{ collapsed.history ? '▼' : '▲' }}</span>
        </h5>
      </button>
      <div class="card-body p-0 collapse-body" :class="{ 'collapsed': collapsed.history }">
        <div v-if="Object.keys(groupedPastHistory).length === 0" class="text-center py-4 text-muted">
          暂无学习记录
        </div>

        <div v-else>
          <div
            v-for="(group, date) in groupedPastHistory"
            :key="date"
            class="mb-3"
          >
            <div class="bg-light px-3 py-2 border-bottom">
              <strong>{{ formatDate(date) }}</strong>
            </div>
            <div class="list-group list-group-flush">
              <div
                v-for="item in group"
                :key="item.poemId + '-' + (item.days || 'initial')"
                class="list-group-item poem-card"
                role="button"
                tabindex="0"
                @click="goToPoem(item.poemId)"
                @keydown.enter="goToPoem(item.poemId)"
                @keydown.space.prevent="goToPoem(item.poemId)"
              >
                <div class="d-flex justify-content-between align-items-center">
                  <div>
                    <strong>{{ getPoemTitle(item.poemId) }}</strong>
                    <div class="text-muted small">{{ getPoemAuthor(item.poemId) }}</div>
                  </div>
                  <span class="badge" :class="getStatusBadgeClass(item)">
                    {{ getStatusText(item) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 将来的复习计划 -->
    <div class="card mt-3">
      <button
        type="button"
        class="card-header collapsible-header future-header"
        :aria-expanded="!collapsed.future"
        @click="toggleCollapse('future')"
      >
        <h5 class="mb-0 d-flex justify-content-between align-items-center">
          <span><span class="me-2">📅</span> 将来的复习计划</span>
          <span class="collapse-icon">{{ collapsed.future ? '▼' : '▲' }}</span>
        </h5>
      </button>
      <div class="card-body p-0 collapse-body" :class="{ 'collapsed': collapsed.future }">
        <div v-if="futureReviewPlan.length === 0" class="text-center py-4 text-muted">
          暂无复习计划
        </div>
        <div v-else>
          <div
            v-for="group in futureReviewPlan"
            :key="group.date"
            class="mb-3"
          >
            <div class="bg-light px-3 py-2 border-bottom">
              <strong>{{ formatDate(group.date) }}</strong>
            </div>
            <div class="list-group list-group-flush">
              <div
                v-for="item in group.items"
                :key="item.poemId + '-' + item.days"
                class="list-group-item poem-card"
                role="button"
                tabindex="0"
                @click="goToPoem(item.poemId)"
                @keydown.enter="goToPoem(item.poemId)"
                @keydown.space.prevent="goToPoem(item.poemId)"
              >
                <div class="d-flex justify-content-between align-items-center">
                  <div>
                    <strong>{{ getPoemTitle(item.poemId) }}</strong>
                    <div class="text-muted small">{{ getPoemAuthor(item.poemId) }}</div>
                  </div>
                  <span class="badge bg-primary">
                    第{{ item.days }}天 · 待复习
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
import { getLocalDateStr, formatDateReadable, compareDates } from '../utils/dateUtils'
import { eventBus, PERSON_CHANGED, RECORDS_CHANGED } from '../utils/eventBus'

const COLLAPSE_KEY = 'home_collapsed_state'

export default {
  name: 'Home',
  data() {
    return {
      poems,
      todayPending: [],
      groupedPastHistory: {},
      futureReviewPlan: [],
      collapsed: {
        today: false,
        history: true,
        future: true
      },
      persons: [],
      currentPerson: null,
      currentPersonId: ''
    }
  },
  created() {
    this.persons = storage.getPersons()
    this.currentPerson = storage.getCurrentPerson()
    this.currentPersonId = this.currentPerson.id

    // 从 localStorage 读取折叠状态
    try {
      const saved = localStorage.getItem(COLLAPSE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (typeof parsed.today === 'boolean') this.collapsed.today = parsed.today
        if (typeof parsed.history === 'boolean') this.collapsed.history = parsed.history
        if (typeof parsed.future === 'boolean') this.collapsed.future = parsed.future
      }
    } catch (e) {
      // 忽略
    }
  },
  mounted() {
    this.loadRecords()
    eventBus.on(PERSON_CHANGED, this.onPersonChanged)
    eventBus.on(RECORDS_CHANGED, this.onRecordsChanged)
  },
  beforeUnmount() {
    eventBus.off(PERSON_CHANGED, this.onPersonChanged)
    eventBus.off(RECORDS_CHANGED, this.onRecordsChanged)
  },
  methods: {
    getGradeName(grade) {
      if (grade === 7) return '附加一'
      if (grade === 8) return '附加二'
      return grade + '年级'
    },
    getGradePoemCount(grade) {
      return this.poems[grade]?.length || 0
    },
    toggleCollapse(section) {
      this.collapsed[section] = !this.collapsed[section]
      // 保存到 localStorage
      try {
        localStorage.setItem(COLLAPSE_KEY, JSON.stringify(this.collapsed))
      } catch (e) {
        // 忽略
      }
    },
    loadRecords() {
      this.todayPending = storage.getTodayPendingReviews()
      this.groupedPastHistory = this.groupPastHistory()
      this.futureReviewPlan = this.getFutureReviewPlan()
    },
    switchPerson(personId) {
      if (personId === this.currentPersonId) return
      const person = this.persons.find(item => item.id === personId)
      if (!person) return

      // 先更新原始响应式 id，保证移动端第一次点击立即得到视觉反馈。
      this.currentPersonId = personId
      this.currentPerson = person
      if (!storage.setCurrentPerson(personId)) {
        this.currentPerson = storage.getCurrentPerson()
        this.currentPersonId = this.currentPerson.id
      }
    },
    onPersonChanged(person) {
      this.persons = storage.getPersons()
      this.currentPerson = person || storage.getCurrentPerson()
      this.currentPersonId = this.currentPerson.id
      this.loadRecords()
    },
    onRecordsChanged() {
      this.loadRecords()
    },
    // 按实际发生日期分组学习历史，不把“已经过期但未完成”误当成历史。
    groupPastHistory() {
      const today = getLocalDateStr()
      const history = storage.getAllReviewHistory()
      const grouped = {}

      history.forEach(item => {
        if (item.status !== 'pending') {
          const date = item.actualDate || item.plannedDate
          if (compareDates(date, today) >= 0) return
          if (!grouped[date]) {
            grouped[date] = []
          }
          grouped[date].push(item)
        }
      })

      storage.getAllRecordsSorted().forEach(record => {
        if (compareDates(record.firstLearnDate, today) >= 0) return
        if (!grouped[record.firstLearnDate]) grouped[record.firstLearnDate] = []
        grouped[record.firstLearnDate].push({
          poemId: record.poemId,
          status: 'initial',
          actualDate: record.firstLearnDate
        })
      })

      return Object.fromEntries(
        Object.entries(grouped).sort(([dateA], [dateB]) => compareDates(dateB, dateA))
      )
    },
    // 获取未来复习计划（pending状态且计划日期 > 今天）
    getFutureReviewPlan() {
      const today = getLocalDateStr()
      const history = storage.getAllReviewHistory()
      const grouped = {}

      history.forEach(item => {
        if (item.status === 'pending' && compareDates(item.plannedDate, today) > 0) {
          const date = item.plannedDate
          if (!grouped[date]) {
            grouped[date] = []
          }
          grouped[date].push(item)
        }
      })

      // 按日期排序
      const sortedDates = Object.keys(grouped).sort((a, b) => compareDates(a, b))
      return sortedDates.map(date => ({
        date,
        items: grouped[date]
      }))
    },
    goToGrade(grade) {
      this.$router.push({ name: 'PoemList', params: { grade } })
    },
    startTodayReview() {
      if (this.todayPending.length > 0) {
        this.goToPoem(this.todayPending[0].poemId)
      }
    },
    goToSettings() {
      this.$router.push({ name: 'Settings' })
    },
    goToQuiz() {
      this.$router.push({ name: 'Quiz' })
    },
    goToPoem(poemId) {
      this.$router.push({ name: 'PoemDetail', params: { id: poemId } })
    },
    getPoemTitle(poemId) {
      const grade = parseInt(poemId.split('-')[0])
      const poem = this.poems[grade]?.find(p => p.id === poemId)
      return poem ? poem.title : '未知'
    },
    getPoemAuthor(poemId) {
      const grade = parseInt(poemId.split('-')[0])
      const poem = this.poems[grade]?.find(p => p.id === poemId)
      return poem ? poem.author : '未知'
    },
    formatDate(dateStr) {
      return formatDateReadable(dateStr)
    },
    // 状态徽章样式
    getStatusBadgeClass(item) {
      switch (item.status) {
        case 'mastered':
          return 'bg-secondary'  // 灰色：已掌握
        case 'on-time':
          return 'bg-success'    // 绿色：按时复习
        case 'makeup':
          return 'bg-warning'    // 橙色：补复习 / 延期复习
        case 'pending':
          return 'bg-secondary'  // 灰色：未复习
        case 'initial':
          return 'bg-info'
        case 'retry':
          return 'bg-warning'
        default:
          return 'bg-secondary'
      }
    },
    // 状态文本
    getStatusText(item) {
      switch (item.status) {
        case 'mastered':
          return `已掌握 🌟`
        case 'on-time':
          if (item.rating === 'extend') return `第${item.days}天 · 延期复习`
          return `第${item.days}天 · 按时复习`
        case 'makeup':
          if (item.rating === 'extend') return `第${item.days}天 · 延期复习`
          return `第${item.days}天 · 补复习`
        case 'pending':
          return `第${item.days}天 · 未复习`
        case 'initial':
          return '初学'
        case 'retry':
          return `第${item.days}天 · 有点生，${item.intervalDays}天后重试`
        default:
          return `第${item.days}天`
      }
    }
  }
}
</script>

<style scoped>
.app-hero {
  margin-bottom: 24px;
}

.app-title {
  margin: 0;
  color: var(--color-text);
  font-size: clamp(2rem, 8vw, 2.5rem);
  font-weight: 800;
  letter-spacing: 4px;
}

.app-subtitle {
  margin: 4px 0 0;
  color: var(--color-muted);
  font-family: 'Long Cang', cursive;
  font-size: 1.25rem;
}

.today-card .collapsible-header {
  color: #fff;
  background: var(--color-danger);
}

.today-card.is-clear .collapsible-header {
  background: var(--color-success);
}

.history-header {
  color: #fff;
  background: var(--color-brand);
}

.future-header {
  color: #fff;
  background: var(--color-success);
}

.today-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px;
  background: var(--color-danger-soft);
  border-bottom: 1px solid var(--color-border);
}

.today-summary strong,
.today-summary span {
  display: block;
}

.today-summary span {
  margin-top: 3px;
  color: var(--color-muted);
  font-size: 0.88rem;
}

.primary-action {
  flex: none;
  min-height: 44px;
  color: #fff;
  background: var(--color-brand);
}

.empty-state {
  display: flex;
  padding: 24px 20px;
  align-items: center;
  flex-direction: column;
  color: var(--color-muted);
  text-align: center;
}

.empty-state strong {
  margin: 8px 0 4px;
  color: var(--color-text);
}

.empty-state-icon {
  display: inline-flex;
  width: 38px;
  height: 38px;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: var(--color-success);
  border-radius: 50%;
  font-weight: 800;
}

.section-heading {
  margin: 28px 2px 12px;
}

.section-heading h2 {
  margin: 0;
  color: var(--color-text);
  font-size: 1.2rem;
}

.section-heading p {
  margin: 3px 0 0;
  color: var(--color-muted);
  font-size: 0.88rem;
}

.btn-grade {
  height: 68px;
  margin: 0;
  padding: 10px 14px;
  align-items: flex-start;
  flex-direction: column;
  color: var(--color-brand) !important;
  background: var(--color-surface) !important;
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
  font-size: 1.08rem;
  letter-spacing: 1px;
  text-shadow: none;
}

.btn-grade small {
  color: var(--color-muted);
  font-family: var(--font-body);
  font-size: 0.78rem;
  letter-spacing: 0;
}

.secondary-action {
  min-height: 46px;
  color: var(--color-brand);
  background: var(--color-brand-soft);
  border: 1px solid rgba(39, 74, 120, 0.18);
}

.collapsible-header {
  display: block;
  width: 100%;
  border: 0;
  text-align: left;
  cursor: pointer;
  user-select: none;
}

.collapsible-header:hover {
  opacity: 0.9;
}

.collapse-icon {
  font-size: 0.8rem;
  transition: transform 0.2s ease;
}

.collapse-body {
  max-height: 50000px;
  overflow: hidden;
  transition: max-height 0.3s ease;
}

.collapse-body.collapsed {
  max-height: 0;
}

.header-count {
  display: inline-flex;
  min-width: 24px;
  height: 24px;
  margin-left: 5px;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.2);
  font-family: sans-serif;
  font-size: 0.78rem;
}

.person-switcher {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  padding: 4px 10px;
  background: #f6f3eb;
  border-radius: 20px;
  border: 1px solid #e5dfd3;
}

.person-chip {
  background: transparent;
  color: #785448;
  border: 1px solid transparent;
  border-radius: 16px;
  min-height: 40px;
  padding: 8px 14px;
  font-size: 0.85rem;
  font-weight: 600;
  transition: all 0.2s ease;
}

@media (hover: hover) {
  .person-chip:hover {
    background: rgba(120, 84, 72, 0.08);
  }
}

.person-chip.active {
  background: #522c5e;
  color: #fff6e5;
  border-color: #522c5e;
  box-shadow: 0 2px 8px rgba(82, 44, 94, 0.25);
}

.poem-card[role="button"]:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: -3px;
}

@media (max-width: 380px) {
  .today-summary {
    align-items: stretch;
    flex-direction: column;
  }

  .primary-action {
    width: 100%;
  }
}
</style>
