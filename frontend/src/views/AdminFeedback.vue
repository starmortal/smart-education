<!-- AdminFeedback.vue :: 管理员反馈管理页面 -->
<template>
  <div class="admin-feedback-container">
    <!-- 顶部导航 -->
    <header class="admin-header">
      <div class="header-left">
        <!-- Logo区域 -->
        <div class="logo-section" @click="goToHome">
          <img src="@/assets/logo.png" alt="智慧教育平台" class="nav-logo" />
          <span class="logo-text">智慧教育</span>
        </div>
      </div>
      
      <!-- 居中的页面标题 -->
      <div class="header-center">
        <div class="page-title-section">
          <el-icon size="20" color="#0969da"><Management /></el-icon>
          <span class="header-title">反馈管理系统</span>
        </div>
      </div>
      
      <div class="header-right">
        <span class="admin-info">{{ adminEmail }}</span>
        <el-button size="small" @click="handleLogout" :icon="SwitchButton">
          退出登录
        </el-button>
      </div>
    </header>

    <!-- 主内容区 -->
    <div class="admin-content">
      <el-card class="feedback-management-card">
        <template #header>
          <div class="card-header">
            <div class="header-info">
              <span>反馈列表</span>
              <el-tag type="info" size="small">共 {{ total }} 条</el-tag>
            </div>
            <div class="header-actions">
              <el-select v-model="statusFilter" @change="loadFeedbacks" size="small">
                <el-option label="全部状态" value="all" />
                <el-option label="已提交" value="submitted" />
                <el-option label="已回复" value="replied" />
              </el-select>
              <el-button size="small" @click="loadFeedbacks" :icon="RefreshRight">
                刷新
              </el-button>
            </div>
          </div>
        </template>

        <div class="feedback-list" v-loading="loading">
          <el-empty 
            v-if="feedbackList.length === 0" 
            description="暂无反馈记录"
            :image-size="100"
          />
          <div 
            v-else
            v-for="item in feedbackList" 
            :key="item._id"
            class="feedback-item"
          >
            <div class="feedback-header">
              <div class="header-left">
                <el-tag :type="getTypeTag(item.type)" size="small">
                  {{ getTypeLabel(item.type) }}
                </el-tag>
                <el-tag :type="getStatusTag(item.status)" size="small">
                  {{ getStatusLabel(item.status) }}
                </el-tag>
                <span class="user-info">用户：{{ item.nickname }}</span>
              </div>
              <span class="feedback-date">{{ formatDate(item.createTime) }}</span>
            </div>
            
            <div class="feedback-content">
              <div class="content-text">{{ item.content }}</div>
              
              <!-- 显示截图 -->
              <div v-if="item.screenshots && item.screenshots.length > 0" class="screenshots-section">
                <div class="screenshots-label">用户截图：</div>
                <div class="screenshots-grid">
                  <div 
                    v-for="(screenshot, index) in item.screenshots" 
                    :key="index"
                    class="screenshot-item"
                    @click="previewImage(screenshot)"
                  >
                    <img :src="screenshot" class="screenshot-thumb" />
                  </div>
                </div>
              </div>
            </div>

            <div v-if="item.reply" class="admin-reply">
              <div class="reply-label">
                <el-icon><ChatDotRound /></el-icon>
                管理员回复：
              </div>
              <div class="reply-content">{{ item.reply }}</div>
            </div>

            <div class="feedback-actions">
              <el-button 
                size="small" 
                @click="showDetailDialog(item)"
                :icon="View"
              >
                查看详情
              </el-button>
              <el-button 
                v-if="item.status !== 'replied'"
                size="small" 
                type="primary"
                @click="showReplyDialog(item)"
              >
                回复
              </el-button>
              <el-button 
                v-else
                size="small" 
                type="success"
                @click="showReplyDialog(item)"
              >
                编辑回复
              </el-button>
            </div>
          </div>

          <!-- 分页 -->
          <el-pagination
            v-if="total > 0"
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :total="total"
            layout="total, prev, pager, next"
            @current-change="loadFeedbacks"
            class="pagination"
          />
        </div>
      </el-card>
    </div>

    <!-- 回复对话框 -->
    <el-dialog
      v-model="replyDialogVisible"
      title="回复用户反馈"
      width="600px"
    >
      <div v-if="currentFeedback" class="reply-dialog-content">
        <div class="original-feedback">
          <h4>原始反馈：</h4>
          <p>{{ currentFeedback.content }}</p>
        </div>
        
        <el-form :model="replyForm" label-width="80px">
          <el-form-item label="回复内容">
            <el-input
              v-model="replyForm.reply"
              type="textarea"
              :rows="4"
              placeholder="请输入回复内容..."
              maxlength="500"
              show-word-limit
            />
          </el-form-item>
        </el-form>
      </div>
      
      <template #footer>
        <el-button @click="replyDialogVisible = false">取消</el-button>
        <el-button 
          type="primary" 
          @click="submitReply"
          :loading="replyLoading"
        >
          发送回复
        </el-button>
      </template>
    </el-dialog>

    <!-- 详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="反馈详情"
      width="700px"
    >
      <div v-if="currentFeedback" class="detail-dialog-content">
        <div class="detail-section">
          <h4>基本信息</h4>
          <div class="detail-info">
            <div class="info-item">
              <span class="label">反馈ID：</span>
              <span class="value">{{ currentFeedback._id }}</span>
            </div>
            <div class="info-item">
              <span class="label">用户昵称：</span>
              <span class="value">{{ currentFeedback.nickname }}</span>
            </div>
            <div class="info-item">
              <span class="label">反馈类型：</span>
              <el-tag :type="getTypeTag(currentFeedback.type)" size="small">
                {{ getTypeLabel(currentFeedback.type) }}
              </el-tag>
            </div>
            <div class="info-item">
              <span class="label">提交时间：</span>
              <span class="value">{{ formatDate(currentFeedback.createTime) }}</span>
            </div>
            <div class="info-item">
              <span class="label">当前状态：</span>
              <el-tag :type="getStatusTag(currentFeedback.status)" size="small">
                {{ getStatusLabel(currentFeedback.status) }}
              </el-tag>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h4>反馈内容</h4>
          <div class="feedback-text">{{ currentFeedback.content }}</div>
        </div>

        <div v-if="currentFeedback.screenshots && currentFeedback.screenshots.length > 0" class="detail-section">
          <h4>用户截图</h4>
          <div class="detail-screenshots">
            <div 
              v-for="(screenshot, index) in currentFeedback.screenshots" 
              :key="index"
              class="detail-screenshot-item"
              @click="previewImage(screenshot)"
            >
              <img :src="screenshot" class="detail-screenshot" />
            </div>
          </div>
        </div>

        <div v-if="currentFeedback.reply" class="detail-section">
          <h4>管理员回复</h4>
          <div class="reply-text">{{ currentFeedback.reply }}</div>
          <div class="reply-time">回复时间：{{ formatDate(currentFeedback.replyTime) }}</div>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
        <el-button 
          v-if="currentFeedback && currentFeedback.status !== 'replied'"
          type="primary" 
          @click="showReplyFromDetail"
        >
          回复反馈
        </el-button>
      </template>
    </el-dialog>

    <!-- 图片预览对话框 -->
    <el-dialog
      v-model="imagePreviewVisible"
      title="图片预览"
      width="80%"
      center
    >
      <div class="image-preview-container">
        <img :src="previewImageUrl" class="preview-image" />
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { 
  Management,
  RefreshRight,
  ChatDotRound,
  SwitchButton,
  View
} from '@element-plus/icons-vue';
import axios from 'axios';

