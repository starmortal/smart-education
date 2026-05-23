<template>
  <el-drawer
    v-model="visible"
    title="AI 智能制定计划"
    direction="rtl"
    size="540px"
    :close-on-click-modal="false"
    @closed="handleClosed"
  >
    <div class="ai-plan-drawer">
      <div class="section-card">
        <div class="section-header">
          <el-icon class="ai-icon"><MagicStick /></el-icon>
          <span>智能制定</span>
          <el-switch
            v-model="enabled"
            active-text="已开启"
            inactive-text="已关闭"
            style="margin-left: auto"
            @change="persistSettings"
          />
        </div>
        <p class="section-desc">
          可手动生成计划草案，也可开启<strong>定时自动生成</strong>：到点由 AI 生成并写入时间轴，完成后在通知中心提醒并同步邮件。
        </p>
      </div>

      <template v-if="enabled">
        <div class="section-card schedule-card">
          <div class="section-header">
            <span class="section-title">定时自动生成</span>
            <el-switch v-model="form.scheduleEnabled" @change="persistSettings" />
          </div>
          <p class="section-desc">
            开启后，系统将在设定时间自动生成计划并导入，无需手动确认。
          </p>
          <template v-if="form.scheduleEnabled">
            <div class="schedule-row">
              <span class="schedule-label">生成时间</span>
              <el-time-select
                v-model="form.scheduleTime"
                start="06:00"
                step="00:30"
                end="23:30"
                placeholder="选择时间"
                style="width: 140px"
                @change="persistSettings"
              />
            </div>
            <div class="schedule-row">
              <span class="schedule-label">重复规则</span>
              <el-radio-group v-model="form.scheduleFrequency" @change="persistSettings">
                <el-radio label="daily">每天</el-radio>
                <el-radio label="weekly">每周</el-radio>
              </el-radio-group>
            </div>
            <div v-if="form.scheduleFrequency === 'weekly'" class="schedule-row">
              <span class="schedule-label">星期</span>
              <el-select
                v-model="form.scheduleWeekday"
                style="width: 120px"
                @change="persistSettings"
              >
                <el-option
                  v-for="d in weekdayOptions"
                  :key="d.value"
                  :label="d.label"
                  :value="d.value"
                />
              </el-select>
            </div>
            <div class="schedule-row">
              <span class="schedule-label">每次生成</span>
              <el-input-number
                v-model="form.plansPerRun"
                :min="1"
                :max="10"
                size="small"
                @change="persistSettings"
              />
              <span class="schedule-hint">条计划</span>
            </div>
            <p v-if="lastScheduledRunText" class="last-run-text">{{ lastScheduledRunText }}</p>
            <el-button
              type="warning"
              size="small"
              :loading="runningSchedule"
              @click="handleRunScheduleNow"
            >
              立即执行一次
            </el-button>
          </template>
        </div>

        <div class="section-card">
          <div class="section-title">数据来源</div>
          <el-checkbox-group v-model="form.dataSources" class="source-group" @change="persistSettings">
            <el-checkbox
              v-for="item in sourceOptions"
              :key="item.value"
              :label="item.value"
            >
              {{ item.label }}
            </el-checkbox>
          </el-checkbox-group>
        </div>

        <div class="section-card">
          <div class="section-title">计划周期</div>
          <el-radio-group v-model="form.durationDays" @change="persistSettings">
            <el-radio :label="7">7 天</el-radio>
            <el-radio :label="14">14 天</el-radio>
            <el-radio :label="30">30 天</el-radio>
          </el-radio-group>
        </div>

        <div class="section-card">
          <div class="section-title">重点科目（可选）</div>
          <el-select
            v-model="form.focusSubjects"
            multiple
            collapse-tags
            placeholder="不选则 AI 自动判断"
            style="width: 100%"
            @change="persistSettings"
          >
            <el-option
              v-for="opt in subjectOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </div>

        <div class="section-card">
          <div class="section-header">
            <span class="section-title">进度智能调整</span>
            <el-switch v-model="form.autoAdjust" @change="persistSettings" />
          </div>
          <p class="section-desc">开启后，打开面板时自动分析逾期/落后计划并给出补强建议</p>
          <el-button
            size="small"
            :loading="adjusting"
            @click="handleAdjust(false)"
          >
            分析计划进度
          </el-button>
          <el-button
            v-if="adjustResult?.adjustmentPlans?.length"
            size="small"
            type="warning"
            :loading="adjusting"
            @click="handleAdjust(true)"
          >
            应用调整建议
          </el-button>
          <p v-if="adjustResult?.summary" class="adjust-summary">{{ adjustResult.summary }}</p>
        </div>

        <div class="section-card profile-card" v-loading="profileLoading">
          <div class="section-title">学习画像摘要</div>
          <p class="profile-summary">{{ profileSummary || '点击「生成计划草案」后展示 AI 依据' }}</p>
          <div v-if="weakKnowledgePoints.length" class="weak-kp-block">
            <span class="weak-kp-label">薄弱知识点：</span>
            <el-tag
              v-for="item in weakKnowledgePoints"
              :key="item.point"
              size="small"
              type="warning"
              class="kp-tag"
            >
              {{ item.point }} ({{ item.count }})
            </el-tag>
          </div>
          <div v-if="enabledSourceLabels.length" class="source-tags">
            <el-tag
              v-for="label in enabledSourceLabels"
              :key="label"
              size="small"
              type="info"
            >
              {{ label }}
            </el-tag>
          </div>
        </div>

        <div class="action-row">
          <el-button
            type="primary"
            :icon="MagicStick"
            :loading="generating"
            @click="handleGenerate"
          >
            {{ generating ? '生成中...' : '生成计划草案' }}
          </el-button>
          <el-button :loading="profileLoading" @click="loadProfilePreview">
            刷新画像
          </el-button>
        </div>

        <div v-if="streamText || generating" class="section-card stream-card">
          <div class="section-title">AI 生成过程</div>
          <pre class="stream-text">{{ streamText }}<span v-if="generating" class="cursor">|</span></pre>
        </div>

        <div v-if="aiSummary" class="section-card ai-summary-card">
          <div class="section-title">AI 分析</div>
          <p>{{ aiSummary }}</p>
        </div>

        <div v-if="draftPlans.length" class="section-card plans-card">
          <div class="section-header">
            <span class="section-title">计划草案（{{ selectedCount }}/{{ draftPlans.length }}）</span>
            <el-checkbox v-model="selectAll" @change="handleSelectAll">全选</el-checkbox>
          </div>

          <div class="draft-list">
            <div
              v-for="(plan, index) in draftPlans"
              :key="index"
              class="draft-item"
            >
              <el-checkbox v-model="plan.selected" />
              <div class="draft-content">
                <el-input v-model="plan.planTitle" size="small" placeholder="计划标题" />
                <div class="draft-meta">
                  <el-tag size="small">{{ plan.subjectName || getSubjectName(plan.subject) }}</el-tag>
                  <el-tag v-if="plan.priority === 'high'" size="small" type="danger">高优先级</el-tag>
                  <span>{{ plan.startTime }} ~ {{ plan.endTime }}</span>
                </div>
                <p v-if="plan.reason" class="plan-reason">
                  <el-icon><InfoFilled /></el-icon>
                  {{ plan.reason }}
                </p>
                <div v-if="plan.dataSources?.length" class="plan-sources">
                  <el-tag
                    v-for="src in plan.dataSources"
                    :key="src"
                    size="small"
                    type="info"
                    effect="plain"
                  >
                    {{ sourceLabelMap[src] || src }}
                  </el-tag>
                </div>
                <el-input
                  v-model="plan.description"
                  type="textarea"
                  :rows="2"
                  size="small"
                  placeholder="计划描述"
                />
              </div>
            </div>
          </div>

          <el-button
            type="success"
            class="import-btn"
            :loading="importing"
            :disabled="selectedCount === 0"
            @click="handleImport"
          >
            确认导入选中计划（{{ selectedCount }}）
          </el-button>
        </div>
      </template>

      <el-empty
        v-else
        description="开启智能制定后可配置数据来源并生成计划"
        :image-size="80"
      />
    </div>
  </el-drawer>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { MagicStick, InfoFilled } from '@element-plus/icons-vue';
