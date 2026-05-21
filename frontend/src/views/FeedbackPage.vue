<!-- FeedbackPage.vue :: 意见反馈页面 - 简化版 -->
<template>
    <!-- 主内容区 -->
  <div class="feedback-container">
    <el-card class="feedback-card">
      <template #header>
        <div class="card-header">
          <el-icon size="24" color="#0969da"><ChatLineRound /></el-icon>
          <span>我们期待听到您的声音</span>
        </div>
      </template>

      <div class="feedback-content">
        <p class="feedback-desc">
          您的每一条反馈都是我们前进的动力。无论是功能建议、Bug反馈还是使用问题，我们都会认真对待。
        </p>

        <el-form 
          :model="feedbackForm" 
          :rules="feedbackRules" 
          ref="feedbackFormRef" 
          label-width="100px"
          class="feedback-form"
        >
          <el-form-item prop="type">
            <template #label>
              <div class="form-label-tag">反馈类型</div>
            </template>
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



          <el-form-item prop="content">
            <template #label>
              <div class="form-label-tag">反馈内容</div>
            </template>
            <el-input
              v-model="feedbackForm.content"
              type="textarea"
              :rows="6"
              placeholder="请详细描述您的问题或建议，我们会认真阅读每一条反馈..."
              maxlength="300"
              show-word-limit
            />
          </el-form-item>

          <el-form-item>
            <template #label>
              <div class="form-label-tag">截图上传</div>
            </template>
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
              class="submit-btn"
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
    </el-card>

    <!-- 历史反馈记录 -->
    <el-card class="history-card">
      <template #header>
        <div class="card-header">
          <el-icon size="20" color="#0969da"><Document /></el-icon>
          <span>我的反馈记录</span>
          <el-button 
            size="small" 
            @click="loadFeedbackHistory" 
            :icon="RefreshRight"
            style="margin-left: auto;"
          >
            刷新
          </el-button>
        </div>
      </template>

      <div class="history-list" v-loading="historyLoading">
        <el-empty 
          v-if="feedbackHistory.length === 0" 
          description="暂无反馈记录"
          :image-size="100"
        />
        <div 
          v-else
          v-for="item in feedbackHistory" 
          :key="item.id"
          class="history-item"
        >
          <div class="history-header">
            <div class="header-left">
              <el-tag :type="getTypeTag(item.type)" size="small">
                {{ getTypeLabel(item.type) }}
              </el-tag>
              <el-tag :type="getStatusTag(item.status)" size="small" class="status-tag">
                {{ getStatusLabel(item.status) }}
              </el-tag>
            </div>
            <span class="history-date">{{ item.date }}</span>
          </div>
          <div class="history-content">{{ item.content }}</div>
          <div v-if="item.reply && item.status === 'replied'" class="history-reply">
            <div class="reply-label">
              <el-icon><ChatDotRound /></el-icon>
              管理员回复：
            </div>
            <div class="reply-content">{{ item.reply }}</div>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { 
  ChatLineRound, 
  Plus, 
  Promotion, 
  RefreshLeft,
  RefreshRight,
  Document,
  InfoFilled,
  Close,
  ChatDotRound
} from '@element-plus/icons-vue';
import axios from 'axios';
const feedbackFormRef = ref(null);
const feedbackLoading = ref(false);
const historyLoading = ref(false);
const screenshotInput = ref(null);
const currentScreenshotIndex = ref(0);

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

const feedbackHistory = ref([]);

// 选择截图框
const selectScreenshot = (index) => {
  currentScreenshotIndex.value = index;
  screenshotInput.value.click();
};

// 处理截图选择
const handleScreenshotSelect = (event) => {
  const file = event.target.files[0];
  if (!file) return;
  
  // 验证文件类型
  if (!file.type.startsWith('image/')) {
    ElMessage.warning('请选择图片文件');
    event.target.value = '';
    return;
  }
  
  // 验证文件大小（限制5MB）
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
  
  // 清空input，允许重复选择同一文件
  event.target.value = '';
};

// 移除截图
const removeScreenshot = (index) => {
  feedbackForm.screenshots[index] = null;
};