const router = useRouter();
const loading = ref(false);
const replyLoading = ref(false);
const replyDialogVisible = ref(false);
const detailDialogVisible = ref(false);
const imagePreviewVisible = ref(false);
const statusFilter = ref('all');
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);

const feedbackList = ref([]);
const currentFeedback = ref(null);
const adminEmail = ref('');
const previewImageUrl = ref('');

const replyForm = reactive({
  reply: ''
});

onMounted(() => {
  // 检查管理员登录状态
  const token = localStorage.getItem('admin-token');
  const email = localStorage.getItem('admin-email');
  
  if (!token || token !== 'admin-authenticated') {
    router.push('/admin/login');
    return;
  }
  
  adminEmail.value = email;
  loadFeedbacks();
});

// 加载反馈列表
const loadFeedbacks = async () => {
  loading.value = true;
  try {
    console.log('正在加载反馈列表...', {
      page: currentPage.value,
      limit: pageSize.value,
      status: statusFilter.value
    });
    
    const res = await axios.get('http://localhost:3001/api/feedback/admin/list', {
      params: {
        page: currentPage.value,
        limit: pageSize.value,
        status: statusFilter.value
      }
    });
    
    console.log('反馈列表加载成功：', res.data);
    
    feedbackList.value = res.data.list || [];
    total.value = res.data.total || 0;
  } catch (error) {
    console.error('加载反馈列表失败：', error);
    ElMessage.error('加载反馈列表失败: ' + (error.response?.data?.message || error.message));
  } finally {
    loading.value = false;
  }
};

// 显示回复对话框
const showReplyDialog = (feedback) => {
  currentFeedback.value = feedback;
  replyForm.reply = feedback.reply || '';
  replyDialogVisible.value = true;
};

// 显示详情对话框
const showDetailDialog = (feedback) => {
  currentFeedback.value = feedback;
  detailDialogVisible.value = true;
};

// 从详情页面跳转到回复
const showReplyFromDetail = () => {
  detailDialogVisible.value = false;
  replyForm.reply = currentFeedback.value.reply || '';
  replyDialogVisible.value = true;
};

// 预览图片
const previewImage = (imageUrl) => {
  previewImageUrl.value = imageUrl;
  imagePreviewVisible.value = true;
};

