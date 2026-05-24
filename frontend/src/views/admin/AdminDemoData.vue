<template>
  <div class="admin-demo-page">
    <el-row :gutter="14">
      <el-col :span="14">
        <el-card shadow="never" class="panel-card">
          <template #header>
            <div class="card-head">
              <span>演示数据包</span>
              <el-tag :type="status.imported ? 'success' : 'info'" effect="plain" size="small">
                {{ status.imported ? '已导入' : '未导入' }}
              </el-tag>
            </div>
          </template>

          <el-skeleton v-if="loading" :rows="6" animated />
          <template v-else>
            <p class="desc">{{ status.packInfo?.description }}</p>
            <el-descriptions :column="1" border size="small" class="info-block">
              <el-descriptions-item label="数据包 ID">{{ status.packInfo?.packId }}</el-descriptions-item>
              <el-descriptions-item label="版本">{{ status.packInfo?.version }}</el-descriptions-item>
              <el-descriptions-item label="数据文件">{{ status.seedFile }}</el-descriptions-item>
              <el-descriptions-item label="导入时间">
                {{ status.importedAt ? formatTime(status.importedAt) : '—' }}
              </el-descriptions-item>
            </el-descriptions>

            <div v-if="status.counts" class="count-grid">
              <div
                v-for="(count, name) in status.counts"
                :key="name"
                class="count-item"
              >
                <span class="count-num">{{ count }}</span>
                <span class="count-label">{{ countLabel(name) }}</span>
              </div>
            </div>

            <div class="actions">
              <el-button
                type="primary"
                :loading="importing"
                :disabled="status.imported"
                @click="handleImport"
              >
                导入演示数据
              </el-button>
              <el-button
                type="danger"
                plain
                :loading="removing"
                :disabled="!status.imported"
                @click="handleRemove"
              >
                清除演示数据
              </el-button>
              <el-button @click="loadStatus">刷新状态</el-button>
            </div>
          </template>
        </el-card>
      </el-col>

      <el-col :span="10">
        <el-card shadow="never" class="panel-card">
          <template #header>演示账号（导入后可用）</template>
          <el-table :data="status.packInfo?.accounts || []" size="small" stripe>
            <el-table-column prop="nickname" label="昵称" width="100" />
            <el-table-column prop="email" label="邮箱" min-width="160" />
            <el-table-column prop="password" label="密码" width="100" />
            <el-table-column prop="tip" label="说明" min-width="120" show-overflow-tooltip />
          </el-table>
          <el-alert
            class="tip-alert"
            type="info"
            :closable="false"
            show-icon
            title="使用说明"
            description="导入后使用上表账号登录用户端，即可在各页面看到演示数据。清除后可再次导入，不会重复叠加。"
          />
        </el-card>

        <el-card shadow="never" class="panel-card module-card">
          <template #header>涵盖模块</template>
          <div class="module-tags">
            <el-tag v-for="m in modules" :key="m" size="small" effect="plain">{{ m }}</el-tag>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  getDemoSeedStatus,
  importDemoSeed,
  removeDemoSeed,
} from '@/api/admin';

const loading = ref(false);
const importing = ref(false);
const removing = ref(false);
const status = ref({ imported: false, packInfo: {}, counts: null });

const modules = [
  'AI 助手', '知识库', '错题集', '学习计划', '笔记',
  '学习社区', '意见反馈', '通知中心', '个人中心/考试',
];

const countLabels = {
  users: '用户',
  exams: '考试',
  studyPlans: '计划',
  errorQuestions: '错题',
  notes: '笔记',
  knowledgeBases: '知识库',
  knowledgeFiles: '知识库文件',
  assistants: '助手',
  topics: '对话',
  questions: '社区问题',
  answers: '社区回答',
  feedbacks: '反馈',
  notifications: '通知',
  notificationSettings: '通知设置',
};

function countLabel(key) {
  return countLabels[key] || key;
}

function formatTime(value) {
  return new Date(value).toLocaleString('zh-CN');
}

async function loadStatus() {
  loading.value = true;
  try {
    const res = await getDemoSeedStatus();
    status.value = res.data || {};
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
}

async function handleImport() {
  try {
    await ElMessageBox.confirm(
      '将导入演示用户及关联数据。若已导入请先清除。是否继续？',
      '导入演示数据',
      { type: 'warning', confirmButtonText: '导入', cancelButtonText: '取消' }
    );
  } catch {
    return;
  }

  importing.value = true;
  try {
    const res = await importDemoSeed();
    ElMessage.success(res.message || '导入成功');
    await loadStatus();
  } catch (error) {
    console.error(error);
  } finally {
    importing.value = false;
  }
}

async function handleRemove() {
  try {
    await ElMessageBox.confirm(
      '将删除演示账号及全部关联数据，删除后可重新导入。是否继续？',
      '清除演示数据',
      { type: 'warning', confirmButtonText: '清除', cancelButtonText: '取消' }
    );
  } catch {
    return;
  }

  removing.value = true;
  try {
    const res = await removeDemoSeed();
    ElMessage.success(res.message || '已清除');
    await loadStatus();
  } catch (error) {
    console.error(error);
  } finally {
    removing.value = false;
  }
}

onMounted(loadStatus);
</script>

<style scoped>
.admin-demo-page {
  max-width: 1200px;
}

.panel-card {
  margin-bottom: 14px;
  border-radius: 8px;
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
}

.desc {
  margin: 0 0 12px;
  color: #64748b;
  line-height: 1.6;
  font-size: 13px;
}

.info-block {
  margin-bottom: 14px;
}

.count-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 16px;
}

.count-item {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 8px;
  text-align: center;
}

.count-num {
  display: block;
  font-size: 18px;
  font-weight: 700;
  color: #2563eb;
}

.count-label {
  font-size: 11px;
  color: #64748b;
}

.actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tip-alert {
  margin-top: 12px;
}

.module-card {
  margin-top: 0;
}

.module-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
</style>
