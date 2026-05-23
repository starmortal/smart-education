<template>
  <div class="ai-review-panel">
    <div class="panel-header">
      <div class="header-left">
        <el-icon class="ai-icon" :size="20"><ChatDotRound /></el-icon>
        <span class="panel-title">🤖 AI复习建议</span>
      </div>
    </div>

    <div class="panel-content" v-loading="loading">
      <div class="review-summary">
        <div class="summary-item">
          <div class="summary-icon" style="background: #409eff;">
            <el-icon><Document /></el-icon>
          </div>
          <div class="summary-info">
            <div class="summary-label">今日需复习</div>
            <div class="summary-value">{{ reviewPlan.todayCount }}道错题</div>
          </div>
        </div>

        <div class="summary-item">
          <div class="summary-icon" style="background: #67c23a;">
            <el-icon><Clock /></el-icon>
          </div>
          <div class="summary-info">
            <div class="summary-label">预计时长</div>
            <div class="summary-value">{{ reviewPlan.estimatedTime }}分钟</div>
          </div>
        </div>
      </div>

      <div class="focus-points">
        <div class="focus-title">
          <el-icon><Star /></el-icon>
          <span>重点突破</span>
        </div>
        <div class="focus-list">
          <el-tag 
            v-for="(point, index) in reviewPlan.focusPoints" 
            :key="index"
            :type="getTagType(index)"
            size="large"
          >
            {{ point.name }} ({{ point.count }}题)
          </el-tag>
        </div>
      </div>

      <div class="strategy-section">
        <div class="strategy-title">
          <el-icon><Compass /></el-icon>
          <span>复习策略</span>
        </div>
        <div class="strategy-content">
          <div class="strategy-steps">
            <div class="step-item">
              <div class="step-number">1</div>
              <div class="step-text">先看解析，理解错误原因</div>
            </div>
            <div class="step-arrow">→</div>
            <div class="step-item">
              <div class="step-number">2</div>
              <div class="step-text">独立做题，检验掌握程度</div>
            </div>
            <div class="step-arrow">→</div>
            <div class="step-item">
              <div class="step-number">3</div>
              <div class="step-text">总结规律，举一反三</div>
            </div>
          </div>
        </div>
      </div>

      <div class="ai-advice" v-if="aiAdvice">
        <div class="advice-icon">💡</div>
        <div class="advice-text">{{ aiAdvice }}</div>
      </div>

      <div class="action-buttons">
        <el-button type="primary" :icon="VideoPlay" @click="startReview" size="large">
          开始复习
        </el-button>
        <el-button :icon="DataAnalysis" @click="viewKnowledgeGraph" size="large">
          查看知识图谱
        </el-button>
        <el-button :icon="Calendar" @click="generatePlan" size="large">
          生成复习计划
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { 
  ChatDotRound, 
  Document, 
  Clock, 
  Star, 
  Compass, 
  VideoPlay, 
  DataAnalysis, 
  Calendar 
} from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import axios from 'axios';

