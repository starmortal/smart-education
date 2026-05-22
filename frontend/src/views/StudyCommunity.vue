<template>
  <div class="study-community-container">
    <SideNavBar />
    
    <!-- 左侧边栏 -->
    <div class="community-sidebar" :class="{ collapsed: sidebarCollapsed }">
      <!-- 顶部标题栏 -->
      <div class="sidebar-header">
        <div class="section-title">
          <el-icon size="16"><DataAnalysis /></el-icon>
          <span>筛选</span>
        </div>
      </div>

      <div class="filter-list-section">
        <!-- 状态筛选 -->
        <div 
          class="filter-item"
          @click="toggleStatusFilter('unsolved')"
          :class="{ active: questionStatusFilter === 'unsolved' }"
        >
          <div class="filter-label">
            <span class="filter-dot" style="background: #f56c6c;"></span>
            待解决
          </div>
        </div>

        <div 
          class="filter-item"
          @click="toggleStatusFilter('solved')"
          :class="{ active: questionStatusFilter === 'solved' }"
        >
          <div class="filter-label">
            <span class="filter-dot" style="background: #67c23a;"></span>
            已解决
          </div>
        </div>

        <!-- 用户信息 -->
        <div class="section-divider">我的信息</div>
        
        <div class="user-info-card">
          <el-avatar :size="50" :src="userInfo.avatar" />
          <div class="user-details">
            <div class="user-name">{{ userInfo.nickname }}</div>
            <div class="user-meta">{{ userInfo.school }}</div>
            <div class="user-meta">{{ getGradeLabel(userInfo.grade) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧主内容 -->
    <div class="community-content" :class="{ expanded: sidebarCollapsed }">
      <div class="content-container">
        <!-- 顶部标题栏 -->
        <div class="editor-header">
          <el-button 
            :icon="sidebarCollapsed ? DArrowRight : DArrowLeft" 
            circle 
            size="small"
            @click="toggleSidebar"
          />
          <span class="file-name">学习社区</span>
          <div class="header-spacer"></div>
          <el-button :icon="Star" @click="showFavoritesDialog = true">管理收藏</el-button>
          <el-button type="primary" :icon="Plus" @click="showAskDialog = true">发起提问</el-button>
          <el-button :icon="Setting" @click="showManageDialog = true">管理我的疑问</el-button>
        </div>
        
        <!-- 问题列表 -->
        <div class="questions-list" v-loading="loading">
          <div class="questions-grid">
            <div 
              v-for="(question, index) in paginatedQuestions" 
              :key="question.id"
              class="question-card"
              :style="{ borderColor: getQuestionBorderColor(index) }"
              @click="handleQuestionDetail(question)"
            >
              <div class="card-header">
                <el-avatar :size="32" :src="question.userAvatar" />
                <div class="card-user-info">
                  <div class="card-username">{{ question.userName }}</div>
                  <div class="card-time">{{ formatTime(question.createTime) }}</div>
                </div>
                <el-icon 
                  :size="20" 
                  :color="isFavorited(question.id) ? '#f56c6c' : '#c0c4cc'"
                  @click.stop="toggleFavorite(question.id)"
                  style="cursor: pointer;"
                >
                  <Star :fill="isFavorited(question.id) ? '#f56c6c' : 'none'" />
                </el-icon>
              </div>
              
              <div class="card-title">{{ question.title }}</div>
              
              <div class="card-tags">
                <el-tag 
                  v-for="(tag, idx) in question.tags.slice(0, 2)" 
                  :key="idx"
                  size="small"
                  type="primary"
                >
                  {{ tag }}
                </el-tag>
                <el-tag v-if="question.tags.length > 2" size="small" type="info">
                  +{{ question.tags.length - 2 }}
                </el-tag>
              </div>
              
              <div class="card-footer">
                <el-tag :type="question.solved ? 'success' : 'warning'" size="small">
                  {{ question.solved ? '已解决' : '待解决' }}
                </el-tag>
              </div>
            </div>
          </div>
          
          <el-empty v-if="filteredQuestions.length === 0 && !loading" description="暂无问题" />
          
          <el-pagination
            v-if="filteredQuestions.length > pageSize"
            v-model:current-page="currentPage"
            :page-size="pageSize"
            :total="filteredQuestions.length"
            layout="prev, pager, next"
            @current-change="handlePageChange"
            style="margin-top: 20px; justify-content: center;"
          />
        </div>
      </div>
    </div>

    <!-- 发起提问对话框 -->
    <el-dialog
      v-model="showAskDialog"
      title="发起提问"
      width="700px"
      center
      class="blue-border-dialog"
    >
      <el-form :model="askForm" label-width="100px" :rules="askFormRules" ref="askFormRef">
        <el-form-item label="问题标题" prop="title">
          <el-input v-model="askForm.title" placeholder="请输入问题标题" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="问题描述" prop="content">
          <el-input v-model="askForm.content" type="textarea" rows="6" placeholder="请详细描述你的问题" maxlength="500" show-word-limit />
        </el-form-item>
        <el-form-item label="相关标签" prop="tags">
          <el-select v-model="askForm.tags" multiple placeholder="请选择标签（最多2个）" :multiple-limit="2">
            <el-option v-for="subject in userSubjects" :key="subject" :label="subject" :value="subject" />
            <el-option label="作业" value="作业" />
            <el-option label="考试" value="考试" />
            <el-option label="难题" value="难题" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAskDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitQuestion">提交</el-button>
      </template>
    </el-dialog>

    <!-- 问题详情对话框 -->
    <el-dialog
      v-model="showDetailDialog"
      title="问题详情"
      width="900px"
      center
      class="blue-border-dialog"
    >
      <div v-if="currentQuestion" class="question-detail">
        <div class="detail-header">
          <el-avatar :size="50" :src="currentQuestion.userAvatar" />
          <div class="detail-user-info">
            <div class="detail-username">{{ currentQuestion.userName }}</div>
            <div class="detail-meta">{{ currentQuestion.userSchool }} · {{ getGradeLabel(currentQuestion.userGrade) }}</div>
            <div class="detail-time">{{ formatTime(currentQuestion.createTime) }}</div>
          </div>
          <el-tag :type="currentQuestion.solved ? 'success' : 'warning'">
            {{ currentQuestion.solved ? '已解决' : '待解决' }}
          </el-tag>
        </div>
        
        <div class="detail-title">{{ currentQuestion.title }}</div>
        <div class="detail-content">{{ currentQuestion.content }}</div>
        
        <div class="detail-tags">
          <el-tag v-for="(tag, idx) in currentQuestion.tags" :key="idx" size="small" type="primary">
            {{ tag }}
          </el-tag>
        </div>

        <div class="detail-actions" v-if="currentQuestion.userId === userId">
          <el-button 
            v-if="!currentQuestion.solved" 
            type="success" 
            size="small"
            @click="handleMarkSolved(currentQuestion.id)"
          >
            标记已解决
          </el-button>
          <el-button 
            v-else 
            type="warning" 
            size="small"
            @click="handleMarkUnsolved(currentQuestion.id)"
          >
            标记未解决
          </el-button>
        </div>

        <div class="answers-section">
          <div class="section-title">
            <el-icon><ChatDotRound /></el-icon>
            <span>回答列表 ({{ answers.length }})</span>
          </div>
          
          <div class="answers-list">
            <div v-for="answer in answers" :key="answer.id" class="answer-item">
              <el-avatar :size="40" :src="answer.userAvatar" />
              <div class="answer-content-wrapper">
                <div class="answer-header">
                  <span class="answer-username">{{ answer.userName }}</span>
                  <el-tag v-if="answer.isBest" type="success" size="small">
                    <el-icon><Medal /></el-icon> 最佳答案
                  </el-tag>
                  <span class="answer-time">{{ formatTime(answer.createTime) }}</span>
                </div>
                <div class="answer-content" v-html="renderMarkdown(answer.content)"></div>
                <div class="answer-actions">
                  <el-button 
                    text 
                    :type="answer.liked ? 'primary' : 'default'"
                    @click="handleLikeAnswer(answer.id)"
                  >
                    <el-icon><Star /></el-icon>
                    {{ answer.likeCount }}
                  </el-button>
                  <el-button 
                    v-if="!answer.isBest && !currentQuestion.solved && currentQuestion.userId === userId"
                    text 
                    type="success"
                    @click="handleMarkBest(answer.id)"
                  >
                    <el-icon><Medal /></el-icon>
                    设为最佳
                  </el-button>
                </div>
              </div>
            </div>
            <el-empty v-if="answers.length === 0" description="暂无回答" :image-size="80" />
          </div>

          <div class="answer-input-section">
            <el-input 
              v-model="answerPlaceholder"
              placeholder="写下你的回答..."
              readonly
              @click="showAnswerDialog = true"
            />
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 回答输入对话框 -->
    <el-dialog
      v-model="showAnswerDialog"
      title="写回答"
      width="700px"
      center
      class="blue-border-dialog"
    >
      <el-input 
        v-model="answerContent"
        type="textarea"
        rows="8"
        placeholder="请输入你的回答（支持Markdown格式）"
        maxlength="500"
        show-word-limit
      />
      <template #footer>
        <el-button @click="showAnswerDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitAnswer">提交回答</el-button>
      </template>
    </el-dialog>

    <!-- 管理我的疑问对话框 -->
    <el-dialog
      v-model="showManageDialog"
      title="管理我的疑问"
      width="900px"
      center
      class="blue-border-dialog"
    >
      <div class="manage-toolbar">
        <el-checkbox v-model="selectAll" @change="handleSelectAll">全选</el-checkbox>
        <el-button 
          v-if="selectedQuestions.length > 0"
          type="danger" 
          size="small"
          :icon="Delete"
          @click="handleBatchDelete"
        >
          删除选中 ({{ selectedQuestions.length }})
        </el-button>
      </div>
      
      <div class="my-questions-list">
        <div v-for="question in myQuestions" :key="question.id" class="my-question-item">
          <el-checkbox 
            :model-value="selectedQuestions.includes(question.id)"
            @change="(val) => handleQuestionCheck(val, question.id)"
          />
          <div class="my-question-content" @click="handleQuestionDetail(question)">
            <div class="my-question-title">{{ question.title }}</div>
            <div class="my-question-meta">
              <el-tag size="small" :type="question.solved ? 'success' : 'warning'">
                {{ question.solved ? '已解决' : '待解决' }}
              </el-tag>
              <span>{{ question.answerCount }} 个回答</span>
              <span>{{ formatTime(question.createTime) }}</span>
            </div>
          </div>
          <div class="my-question-actions">
            <el-button 
              v-if="!question.solved"
              type="success" 
              size="small"
              @click="handleMarkSolved(question.id)"
            >
              标记已解决
            </el-button>
            <el-button 
              type="danger" 
              size="small"
              @click="handleDeleteQuestion(question.id)"
            >
              删除
            </el-button>
          </div>
        </div>
        <el-empty v-if="myQuestions.length === 0" description="暂无疑问" :image-size="100" />
      </div>
    </el-dialog>

    <!-- 收藏管理对话框 -->
    <el-dialog
      v-model="showFavoritesDialog"
      title="收藏管理"
      width="900px"
      center
      class="blue-border-dialog"
    >
      <div class="manage-toolbar">
        <el-checkbox v-model="selectAllFavorites" @change="handleSelectAllFavorites">全选</el-checkbox>
        <el-button 
          v-if="selectedFavorites.length > 0"
          type="danger" 
          size="small"
          :icon="Delete"
          @click="handleBatchDeleteFavorites"
        >
          删除选中 ({{ selectedFavorites.length }})
        </el-button>
      </div>
      
      <div class="favorites-manage-list">
        <div v-for="fav in myFavorites" :key="fav.id" class="favorite-manage-item">
          <el-checkbox 
            :model-value="selectedFavorites.includes(fav.id)"
            @change="(val) => handleFavoriteCheck(val, fav.id)"
          />
          <div class="favorite-manage-content" @click="handleQuestionDetail(fav)">
            <div class="favorite-manage-title">{{ fav.title }}</div>
            <div class="favorite-manage-meta">
              <span>{{ fav.userName }}</span>
              <span>{{ formatTime(fav.createTime) }}</span>
            </div>
          </div>
        </div>
        <el-empty v-if="myFavorites.length === 0" description="暂无收藏" :image-size="100" />
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { 
  Plus, Setting, Delete, Star, Medal, ChatDotRound, 
  DataAnalysis, DArrowLeft, DArrowRight 
} from '@element-plus/icons-vue';
import SideNavBar from '@/components/SideNavBar.vue';
import axios from 'axios';
import { marked } from 'marked';
import { getUserSubjects } from '@/utils/userSubjects';

const loading = ref(false);
const sidebarCollapsed = ref(false);
const userId = ref(localStorage.getItem('edu-user-id') || '');

// 用户信息
const userInfo = ref({
  nickname: localStorage.getItem('edu-nickname') || '默认用户',
  avatar: localStorage.getItem('edu-avatar') || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png',
  school: localStorage.getItem('edu-school') || '未设置',
  grade: localStorage.getItem('edu-grade') || ''
});

// 用户科目
const userSubjects = ref([]);

// 问题列表
const questions = ref([]);
const questionStatusFilter = ref('');
const currentPage = ref(1);
const pageSize = ref(4);

// 我的收藏
const myFavorites = ref([]);

// 对话框控制
const showAskDialog = ref(false);
const showDetailDialog = ref(false);
const showAnswerDialog = ref(false);
const showManageDialog = ref(false);
const showFavoritesDialog = ref(false);

// 当前问题和回答
const currentQuestion = ref(null);
const answers = ref([]);
const answerPlaceholder = ref('');
const answerContent = ref('');

// 表单
const askForm = reactive({
  title: '',
  content: '',
  tags: []
});

const askFormRules = {
  title: [{ required: true, message: '请输入问题标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入问题描述', trigger: 'blur' }],
  tags: [{ required: true, message: '请选择至少一个标签', trigger: 'change' }]
};

const askFormRef = ref(null);

// 管理相关
const myQuestions = computed(() => {
  if (!Array.isArray(questions.value)) return [];
  return questions.value.filter(q => q.userId === userId.value);
});
const selectedQuestions = ref([]);
const selectAll = ref(false);
const selectedFavorites = ref([]);
const selectAllFavorites = ref(false);

// 筛选后的问题列表
const filteredQuestions = computed(() => {
  if (!Array.isArray(questions.value)) return [];
  if (!questionStatusFilter.value) return questions.value;
  if (questionStatusFilter.value === 'unsolved') {
    return questions.value.filter(q => !q.solved);
  }
  if (questionStatusFilter.value === 'solved') {
    return questions.value.filter(q => q.solved);
  }
  return questions.value;
});

// 分页后的问题列表
const paginatedQuestions = computed(() => {
  if (!Array.isArray(filteredQuestions.value)) return [];
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredQuestions.value.slice(start, end);
});

// 切换侧边栏
function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value;
}

// 切换状态筛选
function toggleStatusFilter(status) {
  if (questionStatusFilter.value === status) {
    questionStatusFilter.value = '';
  } else {
    questionStatusFilter.value = status;
  }
  currentPage.value = 1;
}

// 获取问题边框颜色
function getQuestionBorderColor(index) {
  const colors = ['#0969da', '#35b778', '#ffc107', '#e74c3c'];
  return colors[index % colors.length];
}

// 格式化时间
function formatTime(timeStr) {
  if (!timeStr) return '';
  const time = new Date(timeStr);
  const now = new Date();
  const diff = Math.floor((now - time) / 1000);
  
  if (diff < 60) return '刚刚';
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}天前`;
  
  return timeStr.split(' ')[0];
}

// 获取年级标签
function getGradeLabel(grade) {
  const gradeMap = {
    'primary_1': '一年级', 'primary_2': '二年级', 'primary_3': '三年级',
    'primary_4': '四年级', 'primary_5': '五年级', 'primary_6': '六年级',
    'junior_1': '初一', 'junior_2': '初二', 'junior_3': '初三',
    'senior_1': '高一', 'senior_2': '高二', 'senior_3': '高三'
  };
  return gradeMap[grade] || '未设置';
}

// 渲染Markdown
function renderMarkdown(content) {
  return marked(content || '');
}

// 判断是否已收藏
function isFavorited(questionId) {
  if (!Array.isArray(myFavorites.value)) return false;
  return myFavorites.value.some(fav => fav.id === questionId);
}

// 切换收藏
async function toggleFavorite(questionId) {
  try {
    if (isFavorited(questionId)) {
      await axios.delete(`http://localhost:3001/api/community/favorites/${questionId}`, {
        data: { userId: userId.value }
      });
      ElMessage.success('已取消收藏');
    } else {
      await axios.post('http://localhost:3001/api/community/favorites', {
        userId: userId.value,
        questionId
      });
      ElMessage.success('收藏成功');
    }
    await loadMyFavorites();
  } catch (error) {
    console.error('收藏操作失败：', error);
    ElMessage.error('操作失败');
  }
}

