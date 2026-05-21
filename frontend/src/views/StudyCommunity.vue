<template>
  <div class="study-community-container">
    <!-- 顶部导航栏 -->
    <TopNavBar />

    <!-- 实时数据统计 -->
    <div class="stats-bar">
      <div class="stat-item">
        <el-icon size="24" color="#e6a23c"><QuestionFilled /></el-icon>
        <div class="stat-content">
          <div class="stat-value">{{ stats.totalQuestions || 0 }}</div>
          <div class="stat-label">疑问总数</div>
        </div>
      </div>
      <div class="stat-item">
        <el-icon size="24" color="#f56c6c"><Warning /></el-icon>
        <div class="stat-content">
          <div class="stat-value">{{ stats.unsolvedQuestions || 0 }}</div>
          <div class="stat-label">未解决疑问数</div>
        </div>
      </div>
      <div class="stat-item">
        <el-icon size="24" color="#409eff"><ChatDotRound /></el-icon>
        <div class="stat-content">
          <div class="stat-value">{{ stats.myQuestions || 0 }}</div>
          <div class="stat-label">我的疑问总数</div>
        </div>
      </div>
    </div>

    <!-- 鼓励讨论的提示文字 -->
    <div class="discussion-encouragement">
      <p>遇到AI无法理解的复杂问题？欢迎在这里与同学们互相讨论，集思广益找到答案！</p>
    </div>

    <!-- 主内容区 -->
    <div class="community-content">
      <!-- 左侧：互助答疑 -->
      <div class="left-section">
        <!-- 同伴互助答疑 -->
        <div class="questions-container">
          <div class="section-header">
            <div class="header-left">
              <el-icon size="20"><ChatDotRound /></el-icon>
              <span>同伴互助答疑</span>
              <div class="status-filter-buttons">
                <el-button 
                  size="small"
                  :type="questionStatusFilter === 'unsolved' ? 'primary' : 'default'"
                  @click="toggleQuestionStatus('unsolved')"
                >
                  待解决
                </el-button>
                <el-button 
                  size="small"
                  :type="questionStatusFilter === 'solved' ? 'primary' : 'default'"
                  @click="toggleQuestionStatus('solved')"
                >
                  已解决
                </el-button>
              </div>
            </div>
            <div class="header-actions">
              <!-- 分页控制 -->
              <el-pagination
                v-if="filteredQuestionsCount > questionPageSize"
                v-model:current-page="questionCurrentPage"
                :page-size="questionPageSize"
                :total="filteredQuestionsCount"
                layout="prev, pager, next"
                small
                @current-change="handleQuestionPageChange"
              />
              <el-button 
                type="primary" 
                size="small" 
                :icon="Warning" 
                @click="showMyQuestionsDialog = true"
              >
                管理我的疑问
              </el-button>
              <el-button 
                type="primary" 
                size="small" 
                :icon="QuestionFilled" 
                @click="showAskQuestionDialog = true"
              >
                发起提问
              </el-button>
            </div>
          </div>
          
          <div class="question-list" v-loading="questionLoading">
            <div class="question-grid">
              <div 
                v-for="(question, index) in paginatedQuestions" 
                :key="question.id"
                class="question-item"
                :style="{ borderColor: getQuestionBorderColor(index) }"
                @click="viewQuestionDetail(question)"
              >
                <div class="question-header">
                  <el-avatar :size="32" :src="question.userAvatar" />
                  <div class="question-user">
                    <span class="user-name">{{ question.userName }}</span>
                    <span class="question-time">{{ formatTime(question.createTime) }}</span>
                  </div>
                  <el-tag 
                    size="small" 
                    :type="question.solved ? 'success' : 'warning'"
                  >
                    {{ question.solved ? '已解决' : '待解决' }}
                  </el-tag>
                </div>
                
                <div class="question-title">{{ question.title }}</div>
                
                <div class="question-footer">
                  <div class="question-tags">
                    <el-tag 
                      v-for="tag in question.tags.slice(0, 2)" 
                      :key="tag"
                      size="small"
                      effect="plain"
                    >
                      {{ tag }}
                    </el-tag>
                    <span v-if="question.tags.length > 2" class="more-tags">
                      +{{ question.tags.length - 2 }}
                    </span>
                  </div>
                  <el-button
                    size="small"
                    :type="isFavorited(question.id) ? 'warning' : 'default'"
                    :icon="Star"
                    circle
                    @click.stop="toggleFavorite(question)"
                  />
                </div>
              </div>
            </div>
            
            <el-empty v-if="questions.length === 0 && !questionLoading" description="暂无问题" />
          </div>
        </div>
      </div>

      <!-- 右侧：用户信息和收藏 -->
      <div class="right-section">
        <!-- 用户信息卡片 -->
        <div class="user-info-card">
          <div class="user-info-header">
            <el-avatar :size="70" :src="userInfo.avatar" />
            <div class="user-info-main">
              <div class="user-name">{{ userInfo.nickname }}</div>
            </div>
          </div>
          <div class="user-details">
            <div class="detail-item">
              <el-icon><School /></el-icon>
              <span>{{ userInfo.school || '未设置学校' }}</span>
            </div>
            <div class="detail-item">
              <el-icon><Reading /></el-icon>
              <span>{{ getGradeLabel(userInfo.grade) || '未设置年级' }}</span>
            </div>
          </div>
        </div>

        <!-- 我的收藏 -->
        <div class="favorites-box">
          <div class="box-header">
            <div class="header-left">
              <el-icon size="18"><Star /></el-icon>
              <span>我的收藏</span>
            </div>
            <el-button 
              size="small" 
              type="primary" 
              text
              @click="showFavoritesManageDialog = true"
            >
              管理
            </el-button>
          </div>
          <div class="box-list box-list-no-scroll">
            <div 
              v-for="q in displayedFavorites" 
              :key="q.id"
              class="box-item"
              @click="viewQuestionDetail(q)"
            >
              <div class="box-item-title">{{ q.title }}</div>
            </div>
            <el-empty 
              v-if="myFavorites.length === 0" 
              description="暂无收藏" 
              :image-size="60"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 发起提问对话框 -->
    <el-dialog
      v-model="showAskQuestionDialog"
      title="发起提问"
      width="700px"
      center
      class="blue-border-dialog"
    >
      <el-form :model="questionForm" label-width="100px">
        <el-form-item>
          <template #label>
            <div class="form-label-tag">问题标题</div>
          </template>
          <el-input v-model="questionForm.title" placeholder="请输入问题标题" />
        </el-form-item>
        <el-form-item>
          <template #label>
            <div class="form-label-tag">问题描述</div>
          </template>
          <el-input 
            v-model="questionForm.content" 
            type="textarea" 
            :rows="6"
            placeholder="请详细描述你的问题"
          />
        </el-form-item>
        <el-form-item>
          <template #label>
            <div class="form-label-tag">相关标签</div>
          </template>
          <el-checkbox-group v-model="questionForm.tags" :max="2">
            <!-- 动态科目标签 -->
            <el-checkbox 
              v-for="subject in userSubjects" 
              :key="subject"
              :label="subject" 
              :value="subject"
            />
            <!-- 固定标签 -->
            <el-checkbox label="作业" value="homework" />
            <el-checkbox label="考试" value="exam" />
            <el-checkbox label="难题" value="difficult" />
          </el-checkbox-group>
          <div style="margin-top: 8px; font-size: 12px; color: #909399;">
            最多选择2个标签
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAskQuestionDialog = false">取消</el-button>
        <el-button type="primary" @click="askQuestion">发布</el-button>
      </template>
    </el-dialog>

    <!-- 管理我的疑问对话框 -->
    <el-dialog
      v-model="showMyQuestionsDialog"
      title="管理我的疑问"
      width="900px"
      center
      class="blue-border-dialog"
    >
      <div class="my-questions-manage">
        <div class="manage-toolbar-dialog">
          <el-checkbox 
            v-model="selectAllQuestions"
            @change="handleSelectAllQuestions"
            :indeterminate="isQuestionIndeterminate"
          >
            全选
          </el-checkbox>
          <el-button 
            v-if="selectedQuestions.length > 0"
            type="danger" 
            size="small"
            :icon="Delete" 
            @click="batchDeleteQuestions"
            :disabled="selectedQuestions.length === 0"
          >
            删除选中 ({{ selectedQuestions.length }})
          </el-button>
        </div>
        
        <div class="questions-list-manage">
          <div 
            v-for="question in myPublishedQuestions" 
            :key="question.id"
            class="question-manage-item"
          >
            <el-checkbox 
              :model-value="selectedQuestions.includes(question.id)"
              @change="(val) => handleQuestionCheckChange(val, question.id)"
            />
            <div class="question-manage-content" @click="viewQuestionDetail(question)">
              <div class="question-manage-title">{{ question.title }}</div>
              <div class="question-manage-meta">
                <span>回答数: {{ question.answerCount || 0 }}</span>
                <el-tag :type="question.solved ? 'success' : 'warning'" size="small">
                  {{ question.solved ? '已解决' : '未解决' }}
                </el-tag>
                <span class="question-manage-time">{{ formatTime(question.createTime) }}</span>
              </div>
            </div>
            <div class="question-manage-actions">
              <el-button 
                v-if="!question.solved"
                size="small" 
                type="success"
                @click="markQuestionAsSolved(question)"
              >
                标记已解决
              </el-button>
              <el-button 
                v-else
                size="small" 
                type="warning"
                @click="markQuestionAsUnsolved(question)"
              >
                标记未解决
              </el-button>
            </div>
          </div>
        </div>
        
        <el-empty 
          v-if="myPublishedQuestions.length === 0" 
          description="暂无发布的疑问" 
          :image-size="100"
        />
      </div>
    </el-dialog>

    <!-- 收藏管理对话框 -->
    <el-dialog
      v-model="showFavoritesManageDialog"
      title="管理我的收藏"
      width="900px"
      center
      class="blue-border-dialog"
    >
      <div class="favorites-manage-content">
        <div class="manage-actions">
          <el-checkbox 
            v-model="selectAllFavorites"
            @change="handleSelectAllFavorites"
            :indeterminate="isIndeterminate"
          >
            全选
          </el-checkbox>
          <el-button 
            v-if="selectedFavorites.length > 0"
            type="danger" 
            size="small"
            :disabled="selectedFavorites.length === 0"
            @click="batchRemoveFavorites"
          >
            删除选中 ({{ selectedFavorites.length }})
          </el-button>
        </div>
        
        <el-divider />
        
        <el-checkbox-group v-model="selectedFavorites">
          <div 
            v-for="q in myFavorites" 
            :key="q.id"
            class="favorite-manage-item"
          >
            <el-checkbox :label="q.id">
              <div class="favorite-item-content">
                <div class="favorite-item-title">{{ q.title }}</div>
                <div class="favorite-item-meta">
                  <span>{{ q.userName }}</span>
                  <span>{{ formatTime(q.createTime) }}</span>
                </div>
              </div>
            </el-checkbox>
            <el-button 
              size="small" 
              type="primary"
              text
              @click="viewQuestionDetail(q)"
            >
              查看详情
            </el-button>
          </div>
        </el-checkbox-group>
        
        <el-empty 
          v-if="myFavorites.length === 0" 
          description="暂无收藏" 
          :image-size="100"
        />
      </div>
      <template #footer>
        <el-button @click="showFavoritesManageDialog = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 问题详情对话框 -->
    <el-dialog
      v-model="showQuestionDetailDialog"
      title="问题详情"
      width="900px"
      center
      :close-on-click-modal="true"
      class="blue-border-dialog question-detail-dialog"
    >
      <div v-if="selectedQuestion" class="question-detail">
        <!-- 问题信息 - 简化版 -->
        <div class="detail-header-simple">
          <el-avatar :size="60" :src="selectedQuestion.userAvatar" />
          <div class="detail-user-info">
            <div class="user-name-large">{{ selectedQuestion.userName }}</div>
            <div class="user-extra-info">
              <span v-if="selectedQuestion.userSchool">{{ selectedQuestion.userSchool }}</span>
              <span v-if="selectedQuestion.userGrade" class="grade-info">{{ getGradeLabel(selectedQuestion.userGrade) }}</span>
            </div>
          </div>
        </div>
        
        <div class="detail-content-large">{{ selectedQuestion.content }}</div>
        
        <div class="detail-actions">
          <el-button 
            v-if="selectedQuestion.userId === currentUserId && !selectedQuestion.solved"
            size="default" 
            type="success"
            @click="markAsSolved"
          >
            <el-icon><Check /></el-icon>
            标记为已解决
          </el-button>
        </div>
        
        <el-divider />
        
        <!-- 回答列表 -->
        <div class="answers-section">
          <div class="answers-header">
            <span>回答列表 ({{ questionAnswers.length }})</span>
            <div class="answer-input-inline-bordered" v-if="!showAnswerInputDialog">
              <el-input
                v-model="answerInputPlaceholder"
                placeholder="点击输入你的回答..."
                readonly
                @click="handleAnswerInputFocus"
              />
            </div>
          </div>
          
          <div v-if="questionAnswers.length > 0" class="answer-list">
            <div v-for="answer in questionAnswers" :key="answer.id" class="answer-item">
              <div class="answer-header">
                <el-avatar :size="36" :src="answer.userAvatar" />
                <div class="answer-user">
                  <div class="user-name">{{ answer.userName }}</div>
                  <div class="answer-time">{{ formatTime(answer.createTime) }}</div>
                </div>
                <el-tag v-if="answer.isBest" size="small" type="success">
                  <el-icon><Medal /></el-icon>
                  最佳答案
                </el-tag>
              </div>
              <div class="answer-content">{{ answer.content }}</div>
              <div class="answer-actions">
                <el-button 
                  size="small" 
                  :type="answer.liked ? 'primary' : 'default'"
                  text
                  @click="toggleLikeAnswer(answer)"
                >
                  <el-icon><Star /></el-icon>
                  {{ answer.liked ? '已点赞' : '点赞' }} ({{ answer.likeCount }})
                </el-button>
                <el-button 
                  v-if="selectedQuestion.userId === currentUserId && !answer.isBest && !selectedQuestion.solved"
                  size="small" 
                  type="success"
                  text
                  @click="markAsBest(answer)"
                >
                  <el-icon><Medal /></el-icon>
                  设为最佳
                </el-button>
              </div>
            </div>
          </div>
          
          <el-empty 
            v-else 
            description="暂无回答，快来抢沙发吧！" 
            :image-size="100"
          />
        </div>
        
        <!-- 展开的回答输入框 -->
        <el-dialog
          v-model="showAnswerInputDialog"
          title="写下你的回答"
          width="600px"
          center
          :close-on-click-modal="false"
          class="blue-border-dialog"
          @close="closeAnswerDialog"
        >
          <el-input
            v-model="newAnswer"
            type="textarea"
            :rows="6"
            placeholder="请详细描述你的解答思路..."
            maxlength="500"
            show-word-limit
            autofocus
          />
          <template #footer>
            <el-button @click="closeAnswerDialog">取消</el-button>
            <el-button 
              type="primary" 
              @click="submitAnswer"
              :disabled="!newAnswer.trim()"
            >
              提交回答
            </el-button>
          </template>
        </el-dialog>
      </div>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import axios from 'axios';
