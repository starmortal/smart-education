<!-- ProfilePage.vue :: 个人中心页面 -->
<template>
    <!-- 主内容区 -->
  <div class="profile-container">
    <!-- 左侧：个人信息 -->
    <el-card class="profile-card">
      <template #header>
        <div class="card-header">
          <el-icon size="20" color="#0969da"><User /></el-icon>
          <span>个人信息</span>
          <div class="header-actions">
            <el-button 
              type="primary" 
              @click="showEditDialog = true"
              :icon="Camera"
            >
              编辑资料
            </el-button>
            
            <el-button 
              type="primary" 
              @click="showUserManagementDialog = true"
              :icon="Setting"
            >
              用户管理
            </el-button>
          </div>
        </div>
      </template>

      <div class="profile-content">
        <!-- 顶部区域：头像+基本信息 -->
        <div class="profile-top">
          <!-- 左侧：头像 -->
          <div class="avatar-section-new">
            <el-avatar :size="80" :src="userInfo.avatar" />
          </div>

          <!-- 右侧：年级和学校 -->
          <div class="info-middle">
            <div class="info-item-inline">
              <span class="info-label">年级</span>
              <span class="info-value">{{ getGradeLabel(userInfo.grade) || '未设置' }}</span>
            </div>

            <div class="info-item-inline">
              <span class="info-label">学校</span>
              <span class="info-value">{{ userInfo.school || '未设置' }}</span>
            </div>
          </div>
        </div>

        <!-- 用户名居中显示 -->
        <div class="username-center">
          {{ userInfo.nickname || '未设置' }}
        </div>

        <!-- 分隔线 -->
        <div class="divider"></div>

        <!-- 学习科目区域 -->
        <div class="subjects-section">
          <div class="info-item">
            <span class="info-label">学习科目</span>
            <div class="subjects-display">
              <el-tag 
                v-for="subject in userInfo.subjects" 
                :key="subject"
                type="primary"
                size="small"
                style="margin-right: 8px; margin-bottom: 8px;"
              >
                {{ subject }}
              </el-tag>
              <span v-if="userInfo.subjects.length === 0" class="info-value">未设置</span>
            </div>
          </div>
        </div>

        <!-- 第二条分隔线 -->
        <div class="divider"></div>

        <!-- 底部：AI分析历史记录 -->
        <div class="profile-bottom">
          <div class="analysis-history-section">
            <div class="section-title">
              <el-icon size="16" color="#0969da"><Reading /></el-icon>
              <span>AI成绩分析历史</span>
            </div>
            
            <div class="history-list" v-loading="analysisHistoryLoading">
              <el-empty 
                v-if="analysisHistoryList.length === 0" 
                description="暂无分析记录"
                :image-size="60"
              />
              <div 
                v-else
                v-for="record in analysisHistoryList.slice(0, 10)" 
                :key="record.id"
                class="history-item"
              >
                <div class="history-content" @click="viewHistoryAnalysis(record)">
                  <div class="history-name">{{ record.name }}</div>
                  <div class="history-date">{{ record.date }}</div>
                </div>
                <el-icon 
                  class="delete-icon" 
                  @click.stop="deleteHistoryAnalysis(record)"
                  size="16"
                >
                  <Delete />
                </el-icon>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 右侧：考试成绩 -->
    <el-card class="exam-card">
      <template #header>
        <div class="card-header">
          <el-icon size="20" color="#0969da"><TrendCharts /></el-icon>
          <span>考试成绩</span>
          <div class="header-actions">
            <el-button 
              type="primary" 
              size="small"
              :icon="Setting"
              @click="showFullScoreDialog = true"
            >
              设置满分
            </el-button>
            <el-button 
              type="primary" 
              size="small"
              :icon="Reading"
              @click="showAIAnalysisDialog"
              :disabled="examList.length === 0"
            >
              AI成绩分析
            </el-button>
            <el-button 
              type="primary" 
              size="small"
              :icon="Plus"
              @click="showAddExamDialog = true"
            >
              添加考试
            </el-button>
          </div>
        </div>
      </template>

      <div class="exam-content">
        <!-- 成绩列表 -->
        <div class="exam-list" v-loading="examLoading">
          <el-empty 
            v-if="examList.length === 0" 
            description="暂无考试记录"
            :image-size="100"
          />
          <div 
            v-else
            v-for="exam in examList" 
            :key="exam.id"
            class="exam-item"
          >
            <div class="exam-header">
              <div class="exam-name">{{ exam.examName }}</div>
              <div class="exam-date">{{ exam.examDate }}</div>
              <div class="exam-actions">
                <el-button
                  size="small"
                  type="primary"
                  :icon="TrendCharts"
                  circle
                  @click="showExamChart(exam)"
                  title="查看图表"
                />
                <el-button
                  size="small"
                  type="danger"
                  :icon="Delete"
                  circle
                  @click="deleteExam(exam.id)"
                />
              </div>
            </div>
            <div class="exam-scores">
              <div 
                v-for="score in exam.scores" 
                :key="score.subject"
                class="score-item"
              >
                <span class="subject-name">{{ score.subject }}</span>
                <span class="score-value">{{ score.score }}分</span>
              </div>
            </div>
            <div class="exam-total">
              总分：<span class="total-score">{{ exam.totalScore }}</span>
            </div>
          </div>
        </div>
      </div>
    </el-card>
  </div>

  <!-- 成绩可视化分析区域 -->
  <div class="charts-container" v-if="examList.length > 0">
    <!-- 单次成绩雷达图 -->
    <el-card class="chart-card">
      <template #header>
        <div class="card-header">
          <el-icon size="20" color="#0969da"><Histogram /></el-icon>
          <span>单次成绩分析</span>
          <el-select 
            v-model="selectedExamId" 
            placeholder="选择考试"
            size="small"
            style="width: 200px; margin-left: auto;"
            @change="updateRadarChart"
          >
            <el-option
              v-for="exam in examList"
              :key="exam.id"
              :label="exam.examName"
              :value="exam.id"
            />
          </el-select>
        </div>
      </template>
      <div ref="radarChartRef" class="chart-wrapper"></div>
    </el-card>

    <!-- 历次成绩趋势图 -->
    <el-card class="chart-card">
      <template #header>
        <div class="card-header">
          <el-icon size="20" color="#0969da"><DataLine /></el-icon>
          <span>成绩趋势分析</span>
        </div>
      </template>
      <div ref="trendChartRef" class="chart-wrapper"></div>
    </el-card>

    <!-- 科目平均分对比 -->
    <el-card class="chart-card">
      <template #header>
        <div class="card-header">
          <el-icon size="20" color="#0969da"><DataAnalysis /></el-icon>
          <span>科目平均分对比</span>
        </div>
      </template>
      <div ref="barChartRef" class="chart-wrapper"></div>
    </el-card>

    <!-- 科目得分率对比（新增）-->
    <el-card class="chart-card">
      <template #header>
        <div class="card-header">
          <el-icon size="20" color="#0969da"><Histogram /></el-icon>
          <span>科目得分率分析</span>
          <el-select 
            v-model="selectedPercentageExamId" 
            placeholder="选择考试"
            size="small"
            style="width: 200px; margin-left: auto;"
            @change="updatePercentageChart"
          >
            <el-option
              label="全部考试（平均）"
              value="all"
            />
            <el-option
              v-for="exam in examList"
              :key="exam.id"
              :label="exam.examName"
              :value="exam.id"
            />
          </el-select>
        </div>
      </template>
      <div ref="percentageChartRef" class="chart-wrapper"></div>
    </el-card>
  </div>

  <!-- AI 成绩分析对话框 -->
  <el-dialog
    v-model="showSuggestionDialog"
    title="AI 成绩分析"
    width="700px"
    :close-on-click-modal="true"
    :lock-scroll="true"
    class="ai-analysis-dialog"
  >
    <div class="ai-analysis-content">
      <el-empty 
        v-if="!aiAnalysisResult && !aiAnalysisLoading" 
        description="暂无分析结果"
        :image-size="80"
      />
      <div v-else class="markdown-content" v-html="renderedMarkdown"></div>
      <div v-if="aiAnalysisLoading" class="streaming-indicator">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>AI 正在分析中...</span>
      </div>
    </div>

    <template #footer>
      <div style="display: flex; justify-content: space-between; width: 100%;">
        <el-button 
          type="success" 
          @click="openSaveAnalysisDialog"
          :disabled="!canSaveAnalysis || aiAnalysisLoading"
        >
          保存分析
        </el-button>
        <el-button type="primary" @click="showSuggestionDialog = false">
          知道了
        </el-button>
      </div>
    </template>
  </el-dialog>

  <!-- 编辑个人资料对话框 -->
  <el-dialog
    v-model="showEditDialog"
    title="编辑个人资料"
    width="600px"
    :close-on-click-modal="false"
    @open="initEditForm"
  >
    <el-form :model="editForm" label-width="100px">
      <el-form-item label="头像">
        <div style="display: flex; align-items: center; gap: 16px;">
          <el-avatar :size="80" :src="editForm.avatar" />
          <div style="flex: 1;">
            <el-upload
              :show-file-list="false"
              :on-change="handleAvatarChange"
              :auto-upload="false"
              accept="image/*"
            >
              <el-button type="primary" size="small" :icon="Camera">
                更换头像
              </el-button>
            </el-upload>
            <div style="margin-top: 8px; font-size: 12px; color: #909399;">
              支持 JPG、PNG、GIF 格式，建议尺寸 200x200 像素
            </div>
          </div>
        </div>
      </el-form-item>

      <el-form-item label="用户名">
        <el-input 
          v-model="editForm.nickname" 
          placeholder="请输入用户名"
          maxlength="20"
        />
      </el-form-item>

      <el-form-item label="学校">
        <el-input 
          v-model="editForm.school" 
          placeholder="设置您的学校，遇见更多的校友"
          maxlength="50"
        />
      </el-form-item>

      <el-form-item label="年级">
        <el-select v-model="editForm.grade" placeholder="请选择年级" style="width: 100%">
          <el-option label="一年级" value="primary_1" />
          <el-option label="二年级" value="primary_2" />
          <el-option label="三年级" value="primary_3" />
          <el-option label="四年级" value="primary_4" />
          <el-option label="五年级" value="primary_5" />
          <el-option label="六年级" value="primary_6" />
          <el-option label="初一" value="junior_1" />
          <el-option label="初二" value="junior_2" />
          <el-option label="初三" value="junior_3" />
          <el-option label="高一" value="senior_1" />
          <el-option label="高二" value="senior_2" />
          <el-option label="高三" value="senior_3" />
        </el-select>
      </el-form-item>

      <el-form-item label="学习科目">
        <el-checkbox-group v-model="editForm.subjects">
          <el-checkbox label="语文" value="语文" />
          <el-checkbox label="数学" value="数学" />
          <el-checkbox label="英语" value="英语" />
          <el-checkbox label="物理" value="物理" />
          <el-checkbox label="化学" value="化学" />
          <el-checkbox label="生物" value="生物" />
          <el-checkbox label="历史" value="历史" />
          <el-checkbox label="地理" value="地理" />
          <el-checkbox label="政治" value="政治" />
        </el-checkbox-group>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="showEditDialog = false">取消</el-button>
      <el-button 
        type="primary" 
        @click="saveProfile"
        :loading="saveLoading"
        :icon="Check"
      >
        保存修改
      </el-button>
    </template>
  </el-dialog>

  <!-- 用户管理对话框 -->
  <el-dialog
    v-model="showUserManagementDialog"
    title="用户管理"
    width="500px"
    :close-on-click-modal="false"
    center
  >
    <div class="user-management-content">
      <div class="management-option" @click="openChangePassword">
        <div class="option-icon">
          <el-icon size="24" color="#409eff"><Lock /></el-icon>
        </div>
        <div class="option-info">
          <div class="option-title">修改密码</div>
          <div class="option-desc">通过邮箱验证码修改登录密码</div>
        </div>
        <el-icon class="option-arrow"><ArrowRight /></el-icon>
      </div>

      <div class="management-option" @click="openDeleteAccount">
        <div class="option-icon">
          <el-icon size="24" color="#f56c6c"><WarningFilled /></el-icon>
        </div>
        <div class="option-info">
          <div class="option-title">注销账号</div>
          <div class="option-desc">永久删除账号及所有数据，操作不可恢复</div>
        </div>
        <el-icon class="option-arrow"><ArrowRight /></el-icon>
      </div>
    </div>
  </el-dialog>

  <!-- 修改密码对话框 -->
  <el-dialog
    v-model="showChangePasswordDialog"
    title="修改密码"
    width="500px"
    :close-on-click-modal="false"
    @open="initPasswordForm"
  >
    <el-form :model="passwordForm" :rules="passwordRules" ref="passwordFormRef" label-width="100px">
      <el-form-item label="邮箱">
        <el-input 
          v-model="passwordForm.email" 
          placeholder="请输入注册邮箱"
          :disabled="true"
        />
      </el-form-item>

      <el-form-item label="验证码" prop="code">
        <div style="display: flex; gap: 12px;">
          <el-input 
            v-model="passwordForm.code" 
            placeholder="请输入验证码"
            maxlength="6"
            style="flex: 1;"
          />
          <el-button 
            type="primary"
            @click="sendVerificationCode"
            :disabled="codeSending || countdown > 0"
            :loading="codeSending"
          >
            {{ countdown > 0 ? `${countdown}秒后重试` : '发送验证码' }}
          </el-button>
        </div>
      </el-form-item>

      <el-form-item label="新密码" prop="newPassword">
        <el-input 
          v-model="passwordForm.newPassword" 
          type="password"
          placeholder="请输入新密码（6-20位）"
          maxlength="20"
          show-password
        />
      </el-form-item>

      <el-form-item label="确认密码" prop="confirmPassword">
        <el-input 
          v-model="passwordForm.confirmPassword" 
          type="password"
          placeholder="请再次输入新密码"
          maxlength="20"
          show-password
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="showChangePasswordDialog = false">取消</el-button>
      <el-button 
        type="primary" 
        @click="changePassword"
        :loading="passwordChanging"
        :icon="Check"
      >
        确认修改
      </el-button>
    </template>
  </el-dialog>

  <!-- 注销账号对话框 -->
  <el-dialog
    v-model="showDeleteAccountDialog"
    title="注销账号"
    width="500px"
    :close-on-click-modal="false"
    @open="initDeleteForm"
    class="delete-account-dialog"
  >
    <el-alert
      title="警告：此操作不可恢复！"
      type="error"
      :closable="false"
      class="delete-warning-alert"
    />

    <el-form :model="deleteForm" :rules="deleteRules" ref="deleteFormRef" label-width="100px">
      <el-form-item label="邮箱">
        <el-input 
          v-model="deleteForm.email" 
          placeholder="您的注册邮箱"
          :disabled="true"
        />
      </el-form-item>

      <el-form-item label="验证码" prop="code">
        <div style="display: flex; gap: 12px;">
          <el-input 
            v-model="deleteForm.code" 
            placeholder="请输入验证码"
            maxlength="6"
            style="flex: 1;"
          />
          <el-button 
            type="primary"
            @click="sendDeleteVerificationCode"
            :disabled="deleteCodeSending || deleteCountdown > 0"
            :loading="deleteCodeSending"
          >
            {{ deleteCountdown > 0 ? `${deleteCountdown}秒后重试` : '发送验证码' }}
          </el-button>
        </div>
      </el-form-item>

      <el-form-item prop="agreement">
        <el-checkbox v-model="deleteForm.agreement" class="delete-agreement-checkbox">
          <div class="agreement-text">
            <div>我已阅读并清楚注销账号操作不可恢复，</div>
            <div>所有数据将永久删除，确认永久注销账号</div>
          </div>
        </el-checkbox>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="showDeleteAccountDialog = false">取消</el-button>
      <el-button 
        type="danger" 
        @click="deleteAccount"
        :loading="accountDeleting"
        :disabled="!deleteForm.agreement"
      >
        确认注销
      </el-button>
    </template>
  </el-dialog>

  <!-- 设置满分对话框 -->
  <el-dialog
    v-model="showFullScoreDialog"
    title="设置科目满分"
    width="600px"
    :close-on-click-modal="true"
    @open="initFullScoreForm"
  >
    <el-alert 
      title="设置后，添加成绩时将自动使用这些满分值"
      type="info"
      :closable="false"
      style="margin-bottom: 20px"
    />
    
    <el-form :model="fullScoreForm" label-width="100px">
      <el-form-item 
        v-for="subject in userInfo.subjects" 
        :key="subject"
        :label="subject"
      >
        <el-input-number
          v-model="fullScoreForm.scores[subject]"
          :min="1"
          :max="200"
          :step="1"
          placeholder="满分"
          style="width: 200px"
        />
        <span style="margin-left: 12px; color: #909399;">分</span>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="showFullScoreDialog = false">取消</el-button>
      <el-button 
        type="primary" 
        @click="saveFullScores"
        :icon="Check"
      >
        保存设置
      </el-button>
    </template>
  </el-dialog>

  <!-- 添加考试成绩对话框 -->
  <el-dialog
    v-model="showAddExamDialog"
    title="添加考试成绩"
    width="600px"
    :close-on-click-modal="true"
    @open="initExamForm"
  >
    <el-form :model="examForm" label-width="100px">
      <el-form-item label="考试名称">
        <el-input 
          v-model="examForm.examName" 
          placeholder="例如：期中考试、月考等"
          maxlength="50"
        />
      </el-form-item>

      <el-form-item label="考试日期">
        <el-date-picker
          v-model="examForm.examDate"
          type="date"
          placeholder="选择日期"
          style="width: 100%"
          format="YYYY年MM月DD日"
          value-format="YYYY-MM-DD"
        />
      </el-form-item>

      <el-form-item label="科目成绩">
        <el-alert 
          v-if="userInfo.subjects.length === 0"
          title="请先在个人信息中设置学习科目"
          type="warning"
          :closable="false"
          style="margin-bottom: 16px"
        />
        <div v-else class="score-inputs">
          <div 
            v-for="subject in userInfo.subjects" 
            :key="subject"
            class="score-input-item"
          >
            <span class="subject-label">{{ subject }}：</span>
            <el-input-number
              v-model="examForm.scores[subject]"
              :min="0"
              :max="userInfo.subjectFullScores[subject] || 150"
              :step="0.5"
              :controls="false"
              placeholder="分数"
              style="width: 120px"
            />
          </div>
        </div>
      </el-form-item>

      <el-form-item label="总分">
        <div class="total-score-display">
          <span class="total-label">{{ calculatedTotalScore }}</span>
          <span class="total-hint">分</span>
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="showAddExamDialog = false">取消</el-button>
      <el-button 
        type="primary" 
        @click="saveExam"
        :loading="examSaveLoading"
        :icon="Check"
        :disabled="userInfo.subjects.length === 0"
      >
        保存
      </el-button>
    </template>
  </el-dialog>

  <!-- 保存分析对话框 -->
  <el-dialog
    v-model="showSaveAnalysisDialog"
    title="保存分析记录"
    width="500px"
    :close-on-click-modal="false"
  >
    <el-form label-width="100px">
      <el-form-item label="分析名称">
        <el-input 
          v-model="saveAnalysisName" 
          placeholder="请输入分析名称或备注"
          maxlength="100"
          show-word-limit
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="showSaveAnalysisDialog = false">取消</el-button>
      <el-button 
        type="primary" 
        @click="saveAnalysis"
        :loading="savingAnalysis"
        :icon="Check"
      >
        保存
      </el-button>
    </template>
  </el-dialog>

  <!-- 查看历史分析对话框 -->
  <el-dialog
    v-model="showHistoryAnalysisDialog"
    :title="selectedHistoryAnalysis?.name || '历史分析'"
    width="700px"
    :close-on-click-modal="true"
    :lock-scroll="true"
    class="ai-analysis-dialog"
  >
    <div class="ai-analysis-content">
      <div class="markdown-content" v-html="marked(selectedHistoryAnalysis?.analysis || '')"></div>
    </div>

    <template #footer>
      <el-button type="primary" @click="showHistoryAnalysisDialog = false">
        关闭
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, onMounted, computed, nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { 
  User, 
  Camera, 
  Check, 
  TrendCharts, 
  Plus,
  Delete,
  Histogram,
  DataLine,
  DataAnalysis,
  Reading,
  Setting,
  Warning,
  Lock,
  ArrowRight,
  WarningFilled,
  Loading
} from '@element-plus/icons-vue';
import axios from 'axios';
import * as echarts from 'echarts';
import eventBus from '@/utils/eventBus';
import { marked } from 'marked';

