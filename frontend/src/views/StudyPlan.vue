
<template>
  <div class="study-plan-container">
    <SideNavBar />
    
    <!-- 左侧边栏：筛选区 -->
    <div class="plan-sidebar" :class="{ collapsed: sidebarCollapsed }">
      <!-- 科目筛选标题和操作按钮 -->
      <div class="sidebar-header">
        <div class="section-title">
          <el-icon size="16"><Calendar /></el-icon>
          <span>计划筛选</span>
        </div>
        <div class="header-actions">
          <el-tooltip content="新增计划" placement="bottom">
            <el-button :icon="Plus" circle size="small" @click="handleAddPlan" />
          </el-tooltip>
          
          <el-tooltip content="管理计划" placement="bottom">
            <el-button :icon="Setting" circle size="small" @click="showManagePlanDialog = true" />
          </el-tooltip>
        </div>
      </div>

      <!-- 筛选列表区域 -->
      <div class="filter-list-section">
        <!-- 状态筛选项（卡片样式） -->
        <div 
          class="subject-item"
          @click="filterByStatus('not_started')"
          :class="{ active: filterForm.planStatus === 'not_started' }"
        >
          <div class="subject-label">
            <span class="subject-dot" style="background: #909399;"></span>
            未开始
          </div>
          <div class="subject-count">{{ globalStats.statusStats.not_started || 0 }}</div>
        </div>

        <div 
          class="subject-item"
          @click="filterByStatus('in_progress')"
          :class="{ active: filterForm.planStatus === 'in_progress' }"
        >
          <div class="subject-label">
            <span class="subject-dot" style="background: #0969da;"></span>
            进行中
          </div>
          <div class="subject-count">{{ globalStats.statusStats.in_progress || 0 }}</div>
        </div>

        <div 
          class="subject-item"
          @click="filterByStatus('completed')"
          :class="{ active: filterForm.planStatus === 'completed' }"
        >
          <div class="subject-label">
            <span class="subject-dot" style="background: #35b778;"></span>
            已完成
          </div>
          <div class="subject-count">{{ globalStats.statusStats.completed || 0 }}</div>
        </div>

        <div 
          class="subject-item"
          @click="filterByStatus('overdue')"
          :class="{ active: filterForm.planStatus === 'overdue' }"
        >
          <div class="subject-label">
            <span class="subject-dot" style="background: #e74c3c;"></span>
            已逾期
          </div>
          <div class="subject-count">{{ globalStats.statusStats.overdue || 0 }}</div>
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
            <div class="subject-count">{{ getSubjectCount(subject) }}</div>
          </div>
          <el-empty 
            v-if="!hasUserSubjects(userSubjects)" 
            description="请先在个人中心设置学习科目" 
            :image-size="60"
          />
        </div>
      </div>
    </div>

    <!-- 右侧：计划列表 -->
    <div class="plan-content" :class="{ expanded: sidebarCollapsed }">
      <div class="plans-container">
        <!-- 顶部标题栏 -->
        <div class="editor-header">
          <el-button 
            :icon="sidebarCollapsed ? DArrowRight : DArrowLeft" 
            circle 
            size="small"
            @click="toggleSidebar"
          />
          <span class="file-name">我的计划</span>
          <div class="header-spacer"></div>
          <el-button type="primary" :icon="MagicStick" @click="showAiPlanDrawer = true">
            AI 智能制定
          </el-button>
        </div>
        
        <!-- 时间轴视图 -->
        <div class="plan-timeline-wrapper" v-loading="loading">
          <TimelineView
            :plans="planList"
            @view-details="handlePlanDetail"
          />
          <el-empty v-if="planList.length === 0 && !loading" description="暂无学习计划" />
        </div>
      </div>
    </div>

    <!-- ================= 5. 编辑弹框（与上一版完全一致） ================= -->
    <el-dialog
      v-model="showPlanDialog"
      :title="isEdit ? '编辑学习计划' : '新增学习计划'"
      width="700px"
      center
      :close-on-click-modal="true"
      class="blue-border-dialog"
    >
      <el-form
        :model="planForm"
        class="plan-form"
        label-width="100px"
        :rules="planFormRules"
        ref="planFormRef"
      >
        <el-form-item prop="planTitle">
          <template #label>
            <div class="form-label-tag">计划标题</div>
          </template>
          <el-input
            v-model="planForm.planTitle"
            placeholder="请输入学习计划标题（如：Vue核心知识点复习）"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>
        <el-form-item prop="subject">
          <template #label>
            <div class="form-label-tag">关联科目</div>
          </template>
          <el-select v-model="planForm.subject" placeholder="请选择关联科目">
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
        <el-form-item prop="timeRange">
          <template #label>
            <div class="form-label-tag">计划周期</div>
          </template>
          <el-date-picker
            v-model="planForm.timeRange"
            type="daterange"
            range-separator="至"
            start-placeholder="选择开始日期"
            end-placeholder="选择结束日期"
            :disabled-date="disabledPastDate"
          />
        </el-form-item>
        <el-form-item prop="description">
          <template #label>
            <div class="form-label-tag">计划描述</div>
          </template>
          <el-input
            v-model="planForm.description"
            type="textarea"
            rows="4"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        <el-form-item prop="planStatus" v-if="isEdit">
          <template #label>
            <div class="form-label-tag">计划状态</div>
          </template>
          <el-select v-model="planForm.planStatus" placeholder="请选择计划状态">
            <el-option label="未开始" value="not_started" />
            <el-option label="进行中" value="in_progress" />
            <el-option label="已完成" value="completed" />
          </el-select>
        </el-form-item>
        <el-form-item prop="progress" v-if="isEdit">
          <template #label>
            <div class="form-label-tag">当前进度</div>
          </template>
          <el-slider
            v-model="planForm.progress"
            :min="0"
            :max="100"
            show-input
            @change="handleProgressChange"
          />
          <div v-if="progressStatusHint" class="progress-hint">
            {{ progressStatusHint }}
          </div>
        </el-form-item>
        <el-form-item prop="targetProgress" v-if="isEdit">
          <template #label>
            <div class="form-label-tag">目标进度</div>
          </template>
          <el-slider
            v-model="planForm.targetProgress"
            :min="0"
            :max="100"
            show-input
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showPlanDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSavePlan">确认保存</el-button>
      </template>
    </el-dialog>

    <!-- ================= 6. 筛选弹框（居中） ================= -->
    <el-dialog
      v-model="showFilterDialog"
      title="筛选计划"
      width="600px"
      center
      :close-on-click-modal="true"
      class="blue-border-dialog"
    >
      <el-form :model="filterForm" label-width="90px">
        <el-form-item label="计划状态">
          <el-select
            v-model="filterForm.planStatus"
            clearable
            placeholder="请选择状态"
          >
            <el-option label="全部状态" value="" />
            <el-option label="未开始" value="not_started" />
            <el-option label="进行中" value="in_progress" />
            <el-option label="已完成" value="completed" />
            <el-option label="已逾期" value="overdue" />
          </el-select>
        </el-form-item>
        <el-form-item label="关联科目">
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
        <el-form-item label="计划时间">
          <el-date-picker
            v-model="filterForm.planTimeRange"
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
    <!-- ================= 7. 计划详情对话框 ================= -->
    <el-dialog
      v-model="showPlanDetailDialog"
      title="计划详情"
      width="900px"
      center
      :close-on-click-modal="true"
      class="blue-border-dialog"
    >
      <div v-if="currentPlanDetail" class="plan-detail-content">
        <!-- 第一行：计划标题 -->
        <div class="detail-row-single">
          <span class="detail-label">计划标题：</span>
          <span class="detail-value">{{ currentPlanDetail.planTitle }}</span>
        </div>
        
        <!-- 第二行：关联科目、计划状态、当前进度 -->
        <div class="detail-row-multi">
          <div class="detail-item-inline">
            <span class="detail-label">关联科目：</span>
            <span class="detail-value">{{ getSubjectText(currentPlanDetail.subject) }}</span>
          </div>
          <div class="detail-item-inline">
            <span class="detail-label">计划状态：</span>
            <span class="detail-value">{{ getStatusText(currentPlanDetail.planStatus) }}</span>
          </div>
          <div class="detail-item-inline">
            <span class="detail-label">当前进度：</span>
            <span class="detail-value">{{ currentPlanDetail.progress }}%</span>
          </div>
        </div>
        
        <!-- 第三行：开始时间、结束时间 -->
        <div class="detail-row-multi">
          <div class="detail-item-inline">
            <span class="detail-label">开始时间：</span>
            <span class="detail-value">{{ formatDateTime(currentPlanDetail.startTime) }}</span>
          </div>
          <div class="detail-item-inline">
            <span class="detail-label">结束时间：</span>
            <span class="detail-value">{{ formatDateTime(currentPlanDetail.endTime) }}</span>
          </div>
        </div>
        
        <!-- 计划描述 -->
        <div class="detail-section">
          <div class="detail-label">计划描述：</div>
          <div class="detail-content-box">{{ currentPlanDetail.description }}</div>
        </div>

        <div v-if="currentPlanDetail.aiReason" class="detail-section ai-reason-section">
          <div class="detail-label">AI制定理由：</div>
          <p class="detail-ai-reason">{{ currentPlanDetail.aiReason }}</p>
        </div>
      </div>
      <template #footer>
        <div class="detail-dialog-footer">
          <el-button type="danger" plain :icon="Delete" @click="handleDeleteFromDetail">
            删除计划
          </el-button>
          <div class="detail-footer-spacer"></div>
          <el-button @click="showPlanDetailDialog = false">关闭</el-button>
          <el-button type="primary" :icon="Edit" @click="handleEditFromDetail">编辑</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- ================= 8. 管理计划对话框 ================= -->
    <el-dialog
      v-model="showManagePlanDialog"
      title="管理学习计划"
      width="900px"
      center
      :close-on-click-modal="true"
      class="blue-border-dialog"
    >
      <div class="manage-dialog-content">
        <div class="manage-toolbar-dialog">
          <el-checkbox 
            v-model="selectAllPlans"
            @change="handleSelectAllPlans"
            :indeterminate="isPlanIndeterminate"
          >
            全选
          </el-checkbox>
          <el-button 
            v-if="selectedPlans.length > 0"
            type="danger" 
            size="small"
            :icon="Delete" 
            @click="batchDeletePlans"
            :disabled="selectedPlans.length === 0"
          >
            删除选中 ({{ selectedPlans.length }})
          </el-button>
        </div>
        
        <div class="plans-list-manage">
          <div 
            v-for="plan in planList" 
            :key="plan.id"
            class="plan-manage-item"
          >
            <el-checkbox 
              :model-value="selectedPlans.includes(plan.id)"
              @change="(val) => handlePlanCheckChange(val, plan.id)"
            />
            <div class="plan-manage-content" @click="handlePlanDetail(plan)">
              <div class="plan-manage-title">{{ plan.planTitle }}</div>
              <div class="plan-manage-meta">
                <el-tag size="small" type="primary">
                  {{ getSubjectText(plan.subject) }}
                </el-tag>
                <el-tag size="small" :type="getStatusTagType(plan.planStatus)">
                  {{ getStatusText(plan.planStatus) }}
                </el-tag>
                <span>进度: {{ plan.progress }}%</span>
                <span class="plan-manage-time">{{ formatDateTime(plan.endTime) }}</span>
              </div>
            </div>
            <div class="plan-manage-actions">
              <el-button 
                type="primary" 
                size="small"
                @click="handleEditPlan(plan)"
              >
                编辑
              </el-button>
            </div>
          </div>
        </div>
        
        <el-empty 
          v-if="planList.length === 0" 
          description="暂无学习计划" 
          :image-size="100"
        />
      </div>
      
      <template #footer>
        <el-button @click="showManagePlanDialog = false">关闭</el-button>
      </template>
    </el-dialog>

    <AiPlanGeneratorDrawer
      v-model="showAiPlanDrawer"
      :user-id="currentUserId"
      :user-subjects="userSubjects"
      @imported="handleAiPlansImported"
    />
  </div>
