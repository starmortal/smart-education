<template>
  <div class="knowledge-graph">
    <div class="graph-header">
      <h3 class="graph-title">🕸️ 知识图谱</h3>
      <div class="header-actions">
        <el-button 
          size="small"
          :icon="Refresh"
          @click="refreshGraph"
        >
          刷新
        </el-button>
        <el-button 
          size="small"
          :icon="List"
          @click="switchToList"
        >
          切换到列表视图
        </el-button>
      </div>
    </div>

    <div class="graph-content" v-loading="loading">
      <div ref="chartRef" class="chart-container"></div>
      
      <div class="ai-diagnosis">
        <div class="diagnosis-header">
          <el-icon><TrendCharts /></el-icon>
          <span>🤖 AI诊断</span>
        </div>
        <div class="diagnosis-content">
          <div class="diagnosis-item">
            <div class="item-label">核心问题：</div>
            <div class="item-value">{{ diagnosis.coreIssue }}</div>
          </div>
          <div class="diagnosis-item">
            <div class="item-label">根本原因：</div>
            <div class="item-value">{{ diagnosis.rootCause }}</div>
          </div>
          <div class="diagnosis-item">
            <div class="item-label">学习路径：</div>
            <div class="item-value">{{ diagnosis.learningPath }}</div>
          </div>
          <div class="diagnosis-item">
            <div class="item-label">预计突破：</div>
            <div class="item-value">{{ diagnosis.estimatedTime }}</div>
          </div>
        </div>
        <div class="diagnosis-actions">
          <el-button type="primary" size="small" :icon="Document">
            查看详情
          </el-button>
          <el-button size="small" :icon="ChatDotRound">
            AI讲解
          </el-button>
          <el-button size="small" :icon="Edit">
            专项练习
          </el-button>
        </div>
      </div>
    </div>

    <div class="weak-points-section">
      <div class="section-header">
        <h4>📊 薄弱知识点排行</h4>
      </div>
      <div class="weak-points-list">
        <div 
          v-for="(point, index) in weakPoints" 
          :key="index"
          class="weak-point-item"
        >
          <div class="point-rank">{{ index + 1 }}</div>
          <div class="point-info">
            <div class="point-name">{{ point.name }}</div>
            <div class="point-progress">
              <el-progress
                :percentage="point.masteryLevel"
                :stroke-width="8"
                :color="getProgressColor(point.masteryLevel)"
              >
                <template #default="{ percentage }">
                  <span class="progress-text">{{ percentage }}%掌握</span>
                </template>
              </el-progress>
            </div>
            <div class="point-meta">
              <el-tag size="small" type="danger">{{ point.errorCount }}题</el-tag>
            </div>
          </div>
          <div class="point-actions">
            <el-button size="small" :icon="Document" @click="viewErrors(point)">
              查看错题
            </el-button>
            <el-button size="small" :icon="ChatDotRound" @click="aiExplain(point)">
              AI讲解
            </el-button>
            <el-button size="small" :icon="Edit" @click="practice(point)">
              专项练习
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { 
  Refresh, 
  List, 
  TrendCharts, 
  Document, 
  ChatDotRound, 
  Edit 
} from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import * as echarts from 'echarts';
import axios from 'axios';

