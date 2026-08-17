<template>
  <div class="home-shell">
    <header class="app-hero">
      <div class="brand-block">
        <div class="mascot" aria-hidden="true"><span>诗</span></div>
        <div><p class="eyebrow">我的学习</p><h1 class="app-title">古诗小课堂</h1></div>
      </div>
      <div class="streak-card"><span class="streak-fire">🔥</span><span>连续学习</span><strong>5</strong><span>天</span></div>
      <div class="star-score" aria-label="获得星星 123 颗"><span>⭐</span><strong>123</strong></div>
    </header>
    <main class="learning-board">
      <div class="board-toolbar">
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
        <button class="settings-button" @click="goToSettings">⚙️ <span>设置</span></button>
      </div>

    <!-- 今日待复习 -->
    <div class="card today-card" :class="{ 'is-clear': todayPending.length === 0 }">
      <button
        type="button"
        class="card-header collapsible-header"
        :aria-expanded="!collapsed.today"
        @click="toggleCollapse('today')"
      >
        <h5 class="mb-0 d-flex justify-content-between align-items-center">
          <span><span class="me-2">📖</span> 今日学习任务 <span class="header-count">{{ todayPending.length }}</span></span>
          <span class="collapse-icon">{{ collapsed.today ? '▼' : '▲' }}</span>
        </h5>
      </button>
      <div class="card-body p-0 collapse-body" :class="{ 'collapsed': collapsed.today }">
        <div v-if="todayPending.length === 0" class="empty-state">
          <span class="empty-state-icon">★</span>
          <strong>太棒啦！今日复习完成</strong>
          <span>今天的知识都记住了，去认识一首新诗吧！</span>
        </div>
        <div v-else>
          <div class="today-summary">
            <div>
              <strong>今天有 {{ todayPending.length }} 首待复习</strong>
              <span>预计 {{ Math.max(2, Math.ceil(todayPending.length * 0.8)) }} 分钟</span>
            </div>
            <button class="btn primary-action" @click.stop="startTodayReview">继续学习 →</button>
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

    <div class="section-heading course-heading">
      <div>
        <h2><span>📚</span> 我的课程</h2>
        <p>选择年级，开启今天的诗词之旅</p>
      </div>
    </div>
    <div class="grade-grid">
      <div v-for="grade in 8" :key="grade">
        <button
          class="btn btn-grade" :class="`grade-tone-${grade}`"
          @click="goToGrade(grade)"
        >
          <span class="grade-illustration">{{ ['🌱','🌳','☀️','🌈','⛰️','🚀','🪐','🏆'][grade - 1] }}</span>
          <span class="grade-copy"><strong>{{ getGradeName(grade) }}</strong><small>{{ getGradePoemCount(grade) }} 首诗词</small></span>
          <span class="grade-arrow">›</span>
        </button>
      </div>
    </div>

    <div class="quiz-banner">
      <div><span class="quiz-kicker">闯关时间</span><strong>看看今天学会了多少？</strong></div>
      <button
        class="btn secondary-action"
        @click="goToQuiz"
      >
        开始测验 ✨
      </button>
    </div>

    <!-- 学习记录（过去和今天的复习计划） -->
    <div class="card mt-3 record-card">
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
    <div class="card mt-3 record-card">
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
    </main>
    <div class="garden" aria-hidden="true"><span>✿</span><span>●</span><span>✿</span><span>●</span></div>
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

/* 童趣学习面板 */
.home-shell {
  position: relative;
  width: min(1120px, calc(100% - 24px));
  min-height: 100vh;
  margin: 0 auto;
  padding: max(22px, env(safe-area-inset-top)) 0 90px;
}

.app-hero {
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: center;
  gap: 22px;
  margin: 0 22px 18px;
}

