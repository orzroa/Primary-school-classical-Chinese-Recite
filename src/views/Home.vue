<template>
  <div class="container py-4">
    <div class="text-center mb-5" style="animation: fadeInDown 0.8s ease;">
      <h1 class="mb-1" style="color: #2c3e50; font-size: 2.5rem; font-weight: 800; font-family: 'ZCOOL XiaoWei', serif; letter-spacing: 4px;">古诗词背诵</h1>
      <p style="color: #785448; font-family: 'Long Cang', cursive; font-size: 1.35rem; margin-top: 5px;">温故而知新，可以为师矣</p>
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
    </div>

    <!-- 今日待复习 -->
    <div class="card">
      <button
        type="button"
        class="card-header collapsible-header"
        style="background: #c8392f; color: #fff6e5;"
        :aria-expanded="!collapsed.today"
        @click="toggleCollapse('today')"
      >
        <h5 class="mb-0 d-flex justify-content-between align-items-center">
          <span><span class="me-2">🎯</span> 今日待复习 <span class="header-count">{{ todayPending.length }}</span></span>
          <span class="collapse-icon">{{ collapsed.today ? '▼' : '▲' }}</span>
        </h5>
      </button>
      <div class="card-body p-0 collapse-body" :class="{ 'collapsed': collapsed.today }">
        <div v-if="todayPending.length === 0" class="text-center py-4 text-muted">
          今天没有待复习任务，休息一下吧 ✨
        </div>
        <div v-else class="list-group list-group-flush">
          <div
            v-for="item in todayPending"
            :key="item.poemId + '-' + item.days"
            class="list-group-item poem-card"
            @click="goToPoem(item.poemId)"
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

    <div class="row g-3 mb-4">
      <div v-for="grade in 8" :key="grade" class="col-4">
        <button
          class="btn btn-grade"
          :class="'btn-grade-' + grade"
          @click="goToGrade(grade)"
        >
          {{ getGradeName(grade) }}
        </button>
      </div>
    </div>

    <div class="text-center mb-4">
      <button
        class="btn"
        style="background: #522c5e; color: #fff6e5; border: none; box-shadow: 0 4px 15px rgba(82, 44, 94, 0.2); font-family: 'ZCOOL XiaoWei', serif; font-size: 1.15rem; padding: 12px 36px; letter-spacing: 2px;"
        @click="goToQuiz"
      >
        📝 随机测验
      </button>
    </div>

    <!-- 学习记录（过去和今天的复习计划） -->
    <div class="card mt-3">
      <button
        type="button"
        class="card-header collapsible-header"
        style="background: #274a78; color: #fff6e5;"
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
                @click="goToPoem(item.poemId)"
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
        class="card-header collapsible-header"
        style="background: #4c7d6c; color: #fff6e5;"
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
                @click="goToPoem(item.poemId)"
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
</style>
