<template>
  <div class="container py-4">
    <div class="d-flex align-items-center mb-4" style="animation: fadeInDown 0.6s ease;">
      <button class="btn me-3" style="background: #2c3e50; color: #fff6e5; border: none; box-shadow: 0 4px 12px rgba(44, 62, 80, 0.15); font-family: 'ZCOOL XiaoWei', serif;" @click="goBack">
        ← 返回
      </button>
      <h4 class="mb-0" style="color: #2c3e50; font-weight: 800; font-family: 'ZCOOL XiaoWei', serif; letter-spacing: 2px;">设置</h4>
    </div>

    <!-- 人员管理 -->
    <div class="card mb-3" style="animation: fadeInUp 0.6s ease;">
      <div class="card-header" style="background: #522c5e; color: #fff6e5;">
        <h5 class="mb-0"><span class="me-2">👤</span> 人员管理</h5>
      </div>
      <div class="card-body">
        <p class="text-muted mb-3" style="font-size: 0.9rem;">
          可以分别为不同的人记录学习进度（如"我"、"孩子"），数据完全隔离。
        </p>

        <div class="list-group mb-3">
          <div
            v-for="p in persons"
            :key="p.id"
            class="list-group-item d-flex justify-content-between align-items-center"
            :class="{ 'active-person': p.id === currentPerson.id }"
          >
            <div class="person-info">
              <div v-if="editingPersonId === p.id" class="inline-edit">
                <input v-model="editingName" class="form-control form-control-sm" maxlength="20" @keyup.enter="saveRename(p)" />
              </div>
              <strong v-else>{{ p.name }}</strong>
              <span v-if="p.id === currentPerson.id" class="badge ms-2" style="background: #522c5e; color: #fff6e5;">当前</span>
              <span v-if="p.isDefault" class="badge ms-2 bg-secondary">默认</span>
              <div class="text-muted small">已学 {{ statsMap[p.id] || 0 }} 首</div>
            </div>
            <div class="d-flex" style="gap: 6px; flex-wrap: wrap; justify-content: flex-end;">
              <template v-if="editingPersonId === p.id">
                <button class="btn btn-sm btn-primary" @click="saveRename(p)">保存</button>
                <button class="btn btn-sm btn-quiet" @click="cancelRename">取消</button>
              </template>
              <template v-else-if="pendingDeleteId === p.id">
                <span class="delete-question">确认删除？</span>
                <button class="btn btn-sm btn-danger" @click="confirmDelete(p)">确认</button>
                <button class="btn btn-sm btn-quiet" @click="pendingDeleteId = null">取消</button>
              </template>
              <template v-else>
              <button
                v-if="p.id !== currentPerson.id"
                class="btn btn-sm"
                style="background: #274a78; color: #fff6e5;"
                @click="switchTo(p.id)"
              >切换</button>
              <button
                class="btn btn-sm"
                style="background: #f6f3eb; color: #785448; border: 1px solid #785448;"
                @click="startRename(p)"
              >重命名</button>
              <button
                v-if="!p.isDefault"
                class="btn btn-sm"
                style="background: #c8392f; color: #fff6e5;"
                @click="deletePerson(p)"
              >删除</button>
              </template>
            </div>
          </div>
        </div>

        <div class="input-group">
          <input
            v-model="newPersonName"
            type="text"
            class="form-control"
            placeholder="输入新人员名称（如：孩子）"
            maxlength="20"
            @keyup.enter="addPerson"
          />
          <button
            class="btn"
            style="background: #522c5e; color: #fff6e5;"
            :disabled="!newPersonName.trim()"
            @click="addPerson"
          >
            + 添加
          </button>
        </div>
      </div>
    </div>

    <div class="card mb-3" style="animation: fadeInUp 0.6s ease 0.1s both;">
      <div class="card-header" style="background: #274a78; color: #fff6e5;">
        <h5 class="mb-0"><span class="me-2">📤</span> 导出进度</h5>
      </div>
      <div class="card-body">
        <p class="text-muted mb-3">将「{{ currentPerson.name }}」的背诵记录导出为文件，可用于备份或迁移到其他设备。</p>
        <div class="alert alert-info mb-3" role="alert">
          <strong>当前记录：</strong>已学习 {{ learnedCount }} 首诗文
        </div>
        <button class="btn btn-primary w-100" @click="exportData">
          <span class="me-2">💾</span>导出备份文件
        </button>
      </div>
    </div>

    <div class="card" style="animation: fadeInUp 0.6s ease 0.2s both;">
      <div class="card-header" style="background: var(--color-success); color: #fff;">
        <h5 class="mb-0"><span class="me-2">📥</span> 导入进度</h5>
      </div>
      <div class="card-body">
        <p class="text-muted mb-3">将备份文件恢复到「{{ currentPerson.name }}」名下，会覆盖当前记录。</p>
        <div class="alert alert-warning mb-3" role="alert">
          <strong>注意：</strong>导入会覆盖当前人员的所有记录，请确保已备份现有数据。
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
import { Share } from '@capacitor/share'
import { eventBus, RECORDS_CHANGED } from '../utils/eventBus'

