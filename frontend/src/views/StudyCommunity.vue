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
        <!-- 内容筛选 -->
        <div class="section-divider">内容筛选</div>
        
        <div 
          class="filter-item"
          @click="setContentFilter('all')"
          :class="{ active: contentFilter === 'all' }"
        >
          <div class="filter-label">
            <el-icon><List /></el-icon>
            <span>全部问题</span>
          </div>
        </div>

        <div 
          class="filter-item"
          @click="setContentFilter('following')"
          :class="{ active: contentFilter === 'following' }"
        >
          <div class="filter-label">
            <el-icon><UserFilled /></el-icon>
            <span>关注的人</span>
          </div>
        </div>

        <div 
          class="filter-item"
          @click="setContentFilter('mine')"
          :class="{ active: contentFilter === 'mine' }"
        >
          <div class="filter-label">
            <el-icon><User /></el-icon>
            <span>我的问题</span>
          </div>
        </div>

        <!-- 状态筛选 -->
        <div class="section-divider">状态筛选</div>
        
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

        <!-- 社交 -->
        <div class="section-divider">
          <span>社交</span>
        </div>
        
        <div class="social-stats">
          <div class="social-stat-item" @click="showFollowingDialog = true">
            <el-icon><UserFilled /></el-icon>
            <span>我的关注</span>
            <span class="stat-count">{{ followingCount }}</span>
          </div>
          <div class="social-stat-item" @click="showFollowersDialog = true">
            <el-icon><Star /></el-icon>
            <span>我的粉丝</span>
            <span class="stat-count">{{ followerCount }}</span>
          </div>
        </div>

        <!-- AI 智能 -->
        <div class="section-divider">
          <span>AI 智能</span>
        </div>
        
        <div 
          class="filter-item ai-filter"
          @click="setContentFilter('ai-recommend')"
          :class="{ active: contentFilter === 'ai-recommend' }"
        >
          <div class="filter-label">
            <el-icon><MagicStick /></el-icon>
            <span>为你推荐</span>
          </div>
        </div>

        <!-- 用户信息 -->
        <div class="section-divider">我的信息</div>
        
        <div class="user-info-card" @click="handleViewMyProfile">
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
    <div class="community-content" :class="{ expanded: sidebarCollapsed, 'with-ai-panel': !aiPanelCollapsed }">
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
        
        <!-- 问题列表 - 极简社交流式布局 -->
        <div class="questions-list" v-loading="loading">
          <div class="questions-feed">
            <div 
              v-for="question in paginatedQuestions" 
              :key="question.id || question._id"
              class="question-card"
              :class="{ following: question.isFollowing }"
              @click="handleQuestionDetail(question)"
            >
              <!-- 用户信息行 -->
              <div class="card-header">
                <el-avatar 
                  :size="40" 
                  :src="question.userAvatar" 
                  class="clickable-avatar"
                  @click.stop="handleViewUserProfile(question.userId)"
                />
                <div class="card-user-info">
                  <div class="card-username clickable-username" @click.stop="handleViewUserProfile(question.userId)">
                    {{ question.userName }}
                  </div>
                  <div class="card-meta">
                    <span>{{ getGradeLabel(question.userGrade || userInfo.grade) }}</span>
                    <span class="meta-dot">·</span>
                    <span>{{ formatTime(question.createTime) }}</span>
                  </div>
                </div>
                <FollowButton
                  v-if="question.userId !== userId"
                  :target-user-id="question.userId"
                  :is-following="question.isFollowing"
                  :is-mutual="question.isMutual"
                  size="small"
                  @follow-change="handleFollowChange"
                  @click.stop
                />
                <el-icon 
                  :size="22" 
                  :color="isFavorited(question.id) ? '#3b82f6' : '#d1d5db'"
                  @click.stop="toggleFavorite(question.id)"
                  class="favorite-icon"
                >
                  <Star :fill="isFavorited(question.id) ? '#3b82f6' : 'none'" />
                </el-icon>
              </div>
              
              <!-- 问题标题 -->
              <div class="card-title">{{ question.title }}</div>
              
              <!-- 问题内容预览 -->
              <div class="card-content" v-if="question.content">
                {{ question.content.substring(0, 100) }}{{ question.content.length > 100 ? '...' : '' }}
              </div>
              
              <!-- 标签 -->
              <div class="card-tags">
                <span 
                  v-for="(tag, idx) in question.tags.slice(0, 3)" 
                  :key="idx"
                  class="tag-item"
                >
                  {{ tag }}
                </span>
                <span v-if="question.tags.length > 3" class="tag-item tag-more">
                  +{{ question.tags.length - 3 }}
                </span>
              </div>
              
              <!-- 分隔线 -->
              <div class="card-divider"></div>
              
              <!-- 互动统计栏 -->
              <div class="card-stats">
                <div class="stat-item">
                  <el-icon :size="16"><ChatDotRound /></el-icon>
                  <span>{{ question.answerCount || 0 }} 回答</span>
                </div>
                <div class="stat-item">
                  <el-icon :size="16"><View /></el-icon>
                  <span>{{ question.viewCount || 0 }} 浏览</span>
                </div>
                <div class="stat-item status-badge" :class="{ solved: question.solved }">
                  <el-icon :size="16" v-if="question.solved"><CircleCheck /></el-icon>
                  <el-icon :size="16" v-else><Clock /></el-icon>
                  <span>{{ question.solved ? '已解决' : '待解决' }}</span>
                </div>
              </div>
              
              <!-- 热门回答预览（如果有） -->
              <div class="top-answer-preview" v-if="question.topAnswer" @click.stop>
                <div class="preview-header">
                  <el-icon :size="14" color="#10b981"><TrendCharts /></el-icon>
                  <span class="preview-label">热门回答</span>
                </div>
                <div class="preview-content">
                  {{ question.topAnswer.content.substring(0, 80) }}...
                </div>
                <div class="preview-footer">
                  <span class="preview-author">{{ question.topAnswer.userName }}</span>
                  <span class="preview-likes">
                    <el-icon :size="12"><Star /></el-icon>
                    {{ question.topAnswer.likeCount }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 空状态 -->
          <div v-if="filteredQuestions.length === 0 && !loading" class="empty-state">
            <el-icon :size="80" color="#d1d5db"><DocumentDelete /></el-icon>
            <div class="empty-text">暂无问题</div>
            <div class="empty-hint">试试调整筛选条件或发起新问题</div>
          </div>
          
          <!-- 分页 -->
          <div class="pagination-wrapper" v-if="filteredQuestions.length > pageSize">
            <el-pagination
              v-model:current-page="currentPage"
              :page-size="pageSize"
              :total="filteredQuestions.length"
              layout="prev, pager, next"
              @current-change="handlePageChange"
              background
            />
          </div>
        </div>
      </div>
    </div>

    <!-- AI 助手面板 -->
    <AIAssistantPanel
      ref="aiAssistantRef"
      @question-click="handleAIQuestionClick"
      @topic-click="handleTopicClick"
      @update:collapsed="aiPanelCollapsed = $event"
    />

    <!-- 用户主页对话框 -->
    <UserProfileDialog
      v-model="showUserProfileDialog"
      :user-id="selectedUserId"
      @question-click="handleProfileQuestionClick"
    />

    <!-- 关注列表对话框 -->
    <el-dialog
      v-model="showFollowingDialog"
      title="我的关注"
      width="600px"
      center
      class="blue-border-dialog"
    >
      <div v-loading="loadingFollowing" class="follow-list">
        <div
          v-for="user in followingList"
          :key="user.id"
          class="follow-item"
          @click="handleViewUserProfile(user.id)"
        >
          <el-avatar :size="50" :src="user.avatar" />
          <div class="follow-info">
            <div class="follow-name">{{ user.nickname }}</div>
            <div class="follow-meta">{{ user.school }} · {{ getGradeLabel(user.grade) }}</div>
          </div>
          <FollowButton
            :target-user-id="user.id"
            :is-following="true"
            size="small"
            @follow-change="loadFollowData"
          />
        </div>
        <el-empty v-if="followingList.length === 0 && !loadingFollowing" description="暂无关注" />
      </div>
    </el-dialog>

    <!-- 粉丝列表对话框 -->
    <el-dialog
      v-model="showFollowersDialog"
      title="我的粉丝"
      width="600px"
      center
      class="blue-border-dialog"
    >
      <div v-loading="loadingFollowers" class="follow-list">
        <div
          v-for="user in followersList"
          :key="user.id"
          class="follow-item"
          @click="handleViewUserProfile(user.id)"
        >
          <el-avatar :size="50" :src="user.avatar" />
          <div class="follow-info">
            <div class="follow-name">{{ user.nickname }}</div>
            <div class="follow-meta">{{ user.school }} · {{ getGradeLabel(user.grade) }}</div>
          </div>
          <FollowButton
            :target-user-id="user.id"
            :is-following="user.isFollowing"
            size="small"
            @follow-change="loadFollowData"
          />
        </div>
        <el-empty v-if="followersList.length === 0 && !loadingFollowers" description="暂无粉丝" />
      </div>
    </el-dialog>

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
  DataAnalysis, DArrowLeft, DArrowRight, View, CircleCheck, 
  Clock, TrendCharts, DocumentDelete, List, UserFilled, User, MagicStick
} from '@element-plus/icons-vue';
import SideNavBar from '@/components/SideNavBar.vue';
import FollowButton from '@/components/social/FollowButton.vue';
import UserProfileDialog from '@/components/social/UserProfileDialog.vue';
import AIAssistantPanel from '@/components/ai/AIAssistantPanel.vue';
import axios from 'axios';
import { marked } from 'marked';
import { getUserSubjects } from '@/utils/userSubjects';