import {
  Plus,
  QuestionFilled,
  UserFilled,
  User,
  ChatDotRound,
  View,
  Star,
  ChatLineSquare,
  Clock,
  Warning,
  Checked,
  Medal,
  School,
  Reading,
  Delete,
  Check
} from '@element-plus/icons-vue';
import TopNavBar from '@/components/TopNavBar.vue';
// 【新增】引入用户科目工具
import { getUserSubjects } from '@/utils/userSubjects';

const router = useRouter();

// API基础URL
const API_BASE_URL = 'http://localhost:3001/api/community';

// 基础变量
const questionLoading = ref(false);

// 分页
const questionCurrentPage = ref(1);
const questionPageSize = ref(4); // 每页显示4个问题（2列2行）

// 对话框控制
const showAskQuestionDialog = ref(false);
const showQuestionDetailDialog = ref(false);
const showFavoritesManageDialog = ref(false);
const showMyQuestionsDialog = ref(false); // 管理我的疑问对话框

// 问题状态筛选
const questionStatusFilter = ref(''); // '' 表示全部，'solved' 表示已解决，'unsolved' 表示待解决

// 表单数据
const questionForm = reactive({
  title: '',
  content: '',
  tags: [] // 改为数组，用于多选
});

// 【新增】用户科目
const userSubjects = ref([]);

