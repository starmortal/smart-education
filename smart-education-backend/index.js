require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

// 导入路由模块
const userRouter = require("./routes/user");
const aiRouter = require("./routes/ai");
const studyDataRouter = require("./routes/studyData");
const errorBookRouter = require("./routes/errorBook");
const noteRouter = require("./routes/note");
const studyPlanRouter = require("./routes/studyPlan");
const feedbackRouter = require("./routes/feedback");
const communityRouter = require("./routes/community");

/**
 * 智慧教育平台 - 后端服务器
 * 技术栈：Node.js + Express + MongoDB + DeepSeek AI
 * 功能：用户管理、AI答题、错题本、学习笔记、学习计划、学习社区、数据统计
 */

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件配置
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// CORS 跨域配置（允许前端访问）
app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:8081', 'http://127.0.0.1:8080'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id']
}));

// 连接 MongoDB 数据库
mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => console.log("✅ MongoDB数据库连接成功"))
  .catch((err) => console.error("❌ MongoDB连接失败：", err));

// 路由挂载
app.use("/api/user", userRouter);
app.use("/api/ai", aiRouter);
app.use("/api/study-data", studyDataRouter);
app.use("/api/error-book", errorBookRouter);
app.use("/api/note", noteRouter);
app.use("/api/study-plan", studyPlanRouter);
app.use("/api/feedback", feedbackRouter);
app.use("/api/community", communityRouter);

// 健康检查接口
app.get("/api/test", (req, res) => {
  res.json({ message: "后端服务器运行正常！" });
});

// 全局错误处理中间件
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message || "服务器内部错误",
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 后端服务器运行在 http://localhost:${PORT}`);
});
