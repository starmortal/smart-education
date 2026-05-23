<template>
  <div class="plan-card-enhanced" :class="urgencyClass">
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

      <!-- AI建议区域 -->
      <div v-if="showAISuggestion" class="ai-suggestion">
        <div class="suggestion-header" @click="toggleAISuggestion">
          <span class="suggestion-title">🤖 AI建议</span>
          <el-icon :class="{ rotated: aiSuggestionExpanded }">
            <ArrowDown />
          </el-icon>
        </div>
        
        <transition name="suggestion-content">
          <div v-show="aiSuggestionExpanded" class="suggestion-content" v-loading="loadingAI">
            <div v-if="aiSuggestion" class="suggestion-list">
              <div class="suggestion-item">
                <el-icon color="#409eff"><Target /></el-icon>
                <span>{{ aiSuggestion.todayGoal || '今日目标：完成30%进度' }}</span>
              </div>
              <div class="suggestion-item">
                <el-icon color="#67c23a"><Clock /></el-icon>
                <span>{{ aiSuggestion.estimatedTime || '预计用时：2小时' }}</span>
              </div>
              <div class="suggestion-item">
                <el-icon color="#e6a23c"><Document /></el-icon>
                <span>{{ aiSuggestion.resources || '学习资源：已准备3个视频教程' }}</span>
              </div>
              <div class="suggestion-item">
                <el-icon color="#f56c6c"><Timer /></el-icon>
                <span>{{ aiSuggestion.bestTimeSlot || '最佳时段：19:00-21:00' }}</span>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </div>

    <div class="card-footer">
      <el-button 
        v-if="plan.planStatus === 'not_started'"
        type="primary" 
        size="small"
        :icon="VideoPlay"
        @click="handleStartLearning"
      >
        开始学习
      </el-button>
      <el-button 
        v-else-if="plan.planStatus === 'in_progress'"
        type="success" 
        size="small"
        :icon="VideoPlay"
        @click="handleStartLearning"
      >
        继续学习
      </el-button>
      <el-button 
        v-else
        type="info" 
        size="small"
        :icon="Check"
        disabled
      >
        已完成
      </el-button>
      
      <el-button size="small" :icon="Document" @click="handleViewDetails">
        查看详情
      </el-button>
      <el-button size="small" :icon="Edit" @click="handleAdjustPlan">
        调整计划
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { 
  Clock, 
  ArrowDown, 
  Target, 
  Document, 
  Timer, 
  VideoPlay, 
  Check, 
  Edit 
} from '@element-plus/icons-vue';
import dayjs from 'dayjs';
import axios from 'axios';

const props = defineProps({
  plan: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['start-learning', 'view-details', 'adjust-plan']);

const aiSuggestionExpanded = ref(false);
const loadingAI = ref(false);
const aiSuggestion = ref(null);

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

// 是否显示AI建议
const showAISuggestion = computed(() => {
  return props.plan.planStatus !== 'completed';
});

// 切换AI建议展开状态
function toggleAISuggestion() {
  aiSuggestionExpanded.value = !aiSuggestionExpanded.value;
  if (aiSuggestionExpanded.value && !aiSuggestion.value) {
    fetchAISuggestion();
  }
}

// 获取AI建议
async function fetchAISuggestion() {
  loadingAI.value = true;
  
  try {
    const response = await axios.post('http://localhost:3001/api/ai/text-answer', {
      prompt: `学习计划：${props.plan.planTitle}，当前进度：${props.plan.progress}%，剩余时间：${remainingDays.value}天。请简短给出：1.今日目标 2.预计时长 3.学习资源建议 4.最佳学习时段。每项不超过15字。`
    });
    
    const answer = response.data?.data?.answer || '';
    // 解析AI回复
    aiSuggestion.value = parseAIResponse(answer);
    
  } catch (error) {
    console.error('获取AI建议失败：', error);
    // 降级方案
    aiSuggestion.value = {
      todayGoal: `今日目标：完成${Math.min(30, 100 - props.plan.progress)}%进度`,
      estimatedTime: '预计用时：2小时',
      resources: '学习资源：已准备相关教程',
      bestTimeSlot: '最佳时段：根据您的习惯安排'
    };
  } finally {
    loadingAI.value = false;
  }
}

// 解析AI回复
function parseAIResponse(answer) {
  // 简单解析，实际可以更复杂
  return {
    todayGoal: answer.split('\n')[0] || '今日目标：稳步推进',
    estimatedTime: answer.split('\n')[1] || '预计用时：2小时',
    resources: answer.split('\n')[2] || '学习资源：已准备',
    bestTimeSlot: answer.split('\n')[3] || '最佳时段：灵活安排'
  };
}

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
function handleStartLearning() {
  emit('start-learning', props.plan);
}

function handleViewDetails() {
  emit('view-details', props.plan);
}

function handleAdjustPlan() {
  emit('adjust-plan', props.plan);
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

.ai-suggestion {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 12px;
  margin-top: 12px;
}

.suggestion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  user-select: none;
}

.suggestion-header:hover {
  opacity: 0.8;
}

.suggestion-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.suggestion-header .el-icon {
  transition: transform 0.3s ease;
  color: #409eff;
}

.suggestion-header .el-icon.rotated {
  transform: rotate(180deg);
}

.suggestion-content {
  margin-top: 12px;
}

.suggestion-content-enter-active,
.suggestion-content-leave-active {
  transition: all 0.3s ease;
}

.suggestion-content-enter-from,
.suggestion-content-leave-to {
  opacity: 0;
  max-height: 0;
}

.suggestion-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #666;
}

.card-footer {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.card-footer :deep(.el-button) {
  flex: 1;
  min-width: 80px;
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
  
  .card-footer {
    flex-direction: column;
  }
  
  .card-footer :deep(.el-button) {
    width: 100%;
  }
}
</style>
