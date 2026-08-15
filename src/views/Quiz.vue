<template>
  <div class="container py-4">
    <div class="d-flex align-items-center mb-4">
      <button class="btn me-3" style="background: #2c3e50; color: #fff6e5; border: none; box-shadow: 0 4px 12px rgba(44, 62, 80, 0.15); font-family: 'ZCOOL XiaoWei', serif;" @click="goBack">
        ← 返回
      </button>
      <h4 class="mb-0" style="color: #2c3e50; font-weight: 800; font-family: 'ZCOOL XiaoWei', serif; letter-spacing: 2px;">背诵测验</h4>
    </div>

    <!-- 开始界面 -->
    <div v-if="!started" class="card">
      <div class="card-body text-center" style="padding: 32px;">
        <div class="quiz-icon mb-3">卷</div>
        <h5 style="color: #2c3e50; font-family: 'ZCOOL XiaoWei', serif; margin-bottom: 16px;">
          {{ learnedPoems.length ? `共 ${learnedPoems.length} 首已学诗词` : '还没有已学诗词' }}
        </h5>
        <p class="text-muted mb-4" style="font-size: 0.95rem;">
          {{ learnedPoems.length === 0 ? '先从年级目录选择一首开始学习吧' : '选择适合本次时间的练习量' }}
        </p>
        <div v-if="learnedPoems.length > 0" class="quiz-modes mb-4" role="radiogroup" aria-label="选择测验范围">
          <button
            class="quiz-mode"
            :class="{ active: selectedMode === 'due' }"
            :disabled="duePoems.length === 0"
            :aria-pressed="selectedMode === 'due'"
            @click="selectedMode = 'due'"
          >
            <strong>今日待复习</strong>
            <span>{{ duePoems.length ? `${duePoems.length} 首` : '今日已完成' }}</span>
          </button>
          <button
            class="quiz-mode"
            :class="{ active: selectedMode === 'random10' }"
            :aria-pressed="selectedMode === 'random10'"
            @click="selectedMode = 'random10'"
          >
            <strong>轻量练习</strong>
            <span>随机 {{ Math.min(10, learnedPoems.length) }} 首</span>
          </button>
          <button
            v-if="learnedPoems.length > 10"
            class="quiz-mode"
            :class="{ active: selectedMode === 'random20' }"
            :aria-pressed="selectedMode === 'random20'"
            @click="selectedMode = 'random20'"
          >
            <strong>加强练习</strong>
            <span>随机 {{ Math.min(20, learnedPoems.length) }} 首</span>
          </button>
        </div>
        <p v-if="learnedPoems.length > 0" class="quiz-note">
          每次自评都会同步学习进度。“有点生”会保留当前阶段，按原步长再次复习。
        </p>
        <button
          v-if="learnedPoems.length > 0"
          class="btn"
          style="background: #522c5e; color: #fff6e5; padding: 12px 36px; box-shadow: 0 4px 15px rgba(82, 44, 94, 0.2);"
          @click="startQuiz"
        >
          开始 · {{ selectedQuizCount }} 首
        </button>
        <button v-else class="btn secondary-back" @click="$router.push('/')">返回首页选诗</button>
      </div>
    </div>

    <!-- 测验界面 -->
    <div v-else-if="!finished" class="card">
      <div class="card-header" style="background: #522c5e; color: #fff6e5;">
        <h5 class="mb-0 d-flex justify-content-between align-items-center">
          <span>第 {{ currentIndex + 1 }} / {{ quizList.length }} 题</span>
          <span class="badge" style="background: rgba(255,255,255,0.25);">{{ questionTypeText(currentQuestion.type) }}</span>
        </h5>
        <div class="quiz-progress" aria-hidden="true">
          <div :style="{ width: `${((currentIndex + 1) / quizList.length) * 100}%` }"></div>
        </div>
      </div>
      <div class="card-body" style="padding: 28px;">
        <!-- 题目区 -->
        <div class="mb-4 text-center" style="background: rgba(82, 44, 94, 0.05); padding: 24px; border-radius: 12px;">
          <div v-if="currentQuestion.type === 'author'" style="font-size: 1.05rem; color: #785448; margin-bottom: 12px;">
            {{ currentQuestion.questionText }}
          </div>
          <div v-else style="font-size: 1.05rem; color: #785448; margin-bottom: 12px;">
            {{ currentQuestion.questionText }}
          </div>
          <div style="font-size: 1.2rem; line-height: 2; color: #2c3e50; font-family: 'Noto Serif SC', serif; letter-spacing: 2px;">
            <div v-for="(line, idx) in currentQuestion.contentLines" :key="idx" class="poem-line">
              {{ line }}
            </div>
          </div>
        </div>

        <!-- 提示（如果同题目的多首） -->
        <div v-if="currentQuestion.hint" class="text-center mb-3 text-muted" style="font-size: 0.85rem;">
          💡 {{ currentQuestion.hint }}
        </div>

        <!-- 显示答案按钮 -->
        <div v-if="!showAnswer" class="text-center mb-3">
          <button class="btn btn-sm" style="background: #f6f3eb; color: #785448; border: 1px solid #785448;" @click="showAnswer = true">
            显示答案
          </button>
        </div>

        <!-- 答案区 -->
        <div v-if="showAnswer" class="mb-3 text-center" style="background: rgba(76, 125, 108, 0.1); padding: 16px; border-radius: 8px;">
          <div style="color: #785448; font-size: 0.85rem; margin-bottom: 4px;">第 {{ currentQuestion.poem.order }} 首</div>
          <div style="color: #2c3e50; font-weight: 700; font-size: 1.1rem;">{{ currentQuestion.poem.title }}</div>
          <div class="text-muted">{{ currentQuestion.poem.author }}</div>
          <div v-if="currentQuestion.type === 'partial'" class="answer-lines mt-3">
            <div v-for="(line, idx) in currentQuestion.answerLines" :key="idx">{{ line }}</div>
          </div>
        </div>

        <!-- 评级按钮 -->
        <div v-if="showAnswer" class="row g-2 mt-3">
          <div class="col-4">
            <button
              class="btn w-100"
              style="background: #f6ead8; color: #704a1f; border: 1px solid #d7b77f; padding: 14px 8px;"
              @click="ratePoem('C')"
            >
              <div class="rating-symbol">🤔</div>
              <div class="rating-label">有点生</div>
            </button>
          </div>
          <div class="col-4">
            <button
              class="btn w-100"
              style="background: #274a78; color: #fff6e5; padding: 14px 8px;"
              @click="ratePoem('B')"
            >
              <div class="rating-symbol">👍</div>
              <div class="rating-label">正常</div>
            </button>
          </div>
          <div class="col-4">
            <button
              class="btn w-100"
              style="background: transparent; color: #315447; border: 1px solid #3f6a5a; padding: 14px 8px;"
              @click="ratePoem('A')"
            >
              <div class="rating-symbol">🌟</div>
              <div class="rating-label">非常熟</div>
            </button>
          </div>
        </div>
        <button class="btn quit-quiz mt-3" @click="finishQuiz">结束本次练习</button>
      </div>
    </div>

    <!-- 结束界面 -->
    <div v-else class="card">
      <div class="card-header" style="background: #522c5e; color: #fff6e5;">
        <h5 class="mb-0"><span class="me-2">🎉</span> 测验完成</h5>
      </div>
      <div class="card-body" style="padding: 28px;">
        <div class="row g-3 mb-4">
          <div class="col-4 text-center">
            <div style="font-size: 2.2rem; color: #c9372e; font-weight: 800;">{{ stats.C }}</div>
            <div style="color: #c9372e; font-size: 0.85rem;">有点生</div>
          </div>
          <div class="col-4 text-center">
            <div style="font-size: 2.2rem; color: #274a78; font-weight: 800;">{{ stats.B }}</div>
            <div style="color: #274a78; font-size: 0.85rem;">正常</div>
          </div>
          <div class="col-4 text-center">
            <div style="font-size: 2.2rem; color: #3f6a5a; font-weight: 800;">{{ stats.A }}</div>
            <div style="color: #3f6a5a; font-size: 0.85rem;">非常熟</div>
          </div>
        </div>

        <div class="text-center">
          <button
            class="btn me-2"
            style="background: #522c5e; color: #fff6e5;"
            @click="startQuiz"
          >
            再来一次
          </button>
          <button
            class="btn"
            style="background: #2c3e50; color: #fff6e5;"
            @click="goBack"
          >
            返回
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { poems as allPoems } from '../data/poems'
import { storage } from '../utils/storage'
import { eventBus, PERSON_CHANGED, RECORDS_CHANGED } from '../utils/eventBus'