import {
  getLearningProfile,
  previewAiPlansStream,
  confirmAiPlans,
  adjustAiPlans,
  getAiPlanSettings,
  saveAiPlanSettings,
  runScheduleNow,
} from '@/api/studyPlan';
import { generateSubjectOptions, getSubjectName } from '@/utils/userSubjects';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  userId: { type: String, required: true },
  userSubjects: { type: Array, default: () => [] },
});

const emit = defineEmits(['update:modelValue', 'imported']);

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

const enabled = ref(true);
const profileLoading = ref(false);
const generating = ref(false);
const importing = ref(false);
const adjusting = ref(false);
const runningSchedule = ref(false);
const profileSummary = ref('');
const enabledSourceLabels = ref([]);
const weakKnowledgePoints = ref([]);
const aiSummary = ref('');
const streamText = ref('');
const draftPlans = ref([]);
const selectAll = ref(true);
const adjustResult = ref(null);
const settingsLoaded = ref(false);
const lastScheduledRunAt = ref(null);

const weekdayOptions = [
  { label: '周一', value: 1 },
  { label: '周二', value: 2 },
  { label: '周三', value: 3 },
  { label: '周四', value: 4 },
  { label: '周五', value: 5 },
  { label: '周六', value: 6 },
  { label: '周日', value: 7 },
];

