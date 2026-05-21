const express = require("express");
const router = express.Router();
const ErrorQuestion = require("../models/ErrorQuestion");

/**
 * 错题本路由模块
 * 功能：错题的增删改查、掌握状态管理、多维度筛选
 * 用途：帮助学生整理错题，针对性复习，提高学习效率
 */

// 添加错题接口
router.post("/add", async (req, res) => {
  try {
    const { userId, questionTitle, subject, questionType, wrongReason, correctAnalysis, userAnswer } = req.body;

    if (!userId || !questionTitle || !subject) {
      return res.status(400).json({ message: "用户ID、题目标题、科目为必填项" });
    }

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

    res.status(201).json({ 
      message: "添加错题成功", 
      errorQuestionId: newErrorQuestion._id,
    });
  } catch (error) {
    console.error("添加错题接口错误：", error);
    res.status(500).json({ message: "添加错题失败，请重试" });
  }
});

// 获取用户错题统计数据
router.get("/stats/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

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

    res.json({
      message: "获取统计数据成功",
      totalCount,
      unmasteredCount,
      masteringCount,
      masteredCount,
      subjectStats: subjectStatsObj,
    });
  } catch (error) {
    console.error("获取统计数据接口错误：", error);
    res.status(500).json({ message: "获取统计数据失败，请重试" });
  }
});

// 获取用户错题列表
router.get("/list/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { pageNum = 1, pageSize = 10, subject, questionType, masteryStatus } = req.query;

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

    res.json({
      message: "获取错题列表成功",
      count: total,
      errorQuestions: formattedErrors,
    });
  } catch (error) {
    console.error("获取错题列表接口错误：", error);
    res.status(500).json({ message: "获取错题列表失败，请重试" });
  }
});

// 更新错题
router.put("/update/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { questionTitle, subject, questionType, masteryStatus, wrongReason, correctAnalysis } = req.body;
    
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
      return res.status(404).json({ message: "错题不存在" });
    }
    
    res.json({ message: "更新错题成功" });
  } catch (error) {
    console.error("更新错题失败：", error);
    res.status(500).json({ message: "更新错题失败" });
  }
});

// 标记掌握
router.put("/mark-mastered/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const errorQuestion = await ErrorQuestion.findByIdAndUpdate(
      id,
      {
        masteryStatus: "mastered",
        updateTime: new Date(),
      },
      { new: true }
    );
    
    if (!errorQuestion) {
      return res.status(404).json({ message: "错题不存在" });
    }
    
    res.json({ message: "标记掌握成功" });
  } catch (error) {
    console.error("标记掌握失败：", error);
    res.status(500).json({ message: "标记掌握失败" });
  }
});

// 删除错题
router.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const errorQuestion = await ErrorQuestion.findByIdAndDelete(id);
    
    if (!errorQuestion) {
      return res.status(404).json({ message: "错题不存在" });
    }
    
    res.json({ message: "删除错题成功" });
  } catch (error) {
    console.error("删除错题失败：", error);
    res.status(500).json({ message: "删除错题失败" });
  }
});

module.exports = router;
