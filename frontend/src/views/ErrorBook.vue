<template>
  <div class="error-book-container">
    <SideNavBar />
    
    <!-- 左侧边栏：筛选区 -->
    <div class="error-sidebar" :class="{ collapsed: sidebarCollapsed }">
      <!-- 科目筛选标题和操作按钮 -->
      <div class="sidebar-header">
        <div class="section-title">
          <el-icon size="16"><Reading /></el-icon>
          <span>科目筛选</span>
        </div>
        <div class="header-actions">
          <el-tooltip content="添加错题" placement="bottom">
            <el-button :icon="Plus" circle size="small" @click="handleAddError" />
          </el-tooltip>
          
          <el-tooltip content="管理错题" placement="bottom">
            <el-button :icon="Setting" circle size="small" @click="showManageErrorDialog = true" />
          </el-tooltip>
        </div>
      </div>

      <!-- 筛选列表区域 -->
      <div class="filter-list-section">
        <!-- 状态筛选项（卡片样式） -->
        <div 
          class="subject-item"
          @click="toggleErrorStatus('unmastered')"
          :class="{ active: filterForm.masteryStatus === 'unmastered' }"
        >
          <div class="subject-label">
            <span class="subject-dot" style="background: #f56c6c;"></span>
            未掌握
          </div>
          <div class="subject-count">{{ globalStats.unmasteredCount }}</div>
        </div>

        <div 
          class="subject-item"
          @click="toggleErrorStatus('mastered')"
          :class="{ active: filterForm.masteryStatus === 'mastered' }"
        >
          <div class="subject-label">
            <span class="subject-dot" style="background: #67c23a;"></span>
            已掌握
          </div>
          <div class="subject-count">{{ globalStats.masteredCount }}</div>
        </div>

        <!-- 科目列表 -->
        <div class="subject-list">
          <div 
            v-for="(subject, index) in userSubjects" 
            :key="subject"
            class="subject-item"
            @click="filterBySubject(getSubjectCode(subject))"
            :class="{ active: filterForm.subject === getSubjectCode(subject) }"
          >
            <div class="subject-label">
              <span class="subject-dot" :style="{ background: getSubjectColor(index) }"></span>
              {{ subject }}
            </div>
            <div class="subject-count">{{ getSubjectStatCount(subject) }}</div>
          </div>
          <el-empty 
            v-if="!hasUserSubjects(userSubjects)" 
            description="请先在个人中心设置学习科目" 
            :image-size="60"
          />
        </div>
      </div>
    </div>

    <!-- 右侧：错题列表 -->
    <div class="error-content" :class="{ expanded: sidebarCollapsed }">
      <div class="errors-container">
        <!-- 顶部标题栏 -->
        <div class="editor-header">
          <el-button 
            :icon="sidebarCollapsed ? DArrowRight : DArrowLeft" 
            circle 
            size="small"
            @click="toggleSidebar"
          />
          <span class="file-name">我的错题</span>
          <div class="header-spacer"></div>
          <el-button 
            v-if="showKnowledgeGraph"
            :icon="DataAnalysis" 
            circle 
            size="small"
            @click="showKnowledgeGraph = false"
            title="切换到列表视图"
          />
        </div>
        
        <!-- 复习日历 -->
        <ReviewCalendar
          :userId="userId"
          @day-click="handleDayClick"
          @data-loaded="handleCalendarDataLoaded"
        />
        
        <!-- AI复习建议面板 -->
        <AIReviewPanel
          :userId="userId"
          :todayErrors="todayErrors"
          @start-review="handleStartReview"
          @view-knowledge-graph="showKnowledgeGraph = true"
          @generate-plan="handleGeneratePlan"
        />
        
        <!-- 知识图谱视图 -->
        <KnowledgeGraph
          v-if="showKnowledgeGraph"
          :userId="userId"
          :errors="errorList"
          @switch-to-list="showKnowledgeGraph = false"
          @view-errors="handleViewErrors"
          @ai-explain="handleAIExplain"
          @practice="handlePractice"
        />
        
        <!-- 错题列表（增强版卡片） -->
        <div v-else class="error-list" v-loading="loading">
          <el-pagination
            v-if="errorList.length > pageSize"
            v-model:current-page="currentPage"
            :page-size="pageSize"
            :total="totalCount"
            layout="prev, pager, next"
            small
            @current-change="handleCurrentPageChange"
            style="margin-bottom: 20px; text-align: center;"
          />
          
          <div class="error-enhanced-list">
            <ErrorCardEnhanced
              v-for="error in paginatedErrors"
              :key="error.id"
              :error="error"
              @start-review="handleStartReview"
              @view-analysis="handleViewAnalysis"
              @delay="handleDelay"
              @mark-mastered="handleMarkMastered"
            />
          </div>
          
          <el-empty v-if="errorList.length === 0 && !loading" description="暂无错题记录" />
        </div>
      </div>
    </div>

    <!-- ================= 5. 编辑弹框（与上一版完全一致） ================= -->
    <el-dialog
      v-model="showEditDialog"
      title="编辑错题"
      width="700px"
      center
      :close-on-click-modal="true"
      class="blue-border-dialog"
    >
      <el-form
        :model="editForm"
        class="edit-form"
        label-width="100px"
        :rules="editFormRules"
        ref="editFormRef"
      >
        <el-form-item label="错题标题" prop="questionTitle">
          <el-input
            v-model="editForm.questionTitle"
            placeholder="请输入错题标题（简要描述题干）"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="所属科目" prop="subject">
          <el-select v-model="editForm.subject" placeholder="请选择所属科目">
            <el-option 
              v-for="option in subjectOptions" 
              :key="option.value"
              :label="option.label" 
              :value="option.value" 
            />
          </el-select>
          <div v-if="!hasUserSubjects(userSubjects)" style="margin-top: 8px; font-size: 12px; color: #f56c6c;">
            请先在个人中心设置学习科目
          </div>
        </el-form-item>
        <el-form-item label="题型" prop="questionType">
          <el-select v-model="editForm.questionType" placeholder="请选择题型">
            <el-option label="选择题" value="single_choice" />
            <el-option label="多选题" value="multiple_choice" />
            <el-option label="填空题" value="blank" />
            <el-option label="简答题" value="short_answer" />
            <el-option label="计算题" value="calculation" />
          </el-select>
        </el-form-item>
        <el-form-item label="错误原因" prop="wrongReason">
          <el-input
            v-model="editForm.wrongReason"
            type="textarea"
            rows="4"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="正确解析" prop="correctAnalysis">
          <el-input
            v-model="editForm.correctAnalysis"
            type="textarea"
            rows="6"
            maxlength="1000"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSaveEdit">确认保存</el-button>
      </template>
    </el-dialog>

    <!-- ================= 6. 筛选弹框（居中） ================= -->
    <el-dialog
      v-model="showFilterDialog"
      title="筛选错题"
      width="600px"
      center
      :close-on-click-modal="true"
      class="blue-border-dialog"
    >
      <el-form :model="filterForm" label-width="90px">
        <el-form-item label="所属科目">
          <el-select
            v-model="filterForm.subject"
            clearable
            placeholder="请选择科目"
          >
            <el-option label="全部科目" value="" />
            <el-option 
              v-for="option in subjectOptions" 
              :key="option.value"
              :label="option.label" 
              :value="option.value" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="题型">
          <el-select
            v-model="filterForm.questionType"
            clearable
            placeholder="请选择题型"
          >
            <el-option label="全部题型" value="" />
            <el-option label="选择题" value="single_choice" />
            <el-option label="多选题" value="multiple_choice" />
            <el-option label="填空题" value="blank" />
            <el-option label="简答题" value="short_answer" />
            <el-option label="计算题" value="calculation" />
          </el-select>
        </el-form-item>
        <el-form-item label="掌握状态">
          <el-select
            v-model="filterForm.masteryStatus"
            clearable
            placeholder="请选择状态"
          >
            <el-option label="全部状态" value="" />
            <el-option label="未掌握" value="unmastered" />
            <el-option label="正在掌握" value="mastering" />
            <el-option label="已掌握" value="mastered" />
          </el-select>
        </el-form-item>
        <el-form-item label="添加时间">
          <el-date-picker
            v-model="filterForm.addTimeRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            clearable
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="resetFilter">重置</el-button>
        <el-button type="primary" @click="handleFilter">筛选</el-button>
      </template>
    </el-dialog>

    <!-- ================= 7. 错题详情对话框 ================= -->
    <el-dialog
      v-model="showErrorDetailDialog"
      title="错题详情"
      width="900px"
      center
      :close-on-click-modal="true"
      class="blue-border-dialog"
    >
      <div v-if="currentErrorDetail" class="error-detail-content">
        <!-- 第一行：错题标题 -->
        <div class="detail-row-single">
          <span class="detail-label">错题标题：</span>
          <span class="detail-value">{{ currentErrorDetail.questionTitle }}</span>
        </div>
        
        <!-- 第二行：所属科目、题型、掌握状态 -->
        <div class="detail-row-multi">
          <div class="detail-item-inline">
            <span class="detail-label">所属科目：</span>
            <span class="detail-value">{{ getSubjectText(currentErrorDetail.subject) }}</span>
          </div>
          <div class="detail-item-inline">
            <span class="detail-label">题型：</span>
            <span class="detail-value">{{ getTypeText(currentErrorDetail.questionType) }}</span>
          </div>
          <div class="detail-item-inline">
            <span class="detail-label">掌握状态：</span>
            <span class="detail-value">{{ getStatusText(currentErrorDetail.masteryStatus) }}</span>
          </div>
        </div>
        
        <!-- 错误原因 -->
        <div class="detail-section">
          <div class="detail-label">错误原因：</div>
          <div class="detail-content-box">{{ currentErrorDetail.wrongReason }}</div>
        </div>
        
        <!-- 正确解析 -->
        <div class="detail-section">
          <div class="detail-label">正确解析：</div>
          <div class="detail-content-box">{{ currentErrorDetail.correctAnalysis }}</div>
        </div>
      </div>
    </el-dialog>

    <!-- ================= 8. 新增错题弹框 ================= -->
    <el-dialog
      v-model="showAddDialog"
      title="添加错题"
      width="700px"
      center
      :close-on-click-modal="true"
      class="blue-border-dialog"
    >
      <el-form
        :model="addForm"
        class="edit-form"
        label-width="100px"
        :rules="editFormRules"
        ref="addFormRef"
      >
        <el-form-item prop="questionTitle">
          <template #label>
            <div class="form-label-tag">错题标题</div>
          </template>
          <el-input
            v-model="addForm.questionTitle"
            placeholder="请输入错题标题（简要描述题干）"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>
        <el-form-item prop="subject">
          <template #label>
            <div class="form-label-tag">所属科目</div>
          </template>
          <el-select v-model="addForm.subject" placeholder="请选择所属科目">
            <el-option 
              v-for="option in subjectOptions" 
              :key="option.value"
              :label="option.label" 
              :value="option.value" 
            />
          </el-select>
          <div v-if="!hasUserSubjects(userSubjects)" style="margin-top: 8px; font-size: 12px; color: #f56c6c;">
            请先在个人中心设置学习科目
          </div>
        </el-form-item>
        <el-form-item prop="questionType">
          <template #label>
            <div class="form-label-tag">题型</div>
          </template>
          <el-select v-model="addForm.questionType" placeholder="请选择题型">
            <el-option label="选择题" value="single_choice" />
            <el-option label="多选题" value="multiple_choice" />
            <el-option label="填空题" value="blank" />
            <el-option label="简答题" value="short_answer" />
            <el-option label="计算题" value="calculation" />
          </el-select>
        </el-form-item>
        <el-form-item prop="wrongReason">
          <template #label>
            <div class="form-label-tag">错误原因</div>
          </template>
          <el-input
            v-model="addForm.wrongReason"
            type="textarea"
            rows="4"
            placeholder="请描述错误原因"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        <el-form-item prop="correctAnalysis">
          <template #label>
            <div class="form-label-tag">正确解析</div>
          </template>
          <el-input
            v-model="addForm.correctAnalysis"
            type="textarea"
            rows="6"
            placeholder="请输入正确解析"
            maxlength="1000"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSaveAdd">确认添加</el-button>
      </template>
    </el-dialog>

    <!-- ================= 9. 管理错题对话框 ================= -->
    <el-dialog
      v-model="showManageErrorDialog"
      title="管理错题"
      width="900px"
      center
      :close-on-click-modal="true"
      class="blue-border-dialog"
    >
      <div class="manage-dialog-content">
        <div class="manage-toolbar-dialog">
          <el-checkbox 
            v-model="selectAllErrors"
            @change="handleSelectAllErrors"
            :indeterminate="isErrorIndeterminate"
          >
            全选
          </el-checkbox>
          <el-button 
            v-if="selectedErrors.length > 0"
            type="danger" 
            size="small"
            :icon="Delete" 
            @click="batchDeleteErrors"
            :disabled="selectedErrors.length === 0"
          >
            删除选中 ({{ selectedErrors.length }})
          </el-button>
        </div>
        
        <div class="errors-list-manage">
          <div 
            v-for="error in errorList" 
            :key="error.id"
            class="error-manage-item"
          >
            <el-checkbox 
              :model-value="selectedErrors.includes(error.id)"
              @change="(val) => handleErrorCheckChange(val, error.id)"
            />
            <div class="error-manage-content" @click="handleErrorDetail(error)">
              <div class="error-manage-title">{{ error.questionTitle }}</div>
              <div class="error-manage-meta">
                <el-tag size="small" type="primary">
                  {{ getSubjectText(error.subject) }}
                </el-tag>
                <el-tag size="small" type="info">
                  {{ getTypeText(error.questionType) }}
                </el-tag>
                <el-tag 
                  size="small" 
                  :type="error.masteryStatus === 'mastered' ? 'success' : (error.masteryStatus === 'mastering' ? 'warning' : 'danger')"
                >
                  {{ getStatusText(error.masteryStatus) }}
                </el-tag>
              </div>
            </div>
            <div class="error-manage-actions">
              <el-button 
                v-if="error.masteryStatus !== 'mastered'"
                type="success" 
                size="small"
                @click="toggleErrorMastery(error)"
              >
                标记掌握
              </el-button>
              <el-button 
                type="primary" 
                size="small"
                @click="handleEditError(error)"
              >
                编辑
              </el-button>
            </div>
          </div>
        </div>
        
        <el-empty 
          v-if="errorList.length === 0" 
          description="暂无错题" 
          :image-size="100"
        />
      </div>
      
      <template #footer>
        <el-button @click="showManageErrorDialog = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
