<template>
  <div class="ai-assistant-panel" :class="{ collapsed: isCollapsed }">
    <!-- 顶栏：与左侧筛选区同高，含折叠按钮 -->
    <div class="panel-header-bar">
      <el-button
        :icon="isCollapsed ? DArrowLeft : DArrowRight"
        circle
        size="small"
        @click="toggleCollapse"
      />
      <div v-show="!isCollapsed" class="panel-header-title">
        <div class="ai-icon-wrapper">
          <el-icon :size="20" class="ai-icon"><MagicStick /></el-icon>
        </div>
        <span class="panel-title">AI 学习助手</span>
      </div>
    </div>

    <!-- 面板内容 -->
    <div class="panel-body" v-show="!isCollapsed">
      <!-- 智能推荐 -->
      <div class="panel-section">
        <div class="section-title">
          <el-icon><TrendCharts /></el-icon>
          <span>智能推荐</span>
        </div>
        <div v-loading="loadingRecommend" class="recommend-list">
          <div
            v-for="(question, index) in recommendedQuestions.slice(0, 3)"
            :key="question._id || question.id"
            class="recommend-item"
            @click="$emit('questionClick', question._id || question.id)"
          >
            <div class="recommend-index">{{ index + 1 }}</div>
            <div class="recommend-content">
              <div class="recommend-title">{{ question.title }}</div>
              <div class="recommend-reason" v-if="question.recommendReason">{{ question.recommendReason }}</div>
            </div>
          </div>
          <div v-if="recommendedQuestions.length === 0 && !loadingRecommend" class="empty-hint">
            暂无推荐
          </div>
        </div>
      </div>

      <!-- 今日学习建议 -->
      <div class="panel-section">
        <div class="section-title">
          <el-icon><Aim /></el-icon>
          <span>今日建议</span>
        </div>
        <div v-loading="loadingAdvice" class="advice-content">
          <div v-if="learningAdvice" class="advice-summary">
            {{ learningAdvice.summary }}
          </div>
          <ul v-if="learningAdvice && learningAdvice.suggestions" class="advice-list">
            <li v-for="(suggestion, index) in learningAdvice.suggestions" :key="index">
              {{ suggestion }}
            </li>
          </ul>
        </div>
      </div>

      <!-- 热门话题 -->
      <div class="panel-section">
        <div class="section-title">
          <el-icon><Histogram /></el-icon>
          <span>热门话题</span>
        </div>
        <div v-loading="loadingTopics" class="topics-list">
          <div
            v-for="topic in hotTopics.slice(0, 8)"
            :key="topic.tag"
            class="topic-item"
            @click="$emit('topicClick', topic.tag)"
          >
            <span class="topic-tag">#{{ topic.tag }}</span>
            <span class="topic-count">{{ topic.count }}</span>
          </div>
        </div>
      </div>

      <!-- 社区动态 -->
      <div class="panel-section">
        <div class="section-title">
          <el-icon><DataAnalysis /></el-icon>
          <span>社区动态</span>
        </div>
        <div v-loading="loadingStats" class="stats-content">
          <div v-if="communityStats" class="stats-grid">
            <div class="stats-item">
              <div class="stats-value">{{ communityStats.todayQuestions }}</div>
              <div class="stats-label">今日新增</div>
            </div>
            <div class="stats-item">
              <div class="stats-value">{{ communityStats.solveRate }}%</div>
              <div class="stats-label">解决率</div>
            </div>
            <div class="stats-item">
              <div class="stats-value">{{ communityStats.activeUsers }}</div>
              <div class="stats-label">活跃用户</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import {
  MagicStick, TrendCharts, Aim, Histogram, DataAnalysis,
  DArrowLeft, DArrowRight
} from '@element-plus/icons-vue';
import axios from 'axios';

const emit = defineEmits(['questionClick', 'topicClick', 'update:collapsed']);

const isCollapsed = ref(false);
const userId = localStorage.getItem('edu-user-id') || '';

const recommendedQuestions = ref([]);
const learningAdvice = ref(null);
const hotTopics = ref([]);
const communityStats = ref(null);

const loadingRecommend = ref(false);
const loadingAdvice = ref(false);
const loadingTopics = ref(false);
const loadingStats = ref(false);

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value;
  emit('update:collapsed', isCollapsed.value);
};

const loadRecommendations = async () => {
  loadingRecommend.value = true;
  try {
    const res = await axios.get('http://localhost:3001/api/ai/recommend-questions', {
      params: { userId }
    });
    recommendedQuestions.value = res.data.data || [];
  } catch (error) {
    console.error('加载推荐失败：', error);
  } finally {
    loadingRecommend.value = false;
  }
};