export default {
  name: 'Quiz',
  data() {
    return {
      started: false,
      finished: false,
      currentIndex: 0,
      showAnswer: false,
      quizList: [],
      stats: { A: 0, B: 0, C: 0 },
      allPoems,
      refreshKey: 0,
      selectedMode: 'random10'
    }
  },
  computed: {
    learnedPoems() {
      // 依赖 refreshKey 让 computed 重新求值
      void this.refreshKey
      const result = []
      Object.keys(allPoems).forEach(grade => {
        allPoems[grade].forEach(poem => {
          const record = storage.getPoemRecord(poem.id)
          if (record) {
            result.push(poem)
          }
        })
      })
      return result
    },
    currentQuestion() {
      return this.quizList[this.currentIndex] || {}
    },
    duePoems() {
      return this.learnedPoems.filter(poem => storage.needsReviewToday(poem.id))
    },
    selectedQuizCount() {
      if (this.selectedMode === 'due') return this.duePoems.length
      if (this.selectedMode === 'random20') return Math.min(20, this.learnedPoems.length)
      return Math.min(10, this.learnedPoems.length)
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
      // 如果测验未开始，重置计数
      if (!this.started) {
        this.finished = false
      }
    },
    goBack() {
      this.$router.back()
    },
    startQuiz() {
      let poems = this.selectedMode === 'due' ? this.duePoems : this.learnedPoems
      if (poems.length === 0) return

      // Fisher-Yates 洗牌算法：彻底打乱顺序
      const shuffled = [...poems]
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
      }

      if (this.selectedMode === 'random10') shuffled.splice(10)
      if (this.selectedMode === 'random20') shuffled.splice(20)

      // 按题目分组
      const titleGroups = {}
      shuffled.forEach(poem => {
        if (!titleGroups[poem.title]) {
          titleGroups[poem.title] = []
        }
        titleGroups[poem.title].push(poem)
      })

      // 为每首诗生成题目 - 3 种题型随机
      this.quizList = shuffled.map(poem => {
        const rand = Math.random()
        let type, questionText
        if (rand < 0.4) {
          type = 'content'
          questionText = '这首诗的题目是？'
        } else if (rand < 0.75) {
          type = 'author'
          questionText = '这首诗的作者是？'
        } else {
          type = 'partial'
          questionText = '这首诗的题目是？'
        }

        const contentLines = this.formatContent(poem.content)

        let displayLines = contentLines
        if (type === 'partial' && contentLines.length > 2) {
          const hideIndex = Math.floor(Math.random() * contentLines.length)
          displayLines = contentLines.map((line, idx) =>
            idx === hideIndex ? '（  ）' : line
          )
        }

        const sameTitle = titleGroups[poem.title]
        let hint = null
        if (sameTitle.length > 1) {
          if (type === 'content' || type === 'partial') {
            hint = `提示作者：${poem.author}`
          } else {
            hint = `提示题目：《${poem.title}》`
          }
        }

        return {
          poem,
          type,
          questionText,
          contentLines: displayLines,
          answerLines: contentLines,
          hint
        }
      })

      this.currentIndex = 0
      this.showAnswer = false
      this.stats = { A: 0, B: 0, C: 0 }
      this.started = true
      this.finished = false
    },
    formatContent(content) {
      if (!content) return []
      if (content.includes('\n\n')) {
        return content.split('\n\n').filter(p => p.trim()).map(p => p.replace(/\n/g, ''))
      }
      return content.split('\n').filter(line => line.trim())
    },
    questionTypeText(type) {
      if (type === 'author') return '问作者'
      if (type === 'partial') return '补诗句'
      return '问标题'
    },
    ratePoem(rating) {
      this.stats[rating]++

      const storageRating = {
        A: 'mastered',
        B: 'normal',
        C: 'extend'
      }[rating]
      storage.rateFromQuiz(this.currentQuestion.poem.id, storageRating)

      if (this.currentIndex < this.quizList.length - 1) {
        this.currentIndex++
        this.showAnswer = false
      } else {
        this.finished = true
      }
    },
    finishQuiz() {
      this.finished = true
    }
  }
}
</script>