const apiClient = axios.create({
  baseURL: 'http://localhost:3001/api',
  timeout: 120000,  // 增加到 120 秒（2 分钟）
});

// 添加请求拦截器，自动添加 token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('edu-token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('📤 发送请求:', config.url, '| Token:', token ? '存在' : '不存在');
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 添加响应拦截器，处理错误
apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ 请求成功:', response.config.url);
    return response;
  },
  (error) => {
    console.error('❌ 请求失败:', error.config?.url, '| 状态码:', error.response?.status);
    console.error('❌ 错误详情:', error.response?.data);
    return Promise.reject(error);
  }
);

const saveLoading = ref(false);
const examLoading = ref(false);
const examSaveLoading = ref(false);
const showAddExamDialog = ref(false);
const showEditDialog = ref(false);
const showFullScoreDialog = ref(false);
const showSuggestionDialog = ref(false);  // AI 评价对话框
const showUserManagementDialog = ref(false);
const showChangePasswordDialog = ref(false);
const showDeleteAccountDialog = ref(false);
const showSaveAnalysisDialog = ref(false);  // 保存分析对话框
const showHistoryAnalysisDialog = ref(false);  // 查看历史分析对话框
const codeSending = ref(false);
const countdown = ref(0);
const deleteCodeSending = ref(false);
const deleteCountdown = ref(0);
const passwordChanging = ref(false);
const accountDeleting = ref(false);
const passwordFormRef = ref(null);
const deleteFormRef = ref(null);