const props = defineProps({
  userId: {
    type: String,
    required: true
  },
  errors: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['switch-to-list', 'view-errors', 'ai-explain', 'practice']);

const chartRef = ref(null);
const loading = ref(false);
let chartInstance = null;

const diagnosis = ref({
  coreIssue: '',
  rootCause: '',
  learningPath: '',
  estimatedTime: ''
});

const weakPoints = ref([]);

// 初始化图表
function initChart() {
  if (!chartRef.value) return;
  
  chartInstance = echarts.init(chartRef.value);
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: function(params) {
        if (params.dataType === 'node') {
          return `${params.name}<br/>错题数：${params.value}`;
        } else {
          return `${params.data.source} → ${params.data.target}`;
        }
      }
    },
    series: [
      {
        type: 'graph',
        layout: 'force',
        symbolSize: function(value) {
          return Math.sqrt(value) * 10 + 20;
        },
        roam: true,
        label: {
          show: true,
          fontSize: 12
        },
        edgeSymbol: ['circle', 'arrow'],
        edgeSymbolSize: [4, 10],
        edgeLabel: {
          fontSize: 10
        },
        data: [],
        links: [],
        categories: [
          { name: '主知识点', itemStyle: { color: '#f56c6c' } },
          { name: '子知识点', itemStyle: { color: '#e6a23c' } },
          { name: '已掌握', itemStyle: { color: '#67c23a' } }
        ],
        force: {
          repulsion: 200,
          edgeLength: [50, 100]
        },
        lineStyle: {
          color: 'source',
          curveness: 0.3
        }
      }
    ]
  };
  
  chartInstance.setOption(option);
  
  // 监听点击事件
  chartInstance.on('click', function(params) {
    if (params.dataType === 'node') {
      ElMessage.info(`点击了知识点：${params.name}`);
      // 可以触发查看该知识点的错题
    }
  });
  
  // 响应式
  window.addEventListener('resize', handleResize);
}

// 处理窗口大小变化
function handleResize() {
  if (chartInstance) {
    chartInstance.resize();
  }
}

// 加载图谱数据
async function loadGraphData() {
  loading.value = true;
  
  try {
    const response = await axios.get(
      `http://localhost:3001/api/error-book/knowledge-graph/${props.userId}`,
      { timeout: 10000 }
    );
    
    const data = response.data?.data || response.data;
    
    if (data.nodes && data.links) {
      updateChart(data.nodes, data.links);
      weakPoints.value = data.weakPoints || [];
      
      // 获取AI诊断
      await fetchAIDiagnosis(data.weakPoints);
    } else {
      // 降级方案：从错题列表生成图谱数据
      generateGraphFromErrors();
    }
    
  } catch (error) {
    console.error('加载知识图谱失败：', error);
    // 降级方案
    generateGraphFromErrors();
  } finally {
    loading.value = false;
  }
}

