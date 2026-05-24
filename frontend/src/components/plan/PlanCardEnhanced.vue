<template>
  <div class="plan-card-enhanced" :class="urgencyClass" @click="handleViewDetails">
    <div class="card-header">
      <div class="header-left">
        <span class="urgency-icon">{{ urgencyIcon }}</span>
        <span class="urgency-text">{{ urgencyText }}</span>
        <span class="plan-title">{{ plan.planTitle }}</span>
      </div>
      <div class="header-right">
        <el-tag :type="statusTagType" size="small">
          {{ getSubjectText(plan.subject) }}
        </el-tag>
      </div>
    </div>

    <div class="card-body">
      <div class="progress-section">
        <div class="progress-info">
          <span class="progress-label">学习进度</span>
          <span class="progress-value">{{ plan.progress }}%</span>
        </div>
        <el-progress
          :percentage="plan.progress"
          :stroke-width="10"
          :color="progressColor"
          :show-text="false"
        />
      </div>

      <div class="time-info">
        <el-icon><Clock /></el-icon>
        <span>{{ formatTimeRange(plan.startTime, plan.endTime) }}</span>
        <span v-if="remainingDays > 0" class="remaining-days">
          剩余{{ remainingDays }}天
        </span>
        <span v-else-if="remainingDays === 0" class="remaining-days today">
          今天截止
        </span>
        <span v-else class="remaining-days overdue">
          已逾期{{ Math.abs(remainingDays) }}天
        </span>
      </div>

      <p v-if="plan.aiReason" class="ai-reason-text">
        <span class="ai-reason-label">AI制定理由</span>{{ plan.aiReason }}
      </p>

    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { Clock } from '@element-plus/icons-vue';
import dayjs from 'dayjs';

const props = defineProps({
  plan: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['view-details']);

// 紧急程度
const urgencyLevel = computed(() => {
  const days = remainingDays.value;
  if (days < 0) return 'overdue';
  if (days === 0) return 'urgent';
  if (days <= 2) return 'important';
  return 'normal';
});

const urgencyClass = computed(() => `urgency-${urgencyLevel.value}`);

const urgencyIcon = computed(() => {
  const icons = {
    overdue: '⚠️',
    urgent: '🔥',
    important: '⏰',
    normal: '📅'
  };
  return icons[urgencyLevel.value];
});

const urgencyText = computed(() => {
  const texts = {
    overdue: '已逾期',
    urgent: '紧急',
    important: '进行中',
    normal: '计划中'
  };
  return texts[urgencyLevel.value];
});

// 剩余天数
const remainingDays = computed(() => {
  return dayjs(props.plan.endTime).diff(dayjs(), 'day');
});

// 进度条颜色
const progressColor = computed(() => {
  const progress = props.plan.progress;
  if (progress < 30) return '#f56c6c';
  if (progress < 70) return '#e6a23c';
  return '#67c23a';
});

// 状态标签类型
const statusTagType = computed(() => {
  const statusMap = {
    not_started: 'info',
    in_progress: 'primary',
    completed: 'success',
    overdue: 'danger'
  };
  return statusMap[props.plan.planStatus] || 'info';
});

// 格式化时间范围
function formatTimeRange(start, end) {
  return `${dayjs(start).format('MM-DD')} 至 ${dayjs(end).format('MM-DD')}`;
}

// 获取科目文本
function getSubjectText(subject) {
  const map = {
    math: '数学',
    chinese: '语文',
    english: '英语',
    physics: '物理',
    chemistry: '化学',
    biology: '生物',
    history: '历史',
    geography: '地理',
    politics: '政治'
  };
  return map[subject] || subject;
}

// 事件处理
function handleViewDetails() {
  emit('view-details', props.plan);
}
</script>

<style scoped>
.plan-card-enhanced {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  border-left: 4px solid #409eff;
  cursor: pointer;
}

.plan-card-enhanced:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.plan-card-enhanced.urgency-overdue {
  border-left-color: #f56c6c;
  background: linear-gradient(to right, #fff5f5 0%, white 10%);
}

.plan-card-enhanced.urgency-urgent {
  border-left-color: #f56c6c;
  background: linear-gradient(to right, #fff9f5 0%, white 10%);
}

.plan-card-enhanced.urgency-important {
  border-left-color: #409eff;
}

.plan-card-enhanced.urgency-normal {
  border-left-color: #909399;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.urgency-icon {
  font-size: 20px;
}

.urgency-text {
  font-size: 12px;
  font-weight: 600;
  color: #666;
}

.plan-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.card-body {
  margin-bottom: 16px;
}

.progress-section {
  margin-bottom: 12px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.progress-label {
  font-size: 14px;
  color: #666;
}

.progress-value {
  font-size: 14px;
  font-weight: 600;
  color: #409eff;
}

.time-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
}

.remaining-days {
  margin-left: auto;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.remaining-days.today {
  background: #fff9f5;
  color: #e6a23c;
}

.remaining-days.overdue {
  background: #fff5f5;
  color: #f56c6c;
}

.ai-reason-text {
  margin: 8px 0 0;
  font-size: 11px;
  color: #6b8578;
  line-height: 1.6;
}

.ai-reason-label {
  display: inline-block;
  margin-right: 6px;
  padding: 1px 6px;
  font-size: 10px;
  color: #2d8a5e;
  background: #e8f5ee;
  border-radius: 2px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header-left {
    flex-wrap: wrap;
  }
  
  .plan-title {
    width: 100%;
    margin-top: 4px;
  }
}
</style>