const sourceOptions = [
  { label: '个人资料', value: 'profile' },
  { label: '考试成绩', value: 'exam' },
  { label: '错题本', value: 'errorBook' },
  { label: '现有计划', value: 'studyPlan' },
  { label: 'AI 对话', value: 'chat' },
  { label: '学习笔记', value: 'note' },
  { label: '学习社区', value: 'community' },
];

const sourceLabelMap = Object.fromEntries(sourceOptions.map((s) => [s.value, s.label]));

const form = reactive({
  dataSources: sourceOptions.map((s) => s.value),
  durationDays: 7,
  focusSubjects: [],
  autoAdjust: false,
  scheduleEnabled: false,
  scheduleTime: '08:00',
  scheduleFrequency: 'daily',
  scheduleWeekday: 1,
  plansPerRun: 3,
});

const subjectOptions = computed(() => generateSubjectOptions(props.userSubjects));
const selectedCount = computed(() => draftPlans.value.filter((p) => p.selected).length);

const lastScheduledRunText = computed(() => {
  if (!lastScheduledRunAt.value) return '';
  const d = new Date(lastScheduledRunAt.value);
  if (Number.isNaN(d.getTime())) return '';
  return `上次自动执行：${d.toLocaleString('zh-CN')}`;
});

watch(
  () => props.modelValue,
  async (open) => {
    if (open) {
      await loadSettings();
      if (enabled.value) {
        await loadProfilePreview();
        if (form.autoAdjust) {
          await handleAdjust(false);
        }
      }
    }
  }
);

async function loadSettings() {
  if (!props.userId) return;
  try {
    const res = await getAiPlanSettings({ userId: props.userId });
    if (res.code === 200 && res.data) {
      enabled.value = res.data.enabled ?? true;
      form.dataSources = res.data.dataSources?.length
        ? [...res.data.dataSources]
        : sourceOptions.map((s) => s.value);
      form.durationDays = res.data.durationDays ?? 7;
      form.focusSubjects = res.data.focusSubjects || [];
      form.autoAdjust = res.data.autoAdjust ?? false;
      form.scheduleEnabled = res.data.scheduleEnabled ?? false;
      form.scheduleTime = res.data.scheduleTime || '08:00';
      form.scheduleFrequency = res.data.scheduleFrequency || 'daily';
      form.scheduleWeekday = res.data.scheduleWeekday ?? 1;
      form.plansPerRun = res.data.plansPerRun ?? 3;
      lastScheduledRunAt.value = res.data.lastScheduledRunAt || null;
      settingsLoaded.value = true;
    }
  } catch (error) {
    console.error('加载 AI 计划设置失败：', error);
  } finally {
    settingsLoaded.value = true;
  }
}