// 分页变化
function handlePageChange(page) {
  currentPage.value = page;
}

// 加载问题列表
async function loadQuestions() {
  loading.value = true;
  try {
    const res = await axios.get('http://localhost:3001/api/community/questions', {
      params: { userId: userId.value }
    });
    questions.value = res.data || [];
  } catch (error) {
    console.error('加载问题列表失败：', error);
    ElMessage.error('加载问题列表失败');
  } finally {
    loading.value = false;
  }
}

// 加载我的收藏
async function loadMyFavorites() {
  try {
    const res = await axios.get('http://localhost:3001/api/community/favorites', {
      params: { userId: userId.value }
    });
    myFavorites.value = res.data || [];
  } catch (error) {
    console.error('加载收藏失败：', error);
  }
}

// 提交问题
async function handleSubmitQuestion() {
  try {
    await askFormRef.value.validate();
    loading.value = true;
    
    await axios.post('http://localhost:3001/api/community/questions', {
      title: askForm.title,
      content: askForm.content,
      tags: askForm.tags,
      userId: userId.value,
      userName: userInfo.value.nickname,
      userAvatar: userInfo.value.avatar
    });
    
    ElMessage.success('提问成功');
    showAskDialog.value = false;
    askForm.title = '';
    askForm.content = '';
    askForm.tags = [];
    
    await loadQuestions();
  } catch (error) {
    console.error('提交问题失败：', error);
    ElMessage.error('提交失败');
  } finally {
    loading.value = false;
  }
}

