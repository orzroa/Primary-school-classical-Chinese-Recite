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
        <div class="display-1 mb-3">📝</div>
        <h5 style="color: #2c3e50; font-family: 'ZCOOL XiaoWei', serif; margin-bottom: 16px;">
          共 {{ learnedPoems.length }} 首已学诗词
        </h5>
        <p class="text-muted mb-4" style="font-size: 0.95rem;">
          {{ learnedPoems.length === 0 ? '请先学习一些诗词' : '准备好开始测验了吗？' }}
        </p>
        <p v-if="learnedPoems.length > 0" class="quiz-note">
          自评结果会同步到复习计划；“有点生”会从明天开始新一轮复习。
        </p>
        <button
          v-if="learnedPoems.length > 0"
          class="btn"
          style="background: #522c5e; color: #fff6e5; padding: 12px 36px; box-shadow: 0 4px 15px rgba(82, 44, 94, 0.2);"
          @click="startQuiz"
        >
          开始测验
        </button>
        <div v-else class="text-muted">暂无已学诗词</div>
      </div>
    </div>

    <!-- 测验界面 -->
    <div v-else-if="!finished" class="card">
      <div class="card-header" style="background: #522c5e; color: #fff6e5;">
        <h5 class="mb-0 d-flex justify-content-between align-items-center">
          <span>第 {{ currentIndex + 1 }} / {{ quizList.length }} 题</span>
          <span class="badge" style="background: rgba(255,255,255,0.25);">{{ questionTypeText(currentQuestion.type) }}</span>
        </h5>
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
              style="background: #4c7d6c; color: #fff6e5; padding: 14px 8px;"
              @click="ratePoem('A')"
            >
              <div style="font-size: 1.3rem; font-weight: 800;">A</div>
              <div style="font-size: 0.75rem;">非常熟</div>
            </button>
          </div>
          <div class="col-4">
            <button
              class="btn w-100"
              style="background: #b07a3e; color: #fff6e5; padding: 14px 8px;"
              @click="ratePoem('B')"
            >
              <div style="font-size: 1.3rem; font-weight: 800;">B</div>
              <div style="font-size: 0.75rem;">正常</div>
            </button>
          </div>
          <div class="col-4">
            <button
              class="btn w-100"
              style="background: #c9372e; color: #fff6e5; padding: 14px 8px;"
              @click="ratePoem('C')"
            >
              <div style="font-size: 1.3rem; font-weight: 800;">C</div>
              <div style="font-size: 0.75rem;">有点生</div>
            </button>
          </div>
        </div>
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
            <div style="font-size: 2.2rem; color: #4c7d6c; font-weight: 800;">{{ stats.A }}</div>
            <div style="color: #4c7d6c; font-size: 0.85rem;">A · 非常熟</div>
          </div>
          <div class="col-4 text-center">
            <div style="font-size: 2.2rem; color: #b07a3e; font-weight: 800;">{{ stats.B }}</div>
            <div style="color: #b07a3e; font-size: 0.85rem;">B · 正常</div>
          </div>
          <div class="col-4 text-center">
            <div style="font-size: 2.2rem; color: #c9372e; font-weight: 800;">{{ stats.C }}</div>
            <div style="color: #c9372e; font-size: 0.85rem;">C · 有点生</div>
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
      refreshKey: 0
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
      const poems = this.learnedPoems
      if (poems.length === 0) return

      // Fisher-Yates 洗牌算法：彻底打乱顺序
      const shuffled = [...poems]
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
      }

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
  font-size: 0.82rem;
}

.answer-lines {
  padding-top: 12px;
  border-top: 1px dashed #b9d2c7;
  color: #315b4d;
  font-family: 'Noto Serif SC', serif;
  line-height: 1.8;
}
</style>