const loading = ref(false);
const sidebarCollapsed = ref(false);
const aiPanelCollapsed = ref(false);
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
const contentFilter = ref('all'); // all, following, mine, ai-recommend
const questionStatusFilter = ref('');
const currentPage = ref(1);
const pageSize = ref(6); // 单列布局，每页显示6条

// 社交数据
const followingCount = ref(0);
const followerCount = ref(0);
const followingList = ref([]);
const followersList = ref([]);
const loadingFollowing = ref(false);
const loadingFollowers = ref(false);

// 用户主页
const showUserProfileDialog = ref(false);
const selectedUserId = ref('');

// 关注/粉丝对话框
const showFollowingDialog = ref(false);
const showFollowersDialog = ref(false);

// AI 助手
const aiAssistantRef = ref(null);

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
  
  let result = questions.value;
  
  // 内容筛选
  if (contentFilter.value === 'following') {
    // 只显示关注的人的问题
    result = result.filter(q => q.isFollowing);
  } else if (contentFilter.value === 'mine') {
    // 只显示我的问题
    result = result.filter(q => q.userId === userId.value);
  } else if (contentFilter.value === 'ai-recommend') {
    // AI 推荐的问题（这里简化处理，实际应该从 AI 接口获取）
    result = result.slice(0, 10);
  }
  
  // 状态筛选
  if (questionStatusFilter.value === 'unsolved') {
    result = result.filter(q => !q.solved);
  } else if (questionStatusFilter.value === 'solved') {
    result = result.filter(q => q.solved);
  }
  
  return result;
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