/* ============== 依赖引入（与上一版完全一致） ============== */
import { ref, reactive, onMounted, computed, watch } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus, Refresh, Filter, Notebook, Warning, Clock, Check, DataAnalysis, Edit, Setting, Delete, Reading, DArrowLeft, DArrowRight } from "@element-plus/icons-vue";
import SideNavBar from '@/components/SideNavBar.vue';
// 【新增】引入 axios，对接后端接口
import axios from "axios";
// 【新增】引入用户科目工具
import { getUserSubjects, generateSubjectOptions, hasUserSubjects, getSubjectCode } from "@/utils/userSubjects";
// 【v3.4.0新增】引入新组件
import ReviewCalendar from '@/components/error/ReviewCalendar.vue';
import AIReviewPanel from '@/components/error/AIReviewPanel.vue';
import KnowledgeGraph from '@/components/error/KnowledgeGraph.vue';
import ErrorCardEnhanced from '@/components/error/ErrorCardEnhanced.vue';
import dayjs from 'dayjs';

/* ============== 基础变量（与上一版完全一致） ============== */
const router = useRouter();
const loading = ref(false);
const showEditDialog = ref(false);
const showFilterDialog = ref(false);
const editFormRef = ref(null);
const sidebarCollapsed = ref(false);

// 【v3.4.0新增】知识图谱视图切换
const showKnowledgeGraph = ref(false);
const userId = ref(localStorage.getItem("edu-user-id") || "default-user");