// 从错题列表生成图谱数据
function generateGraphFromErrors() {
  const knowledgeMap = {};
  const subjectMap = {};
  
  // 统计每个科目和知识点的错题数
  props.errors.forEach(error => {
    const subject = error.subject || 'unknown';
    const subjectName = getSubjectText(subject);
    
    if (!subjectMap[subject]) {
      subjectMap[subject] = {
        name: subjectName,
        count: 0,
        category: 0
      };
    }
    subjectMap[subject].count++;
    
    // 这里可以根据题型或其他信息生成子知识点
    const type = error.questionType || 'unknown';
    const typeName = getTypeText(type);
    const key = `${subject}-${type}`;
    
    if (!knowledgeMap[key]) {
      knowledgeMap[key] = {
        name: `${subjectName}-${typeName}`,
        value: 0,
        category: 1,
        parent: subject
      };
    }
    knowledgeMap[key].value++;
  });
  
  // 生成节点和连线
  const nodes = [
    ...Object.values(subjectMap).map(item => ({
      name: item.name,
      value: item.count,
      symbolSize: Math.sqrt(item.count) * 15 + 30,
      category: item.category
    })),
    ...Object.values(knowledgeMap).map(item => ({
      name: item.name,
      value: item.value,
      symbolSize: Math.sqrt(item.value) * 10 + 20,
      category: item.category
    }))
  ];
  
  const links = Object.values(knowledgeMap).map(item => ({
    source: getSubjectText(item.parent),
    target: item.name
  }));
  
  updateChart(nodes, links);
  
  // 生成薄弱知识点列表
  weakPoints.value = Object.values(subjectMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map(item => ({
      name: item.name,
      errorCount: item.count,
      masteryLevel: Math.max(0, 100 - item.count * 10)
    }));
  
  // 生成默认诊断
  if (weakPoints.value.length > 0) {
    const topWeak = weakPoints.value[0];
    diagnosis.value = {
      coreIssue: `${topWeak.name}掌握不足（${topWeak.errorCount}道错题）`,
      rootCause: '基础知识点理解不够深入，需要系统复习',
      learningPath: '基础概念 → 典型例题 → 综合应用',
      estimatedTime: `完成${topWeak.errorCount * 2}道练习题，约需${Math.ceil(topWeak.errorCount / 3)}天`
    };
  }
}

// 更新图表
function updateChart(nodes, links) {
  if (!chartInstance) return;
  
  chartInstance.setOption({
    series: [{
      data: nodes,
      links: links
    }]
  });
}

// 获取AI诊断
async function fetchAIDiagnosis(weakPoints) {
  if (!weakPoints || weakPoints.length === 0) return;
  
  try {
    const topWeak = weakPoints[0];
    const response = await axios.post('http://localhost:3001/api/ai/text-answer', {
      prompt: `学生在${topWeak.name}上有${topWeak.errorCount}道错题。请分析：1.核心问题 2.根本原因 3.学习路径 4.预计突破时间。每项不超过20字。`
    });
    
    const answer = response.data?.data?.answer || '';
    const lines = answer.split('\n').filter(line => line.trim());
    
    diagnosis.value = {
      coreIssue: lines[0] || `${topWeak.name}掌握不足`,
      rootCause: lines[1] || '基础知识理解不够深入',
      learningPath: lines[2] || '基础 → 例题 → 应用',
      estimatedTime: lines[3] || `约需${Math.ceil(topWeak.errorCount / 3)}天`
    };
    
  } catch (error) {
    console.error('获取AI诊断失败：', error);
  }
}

// 刷新图谱
function refreshGraph() {
  loadGraphData();
}

// 切换到列表视图
function switchToList() {
  emit('switch-to-list');
}

// 查看错题
function viewErrors(point) {
  emit('view-errors', point);
}

// AI讲解
function aiExplain(point) {
  emit('ai-explain', point);
}

// 专项练习
function practice(point) {
  emit('practice', point);
}

// 获取进度条颜色
function getProgressColor(percentage) {
  if (percentage >= 80) return '#67c23a';
  if (percentage >= 50) return '#e6a23c';
  return '#f56c6c';
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

onMounted(async () => {
  await nextTick();
  initChart();
  loadGraphData();
});

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.dispose();
    chartInstance = null;
  }
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
.knowledge-graph {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.graph-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid #f0f0f0;
}

.graph-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.graph-content {
  margin-bottom: 20px;
}

.chart-container {
  width: 100%;
  height: 500px;
  border-radius: 8px;
  background: #f5f7fa;
}

.ai-diagnosis {
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  border-radius: 8px;
  padding: 16px;
  margin-top: 20px;
}

.diagnosis-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
}

.diagnosis-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.diagnosis-item {
  display: flex;
  gap: 8px;
}

.item-label {
  font-size: 14px;
  font-weight: 600;
  color: #666;
  min-width: 80px;
}

.item-value {
  font-size: 14px;
  color: #333;
  flex: 1;
}

.diagnosis-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.weak-points-section {
  margin-top: 20px;
}

.section-header h4 {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 16px 0;
}

.weak-points-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.weak-point-item {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.3s ease;
}

.weak-point-item:hover {
  background: #e3f2fd;
  transform: translateX(4px);
}

.point-rank {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 600;
  flex-shrink: 0;
}

.point-info {
  flex: 1;
  min-width: 0;
}

.point-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.point-progress {
  margin-bottom: 8px;
}

.progress-text {
  font-size: 12px;
  color: #666;
}

.point-meta {
  display: flex;
  gap: 8px;
}

.point-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .chart-container {
    height: 300px;
  }
  
  .weak-point-item {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .point-actions {
    width: 100%;
    flex-direction: column;
  }
  
  .point-actions :deep(.el-button) {
    width: 100%;
  }
  
  .diagnosis-actions {
    flex-direction: column;
  }
  
  .diagnosis-actions :deep(.el-button) {
    width: 100%;
  }
}
</style>
