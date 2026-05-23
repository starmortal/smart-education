<template>
  <div class="error-card-enhanced" :class="priorityClass">
    <div class="card-header">
      <div class="header-left">
        <span class="priority-icon">{{ priorityIcon }}</span>
        <span class="priority-text">{{ priorityText }}</span>
        <span class="error-title">{{ error.questionTitle }}</span>
      </div>
      <div class="header-right">
        <el-tag :type="subjectTagType" size="small">
          {{ getSubjectText(error.subject) }}
        </el-tag>
        <el-tag :type="typeTagType" size="small">
          {{ getTypeText(error.questionType) }}
        </el-tag>
      </div>
    </div>

    <div class="card-body">
      <div class="meta-info">
        <div class="meta-item">
          <el-icon><Clock /></el-icon>
          <span>添加于{{ formatDate(error.addTime) }}</span>
        </div>
        <div class="meta-item">
          <el-icon><RefreshRight /></el-icon>
          <span>已复习{{ error.reviewCount || 0 }}次</span>
        </div>
      </div>

      <div class="risk-section">
        <div class="risk-item">
          <div class="risk-label">
            <el-icon><Warning /></el-icon>
            <span>遗忘风险</span>
          </div>
          <div class="risk-value" :class="getRiskClass(forgettingRisk)">
            {{ forgettingRisk }}%
          </div>
        </div>
        <el-progress
          :percentage="forgettingRisk"
          :stroke-width="8"
          :color="getRiskColor(forgettingRisk)"
          :show-text="false"
        />
        <div class="risk-tip">
          {{ getRiskTip(forgettingRisk) }}
        </div>
      </div>

      <div class="mastery-section">
        <div class="mastery-header">
          <div class="mastery-label">
            <el-icon><TrendCharts /></el-icon>
            <span>掌握度</span>
          </div>
          <div class="mastery-value">{{ masteryLevel }}%</div>
        </div>
        <el-progress
          :percentage="masteryLevel"
          :stroke-width="8"
          :color="getMasteryColor(masteryLevel)"
          :show-text="false"
        />
      </div>

      <div class="ai-tip" v-if="aiTip">
        <div class="tip-icon">🤖</div>
        <div class="tip-content">
          <div class="tip-title">AI提示</div>
          <div class="tip-text">{{ aiTip }}</div>
        </div>
      </div>
    </div>

    <div class="card-footer">
      <el-button 
        type="primary" 
        size="small"
        :icon="VideoPlay"
        @click="handleStartReview"
      >
        开始复习
      </el-button>
      <el-button 
        size="small"
        :icon="Document"
        @click="handleViewAnalysis"
      >
        查看解析
      </el-button>
      <el-button 
        size="small"
        :icon="Clock"
        @click="handleDelay"
      >
        延后
      </el-button>
      <el-button 
        size="small"
        :icon="Check"
        type="success"
        @click="handleMarkMastered"
      >
        已掌握
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { 
  Clock, 
  RefreshRight, 
  Warning, 
  TrendCharts, 
  VideoPlay, 
  Document, 
  Check 
} from '@element-plus/icons-vue';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import axios from 'axios';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const props = defineProps({
  error: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['start-review', 'view-analysis', 'delay', 'mark-mastered']);

const forgettingRisk = ref(0);
const masteryLevel = ref(0);
const aiTip = ref('');

// 优先级
const priority = computed(() => {
  if (forgettingRisk.value >= 80) return 'urgent';
  if (forgettingRisk.value >= 50) return 'important';
  return 'normal';
});

const priorityClass = computed(() => `priority-${priority.value}`);

const priorityIcon = computed(() => {
  const icons = {
    urgent: '🔴',
    important: '🟡',
    normal: '🟢'
  };
  return icons[priority.value];
});

const priorityText = computed(() => {
  const texts = {
    urgent: '紧急',
    important: '重要',
    normal: '巩固'
  };
  return texts[priority.value];
});

// 标签类型
const subjectTagType = computed(() => 'primary');
const typeTagType = computed(() => 'info');

// 计算遗忘风险
function calculateForgettingRisk() {
  const daysSinceLastReview = dayjs().diff(props.error.lastReviewTime || props.error.addTime, 'day');
  const reviewCount = props.error.reviewCount || 0;
  
  // 艾宾浩斯遗忘曲线：1天、2天、4天、7天、15天
  const intervals = [1, 2, 4, 7, 15];
  const nextReviewDay = intervals[Math.min(reviewCount, intervals.length - 1)];
  
  if (daysSinceLastReview >= nextReviewDay) {
    return Math.min(100, 50 + (daysSinceLastReview - nextReviewDay) * 10);
  }
  
  return Math.max(0, 50 - (nextReviewDay - daysSinceLastReview) * 5);
}

// 计算掌握度
function calculateMasteryLevel() {
  const reviewCount = props.error.reviewCount || 0;
  const correctCount = props.error.correctCount || 0;
  const correctRate = reviewCount > 0 ? correctCount / reviewCount : 0;
  
  // 综合考虑复习次数和正确率
  const baseScore = Math.min(reviewCount * 20, 60);
  const bonusScore = correctRate * 40;
  
  return Math.min(100, Math.round(baseScore + bonusScore));
}

// 获取风险等级类名
function getRiskClass(risk) {
  if (risk >= 80) return 'risk-high';
  if (risk >= 50) return 'risk-medium';
  return 'risk-low';
}

// 获取风险颜色
function getRiskColor(risk) {
  if (risk >= 80) return '#f56c6c';
  if (risk >= 50) return '#e6a23c';
  return '#67c23a';
}

// 获取风险提示
function getRiskTip(risk) {
  if (risk >= 80) return '建议今日必须复习';
  if (risk >= 50) return '建议今日复习';
  return '掌握良好，继续保持';
}

// 获取掌握度颜色
function getMasteryColor(level) {
  if (level >= 80) return '#67c23a';
  if (level >= 50) return '#e6a23c';
  return '#f56c6c';
}

// 格式化日期
function formatDate(date) {
  return dayjs(date).fromNow();
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

// 获取题型文本
function getTypeText(type) {
  const map = {
    single_choice: '选择题',
    multiple_choice: '多选题',
    blank: '填空题',
    short_answer: '简答题',
    calculation: '计算题'
  };
  return map[type] || type;
}

// 获取AI提示
async function fetchAITip() {
  try {
    const response = await axios.post('http://localhost:3001/api/ai/text-answer', {
      prompt: `错题：${props.error.questionTitle}，科目：${getSubjectText(props.error.subject)}，遗忘风险：${forgettingRisk.value}%，掌握度：${masteryLevel.value}%。请用一句话（不超过20字）给出复习建议。`
    });
    
    aiTip.value = response.data?.data?.answer || generateDefaultTip();
    
  } catch (error) {
    console.error('获取AI提示失败：', error);
    aiTip.value = generateDefaultTip();
  }
}

// 生成默认提示
function generateDefaultTip() {
  if (forgettingRisk.value >= 80) {
    return '这道题遗忘风险很高，建议立即复习';
  } else if (masteryLevel.value < 50) {
    return '掌握度较低，建议多复习几次';
  } else if (masteryLevel.value >= 80) {
    return '掌握度不错，再复习一次可完全掌握';
  } else {
    return '建议先复习基础知识，再做这道题';
  }
}

// 事件处理
function handleStartReview() {
  emit('start-review', props.error);
}

function handleViewAnalysis() {
  emit('view-analysis', props.error);
}

function handleDelay() {
  emit('delay', props.error);
}

function handleMarkMastered() {
  emit('mark-mastered', props.error);
}

onMounted(() => {
  forgettingRisk.value = calculateForgettingRisk();
  masteryLevel.value = calculateMasteryLevel();
  fetchAITip();
});
</script>

<style scoped>
.error-card-enhanced {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  border-left: 4px solid #409eff;
}

.error-card-enhanced:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.error-card-enhanced.priority-urgent {
  border-left-color: #f56c6c;
  background: linear-gradient(to right, #fff5f5 0%, white 10%);
}

.error-card-enhanced.priority-important {
  border-left-color: #e6a23c;
  background: linear-gradient(to right, #fff9f5 0%, white 10%);
}

.error-card-enhanced.priority-normal {
  border-left-color: #67c23a;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  gap: 12px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  flex-wrap: wrap;
}

.priority-icon {
  font-size: 20px;
}

.priority-text {
  font-size: 12px;
  font-weight: 600;
  color: #666;
}

.error-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  flex: 1;
}

.header-right {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.card-body {
  margin-bottom: 16px;
}

.meta-info {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #666;
}

.risk-section {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
}

.risk-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.risk-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: #666;
}

.risk-value {
  font-size: 18px;
  font-weight: 600;
}

.risk-value.risk-high {
  color: #f56c6c;
}

.risk-value.risk-medium {
  color: #e6a23c;
}

.risk-value.risk-low {
  color: #67c23a;
}

.risk-tip {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.mastery-section {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
}

.mastery-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.mastery-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: #666;
}

.mastery-value {
  font-size: 18px;
  font-weight: 600;
  color: #409eff;
}

.ai-tip {
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  border-radius: 8px;
  padding: 12px;
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.tip-icon {
  font-size: 24px;
  line-height: 1;
}

.tip-content {
  flex: 1;
}

.tip-title {
  font-size: 12px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.tip-text {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
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
  .card-header {
    flex-direction: column;
  }
  
  .header-right {
    width: 100%;
    justify-content: flex-start;
  }
  
  .card-footer {
    flex-direction: column;
  }
  
  .card-footer :deep(.el-button) {
    width: 100%;
  }
}
</style>
