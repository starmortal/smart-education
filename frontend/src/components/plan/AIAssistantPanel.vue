<template>
  <div class="ai-assistant-panel" :class="{ minimized: isMinimized }">
    <div class="panel-header">
      <div class="header-left">
        <el-icon class="ai-icon" :size="20"><ChatDotRound /></el-icon>
        <span class="panel-title">🤖 AI学习助手</span>
      </div>
      <div class="header-actions">
        <el-button 
          :icon="isMinimized ? ArrowDown : ArrowUp" 
          circle 
          size="small"
          @click="toggleMinimize"
        />
        <el-button 
          :icon="Setting" 
          circle 
          size="small"
          @click="showSettings"
        />
      </div>
    </div>

    <transition name="panel-content">
      <div v-if="!isMinimized" class="panel-content">
        <div class="ai-message" v-loading="loading">
          <div class="message-text">
            {{ aiMessage }}
          </div>
        </div>

        <div class="quick-actions">
          <el-button type="primary" :icon="VideoPlay" @click="startLearning">
            开始学习
          </el-button>
          <el-button :icon="Document" @click="viewDetails">
            查看详情
          </el-button>
          <el-button :icon="Edit" @click="adjustPlan">
            调整计划
          </el-button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { 
  ChatDotRound, 
  ArrowUp, 
  ArrowDown, 
  Setting, 
  VideoPlay, 
  Document, 
  Edit 
} from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import axios from 'axios';

const props = defineProps({
  userId: {
    type: String,
    required: true
  },
  todayPlans: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['start-learning', 'view-details', 'adjust-plan']);

const isMinimized = ref(false);
const loading = ref(false);
const aiMessage = ref('');

// 切换最小化状态
function toggleMinimize() {
  isMinimized.value = !isMinimized.value;
}

// 显示设置
function showSettings() {
  ElMessage.info('AI助手设置功能开发中...');
}

// 开始学习
function startLearning() {
  emit('start-learning');
}

// 查看详情
function viewDetails() {
  emit('view-details');
}

// 调整计划
function adjustPlan() {
  emit('adjust-plan');
}

// 生成AI问候语
function generateGreeting() {
  const hour = new Date().getHours();
  let timeGreeting = '';
  
  if (hour < 6) {
    timeGreeting = '深夜了，注意休息哦';
  } else if (hour < 9) {
    timeGreeting = '早上好';
  } else if (hour < 12) {
    timeGreeting = '上午好';
  } else if (hour < 14) {
    timeGreeting = '中午好';
  } else if (hour < 18) {
    timeGreeting = '下午好';
  } else if (hour < 22) {
    timeGreeting = '晚上好';
  } else {
    timeGreeting = '夜深了，早点休息';
  }
  
  return timeGreeting;
}

// 获取AI建议
async function fetchAISuggestion() {
  loading.value = true;
  
  try {
    const greeting = generateGreeting();
    const planCount = props.todayPlans.length;
    
    if (planCount === 0) {
      aiMessage.value = `${greeting}！今天暂无学习任务，可以休息一下或者制定新的学习计划。`;
      return;
    }
    
    // 调用AI接口生成建议
    const response = await axios.post('http://localhost:3001/api/ai/text-answer', {
      prompt: `作为学习助手，用户今天有${planCount}个学习任务。请用简短友好的语气（不超过50字）给出今日学习建议。任务列表：${props.todayPlans.map(p => p.planTitle).join('、')}`
    });
    
    const aiResponse = response.data?.data?.answer || '';
    aiMessage.value = `${greeting}！${aiResponse}`;
    
  } catch (error) {
    console.error('获取AI建议失败：', error);
    // 降级方案：使用默认建议
    const greeting = generateGreeting();
    const planCount = props.todayPlans.length;
    aiMessage.value = `${greeting}！今天有${planCount}个学习任务，建议按优先级逐个完成。加油！`;
  } finally {
    loading.value = false;
  }
}

// 组件挂载时获取AI建议
onMounted(() => {
  fetchAISuggestion();
});

// 监听今日计划变化
import { watch } from 'vue';
watch(() => props.todayPlans, () => {
  fetchAISuggestion();
}, { deep: true });
</script>

<style scoped>
.ai-assistant-panel {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  transition: all 0.3s ease;
}

.ai-assistant-panel.minimized {
  padding: 12px 20px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.header-actions {
  display: flex;
  gap: 8px;
}

.header-actions :deep(.el-button) {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
}

.header-actions :deep(.el-button:hover) {
  background: rgba(255, 255, 255, 0.3);
}

.panel-content {
  margin-top: 16px;
}

.panel-content-enter-active,
.panel-content-leave-active {
  transition: all 0.3s ease;
}

.panel-content-enter-from,
.panel-content-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.ai-message {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  min-height: 60px;
}

.message-text {
  color: #333;
  font-size: 14px;
  line-height: 1.6;
}

.quick-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.quick-actions :deep(.el-button) {
  flex: 1;
  min-width: 100px;
}

.quick-actions :deep(.el-button--primary) {
  background: white;
  color: #667eea;
  border: none;
}

.quick-actions :deep(.el-button--primary:hover) {
  background: #f0f0f0;
}

.quick-actions :deep(.el-button:not(.el-button--primary)) {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.quick-actions :deep(.el-button:not(.el-button--primary):hover) {
  background: rgba(255, 255, 255, 0.3);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .quick-actions {
    flex-direction: column;
  }
  
  .quick-actions :deep(.el-button) {
    width: 100%;
  }
}
</style>