// 查看错题详情
const showErrorDetailDialog = ref(false);
const currentErrorDetail = ref(null);

// 管理错题对话框
const showManageErrorDialog = ref(false);
const selectedErrors = ref([]);
const selectAllErrors = ref(false);
const isErrorIndeterminate = ref(false);

/* 分页 */
const currentPage = ref(1);
const pageSize = ref(8); // 每页显示8条错题（4列2行）
const totalCount = ref(0);

/* 表单 */
const filterForm = reactive({
  subject: "",
  questionType: "",
  masteryStatus: "",
  addTimeRange: [],
});
const editForm = reactive({
  id: "",
  questionTitle: "",
  subject: "",
  questionType: "",
  masteryStatus: "unmastered",
  wrongReason: "",
  correctAnalysis: "",
});
const editFormRules = {
  questionTitle: [
    { required: true, message: "请输入错题标题", trigger: "blur" },
  ],
  subject: [{ required: true, message: "请选择所属科目", trigger: "change" }],
  questionType: [{ required: true, message: "请选择题型", trigger: "change" }],
  wrongReason: [{ required: true, message: "请描述错误原因", trigger: "blur" }],
  correctAnalysis: [
    { required: true, message: "请输入正确解析", trigger: "blur" },
  ],
};

/* 表格数据 */
const errorList = ref([]);