const newAnswer = ref('');
const answerInputPlaceholder = ref(''); // 占位输入框
const selectedQuestion = ref(null);
const questionAnswers = ref([]);
const selectedFavorites = ref([]); // 选中的收藏ID列表
const selectAllFavorites = ref(false); // 全选状态
const isIndeterminate = ref(false); // 半选状态

// 回答输入框对话框
const showAnswerInputDialog = ref(false);

// 管理我的疑问的全选状态
const selectedQuestions = ref([]); // 选中的疑问ID列表
const selectAllQuestions = ref(false); // 全选状态
const isQuestionIndeterminate = ref(false); // 半选状态

// 当前用户ID
const currentUserId = localStorage.getItem('edu-user-id') || '';

// 用户信息
const userInfo = reactive({
  nickname: localStorage.getItem('edu-nickname') || '智慧学习者',
  avatar: localStorage.getItem('edu-avatar') || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png',
  school: localStorage.getItem('edu-school') || '',
  grade: localStorage.getItem('edu-grade') || ''
});

// 数据列表（从后端获取）
const questions = ref([]);
const myFavoriteIds = ref([]); // 收藏的问题ID列表

// 统计数据
const stats = reactive({
  totalQuestions: 0,
  unsolvedQuestions: 0,
  myQuestions: 0
});