// 设置内容筛选
function setContentFilter(filter) {
  contentFilter.value = filter;
  currentPage.value = 1;
  
  // 如果选择关注的人，需要加载关注的人的问题
  if (filter === 'following') {
    loadFollowingQuestions();
  } else if (filter === 'ai-recommend') {
    // 刷新 AI 推荐
    if (aiAssistantRef.value) {
      aiAssistantRef.value.refresh();
    }
  }
}

// 加载关注数据
async function loadFollowData() {
  try {
    // 加载关注数量
    const followingRes = await axios.get('http://localhost:3001/api/social/following', {
      params: { userId: userId.value }
    });
    followingList.value = followingRes.data.data || [];
    followingCount.value = followingList.value.length;
    
    // 加载粉丝数量
    const followersRes = await axios.get('http://localhost:3001/api/social/followers', {
      params: { userId: userId.value }
    });
    followersList.value = followersRes.data.data || [];
    followerCount.value = followersList.value.length;
    
    // 检查每个问题的关注状态
    await checkQuestionsFollowStatus();
  } catch (error) {
    console.error('加载关注数据失败：', error);
  }
}

// 检查问题的关注状态
async function checkQuestionsFollowStatus() {
  if (!Array.isArray(questions.value)) return;
  
  const followingIds = followingList.value.map(u => u.id);
  
  questions.value.forEach(q => {
    q.isFollowing = followingIds.includes(q.userId);
    // 检查是否互相关注（需要额外查询，这里简化处理）
    q.isMutual = false;
  });
}