export default {
  name: 'Settings',
  data() {
    return {
      persons: [],
      currentPerson: null,
      statsMap: {},
      newPersonName: '',
      learnedCount: 0,
      message: '',
      messageClass: '',
      editingPersonId: null,
      editingName: '',
      pendingDeleteId: null
    }
  },
  created() {
    this.refreshPersons()
  },
  methods: {
    goBack() {
      this.$router.back()
    },
    refreshPersons() {
      this.persons = storage.getPersons()
      this.currentPerson = storage.getCurrentPerson()
      this.statsMap = {}
      this.persons.forEach(p => {
        this.statsMap[p.id] = storage.getPersonStats(p.id).total
      })
      this.learnedCount = this.statsMap[this.currentPerson.id] || 0
    },
    addPerson() {
      const name = this.newPersonName.trim()
      if (!name) return
      const p = storage.addPerson(name)
      if (p) {
        this.newPersonName = ''
        this.refreshPersons()
        this.showMessage(`已添加人员：${p.name}`, 'alert-success')
      }
    },
    startRename(person) {
      this.pendingDeleteId = null
      this.editingPersonId = person.id
      this.editingName = person.name
    },
    cancelRename() {
      this.editingPersonId = null
      this.editingName = ''
    },
    saveRename(person) {
      const trimmed = this.editingName.trim()
      if (!trimmed) {
        this.showMessage('名称不能为空', 'alert-danger')
        return
      }
      if (storage.updatePersonName(person.id, trimmed)) {
        this.cancelRename()
        this.refreshPersons()
        this.showMessage('已更新', 'alert-success')
      }
    },
    deletePerson(person) {
      this.editingPersonId = null
      this.pendingDeleteId = person.id
    },
    confirmDelete(person) {
      if (storage.deletePerson(person.id)) {
        this.pendingDeleteId = null
        this.refreshPersons()
        this.showMessage(`已删除：${person.name}`, 'alert-success')
      }
    },
    switchTo(personId) {
      storage.setCurrentPerson(personId)
      this.refreshPersons()
    },
    async exportData() {
      const records = storage.getRecords()
      const exportObj = {
        version: 1,
        exportDate: new Date().toISOString(),
        person: {
          id: this.currentPerson.id,
          name: this.currentPerson.name
        },
        records: records
      }

      const date = new Date().toISOString().split('T')[0]
      const safeName = this.currentPerson.name.replace(/[\\/:*?"<>|]/g, '_')
      const filename = `古诗词背诵_${safeName}_${date}.json`
      const content = JSON.stringify(exportObj, null, 2)

      try {
        const result = await Filesystem.writeFile({
          path: filename,
          data: content,
          directory: Directory.Cache,
          encoding: Encoding.UTF8
        })

        const uri = result.uri

        await Share.share({
          title: '分享备份文件',
          text: `${this.currentPerson.name}的古诗词背诵进度备份`,
          url: uri,
          dialogTitle: '分享备份文件'
        })

        this.showMessage('分享成功！', 'alert-success')
      } catch (err) {
        if (err.message && err.message.includes('Share canceled')) {
          return
        }
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

          if (!data.records || typeof data.records !== 'object' || Array.isArray(data.records)) {
            throw new Error('无效的备份文件格式')
          }

          const invalidRecord = Object.values(data.records).some(record =>
            !record || typeof record !== 'object' || Array.isArray(record) ||
            typeof record.firstLearnDate !== 'string' ||
            !Array.isArray(record.reviewDates)
          )
          if (invalidRecord) {
            throw new Error('备份文件中包含无效的学习记录')
          }

          if (!confirm(`导入将覆盖「${this.currentPerson.name}」的所有记录，确定要继续吗？`)) {
            return
          }

          storage.saveRecords(data.records)
          this.refreshPersons()
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
  background: linear-gradient(135deg, var(--color-success) 0%, var(--color-success-dark) 100%);
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

.active-person {
  background: rgba(82, 44, 94, 0.05) !important;
  border-left: 4px solid #522c5e;
}

.list-group-item {
  border-color: #e5dfd3;
}

.person-info {
  min-width: 120px;
}

.inline-edit {
  max-width: 160px;
}

.btn-quiet {
  color: var(--color-muted);
  background: var(--color-surface-muted);
  border: 1px solid var(--color-border);
}

.btn-danger {
  color: #fff;
  background: var(--color-danger);
}

.delete-question {
  align-self: center;
  color: var(--color-danger);
  font-size: 0.85rem;
  font-weight: 700;
}
</style>