// AI 分析相关
const aiAnalysisLoading = ref(false);
const aiAnalysisResult = ref('');
const currentAnalysisData = ref(null);  // 当前分析的数据快照
const analysisHistoryList = ref([]);  // 分析历史记录列表
const analysisHistoryLoading = ref(false);
const saveAnalysisName = ref('');  // 保存分析的名称
const savingAnalysis = ref(false);
const selectedHistoryAnalysis = ref(null);  // 选中的历史分析记录
// 计算是否可以保存分析
const canSaveAnalysis = computed(() => {
  if (!aiAnalysisResult.value || aiAnalysisResult.value.trim() === '') {
    return false;
  }
  // 排除错误和警告信息（只检查关键词，不检查格式）
  const content = aiAnalysisResult.value;
  if (content.includes('暂无数据') || 
      content.includes('未登录') ||
      content.includes('认证失败') ||
      content.includes('请求超时') ||
      content.includes('网络错误') ||
      content.includes('分析失败')) {
    return false;
  }
  return true;
});

const renderedMarkdown = computed(() => {
  if (!aiAnalysisResult.value) return '';
  return marked(aiAnalysisResult.value);
});

// 图表相关
const radarChartRef = ref(null);
const trendChartRef = ref(null);
const barChartRef = ref(null);
const percentageChartRef = ref(null);
const selectedExamId = ref('');
const selectedPercentageExamId = ref('all');
let radarChart = null;
let trendChart = null;
let barChart = null;
let percentageChart = null;

// 用户信息
const userInfo = reactive({
  nickname: '',
  avatar: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png',
  grade: '',
  school: '',  // 新增：学校
  subjects: [],
  subjectFullScores: {}  // 新增：各科目的满分设置
});

// 考试列表
const examList = ref([]);

// 编辑表单
const editForm = reactive({
  nickname: '',
  avatar: '',
  grade: '',
  school: '',  // 新增：学校
  subjects: []
});

// 修改密码表单
const passwordForm = reactive({
  email: '',
  code: '',
  newPassword: '',
  confirmPassword: ''
});

// 注销账号表单
const deleteForm = reactive({
  email: '',
  code: '',
  agreement: false
});

// 密码表单验证规则
const passwordRules = {
  code: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { len: 6, message: '验证码为6位数字', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度为6-20位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    { 
      validator: (rule, value, callback) => {
        if (value !== passwordForm.newPassword) {
          callback(new Error('两次输入的密码不一致'));
        } else {
          callback();
        }
      }, 
      trigger: 'blur' 
    }
  ]
};

// 注销账号表单验证规则
const deleteRules = {
  code: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { len: 6, message: '验证码为6位数字', trigger: 'blur' }
  ],
  agreement: [
    { 
      validator: (rule, value, callback) => {
        if (!value) {
          callback(new Error('请阅读并勾选确认'));
        } else {
          callback();
        }
      }, 
      trigger: 'change' 
    }
  ]
};

// 满分设置表单
const fullScoreForm = reactive({
  scores: {}
});