const props = defineProps({
  userId: {
    type: String,
    required: true
  },
  todayErrors: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['start-review', 'view-knowledge-graph', 'generate-plan']);

const loading = ref(false);
const reviewPlan = ref({
  todayCount: 0,
  estimatedTime: 0,
  focusPoints: [],
  strategy: ''
});
const aiAdvice = ref('');

// 获取标签类型
function getTagType(index) {
  const types = ['danger', 'warning', 'success', 'info'];
  return types[index % types.length];
}

// 开始复习
function startReview() {
  emit('start-review');
}

// 查看知识图谱
function viewKnowledgeGraph() {
  emit('view-knowledge-graph');
}

// 生成复习计划
function generatePlan() {
  emit('generate-plan');
}

// 获取AI复习建议
async function fetchAIReviewPlan() {
  loading.value = true;
  
  try {
    const response = await axios.get(
      `http://localhost:3001/api/error-book/ai-review-plan/${props.userId}`,
      { timeout: 10000 }
    );
    
    const data = response.data?.data || response.data;
    
    reviewPlan.value = {
      todayCount: data.todayCount || props.todayErrors.length,
      estimatedTime: data.estimatedTime || Math.ceil(props.todayErrors.length * 5),
      focusPoints: data.focusPoints || extractFocusPoints(),
      strategy: data.strategy || ''
    };
    
    // 获取AI个性化建议
    await fetchAIAdvice();
    
  } catch (error) {
    console.error('获取AI复习建议失败：', error);
    // 降级方案
    reviewPlan.value = {
      todayCount: props.todayErrors.length,
      estimatedTime: Math.ceil(props.todayErrors.length * 5),
      focusPoints: extractFocusPoints(),
      strategy: '先看解析→独立做题→总结规律'
    };
    
    aiAdvice.value = '建议从最薄弱的知识点开始复习，循序渐进，不要急于求成。';
  } finally {
    loading.value = false;
  }
}

// 提取重点知识点
function extractFocusPoints() {
  const knowledgeMap = {};
  
  props.todayErrors.forEach(error => {
    const subject = error.subject || 'unknown';
    if (!knowledgeMap[subject]) {
      knowledgeMap[subject] = { name: getSubjectText(subject), count: 0 };
    }
    knowledgeMap[subject].count++;
  });
  
  return Object.values(knowledgeMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
}

// 获取AI个性化建议
async function fetchAIAdvice() {
  try {
    const focusPointsText = reviewPlan.value.focusPoints
      .map(p => `${p.name}(${p.count}题)`)
      .join('、');
    
    const response = await axios.post('http://localhost:3001/api/ai/text-answer', {
      prompt: `学生今天需要复习${reviewPlan.value.todayCount}道错题，重点是：${focusPointsText}。请用一句话（不超过30字）给出复习建议。`
    });
    
    aiAdvice.value = response.data?.data?.answer || '建议从薄弱知识点开始，循序渐进复习。';
    
  } catch (error) {
    console.error('获取AI建议失败：', error);
    aiAdvice.value = '建议从薄弱知识点开始，循序渐进复习。';
  }
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

onMounted(() => {
  fetchAIReviewPlan();
});

// 监听今日错题变化
watch(() => props.todayErrors, () => {
  fetchAIReviewPlan();
}, { deep: true });
</script>

<style scoped>
.ai-review-panel {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  color: white;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ai-icon {
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.panel-title {
  font-size: 16px;
  font-weight: 600;
}

.panel-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.review-summary {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.summary-item {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.summary-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
}

.summary-info {
  flex: 1;
}

.summary-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.summary-value {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.focus-points {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  padding: 16px;
}

.focus-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.focus-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.strategy-section {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  padding: 16px;
}

.strategy-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.strategy-steps {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.step-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.step-number {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #409eff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}

.step-text {
  font-size: 12px;
  color: #666;
  text-align: center;
  line-height: 1.4;
}

.step-arrow {
  color: #409eff;
  font-size: 20px;
  font-weight: 600;
}

.ai-advice {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  padding: 16px;
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.advice-icon {
  font-size: 24px;
  line-height: 1;
}

.advice-text {
  flex: 1;
  font-size: 14px;
  color: #666;
  line-height: 1.6;
}

.action-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.action-buttons :deep(.el-button) {
  flex: 1;
  min-width: 120px;
  background: white;
  color: #667eea;
  border: none;
}

.action-buttons :deep(.el-button--primary) {
  background: white;
  color: #667eea;
}

.action-buttons :deep(.el-button:hover) {
  background: #f0f0f0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .review-summary {
    grid-template-columns: 1fr;
  }
  
  .strategy-steps {
    flex-direction: column;
  }
  
  .step-arrow {
    transform: rotate(90deg);
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .action-buttons :deep(.el-button) {
    width: 100%;
  }
}
</style>