// 【新增】用户科目相关
const userSubjects = ref([]);
const subjectOptions = computed(() => generateSubjectOptions(userSubjects.value));

// 【v3.4.0新增】今日需复习的错题
const todayErrors = computed(() => {
  // 筛选需要今日复习的错题
  return errorList.value.filter(error => {
    // 如果是未掌握状态，都需要复习
    if (error.masteryStatus === 'unmastered') {
      return true;
    }
    
    // 如果有最后复习时间，根据艾宾浩斯曲线判断
    if (error.lastReviewTime) {
      const daysSinceLastReview = dayjs().diff(dayjs(error.lastReviewTime), 'day');
      const reviewCount = error.reviewCount || 0;
      
      // 艾宾浩斯遗忘曲线：1天、2天、4天、7天、15天
      const intervals = [1, 2, 4, 7, 15];
      const nextReviewDay = intervals[Math.min(reviewCount, intervals.length - 1)];
      
      return daysSinceLastReview >= nextReviewDay;
    }
    
    // 新添加的错题（没有复习记录）
    if (!error.lastReviewTime && error.addTime) {
      const daysSinceAdd = dayjs().diff(dayjs(error.addTime), 'day');
      return daysSinceAdd >= 1; // 添加后第二天开始复习
    }
    
    return false;
  });
});

// 彩色背景色数组
const cardColors = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
  'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
];

// 【新增】全局统计数据（不受筛选影响）
const globalStats = ref({
  totalCount: 0,
  unmasteredCount: 0,
  masteringCount: 0,
  masteredCount: 0,
  subjectStats: {} // 新增科目统计
});

// 统计数据（保持原有计算逻辑，用于科目统计等其他功能）
const unmasteredCount = computed(() => {
  return errorList.value.filter(e => e.masteryStatus === 'unmastered').length;
});

const masteringCount = computed(() => {
  return errorList.value.filter(e => e.masteryStatus === 'mastering').length;
});

const masteredCount = computed(() => {
  return errorList.value.filter(e => e.masteryStatus === 'mastered').length;
});

// 【删除原有的科目统计计算，现在使用全局统计】
// 原来的 subjectStats computed 已被 globalStats.subjectStats 替代

// 【新增】从错题列表计算科目统计（降级方案使用）
function getSubjectStatsFromList(errorList) {
  const stats = {};
  errorList.forEach(error => {
    if (error.subject) {
      stats[error.subject] = (stats[error.subject] || 0) + 1;
    }
  });
  return stats;
}

// 【修改】根据科目名称获取全局统计数量
function getSubjectStatCount(subjectName) {
  const subjectCode = getSubjectCode(subjectName);
  return globalStats.value.subjectStats[subjectCode] || 0;
}

// 【新增】获取科目颜色（循环使用预定义颜色）
function getSubjectColor(index) {
  const colors = [
    '#0969da',
    '#35b778',
    '#ffc107',
    '#e74c3c',
    '#9b59b6',
    '#3498db',
    '#e67e22',
    '#1abc9c',
    '#34495e'
  ];
  return colors[index % colors.length];
}

// 分页后的错题列表
const paginatedErrors = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return errorList.value.slice(start, end);
});

// 切换侧边栏
function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value;
}

// 【v3.4.0新增】日历日期点击
function handleDayClick(day) {
  console.log('点击日期:', day);
  // 可以筛选该日期的错题
  ElMessage.info(`查看 ${day.date} 的错题`);
}