async function persistSettings() {
  if (!props.userId || !settingsLoaded.value) return;
  try {
    await saveAiPlanSettings({
      userId: props.userId,
      enabled: enabled.value,
      dataSources: form.dataSources,
      durationDays: form.durationDays,
      focusSubjects: form.focusSubjects,
      autoAdjust: form.autoAdjust,
      scheduleEnabled: form.scheduleEnabled,
      scheduleTime: form.scheduleTime,
      scheduleFrequency: form.scheduleFrequency,
      scheduleWeekday: form.scheduleWeekday,
      plansPerRun: form.plansPerRun,
    });
  } catch (error) {
    console.error('保存 AI 计划设置失败：', error);
  }
}

async function loadProfilePreview() {
  if (!props.userId) return;
  profileLoading.value = true;
  try {
    const res = await getLearningProfile({
      userId: props.userId,
      dataSources: form.dataSources.join(','),
    });
    if (res.code === 200 && res.data) {
      profileSummary.value = res.data.profileSummary || '';
      enabledSourceLabels.value = res.data.enabledSourceLabels || [];
      weakKnowledgePoints.value = res.data.sections?.errorBook?.weakKnowledgePoints || [];
    }
  } catch (error) {
    console.error('加载学习画像失败：', error);
  } finally {
    profileLoading.value = false;
  }
}

async function handleGenerate() {
  if (!props.userId) {
    ElMessage.warning('请先登录');
    return;
  }
  if (form.dataSources.length === 0) {
    ElMessage.warning('请至少选择一个数据来源');
    return;
  }

  generating.value = true;
  streamText.value = '';
  draftPlans.value = [];
  aiSummary.value = '';

  try {
    await previewAiPlansStream(
      {
        userId: props.userId,
        dataSources: form.dataSources,
        durationDays: form.durationDays,
        focusSubjects: form.focusSubjects,
        maxPlans: 8,
      },
      (event) => {
        if (event.type === 'profile') {
          profileSummary.value = event.data?.profileSummary || profileSummary.value;
          enabledSourceLabels.value = event.data?.enabledSourceLabels || enabledSourceLabels.value;
          weakKnowledgePoints.value = event.data?.weakKnowledgePoints || [];
        } else if (event.type === 'chunk') {
          streamText.value += event.content || '';
        } else if (event.type === 'result') {
          const data = event.data || {};
          aiSummary.value = data.summary || '';
          draftPlans.value = (data.plans || []).map((p) => ({
            ...p,
            selected: p.selected !== false,
          }));
          selectAll.value = draftPlans.value.every((p) => p.selected);
        } else if (event.type === 'error') {
          ElMessage.error(event.message || '生成失败');
        }
      }
    );

    if (draftPlans.value.length === 0) {
      ElMessage.warning('未生成计划，请补充学习数据后重试');
    } else {
      ElMessage.success(`已生成 ${draftPlans.value.length} 条计划草案`);
    }
  } catch (error) {
    console.error('生成计划失败：', error);
    ElMessage.error('生成失败，请稍后重试');
  } finally {
    generating.value = false;
  }
}

async function handleRunScheduleNow() {
  if (!props.userId) return;
  runningSchedule.value = true;
  try {
    const res = await runScheduleNow({ userId: props.userId });
    if (res.code === 200) {
      if (res.data?.success) {
        ElMessage.success(res.message || `已自动生成 ${res.data.count} 条计划`);
        lastScheduledRunAt.value = new Date().toISOString();
        emit('imported');
      } else {
        ElMessage.warning(res.message || '本次未生成计划，请补充学习数据');
      }
    }
  } catch (error) {
    console.error('立即执行定时生成失败：', error);
  } finally {
    runningSchedule.value = false;
  }
}