// 查看问题详情
async function handleQuestionDetail(question) {
  currentQuestion.value = question;
  showDetailDialog.value = true;
  
  try {
    // 加载问题详情（包含用户信息）
    const userRes = await axios.get(`http://localhost:3001/api/user/profile/${question.userId}`);
    if (userRes.data) {
      currentQuestion.value.userSchool = userRes.data.school || '未设置';
      currentQuestion.value.userGrade = userRes.data.grade || '';
    }
    
    // 加载回答列表
    const answersRes = await axios.get(
      `http://localhost:3001/api/community/questions/${question.id}/answers`,
      { params: { userId: userId.value } }
    );
    answers.value = answersRes.data || [];
  } catch (error) {
    console.error('加载问题详情失败：', error);
  }
}

// 提交回答
async function handleSubmitAnswer() {
  if (!answerContent.value.trim()) {
    ElMessage.warning('请输入回答内容');
    return;
  }
  
  try {
    await axios.post(
      `http://localhost:3001/api/community/questions/${currentQuestion.value.id}/answers`,
      {
        content: answerContent.value,
        userId: userId.value,
        userName: userInfo.value.nickname,
        userAvatar: userInfo.value.avatar
      }
    );
    
    ElMessage.success('回答成功');
    showAnswerDialog.value = false;
    answerContent.value = '';
    
    // 重新加载回答列表
    await handleQuestionDetail(currentQuestion.value);
  } catch (error) {
    console.error('提交回答失败：', error);
    ElMessage.error('提交失败');
  }
}