// 考试表单
const examForm = reactive({
  examName: '',
  examDate: '',
  scores: {}
});

// 计算总分
const calculatedTotalScore = computed(() => {
  let total = 0;
  for (const subject of userInfo.subjects) {
    total += examForm.scores[subject] || 0;
  }
  return total.toFixed(1);
});

// 初始化满分设置表单
function initFullScoreForm() {
  fullScoreForm.scores = {};
  
  userInfo.subjects.forEach(subject => {
    // 使用已保存的满分，如果没有则默认150
    fullScoreForm.scores[subject] = userInfo.subjectFullScores[subject] || 150;
  });
}

// 保存满分设置
async function saveFullScores() {
  try {
    const userId = localStorage.getItem('edu-user-id');
    
    // 更新用户信息中的满分设置
    userInfo.subjectFullScores = { ...fullScoreForm.scores };
    
    // 保存到后端
    await apiClient.put(`/user/profile/${userId}`, {
      nickname: userInfo.nickname,
      avatar: userInfo.avatar,
      grade: userInfo.grade,
      subjects: userInfo.subjects,
      subjectFullScores: userInfo.subjectFullScores
    });
    
    ElMessage.success('满分设置已保存！');
    showFullScoreDialog.value = false;
  } catch (error) {
    console.error('保存满分设置失败：', error);
    ElMessage.error('保存失败，请重试');
  }
}

// 初始化编辑表单
function initEditForm() {
  editForm.nickname = userInfo.nickname;
  editForm.avatar = userInfo.avatar;
  editForm.grade = userInfo.grade;
  editForm.school = userInfo.school || '';
  
  // 确保 subjects 是数组
  if (Array.isArray(userInfo.subjects)) {
    editForm.subjects = [...userInfo.subjects];
  } else {
    console.warn('⚠️ userInfo.subjects 不是数组，重置为空数组');
    editForm.subjects = [];
  }
}

// 初始化修改密码表单
function initPasswordForm() {
  passwordForm.email = localStorage.getItem('edu-email') || '';
  passwordForm.code = '';
  passwordForm.newPassword = '';
  passwordForm.confirmPassword = '';
  countdown.value = 0;
}

// 发送验证码
async function sendVerificationCode() {
  if (!passwordForm.email) {
    ElMessage.warning('未找到注册邮箱');
    return;
  }

  codeSending.value = true;
  try {
    await apiClient.post('/user/send-code', {
      email: passwordForm.email,
      type: 'reset'  // 重置密码类型
    });
    
    ElMessage.success('验证码已发送到您的邮箱');
    
    // 开始倒计时
    countdown.value = 60;
    const timer = setInterval(() => {
      countdown.value--;
      if (countdown.value <= 0) {
        clearInterval(timer);
      }
    }, 1000);
  } catch (error) {
    console.error('发送验证码失败：', error);
    ElMessage.error(error.response?.data?.message || '发送失败，请重试');
  } finally {
    codeSending.value = false;
  }
}

// 打开修改密码对话框
function openChangePassword() {
  showUserManagementDialog.value = false;
  showChangePasswordDialog.value = true;
}

// 打开注销账号对话框
function openDeleteAccount() {
  showUserManagementDialog.value = false;
  showDeleteAccountDialog.value = true;
}

// 初始化注销表单
function initDeleteForm() {
  deleteForm.email = localStorage.getItem('edu-email') || '';
  deleteForm.code = '';
  deleteForm.agreement = false;
  deleteCountdown.value = 0;
}

// 发送注销账号验证码
async function sendDeleteVerificationCode() {
  if (!deleteForm.email) {
    ElMessage.warning('未找到注册邮箱');
    return;
  }

  deleteCodeSending.value = true;
  try {
    await apiClient.post('/user/send-code', {
      email: deleteForm.email,
      type: 'delete'  // 注销账号类型
    });
    
    ElMessage.success('验证码已发送到您的邮箱');
    
    // 开始倒计时
    deleteCountdown.value = 60;
    const timer = setInterval(() => {
      deleteCountdown.value--;
      if (deleteCountdown.value <= 0) {
        clearInterval(timer);
      }
    }, 1000);
  } catch (error) {
    console.error('发送验证码失败：', error);
    ElMessage.error(error.response?.data?.message || '发送失败，请重试');
  } finally {
    deleteCodeSending.value = false;
  }
}

// 注销账号
async function deleteAccount() {
  try {
    await deleteFormRef.value.validate();
    
    await ElMessageBox.confirm(
      '最后确认：您确定要永久删除账号吗？此操作无法撤销！',
      '最终确认',
      {
        confirmButtonText: '确认注销',
        cancelButtonText: '取消',
        type: 'error',
        confirmButtonClass: 'el-button--danger'
      }
    );
    
    accountDeleting.value = true;
    
    const userId = localStorage.getItem('edu-user-id');
    await apiClient.delete(`/user/account/${userId}`, {
      data: {
        email: deleteForm.email,
        code: deleteForm.code
      }
    });
    
    ElMessage.success('账号已注销，感谢您的使用');
    showDeleteAccountDialog.value = false;
    
    // 清除登录信息，跳转到登录页
    setTimeout(() => {
      localStorage.clear();
      window.location.href = '/login';
    }, 1500);
  } catch (error) {
    if (error !== 'cancel') {
      console.error('注销账号失败：', error);
      ElMessage.error(error.response?.data?.message || '注销失败，请重试');
    }
  } finally {
    accountDeleting.value = false;
  }
}

// 修改密码
async function changePassword() {
  try {
    await passwordFormRef.value.validate();
    
    passwordChanging.value = true;
    
    await apiClient.post('/user/reset-password', {
      email: passwordForm.email,
      code: passwordForm.code,
      newPassword: passwordForm.newPassword
    });
    
    ElMessage.success('密码修改成功，请重新登录');
    showChangePasswordDialog.value = false;
    
    // 清除登录信息，跳转到登录页
    setTimeout(() => {
      localStorage.clear();
      window.location.href = '/login';
    }, 1500);
  } catch (error) {
    console.error('修改密码失败：', error);
    ElMessage.error(error.response?.data?.message || '修改失败，请重试');
  } finally {
    passwordChanging.value = false;
  }
}

// 初始化考试表单
function initExamForm() {
  examForm.examName = '';
  examForm.examDate = '';
  examForm.scores = {};
  
  // 确保 userInfo.subjects 是数组
  if (!Array.isArray(userInfo.subjects)) {
    console.error('❌ userInfo.subjects 不是数组！', userInfo.subjects);
    ElMessage.error('数据格式错误，请刷新页面重试');
    return;
  }
  
  // 为每个科目初始化分数为 null（显示为空）
  userInfo.subjects.forEach(subject => {
    examForm.scores[subject] = null;
  });
}

// 加载用户信息
async function loadUserProfile() {
  try {
    const userId = localStorage.getItem('edu-user-id');
    
    const res = await apiClient.get(`/user/profile/${userId}`);
    
    if (res.data) {
      // 处理 subjects - 确保是数组格式
      let subjects = [];
      let needsFixing = false;
      
      if (res.data.subjects) {
        // 如果是数组，直接使用
        if (Array.isArray(res.data.subjects)) {
          subjects = res.data.subjects.filter(s => typeof s === 'string' && s.trim());
        } 
        // 如果是对象（错误格式），转换为空数组并标记需要修复
        else if (typeof res.data.subjects === 'object') {
          console.warn('⚠️ 检测到错误的subjects格式（对象），将重置为空数组');
          subjects = [];
          needsFixing = true;
        }
      }
      
      userInfo.subjects = subjects;
      userInfo.nickname = res.data.nickname || '';
      userInfo.avatar = res.data.avatar || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png';
      userInfo.grade = res.data.grade || '';
      userInfo.school = res.data.school || '';
      userInfo.subjectFullScores = res.data.subjectFullScores || {};
      
      // 如果检测到错误格式，自动修复数据库
      if (needsFixing) {
        try {
          await apiClient.put(`/user/profile/${userId}`, {
            nickname: userInfo.nickname,
            avatar: userInfo.avatar,
            grade: userInfo.grade,
            school: userInfo.school,
            subjects: []
          });
          ElMessage.warning('检测到数据异常，已自动修复。请重新设置学习科目。');
        } catch (fixError) {
          console.error('❌ 修复数据失败：', fixError);
        }
      }
    }
    
    // 从本地存储加载基本信息（覆盖）
    const nickname = localStorage.getItem('edu-nickname');
    const avatar = localStorage.getItem('edu-avatar');
    if (nickname) userInfo.nickname = nickname;
    if (avatar) userInfo.avatar = avatar;
  } catch (error) {
    console.error('加载用户信息失败：', error);
  }
}

