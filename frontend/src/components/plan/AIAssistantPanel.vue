<template>
  <div class="ai-assistant-panel" :class="{ minimized: isMinimized }">
    <div class="panel-header">
      <div class="header-left">
        <el-icon class="ai-icon" :size="20"><ChatDotRound /></el-icon>
        <span class="panel-title">🤖 AI学习助手</span>
        <el-tag v-if="todayPlans.length > 0" size="small" effect="light" style="margin-left: 8px;">
          {{ todayPlans.length }}个任务
        </el-tag>
      </div>
      <div class="header-actions">
        <el-tooltip content="刷新建议" placement="top">
          <el-button 
            :icon="Refresh" 
            circle 
            size="small"
            @click="refreshSuggestion"
          />
        </el-tooltip>
        <el-tooltip :content="isMinimized ? '展开' : '收起'" placement="top">
          <el-button 
            :icon="isMinimized ? ArrowDown : ArrowUp" 
            circle 
            size="small"
            @click="toggleMinimize"
          />
        </el-tooltip>
        <el-tooltip content="设置" placement="top">
          <el-button 
            :icon="Setting" 
            circle 
            size="small"
            @click="showSettings"
          />
        </el-tooltip>
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

    <!-- 设置对话框 -->
    <el-dialog
      v-model="showSettingsDialog"
      title="AI助手设置"
      width="600px"
      center
      class="settings-dialog"
    >
      <el-form :model="settings" label-width="120px">
        <el-form-item label="自动刷新">
          <el-switch 
            v-model="settings.autoRefresh" 
            active-text="开启"
            inactive-text="关闭"
          />
          <div class="form-hint">每次进入页面时自动获取AI建议</div>
        </el-form-item>

        <el-form-item label="建议风格">
          <el-radio-group v-model="settings.suggestionStyle">
            <el-radio label="friendly">友好鼓励</el-radio>
            <el-radio label="professional">专业严谨</el-radio>
            <el-radio label="humorous">轻松幽默</el-radio>
          </el-radio-group>
          <div class="form-hint">选择AI助手的语言风格</div>
        </el-form-item>

        <el-form-item label="提醒时间">
          <el-time-picker
            v-model="settings.reminderTime"
            placeholder="选择提醒时间"
            format="HH:mm"
            value-format="HH:mm"
          />
          <div class="form-hint">每天定时提醒学习任务</div>
        </el-form-item>

        <el-form-item label="显示统计">
          <el-switch 
            v-model="settings.showStats" 
            active-text="显示"
            inactive-text="隐藏"
          />
          <div class="form-hint">在建议中显示学习统计数据</div>
        </el-form-item>

        <el-form-item label="智能排序">
          <el-switch 
            v-model="settings.smartSort" 
            active-text="开启"
            inactive-text="关闭"
          />
          <div class="form-hint">根据紧急程度和重要性智能排序任务</div>
        </el-form-item>

        <el-form-item label="学习目标">
          <el-input
            v-model="settings.dailyGoal"
            type="number"
            placeholder="每日学习时长（分钟）"
          >
            <template #append>分钟</template>
          </el-input>
          <div class="form-hint">设置每日学习目标时长</div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showSettingsDialog = false">取消</el-button>
        <el-button type="primary" @click="saveSettings">保存设置</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue';