// 点赞回答
async function handleLikeAnswer(answerId) {
  try {
    const answer = answers.value.find(a => a.id === answerId);
    if (answer.liked) {
      await axios.delete(`http://localhost:3001/api/community/answers/${answerId}/like`, {
        data: { userId: userId.value }
      });
    } else {
      await axios.post(`http://localhost:3001/api/community/answers/${answerId}/like`, {
        userId: userId.value
      });
    }
    
    // 重新加载回答列表
    await handleQuestionDetail(currentQuestion.value);
  } catch (error) {
    console.error('点赞失败：', error);
    ElMessage.error('操作失败');
  }
}

// 设为最佳答案
async function handleMarkBest(answerId) {
  try {
    await axios.post(`http://localhost:3001/api/community/answers/${answerId}/mark-best`, {
      questionId: currentQuestion.value.id,
      userId: userId.value
    });
    
    ElMessage.success('已设为最佳答案');
    await handleQuestionDetail(currentQuestion.value);
    await loadQuestions();
  } catch (error) {
    console.error('设置最佳答案失败：', error);
    ElMessage.error('操作失败');
  }
}

// 标记已解决
async function handleMarkSolved(questionId) {
  try {
    await axios.post(`http://localhost:3001/api/community/questions/${questionId}/solve`, {
      userId: userId.value
    });
    
    ElMessage.success('已标记为已解决');
    showDetailDialog.value = false;
    showManageDialog.value = false;
    await loadQuestions();
  } catch (error) {
    console.error('标记失败：', error);
    ElMessage.error('操作失败');
  }
}