// 处理头像上传
function handleAvatarChange(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    editForm.avatar = e.target.result;
  };
  reader.readAsDataURL(file.raw);
}

// 获取年级标签
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

// 保存个人信息
async function saveProfile() {
  if (!editForm.nickname.trim()) {
    ElMessage.warning('请输入用户名');
    return;
  }

  saveLoading.value = true;
  try {
    const userId = localStorage.getItem('edu-user-id');
    
    const updateData = {
      nickname: editForm.nickname,
      avatar: editForm.avatar,
      grade: editForm.grade,
      school: editForm.school || '',
      subjects: editForm.subjects || []
    };
    
    const response = await apiClient.put(`/user/profile/${userId}`, updateData);

    // 更新用户信息
    userInfo.nickname = editForm.nickname;
    userInfo.avatar = editForm.avatar;
    userInfo.grade = editForm.grade;
    userInfo.school = editForm.school || '';
    userInfo.subjects = [...editForm.subjects];

    // 更新本地存储
    localStorage.setItem('edu-nickname', editForm.nickname);
    localStorage.setItem('edu-avatar', editForm.avatar);
    localStorage.setItem('edu-school', editForm.school || '');
    localStorage.setItem('edu-grade', editForm.grade || '');

    // 触发用户信息更新事件，通知导航栏更新
    eventBus.emit('userInfoUpdated');

    ElMessage.success('保存成功！');
    showEditDialog.value = false;
  } catch (error) {
    console.error('保存失败：', error);
    ElMessage.error(error.response?.data?.message || '保存失败，请重试');
  } finally {
    saveLoading.value = false;
  }
}

// 加载考试记录
async function loadExamList() {
  examLoading.value = true;
  try {
    const userId = localStorage.getItem('edu-user-id');
    const res = await apiClient.get('/user/exams', {
      params: { userId }
    });
    
    // 格式化日期显示
    const list = (res.data.list || []).map(exam => ({
      ...exam,
      examDate: formatDate(exam.examDate)
    }));
    
    examList.value = list;
    
    // 如果有考试记录，初始化图表
    if (list.length > 0) {
      selectedExamId.value = list[0].id;
      nextTick(() => {
        initCharts();
      });
    }
  } catch (error) {
    console.error('加载考试记录失败：', error);
  } finally {
    examLoading.value = false;
  }
}

// 格式化日期
function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}年${month}月${day}日`;
}

// 保存考试成绩
async function saveExam() {
  if (!examForm.examName.trim()) {
    ElMessage.warning('请输入考试名称');
    return;
  }

  if (!examForm.examDate) {
    ElMessage.warning('请选择考试日期');
    return;
  }

  if (userInfo.subjects.length === 0) {
    ElMessage.warning('请先在个人信息中设置学习科目');
    return;
  }

  // 构建成绩数组
  const scores = [];
  let totalScore = 0;
  let totalFullScore = 0;
  let hasScore = false;
  
  for (const subject of userInfo.subjects) {
    const score = examForm.scores[subject];
    // 使用用户设置的满分，如果没有设置则默认150
    const fullScore = userInfo.subjectFullScores[subject] || 150;
    
    // 只有当分数不为null且大于0时才算有成绩
    if (score !== null && score !== undefined && score > 0) {
      hasScore = true;
    }
    
    scores.push({
      subject,
      score: score || 0, // 保存时将null转为0
      fullScore  // 保存满分到数据库
    });
    
    totalScore += (score || 0);
    totalFullScore += fullScore;
  }

  if (!hasScore) {
    ElMessage.warning('请至少输入一门科目的成绩');
    return;
  }

  examSaveLoading.value = true;
  try {
    const userId = localStorage.getItem('edu-user-id');
    await apiClient.post('/user/exams', {
      userId,
      examName: examForm.examName,
      examDate: examForm.examDate,
      scores,
      totalScore: parseFloat(totalScore.toFixed(1)),
      totalFullScore  // 保存总满分到数据库
    });

    ElMessage.success('添加成功！');
    showAddExamDialog.value = false;
    
    // 刷新列表
    loadExamList();
  } catch (error) {
    console.error('保存考试成绩失败：', error);
    ElMessage.error(error.response?.data?.message || '保存失败，请重试');
  } finally {
    examSaveLoading.value = false;
  }
}

// 删除考试记录
async function deleteExam(id) {
  try {
    await ElMessageBox.confirm('确定删除这条考试记录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });

    await apiClient.delete(`/user/exams/${id}`);
    examList.value = examList.value.filter(item => item.id !== id);
    ElMessage.success('删除成功');
    
    // 更新图表
    if (examList.value.length > 0) {
      if (selectedExamId.value === id) {
        selectedExamId.value = examList.value[0].id;
      }
      nextTick(() => {
        initCharts();
      });
    } else {
      // 销毁图表
      destroyCharts();
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败：', error);
      ElMessage.error('删除失败');
    }
  }
}

// 显示单次考试图表
function showExamChart(exam) {
  selectedExamId.value = exam.id;
  updateRadarChart();
  
  // 滚动到图表区域
  nextTick(() => {
    const chartsContainer = document.querySelector('.charts-container');
    if (chartsContainer) {
      chartsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
}

// 初始化所有图表
function initCharts() {
  initRadarChart();
  initTrendChart();
  initBarChart();
  initPercentageChart();
}

// 显示 AI 分析对话框
async function showAIAnalysisDialog() {
  try {
    console.log('🎯 点击了 AI 成绩分析按钮');
    
    // 先显示对话框
    showSuggestionDialog.value = true;
    
    // 每次都重新生成分析（不使用缓存）
    await generateAIAnalysis();
  } catch (error) {
    console.error('❌ showAIAnalysisDialog 错误:', error);
    ElMessage.error('打开对话框失败：' + error.message);
  }
}

// 调用 AI 进行成绩分析（流式输出）
async function generateAIAnalysis() {
  try {
    console.log('🚀 开始 AI 分析');
    
    if (!examList.value || examList.value.length === 0) {
      console.warn('⚠️ 没有考试记录');
      ElMessage.warning('暂无考试记录，无法进行分析');
      aiAnalysisResult.value = '## ⚠️ 暂无数据\n\n请先添加考试成绩后再进行分析。';
      return;
    }

    aiAnalysisLoading.value = true;
    aiAnalysisResult.value = '';

    // 检查 token 是否存在
    const token = localStorage.getItem('edu-token');
    
    if (!token) {
      console.error('❌ Token 不存在');
      ElMessage.error('请先登录');
      aiAnalysisResult.value = '## ❌ 未登录\n\n请先登录后再使用此功能。';
      aiAnalysisLoading.value = false;
      return;
    }
    
    // 保存当前分析的数据快照
    currentAnalysisData.value = {
      examList: JSON.parse(JSON.stringify(examList.value)),
      userInfo: {
        grade: userInfo.grade || '未设置',
        subjects: [...userInfo.subjects] || []
      }
    };
    
    console.log('🔑 Token 存在:', !!token);
    console.log('📊 发送数据:', {
      examCount: examList.value.length,
      grade: userInfo.grade,
      subjects: userInfo.subjects
    });

    // 使用 fetch 实现流式请求
    const response = await fetch('http://localhost:3001/api/ai/analyze-scores-stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(currentAnalysisData.value)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    // 逐块读取流式数据
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        console.log('✅ AI 分析完成');
        ElMessage.success('AI 分析完成！');
        break;
      }

      // 解码数据块
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            continue;
          }
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              aiAnalysisResult.value += parsed.content;
            }
          } catch (e) {
            console.warn('解析数据失败:', e);
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ AI 分析失败：', error);
    
    // 如果是 401 错误，说明 token 无效
    if (error.message.includes('401')) {
      ElMessage.error('登录状态已失效，请刷新页面后重新登录');
      aiAnalysisResult.value = '## ❌ 认证失败\n\n登录状态已失效，请刷新页面后重新登录。';
    } else if (error.message.includes('timeout')) {
      ElMessage.error('AI 分析超时，请稍后重试');
      aiAnalysisResult.value = '## ⏱️ 请求超时\n\nAI 分析时间较长，请稍后重试。';
    } else if (error.message.includes('Failed to fetch')) {
      ElMessage.error('网络错误，请检查后端服务是否正常');
      aiAnalysisResult.value = '## 🌐 网络错误\n\n无法连接到服务器，请检查后端服务是否正常运行。';
    } else {
      const errorMsg = error.message || 'AI 分析失败，请重试';
      ElMessage.error(errorMsg);
      aiAnalysisResult.value = `## ❌ 分析失败\n\n${errorMsg}`;
    }
  } finally {
    aiAnalysisLoading.value = false;
  }
}