// 【v3.4.0新增】日历数据加载完成
function handleCalendarDataLoaded(data) {
  console.log('日历数据加载完成:', data);
}

// 【v3.4.0新增】开始复习
function handleStartReview(error) {
  if (!error) {
    // 如果没有传入具体错题，开始复习今日所有错题
    if (todayErrors.value.length === 0) {
      ElMessage.warning('今日没有需要复习的错题');
      return;
    }
    ElMessage.success(`开始复习今日 ${todayErrors.value.length} 道错题`);
    // 这里可以跳转到复习页面或打开复习对话框
  } else {
    ElMessage.success(`开始复习：${error.questionTitle}`);
    // 显示错题详情
    handleErrorDetail(error);
  }
}

// 【v3.4.0新增】查看解析
function handleViewAnalysis(error) {
  handleErrorDetail(error);
}

// 【v3.4.0新增】延后复习
async function handleDelay(error) {
  try {
    ElMessage.info(`已将"${error.questionTitle}"延后到明天复习`);
    // 这里可以调用API更新复习时间
  } catch (error) {
    console.error('延后复习失败:', error);
  }
}

// 【v3.4.0新增】标记已掌握
async function handleMarkMastered(error) {
  try {
    await toggleErrorMastery(error);
  } catch (error) {
    console.error('标记掌握失败:', error);
  }
}

// 【v3.4.0新增】生成复习计划
function handleGeneratePlan() {
  ElMessage.success('AI正在为您生成个性化复习计划...');
  // 这里可以调用AI接口生成复习计划
}

// 【v3.4.0新增】查看知识点错题
function handleViewErrors(point) {
  console.log('查看知识点错题:', point);
  ElMessage.info(`查看"${point.name}"相关的 ${point.errorCount} 道错题`);
  // 可以筛选该知识点的错题
}

// 【v3.4.0新增】AI讲解
function handleAIExplain(point) {
  console.log('AI讲解:', point);
  ElMessage.success(`AI正在为您讲解"${point.name}"...`);
  // 这里可以调用AI接口生成讲解
}

// 【v3.4.0新增】专项练习
function handlePractice(point) {
  console.log('专项练习:', point);
  ElMessage.info(`为您准备"${point.name}"的专项练习题`);
  // 这里可以跳转到练习页面
}

// 获取卡片颜色
function getCardColor(index) {
  return cardColors[index % cardColors.length];
}