// 提交回复
const submitReply = async () => {
  if (!replyForm.reply.trim()) {
    ElMessage.warning('请输入回复内容');
    return;
  }

  replyLoading.value = true;
  try {
    await axios.post('http://localhost:3001/api/feedback/reply', {
      feedbackId: currentFeedback.value._id,
      reply: replyForm.reply,
      adminId: 'admin'
    });
    
    ElMessage.success('回复成功');
    replyDialogVisible.value = false;
    replyForm.reply = '';
    loadFeedbacks();
  } catch (error) {
    console.error('回复失败：', error);
    ElMessage.error('回复失败');
  } finally {
    replyLoading.value = false;
  }
};

// 退出登录
const handleLogout = () => {
  localStorage.removeItem('admin-token');
  localStorage.removeItem('admin-email');
  router.push('/admin/login');
};

// 回到首页
const goToHome = () => {
  router.push('/home');
};

// 获取类型标签样式
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

// 格式化日期
const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleString('zh-CN');
};
</script>

<style scoped>
.admin-feedback-container {
  min-height: 100vh;
  background: #f5f7fa;
}

.admin-header {
  height: 60px;
  background: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-left {
  display: flex;
  align-items: center;
  min-width: 200px;
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 200px;
  justify-content: flex-end;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.3s;
}

.logo-section:hover {
  background: rgba(9, 105, 218, 0.1);
}

.nav-logo {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  object-fit: contain;
}

.logo-text {
  font-size: 16px;
  font-weight: 700;
  color: #0969da;
  letter-spacing: 0.5px;
}

.page-title-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: #0969da;
}

.admin-info {
  font-size: 14px;
  color: #666;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.admin-info {
  font-size: 14px;
  color: #666;
}

.admin-content {
  padding: 24px;
}

.feedback-management-card {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-radius: 12px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.feedback-list {
  padding: 20px;
}

.feedback-item {
  padding: 20px;
  margin-bottom: 16px;
  background: #f5f7fa;
  border-radius: 8px;
  border-left: 3px solid #0969da;
  transition: all 0.3s;
}

.feedback-item:hover {
  background: #e8f4ff;
  box-shadow: 0 2px 8px rgba(9, 105, 218, 0.1);
}

.feedback-header {
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

.user-info {
  font-size: 13px;
  color: #666;
  margin-left: 8px;
}

.feedback-date {
  font-size: 13px;
  color: #999;
}

.feedback-content {
  margin-bottom: 16px;
}

.content-text {
  font-size: 14px;
  color: #333;
  line-height: 1.6;
  word-break: break-all;
}

.admin-reply {
  margin-bottom: 16px;
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

.feedback-actions {
  display: flex;
  gap: 8px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.reply-dialog-content {
  padding: 10px 0;
}

.original-feedback {
  margin-bottom: 20px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 8px;
  border-left: 4px solid #0969da;
}

.original-feedback h4 {
  margin: 0 0 10px 0;
  color: #0969da;
  font-size: 14px;
}

.original-feedback p {
  margin: 0;
  color: #333;
  line-height: 1.6;
}

.screenshots-section {
  margin-top: 16px;
}

.screenshots-label {
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
  font-weight: 600;
}

.screenshots-grid {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.screenshot-item {
  width: 60px;
  height: 60px;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid #e4e7ed;
  transition: all 0.3s;
}

.screenshot-item:hover {
  border-color: #0969da;
  transform: scale(1.05);
}

.screenshot-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.detail-dialog-content {
  max-height: 70vh;
  overflow-y: auto;
}

.detail-section {
  margin-bottom: 24px;
}

.detail-section h4 {
  margin: 0 0 12px 0;
  color: #0969da;
  font-size: 16px;
  border-bottom: 1px solid #e4e7ed;
  padding-bottom: 8px;
}

.detail-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-item .label {
  font-weight: 600;
  color: #666;
  min-width: 80px;
}

.info-item .value {
  color: #333;
}

.feedback-text {
  padding: 12px;
  background: #f5f7fa;
  border-radius: 6px;
  color: #333;
  line-height: 1.6;
  white-space: pre-wrap;
}

.detail-screenshots {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
}

.detail-screenshot-item {
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid #e4e7ed;
  transition: all 0.3s;
}

.detail-screenshot-item:hover {
  border-color: #0969da;
  transform: scale(1.02);
}

.detail-screenshot {
  width: 100%;
  height: 120px;
  object-fit: cover;
}

.reply-text {
  padding: 12px;
  background: #e8f5e8;
  border-radius: 6px;
  color: #333;
  line-height: 1.6;
  border-left: 3px solid #67c23a;
}

.reply-time {
  margin-top: 8px;
  font-size: 12px;
  color: #999;
}

.image-preview-container {
  text-align: center;
}

.preview-image {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
}

@media (max-width: 768px) {
  .admin-content {
    padding: 16px;
  }
  
  .feedback-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .admin-header {
    padding: 0 16px;
  }
  
  .header-center {
    display: none; /* 移动端隐藏居中标题 */
  }
  
  .header-left {
    min-width: auto;
  }
  
  .header-right {
    min-width: auto;
  }
  
  .logo-text {
    font-size: 14px;
  }
}
</style>