<template>
  <div class="admin-overview" v-loading="loading">
    <el-row :gutter="14" class="stat-cards">
      <el-col :xs="24" :sm="12" :lg="6" v-for="card in statCards" :key="card.key">
        <div class="stat-card" :style="{ '--accent': card.color }">
          <div class="stat-icon">
            <el-icon :size="20"><component :is="card.icon" /></el-icon>
          </div>
          <div class="stat-body">
            <div class="stat-value">{{ card.value }}</div>
            <div class="stat-label">{{ card.label }}</div>
            <div v-if="card.sub" class="stat-sub">{{ card.sub }}</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="14" class="chart-row">
      <el-col :xs="24" :lg="16">
        <el-card shadow="never" class="chart-card">
          <template #header>
            <div class="card-title">
              <span>平台增长趋势</span>
              <el-radio-group v-model="trendDays" size="small" @change="loadTrends">
                <el-radio-button :label="7">7天</el-radio-button>
                <el-radio-button :label="30">30天</el-radio-button>
                <el-radio-button :label="90">90天</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div ref="lineChartRef" class="chart-box"></div>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="8">
        <el-card shadow="never" class="chart-card">
          <template #header>
            <span class="card-title-text">社区提问状态</span>
          </template>
          <div ref="questionPieRef" class="chart-box chart-box-sm"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="14" class="chart-row">
      <el-col :xs="24" :md="12">
        <el-card shadow="never" class="chart-card">
          <template #header>
            <span class="card-title-text">反馈类型分布</span>
          </template>
          <div ref="feedbackPieRef" class="chart-box chart-box-sm"></div>
        </el-card>
      </el-col>
      <el-col :xs="24" :md="12">
        <el-card shadow="never" class="chart-card">
          <template #header>
            <span class="card-title-text">用户年级分布</span>
          </template>
          <div ref="gradePieRef" class="chart-box chart-box-sm"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, markRaw, nextTick } from 'vue';
import * as echarts from 'echarts';
import { User, ChatDotRound, Document, Warning } from '@element-plus/icons-vue';
import { getAdminOverview, getAdminTrends, getAdminDistribution } from '@/api/admin';

const loading = ref(false);
const overview = ref({});
const trendDays = ref(30);

const lineChartRef = ref(null);
const questionPieRef = ref(null);
const feedbackPieRef = ref(null);
const gradePieRef = ref(null);

let lineChart = null;
let questionPie = null;
let feedbackPie = null;
let gradePie = null;

const statCards = computed(() => [
  {
    key: 'users',
    label: '全平台用户',
    value: overview.value.totalUsers ?? '-',
    sub: `今日新增 ${overview.value.todayUsers ?? 0}`,
    color: '#3b82f6',
    icon: markRaw(User),
  },
  {
    key: 'questions',
    label: '社区提问',
    value: overview.value.totalQuestions ?? '-',
    sub: `今日新增 ${overview.value.todayQuestions ?? 0}`,
    color: '#8b5cf6',
    icon: markRaw(ChatDotRound),
  },
  {
    key: 'feedbacks',
    label: '用户反馈',
    value: overview.value.totalFeedbacks ?? '-',
    sub: `待处理 ${overview.value.pendingFeedbacks ?? 0}`,
    color: '#10b981',
    icon: markRaw(Document),
  },
  {
    key: 'solved',
    label: '已解决问题',
    value: overview.value.solvedQuestions ?? '-',
    sub: `待解决 ${overview.value.unsolvedQuestions ?? 0}`,
    color: '#f59e0b',
    icon: markRaw(Warning),
  },
]);

const pieColors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#84cc16'];