</template>

<script setup>
/* ============== 依赖引入（与上一版完全一致） ============== */
import { ref, reactive, onMounted, computed, watch } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus, Calendar, Edit, Setting, Delete, DArrowLeft, DArrowRight, MagicStick } from "@element-plus/icons-vue";
import SideNavBar from '@/components/SideNavBar.vue';
import AiPlanGeneratorDrawer from '@/components/plan/AiPlanGeneratorDrawer.vue';
// 【新增】引入 axios，对接后端接口
import axios from "axios";
// 【新增】引入用户科目工具
import { getUserSubjects, generateSubjectOptions, hasUserSubjects, getSubjectCode } from "@/utils/userSubjects";
import TimelineView from '@/components/plan/TimelineView.vue';
import dayjs from 'dayjs';

/* ============== 基础变量（与上一版完全一致） ============== */
const router = useRouter();
const loading = ref(false);
const showPlanDialog = ref(false);
const isEdit = ref(false);
const planFormRef = ref(null);
const sidebarCollapsed = ref(false);

// 查看计划详情
const showPlanDetailDialog = ref(false);
const currentPlanDetail = ref(null);

// 管理计划对话框
const showManagePlanDialog = ref(false);
const selectedPlans = ref([]);
const selectAllPlans = ref(false);
const isPlanIndeterminate = ref(false);

