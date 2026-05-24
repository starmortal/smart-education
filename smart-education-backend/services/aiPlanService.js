const StudyPlan = require('../models/StudyPlan');
const ai = require('../utils/ai');
const { buildLearningProfile } = require('./learningProfileService');
const { VALID_SUBJECT_CODES, toSubjectName } = require('../utils/subjectMap');
const logger = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');

const MAX_PLANS = 10;

function formatDate(date) {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDays(baseDate, days) {
  const d = new Date(baseDate);
  d.setDate(d.getDate() + days);
  d.setHours(23, 59, 59, 999);
  return d;
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function parseAiJson(text) {
  if (!text) return null;
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch (_) {
    const match = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (match) {
      try {
        return JSON.parse(match[1].trim());
      } catch (e) {
        return null;
      }
    }
    const objMatch = trimmed.match(/\{[\s\S]*\}/);
    if (objMatch) {
      try {
        return JSON.parse(objMatch[0]);
      } catch (e) {
        return null;
      }
    }
    return null;
  }
}

function normalizePlanItem(raw, durationDays) {
  if (!raw?.planTitle || !raw?.subject) return null;

  const subject = VALID_SUBJECT_CODES.includes(raw.subject) ? raw.subject : null;
  if (!subject) return null;

  const today = startOfToday();
  let startTime = raw.startTime ? new Date(raw.startTime) : new Date(today);
  let endTime = raw.endTime ? new Date(raw.endTime) : addDays(startTime, Math.min(3, durationDays));

  if (Number.isNaN(startTime.getTime())) startTime = new Date(today);
  if (Number.isNaN(endTime.getTime())) endTime = addDays(startTime, 2);
  if (endTime < startTime) endTime = addDays(startTime, 1);

  return {
    planTitle: String(raw.planTitle).slice(0, 80),
    subject,
    subjectName: toSubjectName(subject),
    startTime: formatDate(startTime),
    endTime: formatDate(endTime),
    description: String(raw.description || '').slice(0, 500),
    priority: raw.priority || 'medium',
    reason: String(raw.reason || '').slice(0, 200),
    dataSources: Array.isArray(raw.dataSources) ? raw.dataSources : [],
    selected: true,
  };
}

function buildFallbackPlans(learningProfile, durationDays, focusSubjects = []) {
  const plans = [];
  const today = startOfToday();
  const { sections, profile } = learningProfile;

  const subjectCandidates = new Set(focusSubjects.filter((s) => VALID_SUBJECT_CODES.includes(s)));

  (sections.errorBook?.subjectStats || [])
    .sort((a, b) => b.unmasteredRate - a.unmasteredRate)
    .forEach((s) => subjectCandidates.add(s.subject));

  (sections.exam?.trends || [])
    .filter((t) => t.trend === 'down')
    .forEach((t) => subjectCandidates.add(t.subject));

  (profile.subjectCodes || []).forEach((s) => subjectCandidates.add(s));

  let dayOffset = 0;
  [...subjectCandidates].slice(0, 5).forEach((subject) => {
    const stat = (sections.errorBook?.subjectStats || []).find((s) => s.subject === subject);
    const start = new Date(today);
    start.setDate(start.getDate() + dayOffset);
    const end = addDays(start, Math.max(1, Math.floor(durationDays / 5)));

    plans.push({
      planTitle: `${toSubjectName(subject)}专项巩固`,
      subject,
      subjectName: toSubjectName(subject),
      startTime: formatDate(start),
      endTime: formatDate(end),
      description: stat
        ? `复习 ${stat.unmastered} 道未掌握错题，关注：${(stat.recentTitles || []).join('、') || '基础练习'}`
        : `${toSubjectName(subject)}基础复习与练习`,
      priority: 'medium',
      reason: stat
        ? `错题本：${toSubjectName(subject)}未掌握 ${stat.unmastered} 道`
        : `个人科目设置：${toSubjectName(subject)}需巩固`,
      dataSources: ['errorBook', 'exam'],
      selected: true,
    });
    dayOffset += Math.max(1, Math.floor(durationDays / 5));
  });

  return plans.slice(0, MAX_PLANS);
}

function buildPrompt(learningProfile, options) {
  const { durationDays, focusSubjects, maxPlans } = options;
  const todayStr = formatDate(new Date());

  const payload = {
    today: todayStr,
    durationDays,
    focusSubjects,
    maxPlans,
    learningProfile: {
      profile: learningProfile.profile,
      profileSummary: learningProfile.profileSummary,
      knowledgeAnalysis: learningProfile.knowledgeAnalysis,
      exam: learningProfile.sections.exam,
      errorBook: learningProfile.sections.errorBook,
      studyPlan: learningProfile.sections.studyPlan,
      chat: learningProfile.sections.chat,
      note: learningProfile.sections.note,
      community: learningProfile.sections.community,
    },
  };

  return `你是一位专业的 K12 学习规划师。请根据以下学生学习画像，生成 ${maxPlans} 条以内、未来 ${durationDays} 天可执行的学习计划。

要求：
1. 计划必须具体可执行，标题简洁，描述包含学习动作（复习错题/练习/总结等）
2. 不要与 existingPlans 中已有计划重复
3. subject 必须使用英文代码：math/chinese/english/physics/chemistry/biology/history/geography/politics
4. startTime/endTime 格式 YYYY-MM-DD，从今天 ${todayStr} 起，跨度不超过 ${durationDays} 天
5. 优先薄弱科目、薄弱知识点（knowledgeAnalysis.weakKnowledgePoints）和错题多的科目
6. 若 focusSubjects 非空，优先这些科目
7. 每条计划必须包含 reason（制定依据，说明为何推荐，30字以内）和 dataSources（依据的数据模块）
8. 制定计划时需结合 knowledgeAnalysis.summary 中的知识点分析结论

请严格只返回 JSON，不要 markdown，格式：
{
  "summary": "一句话说明制定依据",
  "plans": [
    {
      "planTitle": "标题",
      "subject": "math",
      "startTime": "YYYY-MM-DD",
      "endTime": "YYYY-MM-DD",
      "description": "具体任务",
      "priority": "high|medium|low",
      "reason": "因数学错题8道未掌握，建议巩固函数",
      "dataSources": ["errorBook"]
    }
  ]
}

学生学习画像：
${JSON.stringify(payload, null, 2)}`;
}

async function generateUniquePlanId() {
  for (let i = 0; i < 100; i += 1) {
    const planId = Math.floor(1000 + Math.random() * 9000);
    const exists = await StudyPlan.findOne({ planId });
    if (!exists) return planId;
  }
  throw new AppError('生成计划ID失败，请重试', 500);
}

/**
 * 预览 AI 生成计划
 */
async function previewAiPlans(userId, options = {}) {
  const {
    dataSources,
    durationDays = 7,
    focusSubjects = [],
    maxPlans = 6,
  } = options;

  const learningProfile = await buildLearningProfile(userId, dataSources);

  const hasData =
    learningProfile.profileSummary &&
    learningProfile.profileSummary !== '数据较少，建议补充错题或进行一次 AI 对话后再生成';

  let summary = learningProfile.profileSummary;
  let plans = [];

  if (hasData) {
    try {
      const prompt = buildPrompt(learningProfile, {
        durationDays,
        focusSubjects,
        maxPlans: Math.min(maxPlans, MAX_PLANS),
      });

      const systemMsg = {
        role: 'system',
        content: '你是 K12 学习规划助手，只输出合法 JSON，不要任何额外说明。',
      };

      const aiText = await ai.chat(prompt, [systemMsg]);
      const parsed = parseAiJson(aiText);

      if (parsed?.summary) summary = parsed.summary;
      if (Array.isArray(parsed?.plans)) {
        plans = parsed.plans
          .map((p) => normalizePlanItem(p, durationDays))
          .filter(Boolean)
          .slice(0, MAX_PLANS);
      }
    } catch (error) {
      logger.error('AI 生成计划失败，使用兜底方案', error);
    }
  }

  if (plans.length === 0) {
    plans = buildFallbackPlans(learningProfile, durationDays, focusSubjects);
    if (!summary || summary.includes('数据较少')) {
      summary = plans.length
        ? '已根据现有学习数据生成基础巩固计划，你可在导入前调整'
        : '暂无足够数据，请先在个人中心设置科目，或添加错题/进行 AI 对话';
    }
  }

  return {
    summary,
    plans,
    learningProfile: {
      profileSummary: learningProfile.profileSummary,
      enabledSourceLabels: learningProfile.enabledSourceLabels,
      enabledSources: learningProfile.enabledSources,
      knowledgeAnalysis: learningProfile.knowledgeAnalysis,
      sections: learningProfile.sections,
    },
  };
}

/**
 * 流式生成计划预览（SSE，不向前端推送生成过程文本）
 */
async function previewAiPlansStream(userId, options = {}, emit) {
  const {
    dataSources,
    durationDays = 7,
    focusSubjects = [],
    maxPlans = 6,
  } = options;

  const learningProfile = await buildLearningProfile(userId, dataSources);

  emit({
    type: 'profile',
    data: {
      profileSummary: learningProfile.profileSummary,
      enabledSourceLabels: learningProfile.enabledSourceLabels,
      enabledSources: learningProfile.enabledSources,
      knowledgeAnalysis: learningProfile.knowledgeAnalysis,
      weakKnowledgePoints: learningProfile.sections.errorBook?.weakKnowledgePoints || [],
    },
  });

  const hasData =
    learningProfile.profileSummary &&
    learningProfile.profileSummary !== '数据较少，建议补充错题或进行一次 AI 对话后再生成';

  let summary = learningProfile.profileSummary;
  let plans = [];

  if (hasData) {
    try {
      const prompt = buildPrompt(learningProfile, {
        durationDays,
        focusSubjects,
        maxPlans: Math.min(maxPlans, MAX_PLANS),
      });

      const systemMsg = {
        role: 'system',
        content: '你是 K12 学习规划助手，只输出合法 JSON，不要任何额外说明。',
      };

      let fullText = '';
      await ai.chatStream(prompt, [systemMsg], (chunk) => {
        fullText += chunk;
      });

      const parsed = parseAiJson(fullText);
      if (parsed?.summary) summary = parsed.summary;
      if (Array.isArray(parsed?.plans)) {
        plans = parsed.plans
          .map((p) => normalizePlanItem(p, durationDays))
          .filter(Boolean)
          .slice(0, MAX_PLANS);
      }
    } catch (error) {
      logger.error('AI 流式生成计划失败，使用兜底方案', error);
    }
  }

  if (plans.length === 0) {
    plans = buildFallbackPlans(learningProfile, durationDays, focusSubjects);
    if (!summary || summary.includes('数据较少')) {
      summary = plans.length
        ? '已根据现有学习数据生成基础巩固计划，你可在导入前调整'
        : '暂无足够数据，请先在个人中心设置科目，或添加错题/进行 AI 对话';
    }
  }

  const result = {
    summary,
    plans,
    learningProfile: {
      profileSummary: learningProfile.profileSummary,
      enabledSourceLabels: learningProfile.enabledSourceLabels,
      enabledSources: learningProfile.enabledSources,
      knowledgeAnalysis: learningProfile.knowledgeAnalysis,
      sections: learningProfile.sections,
    },
  };

  emit({ type: 'result', data: result });
  return result;
}

/**
 * 根据计划进度分析并生成调整建议
 */
async function adjustPlansByProgress(userId, options = {}) {
  const { apply = false, durationDays = 7 } = options;
  const uid = String(userId);
  const now = new Date();

  const activePlans = await StudyPlan.find({
    userId: uid,
    planStatus: { $in: ['not_started', 'in_progress'] },
  }).lean();

  const overdue = [];
  const slowProgress = [];
  const suggestions = [];

  activePlans.forEach((plan) => {
    const start = new Date(plan.startTime);
    const end = new Date(plan.endTime);
    const totalMs = Math.max(end - start, 86400000);
    const elapsedMs = Math.max(now - start, 0);
    const expectedProgress = Math.min(100, Math.round((elapsedMs / totalMs) * 100));

    if (end < now) {
      overdue.push({
        planId: plan.planId || plan._id,
        planTitle: plan.planTitle,
        subject: plan.subject,
        progress: plan.progress,
        endTime: plan.endTime,
      });
    } else if (plan.progress < expectedProgress - 15 && plan.planStatus === 'in_progress') {
      slowProgress.push({
        planId: plan.planId || plan._id,
        planTitle: plan.planTitle,
        subject: plan.subject,
        progress: plan.progress,
        expectedProgress,
      });
    }
  });

  const adjustmentPlans = [];
  const applied = [];

  overdue.forEach((item) => {
    const newEnd = addDays(now, 2);
    suggestions.push({
      type: 'extend',
      planId: item.planId,
      message: `「${item.planTitle}」已逾期，建议延长至 ${formatDate(newEnd)}`,
    });
    if (apply) {
      applied.push({ planId: item.planId, action: 'extend', newEndTime: newEnd });
    }
  });

  slowProgress.slice(0, 3).forEach((item) => {
    const catchPlan = {
      planTitle: `${toSubjectName(item.subject)}进度补强`,
      subject: item.subject,
      subjectName: toSubjectName(item.subject),
      startTime: formatDate(now),
      endTime: formatDate(addDays(now, Math.max(2, Math.floor(durationDays / 3)))),
      description: `针对「${item.planTitle}」进度 ${item.progress}%（预期约 ${item.expectedProgress}%），拆分 2-3 个小任务完成`,
      priority: 'high',
      reason: `现有计划进度落后：${item.planTitle}`,
      dataSources: ['studyPlan'],
      selected: true,
    };
    adjustmentPlans.push(catchPlan);
    suggestions.push({
      type: 'add',
      message: `为落后计划「${item.planTitle}」新增补强任务`,
      plan: catchPlan,
    });
  });

  if (apply) {
    for (const item of applied) {
      const query = typeof item.planId === 'number'
        ? { planId: item.planId, userId: uid }
        : { _id: item.planId, userId: uid };
      await StudyPlan.findOneAndUpdate(query, {
        endTime: item.newEndTime,
        updateTime: new Date(),
      });
    }
    if (adjustmentPlans.length > 0) {
      await confirmAiPlans(userId, adjustmentPlans);
    }
  }

  const summary =
    overdue.length || slowProgress.length
      ? `发现 ${overdue.length} 项逾期、${slowProgress.length} 项进度落后，已生成 ${adjustmentPlans.length} 条补强建议`
      : '当前计划进度正常，暂无需要调整项';

  return {
    summary,
    overdueCount: overdue.length,
    slowProgressCount: slowProgress.length,
    suggestions,
    adjustmentPlans,
    applied: apply,
  };
}

/**
 * 确认导入计划
 */
async function confirmAiPlans(userId, plans = []) {
  if (!Array.isArray(plans) || plans.length === 0) {
    throw new AppError('请至少选择一条计划', 400);
  }

  const created = [];

  for (const raw of plans) {
    const normalized = normalizePlanItem(raw, 30);
    if (!normalized) continue;

    const planId = await generateUniquePlanId();
    const doc = new StudyPlan({
      planId,
      userId: String(userId),
      planTitle: normalized.planTitle,
      subject: normalized.subject,
      startTime: new Date(normalized.startTime),
      endTime: new Date(normalized.endTime),
      description: normalized.description,
      planStatus: 'not_started',
      progress: 0,
      targetProgress: 100,
      aiReason: normalized.reason || '',
    });

    await doc.save();
    created.push({
      planId: doc.planId,
      planTitle: doc.planTitle,
      subject: doc.subject,
      startTime: doc.startTime,
      endTime: doc.endTime,
    });
  }

  if (created.length === 0) {
    throw new AppError('没有有效的计划可导入', 400);
  }

  logger.info(`用户 ${userId} AI 导入计划 ${created.length} 条`);
  return { count: created.length, plans: created };
}

module.exports = {
  previewAiPlans,
  previewAiPlansStream,
  confirmAiPlans,
  adjustPlansByProgress,
  buildLearningProfile,
};