function renderLineChart(trendData) {
  if (!lineChartRef.value) return;
  if (!lineChart || lineChart.isDisposed()) {
    lineChart = echarts.init(lineChartRef.value);
  }

  const labels = trendData?.userTrend?.labels || [];
  lineChart.setOption({
    color: ['#3b82f6', '#8b5cf6'],
    tooltip: { trigger: 'axis', textStyle: { fontSize: 11 } },
    legend: { data: ['新增用户', '新增提问'], bottom: 0, textStyle: { fontSize: 11 }, itemWidth: 12, itemHeight: 8 },
    grid: { left: '3%', right: '4%', bottom: '12%', top: '6%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: labels,
      axisLine: { lineStyle: { color: '#cbd5e1' } },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      splitLine: { lineStyle: { type: 'dashed', color: '#e2e8f0' } },
    },
    series: [
      {
        name: '新增用户',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 4,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(59, 130, 246, 0.35)' },
            { offset: 1, color: 'rgba(59, 130, 246, 0.02)' },
          ]),
        },
        data: trendData?.userTrend?.data || [],
      },
      {
        name: '新增提问',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 4,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(139, 92, 246, 0.35)' },
            { offset: 1, color: 'rgba(139, 92, 246, 0.02)' },
          ]),
        },
        data: trendData?.questionTrend?.data || [],
      },
    ],
  });
}

function renderPie(chartRef, instanceKey, data, title) {
  const el = chartRef.value;
  if (!el) return;

  let chart = instanceKey === 'question' ? questionPie
    : instanceKey === 'feedback' ? feedbackPie
      : gradePie;

  if (!chart || chart.isDisposed()) {
    chart = echarts.init(el);
    if (instanceKey === 'question') questionPie = chart;
    else if (instanceKey === 'feedback') feedbackPie = chart;
    else gradePie = chart;
  }

  const seriesData = (data && data.length) ? data : [{ name: '暂无数据', value: 1 }];

  chart.setOption({
    color: pieColors,
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)', textStyle: { fontSize: 11 } },
    legend: { bottom: 0, type: 'scroll', textStyle: { fontSize: 11 }, itemWidth: 10, itemHeight: 8 },
    series: [{
      name: title,
      type: 'pie',
      radius: ['42%', '68%'],
      center: ['50%', '45%'],
      itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: {
        label: { show: true, fontSize: 14, fontWeight: 'bold' },
      },
      data: seriesData,
    }],
  });
}

async function loadOverview() {
  const res = await getAdminOverview();
  overview.value = res.data || {};
}

async function loadTrends() {
  try {
    const res = await getAdminTrends(trendDays.value);
    await nextTick();
    renderLineChart(res.data);
  } catch (err) {
    console.error('加载趋势失败：', err);
  }
}

async function loadDistribution() {
  try {
    const res = await getAdminDistribution();
    const dist = res.data || {};
    await nextTick();
    renderPie(questionPieRef, 'question', dist.questionStatus, '提问状态');
    renderPie(feedbackPieRef, 'feedback', dist.feedbackTypes, '反馈类型');
    renderPie(gradePieRef, 'grade', dist.userGrades, '年级分布');
  } catch (err) {
    console.error('加载分布失败：', err);
  }
}

function handleResize() {
  lineChart?.resize();
  questionPie?.resize();
  feedbackPie?.resize();
  gradePie?.resize();
}

onMounted(async () => {
  loading.value = true;
  try {
    await loadOverview();
    await Promise.all([loadTrends(), loadDistribution()]);
  } catch (err) {
    console.error('加载统计数据失败：', err);
  } finally {
    loading.value = false;
  }
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  lineChart?.dispose();
  questionPie?.dispose();
  feedbackPie?.dispose();
  gradePie?.dispose();
  lineChart = null;
  questionPie = null;
  feedbackPie = null;
  gradePie = null;
});
</script>

<style scoped>
.admin-overview {
  max-width: 1200px;
}

.stat-cards {
  margin-bottom: 12px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 12px rgba(15, 23, 42, 0.05);
  margin-bottom: 12px;
  border-left: 3px solid var(--accent);
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.08);
}

.stat-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: color-mix(in srgb, var(--accent) 12%, transparent);
  color: var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.2;
}

.stat-label {
  font-size: 12px;
  color: #64748b;
  margin-top: 2px;
}

.stat-sub {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 2px;
}

.chart-row {
  margin-bottom: 12px;
}

.chart-card {
  border-radius: 10px;
  border: none;
  box-shadow: 0 2px 12px rgba(15, 23, 42, 0.05);
  margin-bottom: 12px;
}

.card-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  font-weight: 600;
  font-size: 13px;
  color: #0f172a;
}

.card-title-text {
  font-weight: 600;
  font-size: 13px;
  color: #0f172a;
}

.chart-box {
  height: 240px;
  width: 100%;
}

.chart-box-sm {
  height: 210px;
}
</style>
