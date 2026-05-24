const User = require('../models/User');
const Question = require('../models/Question');
const Feedback = require('../models/Feedback');
const notificationService = require('./notificationService');
const logger = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function buildDateRange(days = 30) {
  const result = [];
  const today = startOfDay(new Date());
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    result.push(formatDateKey(d));
  }
  return result;
}

async function aggregateByDay(Model, dateField, days, match = {}) {
  const from = new Date();
  from.setDate(from.getDate() - (days - 1));
  from.setHours(0, 0, 0, 0);

  const rows = await Model.aggregate([
    { $match: { ...match, [dateField]: { $gte: from } } },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: `$${dateField}` },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const map = Object.fromEntries(rows.map((r) => [r._id, r.count]));
  const labels = buildDateRange(days);
  const data = labels.map((label) => map[label] || 0);
  return { labels, data };
}

async function getOverviewStats() {
  const today = startOfDay(new Date());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    totalUsers,
    totalQuestions,
    totalFeedbacks,
    pendingFeedbacks,
    todayUsers,
    todayQuestions,
    solvedQuestions,
  ] = await Promise.all([
    User.countDocuments(),
    Question.countDocuments(),
    Feedback.countDocuments(),
    Feedback.countDocuments({ status: 'submitted' }),
    User.countDocuments({ createTime: { $gte: today, $lt: tomorrow } }),
    Question.countDocuments({ createTime: { $gte: today, $lt: tomorrow } }),
    Question.countDocuments({ solved: true }),
  ]);

  return {
    totalUsers,
    totalQuestions,
    totalFeedbacks,
    pendingFeedbacks,
    todayUsers,
    todayQuestions,
    solvedQuestions,
    unsolvedQuestions: totalQuestions - solvedQuestions,
  };
}

async function getTrendStats(days = 30) {
  const safeDays = Math.min(Math.max(parseInt(days, 10) || 30, 7), 90);
  const [userTrend, questionTrend] = await Promise.all([
    aggregateByDay(User, 'createTime', safeDays),
    aggregateByDay(Question, 'createTime', safeDays),
  ]);

  return {
    days: safeDays,
    userTrend,
    questionTrend,
  };
}

async function getDistributionStats() {
  const [questionStatus, feedbackTypes, gradeStats] = await Promise.all([
    Question.aggregate([
      {
        $group: {
          _id: { $cond: [{ $eq: ['$solved', true] }, 'solved', 'unsolved'] },
          count: { $sum: 1 },
        },
      },
    ]),
    Feedback.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    User.aggregate([
      { $match: { grade: { $nin: [null, ''] } } },
      { $group: { _id: '$grade', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]),
  ]);

  const typeLabelMap = {
    suggestion: '功能建议',
    bug: 'Bug反馈',
    question: '使用咨询',
    other: '其他',
  };

  return {
    questionStatus: questionStatus.map((item) => ({
      name: item._id === 'solved' ? '已解决' : '待解决',
      value: item.count,
    })),
    feedbackTypes: feedbackTypes.map((item) => ({
      name: typeLabelMap[item._id] || item._id || '未知',
      value: item.count,
    })),
    userGrades: gradeStats.map((item) => ({
      name: item._id || '未设置',
      value: item.count,
    })),
  };
}

async function broadcastSystemAnnouncement(title, content) {
  if (!title?.trim() || !content?.trim()) {
    throw new AppError('公告标题和内容不能为空', 400);
  }

  const users = await User.find().select('_id').lean();
  if (!users.length) {
    throw new AppError('暂无用户可发送', 400);
  }

  let sent = 0;
  let skipped = 0;

  for (const user of users) {
    const userId = String(user._id);
    try {
      const result = await notificationService.sendNotification(
        userId,
        'system',
        title.trim(),
        content.trim().replace(/\n/g, '<br>'),
        {
          relatedType: 'user',
          relatedData: { source: 'admin_broadcast' },
        }
      );
      if (result) sent += 1;
      else skipped += 1;
    } catch (error) {
      logger.warn(`向用户 ${userId} 发送公告失败`, error.message);
      skipped += 1;
    }
  }

  logger.info(`管理员全站公告: 发送 ${sent}，跳过 ${skipped}`);
  return { total: users.length, sent, skipped };
}

module.exports = {
  getOverviewStats,
  getTrendStats,
  getDistributionStats,
  broadcastSystemAnnouncement,
};