// 打开保存分析对话框
function openSaveAnalysisDialog() {
  // 检查是否有有效的分析结果
  if (!aiAnalysisResult.value || aiAnalysisResult.value.trim() === '') {
    ElMessage.warning('当前没有可保存的分析结果');
    return;
  }
  
  // 排除错误和警告信息
  const content = aiAnalysisResult.value;
  if (content.includes('暂无数据') || 
      content.includes('未登录') ||
      content.includes('认证失败') ||
      content.includes('请求超时') ||
      content.includes('网络错误') ||
      content.includes('分析失败')) {
    ElMessage.warning('当前没有可保存的分析结果');
    return;
  }
  
  // 生成默认名称
  const now = new Date();
  const dateStr = `${now.getFullYear()}年${String(now.getMonth() + 1).padStart(2, '0')}月${String(now.getDate()).padStart(2, '0')}日`;
  saveAnalysisName.value = `成绩分析-${dateStr}`;
  
  showSaveAnalysisDialog.value = true;
}

// 保存分析记录
async function saveAnalysis() {
  if (!saveAnalysisName.value.trim()) {
    ElMessage.warning('请输入分析名称');
    return;
  }

  savingAnalysis.value = true;
  try {
    await apiClient.post('/ai/save-score-analysis', {
      name: saveAnalysisName.value.trim(),
      analysis: aiAnalysisResult.value,
      examSnapshot: currentAnalysisData.value?.examList || [],
      userInfoSnapshot: currentAnalysisData.value?.userInfo || {},
    });

    ElMessage.success('保存成功！');
    showSaveAnalysisDialog.value = false;
    
    // 刷新历史记录列表
    loadAnalysisHistory();
  } catch (error) {
    console.error('保存分析记录失败：', error);
    ElMessage.error(error.response?.data?.message || '保存失败，请重试');
  } finally {
    savingAnalysis.value = false;
  }
}

// 加载分析历史记录
async function loadAnalysisHistory() {
  analysisHistoryLoading.value = true;
  try {
    const res = await apiClient.get('/ai/score-analysis-list', {
      params: { page: 1, limit: 50 }
    });
    
    analysisHistoryList.value = res.data.list || [];
  } catch (error) {
    console.error('加载分析历史记录失败：', error);
  } finally {
    analysisHistoryLoading.value = false;
  }
}

// 查看历史分析记录
async function viewHistoryAnalysis(record) {
  try {
    const res = await apiClient.get(`/ai/score-analysis/${record.id}`);
    
    selectedHistoryAnalysis.value = res.data;
    showHistoryAnalysisDialog.value = true;
  } catch (error) {
    console.error('获取历史分析详情失败：', error);
    ElMessage.error('获取详情失败');
  }
}

// 删除历史分析记录
async function deleteHistoryAnalysis(record) {
  try {
    await ElMessageBox.confirm('确定删除这条分析记录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });

    await apiClient.delete(`/ai/score-analysis/${record.id}`);
    ElMessage.success('删除成功');
    
    // 刷新列表
    loadAnalysisHistory();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败：', error);
      ElMessage.error('删除失败');
    }
  }
}

// 初始化雷达图
function initRadarChart() {
  if (!radarChartRef.value) return;
  
  if (radarChart) {
    radarChart.dispose();
  }
  
  radarChart = echarts.init(radarChartRef.value);
  updateRadarChart();
  
  // 响应式
  window.addEventListener('resize', () => {
    radarChart?.resize();
  });
}

// 更新雷达图
function updateRadarChart() {
  if (!radarChart || !selectedExamId.value) return;
  
  const exam = examList.value.find(e => e.id === selectedExamId.value);
  if (!exam) return;
  
  const subjects = exam.scores.map(s => s.subject);
  const scores = exam.scores.map(s => s.score);
  
  // 使用实际的满分值
  const maxScores = exam.scores.map(s => s.fullScore || 150);
  
  const option = {
    title: {
      text: exam.examName,
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 600,
        color: '#333'
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        let result = `${exam.examName}<br/>`;
        params.value.forEach((val, index) => {
          const fullScore = maxScores[index];
          const percentage = ((val / fullScore) * 100).toFixed(1);
          result += `${subjects[index]}：${val}/${fullScore} (${percentage}%)<br/>`;
        });
        return result;
      }
    },
    radar: {
      indicator: subjects.map((subject, index) => ({
        name: subject,
        max: maxScores[index]  // 使用实际满分
      })),
      radius: '65%',
      splitNumber: 5,
      name: {
        textStyle: {
          color: '#666',
          fontSize: 13
        }
      },
      splitLine: {
        lineStyle: {
          color: '#e4e7ed'
        }
      },
      splitArea: {
        areaStyle: {
          color: ['rgba(9, 105, 218, 0.05)', 'rgba(9, 105, 218, 0.1)']
        }
      },
      axisLine: {
        lineStyle: {
          color: '#e4e7ed'
        }
      }
    },
    series: [{
      type: 'radar',
      data: [{
        value: scores,
        name: '成绩',
        areaStyle: {
          color: 'rgba(9, 105, 218, 0.3)'
        },
        lineStyle: {
          color: '#0969da',
          width: 2
        },
        itemStyle: {
          color: '#0969da'
        }
      }],
      label: {
        show: true,
        formatter: (params) => {
          return params.value;
        },
        color: '#0969da',
        fontSize: 12,
        fontWeight: 600
      }
    }]
  };
  
  radarChart.setOption(option);
}

// 初始化趋势图
function initTrendChart() {
  if (!trendChartRef.value) return;
  
  if (trendChart) {
    trendChart.dispose();
  }
  
  trendChart = echarts.init(trendChartRef.value);
  
  // 按日期排序
  const sortedExams = [...examList.value].sort((a, b) => {
    return new Date(a.examDate) - new Date(b.examDate);
  });
  
  const examNames = sortedExams.map(e => e.examName);
  const totalScores = sortedExams.map(e => e.totalScore);
  
  // 计算平均分
  const avgScore = totalScores.reduce((a, b) => a + b, 0) / totalScores.length;
  
  const option = {
    title: {
      text: '总分变化趋势',
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 600,
        color: '#333'
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    legend: {
      data: ['总分', '平均分'],
      top: 35
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: 80,
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: examNames,
      axisLabel: {
        rotate: 30,
        fontSize: 12
      }
    },
    yAxis: {
      type: 'value',
      name: '分数',
      axisLabel: {
        formatter: '{value}'
      }
    },
    series: [
      {
        name: '总分',
        type: 'line',
        data: totalScores,
        smooth: true,
        lineStyle: {
          color: '#0969da',
          width: 3
        },
        itemStyle: {
          color: '#0969da'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(9, 105, 218, 0.3)' },
            { offset: 1, color: 'rgba(9, 105, 218, 0.05)' }
          ])
        },
        label: {
          show: true,
          position: 'top',
          color: '#0969da',
          fontSize: 12,
          fontWeight: 600
        }
      },
      {
        name: '平均分',
        type: 'line',
        data: new Array(examNames.length).fill(avgScore.toFixed(1)),
        lineStyle: {
          color: '#f56c6c',
          width: 2,
          type: 'dashed'
        },
        itemStyle: {
          color: '#f56c6c'
        }
      }
    ]
  };
  
  trendChart.setOption(option);
  
  // 响应式
  window.addEventListener('resize', () => {
    trendChart?.resize();
  });
}

