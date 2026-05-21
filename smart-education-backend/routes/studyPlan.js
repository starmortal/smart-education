const express = require("express");
const router = express.Router();
const StudyPlan = require("../models/StudyPlan");
const { formatBeijingTime, formatBeijingTimeSimple } = require("../utils/timeHelper");

/**
 * 学习计划路由模块
 * 功能：学习计划的增删改查、进度跟踪、状态管理
 * 用途：帮助学生制定学习计划，培养良好的学习习惯
 */

// 获取用户学习计划统计数据
router.get("/stats/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

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

    res.json({
      message: "获取统计数据成功",
      totalCount,
      notStartedCount,
      inProgressCount,
      completedCount,
      overdueCount,
      statusStats: statusStatsObj,
    });
  } catch (error) {
    console.error("获取统计数据接口错误：", error);
    res.status(500).json({ message: "获取统计数据失败，请重试" });
  }
});

// 获取学习计划列表
router.get("/list", async (req, res) => {
  try {
    const { userId, pageNum = 1, pageSize = 10, planStatus, subject } = req.query;
    
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
    
    res.json({
      plans: formattedPlans,
      count: total,
      message: "获取学习计划列表成功",
    });
  } catch (error) {
    console.error("获取学习计划列表失败：", error);
    res.status(500).json({ message: "获取学习计划列表失败" });
  }
});

// 新增学习计划
router.post("/add", async (req, res) => {
  try {
    const { userId, planTitle, subject, startTime, endTime, description, targetProgress, progress } = req.body;
    
    if (!userId || !planTitle || !subject || !startTime || !endTime) {
      return res.status(400).json({ message: "必填字段不能为空" });
    }
    
    // 【新增】根据进度自动设置初始状态
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
      return res.status(500).json({ message: "生成计划ID失败，请重试" });
    }
    
    console.log("=== 新增计划状态设置 ===");
    console.log("初始进度:", initialProgress);
    console.log("自动状态:", initialStatus);
    
    const newPlan = new StudyPlan({
      planId,
      userId,
      planTitle,
      subject,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      description: description || "",
      planStatus: initialStatus, // 使用自动设置的状态
      progress: initialProgress,
      targetProgress: targetProgress || 100,
    });
    
    await newPlan.save();
    
    res.status(201).json({
      message: "新增学习计划成功",
      planId: newPlan.planId,
      initialStatus: initialStatus,
      startTimeFormatted: formatBeijingTime(newPlan.startTime),
      endTimeFormatted: formatBeijingTime(newPlan.endTime),
    });
  } catch (error) {
    console.error("新增学习计划失败：", error);
    res.status(500).json({ 
      message: "新增学习计划失败",
      error: error.message 
    });
  }
});

// 更新学习计划
router.put("/update/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { planTitle, subject, startTime, endTime, description, planStatus, progress, targetProgress } = req.body;
    
    // 【新增】根据进度自动调整计划状态
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
    
    console.log("=== 后端状态调整 ===");
    console.log("原始状态:", planStatus);
    console.log("进度:", progress);
    console.log("最终状态:", finalStatus);
    
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
      return res.status(404).json({ message: "学习计划不存在" });
    }
    
    res.json({ 
      message: "更新学习计划成功",
      statusChanged: finalStatus !== planStatus,
      finalStatus: finalStatus,
      startTimeFormatted: formatBeijingTime(plan.startTime),
      endTimeFormatted: formatBeijingTime(plan.endTime),
      updateTimeFormatted: formatBeijingTime(plan.updateTime)
    });
  } catch (error) {
    console.error("更新学习计划失败：", error);
    res.status(500).json({ message: "更新学习计划失败", error: error.message });
  }
});

// 标记完成
router.put("/mark-completed/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
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
      return res.status(404).json({ message: "学习计划不存在" });
    }
    
    res.json({ message: "标记完成成功" });
  } catch (error) {
    console.error("标记完成失败：", error);
    res.status(500).json({ message: "标记完成失败", error: error.message });
  }
});

// 取消完成
router.put("/unmark-completed/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
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
      return res.status(404).json({ message: "学习计划不存在" });
    }
    
    res.json({ message: "取消完成成功" });
  } catch (error) {
    console.error("取消完成失败：", error);
    res.status(500).json({ message: "取消完成失败", error: error.message });
  }
});

// 删除学习计划
router.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    let plan;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      plan = await StudyPlan.findByIdAndDelete(id);
    } else {
      plan = await StudyPlan.findOneAndDelete({ planId: parseInt(id) });
    }
    
    if (!plan) {
      return res.status(404).json({ message: "学习计划不存在" });
    }
    
    res.json({ message: "删除学习计划成功" });
  } catch (error) {
    console.error("删除学习计划失败：", error);
    res.status(500).json({ message: "删除学习计划失败", error: error.message });
  }
});

module.exports = router;
