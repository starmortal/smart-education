const express = require("express");
const router = express.Router();
const StudyPlan = require("../models/StudyPlan");
const ErrorQuestion = require("../models/ErrorQuestion");

/**
 * 学习数据统计路由模块
 * 功能：提供学习数据的统计分析，包括学习计划完成率、错题数量等
 * 用途：为学生提供可视化的学习数据分析，帮助了解学习进度和效果
 */

// 获取学习数据统计（概览 + 明细列表）
router.get("/list", async (req, res) => {
  try {
    const pageNum = Number(req.query.pageNum || 1);
    const pageSize = Number(req.query.pageSize || 10);
    const userId = req.query.userId;

    // 验证用户ID是否存在
    if (!userId) {
      return res.json({
        data: {
          overview: {
            completedPlanCount: 0,
            totalPlanCount: 0,
            planCompletionRate: 0,
            errorQuestionCount: 0,
            totalStudyHours: 0,
            avgDailyStudyHours: 0,
          },
          detail: { records: [], total: 0 },
        },
        message: "未提供用户ID",
      });
    }

    // 并行查询用户的学习计划、错题数据（提升查询效率）
    const [studyPlans, errorQuestions] = await Promise.all([
      StudyPlan.find({ userId }).sort({ createTime: -1 }),
      ErrorQuestion.find({ userId }).sort({ addTime: -1 }),
    ]);

    // 统计学习计划完成情况
    const totalPlanCount = studyPlans.length;
    const completedPlanCount = studyPlans.filter(p => p.planStatus === "completed").length;
    const planCompletionRate = totalPlanCount > 0 
      ? Math.round((completedPlanCount / totalPlanCount) * 100) 
      : 0;
    
    // 统计错题数量
    const errorQuestionCount = errorQuestions.length;
    
    // 估算学习时长（基于完成的计划数量）
    const totalStudyHours = completedPlanCount * 1.5;
    const avgDailyStudyHours = totalStudyHours > 0 ? Number((totalStudyHours / 7).toFixed(1)) : 0;

    // 构建概览数据
    const overview = {
      completedPlanCount,
      totalPlanCount,
      planCompletionRate,
      errorQuestionCount,
      totalStudyHours,
      avgDailyStudyHours,
    };

    // 构建学习明细列表（合并学习计划、错题数据）
    const allRecords = [];
    let idCounter = 1;

    // 添加学习计划记录
    studyPlans.forEach(plan => {
      allRecords.push({
        id: idCounter++,
        date: plan.createTime?.toLocaleDateString() || new Date().toLocaleDateString(),
        subject: plan.subject || "math",
        content: `学习计划：${plan.planTitle || "未命名计划"}`,
        value: plan.planStatus === "completed" ? "已完成" : "进行中",
      });
    });

    // 添加错题记录
    errorQuestions.forEach(eq => {
      allRecords.push({
        id: idCounter++,
        date: eq.addTime?.toLocaleDateString() || new Date().toLocaleDateString(),
        subject: eq.subject || "math",
        content: `错题收录：${eq.questionTitle || "未命名错题"}`,
        value: eq.masteryStatus === "mastered" ? "已掌握" : "待复习",
      });
    });

    // 分页处理
    const total = allRecords.length;
    const records = allRecords.slice((pageNum - 1) * pageSize, pageNum * pageSize);

    res.json({
      data: {
        overview,
        detail: {
          records,
          total,
        },
      },
      message: "获取学习数据成功",
    });
  } catch (error) {
    console.error("获取学习数据失败：", error);
    res.status(500).json({ message: "获取学习数据失败" });
  }
});

module.exports = router;