// 计算属性
const paginatedQuestions = computed(() => {
  // 先根据状态筛选
  let filtered = questions.value;
  if (questionStatusFilter.value === 'solved') {
    filtered = questions.value.filter(q => q.solved);
  } else if (questionStatusFilter.value === 'unsolved') {
    filtered = questions.value.filter(q => !q.solved);
  }
  
  // 再分页
  const start = (questionCurrentPage.value - 1) * questionPageSize.value;
  const end = start + questionPageSize.value;
  return filtered.slice(start, end);
});

// 筛选后的问题总数
const filteredQuestionsCount = computed(() => {
  if (questionStatusFilter.value === 'solved') {
    return questions.value.filter(q => q.solved).length;
  } else if (questionStatusFilter.value === 'unsolved') {
    return questions.value.filter(q => !q.solved).length;
  }
  return questions.value.length;
});

// 我未解决的疑问 -> 改为我发布的疑问
const myPublishedQuestions = computed(() => {
  return questions.value.filter(q => 
    q.userId === currentUserId
  );
});

// 我的收藏
const myFavorites = computed(() => {
  return questions.value.filter(q => 
    myFavoriteIds.value.includes(q.id)
  );
});

// 显示的收藏（只显示前2个）
const displayedFavorites = computed(() => {
  return myFavorites.value.slice(0, 2);
});

// 判断是否已收藏
function isFavorited(questionId) {
  return myFavoriteIds.value.includes(questionId);
}

// 获取年级标签（中文显示）
function getGradeLabel(grade) {
  const gradeMap = {
    'primary_1': '一年级',
    'primary_2': '二年级',
    'primary_3': '三年级',
    'primary_4': '四年级',
    'primary_5': '五年级',
    'primary_6': '六年级',
    'junior_1': '初一',
    'junior_2': '初二',
    'junior_3': '初三',
    'senior_1': '高一',
    'senior_2': '高二',
    'senior_3': '高三'
  };
  return gradeMap[grade] || '';
}

// 【新增】获取问题卡片边框颜色
function getQuestionBorderColor(index) {
  const colors = [
    '#0969da',  // 蓝色
    '#35b778',  // 绿色
    '#ffc107',  // 黄色
    '#e74c3c'   // 红色
  ];
  return colors[index % colors.length];
}

// 业务函数
// 切换问题状态筛选
function toggleQuestionStatus(status) {
  if (questionStatusFilter.value === status) {
    questionStatusFilter.value = '';
  } else {
    questionStatusFilter.value = status;
  }
  questionCurrentPage.value = 1;
}

function getSubjectText(subject) {
  const map = {
    math: '数学',
    chinese: '语文',
    english: '英语',
    physics: '物理',
    chemistry: '化学'
  };
  return map[subject] || subject;
}

function getSubjectType(subject) {
  const map = {
    math: 'primary',
    chinese: 'success',
    english: 'warning',
    physics: 'danger',
    chemistry: 'info'
  };
  return map[subject] || 'info';
}

function formatDate(dateStr) {
  return dateStr;
}

function formatTime(timeStr) {
  if (!timeStr) return '';
  
  // 后端返回的已经是北京时间字符串格式：YYYY-MM-DD HH:mm:ss
  // 直接解析为本地时间
  const time = new Date(timeStr.replace(' ', 'T')); // 转换为ISO格式
  const now = new Date();
  
  // 计算时间差（秒）
  const diff = Math.floor((now - time) / 1000);
  
  if (diff < 60) return '刚刚';
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}天前`;
  return timeStr.split(' ')[0];
}

function handleQuestionPageChange(page) {
  questionCurrentPage.value = page;
}

async function askQuestion() {
  if (!questionForm.title || !questionForm.content) {
    ElMessage.warning('请填写完整信息');
    return;
  }
  
  // 使用选中的标签数组
  const tags = questionForm.tags || [];
  
  try {
    const response = await axios.post(`${API_BASE_URL}/questions`, {
      title: questionForm.title,
      content: questionForm.content,
      tags: tags,
      userId: currentUserId,
      userName: userInfo.nickname || '匿名用户',
      userAvatar: userInfo.avatar || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'
    });
    
    if (response.data.success) {
      questions.value.unshift(response.data.data);
      showAskQuestionDialog.value = false;
      questionForm.title = '';
      questionForm.content = '';
      questionForm.tags = [];
      ElMessage.success('发布成功！');
      
      // 刷新统计数据
      loadStats();
    }
  } catch (error) {
    console.error('发布问题失败：', error);
    ElMessage.error(error.response?.data?.message || '发布失败');
  }
}

async function viewQuestionDetail(question) {
  try {
    selectedQuestion.value = question;
    
    // 获取用户的学校和年级信息
    try {
      const userResponse = await axios.get(`http://localhost:3001/api/user/profile/${question.userId}`);
      if (userResponse.data) {
        selectedQuestion.value.userSchool = userResponse.data.school || '';
        selectedQuestion.value.userGrade = userResponse.data.grade || '';
      }
    } catch (error) {
      console.error('获取用户信息失败：', error);
    }
    
    showQuestionDetailDialog.value = true;
    
    // 加载问题的回答列表
    const response = await axios.get(`${API_BASE_URL}/questions/${question.id}/answers`, {
      params: { userId: currentUserId }
    });
    
    if (response.data.success) {
      questionAnswers.value = response.data.data;
    }
  } catch (error) {
    console.error('加载问题详情失败：', error);
    ElMessage.error('加载问题详情失败');
  }
}

// 处理回答输入框聚焦
function handleAnswerInputFocus() {
  // 防止重复打开
  if (!showAnswerInputDialog.value) {
    showAnswerInputDialog.value = true;
  }
}