const loadAdvice = async () => {
  loadingAdvice.value = true;
  try {
    const res = await axios.get('http://localhost:3001/api/ai/learning-advice', {
      params: { userId }
    });
    learningAdvice.value = res.data.data;
  } catch (error) {
    console.error('加载学习建议失败：', error);
  } finally {
    loadingAdvice.value = false;
  }
};

const loadHotTopics = async () => {
  loadingTopics.value = true;
  try {
    const res = await axios.get('http://localhost:3001/api/ai/hot-topics');
    hotTopics.value = res.data.data || [];
  } catch (error) {
    console.error('加载热门话题失败：', error);
  } finally {
    loadingTopics.value = false;
  }
};

const loadStats = async () => {
  loadingStats.value = true;
  try {
    const res = await axios.get('http://localhost:3001/api/ai/community-stats');
    communityStats.value = res.data.data;
  } catch (error) {
    console.error('加载社区统计失败：', error);
  } finally {
    loadingStats.value = false;
  }
};

onMounted(() => {
  loadRecommendations();
  loadAdvice();
  loadHotTopics();
  loadStats();
});

defineExpose({
  refresh: () => {
    loadRecommendations();
    loadAdvice();
    loadHotTopics();
    loadStats();
  }
});
</script>

<style scoped>
.ai-assistant-panel {
  --panel-width: 320px;
  --collapsed-visible: 56px;
  position: fixed;
  right: 0;
  top: 0;
  bottom: 0;
  width: var(--panel-width);
  background: #fff;
  border-left: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  z-index: 100;
  transition: transform 0.3s ease;
  box-sizing: border-box;
}

.ai-assistant-panel.collapsed {
  transform: translateX(calc(var(--panel-width) - var(--collapsed-visible)));
}

.panel-header-bar {
  flex-shrink: 0;
  height: 56px;
  padding: 0 16px;
  border-bottom: 1px solid #e4e7ed;
  background: #fff;
  display: flex;
  align-items: center;
  gap: 12px;
  box-sizing: border-box;
}

.panel-header-title {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex: 1;
}

.ai-icon-wrapper {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.ai-icon {
  color: white;
}

.panel-title {
  font-size: 15px;
  font-weight: 600;
  color: #2c3e50;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  background: #fafafa;
  box-sizing: border-box;
}

.panel-body::-webkit-scrollbar {
  width: 4px;
}

.panel-body::-webkit-scrollbar-thumb {
  background: #dcdfe6;
  border-radius: 2px;
}

.panel-section {
  margin-bottom: 16px;
}

.panel-section:last-child {
  margin-bottom: 0;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 12px;
}

.recommend-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.recommend-item {
  display: flex;
  gap: 10px;
  padding: 12px;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.recommend-item:hover {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%);
  transform: translateX(4px);
}

.recommend-index {
  width: 24px;
  height: 24px;
  background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%);
  color: white;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.recommend-content {
  flex: 1;
  min-width: 0;
}

.recommend-title {
  font-size: 13px;
  font-weight: 500;
  color: #1a1a1a;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recommend-reason {
  font-size: 11px;
  color: #8b5cf6;
}

.advice-content {
  padding: 12px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.advice-summary {
  font-size: 13px;
  color: #374151;
  margin-bottom: 8px;
  line-height: 1.6;
}

.advice-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.advice-list li {
  font-size: 12px;
  color: #6b7280;
  padding: 4px 0;
  padding-left: 16px;
  position: relative;
}

.advice-list li::before {
  content: '•';
  position: absolute;
  left: 4px;
  color: #3b82f6;
}

.topics-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.topic-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #fff;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.topic-item:hover {
  background: #e8f4ff;
  transform: translateY(-2px);
}

.topic-tag {
  font-size: 12px;
  font-weight: 500;
  color: #3b82f6;
}

.topic-count {
  font-size: 11px;
  color: #9ca3af;
}

.stats-content {
  padding: 12px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.stats-item {
  text-align: center;
}

.stats-value {
  font-size: 20px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 4px;
}

.stats-label {
  font-size: 11px;
  color: #6b7280;
}

.empty-hint {
  text-align: center;
  padding: 20px;
  font-size: 13px;
  color: #9ca3af;
}

@media (max-width: 1200px) {
  .ai-assistant-panel {
    display: none;
  }
}
</style>