// 标记未解决
async function handleMarkUnsolved(questionId) {
  try {
    await axios.post(`http://localhost:3001/api/community/questions/${questionId}/unsolve`, {
      userId: userId.value
    });
    
    ElMessage.success('已标记为未解决');
    showDetailDialog.value = false;
    await loadQuestions();
  } catch (error) {
    console.error('标记失败：', error);
    ElMessage.error('操作失败');
  }
}

// 删除问题
async function handleDeleteQuestion(questionId) {
  try {
    await ElMessageBox.confirm('确定删除这个问题吗？', '提示', { type: 'warning' });
    
    await axios.delete(`http://localhost:3001/api/community/questions/${questionId}`, {
      data: { userId: userId.value }
    });
    
    ElMessage.success('删除成功');
    await loadQuestions();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败：', error);
      ElMessage.error('删除失败');
    }
  }
}

// 全选/取消全选问题
function handleSelectAll(val) {
  if (val) {
    selectedQuestions.value = myQuestions.value.map(q => q.id);
  } else {
    selectedQuestions.value = [];
  }
}

// 问题选择变化
function handleQuestionCheck(checked, questionId) {
  if (checked) {
    if (!selectedQuestions.value.includes(questionId)) {
      selectedQuestions.value.push(questionId);
    }
  } else {
    const index = selectedQuestions.value.indexOf(questionId);
    if (index > -1) {
      selectedQuestions.value.splice(index, 1);
    }
  }
}

