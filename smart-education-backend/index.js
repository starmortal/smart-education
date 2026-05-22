require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const http = require("http");
const logger = require("./utils/logger");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");
const socketManager = require("./utils/socketManager");

// 导入路由模块
const userRouter = require("./routes/user");
const aiRouter = require("./routes/ai");
const socialRouter = require("./routes/social");
const studyDataRouter = require("./routes/studyData");
const errorBookRouter = require("./routes/errorBook");

const noteRouter = require("./routes/note");
const studyPlanRouter = require("./routes/studyPlan");
const feedbackRouter = require("./routes/feedback");
const communityRouter = require("./routes/community");
const assistantRouter = require("./routes/assistant");
const chatRouter = require("./routes/chat");
const knowledgeRouter = require("./routes/knowledge");
const notificationRouter = require("./routes/notification");

/**
 * 智慧教育平台 - 后端服务器
 * 技术栈：Node.js + Express + MongoDB + DeepSeek AI + Socket.IO
 * 功能：用户管理、AI答题、错题本、学习笔记、学习计划、学习社区、数据统计、实时通知
 */

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;

// 初始化 Socket.IO
socketManager.initialize(server);
console.log("✅ Socket.IO 服务器初始化成功");
logger.info("Socket.IO 服务器初始化成功");

// 中间件配置
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// 静态文件服务（用于访问上传的文件）
app.use('/uploads', express.static('uploads'));

// CORS 跨域配置（允许前端访问）
app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:8081', 'http://127.0.0.1:8080'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id']
}));

// 连接 MongoDB 数据库（带重试机制）
const connectDB = async (retries = 5) => {
  for (let i = 0; i < retries; i++) {
    try {
      await mongoose.connect(process.env.MONGODB_URL, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log("✅ MongoDB数据库连接成功");
      logger.info("MongoDB数据库连接成功");
      return;
    } catch (err) {
      const attempt = i + 1;
      const delay = Math.pow(2, i) * 1000; // 指数退避：1s, 2s, 4s, 8s, 16s
      
      console.error(`❌ MongoDB连接失败 (尝试 ${attempt}/${retries}):`, err.message);
      logger.error(`MongoDB连接失败 (尝试 ${attempt}/${retries})`, err);
      
      if (attempt < retries) {
        console.log(`⏳ ${delay / 1000}秒后重试...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.error("❌ MongoDB连接失败，已达到最大重试次数");
        logger.error("MongoDB连接失败，已达到最大重试次数");
        process.exit(1);
      }
    }
  }
};

// 监听 MongoDB 连接事件
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB连接断开');
  logger.warn('MongoDB连接断开');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB重新连接成功');
  logger.info('MongoDB重新连接成功');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB连接错误:', err.message);
  logger.error('MongoDB连接错误', err);
});

// 执行数据库连接
connectDB();

// 路由挂载
app.use("/api/user", userRouter);
app.use("/api/ai", aiRouter);
app.use("/api/social", socialRouter);
app.use("/api/study-data", studyDataRouter);
app.use("/api/error-book", errorBookRouter);

app.use("/api/note", noteRouter);
app.use("/api/study-plan", studyPlanRouter);
app.use("/api/feedback", feedbackRouter);
app.use("/api/community", communityRouter);
app.use("/api/assistant", assistantRouter);
app.use("/api/chat", chatRouter);
app.use("/api/knowledge", knowledgeRouter);
app.use("/api/notification", notificationRouter);

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

// 启动服务器（使用 http server 而不是 app.listen，以支持 Socket.IO）
server.listen(PORT, () => {
  console.log(`🚀 后端服务器运行在 http://localhost:${PORT}`);
  logger.info(`后端服务器启动成功，端口：${PORT}`);
});