/* 分页 */
const currentPage = ref(1);
const pageSize = ref(9999); // 时间轴展示全部计划
const totalCount = ref(0);

const showFilterDialog = ref(false);
const showAiPlanDrawer = ref(false);
const currentUserId = ref(localStorage.getItem('edu-user-id') || '');

/* 筛选表单 */
const filterForm = reactive({
  planStatus: "",
  subject: "",
  planTimeRange: [],
});

/* 新增/编辑表单 */
const planForm = reactive({
  id: "",
  planTitle: "",
  subject: "",
  timeRange: [],
  description: "",
  planStatus: "not_started",
  progress: 0,
  targetProgress: 0,
});

const planFormRules = {
  planTitle: [{ required: true, message: "请输入计划标题", trigger: "blur" }],
  subject: [{ required: true, message: "请选择关联科目", trigger: "change" }],
  timeRange: [{ required: true, message: "请选择计划周期", trigger: "change" }],
  description: [{ required: true, message: "请输入计划描述", trigger: "blur" }],
};

/* 表格数据 */
const planList = ref([]);

// 【新增】用户科目相关
const userSubjects = ref([]);
const subjectOptions = computed(() => generateSubjectOptions(userSubjects.value));

// 【新增】全局统计数据（不受筛选影响）
const globalStats = ref({
  totalCount: 0,
  notStartedCount: 0,
  inProgressCount: 0,
  completedCount: 0,
  overdueCount: 0,
  statusStats: {} // 状态统计
});