// 关闭回答输入框
function closeAnswerDialog() {
  showAnswerInputDialog.value = false;
  // 清空输入框焦点，防止再次触发
  newAnswer.value = '';
}

async function submitAnswer() {
  if (!newAnswer.value.trim()) {
    ElMessage.warning('请输入回答内容');
    return;
  }
  
  try {
    const response = await axios.post(`${API_BASE_URL}/questions/${selectedQuestion.value.id}/answers`, {
      content: newAnswer.value,
      userId: currentUserId,
      userName: localStorage.getItem('edu-nickname') || '匿名用户',
      userAvatar: localStorage.getItem('edu-avatar') || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'
    });
    
    if (response.data.success) {
      questionAnswers.value.push(response.data.data);
      selectedQuestion.value.answerCount++;
      
      // 更新问题列表中的回答数
      const question = questions.value.find(q => q.id === selectedQuestion.value.id);
      if (question) {
        question.answerCount++;
      }
      
      newAnswer.value = '';
      showAnswerInputDialog.value = false;
      ElMessage.success('回答成功！');
    }
  } catch (error) {
    console.error('提交回答失败：', error);
    ElMessage.error(error.response?.data?.message || '提交失败');
  }
}

async function toggleLikeAnswer(answer) {
  try {
    if (answer.liked) {
      // 取消点赞
      await axios.delete(`${API_BASE_URL}/answers/${answer.id}/like`, {
        data: { userId: currentUserId }
      });
      answer.liked = false;
      answer.likeCount--;
      ElMessage.success('已取消点赞');
    } else {
      // 点赞
      await axios.post(`${API_BASE_URL}/answers/${answer.id}/like`, {
        userId: currentUserId
      });
      answer.liked = true;
      answer.likeCount++;
      ElMessage.success('点赞成功');
    }
  } catch (error) {
    console.error('点赞操作失败：', error);
    ElMessage.error(error.response?.data?.message || '操作失败');
  }
}

async function markAsBest(answer) {
  try {
    await ElMessageBox.confirm('确定将此回答设为最佳答案吗？', '提示', {
      type: 'info'
    });
    
    await axios.post(`${API_BASE_URL}/answers/${answer.id}/mark-best`, {
      questionId: selectedQuestion.value.id,
      userId: currentUserId
    });
    
    // 更新本地数据
    questionAnswers.value.forEach(a => {
      a.isBest = a.id === answer.id;
    });
    
    ElMessage.success('已设为最佳答案');
  } catch (error) {
    if (error !== 'cancel') {
      console.error('设置最佳答案失败：', error);
      ElMessage.error(error.response?.data?.message || '操作失败');
    }
  }
}

async function markAsSolved() {
  try {
    await ElMessageBox.confirm('确定标记此问题为已解决吗？', '提示', {
      type: 'success'
    });
    
    await axios.post(`${API_BASE_URL}/questions/${selectedQuestion.value.id}/solve`, {
      userId: currentUserId
    });
    
    selectedQuestion.value.solved = true;
    
    // 更新问题列表中的状态
    const question = questions.value.find(q => q.id === selectedQuestion.value.id);
    if (question) {
      question.solved = true;
    }
    
    ElMessage.success('已标记为已解决');
  } catch (error) {
    if (error !== 'cancel') {
      console.error('标记已解决失败：', error);
      ElMessage.error(error.response?.data?.message || '操作失败');
    }
  }
}

async function toggleFavorite(question) {
  const index = myFavoriteIds.value.indexOf(question.id);
  
  try {
    if (index > -1) {
      // 取消收藏
      await axios.delete(`${API_BASE_URL}/favorites/${question.id}`, {
        data: { userId: currentUserId }
      });
      myFavoriteIds.value.splice(index, 1);
      ElMessage.success('已取消收藏');
    } else {
      // 添加收藏
      await axios.post(`${API_BASE_URL}/favorites`, {
        userId: currentUserId,
        questionId: question.id
      });
      myFavoriteIds.value.push(question.id);
      ElMessage.success('收藏成功');
    }
  } catch (error) {
    console.error('收藏操作失败：', error);
    ElMessage.error(error.response?.data?.message || '操作失败');
  }
}

async function removeFavorite(question) {
  try {
    await ElMessageBox.confirm('确定取消收藏这个问题吗？', '提示', {
      type: 'warning'
    });
    
    await axios.delete(`${API_BASE_URL}/favorites/${question.id}`, {
      data: { userId: currentUserId }
    });
    
    const index = myFavoriteIds.value.indexOf(question.id);
    if (index > -1) {
      myFavoriteIds.value.splice(index, 1);
    }
    ElMessage.success('已取消收藏');
  } catch (error) {
    if (error !== 'cancel') {
      console.error('取消收藏失败：', error);
      ElMessage.error(error.response?.data?.message || '操作失败');
    }
  }
}

async function batchRemoveFavorites() {
  if (selectedFavorites.value.length === 0) {
    ElMessage.warning('请选择要删除的收藏');
    return;
  }
  
  try {
    await ElMessageBox.confirm(`确定删除选中的 ${selectedFavorites.value.length} 个收藏吗？`, '提示', {
      type: 'warning'
    });
    
    // 批量删除收藏
    for (const questionId of selectedFavorites.value) {
      await axios.delete(`${API_BASE_URL}/favorites/${questionId}`, {
        data: { userId: currentUserId }
      });
      
      const index = myFavoriteIds.value.indexOf(questionId);
      if (index > -1) {
        myFavoriteIds.value.splice(index, 1);
      }
    }
    
    selectedFavorites.value = [];
    selectAllFavorites.value = false;
    isIndeterminate.value = false;
    showFavoritesManageDialog.value = false;
    ElMessage.success('删除成功');
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除失败：', error);
      ElMessage.error('删除失败');
    }
  }
}

// 处理全选
function handleSelectAllFavorites(val) {
  if (val) {
    selectedFavorites.value = myFavorites.value.map(q => q.id);
  } else {
    selectedFavorites.value = [];
  }
  isIndeterminate.value = false;
}