// 批量删除问题
async function handleBatchDelete() {
  if (selectedQuestions.value.length === 0) {
    ElMessage.warning('请选择要删除的问题');
    return;
  }
  
  try {
    await ElMessageBox.confirm(
      `确定删除选中的 ${selectedQuestions.value.length} 个问题吗？`,
      '批量删除确认',
      { type: 'warning' }
    );
    
    for (const questionId of selectedQuestions.value) {
      await axios.delete(`http://localhost:3001/api/community/questions/${questionId}`, {
        data: { userId: userId.value }
      });
    }
    
    ElMessage.success(`成功删除 ${selectedQuestions.value.length} 个问题`);
    selectedQuestions.value = [];
    selectAll.value = false;
    showManageDialog.value = false;
    await loadQuestions();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除失败：', error);
      ElMessage.error('删除失败');
    }
  }
}

// 全选/取消全选收藏
function handleSelectAllFavorites(val) {
  if (val) {
    selectedFavorites.value = myFavorites.value.map(f => f.id);
  } else {
    selectedFavorites.value = [];
  }
}

// 收藏选择变化
function handleFavoriteCheck(checked, favoriteId) {
  if (checked) {
    if (!selectedFavorites.value.includes(favoriteId)) {
      selectedFavorites.value.push(favoriteId);
    }
  } else {
    const index = selectedFavorites.value.indexOf(favoriteId);
    if (index > -1) {
      selectedFavorites.value.splice(index, 1);
    }
  }
}

// 批量删除收藏
async function handleBatchDeleteFavorites() {
  if (selectedFavorites.value.length === 0) {
    ElMessage.warning('请选择要删除的收藏');
    return;
  }
  
  try {
    await ElMessageBox.confirm(
      `确定删除选中的 ${selectedFavorites.value.length} 个收藏吗？`,
      '批量删除确认',
      { type: 'warning' }
    );
    
    for (const favoriteId of selectedFavorites.value) {
      await axios.delete(`http://localhost:3001/api/community/favorites/${favoriteId}`, {
        data: { userId: userId.value }
      });
    }
    
    ElMessage.success(`成功删除 ${selectedFavorites.value.length} 个收藏`);
    selectedFavorites.value = [];
    selectAllFavorites.value = false;
    await loadMyFavorites();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除失败：', error);
      ElMessage.error('删除失败');
    }
  }
}

// 生命周期
onMounted(async () => {
  userSubjects.value = await getUserSubjects();
  await loadQuestions();
  await loadMyFavorites();
});
</script>

<style scoped>
.study-community-container {
  display: block;
  height: 100vh;
  background: #f5f7fa;
  overflow: hidden;
  position: relative;
}

