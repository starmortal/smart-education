const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');
const { DEFAULT_DATA_SOURCES } = require('./learningProfileService');

const DEFAULT_SETTINGS = {
  enabled: true,
  dataSources: [...DEFAULT_DATA_SOURCES],
  durationDays: 7,
  focusSubjects: [],
  autoAdjust: false,
  scheduleEnabled: false,
  scheduleTime: '08:00',
  scheduleFrequency: 'daily',
  scheduleWeekday: 1,
  plansPerRun: 3,
  lastRunKey: '',
  lastScheduledRunAt: null,
};

function normalizeSettings(saved = {}) {
  return {
    enabled: saved.enabled ?? DEFAULT_SETTINGS.enabled,
    dataSources: saved.dataSources?.length ? saved.dataSources : DEFAULT_SETTINGS.dataSources,
    durationDays: saved.durationDays ?? DEFAULT_SETTINGS.durationDays,
    focusSubjects: saved.focusSubjects || DEFAULT_SETTINGS.focusSubjects,
    autoAdjust: saved.autoAdjust ?? DEFAULT_SETTINGS.autoAdjust,
    scheduleEnabled: saved.scheduleEnabled ?? DEFAULT_SETTINGS.scheduleEnabled,
    scheduleTime: saved.scheduleTime || DEFAULT_SETTINGS.scheduleTime,
    scheduleFrequency: saved.scheduleFrequency || DEFAULT_SETTINGS.scheduleFrequency,
    scheduleWeekday: saved.scheduleWeekday ?? DEFAULT_SETTINGS.scheduleWeekday,
    plansPerRun: saved.plansPerRun ?? DEFAULT_SETTINGS.plansPerRun,
    lastRunKey: saved.lastRunKey || '',
    lastScheduledRunAt: saved.lastScheduledRunAt || null,
  };
}

async function getAiPlanSettings(userId) {
  const user = await User.findById(userId).select('aiPlanSettings');
  if (!user) return { ...DEFAULT_SETTINGS };

  const saved = user.aiPlanSettings?.toObject?.() || user.aiPlanSettings || {};
  return normalizeSettings(saved);
}

async function saveAiPlanSettings(userId, settings = {}) {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('用户不存在', 404);
  }

  const current = await getAiPlanSettings(userId);
  user.aiPlanSettings = normalizeSettings({
    ...current,
    ...settings,
    dataSources: settings.dataSources?.length ? settings.dataSources : current.dataSources,
  });
  await user.save();
  return user.aiPlanSettings;
}

async function updateLastScheduledRun(userId, runKey) {
  const user = await User.findById(userId);
  if (!user) return;
  const current = await getAiPlanSettings(userId);
  user.aiPlanSettings = {
    ...current,
    lastRunKey: runKey,
    lastScheduledRunAt: new Date(),
  };
  await user.save();
}

module.exports = {
  DEFAULT_SETTINGS,
  getAiPlanSettings,
  saveAiPlanSettings,
  updateLastScheduledRun,
};