async function handleAdjust(apply) {
  if (!props.userId) return;
  adjusting.value = true;
  try {
    const res = await adjustAiPlans({
      userId: props.userId,
      apply,
      durationDays: form.durationDays,
    });
    if (res.code === 200) {
      adjustResult.value = res.data;
      if (apply) {
        ElMessage.success(res.message || '计划调整已应用');
        emit('imported');
      } else if (res.data?.adjustmentPlans?.length) {
        draftPlans.value = res.data.adjustmentPlans.map((p) => ({
          ...p,
          selected: true,
        }));
        aiSummary.value = res.data.summary;
        ElMessage.info('已生成调整建议，可预览后导入');
      } else {
        ElMessage.success(res.data?.summary || '当前计划进度正常');
      }
    }
  } catch (error) {
    console.error('计划调整失败：', error);
  } finally {
    adjusting.value = false;
  }
}

function handleSelectAll(val) {
  draftPlans.value.forEach((p) => {
    p.selected = val;
  });
}

async function handleImport() {
  const selected = draftPlans.value.filter((p) => p.selected);
  if (selected.length === 0) {
    ElMessage.warning('请至少选择一条计划');
    return;
  }

  importing.value = true;
  try {
    const res = await confirmAiPlans({
      userId: props.userId,
      plans: selected,
    });
    if (res.code === 200) {
      ElMessage.success(res.message || `成功导入 ${res.data?.count || selected.length} 条计划`);
      emit('imported');
      visible.value = false;
    }
  } catch (error) {
    console.error('导入计划失败：', error);
  } finally {
    importing.value = false;
  }
}

function handleClosed() {
  draftPlans.value = [];
  aiSummary.value = '';
  streamText.value = '';
  adjustResult.value = null;
}
</script>

<style scoped>
.ai-plan-drawer {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 24px;
}

.section-card {
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 14px 16px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.section-title {
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 10px;
}

.section-desc {
  margin: 0 0 10px;
  font-size: 13px;
  color: #6b7280;
  line-height: 1.6;
}

.ai-icon {
  color: #0969da;
  font-size: 18px;
}

.source-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 12px;
}

.profile-summary,
.adjust-summary {
  margin: 0;
  font-size: 13px;
  color: #374151;
  line-height: 1.6;
}

.weak-kp-block {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin: 8px 0;
}

.weak-kp-label {
  font-size: 12px;
  color: #6b7280;
}

.kp-tag {
  margin: 0;
}

.source-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}

.action-row {
  display: flex;
  gap: 10px;
}

.stream-card {
  max-height: 180px;
  overflow: hidden;
}

.stream-text {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: #4b5563;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 140px;
  overflow-y: auto;
  background: #fff;
  border-radius: 6px;
  padding: 8px;
}

.cursor {
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  50% { opacity: 0; }
}

.ai-summary-card p {
  margin: 0;
  font-size: 13px;
  color: #374151;
  line-height: 1.6;
}

.draft-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 360px;
  overflow-y: auto;
  margin-bottom: 12px;
}

.draft-item {
  display: flex;
  gap: 10px;
  padding: 10px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.draft-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.draft-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 12px;
  color: #6b7280;
}

.plan-reason {
  margin: 0;
  font-size: 12px;
  color: #0969da;
  display: flex;
  align-items: flex-start;
  gap: 4px;
  line-height: 1.5;
}

.plan-sources {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.import-btn {
  width: 100%;
}

.schedule-card {
  border-color: #bfdbfe;
  background: #eff6ff;
}

.schedule-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.schedule-label {
  font-size: 13px;
  color: #374151;
  min-width: 72px;
}

.schedule-hint {
  font-size: 13px;
  color: #6b7280;
}

.last-run-text {
  margin: 0 0 10px;
  font-size: 12px;
  color: #6b7280;
}
</style>
