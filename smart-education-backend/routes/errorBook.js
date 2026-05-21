const express = require("express");
const router = express.Router();
const ErrorQuestion = require("../models/ErrorQuestion");
const Response = require("../utils/response");
const logger = require("../utils/logger");
const { asyncHandler, AppError } = require("../middleware/errorHandler");

/**
 * 错题本路由模块
 * 功能：错题的增删改查、掌握状态管理、多维度筛选
 * 用途：帮助学生整理错题，针对性复习，提高学习效率
 */

// 添加错题接口
router.post("/add", asyncHandler(async (req, res) => {
  const { userId, questionTitle, subject, questionType, wrongReason, correctAnalysis, userAnswer } = req.body;

  if (!userId || !questionTitle || !subject) {
    throw new AppError("用户ID、题目标题、科目为必填项", 400);
  }

  logger.info(`添加错题: userId=${userId}, questionTitle=${questionTitle}`);

  const newErrorQuestion = new ErrorQuestion({
    userId,
    questionTitle,
    subject,
    questionType: questionType || "single_choice",
    masteryStatus: "unmastered",
    wrongReason: wrongReason || "",
    correctAnalysis: correctAnalysis || "",
    userAnswer: userAnswer || "",
  });

  await newErrorQuestion.save();

  logger.info(`错题添加成功: errorQuestionId=${newErrorQuestion._id}`);

  Response.success(res, { 
    errorQuestionId: newErrorQuestion._id,
  }, "添加错题成功", 201);
}));

// 获取用户错题统计数据
router.get("/stats/:userId", asyncHandler(async (req, res) => {
  const { userId } = req.params;

  logger.info(`获取错题统计数据: userId=${userId}`);

  // 获取总数
  const totalCount = await ErrorQuestion.countDocuments({ userId });
  
  // 获取各状态数量
  const unmasteredCount = await ErrorQuestion.countDocuments({ 
    userId, 
    masteryStatus: "unmastered" 
  });
  
  const masteringCount = await ErrorQuestion.countDocuments({ 
    userId, 
    masteryStatus: "mastering" 
  });
  
  const masteredCount = await ErrorQuestion.countDocuments({ 
    userId, 
    masteryStatus: "mastered" 
  });

  // 获取各科目统计数据
  const subjectStats = await ErrorQuestion.aggregate([
    { $match: { userId } },
    { 
      $group: { 
        _id: "$subject", 
        count: { $sum: 1 } 
      } 
    }
  ]);

  // 转换为对象格式，方便前端使用
  const subjectStatsObj = {};
  subjectStats.forEach(item => {
    subjectStatsObj[item._id] = item.count;
  });

  Response.success(res, {
    totalCount,
    unmasteredCount,
    masteringCount,
    masteredCount,
    subjectStats: subjectStatsObj,
  }, "获取统计数据成功");
}));

// 获取用户错题列表
router.get("/list/:userId", asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { pageNum = 1, pageSize = 10, subject, questionType, masteryStatus } = req.query;

  logger.info(`获取错题列表: userId=${userId}, pageNum=${pageNum}, pageSize=${pageSize}`);

  const query = { userId };
  if (subject) query.subject = subject;
  if (questionType) query.questionType = questionType;
  if (masteryStatus) query.masteryStatus = masteryStatus;

  const total = await ErrorQuestion.countDocuments(query);

  const errorQuestions = await ErrorQuestion.find(query)
    .sort({ addTime: -1 })
    .skip((pageNum - 1) * pageSize)
    .limit(parseInt(pageSize));

  const formattedErrors = errorQuestions.map(eq => ({
    id: eq._id,
    userId: eq.userId,
    questionTitle: eq.questionTitle,
    subject: eq.subject,
    questionType: eq.questionType,
    masteryStatus: eq.masteryStatus,
    wrongReason: eq.wrongReason,
    correctAnalysis: eq.correctAnalysis,
    userAnswer: eq.userAnswer,
    addTime: eq.addTime?.toLocaleString() || "",
  }));

  Response.success(res, {
    count: total,
    errorQuestions: formattedErrors,
  }, "获取错题列表成功");
}));

// 更新错题
router.put("/update/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { questionTitle, subject, questionType, masteryStatus, wrongReason, correctAnalysis } = req.body;
  
  logger.info(`更新错题: id=${id}`);
  
  const errorQuestion = await ErrorQuestion.findByIdAndUpdate(
    id,
    {
      questionTitle,
      subject,
      questionType,
      masteryStatus,
      wrongReason,
      correctAnalysis,
      updateTime: new Date(),
    },
    { new: true }
  );
  
  if (!errorQuestion) {
    throw new AppError("错题不存在", 404);
  }
  
  logger.info(`错题更新成功: id=${id}`);
  
  Response.success(res, null, "更新错题成功");
}));

// 标记掌握
router.put("/mark-mastered/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  logger.info(`标记错题掌握: id=${id}`);
  
  const errorQuestion = await ErrorQuestion.findByIdAndUpdate(
    id,
    {
      masteryStatus: "mastered",
      updateTime: new Date(),
    },
    { new: true }
  );
  
  if (!errorQuestion) {
    throw new AppError("错题不存在", 404);
  }
  
  Response.success(res, null, "标记掌握成功");
}));

// 删除错题
router.delete("/delete/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  logger.info(`删除错题: id=${id}`);
  
  const errorQuestion = await ErrorQuestion.findByIdAndDelete(id);
  
  if (!errorQuestion) {
    throw new AppError("错题不存在", 404);
  }
  
  logger.info(`错题删除成功: id=${id}`);
  
  Response.success(res, null, "删除错题成功");
}));

module.exports = router;