// 获取状态文本
function getStatusText(status) {
  const map = {
    unmastered: '未掌握',
    mastering: '正在掌握',
    mastered: '已掌握'
  };
  return map[status] || '未知';
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

// 获取题型文本
function getTypeText(type) {
  const map = {
    single_choice: '选择题',
    multiple_choice: '多选题',
    blank: '填空题',
    short_answer: '简答题',
    calculation: '计算题'
  };
  return map[type] || type;
}

/* 新增错题弹框 */
const showAddDialog = ref(false);
const addForm = reactive({
  questionTitle: "",
  subject: "",
  questionType: "single_choice",
  wrongReason: "",
  correctAnalysis: "",
});
const addFormRef = ref(null);

/* ============== 生命周期 ============== */
onMounted(async () => {
  // 先加载用户科目
  userSubjects.value = await getUserSubjects();
  // 加载全局统计数据
  await loadGlobalStats();
  // 再加载错题列表
  loadErrorList();
});

/* ============== 核心业务（已对接真实后端接口） ============== */
// 【新增】加载全局统计数据
async function loadGlobalStats() {
  try {
    const userId = localStorage.getItem("edu-user-id") || "default-user";
    const res = await axios.get(
      `http://localhost:3001/api/error-book/stats/${userId}`,
      { timeout: 10000 }
    );
    
    // 修复：axios响应数据在 res.data.data 中
    const statsData = res.data?.data || res.data;
    if (statsData) {
      globalStats.value = {
        totalCount: statsData.totalCount || 0,
        unmasteredCount: statsData.unmasteredCount || 0,
        masteringCount: statsData.masteringCount || 0,
        masteredCount: statsData.masteredCount || 0,
        subjectStats: statsData.subjectStats || {}
      };
    }
  } catch (error) {
    console.error("获取全局统计失败：", error);
    // 如果接口不存在，使用本地计算作为降级方案
    await loadErrorListForStats();
  }
}

// 【新增】用于统计的错题列表加载（不分页，获取全部数据）
async function loadErrorListForStats() {
  try {
    const userId = localStorage.getItem("edu-user-id") || "default-user";
    const res = await axios.get(
      `http://localhost:3001/api/error-book/list/${userId}`,
      {
        params: {
          pageNum: 1,
          pageSize: 9999, // 获取全部数据用于统计
          subject: "",
          questionType: "",
          masteryStatus: "",
          startDate: "",
          endDate: "",
        },
        timeout: 10000,
      }
    );
    
    // 修复：axios响应数据在 res.data.data 中
    const listData = res.data?.data || res.data;
    const allErrors = listData?.errorQuestions || [];
    globalStats.value = {
      totalCount: allErrors.length,
      unmasteredCount: allErrors.filter(e => e.masteryStatus === 'unmastered').length,
      masteringCount: allErrors.filter(e => e.masteryStatus === 'mastering').length,
      masteredCount: allErrors.filter(e => e.masteryStatus === 'mastered').length,
      subjectStats: getSubjectStatsFromList(allErrors)
    };
  } catch (error) {
    console.error("获取统计数据失败：", error);
    globalStats.value = {
      totalCount: 0,
      unmasteredCount: 0,
      masteringCount: 0,
      masteredCount: 0,
      subjectStats: {}
    };
  }
}
async function loadErrorList() {
  loading.value = true;
  try {
    // 【真实接口】GET /api/error-book/list
    const userId = localStorage.getItem("edu-user-id") || "default-user";
    const res = await axios.get(
      `http://localhost:3001/api/error-book/list/${userId}`,
      {
        params: {
          pageNum: currentPage.value,
          pageSize: pageSize.value,
          subject: filterForm.subject || "",
          questionType: filterForm.questionType || "",
          masteryStatus: filterForm.masteryStatus || "",
          startDate: filterForm.addTimeRange?.[0] || "",
          endDate: filterForm.addTimeRange?.[1] || "",
        },
        timeout: 10000,
      }
    );
    // 修复：axios响应数据在 res.data.data 中
    const listData = res.data?.data || res.data;
    errorList.value = listData?.errorQuestions || [];
    totalCount.value = listData?.count || 0;
  } catch (error) {
    console.error("获取错题列表失败：", error);
    ElMessage.error(
      error.response?.data?.message || "获取错题列表失败，请检查后端服务"
    );
    errorList.value = [];
    totalCount.value = 0;
  } finally {
    loading.value = false;
  }
}

// 切换错题状态筛选（参照学习社区）
function toggleErrorStatus(status) {
  if (filterForm.masteryStatus === status) {
    filterForm.masteryStatus = '';
  } else {
    filterForm.masteryStatus = status;
  }
  currentPage.value = 1;
  loadErrorList();
}

// 按科目筛选
function filterBySubject(subjectCode) {
  if (filterForm.subject === subjectCode) {
    // 如果点击的是当前科目，则取消筛选
    filterForm.subject = '';
  } else {
    filterForm.subject = subjectCode;
  }
  currentPage.value = 1;
  loadErrorList();
}



function handleFilter() {
  currentPage.value = 1;
  showFilterDialog.value = false;
  loadErrorList();
}
function resetFilter() {
  filterForm.subject = "";
  filterForm.questionType = "";
  filterForm.masteryStatus = "";
  filterForm.addTimeRange = [];
  currentPage.value = 1;
  showFilterDialog.value = false;
  loadErrorList();
}
function refreshErrorList() {
  loadErrorList();
  ElMessage.info("已刷新");
}
function handlePageSizeChange(size) {
  pageSize.value = size;
  loadErrorList();
}
function handleCurrentPageChange(page) {
  currentPage.value = page;
}
function handleErrorDetail(row) {
  // 点击卡片只显示内容详情
  currentErrorDetail.value = row;
  showErrorDetailDialog.value = true;
}
function handleAddError() {
  // 重置表单
  addForm.questionTitle = "";
  addForm.subject = "";
  addForm.questionType = "single_choice";
  addForm.wrongReason = "";
  addForm.correctAnalysis = "";
  showAddDialog.value = true;
}

/* 保存新增错题 */
async function handleSaveAdd() {
  try {
    await addFormRef.value.validate();
    
    // 验证科目是否已选择
    if (!addForm.subject) {
      ElMessage.warning("请选择所属科目");
      return;
    }
    
    loading.value = true;
    
    const userId = localStorage.getItem("edu-user-id") || "default-user";
    
    console.log("=== 错题提交数据 ===");
    console.log("科目值:", addForm.subject);
    console.log("完整数据:", {
      userId,
      questionTitle: addForm.questionTitle,
      subject: addForm.subject,
      questionType: addForm.questionType,
      wrongReason: addForm.wrongReason,
      correctAnalysis: addForm.correctAnalysis,
    });
    
    // 【真实接口】POST /api/error-book/add
    await axios.post(
      "http://localhost:3001/api/error-book/add",
      {
        userId,
        questionTitle: addForm.questionTitle,
        subject: addForm.subject,
        questionType: addForm.questionType,
        wrongReason: addForm.wrongReason,
        correctAnalysis: addForm.correctAnalysis,
      },
      { timeout: 10000 }
    );
    
    showAddDialog.value = false;
    ElMessage.success("添加错题成功");
    // 重新加载全局统计和错题列表
    await loadGlobalStats();
    loadErrorList();
  } catch (error) {
    console.error("添加错题失败：", error);
    ElMessage.error(
      error.response?.data?.message || "添加失败，请重试"
    );
  } finally {
    loading.value = false;
  }
}
function handleEditError(row) {
  Object.assign(editForm, row);
  showEditDialog.value = true;
}
async function handleSaveEdit() {
  try {
    await editFormRef.value.validate();
    loading.value = true;
    
    // 【真实接口】PUT /api/error-book/update/:id
    await axios.put(
      `http://localhost:3001/api/error-book/update/${editForm.id}`,
      {
        questionTitle: editForm.questionTitle,
        subject: editForm.subject,
        questionType: editForm.questionType,
        masteryStatus: editForm.masteryStatus,
        wrongReason: editForm.wrongReason,
        correctAnalysis: editForm.correctAnalysis,
      },
      { timeout: 10000 }
    );
    
    showEditDialog.value = false;
    ElMessage.success("保存成功");
    // 重新加载全局统计和错题列表
    await loadGlobalStats();
    loadErrorList();
  } catch (error) {
    console.error("保存错题失败：", error);
    ElMessage.error(
      error.response?.data?.message || "保存失败，请重试"
    );
  } finally {
    loading.value = false;
  }
}

function handleDeleteError(id) {
  ElMessageBox.confirm("确定删除？", "危险提示", { type: "error" })
    .then(async () => {
      try {
        loading.value = true;
        // 【真实接口】DELETE /api/error-book/delete/:id
        await axios.delete(
          `http://localhost:3001/api/error-book/delete/${id}`,
          { timeout: 10000 }
        );
        ElMessage.success("删除成功");
        // 重新加载全局统计和错题列表
        await loadGlobalStats();
        loadErrorList();
      } catch (error) {
        console.error("删除错题失败：", error);
        ElMessage.error(
          error.response?.data?.message || "删除失败，请重试"
        );
      } finally {
        loading.value = false;
      }
    })
    .catch(() => {
      // 用户取消操作，不做任何处理
    });
}

// 快速切换错题掌握状态
async function toggleErrorMastery(error) {
  try {
    const isMastered = error.masteryStatus === 'mastered';
    
    if (isMastered) {
      // 取消掌握，改为未掌握
      await axios.put(
        `http://localhost:3001/api/error-book/update/${error.id}`,
        {
          questionTitle: error.questionTitle,
          subject: error.subject,
          questionType: error.questionType,
          masteryStatus: 'unmastered',
          wrongReason: error.wrongReason,
          correctAnalysis: error.correctAnalysis,
        },
        { timeout: 10000 }
      );
      ElMessage.success("已标记为未掌握");
    } else {
      // 标记为已掌握
      await axios.put(
        `http://localhost:3001/api/error-book/mark-mastered/${error.id}`,
        {},
        { timeout: 10000 }
      );
      ElMessage.success("已标记为掌握");
    }
    
    // 刷新全局统计和列表
    await loadGlobalStats();
    loadErrorList();
  } catch (error) {
    console.error("切换掌握状态失败：", error);
    ElMessage.error(
      error.response?.data?.message || "操作失败，请重试"
    );
  }
}

// 处理错题选择变化
function handleErrorCheckChange(checked, errorId) {
  if (checked) {
    if (!selectedErrors.value.includes(errorId)) {
      selectedErrors.value.push(errorId);
    }
  } else {
    const index = selectedErrors.value.indexOf(errorId);
    if (index > -1) {
      selectedErrors.value.splice(index, 1);
    }
  }
}

// 全选/取消全选错题
function handleSelectAllErrors(val) {
  if (val) {
    selectedErrors.value = errorList.value.map(error => error.id);
  } else {
    selectedErrors.value = [];
  }
  isErrorIndeterminate.value = false;
}

// 监听选中项变化，更新全选状态
watch(selectedErrors, (newVal) => {
  const checkedCount = newVal.length;
  const totalCount = errorList.value.length;
  
  selectAllErrors.value = checkedCount === totalCount && totalCount > 0;
  isErrorIndeterminate.value = checkedCount > 0 && checkedCount < totalCount;
});

// 批量删除错题
async function batchDeleteErrors() {
  if (selectedErrors.value.length === 0) {
    ElMessage.warning('请选择要删除的错题');
    return;
  }
  
  try {
    await ElMessageBox.confirm(
      `确定删除选中的 ${selectedErrors.value.length} 道错题吗？删除后无法恢复。`,
      '批量删除确认',
      {
        type: 'warning',
        confirmButtonText: '确定删除',
        cancelButtonText: '取消'
      }
    );
    
    loading.value = true;
    
    // 批量删除
    for (const errorId of selectedErrors.value) {
      await axios.delete(`http://localhost:3001/api/error-book/delete/${errorId}`, {
        timeout: 10000,
      });
    }
    
    ElMessage.success(`成功删除 ${selectedErrors.value.length} 道错题`);
    selectedErrors.value = [];
    selectAllErrors.value = false;
    isErrorIndeterminate.value = false;
    showManageErrorDialog.value = false;
    // 重新加载全局统计和错题列表
    await loadGlobalStats();
    loadErrorList();
  } catch (error) {
    if (error !== 'cancel') {
      console.error("批量删除错题失败：", error);
      ElMessage.error("删除失败，请重试");
    }
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.error-book-container {
  display: block;
  height: 100vh;
  background: #f5f7fa;
  overflow: hidden;
  position: relative;
}

/* 左侧边栏 */
.error-sidebar {
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

.error-sidebar.collapsed {
  transform: translateX(-280px);
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid #e4e7ed;
  background: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.sidebar-header .section-title {
  margin-bottom: 0;
}

.sidebar-header .header-actions {
  display: flex;
  gap: 8px;
}

/* 筛选列表区域 */
.filter-list-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
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

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  font-weight: 600;
  color: #2c3e50;
}

.sidebar-header .section-title {
  margin-bottom: 0;
}



.subject-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.subject-item {
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

.subject-item:hover {
  background: #e8f4ff;
  transform: translateX(2px);
}

.subject-item.active {
  background: #e8f4ff;
  border-color: #0969da;
  transform: translateX(2px);
}

.subject-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #2c3e50;
  font-weight: 500;
}

.subject-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.subject-count {
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
  flex-shrink: 0;
}

/* 右侧：错题列表 */
.error-content {
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

.error-content.expanded {
  left: 60px;
}

.errors-container {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
  height: 100%;
}

/* 顶部标题栏（笔记样式） */
.editor-header {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e4e7ed;
  background: #fff;
  gap: 12px;
  flex-shrink: 0;
}

.file-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.header-spacer {
  flex: 1;
}

/* 错题列表 */
.error-list {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  padding: 20px;
  background: #fff;
}

/* 错题网格布局（2行4列，每个占1/8） */
.error-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 16px;
  height: 100%;
}

/* 【v3.4.0新增】增强版错题卡片列表布局 */
.error-enhanced-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 0;
}

/* 彩色卡片样式 */
.error-card {
  border-radius: 12px;
  transition: all 0.3s;
  position: relative;
  height: 100%;
  overflow: visible;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  cursor: pointer;
}

.error-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.card-content {
  padding: 16px;
  color: #fff;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.card-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.card-status-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-checkbox {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.8);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
  background: rgba(255, 255, 255, 0.2);
  flex-shrink: 0;
}

.card-checkbox:hover {
  background: rgba(255, 255, 255, 0.4);
  transform: scale(1.1);
}

.card-checkbox.mastered {
  background: #67c23a;
  border-color: #67c23a;
}

.card-status {
  display: inline-block;
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  width: fit-content;
  color: #000;
  text-shadow: none;
  flex-shrink: 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.card-subject {
  display: inline-block;
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  max-width: 100px;
  color: #000;
  text-shadow: none;
  flex-shrink: 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-title {
  font-size: 18px;
  font-weight: 700;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  letter-spacing: 0.3px;
  flex: 1;
  display: flex;
  align-items: center;
  color: #000;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  flex-shrink: 0;
  gap: 8px;
}

.card-type {
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.75);
  text-shadow: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.card-edit-btn {
  cursor: pointer;
  transition: all 0.3s;
  padding: 6px 14px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.95);
  color: #0969da;
  flex-shrink: 0;
  box-shadow: 0 1px 4px rgba(9, 105, 218, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.card-edit-btn .el-icon {
  font-size: 16px;
}

.card-edit-btn:hover {
  background: #0969da;
  color: #fff;
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(9, 105, 218, 0.4);
}



/* 错题详情样式 */
.error-detail-content {
  padding: 10px;
}

/* 单行显示样式 */
.detail-row-single {
  display: flex;
  align-items: center;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 12px;
}

/* 多列显示样式 */
.detail-row-multi {
  display: flex;
  gap: 20px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.detail-item-inline {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 200px;
}

.detail-section {
  margin-bottom: 20px;
}

.detail-label {
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
  white-space: nowrap;
}

.detail-row-single .detail-label {
  min-width: 100px;
}

.detail-value {
  font-size: 14px;
  color: #666;
  flex: 1;
}

.detail-content-box {
  font-size: 15px;
  color: #333;
  line-height: 2;
  white-space: pre-wrap;
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  min-height: 150px;
  max-height: 400px;
  overflow-y: auto;
}

.detail-content-box::-webkit-scrollbar {
  width: 6px;
}

.detail-content-box::-webkit-scrollbar-thumb {
  background: #dcdfe6;
  border-radius: 3px;
}

.detail-content-box::-webkit-scrollbar-thumb:hover {
  background: #c0c4cc;
}

.filter-hint {
  font-size: 13px;
  color: #0969da;
  font-weight: 500;
  margin-left: 8px;
}

/* 蓝色描边对话框 */
:deep(.blue-border-dialog .el-dialog) {
  border: 3px solid #0969da;
  box-shadow: 0 4px 20px rgba(9, 105, 218, 0.3);
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

/* 管理对话框样式 */
.manage-dialog-content {
  padding: 10px;
  max-height: 600px;
  overflow-y: auto;
}

.manage-toolbar-dialog {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 16px;
}

.errors-list-manage {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.error-manage-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #fff;
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  transition: all 0.3s;
}

.error-manage-item:hover {
  border-color: #0969da;
  box-shadow: 0 2px 8px rgba(9, 105, 218, 0.1);
}

.error-manage-content {
  flex: 1;
  cursor: pointer;
  min-width: 0;
}

.error-manage-title {
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

.error-manage-title:hover {
  color: #0969da;
}

.error-manage-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: #666;
  flex-wrap: wrap;
}

.error-manage-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

/* 响应式适配 */
@media (max-width: 1200px) {
  .error-sidebar {
    width: 240px;
  }
  
  .error-sidebar.collapsed {
    transform: translateX(-240px);
  }
  
  .error-content {
    left: 300px;
  }
  
  .error-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .error-sidebar {
    width: 200px;
  }
  
  .error-sidebar.collapsed {
    transform: translateX(-200px);
  }
  
  .error-content {
    left: 260px;
  }
  
  .error-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