.brand-block { display: flex; align-items: center; gap: 14px; }
.mascot {
  display: grid; width: 68px; height: 68px; place-items: center;
  color: white; background: linear-gradient(145deg, #ffb32e, #ff742e);
  border: 6px solid white; border-radius: 50%; box-shadow: 0 5px 0 #cde9fb, 0 10px 22px #177cc333;
}
.mascot span { font: 900 30px 'ZCOOL XiaoWei', serif; transform: rotate(-7deg); }
.eyebrow { margin: 0 0 1px; color: #4d98ca; font-size: .76rem; font-weight: 900; letter-spacing: 3px; }
.app-title { color: #1761aa; font-size: clamp(1.7rem, 4vw, 2.45rem); text-shadow: 0 3px 0 #fff; }
.streak-card, .star-score {
  display: flex; min-height: 58px; align-items: center; gap: 9px; padding: 9px 20px;
  color: #135ca5; background: #fffdf7; border: 3px solid #f6deb0; border-radius: 24px;
  box-shadow: 0 7px 15px #c58b2c1c; font-weight: 900;
}
.streak-card strong { color: #ff5b22; font-size: 2rem; line-height: 1; }
.streak-fire { font-size: 2rem; }
.star-score { min-width: 150px; justify-content: center; background: linear-gradient(90deg, #fff, #dff2ff); border-color: white; box-shadow: 0 0 0 3px #f5dfb9, 0 8px 18px #b78a3d26; }
.star-score span { font-size: 2.3rem; filter: drop-shadow(0 3px 0 #f3a800); }
.star-score strong { font-size: 1.65rem; }

.learning-board {
  position: relative; padding: 22px; background: rgba(255,248,224,.9);
  border: 1px solid #f3dcaa; border-radius: 32px; box-shadow: 0 14px 40px #b47b2520;
}
.board-toolbar { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 18px; }
.person-switcher { background: #fff; border: 2px solid #f2dcae; }
.person-chip.active { background: #168fe1; border-color: #168fe1; box-shadow: 0 3px 0 #0864bd; }
.settings-button { padding: 9px 16px; color: #80572f; background: #fff; border: 2px solid #f2dcae; border-radius: 18px; font-weight: 800; }

.today-card { border: 4px solid #ffc239 !important; border-radius: 28px !important; box-shadow: 0 9px 0 #e8af2f, 0 18px 32px #bf8c3030 !important; }
.today-card .collapsible-header, .today-card.is-clear .collapsible-header { color: #6f411e; background: linear-gradient(90deg, #fff2b9, #fff9e8); }
.card-header { padding: 17px 22px; }
.empty-state { min-height: 155px; justify-content: center; background: radial-gradient(circle at 50% 20%, #fff 0, #fffdf9 60%, #fff8df 100%); }
.empty-state strong { color: #f26622; font-size: clamp(1.25rem, 3vw, 1.7rem); }
.empty-state-icon { width: 54px; height: 54px; color: #fff; background: linear-gradient(#ffe05b, #ffb800); border: 4px solid #fff2ae; box-shadow: 0 4px 0 #e99a00; font-size: 1.5rem; }
.primary-action { background: linear-gradient(#7edc43, #55bb29); border-radius: 16px; box-shadow: 0 5px 0 #369b1c; }

.course-heading { margin: 32px 4px 14px; }
.course-heading h2 { color: #78451f; font-size: 1.35rem; }
.grade-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
.btn-grade { position: relative; height: 132px; padding: 14px !important; justify-content: space-between; align-items: flex-start; border: 3px solid white !important; border-radius: 23px !important; box-shadow: 0 0 0 3px #f3dab0, 0 8px 0 #e9c98e !important; overflow: hidden; }
.btn-grade::after { content: ''; position: absolute; width: 95px; height: 95px; right: -28px; top: -28px; border-radius: 50%; background: #ffffff55; }
.grade-illustration { position: relative; z-index: 1; font-size: 2.4rem; filter: drop-shadow(0 4px 2px #7150222e); }
.grade-copy { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: flex-start; }
.grade-copy strong { color: #255d9d; font-size: 1.1rem; }
.btn-grade small { color: #755a43; }
.grade-arrow { position: absolute; right: 13px; bottom: 10px; color: #fff; font: 900 1.5rem sans-serif; }
.grade-tone-1, .grade-tone-5 { background: linear-gradient(145deg, #c9efff, #8bd6f6) !important; }
.grade-tone-2, .grade-tone-6 { background: linear-gradient(145deg, #dcf5aa, #a8dc67) !important; }
.grade-tone-3, .grade-tone-7 { background: linear-gradient(145deg, #ffe69b, #ffc853) !important; }
.grade-tone-4, .grade-tone-8 { background: linear-gradient(145deg, #e8d1ff, #c59af0) !important; }

.quiz-banner { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin: 26px 0; padding: 18px 22px; color: #fff; background: linear-gradient(135deg, #2ea6f4, #1476dd); border: 4px solid #fff; border-radius: 24px; box-shadow: 0 7px 0 #0864bd, 0 11px 22px #156fbd3d; }
.quiz-banner div { display: flex; flex-direction: column; }
.quiz-banner strong { font-size: 1.1rem; }
.quiz-kicker { color: #dff5ff; font-size: .76rem; font-weight: 900; letter-spacing: 2px; }
.secondary-action { min-width: 150px; color: #1467b8; background: white; border-radius: 15px; box-shadow: 0 4px 0 #b9dbf3; }
.record-card { border: 2px solid #eed8b0 !important; border-radius: 22px !important; box-shadow: 0 6px 18px #96692317 !important; }
.history-header, .future-header { color: #70431f; background: #fff7df; }
.garden { position: absolute; z-index: -1; right: -18px; bottom: 16px; left: -18px; display: flex; justify-content: space-around; align-items: end; height: 78px; color: #ff8c3d; background: linear-gradient(165deg, transparent 0 45%, #a9dc58 46% 65%, #45b888 66%); font-size: 1.7rem; }
.garden span:nth-child(even) { color: #ffcf3b; font-size: 1rem; }

@media (max-width: 760px) {
  .home-shell { width: min(100% - 18px, 620px); padding-top: 18px; }
  .app-hero { grid-template-columns: 1fr auto; gap: 10px; margin: 0 6px 14px; }
  .brand-block { gap: 9px; }
  .mascot { width: 54px; height: 54px; border-width: 4px; }
  .mascot span { font-size: 24px; }
  .eyebrow { font-size: .66rem; }
  .app-title { font-size: 1.55rem; letter-spacing: 2px; }
  .streak-card { grid-column: 1 / -1; grid-row: 2; justify-self: center; min-height: 45px; padding: 6px 15px; border-radius: 18px; }
  .streak-card strong { font-size: 1.55rem; }
  .streak-fire { font-size: 1.5rem; }
  .star-score { min-width: 105px; min-height: 48px; padding: 5px 10px; }
  .star-score span { font-size: 1.7rem; }.star-score strong { font-size: 1.25rem; }
  .learning-board { padding: 13px; border-radius: 25px; }
  .board-toolbar { align-items: flex-start; }.person-switcher { padding: 3px 6px; }.person-switcher > span { display: none; }
  .person-chip { min-height: 34px; padding: 6px 10px; }.settings-button span { display: none; }
  .grade-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
  .btn-grade { height: 115px; }
  .quiz-banner { align-items: stretch; flex-direction: column; }
  .secondary-action { width: 100%; }
}
</style>
