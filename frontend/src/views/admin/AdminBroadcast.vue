<template>
  <div class="admin-broadcast">
    <el-row :gutter="14">
      <el-col :xs="24" :lg="14">
        <el-card shadow="never" class="broadcast-card">
          <template #header>
            <div class="card-header">
              <el-icon><Bell /></el-icon>
              <span>发送全站系统公告</span>
            </div>
          </template>

          <el-alert
            title="公告将推送到所有已开启「系统公告」通知的用户，可在用户端「通知中心」查看。"
            type="info"
            show-icon
            :closable="false"
            class="tip-alert"
          />

          <el-form
            ref="formRef"
            :model="form"
            :rules="rules"
            label-position="top"
            class="broadcast-form"
          >
            <el-form-item label="公告标题" prop="title">
              <el-input
                v-model="form.title"
                placeholder="例如：平台维护通知"
                maxlength="80"
                show-word-limit
              />
            </el-form-item>

            <el-form-item label="公告内容" prop="content">
              <el-input
                v-model="form.content"
                type="textarea"
                :rows="7"
                placeholder="请输入公告正文，支持换行"
                maxlength="2000"
                show-word-limit
              />
            </el-form-item>

            <el-form-item>
              <el-button type="primary" size="small" :loading="submitting" @click="handleSubmit">
                立即发送
              </el-button>
              <el-button size="small" @click="resetForm">清空</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="10">
        <el-card shadow="never" class="preview-card">
          <template #header>
            <span>预览效果</span>
          </template>
          <div class="preview-box">
            <div class="preview-tag">系统公告</div>
            <h3 class="preview-title">{{ form.title || '公告标题' }}</h3>
            <p class="preview-content" v-html="previewHtml"></p>
            <div class="preview-time">刚刚</div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Bell } from '@element-plus/icons-vue';
import { broadcastAnnouncement } from '@/api/admin';

const formRef = ref(null);
const submitting = ref(false);

const form = reactive({
  title: '',
  content: '',
});

const rules = {
  title: [
    { required: true, message: '请输入公告标题', trigger: 'blur' },
    { min: 2, max: 80, message: '标题长度 2-80 字', trigger: 'blur' },
  ],
  content: [
    { required: true, message: '请输入公告内容', trigger: 'blur' },
    { min: 4, message: '内容至少 4 个字', trigger: 'blur' },
  ],
};

const previewHtml = computed(() => {
  const text = form.content || '在此输入公告内容...';
  return text.replace(/\n/g, '<br>');
});

const resetForm = () => {
  form.title = '';
  form.content = '';
  formRef.value?.clearValidate();
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
  } catch {
    return;
  }

  try {
    await ElMessageBox.confirm(
      '确定向全平台用户发送该系统公告吗？此操作不可撤销。',
      '确认发送',
      { type: 'warning', confirmButtonText: '确认发送', cancelButtonText: '取消' }
    );
  } catch {
    return;
  }

  submitting.value = true;
  try {
    const res = await broadcastAnnouncement(form.title, form.content);
    const result = res.data || {};
    ElMessage.success(res.message || `已发送给 ${result.sent || 0} 位用户`);
    resetForm();
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped>
.broadcast-card,
.preview-card {
  border-radius: 10px;
  border: none;
  box-shadow: 0 2px 12px rgba(15, 23, 42, 0.05);
  margin-bottom: 12px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  font-size: 13px;
  color: #0f172a;
}

.card-header .el-icon {
  font-size: 15px;
}

.tip-alert {
  margin-bottom: 14px;
}

.broadcast-form {
  max-width: 560px;
}

.preview-box {
  background: linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%);
  border-radius: 8px;
  padding: 14px;
  border: 1px solid #e2e8f0;
}

.preview-tag {
  display: inline-block;
  padding: 2px 8px;
  background: #3b82f6;
  color: #fff;
  font-size: 11px;
  border-radius: 20px;
  margin-bottom: 8px;
}

.preview-title {
  margin: 0 0 8px;
  font-size: 15px;
  color: #0f172a;
}

.preview-content {
  margin: 0;
  line-height: 1.6;
  color: #475569;
  font-size: 12px;
}

.preview-time {
  margin-top: 10px;
  font-size: 11px;
  color: #94a3b8;
}
</style>