<style scoped>
.poem-line {
  margin-bottom: 8px;
}

.poem-line:last-child {
  margin-bottom: 0;
}

.quiz-note {
  margin: -8px auto 20px;
  padding: 10px 12px;
  max-width: 360px;
  color: #785448;
  background: #f8f2df;
  border-radius: 8px;
  font-size: 0.88rem;
  line-height: 1.6;
}

.answer-lines {
  padding-top: 12px;
  border-top: 1px dashed #b9d2c7;
  color: #315b4d;
  font-family: 'Noto Serif SC', serif;
  line-height: 1.8;
}

.quiz-icon {
  display: inline-flex;
  width: 64px;
  height: 64px;
  align-items: center;
  justify-content: center;
  color: var(--color-brand);
  background: var(--color-brand-soft);
  border-radius: 20px;
  font-family: 'ZCOOL XiaoWei', serif;
  font-size: 1.8rem;
}

.quiz-modes {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.quiz-mode {
  min-height: 76px;
  padding: 12px;
  color: var(--color-text);
  background: var(--color-surface-muted);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  text-align: left;
}

.quiz-mode strong,
.quiz-mode span {
  display: block;
}

.quiz-mode span {
  margin-top: 4px;
  color: var(--color-muted);
  font-size: 0.85rem;
}

.quiz-mode.active {
  border-color: var(--color-brand);
  box-shadow: 0 0 0 2px var(--color-brand-soft);
}

.quiz-mode:disabled {
  opacity: 0.55;
}

.quiz-progress {
  height: 4px;
  margin: 12px -20px -16px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.18);
}

.quiz-progress > div {
  height: 100%;
  background: #fff6e5;
  transition: width 0.25s ease;
}

.rating-symbol {
  font-size: 1.25rem;
}

.rating-label {
  margin-top: 3px;
  font-size: 0.86rem;
}

.quit-quiz {
  width: 100%;
  color: var(--color-muted);
  background: transparent;
  font-size: 0.88rem;
}

.secondary-back {
  color: var(--color-brand);
  background: var(--color-brand-soft);
  border: 1px solid rgba(39, 74, 120, 0.18);
}
</style>