// 监听选中项变化，更新全选状态
function updateSelectAllStatus() {
  const checkedCount = selectedFavorites.value.length;
  const totalCount = myFavorites.value.length;
  
  selectAllFavorites.value = checkedCount === totalCount && totalCount > 0;
  isIndeterminate.value = checkedCount > 0 && checkedCount < totalCount;
}

// 处理疑问选择变化
function handleQuestionCheckChange(checked, questionId) {
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

// 全选/取消全选疑问
function handleSelectAllQuestions(val) {
  if (val) {
    selectedQuestions.value = myPublishedQuestions.value.map(q => q.id);
  } else {
    selectedQuestions.value = [];
  }
  isQuestionIndeterminate.value = false;
}

// 批量删除疑问
async function batchDeleteQuestions() {
  if (selectedQuestions.value.length === 0) {
    ElMessage.warning('请选择要删除的疑问');
    return;
  }
  
  try {
    await ElMessageBox.confirm(
      `确定删除选中的 ${selectedQuestions.value.length} 个疑问吗？删除后无法恢复。`,
      '批量删除确认',
      {
        type: 'warning',
        confirmButtonText: '确定删除',
        cancelButtonText: '取消'
      }
    );
    
    questionLoading.value = true;
    
    // 批量删除
    for (const questionId of selectedQuestions.value) {
      await axios.delete(`${API_BASE_URL}/questions/${questionId}`, {
        data: { userId: currentUserId }
      });
      
      // 从列表中移除
      const index = questions.value.findIndex(q => q.id === questionId);
      if (index > -1) {
        questions.value.splice(index, 1);
      }
    }
    
    ElMessage.success(`成功删除 ${selectedQuestions.value.length} 个疑问`);
    selectedQuestions.value = [];
    selectAllQuestions.value = false;
    isQuestionIndeterminate.value = false;
    showMyQuestionsDialog.value = false;
    
    // 刷新统计数据
    loadStats();
  } catch (error) {
    if (error !== 'cancel') {
      console.error("批量删除疑问失败：", error);
      ElMessage.error("删除失败，请重试");
    }
  } finally {
    questionLoading.value = false;
  }
}

// 删除问题
async function deleteQuestion(question) {
  try {
    await ElMessageBox.confirm('确定删除这个问题吗？删除后无法恢复。', '提示', {
      type: 'warning'
    });
    
    await axios.delete(`${API_BASE_URL}/questions/${question.id}`, {
      data: { userId: currentUserId }
    });
    
    // 从列表中移除
    const index = questions.value.findIndex(q => q.id === question.id);
    if (index > -1) {
      questions.value.splice(index, 1);
    }
    
    ElMessage.success('删除成功');
    
    // 刷新统计数据
    loadStats();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除问题失败：', error);
      ElMessage.error(error.response?.data?.message || '删除失败');
    }
  }
}

// 标记问题为已解决
async function markQuestionAsSolved(question) {
  try {
    await ElMessageBox.confirm('确定标记此问题为已解决吗？', '提示', {
      type: 'success'
    });
    
    await axios.post(`${API_BASE_URL}/questions/${question.id}/solve`, {
      userId: currentUserId
    });
    
    question.solved = true;
    
    ElMessage.success('已标记为已解决');
    
    // 刷新统计数据
    loadStats();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('标记已解决失败：', error);
      ElMessage.error(error.response?.data?.message || '操作失败');
    }
  }
}

// 标记问题为未解决
async function markQuestionAsUnsolved(question) {
  try {
    await ElMessageBox.confirm('确定重新标记此问题为未解决吗？', '提示', {
      type: 'warning'
    });
    
    await axios.post(`${API_BASE_URL}/questions/${question.id}/unsolve`, {
      userId: currentUserId
    });
    
    question.solved = false;
    
    ElMessage.success('已标记为未解决');
    
    // 刷新统计数据
    loadStats();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('标记未解决失败：', error);
      ElMessage.error(error.response?.data?.message || '操作失败');
    }
  }
}

// 加载数据
async function loadUserInfo() {
  try {
    const userId = localStorage.getItem('edu-user-id');
    const response = await axios.get(`http://localhost:3001/api/user/profile/${userId}`);
    
    if (response.data) {
      const userData = response.data;
      // 更新用户信息
      userInfo.nickname = userData.nickname || '智慧学习者';
      userInfo.avatar = userData.avatar || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png';
      userInfo.school = userData.school || '';
      userInfo.grade = userData.grade || '';
      
      // 同步更新localStorage
      localStorage.setItem('edu-nickname', userInfo.nickname);
      localStorage.setItem('edu-avatar', userInfo.avatar);
      localStorage.setItem('edu-school', userInfo.school);
      localStorage.setItem('edu-grade', userInfo.grade);
    }
  } catch (error) {
    console.error('加载用户信息失败：', error);
    // 如果加载失败，使用localStorage中的数据
  }
}

async function loadQuestions() {
  questionLoading.value = true;
  try {
    const response = await axios.get(`${API_BASE_URL}/questions`, {
      params: { userId: currentUserId }
    });
    if (response.data.success) {
      questions.value = response.data.data;
    }
  } catch (error) {
    console.error('加载问题列表失败：', error);
    ElMessage.error('加载问题列表失败');
  } finally {
    questionLoading.value = false;
  }
}

async function loadMyFavorites() {
  try {
    const response = await axios.get(`${API_BASE_URL}/favorites`, {
      params: { userId: currentUserId }
    });
    if (response.data.success) {
      myFavoriteIds.value = response.data.data;
    }
  } catch (error) {
    console.error('加载收藏列表失败：', error);
  }
}

async function loadStats() {
  try {
    const response = await axios.get(`${API_BASE_URL}/stats`, {
      params: { userId: currentUserId }
    });
    if (response.data.success) {
      // 直接使用后端返回的统计数据
      stats.totalQuestions = response.data.data.totalQuestions;
      stats.unsolvedQuestions = response.data.data.unsolvedQuestions;
      stats.myQuestions = response.data.data.myQuestions;
    }
  } catch (error) {
    console.error('加载统计数据失败：', error);
  }
}

