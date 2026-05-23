const express = require("express");
const router = express.Router();
const ErrorQuestion = require("../models/ErrorQuestion");
const Response = require("../utils/response");
const logger = require("../utils/logger");
const { asyncHandler, AppError } = require("../middleware/errorHandler");
const ai = require("../utils/ai");
const { annotateErrorQuestion, batchAnnotateUserErrors, extractKnowledgePoints } = require("../services/knowledgePointService");

/**
 * 错题本路由模块
 * 功能：错题的增删改查、掌握状态管理、多维度筛选
 * 用途：帮助学生整理错题，针对性复习，提高学习效率
 */

// 添加错题接口
router.post("/add", asyncHandler(async (req, res) => {
  const { userId, questionTitle, subject, questionType, wrongReason, correctAnalysis, userAnswer, knowledgePoints } = req.body;

  if (!userId || !questionTitle || !subject) {
    throw new AppError("用户ID、题目标题、科目为必填项", 400);
  }

  logger.info(`添加错题: userId=${userId}, questionTitle=${questionTitle}`);

  let resolvedKnowledgePoints = Array.isArray(knowledgePoints)
    ? knowledgePoints.filter(Boolean).slice(0, 5)
    : [];

  if (resolvedKnowledgePoints.length === 0) {
    resolvedKnowledgePoints = await extractKnowledgePoints({
      questionTitle,
      subject,
      wrongReason: wrongReason || '',
    });
  }

  const newErrorQuestion = new ErrorQuestion({
    userId,
    questionTitle,
    subject,
    questionType: questionType || "single_choice",
    masteryStatus: "unmastered",
    wrongReason: wrongReason || "",
    knowledgePoints: resolvedKnowledgePoints,
    correctAnalysis: correctAnalysis || "",
    userAnswer: userAnswer || "",
  });

  await newErrorQuestion.save();

  // 后台补全知识点（若首次为兜底结果）
  annotateErrorQuestion(newErrorQuestion._id).catch((err) => {
    logger.warn(`错题知识点补标注失败: ${newErrorQuestion._id}`, err.message);
  });

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

// 获取日历错题数据（按日期统计每天错题数）
router.get("/calendar/:userId", asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { year, month } = req.query;

  logger.info(`获取日历数据: userId=${userId}, year=${year}, month=${month}`);

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const pipeline = [
    { $match: { userId, addTime: { $gte: startDate, $lte: endDate } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$addTime" } },
        count: { $sum: 1 },
      }
    },
    { $sort: { _id: 1 } }
  ];

  const results = await ErrorQuestion.aggregate(pipeline);
  const dates = results.map(r => ({ date: r._id, count: r.count }));

  Response.success(res, { dates }, "获取日历数据成功");
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
    knowledgePoints: eq.knowledgePoints || [],
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

// 构建错题分析数据（工具函数）
function buildErrorAnalysisData(date, errors) {
  const subjectTextMap = {
    math: "数学", chinese: "语文", english: "英语",
    physics: "物理", chemistry: "化学", biology: "生物",
    history: "历史", geography: "地理", politics: "政治"
  };
  const typeTextMap = {
    single_choice: "选择题", multiple_choice: "多选题",
    blank: "填空题", short_answer: "简答题", calculation: "计算题"
  };
  const statusTextMap = {
    unmastered: "未掌握", mastering: "正在掌握", mastered: "已掌握"
  };

  const subjectStats = {};
  errors.forEach(e => {
    const sub = subjectTextMap[e.subject] || e.subject;
    subjectStats[sub] = (subjectStats[sub] || 0) + 1;
  });

  const errorsText = errors.map((e, i) => {
    return `错题${i + 1}：${e.questionTitle}
- 科目：${subjectTextMap[e.subject] || e.subject}
- 题型：${typeTextMap[e.questionType] || e.questionType}
- 状态：${statusTextMap[e.masteryStatus] || e.masteryStatus}
- 原因：${e.wrongReason || '未填写'}
- 解析：${e.correctAnalysis || '未填写'}`;
  }).join('\n\n');

  const subjectDistText = Object.entries(subjectStats)
    .map(([sub, count]) => `${sub} ${count}道`)
    .join('、');

  return { errorsText, subjectDistText, subjectStats };
}

// AI 分析错题（流式输出）
router.post("/ai-analyze-stream", asyncHandler(async (req, res) => {
  const { userId, date, errors } = req.body;

  if (!userId || !errors || !Array.isArray(errors) || errors.length === 0) {
    throw new AppError("用户ID和错题数据为必填项", 400);
  }

  logger.info(`AI分析错题(流式): userId=${userId}, date=${date || '全部'}, count=${errors.length}`);

  const { errorsText, subjectDistText } = buildErrorAnalysisData(date, errors);

  const prompt = `你是学习分析助手，根据以下学生错题记录做简洁分析。

## 错题概况
- 日期：${date || '全部错题'}
- 总数：${errors.length}道
- 学科：${subjectDistText}

## 错题详情
${errorsText}

## 输出要求
用中文和markdown格式，按以下结构，每条一两句话，不要废话：

### 整体情况
一句话总结掌握水平

### 薄弱学科
列出最弱的学科及具体问题

### 错误类型
归纳主要错误原因（概念不清/公式记错/审题失误/计算错误等）

### 改进建议
2-3条具体可操作的建议`;

  // 设置 SSE 响应头
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  try {
    await ai.chatStream(prompt, [], (chunk) => {
      res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`);
    });

    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();
    logger.info(`AI分析错题流式完成: userId=${userId}`);
  } catch (error) {
    logger.error(`AI分析错题(流式)失败: ${error.message}`);
    res.write(`data: ${JSON.stringify({ type: 'error', message: 'AI分析失败，请稍后重试' })}\n\n`);
    res.end();
  }
}));

// AI 分析错题（非流式，兼容旧调用）
router.post("/ai-analyze", asyncHandler(async (req, res) => {
  const { userId, date, errors } = req.body;

  if (!userId || !errors || !Array.isArray(errors) || errors.length === 0) {
    throw new AppError("用户ID和错题数据为必填项", 400);
  }

  logger.info(`AI分析错题: userId=${userId}, date=${date || '全部'}, count=${errors.length}`);

  const { errorsText, subjectDistText } = buildErrorAnalysisData(date, errors);

  const prompt = `你是学习分析助手，根据以下学生错题记录做简洁分析。

## 错题概况
- 日期：${date || '全部错题'}
- 总数：${errors.length}道
- 学科：${subjectDistText}

## 错题详情
${errorsText}

## 输出要求
用中文和markdown格式，按以下结构，每条一两句话，不要废话：

### 整体情况
一句话总结掌握水平

### 薄弱学科
列出最弱的学科及具体问题

### 错误类型
归纳主要错误原因（概念不清/公式记错/审题失误/计算错误等）

### 改进建议
2-3条具体可操作的建议`;

  try {
    const result = await ai.chat(prompt);
    logger.info(`AI分析错题完成: userId=${userId}`);
    Response.success(res, { analysis: result }, "AI分析成功");
  } catch (error) {
    logger.error(`AI分析错题失败: ${error.message}`);
    throw new AppError("AI分析失败，请稍后重试", 500);
  }
}));

// 批量 AI 标注错题知识点
router.post("/batch-annotate-knowledge", asyncHandler(async (req, res) => {
  const { userId, limit = 20 } = req.body;
  if (!userId) {
    throw new AppError("用户ID为必填项", 400);
  }
  const count = await batchAnnotateUserErrors(userId, limit);
  Response.success(res, { count }, `已标注 ${count} 道错题知识点`);
}));

// 单题提取知识点（预览）
router.post("/extract-knowledge-points", asyncHandler(async (req, res) => {
  const { questionTitle, subject, wrongReason } = req.body;
  if (!questionTitle || !subject) {
    throw new AppError("题目标题和科目为必填项", 400);
  }
  const knowledgePoints = await extractKnowledgePoints({ questionTitle, subject, wrongReason });
  Response.success(res, { knowledgePoints }, "知识点提取成功");
}));

module.exports = router;