// 初始化柱状图
function initBarChart() {
  if (!barChartRef.value) return;
  
  if (barChart) {
    barChart.dispose();
  }
  
  barChart = echarts.init(barChartRef.value);
  
  // 计算每个科目的平均分和满分
  const subjectData = {};
  
  examList.value.forEach(exam => {
    exam.scores.forEach(score => {
      if (!subjectData[score.subject]) {
        subjectData[score.subject] = {
          scores: [],
          fullScores: []
        };
      }
      subjectData[score.subject].scores.push(score.score);
      subjectData[score.subject].fullScores.push(score.fullScore || 150);
    });
  });
  
  const subjects = Object.keys(subjectData);
  const avgScores = subjects.map(subject => {
    const scores = subjectData[subject].scores;
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    return avg.toFixed(1);
  });
  
  // 计算最高分和最低分
  const maxScores = subjects.map(subject => Math.max(...subjectData[subject].scores));
  const minScores = subjects.map(subject => Math.min(...subjectData[subject].scores));
  
  // 计算Y轴最大值（取所有科目满分的最大值）
  const maxFullScore = Math.max(...subjects.map(subject => 
    Math.max(...subjectData[subject].fullScores)
  ));
  
  const option = {
    title: {
      text: '各科目成绩统计',
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 600,
        color: '#333'
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: (params) => {
        const subjectName = params[0].name;
        const data = subjectData[subjectName];
        const avgFullScore = (data.fullScores.reduce((a, b) => a + b, 0) / data.fullScores.length).toFixed(0);
        let result = `${subjectName}<br/>`;
        params.forEach(param => {
          result += `${param.marker}${param.seriesName}：${param.value}分<br/>`;
        });
        result += `平均满分：${avgFullScore}分`;
        return result;
      }
    },
    legend: {
      data: ['平均分', '最高分', '最低分'],
      top: 35
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: 80,
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: subjects,
      axisLabel: {
        fontSize: 12
      }
    },
    yAxis: {
      type: 'value',
      name: '分数',
      max: maxFullScore,  // 使用实际最大满分
      axisLabel: {
        formatter: '{value}'
      }
    },
    series: [
      {
        name: '平均分',
        type: 'bar',
        data: avgScores,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#0969da' },
            { offset: 1, color: '#4a9eff' }
          ])
        },
        label: {
          show: true,
          position: 'top',
          color: '#0969da',
          fontSize: 12,
          fontWeight: 600
        },
        barWidth: '40%'
      },
      {
        name: '最高分',
        type: 'scatter',
        data: maxScores,
        itemStyle: {
          color: '#67c23a'
        },
        symbolSize: 10
      },
      {
        name: '最低分',
        type: 'scatter',
        data: minScores,
        itemStyle: {
          color: '#f56c6c'
        },
        symbolSize: 10
      }
    ]
  };
  
  barChart.setOption(option);
  
  // 响应式
  window.addEventListener('resize', () => {
    barChart?.resize();
  });
}

// 销毁图表
function destroyCharts() {
  radarChart?.dispose();
  trendChart?.dispose();
  barChart?.dispose();
  percentageChart?.dispose();  // 新增
  radarChart = null;
  trendChart = null;
  barChart = null;
  percentageChart = null;  // 新增
}

onMounted(() => {
  loadUserProfile();
  loadExamList();
  loadAnalysisHistory();  // 加载分析历史记录
});

// 初始化得分率图表（新增）
function initPercentageChart() {
  if (!percentageChartRef.value) return;
  
  if (percentageChart) {
    percentageChart.dispose();
  }
  
  percentageChart = echarts.init(percentageChartRef.value);
  updatePercentageChart();
  
  // 响应式
  window.addEventListener('resize', () => {
    percentageChart?.resize();
  });
}

// 更新得分率图表
function updatePercentageChart() {
  if (!percentageChart) return;
  
  let subjectData = {};
  let chartTitle = '';
  
  // 如果选择了"全部考试"，计算平均得分率
  if (selectedPercentageExamId.value === 'all') {
    chartTitle = '各科目平均得分率';
    
    examList.value.forEach(exam => {
      exam.scores.forEach(score => {
        if (!subjectData[score.subject]) {
          subjectData[score.subject] = {
            totalScore: 0,
            totalFullScore: 0,
            count: 0
          };
        }
        const fullScore = score.fullScore || 150;
        subjectData[score.subject].totalScore += score.score;
        subjectData[score.subject].totalFullScore += fullScore;
        subjectData[score.subject].count++;
      });
    });
  } else {
    // 如果选择了单次考试，显示该次考试的得分率
    const exam = examList.value.find(e => e.id === selectedPercentageExamId.value);
    if (!exam) return;
    
    chartTitle = `${exam.examName} - 科目得分率`;
    
    exam.scores.forEach(score => {
      const fullScore = score.fullScore || 150;
      subjectData[score.subject] = {
        totalScore: score.score,
        totalFullScore: fullScore,
        count: 1
      };
    });
  }
  
  const subjects = Object.keys(subjectData);
  const percentages = subjects.map(subject => {
    const data = subjectData[subject];
    const avgScore = data.totalScore / data.count;
    const avgFullScore = data.totalFullScore / data.count;
    const percentage = (avgScore / avgFullScore) * 100;
    return percentage.toFixed(1);
  });
  
  const option = {
    title: {
      text: chartTitle,
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 600,
        color: '#333'
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: (params) => {
        const data = params[0];
        const subject = data.name;
        const subjectInfo = subjectData[subject];
        const avgScore = (subjectInfo.totalScore / subjectInfo.count).toFixed(1);
        const avgFullScore = (subjectInfo.totalFullScore / subjectInfo.count).toFixed(0);
        
        if (selectedPercentageExamId.value === 'all') {
          return `${subject}<br/>平均分：${avgScore}/${avgFullScore}<br/>平均得分率：${data.value}%<br/>考试次数：${subjectInfo.count}次`;
        } else {
          return `${subject}<br/>分数：${avgScore}/${avgFullScore}<br/>得分率：${data.value}%`;
        }
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: 80,
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: subjects,
      axisLabel: {
        fontSize: 12
      }
    },
    yAxis: {
      type: 'value',
      name: '得分率(%)',
      max: 100,
      axisLabel: {
        formatter: '{value}%'
      }
    },
    series: [{
      type: 'bar',
      data: percentages.map((p, index) => ({
        value: p,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { 
              offset: 0, 
              color: parseFloat(p) >= 80 ? '#67c23a' : parseFloat(p) >= 60 ? '#e6a23c' : '#f56c6c'
            },
            { 
              offset: 1, 
              color: parseFloat(p) >= 80 ? '#85ce61' : parseFloat(p) >= 60 ? '#ebb563' : '#f78989'
            }
          ])
        }
      })),
      label: {
        show: true,
        position: 'top',
        formatter: '{c}%',
        color: '#333',
        fontSize: 12,
        fontWeight: 600
      },
      barWidth: '50%',
      // 添加参考线
      markLine: {
        data: [
          { yAxis: 80, name: '优秀线', lineStyle: { color: '#67c23a', type: 'dashed' } },
          { yAxis: 60, name: '及格线', lineStyle: { color: '#e6a23c', type: 'dashed' } }
        ],
        label: {
          formatter: '{b}'
        }
      }
    }]
  };
  
  percentageChart.setOption(option);
}

// 组件卸载时销毁图表
import { onBeforeUnmount } from 'vue';
onBeforeUnmount(() => {
  destroyCharts();
  window.removeEventListener('resize', () => {
    radarChart?.resize();
    trendChart?.resize();
    barChart?.resize();
    percentageChart?.resize();
  });
});
</script>

