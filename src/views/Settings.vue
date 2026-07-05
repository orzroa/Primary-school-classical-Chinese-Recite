<template>
  <div class="container py-4">
    <div class="d-flex align-items-center mb-4" style="animation: fadeInDown 0.6s ease;">
      <button class="btn me-3" style="background: #2c3e50; color: #fff6e5; border: none; box-shadow: 0 4px 12px rgba(44, 62, 80, 0.15); font-family: 'ZCOOL XiaoWei', serif;" @click="goBack">
        ← 返回
      </button>
      <h4 class="mb-0" style="color: #2c3e50; font-weight: 800; font-family: 'ZCOOL XiaoWei', serif; letter-spacing: 2px;">设置</h4>
    </div>

    <div class="card mb-3" style="animation: fadeInUp 0.6s ease;">
      <div class="card-header" style="background: #274a78; color: #fff6e5;">
        <h5 class="mb-0"><span class="me-2">📤</span> 导出进度</h5>
      </div>
      <div class="card-body">
        <p class="text-muted mb-3">将背诵记录导出为文件，可用于备份或迁移到其他设备。</p>
        <div class="alert alert-info mb-3" role="alert">
          <strong>当前记录：</strong>已学习 {{ learnedCount }} 首诗文
        </div>
        <button class="btn btn-primary w-100" @click="exportData">
          <span class="me-2">💾</span>导出备份文件
        </button>
      </div>
    </div>

    <div class="card" style="animation: fadeInUp 0.6s ease 0.1s both;">
      <div class="card-header" style="background: #4c7d6c; color: #fff6e5;">
        <h5 class="mb-0"><span class="me-2">📥</span> 导入进度</h5>
      </div>
      <div class="card-body">
        <p class="text-muted mb-3">从备份文件恢复背诵记录。</p>
        <div class="alert alert-warning mb-3" role="alert">
          <strong>注意：</strong>导入会覆盖当前所有记录，请确保已备份现有数据。
        </div>
        <input
          type="file"
          ref="fileInput"
          class="d-none"
          accept=".json"
          @change="handleFileSelect"
        />
        <button class="btn btn-success w-100" @click="triggerImport">
          <span class="me-2">📂</span>选择备份文件
        </button>
      </div>
    </div>

    <div v-if="message" class="alert mt-3" :class="messageClass" role="alert" style="animation: fadeIn 0.3s ease;">
      {{ message }}
    </div>
  </div>
</template>

<script>
import { storage } from '../utils/storage'
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem'

export default {
  name: 'Settings',
  data() {
    return {
      learnedCount: 0,
      message: '',
      messageClass: ''
    }
  },
  mounted() {
    this.updateStats()
  },
  methods: {
    goBack() {
      this.$router.back()
    },
    updateStats() {
      const records = storage.getAllRecordsSorted()
      this.learnedCount = records.length
    },
    async exportData() {
      const records = storage.getRecords()
      const exportObj = {
        version: 1,
        exportDate: new Date().toISOString(),
        records: records
      }

      const date = new Date().toISOString().split('T')[0]
      const filename = `古诗词背诵备份_${date}.json`
      const content = JSON.stringify(exportObj, null, 2)

      try {
        const result = await Filesystem.writeFile({
          path: filename,
          data: content,
          directory: Directory.Documents,
          encoding: Encoding.UTF8
        })

        this.showMessage(`导出成功！文件已保存到"文档"目录：${filename}`, 'alert-success')
      } catch (err) {
        console.error('Export error:', err)
        this.showMessage('导出失败：' + err.message, 'alert-danger')
      }
    },
    triggerImport() {
      this.$refs.fileInput.click()
    },
    handleFileSelect(event) {
      const file = event.target.files[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result)

          if (!data.records || typeof data.records !== 'object') {
            throw new Error('无效的备份文件格式')
          }

          if (!confirm('导入将覆盖当前所有记录，确定要继续吗？')) {
            return
          }

          storage.saveRecords(data.records)
          this.updateStats()
          this.showMessage(`导入成功！已恢复 ${Object.keys(data.records).length} 条记录。`, 'alert-success')
        } catch (err) {
          this.showMessage('导入失败：' + err.message, 'alert-danger')
        }
      }
      reader.onerror = () => {
        this.showMessage('读取文件失败', 'alert-danger')
      }
      reader.readAsText(file)

      event.target.value = ''
    },
    showMessage(text, className) {
      this.message = text
      this.messageClass = className
      setTimeout(() => {
        this.message = ''
        this.messageClass = ''
      }, 3000)
    }
  }
}
</script>

<style scoped>
.btn-primary {
  background: linear-gradient(135deg, #274a78 0%, #1c3557 100%);
  border: none;
  color: #fff6e5;
  font-weight: 600;
  padding: 12px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(39, 74, 120, 0.3);
}

.btn-success {
  background: linear-gradient(135deg, #4c7d6c 0%, #375c4f 100%);
  border: none;
  color: #fff6e5;
  font-weight: 600;
  padding: 12px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.btn-success:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(76, 125, 108, 0.3);
}
</style>