// 加载关注的人的问题
async function loadFollowingQuestions() {
  loading.value = true;
  try {
    const res = await axios.get('http://localhost:3001/api/social/following-questions', {
      params: { userId: userId.value }
    });
    questions.value = res.data.data || [];
    await checkQuestionsFollowStatus();
  } catch (error) {
    console.error('加载关注的人的问题失败：', error);
    ElMessage.error('加载失败');
  } finally {
    loading.value = false;
  }
}

// 查看用户主页
function handleViewUserProfile(targetUserId) {
  if (!targetUserId || targetUserId === userId.value) {
    // 查看自己的主页，可以跳转到个人中心
    return;
  }
  selectedUserId.value = targetUserId;
  showUserProfileDialog.value = true;
}

// 查看我的主页
function handleViewMyProfile() {
  // 可以跳转到个人中心页面
  ElMessage.info('点击头像查看个人中心');
}

// 关注状态变化
async function handleFollowChange() {
  // 重新加载关注数据
  await loadFollowData();
  // 刷新问题列表
  await loadQuestions();
}

// AI 推荐的问题点击
function handleAIQuestionClick(questionId) {
  const question = questions.value.find(q => q.id === questionId || q._id === questionId);
  if (question) {
    handleQuestionDetail(question);
  }
}

// 话题点击
function handleTopicClick(tag) {
  // 筛选该标签的问题
  contentFilter.value = 'all';
  questionStatusFilter.value = '';
  currentPage.value = 1;
  
  // 简单实现：滚动到顶部并提示
  ElMessage.info(`筛选话题：#${tag}`);
  
  // 实际应该添加标签筛选功能
  // 这里可以扩展一个 tagFilter 状态
}

// 用户主页问题点击
function handleProfileQuestionClick(questionId) {
  const question = questions.value.find(q => q.id === questionId || q._id === questionId);
  if (question) {
    handleQuestionDetail(question);
  }
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
    questions.value = res.data.data || [];
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
    myFavorites.value = res.data.data || [];
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
    answers.value = answersRes.data.data || [];
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
  await loadFollowData();
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

.user-info-card {
  cursor: pointer;
  transition: all 0.2s;
}

.user-info-card:hover {
  transform: translateX(2px);
}

/* AI 助手侧边栏 - 右侧 */
.ai-assistant-sidebar {
  width: 280px;
  background: #fff;
  border-left: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  position: fixed;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 100;
  transition: transform 0.3s;
}

.ai-assistant-sidebar.collapsed {
  transform: translateX(280px);
}

.ai-content-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
  background: #fafafa;
  padding: 12px;
}