// 提交反馈
const submitFeedback = async () => {
  // 先检查表单引用是否存在
  if (!feedbackFormRef.value) {
    ElMessage.error('表单初始化失败，请刷新页面重试');
    return;
  }
  
  try {
    // 验证表单
    await feedbackFormRef.value.validate();
    
    feedbackLoading.value = true;
    
    const userId = localStorage.getItem('edu-user-id');
    const nickname = localStorage.getItem('edu-nickname') || '匿名用户';
    
    // 检查必填字段
    if (!feedbackForm.type) {
      ElMessage.warning('请选择反馈类型');
      feedbackLoading.value = false;
      return;
    }
    
    if (!feedbackForm.content || feedbackForm.content.trim().length < 10) {
      ElMessage.warning('反馈内容至少需要10个字符');
      feedbackLoading.value = false;
      return;
    }
    
    console.log('准备提交反馈：', {
      userId,
      nickname,
      type: feedbackForm.type,
      contact: feedbackForm.contact,
      content: feedbackForm.content,
      screenshotsCount: feedbackForm.screenshots.length
    });
    
    // 发送反馈到后端
    const response = await axios.post('http://localhost:3001/api/feedback/submit', {
      userId,
      nickname,
      type: feedbackForm.type,
      content: feedbackForm.content,
      screenshots: feedbackForm.screenshots.filter(s => s !== null)
    });
    
    console.log('提交成功：', response.data);
    
    ElMessage.success('感谢您的反馈！我们会认真处理');
    
    // 重置表单
    resetForm();
    
    // 刷新历史记录
    loadFeedbackHistory();
  } catch (error) {
    console.error('提交反馈失败：', error);
    
    // 如果是表单验证错误
    if (error && typeof error === 'object' && !error.response) {
      // Element Plus 的验证错误，不显示提示
      return;
    }
    
    // 显示具体的错误信息
    const errorMsg = error.response?.data?.message || error.message || '提交失败，请重试';
    ElMessage.error(errorMsg);
  } finally {
    feedbackLoading.value = false;
  }
};

// 重置表单
const resetForm = () => {
  feedbackFormRef.value?.resetFields();
  feedbackForm.type = '';
  feedbackForm.content = '';
  feedbackForm.screenshots = [null, null, null];
};

// 加载反馈历史
const loadFeedbackHistory = async () => {
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
};

// 获取类型标签
const getTypeTag = (type) => {
  const tagMap = {
    suggestion: 'success',
    bug: 'danger',
    question: 'warning',
    other: 'info'
  };
  return tagMap[type] || 'info';
};

// 获取类型标签文字
const getTypeLabel = (type) => {
  const labelMap = {
    suggestion: '功能建议',
    bug: 'Bug反馈',
    question: '使用问题',
    other: '其他'
  };
  return labelMap[type] || '其他';
};

// 获取状态标签样式
const getStatusTag = (status) => {
  const tagMap = {
    submitted: 'info',
    replied: 'success'
  };
  return tagMap[status] || 'info';
};

// 获取状态标签文字
const getStatusLabel = (status) => {
  const labelMap = {
    submitted: '已提交',
    replied: '已回复'
  };
  return labelMap[status] || '已提交';
};

onMounted(() => {
  loadFeedbackHistory();
});
</script>

<style scoped>
.feedback-container {
  min-height: calc(100vh - 60px);
  padding: 40px 60px;
  background: linear-gradient(120deg, #f0f7ff 0%, #f5fafe 100%);
  display: flex;
  gap: 40px;
}

.feedback-card {
  flex: 1;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  border: 2px solid #0969da;
  overflow: hidden;
}

.history-card {
  width: 400px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  border: 2px solid #67c23a;
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 600;
  color: #0969da;
}

.feedback-content {
  padding: 20px;
}

.feedback-desc {
  font-size: 15px;
  color: #f56c6c;
  font-weight: 700;
  line-height: 1.8;
  margin-bottom: 30px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
  border-left: 4px solid #0969da;
}

.feedback-form {
  margin-top: 20px;
}

.feedback-upload {
  width: 100%;
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

.submit-btn {
  width: 200px;
  font-weight: 600;
  letter-spacing: 1px;
}

.history-list {
  max-height: calc(100vh - 240px);
  overflow-y: auto;
  padding: 20px;
}

.history-item {
  padding: 16px;
  margin-bottom: 16px;
  background: #f5f7fa;
  border-radius: 8px;
  border-left: 3px solid #0969da;
  transition: all 0.3s;
}

.history-item:hover {
  background: #e8f4ff;
  box-shadow: 0 2px 8px rgba(9, 105, 218, 0.1);
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-tag {
  font-weight: 600;
}

.history-date {
  font-size: 13px;
  color: #999;
}

.history-content {
  font-size: 14px;
  color: #333;
  line-height: 1.6;
  word-break: break-all;
}

.history-reply {
  margin-top: 12px;
  padding: 12px;
  background: #e8f5e8;
  border-radius: 6px;
  border-left: 3px solid #67c23a;
}

.reply-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #67c23a;
  font-weight: 600;
  margin-bottom: 8px;
}

.reply-content {
  font-size: 14px;
  color: #333;
  line-height: 1.6;
}

/* 响应式 */
@media (max-width: 1200px) {
  .feedback-container {
    flex-direction: column;
    padding: 30px 20px;
  }
  
  .history-card {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .feedback-container {
    padding: 20px 15px;
  }
  
  .submit-btn {
    width: 100%;
  }
}

/* 蓝色框框标签样式 */
.form-label-tag {
  display: inline-block;
  padding: 4px 10px;
  background: rgba(9, 105, 218, 0.85);
  color: #fff;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  box-shadow: 0 1px 4px rgba(9, 105, 218, 0.2);
  white-space: nowrap;
  line-height: 1.2;
}

/* 隐藏所有表单项左侧的红色必填标记 */
.el-form-item.is-required:not(.is-no-asterisk) > .el-form-item__label:before,
.el-form-item.is-required:not(.is-no-asterisk).asterisk-left > .el-form-item__label:before {
  display: none !important;
}
</style>
