require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const logger = require("./utils/logger");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");

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
  .then(() => {
    console.log("✅ MongoDB数据库连接成功");
    logger.info("MongoDB数据库连接成功");
  })
  .catch((err) => {
    console.error("❌ MongoDB连接失败：", err);
    logger.error("MongoDB连接失败", err);
    process.exit(1);
  });

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
  res.json({ 
    code: 200,
    message: "后端服务器运行正常",
    data: {
      status: "healthy",
      timestamp: Date.now(),
      environment: process.env.NODE_ENV || "development"
    }
  });
});

// 404 错误处理
app.use(notFoundHandler);

// 全局错误处理中间件
app.use(errorHandler);

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 后端服务器运行在 http://localhost:${PORT}`);
  logger.info(`后端服务器启动成功，端口：${PORT}`);
});