.ai-content-section::-webkit-scrollbar {
  width: 4px;
}

.ai-content-section::-webkit-scrollbar-thumb {
  background: #dcdfe6;
  border-radius: 2px;
}

.ai-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ai-icon-wrapper-small {
  width: 24px;
  height: 24px;
  background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ai-icon {
  color: white;
  animation: pulse 2s infinite;
}

/* AI 推荐列表 */
.ai-recommend-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ai-recommend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.ai-recommend-item:hover {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%);
  transform: translateX(-2px);
}

.recommend-badge {
  width: 20px;
  height: 20px;
  background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%);
  color: white;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  flex-shrink: 0;
}

.recommend-text {
  flex: 1;
  font-size: 12px;
  font-weight: 500;
  color: #1a1a1a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* AI 建议框 */
.ai-advice-box {
  padding: 10px;
  background: #f8f9fa;
  border-radius: 6px;
}

.advice-text {
  font-size: 12px;
  color: #374151;
  line-height: 1.6;
}

/* AI 话题网格 */
.ai-topics-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.topic-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: #f8f9fa;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.topic-chip:hover {
  background: #e8f4ff;
  transform: translateY(-1px);
}

.topic-name {
  font-size: 11px;
  font-weight: 500;
  color: #3b82f6;
}

.topic-num {
  font-size: 10px;
  color: #9ca3af;
}

/* AI 统计网格 */
.ai-stats-grid {
  padding: 10px;
  background: #f8f9fa;
  border-radius: 6px;
}

.stats-mini-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.stat-mini-item {
  text-align: center;
}

.stat-mini-value {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 2px;
}

.stat-mini-label {
  font-size: 10px;
  color: #6b7280;
}

.empty-hint-small {
  text-align: center;
  padding: 12px;
  font-size: 12px;
  color: #9ca3af;
}

/* 社交统计 */
.social-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.social-stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: #f8f9fa;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
  border: 1.5px solid transparent;
}

.social-stat-item:hover {
  background: #e8f4ff;
  border-color: #0969da;
  transform: translateX(2px);
}

.social-stat-item span {
  font-size: 13px;
  color: #2c3e50;
  font-weight: 500;
}

.stat-count {
  margin-left: auto;
  font-weight: 600;
  color: #0969da;
}

/* AI 筛选项 */
.ai-filter {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%);
}

.ai-filter:hover {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%);
}

.ai-filter.active {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%);
  border-color: #8b5cf6;
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
  transition: left 0.3s, right 0.3s;
}

.community-content.expanded {
  left: 60px;
}

.community-content.with-ai-panel {
  right: 320px;
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
  padding: 0;
  background: #f9fafb;
}