onMounted(async () => {
  // 先加载用户科目
  userSubjects.value = await getUserSubjects();
  // 加载用户信息
  loadUserInfo();
  loadQuestions();
  loadMyFavorites();
  loadStats();
});

// 监听选中项变化
watch(selectedFavorites, () => {
  updateSelectAllStatus();
});

// 监听疑问选中项变化，更新全选状态
watch(selectedQuestions, (newVal) => {
  const checkedCount = newVal.length;
  const totalCount = myPublishedQuestions.value.length;
  
  selectAllQuestions.value = checkedCount === totalCount && totalCount > 0;
  isQuestionIndeterminate.value = checkedCount > 0 && checkedCount < totalCount;
});
</script>

<style scoped>
.study-community-container {
  min-height: 100vh;
  background: #f5f7fa;
}

/* 实时数据统计 */
.stats-bar {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  padding: 20px 40px;
  background: #f8f9fa;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s;
  border: 2px solid #e4e7ed;
}

.stat-item:nth-child(1) {
  border-color: #e6a23c;
}

.stat-item:nth-child(2) {
  border-color: #f56c6c;
}

.stat-item:nth-child(3) {
  border-color: #409eff;
}

.stat-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #2c3e50;
  line-height: 1;
  margin-bottom: 6px;
}

.stat-label {
  font-size: 13px;
  color: #666;
  font-weight: 500;
}

.community-content {
  display: grid;
  grid-template-columns: 3fr 1fr;
  gap: 20px;
  padding: 24px 40px 40px;
  max-width: 1920px;
  margin: 0 auto;
}

/* 通用区块样式 */
.left-section {
  display: flex;
  flex-direction: column;
}

.questions-container {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  border: 2px solid #67c23a;
  height: 520px;
  max-height: 520px;
}

.right-section {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 2px solid #e6a23c;
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 520px;
  max-height: 520px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid #e4e7ed;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
}

.status-filter-buttons {
  display: flex;
  gap: 8px;
  margin-left: 16px;
}

.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.header-actions .el-pagination {
  margin-right: 10px;
}

/* 互助答疑 */
.question-list {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* 问题网格布局（2行2列，每个占1/4） */
.question-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 16px;
  height: 100%;
}

.question-item {
  padding: 16px;
  border: 3px solid #0969da; /* 默认蓝色边框，会被动态样式覆盖 */
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
  background: #fff;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.question-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.question-header {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 10px;
  flex-shrink: 0;
}

.question-user {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.user-name {
  font-size: 13px;
  font-weight: 600;
  color: #2c3e50;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.question-time {
  font-size: 11px;
  color: #999;
}

.question-title {
  font-size: 16px;
  font-weight: 700;
  color: #2c3e50;
  line-height: 1.5;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1;
}

.question-content {
  display: none;
}

.question-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  flex-shrink: 0;
}

.question-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  flex: 1;
}

.more-tags {
  font-size: 11px;
  color: #999;
}

/* 右侧：用户信息和收藏 */
.user-info-card {
  background: radial-gradient(ellipse at center, rgba(144, 202, 249, 0.15) 0%, rgba(144, 202, 249, 0.08) 40%, rgba(255, 255, 255, 0.95) 80%);
  border-radius: 12px;
  padding: 24px;
  color: #1e293b;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.user-info-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.user-info-header .el-avatar {
  border: 3px solid rgba(30, 41, 59, 0.2);
  flex-shrink: 0;
}

.user-info-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.user-name {
  font-size: 20px;
  font-weight: 600;
}

.user-id {
  font-size: 13px;
  opacity: 0.9;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  font-size: 14px;
  backdrop-filter: blur(10px);
}

.detail-item .el-icon {
  font-size: 18px;
}

.detail-item span {
  font-weight: 600;
}

.favorites-box {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 2px solid #ffc107;
  flex: 1;
  min-height: 0;
}

.box-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  font-size: 15px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 12px;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 6px;
}

.box-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
  overflow-y: auto;
  padding-right: 8px;
  min-height: 0;
  max-height: 180px;
}

.box-list-no-scroll {
  overflow-y: hidden;
}

.box-list::-webkit-scrollbar {
  width: 6px;
}

.box-list::-webkit-scrollbar-thumb {
  background: #dcdfe6;
  border-radius: 3px;
}

.box-list::-webkit-scrollbar-thumb:hover {
  background: #c0c4cc;
}

.box-item {
  padding: 12px;
  background: #fff;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid #e4e7ed;
  min-height: 70px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.box-item:hover {
  border-color: #0969da;
  box-shadow: 0 2px 12px rgba(9, 105, 218, 0.15);
  transform: translateY(-2px);
}

.box-item-title {
  font-size: 15px;
  font-weight: 600;
  color: #2c3e50;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.5;
}

.box-item-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #e4e7ed;
}

/* 管理我的疑问对话框 */
.my-questions-manage {
  max-height: 600px;
  overflow-y: auto;
}

.manage-toolbar-dialog {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 16px;
}

.questions-list-manage {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.question-manage-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #fff;
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  transition: all 0.3s;
}

.question-manage-item:hover {
  border-color: #0969da;
  box-shadow: 0 2px 8px rgba(9, 105, 218, 0.1);
}

.question-manage-content {
  flex: 1;
  cursor: pointer;
  min-width: 0;
}

.question-manage-title {
  font-size: 15px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.5;
}

.question-manage-title:hover {
  color: #0969da;
}

.question-manage-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: #666;
}

.question-manage-time {
  color: #999;
  font-size: 12px;
}

.question-manage-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.question-title-cell {
  cursor: pointer;
  color: #409eff;
  transition: all 0.3s;
}

.question-title-cell:hover {
  text-decoration: underline;
  color: #66b1ff;
}

