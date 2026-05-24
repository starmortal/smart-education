const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');
const { previewAiPlans, confirmAiPlans } = require('./aiPlanService');
const { getAiPlanSettings, updateLastScheduledRun } = require('./aiPlanSettingsService');
const notificationService = require('./notificationService');
const logger = require('../utils/logger');

/**
 * 获取北京时间当前时刻组件
 */
function getBeijingNowParts() {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const beijing = new Date(utc + 8 * 3600000);

  const y = beijing.getFullYear();
  const m = String(beijing.getMonth() + 1).padStart(2, '0');
  const d = String(beijing.getDate()).padStart(2, '0');
  const hh = String(beijing.getHours()).padStart(2, '0');
  const mm = String(beijing.getMinutes()).padStart(2, '0');
  // weekday: 1=周一 ... 7=周日
  const jsDay = beijing.getDay();
  const weekday = jsDay === 0 ? 7 : jsDay;

  return {
    hhmm: `${hh}:${mm}`,
    dateKey: `${y}-${m}-${d}`,
    weekday,
  };
}

function shouldRunNow(settings, hhmm, weekday) {
  if (!settings.scheduleEnabled || !settings.enabled) return false;
  if (settings.scheduleTime !== hhmm) return false;

  if (settings.scheduleFrequency === 'weekly') {
    const targetDay = settings.scheduleWeekday || 1;
    if (weekday !== targetDay) return false;
  }

  return true;
}

function buildRunKey(settings, dateKey) {
  if (settings.scheduleFrequency === 'weekly') {
    return `weekly-${dateKey}`;
  }
  return `daily-${dateKey}`;
}

async function sendScheduleNotification(userId, result) {
  const planTitles = (result.plans || [])
    .map((p) => p.planTitle)
    .slice(0, 5)
    .join('、');
  const title = '📅 AI 已自动生成学习计划';
  const content = `已根据你的学习数据自动生成 ${result.count} 条计划并加入时间轴。${result.summary ? `\n${result.summary}` : ''}${planTitles ? `\n计划：${planTitles}` : ''}`;

  const planIds = (result.plans || [])
    .map((p) => String(p.planId))
    .filter(Boolean);
  const primaryPlanId = planIds[0] || null;

  try {
    await notificationService.sendNotification(userId, 'aiPlan', title, content.replace(/\n/g, '<br>'), {
      relatedType: 'studyPlan',
      relatedData: {
        planCount: result.count,
        summary: result.summary,
        source: 'ai_schedule',
        planIds,
        planId: primaryPlanId,
      },
    });
  } catch (error) {
    logger.error(`用户 ${userId} 定时计划通知发送失败`, error);
  }
}

/**
 * 为单个用户执行定时生成
 */
async function runScheduledForUser(userId, settings, options = {}) {
  const { force = false, runKey: forcedRunKey } = options;
  const { hhmm, dateKey, weekday } = getBeijingNowParts();

  if (!force && !shouldRunNow(settings, hhmm, weekday)) {
    return { skipped: true, reason: 'not_due' };
  }

  const runKey = forcedRunKey || buildRunKey(settings, dateKey);
  if (!force && settings.lastRunKey === runKey) {
    return { skipped: true, reason: 'already_ran' };
  }

  const plansPerRun = Math.min(Math.max(settings.plansPerRun || 3, 1), 10);

  logger.info(`开始定时 AI 计划生成: userId=${userId}, plansPerRun=${plansPerRun}`);

  const preview = await previewAiPlans(userId, {
    dataSources: settings.dataSources,
    durationDays: settings.durationDays,
    focusSubjects: settings.focusSubjects,
    maxPlans: plansPerRun,
  });

  if (!preview.plans?.length) {
    logger.warn(`用户 ${userId} 定时生成无计划可导入`);
    return { skipped: true, reason: 'no_plans' };
  }

  const selected = preview.plans.slice(0, plansPerRun);
  const importResult = await confirmAiPlans(userId, selected);

  await updateLastScheduledRun(userId, runKey);

  const result = {
    success: true,
    count: importResult.count,
    summary: preview.summary,
    plans: importResult.plans,
  };

  await sendScheduleNotification(userId, result);

  logger.info(`用户 ${userId} 定时 AI 计划完成，导入 ${importResult.count} 条`);
  return result;
}

/**
 * 调度器每分钟检查
 */
async function tick() {
  const users = await User.find({
    'aiPlanSettings.enabled': true,
    'aiPlanSettings.scheduleEnabled': true,
  }).select('_id aiPlanSettings');

  if (!users.length) return;

  const { hhmm, dateKey, weekday } = getBeijingNowParts();

  for (const user of users) {
    try {
      const settings = await getAiPlanSettings(user._id.toString());
      if (!shouldRunNow(settings, hhmm, weekday)) continue;
      if (settings.lastRunKey === buildRunKey(settings, dateKey)) continue;
      await runScheduledForUser(user._id.toString(), settings);
    } catch (error) {
      logger.error(`定时计划用户 ${user._id} 处理失败`, error);
    }
  }
}

/**
 * 手动立即执行（测试/补跑）
 */
async function runNow(userId) {
  const settings = await getAiPlanSettings(userId);
  if (!settings.enabled) {
    throw new AppError('请先开启 AI 智能制定', 400);
  }
  const { dateKey } = getBeijingNowParts();
  return runScheduledForUser(userId, settings, {
    force: true,
    runKey: `manual-${dateKey}-${Date.now()}`,
  });
}

module.exports = {
  tick,
  runNow,
  runScheduledForUser,
  getBeijingNowParts,
};
