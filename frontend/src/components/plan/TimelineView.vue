<template>
  <div class="timeline-view">
    <div class="timeline-content">
      <div
        v-for="section in timelineSections"
        :key="section.key"
        class="timeline-section"
      >
        <div class="section-header" @click="toggleSection(section.key)">
          <el-icon :class="{ rotated: !isSectionCollapsed(section.key) }">
            <ArrowRight />
          </el-icon>
          <span class="section-title">{{ section.label }}</span>
          <el-tag size="small" :type="section.isToday ? 'primary' : 'info'">
            {{ section.plans.length }}个任务
          </el-tag>
        </div>

        <transition name="section-content">
          <div v-show="!isSectionCollapsed(section.key)" class="section-content">
            <plan-card-enhanced
              v-for="plan in section.plans"
              :key="plan.id"
              :plan="plan"
              @view-details="handleViewDetails"
            />
            <el-empty
              v-if="section.plans.length === 0"
              :description="section.emptyText"
              :image-size="80"
            />
          </div>
        </transition>
      </div>

      <el-empty
        v-if="timelineSections.length === 0"
        description="暂无学习计划"
        :image-size="100"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { ArrowRight } from '@element-plus/icons-vue';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import PlanCardEnhanced from './PlanCardEnhanced.vue';

dayjs.locale('zh-cn');

const props = defineProps({
  plans: {
    type: Array,
    required: true
  }
});

const emit = defineEmits(['view-details']);

const collapsedSections = ref({});

/** 计划归属日期：进行中且已开始于过去的计划归入今天 */
function getPlanAnchorDate(plan) {
  const today = dayjs().startOf('day');
  const start = dayjs(plan.startTime).startOf('day');

  if (plan.planStatus === 'in_progress' && start.isBefore(today)) {
    return today;
  }
  return start;
}

const timelineSections = computed(() => {
  const today = dayjs().startOf('day');
  const tomorrow = today.add(1, 'day');
  const todayKey = today.format('YYYY-MM-DD');
  const tomorrowKey = tomorrow.format('YYYY-MM-DD');
  const groupMap = new Map();

  props.plans.forEach((plan) => {
    const anchor = getPlanAnchorDate(plan);
    const key = anchor.format('YYYY-MM-DD');
    if (!groupMap.has(key)) {
      groupMap.set(key, []);
    }
    groupMap.get(key).push(plan);
  });

  // 固定「今天」「明天」两个日历分组，之后仅展示有计划的更晚日期
  const laterKeys = Array.from(groupMap.keys())
    .filter((key) => key > tomorrowKey)
    .sort();

  const sectionKeys = [todayKey, tomorrowKey, ...laterKeys];

  return sectionKeys.map((key) => {
    const date = dayjs(key);
    const isToday = key === todayKey;
    const isTomorrow = key === tomorrowKey;
    const plans = (groupMap.get(key) || [])
      .slice()
      .sort((a, b) => dayjs(a.startTime).valueOf() - dayjs(b.startTime).valueOf());

    let label = date.format('MM-DD (ddd)');
    if (isToday) label = '今天';
    let emptyText = `${date.format('MM-DD')} 暂无学习任务`;
    if (isToday) emptyText = '今天暂无学习任务';
    else if (isTomorrow) emptyText = '明天暂无学习任务';

    return {
      key,
      isToday,
      label,
      plans,
      emptyText
    };
  });
});

function isSectionCollapsed(key) {
  return collapsedSections.value[key] === true;
}

function toggleSection(key) {
  collapsedSections.value[key] = !collapsedSections.value[key];
}

function handleViewDetails(plan) {
  emit('view-details', plan);
}
</script>

<style scoped>
.timeline-view {
  background: white;
  border-radius: 8px;
  padding: 20px;
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
</style>
