const express = require("express");
const router = express.Router();
const StudyPlan = require("../models/StudyPlan");
const { formatBeijingTime, formatBeijingTimeSimple } = require("../utils/timeHelper");
const Response = require("../utils/response");
const logger = require("../utils/logger");
const { asyncHandler, AppError } = require("../middleware/errorHandler");

/**
 * 学习计划路由模块
 * 功能：学习计划的增删改查、进度跟踪、状态管理
 * 用途：帮助学生制定学习计划，培养良好的学习习惯
 */

// 获取用户学习计划统计数据
router.get("/stats/:userId", asyncHandler(async (req, res) => {
  const { userId } = req.params;

  logger.info(`获取学习计划统计数据: userId=${userId}`);

  // 获取总数
  const totalCount = await StudyPlan.countDocuments({ userId });
  
  // 获取各状态数量
  const notStartedCount = await StudyPlan.countDocuments({ 
    userId, 
    planStatus: "not_started" 
  });
  
  const inProgressCount = await StudyPlan.countDocuments({ 
    userId, 
    planStatus: "in_progress" 
  });
  
  const completedCount = await StudyPlan.countDocuments({ 
    userId, 
    planStatus: "completed" 
  });
  
  const overdueCount = await StudyPlan.countDocuments({ 
    userId, 
    planStatus: "overdue" 
  });

  // 获取各状态统计数据（用于右侧状态统计）
  const statusStats = await StudyPlan.aggregate([
    { $match: { userId } },
    { 
      $group: { 
        _id: "$planStatus", 
        count: { $sum: 1 } 
      } 
    }
  ]);

  // 转换为对象格式，方便前端使用
  const statusStatsObj = {
    not_started: 0,
    in_progress: 0,
    completed: 0,
    overdue: 0
  };
  statusStats.forEach(item => {
    if (statusStatsObj.hasOwnProperty(item._id)) {
      statusStatsObj[item._id] = item.count;
    }
  });

  Response.success(res, {
    totalCount,
    notStartedCount,
    inProgressCount,
    completedCount,
    overdueCount,
    statusStats: statusStatsObj,
  }, "获取统计数据成功");
}));

// 获取学习计划列表
router.get("/list", asyncHandler(async (req, res) => {
  const { userId, pageNum = 1, pageSize = 10, planStatus, subject } = req.query;
  
  logger.info(`获取学习计划列表: userId=${userId}, pageNum=${pageNum}, pageSize=${pageSize}`);
  
  const query = { userId };
  if (planStatus) query.planStatus = planStatus;
  if (subject) query.subject = subject;
  
  const total = await StudyPlan.countDocuments(query);
  
  const plans = await StudyPlan.find(query)
    .sort({ createTime: -1 })
    .skip((pageNum - 1) * pageSize)
    .limit(parseInt(pageSize));
  
  const formattedPlans = plans.map(plan => ({
    id: plan.planId || plan._id.toString(),
    planId: plan.planId,
    _id: plan._id,
    userId: plan.userId,
    planTitle: plan.planTitle,
    subject: plan.subject,
    startTime: plan.startTime,
    endTime: plan.endTime,
    startTimeFormatted: formatBeijingTime(plan.startTime),
    endTimeFormatted: formatBeijingTime(plan.endTime),
    createTimeFormatted: formatBeijingTime(plan.createTime),
    updateTimeFormatted: formatBeijingTime(plan.updateTime),
    startTimeSimple: formatBeijingTimeSimple(plan.startTime),
    endTimeSimple: formatBeijingTimeSimple(plan.endTime),
    createTimeSimple: formatBeijingTimeSimple(plan.createTime),
    updateTimeSimple: formatBeijingTimeSimple(plan.updateTime),
    description: plan.description,
    planStatus: plan.planStatus,
    progress: plan.progress,
    targetProgress: plan.targetProgress,
    createTime: plan.createTime,
    updateTime: plan.updateTime
  }));
  
  Response.success(res, {
    plans: formattedPlans,
    count: total,
  }, "获取学习计划列表成功");
}));

// 新增学习计划
router.post("/add", asyncHandler(async (req, res) => {
  const { userId, planTitle, subject, startTime, endTime, description, targetProgress, progress } = req.body;
  
  if (!userId || !planTitle || !subject || !startTime || !endTime) {
    throw new AppError("必填字段不能为空", 400);
  }
  
  logger.info(`新增学习计划: userId=${userId}, planTitle=${planTitle}`);
  
  // 根据进度自动设置初始状态
  let initialStatus = "not_started";
  const initialProgress = progress || 0;
  
  if (initialProgress === 0) {
    initialStatus = 'not_started';
  } else if (initialProgress === 100) {
    initialStatus = 'completed';
  } else if (initialProgress > 0 && initialProgress < 100) {
    initialStatus = 'in_progress';
  }
  
  let planId;
  let exists = true;
  let attempts = 0;
  
  while (exists && attempts < 100) {
    planId = Math.floor(1000 + Math.random() * 9000);
    const existingPlan = await StudyPlan.findOne({ planId });
    exists = !!existingPlan;
    attempts++;
  }
  
  if (attempts >= 100) {
    throw new AppError("生成计划ID失败，请重试", 500);
  }
  
  logger.info(`新增计划状态设置 - 初始进度: ${initialProgress}, 自动状态: ${initialStatus}`);
  
  const newPlan = new StudyPlan({
    planId,
    userId,
    planTitle,
    subject,
    startTime: new Date(startTime),
    endTime: new Date(endTime),
    description: description || "",
    planStatus: initialStatus,
    progress: initialProgress,
    targetProgress: targetProgress || 100,
  });
  
  await newPlan.save();
  
  logger.info(`学习计划创建成功: planId=${newPlan.planId}`);
  
  Response.success(res, {
    planId: newPlan.planId,
    initialStatus: initialStatus,
    startTimeFormatted: formatBeijingTime(newPlan.startTime),
    endTimeFormatted: formatBeijingTime(newPlan.endTime),
  }, "新增学习计划成功", 201);
}));

