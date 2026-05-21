<template>
  <div class="study-data-container">
    <!-- 顶部导航栏 -->
    <TopNavBar />
    
    <!-- 操作按钮栏 -->
    <div class="action-bar">
      <el-button
        type="warning"
        :icon="Filter"
        @click.stop="showFilterDialog = true"
      >
        筛选
      </el-button>
      <el-button
        type="primary"
        :icon="Refresh"
        @click.stop="refreshStudyData"
      >
        刷新数据
      </el-button>
      <el-button
        type="success"
        :icon="Download"
        @click.stop="exportStudyData"
      >
        导出报告
      </el-button>
    </div>

    <!-- 2. 励志标语滚动条（新增） -->
    <div class="slogan-bar">
      <div
        class="slogan-content"
        :style="{ transform: `translateX(-${sloganOffset}px)` }"
      >
        <span v-for="(s, i) in sloganList" :key="i" class="slogan-item">
          {{ s }}
        </span>
      </div>
    </div>

    <!-- 3. 搜索栏（原功能保留） -->
    <div class="search-bar">
      <el-input
        v-model="searchKey"
        placeholder="请输入关键词搜索"
        prefix-icon="Search"
        @keyup.enter="handleSearch"
      >
        <template #append>
          <el-button @click="handleSearch" icon="Search" />
        </template>
      </el-input>
    </div>

    <!-- 4. 数据概览（极简卡片，能跑即可） -->
    <div class="study-data-overview" v-loading="loading">
      <el-card class="overview-card" shadow="hover">
        <div class="card-item">
          <div class="item-icon success-icon">
            <el-icon size="24"><Check /></el-icon>
          </div>
          <div class="item-content">
            <div class="item-title">已完成学习计划</div>
            <div class="item-value">{{ overviewData.completedPlanCount }}</div>
            <div class="item-desc">
              完成率：{{ overviewData.planCompletionRate }}%
            </div>
          </div>
        </div>
      </el-card>
      <el-card class="overview-card" shadow="hover">
        <div class="card-item">
          <div class="item-icon primary-icon">
            <el-icon size="24"><Document /></el-icon>
          </div>
          <div class="item-content">
            <div class="item-title">已创建学习笔记</div>
            <div class="item-value">{{ overviewData.noteCount }}</div>
            <div class="item-desc">共 {{ overviewData.noteCount }} 篇</div>
          </div>
        </div>
      </el-card>
      <el-card class="overview-card" shadow="hover">
        <div class="card-item">
          <div class="item-icon danger-icon">
            <el-icon size="24"><Close /></el-icon>
          </div>
          <div class="item-content">
            <div class="item-title">已收录错题</div>
            <div class="item-value">{{ overviewData.errorQuestionCount }}</div>
            <div class="item-desc">
              共 {{ overviewData.errorQuestionCount }} 道
            </div>
          </div>
        </div>
      </el-card>
      <el-card class="overview-card" shadow="hover">
        <div class="card-item">
          <div class="item-icon warning-icon">
            <el-icon size="24"><Clock /></el-icon>
          </div>
          <div class="item-content">
            <div class="item-title">累计学习时长</div>
            <div class="item-value">{{ overviewData.totalStudyHours }}h</div>
            <div class="item-desc">
              日均 {{ overviewData.avgDailyStudyHours }}h
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 5. 明细表格（带分页） -->
    <div class="study-data-detail" v-loading="loading">
      <el-table
        :data="dataDetailList"
        border
        stripe
        highlight-current-row
        class="detail-table"
      >
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column prop="date" label="日期" width="180" align="center" />
        <el-table-column prop="subject" label="科目" width="100" align="center">
          <template #default="scope">
            <el-tag type="info" size="small">{{
              getSubjectText(scope.row.subject)
            }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="content"
          label="内容"
          min-width="250"
          show-overflow-tooltip
        />
        <el-table-column
          prop="value"
          label="指标值"
          width="120"
          align="center"
        />
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="totalCount"
          layout="total, sizes, prev, pager, next, jumper"
          :page-sizes="[10, 20, 50, 100]"
          @size-change="handlePageSizeChange"
          @current-change="handleCurrentPageChange"
        />
      </div>
    </div>

    <!-- 6. 空状态 -->
    <div v-if="dataDetailList.length === 0 && !loading" class="empty-container">
      <el-empty description="暂无学习数据记录，快去开始你的学习之旅吧~">
        <el-button type="primary" @click="router.push('/study-plan')">
          创建学习计划
        </el-button>
      </el-empty>
    </div>

    <!-- 7. 筛选弹框（居中） -->
    <el-dialog
      v-model="showFilterDialog"
      title="筛选数据"
      width="600px"
      center
      :close-on-click-modal="false"
    >
      <el-form :model="filterForm" label-width="90px">
        <el-form-item label="统计周期">
          <el-date-picker
            v-model="filterForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            clearable
          />
        </el-form-item>
        <el-form-item label="关联科目">
          <el-select
            v-model="filterForm.subject"
            clearable
            placeholder="请选择科目"
          >
            <el-option label="全部科目" value="" />
            <el-option label="数学" value="math" />
            <el-option label="语文" value="chinese" />
            <el-option label="英语" value="english" />
            <el-option label="物理" value="physics" />
            <el-option label="化学" value="chemistry" />
          </el-select>
        </el-form-item>
        <el-form-item label="数据维度">
          <el-select
            v-model="filterForm.dataDimension"
            clearable
            placeholder="请选择维度"
          >
            <el-option label="综合数据" value="comprehensive" />
            <el-option label="学习计划数据" value="plan" />
            <el-option label="学习笔记数据" value="note" />
            <el-option label="错题数据" value="error" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="resetFilter">重置</el-button>
        <el-button type="primary" @click="handleFilter">查询</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
/* ============== 依赖引入 ============== */
import { ref, reactive, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
// 【新增】引入 axios，对接后端 /api/study-data 接口
import axios from "axios";
import {
  Refresh,
  Download,
  Filter,
  RefreshLeft,
  Check,
  Document,
  Close,
  Clock,
  DataAnalysis,
} from "@element-plus/icons-vue";
import TopNavBar from "@/components/TopNavBar.vue";

const router = useRouter();

/* ============== 基础变量 ============== */
const loading = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);
const totalCount = ref(0);

const filterForm = reactive({
  dateRange: [],
  subject: "",
  dataDimension: "comprehensive",
});

/* 新增：励志标语滚动 */
const sloganList = [
  "每一次努力，都是在为未来的自己铺路！",
  "今天的汗水，是明天成功的种子。",
  "保持热爱，奔赴山海；保持自律，静待花开。",
  "你努力的样子，真的很美！",
  "别怕路长梦远，山高水长终有归途。",
  "学习没有捷径，唯有坚持与重复。",
  "当你觉得晚了的时候，恰恰是最早的时候。",
  "所谓成长，就是不断超越昨天的自己。",
  "所有看似不起波澜的日复一日，都会在某天给你惊喜。",
  "你追的不是星，是更好的自己。",
  "慢慢来，才会快；坚持下去，才看得到改变。",
  "努力的意义，就是以后的日子里，放眼望去，全部都是自己喜欢的人和事。",
  "别让今天的懒，成为明天的难。",
  "你只管努力，时间会给你答案。",
  "乾坤未定，你我皆是黑马。",
  "你若盛开，清风自来；心若浮沉，浅笑安然。",
  "生活再平凡，也是限量版。",
  "请务必全力以赴地开心。",
  "保持清醒，保持温柔，保持快乐。",
  "别急，一切都在慢慢变好。",
];
const sloganOffset = ref(0);
let sloganTimer = null;

/* 新增：标语滚动逻辑 */
function startSloganScroll() {
  const itemWidth = 320;
  const totalWidth = sloganList.length * itemWidth;
  sloganTimer = setInterval(() => {
    sloganOffset.value += 1;
    if (sloganOffset.value >= totalWidth) sloganOffset.value = 0;
  }, 30);
}
function stopSloganScroll() {
  clearInterval(sloganTimer);
}

/* 新增：弹窗开关 */
const showFilterDialog = ref(false);

/* 新增：搜索关键词（可选） */
const searchKey = ref("");

/* 新增：概览数据（由后端返回真实/模拟统计） */
const overviewData = reactive({
  completedPlanCount: 0,
  totalPlanCount: 0,
  planCompletionRate: 0,
  noteCount: 0,
  errorQuestionCount: 0,
  totalStudyHours: 0,
  avgDailyStudyHours: 0,
});

/* 新增：明细列表（由后端返回） */
const dataDetailList = ref([]);

/* 新增：热力图数据 */
const heatmapData = ref([]);
const heatmapMonths = ref([]);
const totalStudyDays = ref(0);
const maxContinuousDays = ref(0);

// 生成热力图数据
function generateHeatmapData() {
  const data = [];
  const today = new Date();
  const oneYearAgo = new Date(today);
  oneYearAgo.setFullYear(today.getFullYear() - 1);
  
  // 生成过去一年的数据
  const currentDate = new Date(oneYearAgo);
  const months = [];
  let currentMonth = '';
  
  while (currentDate <= today) {
    const month = currentDate.getMonth() + 1;
    const monthStr = `${month}月`;
    
    if (monthStr !== currentMonth) {
      currentMonth = monthStr;
      months.push(monthStr);
    }
    
    // 模拟学习活动数据（实际应该从后端获取）
    const count = Math.floor(Math.random() * 10);
    let level = 0;
    if (count === 0) level = 0;
    else if (count <= 2) level = 1;
    else if (count <= 4) level = 2;
    else if (count <= 6) level = 3;
    else level = 4;
    
    data.push({
      date: currentDate.toISOString().split('T')[0],
      count: count,
      level: level
    });
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  heatmapData.value = data;
  heatmapMonths.value = months.filter((m, i, arr) => arr.indexOf(m) === i);
  
  // 计算统计数据
  totalStudyDays.value = data.filter(d => d.count > 0).length;
  
  // 计算最长连续学习天数
  let maxDays = 0;
  let currentDays = 0;
  data.forEach(d => {
    if (d.count > 0) {
      currentDays++;
      maxDays = Math.max(maxDays, currentDays);
    } else {
      currentDays = 0;
    }
  });
  maxContinuousDays.value = maxDays;
}

// 获取热力图单元格样式类
function getHeatmapClass(level) {
  return `level-${level}`;
}

/* 生命周期 */
onMounted(() => {
  startSloganScroll();
  generateHeatmapData();
  loadStudyData();
});

onUnmounted(() => {
  stopSloganScroll();
});

/* ============== 业务函数 ============== */
async function loadStudyData() {
  loading.value = true;
  try {
    // 获取当前用户ID
    const userId = localStorage.getItem("edu-user-id") || "default-user";
    
    // 【已对接后端】GET /api/study-data/list
    const res = await axios.get("http://localhost:3001/api/study-data/list", {
      params: {
        userId,
        pageNum: currentPage.value,
        pageSize: pageSize.value,
        subject: filterForm.subject || "",
        dimension: filterForm.dataDimension || "comprehensive",
      },
      timeout: 15000,
    });

    const data = res.data?.data || {};
    const overview = data.overview || {};
    const detail = data.detail || {};

    // 概览数据赋值（字段名与后端约定一致，见 backend/routes/studyData.js）
    overviewData.completedPlanCount = overview.completedPlanCount || 0;
    overviewData.totalPlanCount = overview.totalPlanCount || 0;
    overviewData.planCompletionRate = overview.planCompletionRate || 0;
    overviewData.noteCount = overview.noteCount || 0;
    overviewData.errorQuestionCount = overview.errorQuestionCount || 0;
    overviewData.totalStudyHours = overview.totalStudyHours || 0;
    overviewData.avgDailyStudyHours = overview.avgDailyStudyHours || 0;

    // 明细列表赋值
    dataDetailList.value = detail.records || [];
    totalCount.value = detail.total || 0;
  } catch (error) {
    console.error("获取学习数据失败：", error);
    ElMessage.error(
      error.response?.data?.message ||
        "获取学习数据失败，请检查后端服务是否启动"
    );
    dataDetailList.value = [];
    totalCount.value = 0;
  } finally {
    loading.value = false;
  }
}

function getSubjectText(subject) {
  const map = {
    math: "数学",
    chinese: "语文",
    english: "英语",
    physics: "物理",
    chemistry: "化学",
  };
  return map[subject] || "全部";
}

function handleFilter() {
  currentPage.value = 1;
  showFilterDialog.value = false;
  loadStudyData();
}

function resetFilter() {
  filterForm.dateRange = [];
  filterForm.subject = "";
  filterForm.dataDimension = "comprehensive";
  currentPage.value = 1;
  loadStudyData();
}

function handleSearch() {
  currentPage.value = 1;
  loadStudyData();
}

function refreshStudyData() {
  loadStudyData();
  ElMessage.info("学习数据已刷新");
}

function exportStudyData() {
  ElMessageBox.confirm("确定导出当前学习数据报告？", "提示", {
    type: "info",
  })
    .then(async () => {
      // 【保留前端提示逻辑】目前后端暂未实现导出文件接口，这里先给出友好提示
      // 后续如在后端实现 /api/study-data/export，可在此处改为真实下载
      ElMessage.success("暂未接入真实导出接口，后续可按需要补充文件下载功能");
    })
    .catch(() => {
      // 用户取消操作，不做任何处理
    });
}

function handlePageSizeChange(size) {
  pageSize.value = size;
  loadStudyData();
}

function handleCurrentPageChange(page) {
  currentPage.value = page;
  loadStudyData();
}
</script>

<style scoped>
/* 操作按钮栏 */
.action-bar {
  padding: 20px 40px;
  display: flex;
  gap: 12px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
}

/* 2. 励志标语滚动条（新增） */
.slogan-bar {
  height: 36px;
  background: linear-gradient(90deg, #4dabf7 0%, #0969da 100%);
  color: #fff;
  overflow: hidden;
  position: relative;
}
.slogan-content {
  display: flex;
  white-space: nowrap;
  position: absolute;
  left: 0;
  top: 0;
  line-height: 36px;
  font-size: 14px;
  font-weight: 500;
}
.slogan-item {
  padding: 0 32px;
  display: inline-block;
}

/* 3. 搜索栏（与上一版完全一致） */
.search-bar {
  margin: 24px 40px 16px;
  display: flex;
  gap: 12px;
}
.search-bar .el-input {
  flex: 1;
}

/* 4. 数据概览（极简卡片） */
.study-data-overview {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  margin: 0 40px 24px;
}
.overview-card {
  border-radius: 12px;
  border: 1px solid #e8f4ed;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
  transition: all 0.3s ease;
}
.overview-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08);
}
.card-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 0;
}
.item-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #ffffff;
}
.success-icon {
  background: linear-gradient(90deg, #35b778, #2a9664);
}
.primary-icon {
  background: linear-gradient(90deg, #2f86eb, #1e6ace);
}
.danger-icon {
  background: linear-gradient(90deg, #e74c3c, #c0392b);
}
.warning-icon {
  background: linear-gradient(90deg, #ff9800, #f57c00);
}
.item-content {
  flex: 1;
}
.item-title {
  font-size: 14px;
  color: #666;
  margin-bottom: 4px;
}
.item-value {
  font-size: 24px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 4px;
}
.item-desc {
  font-size: 12px;
  color: #999;
}

/* 5. 明细表格 & 分页（与上一版完全一致） */
.study-data-detail {
  margin: 0 40px 24px;
}
.detail-table {
  --el-table-header-text-color: #2c3e50;
  --el-table-row-hover-bg-color: #f8fafc;
  --el-table-border-color: #e8f4ed;
  --el-table-striped-bg-color: #fafcfb;
}
.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}

/* 6. 空状态（与上一版完全一致） */
.empty-container {
  display: flex;
  justify-content: center;
  padding: 64px 0;
}

/* 热力图样式 */
.heatmap-container {
  margin: 0 40px 24px;
}

.heatmap-card {
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.heatmap-card .card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 600;
  color: #0969da;
}

.heatmap-legend {
  margin-left: auto;
  display: flex;
  gap: 16px;
  font-size: 12px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  border: 1px solid rgba(27, 31, 35, 0.06);
}

.legend-text {
  color: #666;
}

.heatmap-content {
  padding: 20px;
}

.heatmap-grid {
  display: flex;
  gap: 8px;
}

.heatmap-months {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  padding-top: 20px;
}

.month-label {
  font-size: 12px;
  color: #666;
  height: 15px;
  line-height: 15px;
}

.heatmap-weeks {
  flex: 1;
  display: flex;
  gap: 8px;
}

.weekday-labels {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding-top: 20px;
}

.weekday-label {
  font-size: 11px;
  color: #666;
  height: 11px;
  line-height: 11px;
  text-align: right;
  padding-right: 4px;
}

.heatmap-cells {
  display: grid;
  grid-template-columns: repeat(53, 11px);
  grid-auto-flow: column;
  gap: 3px;
}

.heatmap-cell {
  width: 11px;
  height: 11px;
  border-radius: 2px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid rgba(27, 31, 35, 0.06);
}

.heatmap-cell:hover {
  transform: scale(1.5);
  z-index: 10;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.heatmap-cell.level-0 {
  background-color: #ebedf0;
}

.heatmap-cell.level-1 {
  background-color: #c6e48b;
}

.heatmap-cell.level-2 {
  background-color: #7bc96f;
}

.heatmap-cell.level-3 {
  background-color: #239a3b;
}

.heatmap-cell.level-4 {
  background-color: #196127;
}

.heatmap-summary {
  margin-top: 20px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
  text-align: center;
  font-size: 14px;
  color: #666;
}

.heatmap-summary strong {
  color: #0969da;
  font-size: 18px;
  font-weight: 700;
}
</style>