/* 左侧边栏 */
.community-sidebar {
  width: 280px;
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

.community-sidebar.collapsed {
  transform: translateX(-280px);
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid #e4e7ed;
  background: #fff;
  flex-shrink: 0;
  height: 56px;
  display: flex;
  align-items: center;
  box-sizing: border-box;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  font-weight: 600;
  color: #2c3e50;
}

.filter-list-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
  background: #fafafa;
  padding: 12px;
}

.filter-list-section::-webkit-scrollbar {
  width: 4px;
}

.filter-list-section::-webkit-scrollbar-thumb {
  background: #dcdfe6;
  border-radius: 2px;
}

.section-divider {
  font-size: 12px;
  color: #909399;
  font-weight: 600;
  padding: 8px 0 4px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: #f8f9fa;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
  border: 1.5px solid transparent;
}

.filter-item:hover {
  background: #e8f4ff;
  transform: translateX(2px);
}

.filter-item.active {
  background: #e8f4ff;
  border-color: #0969da;
  transform: translateX(2px);
}

.filter-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #2c3e50;
  font-weight: 500;
}

.filter-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.user-info-card {
  background: #fff;
  padding: 16px;
  border-radius: 8px;
  display: flex;
  gap: 12px;
  align-items: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.user-details {
  flex: 1;
}

.user-name {
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 4px;
}

.user-meta {
  font-size: 12px;
  color: #909399;
  margin-bottom: 2px;
}

/* 右侧主内容 */
.community-content {
  position: fixed;
  left: 340px;
  right: 0;
  top: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  background: #fff;
  transition: left 0.3s;
}

.community-content.expanded {
  left: 60px;
}

.content-container {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
  height: 100%;
}

.editor-header {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e4e7ed;
  background: #fff;
  gap: 12px;
  flex-shrink: 0;
  height: 56px;
  box-sizing: border-box;
}

.file-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.header-spacer {
  flex: 1;
}

.questions-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.questions-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 16px;
  height: calc(100vh - 200px);
}

.question-card {
  background: #fff;
  border: 2px solid;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.question-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.card-user-info {
  flex: 1;
}

.card-username {
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
}

.card-time {
  font-size: 12px;
  color: #909399;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1;
}

.card-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
}

/* 问题详情 */
.question-detail {
  padding: 10px;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 20px;
}

.detail-user-info {
  flex: 1;
}

.detail-username {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
}

.detail-meta {
  font-size: 13px;
  color: #666;
  margin-top: 4px;
}

.detail-time {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.detail-title {
  font-size: 20px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 16px;
}

.detail-content {
  font-size: 15px;
  color: #333;
  line-height: 1.8;
  white-space: pre-wrap;
  margin-bottom: 16px;
}

.detail-tags {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.detail-actions {
  margin-bottom: 20px;
}

.answers-section {
  border-top: 1px solid #e4e7ed;
  padding-top: 20px;
}

.answers-list {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 400px;
  overflow-y: auto;
}

.answer-item {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.answer-content-wrapper {
  flex: 1;
}

.answer-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.answer-username {
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
}

.answer-time {
  font-size: 12px;
  color: #909399;
  margin-left: auto;
}

.answer-content {
  font-size: 14px;
  color: #333;
  line-height: 1.6;
  margin-bottom: 8px;
}

.answer-actions {
  display: flex;
  gap: 12px;
}

.answer-input-section {
  margin-top: 20px;
}

/* 管理对话框 */
.manage-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 16px;
}

.my-questions-list,
.favorites-manage-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 500px;
  overflow-y: auto;
}

.my-question-item,
.favorite-manage-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #fff;
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  transition: all 0.3s;
}

.my-question-item:hover,
.favorite-manage-item:hover {
  border-color: #0969da;
  box-shadow: 0 2px 8px rgba(9, 105, 218, 0.1);
}

.my-question-content,
.favorite-manage-content {
  flex: 1;
  cursor: pointer;
}

.my-question-title,
.favorite-manage-title {
  font-size: 15px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 8px;
}

.my-question-meta,
.favorite-manage-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: #666;
}

.my-question-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

/* 蓝色描边对话框 */
:deep(.blue-border-dialog .el-dialog) {
  border: 3px solid #0969da;
  box-shadow: 0 4px 20px rgba(9, 105, 218, 0.3);
}

/* 响应式 */
@media (max-width: 1200px) {
  .questions-grid {
    grid-template-columns: 1fr;
    grid-template-rows: repeat(4, 1fr);
  }
}
</style>
