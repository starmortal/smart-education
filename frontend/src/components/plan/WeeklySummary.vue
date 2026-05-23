<template>
  <div class="weekly-summary">
    <div class="summary-header">
      <h4>📊 本周学习统计</h4>
    </div>

    <div class="summary-content">
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-icon" style="background: #409eff;">
            <el-icon><Document /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-label">总计划数</div>
            <div class="stat-value">{{ stats.totalCount }}个</div>
          </div>
        </div>

        <div class="stat-item">
          <div class="stat-icon" style="background: #67c23a;">
            <el-icon><Check /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-label">已完成</div>
            <div class="stat-value">{{ stats.completedCount }}个</div>
          </div>
        </div>

        <div class="stat-item">
          <div class="stat-icon" style="background: #e6a23c;">
            <el-icon><Clock /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-label">进行中</div>
            <div class="stat-value">{{ stats.inProgressCount }}个</div>
          </div>
        </div>

        <div class="stat-item">
          <div class="stat-icon" style="background: #909399;">
            <el-icon><Calendar /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-label">平均进度</div>
            <div class="stat-value">{{ stats.averageProgress }}%</div>
          </div>
        </div>
      </div>

      <div class="ai-weekly-report">
        <div class="report-icon">🤖</div>
        <div class="report-content">
          <div class="report-title">AI周报</div>
          <div class="report-text">{{ aiWeeklyReport }}</div>
        </div>
      </div>

      <div v-if="stats.totalCount > 0" class="progress-chart">
        <div class="chart-title">完成率</div>
        <el-progress
          type="circle"
          :percentage="completionRate"
          :width="120"
          :stroke-width="10"
          :color="progressColors"
        >
          <template #default="{ percentage }">
            <span class="percentage-value">{{ percentage }}%</span>
            <span class="percentage-label">完成率</span>
          </template>
        </el-progress>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue';
import { Document, Check, Clock, Calendar } from '@element-plus/icons-vue';
import axios from 'axios';

const props = defineProps({
  plans: {
    type: Array,
    required: true
  }
});

const aiWeeklyReport = ref('');

// 统计数据
const stats = computed(() => {
  const total = props.plans.length;
  const completed = props.plans.filter(p => p.planStatus === 'completed').length;
  const inProgress = props.plans.filter(p => p.planStatus === 'in_progress').length;
  const totalProgress = props.plans.reduce((sum, p) => sum + (p.progress || 0), 0);
  const average = total > 0 ? Math.round(totalProgress / total) : 0;
  
  return {
    totalCount: total,
    completedCount: completed,
    inProgressCount: inProgress,
    averageProgress: average
  };
});

// 完成率
const completionRate = computed(() => {
  if (stats.value.totalCount === 0) return 0;
  return Math.round((stats.value.completedCount / stats.value.totalCount) * 100);
});

// 进度条颜色
const progressColors = [
  { color: '#f56c6c', percentage: 30 },
  { color: '#e6a23c', percentage: 60 },
  { color: '#67c23a', percentage: 100 }
];

// 获取AI周报
async function fetchAIWeeklyReport() {
  try {
    const response = await axios.post('http://localhost:3001/api/ai/text-answer', {
      prompt: `本周学习统计：总计划${stats.value.totalCount}个，已完成${stats.value.completedCount}个，完成率${completionRate.value}%。请用一句鼓励的话（不超过30字）总结本周学习情况。`
    });
    
    const answer = response.data?.data?.answer || '';
    aiWeeklyReport.value = answer || `本周完成率${completionRate.value}%，继续保持！`;
    
  } catch (error) {
    console.error('获取AI周报失败：', error);
    // 降级方案
    if (completionRate.value >= 80) {
      aiWeeklyReport.value = `本周完成率${completionRate.value}%，表现优秀！继续加油！`;
    } else if (completionRate.value >= 50) {
      aiWeeklyReport.value = `本周完成率${completionRate.value}%，还不错！再接再厉！`;
    } else {
      aiWeeklyReport.value = `本周完成率${completionRate.value}%，下周一起努力！`;
    }
  }
}

onMounted(() => {
  if (stats.value.totalCount > 0) {
    fetchAIWeeklyReport();
  } else {
    aiWeeklyReport.value = '本周暂无学习计划，快去制定新计划吧！';
  }
});
</script>

<style scoped>
.weekly-summary {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 12px;
  padding: 20px;
}

.summary-header h4 {
  margin: 0 0 20px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.summary-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

.stat-item {
  background: white;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
}

.stat-info {
  flex: 1;
}

.stat-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.ai-weekly-report {
  background: white;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  gap: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.report-icon {
  font-size: 32px;
  line-height: 1;
}

.report-content {
  flex: 1;
}

.report-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.report-text {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
}

.progress-chart {
  background: white;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.chart-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.percentage-value {
  display: block;
  font-size: 24px;
  font-weight: 600;
  color: #409eff;
}

.percentage-label {
  display: block;
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
