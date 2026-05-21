const express = require("express");
const router = express.Router();
const Feedback = require("../models/Feedback");
const { sendFeedbackNotification } = require("../utils/emailService");

/**
 * 意见反馈路由模块
 * 功能：收集用户对平台的意见和建议，帮助改进产品
 * 用途：用户可以提交功能建议、问题反馈、使用体验等
 */

// 提交反馈
router.post("/submit", async (req, res) => {
  try {
    const { userId, nickname, type, contact, content, screenshots } = req.body;

    // 验证反馈内容长度
    if (!content || content.trim().length < 10) {
      return res.status(400).json({ message: "反馈内容至少10个字符" });
    }

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

    console.log(`📝 收到新反馈 [${type}] 来自用户: ${nickname}`);

    // 发送邮件通知到管理员邮箱
    try {
      await sendFeedbackNotification({
        feedbackId: feedback._id,
        nickname,
        type,
        content,
        createTime: feedback.createTime,
      });
      console.log(`✉️ 反馈通知邮件已发送`);
    } catch (emailError) {
      console.error("发送反馈通知邮件失败：", emailError);
      // 邮件发送失败不影响反馈提交
    }

    res.json({
      message: "反馈提交成功，感谢您的宝贵意见！",
      feedbackId: feedback._id,
    });
  } catch (error) {
    console.error("提交反馈失败：", error);
    res.status(500).json({
      message: "提交失败，请重试",
      error: error.message,
    });
  }
});

// 获取用户的反馈历史
router.get("/history", async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ message: "缺少用户ID" });
    }

    // 查询用户的反馈记录（最近20条）
    const feedbacks = await Feedback.find({ userId })
      .sort({ createTime: -1 })
      .limit(20)
      .select("type content status reply createTime")
      .lean();

    // 格式化返回数据
    const list = feedbacks.map((item) => ({
      id: item._id,
      type: item.type,
      content: item.content.length > 50 ? item.content.substring(0, 50) + "..." : item.content,
      status: item.status,
      reply: item.reply || "",
      date: item.createTime.toISOString().split("T")[0],
    }));

    // 统计反馈总数
    const total = await Feedback.countDocuments({ userId });

    res.json({
      list,
      stats: {
        total,
        processed: 0,
      },
    });
  } catch (error) {
    console.error("获取反馈历史失败：", error);
    res.status(500).json({ message: "获取反馈历史失败" });
  }
});

// 管理员回复反馈
router.post("/reply", async (req, res) => {
  try {
    const { feedbackId, reply, adminId } = req.body;

    if (!feedbackId || !reply) {
      return res.status(400).json({ message: "缺少必要参数" });
    }

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
      return res.status(404).json({ message: "反馈不存在" });
    }

    console.log(`✅ 管理员已回复反馈 [${feedbackId}]`);

    res.json({
      message: "回复成功",
      feedback: {
        id: feedback._id,
        status: feedback.status,
        reply: feedback.reply,
      },
    });
  } catch (error) {
    console.error("回复反馈失败：", error);
    res.status(500).json({
      message: "回复失败，请重试",
      error: error.message,
    });
  }
});

// 管理员获取所有反馈列表（内部接口，不暴露给前端导航）
router.get("/admin/list", async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    
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

    res.json({
      list: feedbacks,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error("获取反馈列表失败：", error);
    res.status(500).json({ message: "获取反馈列表失败" });
  }
});

module.exports = router;
