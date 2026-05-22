<template>
  <div class="feedback-page">
    <SideNavBar />
    
    <!-- 左侧反馈列表 -->
    <div class="feedback-sidebar" :class="{ collapsed: sidebarCollapsed }">
      <!-- 顶部工具栏 -->
      <div class="sidebar-header">
        <el-tooltip content="刷新" placement="bottom">
          <el-button :icon="Refresh" circle size="small" @click="loadFeedbackHistory" />
        </el-tooltip>
        
        <el-tooltip content="筛选" placement="bottom">
          <el-button :icon="Filter" circle size="small" @click="showFilter = !showFilter" />
        </el-tooltip>
      </div>

      <!-- 筛选器 -->
      <div class="filter-box" v-show="showFilter">
        <el-select
          v-model="filterType"
          placeholder="筛选类型"
          clearable
          size="small"
          @change="applyFilter"
        >
          <el-option label="全部类型" value="" />
          <el-option label="功能建议" value="suggestion" />
          <el-option label="Bug反馈" value="bug" />
          <el-option label="使用问题" value="question" />
          <el-option label="其他" value="other" />
        </el-select>

        <el-select
          v-model="filterStatus"
          placeholder="筛选状态"
          clearable
          size="small"
          @change="applyFilter"
          style="margin-top: 8px"
        >
          <el-option label="全部状态" value="" />
          <el-option label="已提交" value="submitted" />
          <el-option label="已回复" value="replied" />
        </el-select>
      </div>

      <!-- 反馈列表 -->
      <div class="feedback-list" v-loading="historyLoading">
        <div
          v-for="item in filteredFeedbackList"
          :key="item.id"
          :class="['feedback-item', { active: selectedFeedback?.id === item.id }]"
          @click="handleSelectFeedback(item)"
        >
          <div class="item-icon">
            <el-icon :color="getTypeColor(item.type)">
              <component :is="getTypeIcon(item.type)" />
            </el-icon>
          </div>
          <div class="item-content">
            <div class="item-title">{{ getPreviewText(item.content) }}</div>
            <div class="item-meta">
              <el-tag :type="getTypeTag(item.type)" size="small">
                {{ getTypeLabel(item.type) }}
              </el-tag>
              <el-tag 
                v-if="item.status === 'replied'" 
                type="success" 
                size="small"
                effect="dark"
              >
                已回复
              </el-tag>
              <span class="item-time">{{ formatTime(item.date) }}</span>
            </div>
          </div>
        </div>

        <el-empty 
          v-if="filteredFeedbackList.length === 0 && !historyLoading" 
          description="暂无反馈记录"
          :image-size="80"
        />
      </div>
    </div>

    <!-- 右侧内容区 -->
    <div class="content-container" :class="{ expanded: sidebarCollapsed }">
      <!-- 未选中反馈时显示提交表单 -->
      <div v-if="!selectedFeedback" class="submit-form-container">
        <div class="form-header">
          <el-button 
            :icon="sidebarCollapsed ? DArrowRight : DArrowLeft" 
            circle 
            size="small"
            @click="toggleSidebar"
          />
          <span class="header-title">提交反馈</span>
        </div>

        <div class="form-content">
          <p class="form-desc">
            您的每一条反馈都是我们前进的动力。无论是功能建议、Bug反馈还是使用问题，我们都会认真对待。
          </p>

          <el-form 
            :model="feedbackForm" 
            :rules="feedbackRules" 
            ref="feedbackFormRef" 
            label-width="100px"
            class="feedback-form"
          >
            <el-form-item label="反馈类型" prop="type">
              <el-select 
                v-model="feedbackForm.type" 
                placeholder="请选择反馈类型"
                size="large"
              >
                <el-option label="💡 功能建议" value="suggestion" />
                <el-option label="🐛 Bug反馈" value="bug" />
                <el-option label="❓ 使用问题" value="question" />
                <el-option label="💬 其他" value="other" />
              </el-select>
            </el-form-item>

            <el-form-item label="反馈内容" prop="content">
              <el-input
                v-model="feedbackForm.content"
                type="textarea"
                :rows="8"
                placeholder="请详细描述您的问题或建议，我们会认真阅读每一条反馈..."
                maxlength="500"
                show-word-limit
              />
            </el-form-item>

            <el-form-item label="截图上传">
              <div class="screenshot-upload-grid">
                <div 
                  v-for="index in 3" 
                  :key="index"
                  class="screenshot-box"
                  @click="selectScreenshot(index - 1)"
                >
                  <img 
                    v-if="feedbackForm.screenshots[index - 1]" 
                    :src="feedbackForm.screenshots[index - 1]" 
                    class="screenshot-preview"
                  />
                  <div v-else class="screenshot-placeholder">
                    <el-icon size="32" color="#c0c4cc"><Plus /></el-icon>
                    <div class="placeholder-text">点击上传</div>
                  </div>
                  <div 
                    v-if="feedbackForm.screenshots[index - 1]"
                    class="screenshot-remove"
                    @click.stop="removeScreenshot(index - 1)"
                  >
                    <el-icon><Close /></el-icon>
                  </div>
                </div>
              </div>
              <input 
                ref="screenshotInput" 
                type="file" 
                accept="image/*" 
                style="display: none;" 
                @change="handleScreenshotSelect"
              />
              <div class="upload-tip">
                <el-icon><InfoFilled /></el-icon>
                最多上传3张截图，支持 JPG、PNG 格式
              </div>
            </el-form-item>

            <el-form-item>
              <el-button 
                type="primary" 
                size="large"
                @click="submitFeedback" 
                :loading="feedbackLoading"
                :icon="Promotion"
              >
                提交反馈
              </el-button>
              <el-button 
                size="large"
                @click="resetForm"
                :icon="RefreshLeft"
              >
                重置
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>

      <!-- 选中反馈时显示详情 -->
      <div v-else class="feedback-detail-container">
        <div class="detail-header">
          <el-button 
            :icon="sidebarCollapsed ? DArrowRight : DArrowLeft" 
            circle 
            size="small"
            @click="toggleSidebar"
          />
          <el-tag :type="getTypeTag(selectedFeedback.type)" size="large">
            {{ getTypeLabel(selectedFeedback.type) }}
          </el-tag>
          <el-tag 
            v-if="selectedFeedback.status === 'replied'" 
            type="success" 
            size="large"
            effect="dark"
          >
            已回复
          </el-tag>
          <span class="detail-time">{{ selectedFeedback.date }}</span>
          <el-button 
            text 
            @click="selectedFeedback = null"
            style="margin-left: auto"
          >
            返回提交
          </el-button>
        </div>

        <div class="detail-content">
          <div class="content-section">
            <div class="section-title">反馈内容</div>
            <div class="section-text">{{ selectedFeedback.content }}</div>
          </div>

          <div v-if="selectedFeedback.screenshots && selectedFeedback.screenshots.length > 0" class="content-section">
            <div class="section-title">截图</div>
            <div class="screenshots-grid">
              <el-image
                v-for="(img, index) in selectedFeedback.screenshots"
                :key="index"
                :src="img"
                :preview-src-list="selectedFeedback.screenshots"
                :initial-index="index"
                fit="cover"
                class="screenshot-thumb"
              />
            </div>
          </div>

          <div v-if="selectedFeedback.reply && selectedFeedback.status === 'replied'" class="content-section reply-section">
            <div class="section-title">
              <el-icon color="#67c23a"><ChatDotRound /></el-icon>
              管理员回复
            </div>
            <div class="section-text reply-text">{{ selectedFeedback.reply }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { 
  Refresh,
  Filter,
  DArrowLeft,
  DArrowRight,
  Plus,
  Promotion,
  RefreshLeft,
  InfoFilled,
  Close,
  ChatDotRound,
  Sunny,
  BugFilled,
  QuestionFilled,
  ChatLineRound
} from '@element-plus/icons-vue';
import SideNavBar from '@/components/SideNavBar.vue';
import axios from 'axios';

// 数据状态
const feedbackFormRef = ref(null);
const feedbackLoading = ref(false);
const historyLoading = ref(false);
const screenshotInput = ref(null);
const currentScreenshotIndex = ref(0);
const sidebarCollapsed = ref(false);
const showFilter = ref(false);
const selectedFeedback = ref(null);
const feedbackHistory = ref([]);
const filterType = ref('');
const filterStatus = ref('');

const feedbackForm = reactive({
  type: '',
  content: '',
  screenshots: [null, null, null]
});

const feedbackRules = {
  type: [{ required: true, message: '请选择反馈类型', trigger: 'change' }],
  content: [
    { required: true, message: '请输入反馈内容', trigger: 'blur' },
    { min: 10, message: '请至少输入10个字符', trigger: 'blur' }
  ]
};

// 筛选后的反馈列表
const filteredFeedbackList = computed(() => {
  let list = feedbackHistory.value;
  
  if (filterType.value) {
    list = list.filter(item => item.type === filterType.value);
  }
  
  if (filterStatus.value) {
    list = list.filter(item => item.status === filterStatus.value);
  }
  
  return list;
});

// 切换侧边栏
function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value;
}