<style scoped>
.profile-container {
  min-height: calc(100vh - 60px);
  padding: 40px 60px;
  background: linear-gradient(120deg, #f0f7ff 0%, #f5fafe 100%);
  display: flex;
  gap: 40px;
}

.profile-card {
  width: 400px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.exam-card {
  flex: 1;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 600;
  color: #0969da;
}

.card-header .header-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-header .header-actions .el-button {
  height: 32px;
  padding: 0 15px;
  font-size: 14px;
  border-radius: 6px;
}

.header-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 12px;
}

.profile-content {
  padding: 24px;
  min-height: 400px;
  display: flex;
  flex-direction: column;
}

/* 顶部区域布局 */
.profile-top {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  margin-bottom: 12px;
}

/* 新的头像区域 - 左上角 */
.avatar-section-new {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}

/* 用户名居中显示 */
.username-center {
  text-align: center;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin-top: 6px;
  margin-bottom: 12px;
}

.username-display-new {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  text-align: center;
  max-width: 80px;
  word-break: break-word;
}

/* 中间信息区域 */
.info-middle {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 4px;
}

.info-item-inline {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 分隔线 */
.divider {
  height: 1px;
  background: #e4e7ed;
  margin: 12px 0;
}

/* 学习科目区域 */
.subjects-section {
  min-height: 90px;
  margin-bottom: 0;
}

/* 底部区域 */
.profile-bottom {
  flex: 1;
  min-height: 60px;
}

/* AI分析历史记录区域 */
.analysis-history-section {
  padding: 0;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #0969da;
  margin-bottom: 12px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 240px;
  overflow-y: auto;
  padding-right: 4px;
}

/* 隐藏滚动条但保持滚动功能 */
.history-list::-webkit-scrollbar {
  width: 0;
  height: 0;
}

.history-list {
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE 10+ */
}

.history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  background: #f5f7fa;
  border-radius: 6px;
  transition: all 0.2s;
  gap: 12px;
}

.history-item:hover {
  background: #e8f0fe;
}

.history-content {
  flex: 1;
  min-width: 0;
  cursor: pointer;
}

.history-name {
  font-size: 13px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-date {
  font-size: 11px;
  color: #909399;
}

.delete-icon {
  flex-shrink: 0;
  color: #909399;
  cursor: pointer;
  transition: color 0.2s;
}

.delete-icon:hover {
  color: #f56c6c;
}

/* 旧样式保留（用于其他地方） */
.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 30px;
  border-bottom: 1px solid #e4e7ed;
}

.username-display {
  margin-top: 16px;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.info-display {
  padding: 0 10px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 24px;
}

.info-label {
  font-size: 13px;
  color: #909399;
  font-weight: 500;
}

.info-value {
  font-size: 15px;
  color: #303133;
  font-weight: 500;
}

.subjects-display {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.button-group {
  display: flex;
  gap: 12px;
  margin-top: 12px;
}

.button-group .el-button {
  flex: 1;
}

.exam-content {
  padding: 20px;
}

.exam-list {
  max-height: calc(100vh - 240px);
  overflow-y: auto;
}

.exam-item {
  padding: 20px;
  margin-bottom: 16px;
  background: #f5f7fa;
  border-radius: 12px;
  border-left: 4px solid #0969da;
  transition: all 0.3s;
}

.exam-item:hover {
  background: #e8f4ff;
  box-shadow: 0 2px 8px rgba(9, 105, 218, 0.1);
}

.exam-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.exam-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  flex: 1;
}

.exam-date {
  font-size: 13px;
  color: #999;
  margin-right: 12px;
}

.exam-actions {
  display: flex;
  gap: 8px;
}

.exam-scores {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.score-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #ffffff;
  border-radius: 6px;
  font-size: 10.5px;
}

.subject-name {
  color: #666;
  font-size: 10.5px;
}

.score-value {
  font-weight: 600;
  color: #0969da;
  font-size: 10.5px;
}

.exam-total {
  padding-top: 12px;
  border-top: 1px dashed #e4e7ed;
  text-align: right;
  font-size: 11.25px;
  color: #666;
}

.total-score {
  font-size: 15px;
  font-weight: 700;
  color: #0969da;
  margin-left: 8px;
}

.score-inputs {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.score-input-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.subject-label {
  font-size: 14px;
  color: #666;
  min-width: 60px;
}

.total-score-display {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 12px 20px;
  background: linear-gradient(135deg, #e8f4ff 0%, #d3e3fd 100%);
  border-radius: 12px;
  border: 2px solid #0969da;
}

.total-label {
  font-size: 32px;
  font-weight: 700;
  color: #0969da;
}

.total-hint {
  font-size: 16px;
  color: #666;
}

/* 图表容器 */
.charts-container {
  padding: 0 60px 40px;
  background: linear-gradient(120deg, #f0f7ff 0%, #f5fafe 100%);
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 30px;
}

.chart-card {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  min-height: 450px;
}

.chart-wrapper {
  width: 100%;
  height: 380px;
  padding: 10px;
}

/* AI 成绩分析对话框 */
.ai-analysis-dialog :deep(.el-dialog) {
  margin-top: 8vh !important;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.ai-analysis-dialog :deep(.el-dialog__header) {
  padding: 20px 24px 16px;
  border-bottom: 1px solid #e4e7ed;
}

.ai-analysis-dialog :deep(.el-dialog__body) {
  padding: 0;
  flex: 1;
  overflow: hidden;
  max-height: calc(80vh - 140px);
}

.ai-analysis-dialog :deep(.el-dialog__footer) {
  padding: 16px 24px;
  border-top: 1px solid #e4e7ed;
}

/* AI 成绩分析对话框内容 */
.ai-analysis-content {
  height: 100%;
  max-height: calc(80vh - 140px);
  overflow-y: auto;
  padding: 20px 24px;
  position: relative;
}

.ai-analysis-content::-webkit-scrollbar {
  width: 8px;
}

.ai-analysis-content::-webkit-scrollbar-track {
  background: #f5f7fa;
  border-radius: 4px;
}

.ai-analysis-content::-webkit-scrollbar-thumb {
  background: #c0c4cc;
  border-radius: 4px;
}

.ai-analysis-content::-webkit-scrollbar-thumb:hover {
  background: #909399;
}

.streaming-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #f0f7ff;
  border-radius: 8px;
  color: #0969da;
  font-size: 14px;
  margin-top: 16px;
}

.streaming-indicator .el-icon {
  font-size: 18px;
}

.markdown-content {
  line-height: 1.8;
  color: #333;
}

.markdown-content :deep(h2) {
  font-size: 18px;
  font-weight: 600;
  color: #0969da;
  margin: 24px 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 2px solid #e4e7ed;
}

.markdown-content :deep(h3) {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 20px 0 12px 0;
}

.markdown-content :deep(p) {
  margin: 12px 0;
  font-size: 14px;
  line-height: 1.8;
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  margin: 12px 0;
  padding-left: 24px;
}

.markdown-content :deep(li) {
  margin: 8px 0;
  font-size: 14px;
  line-height: 1.6;
}

.markdown-content :deep(strong) {
  font-weight: 600;
  color: #0969da;
}

.markdown-content :deep(code) {
  background: #f5f7fa;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 13px;
}

.markdown-content :deep(blockquote) {
  border-left: 4px solid #0969da;
  padding-left: 16px;
  margin: 16px 0;
  color: #666;
  background: #f5f7fa;
  padding: 12px 16px;
  border-radius: 4px;
}

/* 响应式 */
@media (max-width: 1200px) {
  .profile-container {
    flex-direction: column;
    padding: 30px 20px;
  }
  
  .profile-card {
    width: 100%;
  }
  
  .exam-scores {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .charts-container {
    padding: 0 20px 30px;
    grid-template-columns: 1fr;
  }
}

/* 用户管理样式 */
.user-management-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.management-option {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.management-option:hover {
  border-color: #0969da;
  background: #f5f7fa;
  transform: translateX(4px);
}

.option-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  border-radius: 50%;
}

.option-info {
  flex: 1;
}

.option-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.option-desc {
  font-size: 13px;
  color: #909399;
  line-height: 1.5;
}

.option-arrow {
  color: #c0c4cc;
  transition: all 0.3s;
}

.management-option:hover .option-arrow {
  color: #0969da;
  transform: translateX(4px);
}

@media (max-width: 768px) {
  .profile-container {
    padding: 20px 15px;
  }
  
  .exam-scores {
    grid-template-columns: 1fr;
  }
  
  .score-inputs {
    grid-template-columns: 1fr;
  }
  
  .charts-container {
    padding: 0 15px 20px;
  }
  
  .chart-wrapper {
    height: 320px;
  }
  
  .suggestion-content {
    max-height: 400px;
  }
}

/* 注销账号对话框样式 */
.delete-account-dialog :deep(.el-dialog) {
  border: 3px solid #f56c6c;
  box-shadow: 0 4px 20px rgba(245, 108, 108, 0.3);
}

.delete-account-dialog :deep(.el-dialog__header) {
  background: #fef0f0;
  border-bottom: 2px solid #f56c6c;
}

.delete-account-dialog :deep(.el-dialog__title) {
  color: #f56c6c;
  font-weight: 600;
}

.delete-warning-alert {
  margin-bottom: 20px;
  border: 2px solid #f56c6c;
}

.delete-warning-alert :deep(.el-alert__title) {
  font-size: 16px;
  font-weight: 600;
}

.delete-agreement-checkbox {
  width: 100%;
}

.delete-agreement-checkbox :deep(.el-checkbox__label) {
  white-space: normal;
  line-height: 1.8;
}

.agreement-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 14px;
  color: #606266;
  letter-spacing: 0.5px;
  line-height: 1.6;
}

.agreement-text div {
  margin: 0;
}
</style>

