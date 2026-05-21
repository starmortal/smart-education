const express = require("express");
const router = express.Router();
const User = require("../models/User");
const emailService = require("../utils/emailService");

/**
 * 用户管理路由模块
 * 功能：用户注册、登录、个人信息管理、考试记录管理等
 * 认证：部分接口需要 JWT 认证
 */

// 发送邮箱验证码接口
router.post("/send-code", async (req, res) => {
  try {
    const { email } = req.body;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "邮箱格式不正确" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "该邮箱已注册，请直接登录" });
    }

    const result = await emailService.sendVerificationCode(email);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      message: error.message || "发送验证码失败",
    });
  }
});

// 发送重置密码验证码接口
router.post("/send-reset-code", async (req, res) => {
  try {
    const { email } = req.body;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "邮箱格式不正确" });
    }

    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return res.status(400).json({ message: "该邮箱未注册" });
    }

    const result = await emailService.sendVerificationCode(email);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      message: error.message || "发送验证码失败",
    });
  }
});

// 重置密码接口
router.post("/reset-password", async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "邮箱格式不正确" });
    }

    const verifyResult = emailService.verifyCode(email, code);
    if (!verifyResult.success) {
      return res.status(400).json({ message: verifyResult.message });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: "密码至少8位" });
    }
    
    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasNumber = /\d/.test(newPassword);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
    
    if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
      return res.status(400).json({ 
        message: "密码必须包含大写字母、小写字母、数字和特殊字符" 
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "用户不存在" });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: "密码重置成功，请登录" });
  } catch (error) {
    res.status(500).json({
      message: "重置密码失败",
      error: error.message,
    });
  }
});

// 手机号注册接口
router.post("/register", async (req, res) => {
  try {
    const { phone, password, nickname, avatar } = req.body;

    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ message: "手机号已注册，请直接登录" });
    }

    const newUser = new User({
      phone,
      password,
      nickname: nickname || `用户${phone.slice(-4)}`,
      avatar: avatar || undefined,
    });

    await newUser.save();

    res.status(201).json({
      message: "注册成功",
      userId: newUser._id.toString(),
      nickname: newUser.nickname,
      avatar: newUser.avatar,
    });
  } catch (error) {
    res.status(500).json({
      message: "注册失败",
      error: error.message,
    });
  }
});

// 邮箱注册接口
router.post("/register-email", async (req, res) => {
  try {
    const { email, password, code, nickname, avatar } = req.body;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "邮箱格式不正确" });
    }

    const verifyResult = emailService.verifyCode(email, code);
    if (!verifyResult.success) {
      return res.status(400).json({ message: verifyResult.message });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "该邮箱已注册，请直接登录" });
    }

    const newUser = new User({
      email,
      password,
      nickname: nickname || `用户${email.split("@")[0]}`,
      avatar: avatar || undefined,
      emailVerified: true,
    });

    await newUser.save();

    // 生成 JWT token
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { userId: newUser._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: "注册成功",
      token: token,  // 返回 token
      userId: newUser._id.toString(),
      nickname: newUser.nickname,
      avatar: newUser.avatar,
    });
  } catch (error) {
    console.error("注册失败：", error);
    res.status(500).json({
      message: "注册失败",
      error: error.message,
    });
  }
});

// 登录接口（支持手机号或邮箱登录）
router.post("/login", async (req, res) => {
  try {
    const { account, password } = req.body;

    const user = await User.findOne({
      $or: [{ phone: account }, { email: account }],
    });

    if (!user) {
      return res.status(400).json({ message: "账号未注册，请先注册" });
    }

    if (user.password !== password) {
      return res.status(400).json({ message: "密码错误，请重新输入" });
    }

    user.lastLoginTime = Date.now();
    await user.save();

    // 生成 JWT token
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { userId: user._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }  // token 有效期 7 天
    );

    res.json({
      message: "登录成功",
      token: token,  // 返回 token
      userId: user._id.toString(),
      nickname: user.nickname,
      avatar: user.avatar,
    });
  } catch (error) {
    res.status(500).json({
      message: "登录失败",
      error: error.message,
    });
  }
});

