const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');
const Response = require('../utils/response');
const logger = require('../utils/logger');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { adminAuthMiddleware, ADMIN_TOKEN } = require('../middleware/adminAuth');
const {
  getOverviewStats,
  getTrendStats,
  getDistributionStats,
  broadcastSystemAnnouncement,
} = require('../services/adminService');

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123456';

router.post('/login', asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    return Response.success(res, {
      token: ADMIN_TOKEN,
      username: ADMIN_USERNAME,
    }, '登录成功');
  }
  throw new AppError('账号或密码错误', 401);
}));

router.use(adminAuthMiddleware);

router.get('/stats/overview', asyncHandler(async (req, res) => {
  const data = await getOverviewStats();
  Response.success(res, data, '获取概览成功');
}));

router.get('/stats/trends', asyncHandler(async (req, res) => {
  const days = req.query.days || 30;
  const data = await getTrendStats(days);
  Response.success(res, data, '获取趋势成功');
}));

router.get('/stats/distribution', asyncHandler(async (req, res) => {
  const data = await getDistributionStats();
  Response.success(res, data, '获取分布成功');
}));

router.post('/broadcast', asyncHandler(async (req, res) => {
  const { title, content } = req.body;
  const result = await broadcastSystemAnnouncement(title, content);
  Response.success(res, result, `公告已发送给 ${result.sent} 位用户`);
}));

router.get('/feedback/list', asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;

  const query = {};
  if (status && status !== 'all') {
    query.status = status;
  }

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

  const [feedbacks, total] = await Promise.all([
    Feedback.find(query)
      .sort({ createTime: -1 })
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum)
      .lean(),
    Feedback.countDocuments(query),
  ]);

  Response.success(res, {
    list: feedbacks,
    total,
    page: pageNum,
    limit: limitNum,
  }, '获取反馈列表成功');
}));

router.post('/feedback/reply', asyncHandler(async (req, res) => {
  const { feedbackId, reply } = req.body;

  if (!feedbackId || !reply?.trim()) {
    throw new AppError('缺少必要参数', 400);
  }

  const feedback = await Feedback.findByIdAndUpdate(
    feedbackId,
    {
      status: 'replied',
      reply: reply.trim(),
      replyTime: new Date(),
      adminId: 'admin',
    },
    { new: true }
  );

  if (!feedback) {
    throw new AppError('反馈不存在', 404);
  }

  logger.info(`管理员回复反馈: ${feedbackId}`);
  Response.success(res, { id: feedback._id, status: feedback.status }, '回复成功');
}));

module.exports = router;