/* 蓝色描边对话框 */
:deep(.blue-border-dialog .el-dialog) {
  border: 3px solid #0969da;
  box-shadow: 0 4px 20px rgba(9, 105, 218, 0.3);
}

/* 问题详情对话框特殊样式 */
:deep(.question-detail-dialog .el-dialog) {
  max-height: 70vh;
  overflow: hidden;
}

:deep(.question-detail-dialog .el-dialog__body) {
  max-height: 60vh;
  overflow-y: auto;
  padding: 20px;
}

/* 隐藏问题详情对话框内的滚动条 */
:deep(.question-detail-dialog .el-dialog__body)::-webkit-scrollbar {
  display: none;
}

:deep(.question-detail-dialog .el-dialog__body) {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* 收藏管理对话框 */
.favorites-manage-content {
  max-height: 600px;
  overflow-y: auto;
}

.manage-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
}

.favorite-manage-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e4e7ed;
  transition: background 0.3s;
}

.favorite-manage-item:hover {
  background: #f5f7fa;
}

.favorite-manage-item:last-child {
  border-bottom: none;
}

.favorite-item-content {
  flex: 1;
  margin-left: 8px;
  margin-right: 16px;
}

.favorite-item-title {
  font-size: 14px;
  color: #2c3e50;
  margin-bottom: 6px;
  font-weight: 500;
}

.favorite-item-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #999;
}

/* 分页 */
.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e4e7ed;
}

/* 问题详情对话框 */
.question-detail {
  padding: 10px;
}

.detail-header-simple {
  display: flex;
  gap: 16px;
  align-items: center;
  margin-bottom: 24px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 12px;
}

.detail-user-info {
  flex: 1;
}

.user-name-large {
  font-size: 20px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 8px;
}

.user-extra-info {
  display: flex;
  gap: 12px;
  font-size: 14px;
  color: #666;
}

.grade-info {
  color: #0969da;
  font-weight: 500;
}

.detail-content-large {
  font-size: 16px;
  color: #333;
  line-height: 1.8;
  margin-bottom: 20px;
  white-space: pre-wrap;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  min-height: 100px;
}

.detail-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
}

.detail-header {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 20px;
}

.detail-user {
  flex: 1;
}

.detail-title {
  font-size: 22px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 16px;
  line-height: 1.5;
}

.detail-content {
  font-size: 15px;
  color: #666;
  line-height: 1.8;
  margin-bottom: 16px;
  white-space: pre-wrap;
}

.detail-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.detail-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
}

.answers-section {
  margin-top: 20px;
}

.answers-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 16px;
  gap: 16px;
}

.answer-input-inline {
  flex: 1;
  max-width: 400px;
  cursor: pointer;
}

.answer-input-inline .el-input {
  border-radius: 20px;
  cursor: pointer;
}

.answer-input-inline :deep(.el-input__wrapper) {
  border-radius: 20px;
  background: #f5f7fa;
  box-shadow: none;
  border: 1px solid #e4e7ed;
  transition: all 0.3s;
  cursor: pointer;
}

.answer-input-inline :deep(.el-input__inner) {
  cursor: pointer;
}

.answer-input-inline :deep(.el-input__wrapper:hover) {
  border-color: #0969da;
}

/* 带描边的回答输入框 */
.answer-input-inline-bordered {
  flex: 1;
  max-width: 400px;
  cursor: pointer;
}

.answer-input-inline-bordered .el-input {
  border-radius: 20px;
  cursor: pointer;
}

.answer-input-inline-bordered :deep(.el-input__wrapper) {
  border-radius: 20px;
  background: #f5f7fa;
  box-shadow: none;
  border: 2px solid #0969da;
  transition: all 0.3s;
  cursor: pointer;
}

.answer-input-inline-bordered :deep(.el-input__inner) {
  cursor: pointer;
}

.answer-input-inline-bordered :deep(.el-input__wrapper:hover) {
  border-color: #4dabf7;
  box-shadow: 0 0 0 2px rgba(9, 105, 218, 0.1);
}

.answer-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
  max-height: 300px;
  overflow-y: auto;
}

/* 隐藏回答列表的滚动条 */
.answer-list::-webkit-scrollbar {
  display: none;
}

.answer-list {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.answer-item {
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  transition: all 0.3s;
}

.answer-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.answer-header {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 12px;
}

.answer-user {
  flex: 1;
}

.answer-time {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.answer-content {
  font-size: 14px;
  color: #333;
  line-height: 1.8;
  margin-bottom: 12px;
  white-space: pre-wrap;
}

.answer-actions {
  display: flex;
  gap: 12px;
}

/* 鼓励讨论的提示文字 */
.discussion-encouragement {
  text-align: center;
  padding: 6px 40px;
  margin: 0;
  background: rgba(33, 150, 243, 0.05);
}

.discussion-encouragement p {
  margin: 0;
  font-size: 12px;
  color: #666;
  font-weight: 400;
  line-height: 1.4;
}

/* 响应式 */
@media (min-width: 1200px) {
  /* 确保在电脑视图下保持布局 */
  .stats-bar {
    grid-template-columns: repeat(3, 1fr) !important;
  }
  
  .community-content {
    grid-template-columns: 3fr 1fr !important;
  }
}

@media (max-width: 1199px) and (min-width: 993px) {
  .stats-bar {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .community-content {
    grid-template-columns: 2.5fr 1fr;
  }
  
  .questions-container,
  .right-section {
    height: 480px;
    max-height: 480px;
  }
}

@media (max-width: 992px) {
  .stats-bar {
    grid-template-columns: repeat(3, 1fr);
    padding: 16px 20px;
  }
  
  .community-content {
    grid-template-columns: 1fr;
    padding: 16px 20px;
  }
  
  .questions-container,
  .right-section {
    height: auto;
    min-height: 400px;
    max-height: none;
  }
}

@media (max-width: 576px) {
  .stats-bar {
    grid-template-columns: 1fr;
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
