const express = require("express");
const router = express.Router();
const Feedback = require("../models/Feedback");
const { sendFeedbackNotification } = require("../utils/emailService");
const Response = require("../utils/response");
const logger = require("../utils/logger");
const { asyncHandler, AppError } = require("../middleware/errorHandler");

/**
 * 意见反馈路由模块
 * 功能：收集用户对平台的意见和建议，帮助改进产品
 * 用途：用户可以提交功能建议、问题反馈、使用体验等
 */

// 提交反馈
router.post("/submit", asyncHandler(async (req, res) => {
  const { userId, nickname, type, contact, content, screenshots } = req.body;

  // 验证反馈内容长度
  if (!content || content.trim().length < 10) {
    throw new AppError("反馈内容至少10个字符", 400);
  }

  logger.info(`收到新反馈 [${type}] 来自用户: ${nickname}`);

  // 保存反馈到数据库
  const feedback = await Feedback.create({
    userId,
    nickname,
    type,
    contact,
    content,
    screenshots: screenshots || [],
    status: "submitted",
  });

  // 邮件通知异步发送，不阻塞接口响应（避免前端长时间 loading）
  sendFeedbackNotification({
    feedbackId: feedback._id,
    nickname,
    type,
    content,
    createTime: feedback.createTime,
  }).catch((emailError) => {
    logger.error('发送反馈通知邮件失败', emailError);
  });

  Response.success(res, {
    feedbackId: feedback._id,
  }, '反馈提交成功，感谢您的宝贵意见！');
}));

// 获取用户的反馈历史
router.get("/history", asyncHandler(async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    throw new AppError("缺少用户ID", 400);
  }

  logger.info(`获取反馈历史: userId=${userId}`);

  // 查询用户的反馈记录（最近20条）
  const feedbacks = await Feedback.find({ userId })
    .sort({ createTime: -1 })
    .limit(20)
    .select("type content status reply createTime screenshots")
    .lean();

  // 格式化返回数据
  const list = feedbacks.map((item) => ({
    id: String(item._id),
    type: item.type,
    content: item.content,
    status: item.status,
    reply: item.reply || '',
    screenshots: item.screenshots || [],
    createTime: item.createTime,
    date: item.createTime,
  }));

  // 统计反馈总数
  const total = await Feedback.countDocuments({ userId });

  Response.success(res, {
    list,
    stats: {
      total,
      processed: 0,
    },
  });
}));

// 管理员回复反馈
router.post("/reply", asyncHandler(async (req, res) => {
  const { feedbackId, reply, adminId } = req.body;

  if (!feedbackId || !reply) {
    throw new AppError("缺少必要参数", 400);
  }

  logger.info(`管理员回复反馈: feedbackId=${feedbackId}`);

  // 更新反馈状态和回复内容
  const feedback = await Feedback.findByIdAndUpdate(
    feedbackId,
    {
      status: "replied",
      reply: reply.trim(),
      replyTime: new Date(),
      adminId: adminId || "admin",
    },
    { new: true }
  );

  if (!feedback) {
    throw new AppError("反馈不存在", 404);
  }

  logger.info(`管理员已回复反馈 [${feedbackId}]`);

  Response.success(res, {
    feedback: {
      id: feedback._id,
      status: feedback.status,
      reply: feedback.reply,
    },
  }, "回复成功");
}));

// 管理员获取所有反馈列表（内部接口，不暴露给前端导航）
router.get("/admin/list", asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  
  logger.info(`管理员获取反馈列表: page=${page}, limit=${limit}, status=${status}`);
  
  const query = {};
  if (status && status !== 'all') {
    query.status = status;
  }

  const feedbacks = await Feedback.find(query)
    .sort({ createTime: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .lean();

  const total = await Feedback.countDocuments(query);

  Response.success(res, {
    list: feedbacks,
    total,
    page: parseInt(page),
    limit: parseInt(limit),
  });
}));

module.exports = router;
