<template>
  <div v-if="plan" class="plan-inline-detail">
    <!-- 查看模式 -->
    <template v-if="mode === 'view'">
      <div class="detail-header">
        <h2 class="detail-title">{{ plan.planTitle }}</h2>
        <div class="detail-meta-row">
          <el-tag size="small" type="primary">{{ subjectText }}</el-tag>
          <el-tag size="small" :type="statusTagType">{{ statusText }}</el-tag>
        </div>
      </div>

      <div class="detail-info-grid">
        <div class="info-item">
          <span class="info-label">当前进度</span>
          <span class="info-value">{{ plan.progress }}%</span>
        </div>
        <div class="info-item">
          <span class="info-label">目标进度</span>
          <span class="info-value">{{ plan.targetProgress ?? 100 }}%</span>
        </div>
        <div class="info-item">
          <span class="info-label">开始时间</span>
          <span class="info-value">{{ formatDateTime(plan.startTime) }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">结束时间</span>
          <span class="info-value">{{ formatDateTime(plan.endTime) }}</span>
        </div>
      </div>

      <div class="detail-block">
        <div class="block-label">计划描述</div>
        <div class="block-content">{{ plan.description || '暂无描述' }}</div>
      </div>

      <div v-if="plan.aiReason" class="detail-block ai-reason-block">
        <div class="block-label">AI制定理由</div>
        <p class="ai-reason-text">{{ plan.aiReason }}</p>
      </div>

      <div class="detail-actions">
        <el-button type="danger" plain :icon="Delete" @click="$emit('delete')">删除计划</el-button>
        <div class="actions-spacer" />
        <el-button type="primary" :icon="Edit" @click="$emit('edit')">编辑计划</el-button>
      </div>
    </template>

    <!-- 编辑模式 -->
    <template v-else>
      <div class="edit-header">
        <h2 class="detail-title">编辑计划</h2>
      </div>
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="96px"
        class="plan-edit-form"
      >
        <el-form-item label="计划标题" prop="planTitle">
          <el-input v-model="form.planTitle" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="关联科目" prop="subject">
          <el-select v-model="form.subject" placeholder="请选择科目" style="width: 100%">
            <el-option
              v-for="opt in subjectOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="计划周期" prop="timeRange">
          <el-date-picker
            v-model="form.timeRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 100%"
            :disabled-date="disabledPastDate"
          />
        </el-form-item>
        <el-form-item label="计划描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="4"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="计划状态" prop="planStatus">
          <el-select v-model="form.planStatus" style="width: 100%">
            <el-option label="未开始" value="not_started" />
            <el-option label="进行中" value="in_progress" />
            <el-option label="已完成" value="completed" />
          </el-select>
        </el-form-item>
        <el-form-item label="当前进度">
          <el-slider
            v-model="form.progress"
            :min="0"
            :max="100"
            show-input
            @change="onProgressChange"
          />
          <p v-if="progressHint" class="progress-hint">{{ progressHint }}</p>
        </el-form-item>
        <el-form-item label="目标进度">
          <el-slider v-model="form.targetProgress" :min="0" :max="100" show-input />
        </el-form-item>
      </el-form>

      <div class="detail-actions">
        <el-button type="danger" plain :icon="Delete" @click="$emit('delete')">删除计划</el-button>
        <div class="actions-spacer" />
        <el-button @click="$emit('cancel-edit')">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { Edit, Delete } from '@element-plus/icons-vue';
import { getSubjectName } from '@/utils/userSubjects';

const props = defineProps({
  plan: { type: Object, default: null },
  mode: { type: String, default: 'view' },
  subjectOptions: { type: Array, default: () => [] },
  saving: { type: Boolean, default: false },
  progressHint: { type: String, default: '' },
  disabledPastDate: { type: Function, default: null },
  formatDateTime: { type: Function, required: true },
  getStatusText: { type: Function, required: true },
  getStatusTagType: { type: Function, required: true },
});

const emit = defineEmits(['edit', 'delete', 'cancel-edit', 'save', 'progress-change']);

const formRef = ref(null);

const form = ref({
  id: '',
  planTitle: '',
  subject: '',
  timeRange: [],
  description: '',
  planStatus: 'not_started',
  progress: 0,
  targetProgress: 100,
});

const rules = {
  planTitle: [{ required: true, message: '请输入计划标题', trigger: 'blur' }],
  subject: [{ required: true, message: '请选择关联科目', trigger: 'change' }],
  timeRange: [{ required: true, message: '请选择计划周期', trigger: 'change' }],
  description: [{ required: true, message: '请输入计划描述', trigger: 'blur' }],
};

const subjectText = computed(() => getSubjectName(props.plan?.subject) || props.plan?.subject || '');
const statusText = computed(() => props.getStatusText(props.plan?.planStatus));
const statusTagType = computed(() => props.getStatusTagType(props.plan?.planStatus));

watch(
  () => [props.plan, props.mode],
  () => {
    if (props.plan && props.mode === 'edit') {
      form.value = {
        id: props.plan.id,
        planTitle: props.plan.planTitle,
        subject: props.plan.subject,
        timeRange: [new Date(props.plan.startTime), new Date(props.plan.endTime)],
        description: props.plan.description || '',
        planStatus: props.plan.planStatus,
        progress: props.plan.progress ?? 0,
        targetProgress: props.plan.targetProgress ?? 100,
      };
    }
  },
  { immediate: true }
);

function onProgressChange(val) {
  emit('progress-change', val);
}

async function handleSave() {
  try {
    await formRef.value?.validate();
    emit('save', { ...form.value });
  } catch {
    // validation failed
  }
}

defineExpose({ formRef });
</script>

<style scoped>
.plan-inline-detail {
  max-width: 720px;
  margin: 0 auto;
  padding: 8px 24px 32px;
}

.detail-header {
  margin-bottom: 20px;
}

.detail-title {
  margin: 0 0 12px;
  font-size: 22px;
  font-weight: 600;
  color: #1f2937;
  line-height: 1.4;
}

.detail-meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.detail-info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 20px;
  padding: 16px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 12px;
  color: #6b7280;
}

.info-value {
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
}

.detail-block {
  margin-bottom: 16px;
}

.block-label {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
}

.block-content {
  padding: 14px 16px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  font-size: 14px;
  color: #4b5563;
  line-height: 1.8;
  white-space: pre-wrap;
}

.ai-reason-block .ai-reason-text {
  margin: 0;
  padding: 12px 14px;
  background: #f0f9f4;
  border: 1px solid #cce8d6;
  border-radius: 4px;
  font-size: 12px;
  color: #4b6358;
  line-height: 1.7;
}

.edit-header {
  margin-bottom: 16px;
}

.plan-edit-form {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  padding: 20px 20px 8px;
  margin-bottom: 16px;
}

.progress-hint {
  margin: 6px 0 0;
  font-size: 12px;
  color: #2d8a5e;
}

.detail-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-top: 8px;
}

.actions-spacer {
  flex: 1;
}

@media (max-width: 640px) {
  .detail-info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
