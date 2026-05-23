<template>
  <div class="timeline-view">
    <div class="timeline-header">
      <h3 class="timeline-title">📅 时间轴视图</h3>
      <div class="view-tabs">
        <el-button 
          :type="activeView === 'today' ? 'primary' : ''" 
          size="small"
          @click="activeView = 'today'"
        >
          今天
        </el-button>
        <el-button 
          :type="activeView === 'week' ? 'primary' : ''" 
          size="small"
          @click="activeView = 'week'"
        >
          本周
        </el-button>
        <el-button 
          :type="activeView === 'month' ? 'primary' : ''" 
          size="small"
          @click="activeView = 'month'"
        >
          本月
        </el-button>
      </div>
    </div>

    <div class="timeline-content">
      <!-- 今天 -->
      <div v-if="timelineData.today.length > 0 || activeView === 'today'" class="timeline-section">
        <div class="section-header" @click="toggleSection('today')">
          <el-icon :class="{ rotated: !collapsedSections.today }">
            <ArrowRight />
          </el-icon>
          <span class="section-title">▼ 今天 {{ formatDate(new Date()) }}</span>
          <el-tag size="small" type="primary">{{ timelineData.today.length }}个任务</el-tag>
        </div>
        
        <transition name="section-content">
          <div v-show="!collapsedSections.today" class="section-content">
            <plan-card-enhanced
              v-for="plan in timelineData.today"
              :key="plan.id"
              :plan="plan"
              @start-learning="handleStartLearning"
              @view-details="handleViewDetails"
              @adjust-plan="handleAdjustPlan"
            />
            <el-empty 
              v-if="timelineData.today.length === 0" 
              description="今天暂无学习任务"
              :image-size="80"
            />
          </div>
        </transition>
      </div>

      <!-- 明天 -->
      <div v-if="timelineData.tomorrow.length > 0 || activeView === 'week'" class="timeline-section">
        <div class="section-header" @click="toggleSection('tomorrow')">
          <el-icon :class="{ rotated: !collapsedSections.tomorrow }">
            <ArrowRight />
          </el-icon>
          <span class="section-title">▼ 明天 {{ formatDate(getTomorrow()) }}</span>
          <el-tag size="small" type="info">{{ timelineData.tomorrow.length }}个任务</el-tag>
        </div>
        
        <transition name="section-content">
          <div v-show="!collapsedSections.tomorrow" class="section-content">
            <plan-card-enhanced
              v-for="plan in timelineData.tomorrow"
              :key="plan.id"
              :plan="plan"
              @start-learning="handleStartLearning"
              @view-details="handleViewDetails"
              @adjust-plan="handleAdjustPlan"
            />
            <el-empty 
              v-if="timelineData.tomorrow.length === 0" 
              description="明天暂无学习任务"
              :image-size="80"
            />
          </div>
        </transition>
      </div>

      <!-- 本周 -->
      <div v-if="(timelineData.thisWeek.length > 0 || activeView === 'week') && activeView !== 'today'" class="timeline-section">
        <div class="section-header" @click="toggleSection('thisWeek')">
          <el-icon :class="{ rotated: !collapsedSections.thisWeek }">
            <ArrowRight />
          </el-icon>
          <span class="section-title">▼ 本周其他</span>
          <el-tag size="small" type="success">{{ timelineData.thisWeek.length }}个任务</el-tag>
        </div>
        
        <transition name="section-content">
          <div v-show="!collapsedSections.thisWeek" class="section-content">
            <plan-card-enhanced
              v-for="plan in timelineData.thisWeek"
              :key="plan.id"
              :plan="plan"
              @start-learning="handleStartLearning"
              @view-details="handleViewDetails"
              @adjust-plan="handleAdjustPlan"
            />
          </div>
        </transition>
      </div>

      <!-- 本周概览 -->
      <div v-if="activeView === 'week' || activeView === 'month'" class="timeline-section">
        <div class="section-header">
          <span class="section-title">▼ 本周概览</span>
        </div>
        
        <div class="section-content">
          <weekly-summary :plans="allPlans" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { ArrowRight } from '@element-plus/icons-vue';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import PlanCardEnhanced from './PlanCardEnhanced.vue';
import WeeklySummary from './WeeklySummary.vue';

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

const props = defineProps({
  plans: {
    type: Array,
    required: true
  }
});

const emit = defineEmits(['start-learning', 'view-details', 'adjust-plan']);

const activeView = ref('today');
const collapsedSections = ref({
  today: false,
  tomorrow: false,
  thisWeek: false
});

// 所有计划
const allPlans = computed(() => props.plans);

// 时间轴数据分组
const timelineData = computed(() => {
  const today = dayjs().startOf('day');
  const tomorrow = dayjs().add(1, 'day').startOf('day');
  const weekEnd = dayjs().endOf('week');
  
  return {
    today: props.plans.filter(plan => 
      dayjs(plan.startTime).isSame(today, 'day') || 
      (plan.planStatus === 'in_progress' && dayjs(plan.startTime).isBefore(today))
    ),
    tomorrow: props.plans.filter(plan => 
      dayjs(plan.startTime).isSame(tomorrow, 'day')
    ),
    thisWeek: props.plans.filter(plan => {
      const planDate = dayjs(plan.startTime);
      return planDate.isAfter(tomorrow) && planDate.isSameOrBefore(weekEnd);
    })
  };
});

// 切换折叠状态
function toggleSection(section) {
  collapsedSections.value[section] = !collapsedSections.value[section];
}

// 格式化日期
function formatDate(date) {
  return dayjs(date).format('YYYY-MM-DD (ddd)');
}

// 获取明天日期
function getTomorrow() {
  return dayjs().add(1, 'day').toDate();
}

// 事件处理
function handleStartLearning(plan) {
  emit('start-learning', plan);
}

function handleViewDetails(plan) {
  emit('view-details', plan);
}

function handleAdjustPlan(plan) {
  emit('adjust-plan', plan);
}
</script>

<style scoped>
.timeline-view {
  background: white;
  border-radius: 8px;
  padding: 20px;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid #f0f0f0;
}

.timeline-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.view-tabs {
  display: flex;
  gap: 8px;
}

.timeline-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.timeline-section {
  border-left: 3px solid #409eff;
  padding-left: 20px;
  position: relative;
}

.timeline-section::before {
  content: '';
  position: absolute;
  left: -7px;
  top: 8px;
  width: 11px;
  height: 11px;
  background: #409eff;
  border-radius: 50%;
  border: 3px solid white;
  box-shadow: 0 0 0 2px #409eff;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  cursor: pointer;
  user-select: none;
}

.section-header:hover {
  opacity: 0.8;
}

.section-header .el-icon {
  transition: transform 0.3s ease;
  color: #409eff;
}

.section-header .el-icon.rotated {
  transform: rotate(90deg);
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.section-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-content-enter-active,
.section-content-leave-active {
  transition: all 0.3s ease;
}

.section-content-enter-from,
.section-content-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .timeline-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .view-tabs {
    width: 100%;
  }
  
  .view-tabs :deep(.el-button) {
    flex: 1;
  }
}
</style>