// 统计数据（保持原有计算逻辑，用于其他功能）
const inProgressCount = computed(() => {
  return planList.value.filter(p => p.planStatus === 'in_progress').length;
});

const completedCount = computed(() => {
  return planList.value.filter(p => p.planStatus === 'completed').length;
});

// 【删除原有的状态统计计算，现在使用全局统计】
// 原来的 statusStats computed 已被 globalStats.statusStats 替代

// 切换侧边栏
function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value;
}

// 开始学习
function handleStartLearning(plan) {
  if (!plan) {
    ElMessage.warning('请选择要学习的计划');
    return;
  }
  
  // 如果计划未开始，自动更新为进行中
  if (plan.planStatus === 'not_started') {
    updatePlanStatus(plan.id, 'in_progress');
  }
  
  ElMessage.success(`开始学习：${plan.planTitle}`);
  // 这里可以跳转到学习页面或打开学习对话框
}

// 更新计划状态
async function updatePlanStatus(planId, status) {
  try {
    await axios.put(
      `http://localhost:3001/api/study-plan/update/${planId}`,
      { planStatus: status },
      { timeout: 10000 }
    );
    await loadGlobalStats();
    loadPlanList();
  } catch (error) {
    console.error('更新计划状态失败：', error);
  }
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

// 【新增】按科目筛选
function filterBySubject(subjectCode) {
  if (filterForm.subject === subjectCode) {
    // 如果点击的是当前科目，则取消筛选
    filterForm.subject = '';
  } else {
    filterForm.subject = subjectCode;
  }
  currentPage.value = 1;
  loadPlanList();
}

// 【新增】根据科目名称获取计划数量
function getSubjectCount(subjectName) {
  const subjectCode = getSubjectCode(subjectName);
  return planList.value.filter(plan => plan.subject === subjectCode).length;
}

// 获取卡片颜色
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

/* 生命周期 */
async function handleAiPlansImported() {
  await loadGlobalStats();
  loadPlanList();
}

onMounted(async () => {
  // 先加载用户科目
  userSubjects.value = await getUserSubjects();
  // 加载全局统计数据
  await loadGlobalStats();
  // 再加载计划列表
  loadPlanList();
});

/* 核心业务（已对接真实后端接口） */
// 【新增】加载全局统计数据
async function loadGlobalStats() {
  try {
    const userId = localStorage.getItem("edu-user-id") || "default-user";
    const res = await axios.get(
      `http://localhost:3001/api/study-plan/stats/${userId}`,
      { timeout: 10000 }
    );
    
    // 修复：axios响应数据在 res.data.data 中
    const statsData = res.data?.data || res.data;
    if (statsData) {
      globalStats.value = {
        totalCount: statsData.totalCount || 0,
        notStartedCount: statsData.notStartedCount || 0,
        inProgressCount: statsData.inProgressCount || 0,
        completedCount: statsData.completedCount || 0,
        overdueCount: statsData.overdueCount || 0,
        statusStats: statsData.statusStats || {}
      };
    }
  } catch (error) {
    console.error("获取全局统计失败：", error);
    // 如果接口不存在，使用本地计算作为降级方案
    await loadPlanListForStats();
  }
}

// 【新增】用于统计的计划列表加载（不分页，获取全部数据）
async function loadPlanListForStats() {
  try {
    const userId = localStorage.getItem("edu-user-id") || "default-user";
    const res = await axios.get("http://localhost:3001/api/study-plan/list", {
      params: {
        userId,
        pageNum: 1,
        pageSize: 9999, // 获取全部数据用于统计
        planStatus: "",
        subject: "",
      },
      timeout: 10000,
    });
    
    // 修复：axios响应数据在 res.data.data 中
    const listData = res.data?.data || res.data;
    const allPlans = listData?.plans || [];
    const statusStatsObj = {
      not_started: 0,
      in_progress: 0,
      completed: 0,
      overdue: 0
    };
    
    allPlans.forEach(plan => {
      if (statusStatsObj.hasOwnProperty(plan.planStatus)) {
        statusStatsObj[plan.planStatus]++;
      }
    });
    
    globalStats.value = {
      totalCount: allPlans.length,
      notStartedCount: allPlans.filter(p => p.planStatus === 'not_started').length,
      inProgressCount: allPlans.filter(p => p.planStatus === 'in_progress').length,
      completedCount: allPlans.filter(p => p.planStatus === 'completed').length,
      overdueCount: allPlans.filter(p => p.planStatus === 'overdue').length,
      statusStats: statusStatsObj
    };
  } catch (error) {
    console.error("获取统计数据失败：", error);
    globalStats.value = {
      totalCount: 0,
      notStartedCount: 0,
      inProgressCount: 0,
      completedCount: 0,
      overdueCount: 0,
      statusStats: {}
    };
  }
}
async function loadPlanList() {
  loading.value = true;
  try {
    // 【真实接口】GET /api/study-plan/list
    const userId = localStorage.getItem("edu-user-id") || "default-user";
    const res = await axios.get("http://localhost:3001/api/study-plan/list", {
      params: {
        userId,
        pageNum: currentPage.value,
        pageSize: pageSize.value,
        planStatus: filterForm.planStatus || "",
        subject: filterForm.subject || "",
      },
      timeout: 10000,
    });
    // 修复：axios响应数据在 res.data.data 中
    const listData = res.data?.data || res.data;
    planList.value = listData?.plans || [];
    totalCount.value = listData?.count || 0;
  } catch (error) {
    console.error("获取学习计划失败：", error);
    ElMessage.error(
      error.response?.data?.message || "获取学习计划失败，请检查后端服务"
    );
    planList.value = [];
    totalCount.value = 0;
  } finally {
    loading.value = false;
  }
}

// 按状态筛选
function filterByStatus(status) {
  if (filterForm.planStatus === status) {
    // 如果点击的是当前状态，则取消筛选
    filterForm.planStatus = '';
  } else {
    filterForm.planStatus = status;
  }
  currentPage.value = 1;
  loadPlanList();
}

function handleFilter() {
  currentPage.value = 1;
  showFilterDialog.value = false;
  loadPlanList();
}
function resetFilter() {
  filterForm.planStatus = "";
  filterForm.subject = "";
  filterForm.planTimeRange = [];
  currentPage.value = 1;
  showFilterDialog.value = false;
  loadPlanList();
}
function refreshPlanList() {
  loadPlanList();
  ElMessage.info("已刷新");
}
function handlePlanDetail(row) {
  // 点击卡片只显示内容详情
  currentPlanDetail.value = row;
  showPlanDetailDialog.value = true;
}
function handleAddPlan() {
  isEdit.value = false;
  Object.assign(planForm, {
    id: "",
    planTitle: "",
    subject: "",
    timeRange: [],
    description: "",
    planStatus: "not_started",
    progress: 0,
    targetProgress: 0,
  });
  showPlanDialog.value = true;
}
function handleEditPlan(row) {
  isEdit.value = true;
  Object.assign(planForm, {
    id: row.id,
    planTitle: row.planTitle,
    subject: row.subject,
    timeRange: [new Date(row.startTime), new Date(row.endTime)],
    description: row.description,
    planStatus: row.planStatus,
    progress: row.progress,
    targetProgress: row.targetProgress,
  });
  showPlanDialog.value = true;
}
async function handleSavePlan() {
  try {
    // 表单验证
    await planFormRef.value.validate();
    
    // 验证时间范围
    if (!planForm.timeRange || planForm.timeRange.length !== 2) {
      ElMessage.error("请选择计划周期");
      return;
    }
    
    // 验证科目是否已选择
    if (!planForm.subject) {
      ElMessage.warning("请选择关联科目");
      return;
    }
    
    // 【新增】根据进度自动调整计划状态
    let autoStatus = planForm.planStatus;
    if (isEdit.value && planForm.progress !== undefined) {
      if (planForm.progress === 0) {
        autoStatus = 'not_started';
      } else if (planForm.progress === 100) {
        autoStatus = 'completed';
      } else if (planForm.progress > 0 && planForm.progress < 100) {
        autoStatus = 'in_progress';
      }
    }
    
    loading.value = true;
    
    const userId = localStorage.getItem("edu-user-id") || "default-user";
    
    // 构建提交数据
    const planData = {
      userId,
      planTitle: planForm.planTitle,
      subject: planForm.subject,
      startTime: planForm.timeRange[0],
      endTime: planForm.timeRange[1],
      description: planForm.description || "",
      planStatus: autoStatus, // 使用自动调整后的状态
      progress: planForm.progress || 0,
      targetProgress: planForm.targetProgress || 0,
    };
    
    console.log("=== 学习计划提交数据 ===");
    console.log("科目值:", planData.subject);
    console.log("原始状态:", planForm.planStatus);
    console.log("自动调整状态:", autoStatus);
    console.log("进度:", planData.progress);
    console.log("完整数据:", planData);
    
    if (isEdit.value) {
      // 【真实接口】PUT /api/study-plan/update/:id
      const response = await axios.put(
        `http://localhost:3001/api/study-plan/update/${planForm.id}`,
        planData,
        { timeout: 10000 }
      );
      console.log("编辑响应:", response.data);
      ElMessage.success("编辑成功");
    } else {
      // 【真实接口】POST /api/study-plan/add
      const response = await axios.post(
        "http://localhost:3001/api/study-plan/add",
        planData,
        { timeout: 10000 }
      );
      console.log("新增响应:", response.data);
      ElMessage.success("新增成功");
    }
    
    showPlanDialog.value = false;
    // 重新加载全局统计和计划列表
    await loadGlobalStats();
    loadPlanList();
  } catch (error) {
    console.error("=== 保存学习计划失败 ===");
    console.error("错误对象:", error);
    console.error("响应数据:", error.response?.data);
    console.error("响应状态:", error.response?.status);
    console.error("请求配置:", error.config);
    
    const errorMsg = error.response?.data?.message || error.message || "保存失败，请重试";
    ElMessage.error(errorMsg);
  } finally {
    loading.value = false;
  }
}
function handleMarkCompleted(id) {
  ElMessageBox.confirm("确定标记为已完成？", "提示")
    .then(async () => {
      try {
        loading.value = true;
      // 【真实接口】PUT /api/study-plan/mark-completed/:id
      await axios.put(
        `http://localhost:3001/api/study-plan/mark-completed/${id}`,
        {},
        { timeout: 10000 }
      );
      ElMessage.success("已完成");
      // 重新加载全局统计和计划列表
      await loadGlobalStats();
      loadPlanList();
    } catch (error) {
      console.error("标记完成失败：", error);
      ElMessage.error(
        error.response?.data?.message || "标记失败，请重试"
      );
    } finally {
      loading.value = false;
    }
    })
    .catch(() => {
      // 用户取消操作，不做任何处理
    });
}

// 快速切换计划完成状态
async function togglePlanCompletion(plan) {
  try {
    const isCompleted = plan.planStatus === 'completed';
    
    if (isCompleted) {
      // 取消完成
      await axios.put(
        `http://localhost:3001/api/study-plan/unmark-completed/${plan.id}`,
        {},
        { timeout: 10000 }
      );
      ElMessage.success("已取消完成");
    } else {
      // 标记完成
      await axios.put(
        `http://localhost:3001/api/study-plan/mark-completed/${plan.id}`,
        {},
        { timeout: 10000 }
      );
      ElMessage.success("已标记为完成");
    }
    
    // 刷新全局统计和列表
    await loadGlobalStats();
    loadPlanList();
  } catch (error) {
    console.error("切换完成状态失败：", error);
    ElMessage.error(
      error.response?.data?.message || "操作失败，请重试"
    );
  }
}
function handleEditFromDetail() {
  if (!currentPlanDetail.value) return;
  showPlanDetailDialog.value = false;
  handleEditPlan(currentPlanDetail.value);
}

function handleDeleteFromDetail() {
  if (!currentPlanDetail.value?.id) return;
  const planId = currentPlanDetail.value.id;
  handleDeletePlan(planId, () => {
    showPlanDetailDialog.value = false;
    currentPlanDetail.value = null;
  });
}

function handleDeletePlan(id, onSuccess) {
  ElMessageBox.confirm("确定删除该计划？删除后无法恢复。", "删除确认", {
    type: "warning",
    confirmButtonText: "确定删除",
    cancelButtonText: "取消",
  })
    .then(async () => {
      try {
        loading.value = true;
        // 【真实接口】DELETE /api/study-plan/delete/:id
        await axios.delete(
          `http://localhost:3001/api/study-plan/delete/${id}`,
          { timeout: 10000 }
        );
        ElMessage.success("删除成功");
        await loadGlobalStats();
        loadPlanList();
        onSuccess?.();
      } catch (error) {
        console.error("删除学习计划失败：", error);
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

// 【新增】进度状态提示
const progressStatusHint = ref('');

// 【新增】处理进度变化，自动调整状态
function handleProgressChange(value) {
  let newStatus = planForm.planStatus;
  let hint = '';
  
  if (value === 0) {
    newStatus = 'not_started';
    hint = '💡 进度为0%，状态将自动设为"未开始"';
  } else if (value === 100) {
    newStatus = 'completed';
    hint = '🎉 进度为100%，状态将自动设为"已完成"';
  } else if (value > 0 && value < 100) {
    newStatus = 'in_progress';
    hint = '⚡ 进度为' + value + '%，状态将自动设为"进行中"';
  }
  
  // 更新状态和提示
  planForm.planStatus = newStatus;
  progressStatusHint.value = hint;
  
  // 3秒后清除提示
  setTimeout(() => {
    progressStatusHint.value = '';
  }, 3000);
}
function handlePlanCheckChange(checked, planId) {
  if (checked) {
    if (!selectedPlans.value.includes(planId)) {
      selectedPlans.value.push(planId);
    }
  } else {
    const index = selectedPlans.value.indexOf(planId);
    if (index > -1) {
      selectedPlans.value.splice(index, 1);
    }
  }
}

// 全选/取消全选计划
function handleSelectAllPlans(val) {
  if (val) {
    selectedPlans.value = planList.value.map(plan => plan.id);
  } else {
    selectedPlans.value = [];
  }
  isPlanIndeterminate.value = false;
}

// 监听选中项变化，更新全选状态
watch(selectedPlans, (newVal) => {
  const checkedCount = newVal.length;
  const totalCount = planList.value.length;
  
  selectAllPlans.value = checkedCount === totalCount && totalCount > 0;
  isPlanIndeterminate.value = checkedCount > 0 && checkedCount < totalCount;
});

// 批量删除计划
async function batchDeletePlans() {
  if (selectedPlans.value.length === 0) {
    ElMessage.warning('请选择要删除的计划');
    return;
  }
  
  try {
    await ElMessageBox.confirm(
      `确定删除选中的 ${selectedPlans.value.length} 个计划吗？删除后无法恢复。`,
      '批量删除确认',
      {
        type: 'warning',
        confirmButtonText: '确定删除',
        cancelButtonText: '取消'
      }
    );
    
    loading.value = true;
    
    // 批量删除
    for (const planId of selectedPlans.value) {
      await axios.delete(`http://localhost:3001/api/study-plan/delete/${planId}`, {
        timeout: 10000,
      });
    }
    
    ElMessage.success(`成功删除 ${selectedPlans.value.length} 个计划`);
    selectedPlans.value = [];
    selectAllPlans.value = false;
    isPlanIndeterminate.value = false;
    showManagePlanDialog.value = false;
    // 重新加载全局统计和计划列表
    await loadGlobalStats();
    loadPlanList();
  } catch (error) {
    if (error !== 'cancel') {
      console.error("批量删除计划失败：", error);
      ElMessage.error("删除失败，请重试");
    }
  } finally {
    loading.value = false;
  }
}

/* 辅助函数（与上一版完全一致） */
const getStatusText = (status) =>
  ({
    not_started: "未开始",
    in_progress: "进行中",
    completed: "已完成",
    overdue: "已逾期",
  }[status] || "未知状态");

const getStatusTagType = (status) =>
  ({
    not_started: "info",
    in_progress: "primary",
    completed: "success",
    overdue: "danger",
  }[status] || "warning");

const getProgressColor = (progress) => {
  if (progress >= 100) return "#35b778";
  if (progress >= 50) return "#2f86eb";
  if (progress > 0) return "#ffc107";
  return "#e74c3c";
};

const disabledPastDate = (time) => time.getTime() < Date.now() - 8.64e7;

/* 时间格式化函数 */
function formatDateTime(dateStr) {
  if (!dateStr) return '-';
  
  try {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('时间格式化失败：', error);
    return dateStr;
  }
}
</script>

<style scoped>
.study-plan-container {
  display: block;
  height: 100vh;
  background: #f5f7fa;
  overflow: hidden;
  position: relative;
}

/* 左侧边栏 */
.plan-sidebar {
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

.plan-sidebar.collapsed {
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

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  font-weight: 600;
  color: #2c3e50;
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

/* 右侧：计划列表 */
.plan-content {
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

.plan-content.expanded {
  left: 60px;
}

.plans-container {
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

/* 时间轴列表区域 */
.plan-timeline-wrapper {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 20px;
  background: linear-gradient(180deg, #f4faf7 0%, #eef5f1 100%);
}

/* 计划网格布局（2行4列，每个占1/8） */
.plan-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 16px;
  height: 100%;
}
/* 彩色卡片样式 */
.plan-card {
  border-radius: 16px;
  transition: all 0.3s;
  position: relative;
  height: 100%;
  overflow: visible;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  cursor: pointer;
}

.plan-card:hover {
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
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

.card-checkbox.completed {
  background: #67c23a;
  border-color: #67c23a;
}

.card-status,
.card-subject {
  display: inline-block;
  padding: 5px 12px;
  background: #fff;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 700;
  width: fit-content;
  color: #000;
  text-shadow: none;
  border: 2px solid rgba(0, 0, 0, 0.15);
  flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.card-title {
  font-size: 18px;
  font-weight: 700;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  letter-spacing: 0.3px;
  flex: 1;
  color: #000;
}

.card-progress {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.card-progress .el-progress {
  flex: 1;
}

.progress-text {
  font-size: 14px;
  font-weight: 700;
  color: #000;
  min-width: 40px;
  text-align: right;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  flex-shrink: 0;
  gap: 8px;
}

.card-time {
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 14px;
  font-size: 11px;
  font-weight: 600;
  border: 1px solid rgba(0, 0, 0, 0.1);
  color: rgba(0, 0, 0, 0.75);
  text-shadow: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.card-edit-btn {
  cursor: pointer;
  transition: all 0.3s;
  padding: 6px 16px;
  border-radius: 8px;
  background: #fff;
  color: #0969da;
  border: 2px solid #0969da;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(9, 105, 218, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 13px;
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
  box-shadow: 0 4px 12px rgba(9, 105, 218, 0.5);
}

/* 右侧：统计信息 */
.right-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.status-stats-box {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 2px solid #35b778;
  flex-shrink: 0;
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

.status-stats-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.status-stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  background: #f8f9fa;
  border-radius: 6px;
  transition: all 0.3s;
  cursor: pointer;
}

.status-stat-item:hover {
  background: #e8f4ed;
  transform: translateX(4px);
}

.status-stat-item.active {
  background: #e8f4fd;
  border: 2px solid #0969da;
  transform: translateX(4px);
}

.status-stat-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #2c3e50;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-stat-value {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
}

/* 计划详情样式 */
.plan-detail-content {
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
  margin-bottom: 12px;
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

.detail-dialog-footer {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 10px;
}

.detail-footer-spacer {
  flex: 1;
}

.detail-ai-reason {
  margin: 0;
  font-size: 12px;
  color: #6b8578;
  line-height: 1.7;
  padding: 10px 14px;
  background: #f0f9f4;
  border: 1px solid #cce8d6;
  border-radius: 4px;
}

.ai-reason-section .detail-label {
  margin-bottom: 8px;
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

/* 进度提示样式 */
.progress-hint {
  margin-top: 8px;
  padding: 8px 12px;
  background: linear-gradient(135deg, #e8f4fd 0%, #f0f9ff 100%);
  border: 1px solid #0969da;
  border-radius: 6px;
  font-size: 13px;
  color: #0969da;
  font-weight: 500;
  animation: fadeInUp 0.3s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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

.plans-list-manage {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.plan-manage-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #fff;
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  transition: all 0.3s;
}

.plan-manage-item:hover {
  border-color: #0969da;
  box-shadow: 0 2px 8px rgba(9, 105, 218, 0.1);
}

.plan-manage-content {
  flex: 1;
  cursor: pointer;
  min-width: 0;
}

.plan-manage-title {
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

.plan-manage-title:hover {
  color: #0969da;
}

.plan-manage-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: #666;
  flex-wrap: wrap;
}

.plan-manage-time {
  color: #999;
  font-size: 12px;
}

.plan-manage-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}
</style>