/* 极简社交流式布局 */
.questions-feed {
  max-width: 720px;
  margin: 0 auto;
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 极简问题卡片 */
.question-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: none;
  border-left: 3px solid transparent;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.question-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

/* 已关注用户的问题 */
.question-card.following {
  border-left-color: #3b82f6;
}

/* 用户信息行 */
.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.clickable-avatar {
  cursor: pointer;
  transition: all 0.2s;
}

.clickable-avatar:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.clickable-username {
  cursor: pointer;
  transition: color 0.2s;
}

.clickable-username:hover {
  color: #3b82f6;
}

.card-user-info {
  flex: 1;
  min-width: 0;
}

.card-username {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a1a;
  line-height: 1.4;
}

.card-meta {
  font-size: 13px;
  color: #6b7280;
  line-height: 1.4;
  margin-top: 2px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.meta-dot {
  color: #d1d5db;
}

.favorite-icon {
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.favorite-icon:hover {
  transform: scale(1.15);
}

/* 问题标题 */
.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  line-height: 1.5;
  margin: 0;
}

/* 内容预览 */
.card-content {
  font-size: 15px;
  color: #374151;
  line-height: 1.6;
  margin: 0;
}

/* 标签 */
.card-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tag-item {
  padding: 4px 12px;
  background: rgba(59, 130, 246, 0.08);
  color: #3b82f6;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.4;
  transition: all 0.2s;
}

.tag-item:hover {
  background: rgba(59, 130, 246, 0.15);
}

.tag-more {
  background: rgba(107, 114, 128, 0.08);
  color: #6b7280;
}

/* 分隔线 */
.card-divider {
  height: 1px;
  background: linear-gradient(to right, transparent, #e5e7eb 20%, #e5e7eb 80%, transparent);
  margin: 4px 0;
}

/* 互动统计栏 */
.card-stats {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #6b7280;
  transition: color 0.2s;
}

.stat-item .el-icon {
  color: #9ca3af;
}

.stat-item:hover {
  color: #374151;
}

.stat-item:hover .el-icon {
  color: #6b7280;
}

.status-badge {
  margin-left: auto;
  padding: 4px 10px;
  background: rgba(251, 191, 36, 0.1);
  border-radius: 8px;
  font-weight: 500;
  color: #f59e0b;
}

.status-badge.solved {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.status-badge .el-icon {
  color: inherit;
}

/* 热门回答预览 */
.top-answer-preview {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%);
  border-radius: 12px;
  padding: 12px 16px;
  margin-top: 4px;
  transition: all 0.2s;
}

.top-answer-preview:hover {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(59, 130, 246, 0.08) 100%);
}

.preview-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.preview-label {
  font-size: 12px;
  font-weight: 600;
  color: #10b981;
}

.preview-content {
  font-size: 14px;
  color: #374151;
  line-height: 1.6;
  margin-bottom: 8px;
}

.preview-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
}

.preview-author {
  color: #6b7280;
  font-weight: 500;
}

.preview-likes {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #3b82f6;
  font-weight: 500;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
}

.empty-text {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  margin-top: 16px;
}

.empty-hint {
  font-size: 14px;
  color: #6b7280;
  margin-top: 8px;
}

/* 分页 */
.pagination-wrapper {
  display: flex;
  justify-content: center;
  padding: 32px 20px;
  background: #f9fafb;
}

.pagination-wrapper :deep(.el-pagination) {
  gap: 8px;
}

.pagination-wrapper :deep(.el-pager li) {
  border-radius: 8px;
  min-width: 36px;
  height: 36px;
  line-height: 36px;
  font-weight: 500;
}

.pagination-wrapper :deep(.el-pager li.is-active) {
  background: #3b82f6;
  color: #ffffff;
}

.pagination-wrapper :deep(.btn-prev),
.pagination-wrapper :deep(.btn-next) {
  border-radius: 8px;
  min-width: 36px;
  height: 36px;
  line-height: 36px;
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

/* 关注列表 */
.follow-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 500px;
  overflow-y: auto;
}

.follow-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.follow-item:hover {
  background: #f3f4f6;
  transform: translateX(4px);
}

.follow-info {
  flex: 1;
  min-width: 0;
}

.follow-name {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 4px;
}

.follow-meta {
  font-size: 13px;
  color: #6b7280;
}

/* 响应式 */
@media (max-width: 1200px) {
  .questions-feed {
    max-width: 100%;
    padding: 20px 16px;
  }
  
  /* 小屏幕隐藏 AI 面板 */
  .ai-assistant-sidebar {
    display: none;
  }
  
  .community-content {
    right: 0;
  }
}

@media (max-width: 768px) {
  .questions-feed {
    padding: 16px 12px;
    gap: 16px;
  }
  
  .question-card {
    padding: 20px;
    border-radius: 12px;
  }
  
  .card-title {
    font-size: 16px;
  }
  
  .card-content {
    font-size: 14px;
  }
  
  .card-stats {
    gap: 16px;
  }
  
  .social-stats {
    font-size: 12px;
  }
}
</style>