import { 
  ChatDotRound, 
  ArrowUp, 
  ArrowDown, 
  Setting, 
  VideoPlay, 
  Document, 
  Edit,
  Refresh
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
const showSettingsDialog = ref(false);

// AI助手设置
const settings = reactive({
  autoRefresh: true,
  suggestionStyle: 'friendly',
  reminderTime: '09:00',
  showStats: true,
  smartSort: true,
  dailyGoal: 120
});

// 切换最小化状态
function toggleMinimize() {
  isMinimized.value = !isMinimized.value;
  // 保存用户偏好
  localStorage.setItem('ai-assistant-minimized', isMinimized.value);
}

// 显示设置
function showSettings() {
  loadSettings();
  showSettingsDialog.value = true;
}

// 加载设置
function loadSettings() {
  const savedSettings = localStorage.getItem('ai-assistant-settings');
  if (savedSettings) {
    try {
      Object.assign(settings, JSON.parse(savedSettings));
    } catch (error) {
      console.error('加载设置失败：', error);
    }
  }
}

// 保存设置
function saveSettings() {
  localStorage.setItem('ai-assistant-settings', JSON.stringify(settings));
  showSettingsDialog.value = false;
  ElMessage.success('设置已保存');
  
  // 重新获取AI建议
  if (settings.autoRefresh) {
    fetchAISuggestion();
  }
}

// 刷新建议
function refreshSuggestion() {
  fetchAISuggestion();
  ElMessage.success('正在刷新AI建议...');
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

// 根据设置生成提示词
function generatePrompt() {
  const planCount = props.todayPlans.length;
  const planTitles = props.todayPlans.map(p => p.planTitle).join('、');
  
  let styleInstruction = '';
  switch (settings.suggestionStyle) {
    case 'friendly':
      styleInstruction = '用友好鼓励的语气';
      break;
    case 'professional':
      styleInstruction = '用专业严谨的语气';
      break;
    case 'humorous':
      styleInstruction = '用轻松幽默的语气';
      break;
  }
  
  let prompt = `作为学习助手，${styleInstruction}，用户今天有${planCount}个学习任务。`;
  
  if (settings.showStats) {
    const totalProgress = props.todayPlans.reduce((sum, p) => sum + (p.progress || 0), 0);
    const avgProgress = planCount > 0 ? Math.round(totalProgress / planCount) : 0;
    prompt += `当前平均进度${avgProgress}%。`;
  }
  
  if (settings.dailyGoal) {
    prompt += `用户的每日学习目标是${settings.dailyGoal}分钟。`;
  }
  
  prompt += `请用简短友好的语气（不超过60字）给出今日学习建议。任务列表：${planTitles}`;
  
  return prompt;
}

// 获取AI建议
async function fetchAISuggestion() {
  loading.value = true;
  
  try {
    const greeting = generateGreeting();
    const planCount = props.todayPlans.length;
    
    if (planCount === 0) {
      aiMessage.value = `${greeting}！今天暂无学习任务，可以休息一下或者制定新的学习计划。保持学习的热情！`;
      return;
    }
    
    // 调用AI接口生成建议
    const prompt = generatePrompt();
    const response = await axios.post('http://localhost:3001/api/ai/text-answer', {
      prompt: prompt
    }, { timeout: 15000 });
    
    const aiResponse = response.data?.data?.answer || '';
    aiMessage.value = `${greeting}！${aiResponse}`;
    
  } catch (error) {
    console.error('获取AI建议失败：', error);
    // 降级方案：使用默认建议
    const greeting = generateGreeting();
    const planCount = props.todayPlans.length;
    
    let defaultMessage = `${greeting}！今天有${planCount}个学习任务`;
    
    if (settings.smartSort && planCount > 0) {
      const urgentPlans = props.todayPlans.filter(p => p.planStatus === 'overdue' || p.planStatus === 'in_progress');
      if (urgentPlans.length > 0) {
        defaultMessage += `，其中${urgentPlans.length}个需要优先完成`;
      }
    }
    
    defaultMessage += '。建议按优先级逐个完成，保持专注。加油！';
    aiMessage.value = defaultMessage;
  } finally {
    loading.value = false;
  }
}

// 组件挂载时
onMounted(() => {
  // 加载设置
  loadSettings();
  
  // 恢复最小化状态
  const savedMinimized = localStorage.getItem('ai-assistant-minimized');
  if (savedMinimized !== null) {
    isMinimized.value = savedMinimized === 'true';
  }
  
  // 自动获取AI建议
  if (settings.autoRefresh) {
    fetchAISuggestion();
  }
});

// 监听今日计划变化
import { watch } from 'vue';
watch(() => props.todayPlans, () => {
  if (settings.autoRefresh && !isMinimized.value) {
    fetchAISuggestion();
  }
}, { deep: true });
</script>

<style scoped>
.ai-assistant-panel {
  background: #fff;
  border-radius: 12px;
  padding: 0;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 2px solid #e4e7ed;
  transition: all 0.3s ease;
  overflow: hidden;
}

.ai-assistant-panel:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  border-color: #4facfe;
}

.ai-assistant-panel.minimized {
  padding: 0;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ai-icon {
  animation: pulse 2s ease-in-out infinite;
  font-size: 24px;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
}

.panel-title {
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.header-actions :deep(.el-button) {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  transition: all 0.3s;
}

.header-actions :deep(.el-button:hover) {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
  transform: scale(1.05);
}

.panel-content {
  padding: 20px;
  background: #fafbfc;
}

.panel-content-enter-active,
.panel-content-leave-active {
  transition: all 0.3s ease;
}

.panel-content-enter-from,
.panel-content-leave-to {
  opacity: 0;
  max-height: 0;
  padding: 0 20px;
}

.panel-content-enter-to,
.panel-content-leave-from {
  opacity: 1;
  max-height: 500px;
  padding: 20px;
}

.ai-message {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
  min-height: 80px;
  border-left: 4px solid #4facfe;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  position: relative;
}

.ai-message::before {
  content: '💡';
  position: absolute;
  top: 16px;
  left: -2px;
  font-size: 20px;
  transform: translateX(-50%);
  background: white;
  padding: 4px;
  border-radius: 50%;
}

.message-text {
  color: #2c3e50;
  font-size: 15px;
  line-height: 1.8;
  font-weight: 500;
}

.quick-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.quick-actions :deep(.el-button) {
  flex: 1;
  min-width: 120px;
  height: 40px;
  font-weight: 500;
  border-radius: 8px;
  transition: all 0.3s;
}

.quick-actions :deep(.el-button--primary) {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  border: none;
  color: white;
  box-shadow: 0 2px 8px rgba(79, 172, 254, 0.3);
}

.quick-actions :deep(.el-button--primary:hover) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(79, 172, 254, 0.4);
}

.quick-actions :deep(.el-button:not(.el-button--primary)) {
  background: white;
  color: #4facfe;
  border: 2px solid #4facfe;
}

.quick-actions :deep(.el-button:not(.el-button--primary):hover) {
  background: #4facfe;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(79, 172, 254, 0.2);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .panel-header {
    padding: 12px 16px;
  }
  
  .panel-content {
    padding: 16px;
  }
  
  .quick-actions {
    flex-direction: column;
  }
  
  .quick-actions :deep(.el-button) {
    width: 100%;
    min-width: auto;
  }
}

/* 设置对话框样式 */
:deep(.settings-dialog .el-dialog) {
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

:deep(.settings-dialog .el-dialog__header) {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
  padding: 20px;
  border-radius: 12px 12px 0 0;
}

:deep(.settings-dialog .el-dialog__title) {
  color: white;
  font-weight: 600;
}

:deep(.settings-dialog .el-dialog__close) {
  color: white;
}

:deep(.settings-dialog .el-dialog__close:hover) {
  color: rgba(255, 255, 255, 0.8);
}

:deep(.settings-dialog .el-dialog__body) {
  padding: 24px;
  background: #fafbfc;
}

:deep(.settings-dialog .el-form-item) {
  margin-bottom: 24px;
}

:deep(.settings-dialog .el-form-item__label) {
  font-weight: 600;
  color: #2c3e50;
}

.form-hint {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  line-height: 1.5;
}

:deep(.settings-dialog .el-switch) {
  --el-switch-on-color: #4facfe;
}

:deep(.settings-dialog .el-radio__input.is-checked .el-radio__inner) {
  background-color: #4facfe;
  border-color: #4facfe;
}

:deep(.settings-dialog .el-radio__input.is-checked + .el-radio__label) {
  color: #4facfe;
}

:deep(.settings-dialog .el-dialog__footer) {
  padding: 16px 24px;
  background: white;
  border-top: 1px solid #e4e7ed;
}

:deep(.settings-dialog .el-button--primary) {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  border: none;
}

:deep(.settings-dialog .el-button--primary:hover) {
  opacity: 0.9;
}
</style>