// 更新学习计划
router.put("/update/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { planTitle, subject, startTime, endTime, description, planStatus, progress, targetProgress } = req.body;
  
  logger.info(`更新学习计划: id=${id}`);
  
  // 根据进度自动调整计划状态
  let finalStatus = planStatus;
  if (progress !== undefined) {
    if (progress === 0) {
      finalStatus = 'not_started';
    } else if (progress === 100) {
      finalStatus = 'completed';
    } else if (progress > 0 && progress < 100) {
      finalStatus = 'in_progress';
    }
  }
  
  const updateData = {
    planTitle,
    subject,
    startTime: new Date(startTime),
    endTime: new Date(endTime),
    description,
    targetProgress,
    updateTime: new Date(),
  };
  
  // 使用自动调整后的状态
  if (finalStatus !== undefined) {
    updateData.planStatus = finalStatus;
  }
  if (progress !== undefined) {
    updateData.progress = progress;
  }
  
  logger.info(`后端状态调整 - 原始状态: ${planStatus}, 进度: ${progress}, 最终状态: ${finalStatus}`);
  
  let plan;
  if (id.match(/^[0-9a-fA-F]{24}$/)) {
    plan = await StudyPlan.findByIdAndUpdate(id, updateData, { new: true });
  } else {
    plan = await StudyPlan.findOneAndUpdate(
      { planId: parseInt(id) },
      updateData,
      { new: true }
    );
  }
  
  if (!plan) {
    throw new AppError("学习计划不存在", 404);
  }
  
  logger.info(`学习计划更新成功: id=${id}`);
  
  Response.success(res, { 
    statusChanged: finalStatus !== planStatus,
    finalStatus: finalStatus,
    startTimeFormatted: formatBeijingTime(plan.startTime),
    endTimeFormatted: formatBeijingTime(plan.endTime),
    updateTimeFormatted: formatBeijingTime(plan.updateTime)
  }, "更新学习计划成功");
}));

// 标记完成
router.put("/mark-completed/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  logger.info(`标记学习计划完成: id=${id}`);
  
  let plan;
  if (id.match(/^[0-9a-fA-F]{24}$/)) {
    plan = await StudyPlan.findByIdAndUpdate(
      id,
      {
        planStatus: "completed",
        progress: 100,
        updateTime: new Date(),
      },
      { new: true }
    );
  } else {
    plan = await StudyPlan.findOneAndUpdate(
      { planId: parseInt(id) },
      {
        planStatus: "completed",
        progress: 100,
        updateTime: new Date(),
      },
      { new: true }
    );
  }
  
  if (!plan) {
    throw new AppError("学习计划不存在", 404);
  }
  
  Response.success(res, null, "标记完成成功");
}));

// 取消完成
router.put("/unmark-completed/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  logger.info(`取消学习计划完成: id=${id}`);
  
  let plan;
  if (id.match(/^[0-9a-fA-F]{24}$/)) {
    plan = await StudyPlan.findByIdAndUpdate(
      id,
      {
        planStatus: "in_progress",
        updateTime: new Date(),
      },
      { new: true }
    );
  } else {
    plan = await StudyPlan.findOneAndUpdate(
      { planId: parseInt(id) },
      {
        planStatus: "in_progress",
        updateTime: new Date(),
      },
      { new: true }
    );
  }
  
  if (!plan) {
    throw new AppError("学习计划不存在", 404);
  }
  
  Response.success(res, null, "取消完成成功");
}));

// 删除学习计划
router.delete("/delete/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  logger.info(`删除学习计划: id=${id}`);
  
  let plan;
  if (id.match(/^[0-9a-fA-F]{24}$/)) {
    plan = await StudyPlan.findByIdAndDelete(id);
  } else {
    plan = await StudyPlan.findOneAndDelete({ planId: parseInt(id) });
  }
  
  if (!plan) {
    throw new AppError("学习计划不存在", 404);
  }
  
  logger.info(`学习计划删除成功: id=${id}`);
  
  Response.success(res, null, "删除学习计划成功");
}));

module.exports = router;