// 获取用户信息
router.get("/profile/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: "用户不存在" });
    }

    const subjectFullScores = user.subjectFullScores ? 
      Object.fromEntries(user.subjectFullScores) : {};

    res.json({
      nickname: user.nickname,
      avatar: user.avatar,
      grade: user.grade || '',
      school: user.school || '',
      subjects: user.subjects || [],
      subjectFullScores: subjectFullScores
    });
  } catch (error) {
    console.error("获取用户信息失败：", error);
    res.status(500).json({ message: "获取用户信息失败" });
  }
});

// 更新用户信息
router.put("/profile/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { nickname, avatar, grade, subjects, subjectFullScores } = req.body;

    console.log("收到更新请求：", { userId, nickname, grade, subjects, subjectFullScores });

    const updateData = {
      nickname,
      avatar,
      grade,
      school: req.body.school || '',
      subjects
    };
    
    if (subjectFullScores) {
      updateData.subjectFullScores = new Map(Object.entries(subjectFullScores));
    }

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: "用户不存在" });
    }

    res.json({
      message: "更新成功",
      user: {
        nickname: user.nickname,
        avatar: user.avatar,
        grade: user.grade,
        school: user.school || '',
        subjects: user.subjects,
        subjectFullScores: user.subjectFullScores ? Object.fromEntries(user.subjectFullScores) : {}
      }
    });
  } catch (error) {
    console.error("更新失败：", error);
    res.status(500).json({ message: "更新失败", error: error.message });
  }
});

// 获取考试记录
router.get("/exams", async (req, res) => {
  try {
    const { userId } = req.query;
    const Exam = require("../models/Exam");
    
    const exams = await Exam.find({ userId })
      .sort({ examDate: -1 })
      .limit(50);

    const list = exams.map(exam => ({
      id: exam._id,
      examName: exam.examName,
      examDate: exam.examDate,
      scores: exam.scores,
      totalScore: exam.totalScore,
      totalFullScore: exam.totalFullScore || 0
    }));

    res.json({ list });
  } catch (error) {
    console.error("获取考试记录失败：", error);
    res.json({ list: [] });
  }
});

// 添加考试记录
router.post("/exams", async (req, res) => {
  try {
    const { userId, examName, examDate, scores, totalScore, totalFullScore } = req.body;
    const Exam = require("../models/Exam");

    const newExam = new Exam({
      userId,
      examName,
      examDate,
      scores,
      totalScore,
      totalFullScore: totalFullScore || 0
    });

    await newExam.save();

    res.json({
      message: "添加成功",
      examId: newExam._id
    });
  } catch (error) {
    console.error("添加考试记录失败：", error);
    res.status(500).json({ message: "添加失败" });
  }
});

// 删除考试记录
router.delete("/exams/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const Exam = require("../models/Exam");

    await Exam.findByIdAndDelete(id);
    res.json({ message: "删除成功" });
  } catch (error) {
    console.error("删除考试记录失败：", error);
    res.status(500).json({ message: "删除失败" });
  }
});

// 注销账号
router.delete("/account/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { email, code } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "用户不存在" });
    }
    
    if (user.email !== email) {
      return res.status(400).json({ message: "邮箱不匹配" });
    }
    
    const verifyResult = emailService.verifyCode(email, code);
    if (!verifyResult.success) {
      return res.status(400).json({ message: verifyResult.message });
    }
    
    const Exam = require("../models/Exam");
    const StudyPlan = require("../models/StudyPlan");
    const Note = require("../models/Note");
    const ErrorQuestion = require("../models/ErrorQuestion");
    const AIHistory = require("../models/AIHistory");
    const Feedback = require("../models/Feedback");
    
    await Promise.all([
      Exam.deleteMany({ userId: user._id.toString() }),
      StudyPlan.deleteMany({ userId: user._id.toString() }),
      Note.deleteMany({ userId: user._id.toString() }),
      ErrorQuestion.deleteMany({ userId: user._id.toString() }),
      AIHistory.deleteMany({ userId: user._id.toString() }),
      Feedback.deleteMany({ userId: user._id.toString() })
    ]);
    
    await User.findByIdAndDelete(userId);
    
    res.json({ message: "账号注销成功" });
  } catch (error) {
    console.error("注销账号失败：", error);
    res.status(500).json({ message: "注销失败", error: error.message });
  }
});

module.exports = router;
