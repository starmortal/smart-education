<template>
  <div class="timeline-view">
    <div class="timeline-content">
      <div
        v-for="section in timelineSections"
        :key="section.key"
        class="timeline-section"
        :class="{ 'is-expanded': !isSectionCollapsed(section.key) }"
      >
        <div class="section-header" @click="toggleSection(section.key)">
          <div class="header-indicator">
            <el-icon :class="{ rotated: !isSectionCollapsed(section.key) }">
              <ArrowRight />
            </el-icon>
          </div>
          <span class="section-title">{{ section.label }}</span>
          <span v-if="section.isToday" class="section-badge today">今日</span>
          <span class="section-count">{{ section.plans.length }} 个任务</span>
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
              class="section-empty"
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
import { ref, computed, watch, onMounted } from 'vue';
import { ArrowRight } from '@element-plus/icons-vue';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import PlanCardEnhanced from './PlanCardEnhanced.vue';

dayjs.locale('zh-cn');

const STORAGE_KEY = 'study-plan-timeline-collapsed';

const props = defineProps({
  plans: {
    type: Array,
    required: true
  }
});

const emit = defineEmits(['view-details']);

const collapsedSections = ref({});

function loadCollapsedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('读取时间线展开状态失败', e);
  }
  return {};
}

function saveCollapsedState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(collapsedSections.value));
  } catch (e) {
    console.warn('保存时间线展开状态失败', e);
  }
}

onMounted(() => {
  collapsedSections.value = loadCollapsedState();
});

watch(collapsedSections, saveCollapsedState, { deep: true });

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

    let label = date.format('MM-DD dddd');
    if (isToday) label = '今天';
    else if (isTomorrow) label = '明天';

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
  collapsedSections.value = {
    ...collapsedSections.value,
    [key]: !collapsedSections.value[key]
  };
}

function handleViewDetails(plan) {
  emit('view-details', plan);
}
</script>

<style scoped>
.timeline-view {
  background: transparent;
  padding: 4px 0;
}

.timeline-content {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.timeline-section {
  position: relative;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  cursor: pointer;
  user-select: none;
  background: linear-gradient(180deg, #f6fbf8 0%, #eef6f1 100%);
  border: 1px solid #c8ddd2;
  border-radius: 4px;
  transition: background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.section-header:hover {
  background: linear-gradient(180deg, #f0f8f3 0%, #e6f2eb 100%);
  border-color: #b5d4c0;
  box-shadow: 0 2px 8px rgba(61, 155, 106, 0.08);
}

.timeline-section.is-expanded .section-header {
  border-radius: 4px 4px 0 0;
  border-bottom-color: #d4e8dc;
  background: linear-gradient(180deg, #f2f9f5 0%, #eaf4ef 100%);
}

.header-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  background: #ffffff;
  border: 1px solid #c5ddd0;
  border-radius: 3px;
}

.section-header .el-icon {
  transition: transform 0.25s ease;
  color: #7a9e8a;
  font-size: 13px;
}

.section-header .el-icon.rotated {
  transform: rotate(90deg);
  color: #3d9b6a;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #2f4f3f;
  letter-spacing: 0.3px;
}

.section-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 2px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.section-badge.today {
  background: #e3f3ea;
  color: #2d8a5e;
  border: 1px solid #b8dfc8;
}

.section-count {
  margin-left: auto;
  font-size: 12px;
  color: #6b8f7a;
  font-variant-numeric: tabular-nums;
}

.section-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  background: #f7fbf9;
  border: 1px solid #c8ddd2;
  border-top: none;
  border-radius: 0 0 4px 4px;
}

.section-content :deep(.plan-card-enhanced) {
  background: #ffffff;
  border: 1px solid #d4e8dc;
  border-radius: 4px;
  border-left: 3px solid #3d9b6a;
  box-shadow: 0 1px 4px rgba(45, 138, 94, 0.06);
  padding: 16px 18px;
}

.section-content :deep(.plan-card-enhanced:hover) {
  background: #f5fbf8;
  border-color: #b8d4c4;
  transform: none;
  box-shadow: 0 3px 12px rgba(45, 138, 94, 0.12);
}

.section-content :deep(.plan-card-enhanced.urgency-overdue) {
  border-left-color: #e05c5c;
  background: linear-gradient(to right, #fff8f8 0%, #ffffff 14%);
}

.section-content :deep(.plan-card-enhanced.urgency-urgent) {
  border-left-color: #e08a3c;
  background: linear-gradient(to right, #fffaf5 0%, #ffffff 14%);
}

.section-content :deep(.plan-card-enhanced.urgency-important) {
  border-left-color: #3d9b6a;
}

.section-content :deep(.plan-card-enhanced.urgency-normal) {
  border-left-color: #8fb9a0;
}

.section-content :deep(.plan-title) {
  color: #2c3e36;
}

.section-content :deep(.urgency-text) {
  color: #6b8578;
}

.section-content :deep(.progress-label),
.section-content :deep(.time-info) {
  color: #6b8578;
}

.section-content :deep(.progress-value) {
  color: #2d8a5e;
}

.section-content :deep(.remaining-days.today) {
  background: #fff4e6;
  color: #d48806;
}

.section-content :deep(.remaining-days.overdue) {
  background: #fff1f0;
  color: #e05c5c;
}

.section-content :deep(.el-progress-bar__outer) {
  background: #e8f2ec;
}

.section-empty :deep(.el-empty__description) {
  color: #8aa898;
}

.section-content-enter-active,
.section-content-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
  overflow: hidden;
}

.section-content-enter-from,
.section-content-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