// 应用筛选
function applyFilter() {
  // 筛选逻辑已通过 computed 实现
}

// 选择反馈
function handleSelectFeedback(feedback) {
  selectedFeedback.value = feedback;
}

// 获取预览文本
function getPreviewText(content) {
  if (!content) return '空白反馈';
  return content.length > 30 ? content.substring(0, 30) + '...' : content;
}

// 格式化时间
function formatTime(dateStr) {
  if (!dateStr) return '';
  
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`;
  
  return date.toLocaleDateString();
}

// 获取类型图标
function getTypeIcon(type) {
  const iconMap = {
    suggestion: Sunny,
    bug: BugFilled,
    question: QuestionFilled,
    other: ChatLineRound
  };
  return iconMap[type] || ChatLineRound;
}

// 获取类型颜色
function getTypeColor(type) {
  const colorMap = {
    suggestion: '#67c23a',
    bug: '#f56c6c',
    question: '#e6a23c',
    other: '#909399'
  };
  return colorMap[type] || '#909399';
}

// 获取类型标签
function getTypeTag(type) {
  const tagMap = {
    suggestion: 'success',
    bug: 'danger',
    question: 'warning',
    other: 'info'
  };
  return tagMap[type] || 'info';
}

// 获取类型标签文字
function getTypeLabel(type) {
  const labelMap = {
    suggestion: '功能建议',
    bug: 'Bug反馈',
    question: '使用问题',
    other: '其他'
  };
  return labelMap[type] || '其他';
}

// 选择截图框
function selectScreenshot(index) {
  currentScreenshotIndex.value = index;
  screenshotInput.value.click();
}

// 处理截图选择
function handleScreenshotSelect(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  if (!file.type.startsWith('image/')) {
    ElMessage.warning('请选择图片文件');
    event.target.value = '';
    return;
  }
  
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.warning('图片大小不能超过5MB');
    event.target.value = '';
    return;
  }
  
  const reader = new FileReader();
  reader.onload = (e) => {
    feedbackForm.screenshots[currentScreenshotIndex.value] = e.target.result;
  };
  reader.readAsDataURL(file);
  
  event.target.value = '';
}

// 移除截图
function removeScreenshot(index) {
  feedbackForm.screenshots[index] = null;
}

// 提交反馈
async function submitFeedback() {
  if (!feedbackFormRef.value) {
    ElMessage.error('表单初始化失败，请刷新页面重试');
    return;
  }
  
  try {
    await feedbackFormRef.value.validate();
    
    feedbackLoading.value = true;
    
    const userId = localStorage.getItem('edu-user-id');
    const nickname = localStorage.getItem('edu-nickname') || '匿名用户';
    
    const response = await axios.post('http://localhost:3001/api/feedback/submit', {
      userId,
      nickname,
      type: feedbackForm.type,
      content: feedbackForm.content,
      screenshots: feedbackForm.screenshots.filter(s => s !== null)
    });
    
    ElMessage.success('感谢您的反馈！我们会认真处理');
    
    resetForm();
    loadFeedbackHistory();
  } catch (error) {
    console.error('提交反馈失败：', error);
    
    if (error && typeof error === 'object' && !error.response) {
      return;
    }
    
    const errorMsg = error.response?.data?.message || error.message || '提交失败，请重试';
    ElMessage.error(errorMsg);
  } finally {
    feedbackLoading.value = false;
  }
}

// 重置表单
function resetForm() {
  feedbackFormRef.value?.resetFields();
  feedbackForm.type = '';
  feedbackForm.content = '';
  feedbackForm.screenshots = [null, null, null];
}

// 加载反馈历史
async function loadFeedbackHistory() {
  historyLoading.value = true;
  try {
    const userId = localStorage.getItem('edu-user-id');
    const res = await axios.get('http://localhost:3001/api/feedback/history', {
      params: { userId }
    });
    
    feedbackHistory.value = res.data.list || [];
  } catch (error) {
    console.error('加载反馈历史失败：', error);
  } finally {
    historyLoading.value = false;
  }
}

onMounted(() => {
  loadFeedbackHistory();
});
</script>

<style scoped>
.feedback-page {
  display: block;
  height: 100vh;
  background: #f5f7fa;
  overflow: hidden;
  position: relative;
}

/* 左侧反馈列表 */
.feedback-sidebar {
  width: 300px;
  background: #fff;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 60px;
  top: 0;
  bottom: 0;
  z-index: 100;
  transition: transform 0.3s;
}

.feedback-sidebar.collapsed {
  transform: translateX(-300px);
}

.sidebar-header {
  padding: 12px;
  border-bottom: 1px solid #e4e7ed;
  background: #fff;
  display: flex;
  gap: 8px;
  justify-content: center;
}

.filter-box {
  padding: 12px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.feedback-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  background: #fafafa;
}

.feedback-list::-webkit-scrollbar {
  width: 6px;
}

.feedback-list::-webkit-scrollbar-thumb {
  background: #dcdfe6;
  border-radius: 3px;
}

.feedback-item {
  display: flex;
  gap: 12px;
  padding: 14px;
  margin-bottom: 10px;
  background: #fff;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid #e4e7ed;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.feedback-item:hover {
  border-color: #0969da;
  box-shadow: 0 2px 8px rgba(9, 105, 218, 0.15);
  transform: translateY(-1px);
}

.feedback-item.active {
  background: #e8f4ff;
  border-color: #0969da;
  border-left: 4px solid #0969da;
  padding-left: 11px;
  box-shadow: 0 2px 8px rgba(9, 105, 218, 0.2);
}

.item-icon {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  border-radius: 6px;
}

.item-content {
  flex: 1;
  min-width: 0;
}

.item-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.item-time {
  font-size: 12px;
  color: #909399;
  margin-left: auto;
}

/* 右侧内容区 */
.content-container {
  position: fixed;
  left: 360px;
  right: 0;
  top: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  background: #fff;
  transition: left 0.3s;
}

.content-container.expanded {
  left: 60px;
}

/* 提交表单容器 */
.submit-form-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.form-header {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e4e7ed;
  background: #fff;
  gap: 12px;
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.form-content {
  flex: 1;
  overflow-y: auto;
  padding: 30px 40px;
}

.form-desc {
  font-size: 15px;
  color: #606266;
  line-height: 1.8;
  margin-bottom: 30px;
  padding: 16px;
  background: #f0f7ff;
  border-radius: 8px;
  border-left: 4px solid #0969da;
}

.feedback-form {
  max-width: 800px;
}

.screenshot-upload-grid {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.screenshot-box {
  position: relative;
  width: 100px;
  height: 100px;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.3s;
  background: #fafbfc;
  flex-shrink: 0;
}

.screenshot-box:hover {
  border-color: #0969da;
  background: #f5f7fa;
  transform: scale(1.05);
}

.screenshot-preview {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.screenshot-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.placeholder-text {
  font-size: 13px;
  color: #909399;
}

.screenshot-remove {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 24px;
  height: 24px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  transition: all 0.3s;
  z-index: 10;
}

.screenshot-remove:hover {
  background: rgba(0, 0, 0, 0.8);
  transform: scale(1.1);
}

.upload-tip {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #999;
  margin-top: 8px;
}

/* 反馈详情容器 */
.feedback-detail-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.detail-header {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e4e7ed;
  background: #fff;
  gap: 12px;
}

.detail-time {
  font-size: 14px;
  color: #909399;
}

.detail-content {
  flex: 1;
  overflow-y: auto;
  padding: 30px 40px;
}

.content-section {
  margin-bottom: 30px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.section-text {
  font-size: 15px;
  color: #606266;
  line-height: 1.8;
  white-space: pre-wrap;
  word-break: break-word;
}

.screenshots-grid {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.screenshot-thumb {
  width: 120px;
  height: 120px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.screenshot-thumb:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.reply-section {
  padding: 20px;
  background: #f0f9ff;
  border-radius: 8px;
  border-left: 4px solid #67c23a;
}

.reply-text {
  color: #333;
}

/* 响应式 */
@media (max-width: 768px) {
  .feedback-sidebar {
    width: 100%;
    left: 0;
    transform: translateX(-100%);
  }
  
  .feedback-sidebar.show {
    transform: translateX(0);
  }
  
  .content-container {
    left: 60px;
  }
}
</style>
