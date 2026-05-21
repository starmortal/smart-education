const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const ai = require("../utils/ai");
const AIHistory = require("../models/AIHistory");
const ScoreAnalysis = require("../models/ScoreAnalysis");
const { authMiddleware } = require("../middleware/authMiddleware");

// 配置 multer 文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("不支持的文件类型"));
    }
  },
});

/**
 * AI 答题路由模块
 * 功能：提供文字答题、图片答题、文件答题等 AI 辅助学习功能
 * 技术：DeepSeek AI 大模型（deepseek-chat）
 */

// 文字答题接口（支持文件上传）- 流式输出
router.post("/text-answer-stream", authMiddleware, upload.array("files", 5), async (req, res) => {
  try {
    const { question, sessionId } = req.body;
    const userId = req.userId;
    const files = req.files || [];

    if ((!question || question.trim() === "") && files.length === 0) {
      return res.status(400).json({ message: "请输入问题内容或上传文件" });
    }

    console.log("📝 收到流式文字答题请求：", question?.substring(0, 50) || "[文件上传]", "文件数量：", files.length);

    // 设置 SSE 响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // 禁用 Nginx 缓冲

    // 构建完整的问题（包含文件信息）
    let fullQuestion = question || "请分析这些文件";
    
    if (files.length > 0) {
      const fileInfo = files.map(f => `文件名：${f.originalname}，类型：${f.mimetype}`).join("\n");
      fullQuestion += `\n\n上传的文件：\n${fileInfo}`;
    }

    let fullAnswer = "";

    // 调用 DeepSeek AI 流式接口
    await ai.chatStream(fullQuestion, [], (chunk) => {
      fullAnswer += chunk;
      // 实时发送每一块内容
      res.write(`data: ${JSON.stringify({ content: chunk, done: false })}\n\n`);
    });

    // 发送完成标记
    res.write(`data: ${JSON.stringify({ content: '', done: true })}\n\n`);

    // 保存到历史记录
    let historyRecord;
    let currentSessionId = sessionId;
    
    if (currentSessionId) {
      historyRecord = await AIHistory.findOne({ _id: currentSessionId, userId });
      
      if (historyRecord) {
        historyRecord.messages.push({
          question: fullQuestion,
          answer: fullAnswer,
          timestamp: new Date(),
        });
        historyRecord.updateTime = new Date();
        await historyRecord.save();
      } else {
        currentSessionId = null;
      }
    }
    
    if (!currentSessionId) {
      const title = (question || "文件分析").length > 20 
        ? (question || "文件分析").substring(0, 20) + "..." 
        : (question || "文件分析");
      historyRecord = await AIHistory.create({
        userId,
        title,
        type: files.length > 0 ? "file" : "text",
        messages: [{
          question: fullQuestion,
          answer: fullAnswer,
          timestamp: new Date(),
        }],
      });
    }

    // 发送会话ID
    res.write(`data: ${JSON.stringify({ sessionId: historyRecord._id, done: true })}\n\n`);
    res.end();

    // 清理上传的文件
    files.forEach(file => {
      try {
        fs.unlinkSync(file.path);
      } catch (err) {
        console.error("清理文件失败：", err);
      }
    });

    console.log("✅ 流式答题完成");
  } catch (error) {
    console.error("❌ 流式文字答题接口错误：", error);
    
    // 清理上传的文件
    if (req.files) {
      req.files.forEach(file => {
        try {
          fs.unlinkSync(file.path);
        } catch (err) {
          console.error("清理文件失败：", err);
        }
      });
    }
    
    if (!res.headersSent) {
      res.status(500).json({ 
        message: error.message || "AI答题失败，请重试" 
      });
    } else {
      res.write(`data: ${JSON.stringify({ error: error.message || "AI答题失败" })}\n\n`);
      res.end();
    }
  }
});

// 图片答题接口
router.post("/image-answer", authMiddleware, async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    const userId = req.userId;

    if (!imageBase64) {
      return res.status(400).json({ message: "请上传图片" });
    }

    console.log("📷 收到图片答题请求，图片大小：", imageBase64.length, "字符");

    // 注意：DeepSeek 目前不支持图片识别，需要配合 OCR 服务使用
    // 这里暂时返回提示信息，实际使用时需要集成 OCR 服务
    const result = {
      question: "图片识别功能开发中",
      answer: "DeepSeek 模型暂不支持直接识别图片，建议使用文字输入功能。如需图片识别，可以集成第三方 OCR 服务。"
    };

    // 保存到历史记录（创建新会话）
    const title = "图片识别";
    const historyRecord = await AIHistory.create({
      userId,
      title,
      type: "image",
      messages: [{
        question: result.question,
        answer: result.answer,
        timestamp: new Date(),
      }],
    });

    res.json({
      question: result.question,
      answer: result.answer,
    });
  } catch (error) {
    console.error("❌ 图片答题接口错误：", error);
    res.status(500).json({ 
      message: error.message || "图片识别答题失败，请重试" 
    });
  }
});

// AI 服务测试接口（用于检测 DeepSeek AI 服务是否正常）
router.get("/test", async (req, res) => {
  try {
    const testQuestion = "你好，请做一个简单的自我介绍";
    const answer = await ai.chat(testQuestion);
    
    res.json({
      status: "success",
      message: "DeepSeek AI服务正常",
      test_question: testQuestion,
      test_answer: answer,
    });
  } catch (error) {
    console.error("❌ DeepSeek AI服务测试失败：", error);
    res.status(500).json({
      status: "error",
      message: "DeepSeek AI服务异常：" + error.message,
    });
  }
});

// 文件答题接口（支持上传文档让 AI 分析）
router.post("/file-answer", authMiddleware, async (req, res) => {
  try {
    const { fileBase64, fileName, fileType } = req.body;
    const userId = req.userId;

    if (!fileBase64) {
      return res.status(400).json({ message: "请上传文件" });
    }

    console.log("📄 收到文件答题请求：", fileName);

    // 提取文件基本信息（实际项目中可使用专业的文件解析库如 pdf-parse、mammoth 等）
    const content = `文件名：${fileName}，类型：${fileType}`;
    
    // 构造问题让 AI 分析文件内容
    const question = `请分析以下文件内容并提供学习建议：${content}`;
    
    // 调用 DeepSeek AI 大模型进行分析
    const answer = await ai.answerQuestion(question);
    const finalAnswer = answer || "AI暂时无法分析该文件，请尝试其他格式~";

    // 保存到历史记录（创建新会话）
    const title = `[文件] ${fileName}`;
    const historyRecord = await AIHistory.create({
      userId,
      title,
      type: "file",
      messages: [{
        question: `[文件] ${fileName}`,
        answer: finalAnswer,
        timestamp: new Date(),
      }],
    });

    res.json({
      content: content.substring(0, 100),
      answer: finalAnswer,
    });
  } catch (error) {
    console.error("❌ 文件答题接口错误：", error);
    res.status(500).json({ 
      message: error.message || "文件分析失败，请重试" 
    });
  }
});

// 获取 AI 问答历史记录列表（支持分页）
router.get("/history", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const { page = 1, limit = 20 } = req.query;

    // 分页查询历史记录，按更新时间倒序排列
    const skip = (page - 1) * limit;
    const historyList = await AIHistory.find({ userId })
      .sort({ updateTime: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select("_id title type createTime updateTime question")
      .lean();

    // 格式化返回数据（兼容旧数据）
    const formattedList = historyList.map((item) => ({
      id: item._id,
      title: item.title || (item.question ? (item.question.length > 20 ? item.question.substring(0, 20) + "..." : item.question) : "未命名对话"),
      type: item.type,
      date: (item.updateTime || item.createTime).toISOString().split("T")[0],
    }));

    const total = await AIHistory.countDocuments({ userId });

    res.json({
      list: formattedList,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error("❌ 获取历史记录失败：", error);
    res.status(500).json({ message: "获取历史记录失败" });
  }
});

// 获取 AI 问答历史记录详情
router.get("/history/:id", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const history = await AIHistory.findOne({ _id: id, userId }).lean();

    if (!history) {
      return res.status(404).json({ message: "历史记录不存在" });
    }

    // 兼容旧数据格式
    let messages = history.messages;
    if (!messages && history.question && history.answer) {
      // 旧数据格式，转换为新格式
      messages = [{
        question: history.question,
        answer: history.answer,
        timestamp: history.createTime
      }];
    }

    res.json({
      id: history._id,
      title: history.title || history.question || "未命名对话",
      type: history.type,
      messages: messages || [],
      date: (history.updateTime || history.createTime).toISOString().split("T")[0],
      createTime: history.createTime,
      updateTime: history.updateTime || history.createTime,
    });
  } catch (error) {
    console.error("❌ 获取历史详情失败：", error);
    res.status(500).json({ message: "获取历史详情失败" });
  }
});

// 删除 AI 问答历史记录
router.delete("/history/:id", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const result = await AIHistory.deleteOne({ _id: id, userId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "历史记录不存在或无权删除" });
    }

    res.json({ message: "删除成功" });
  } catch (error) {
    console.error("❌ 删除历史记录失败：", error);
    res.status(500).json({ message: "删除历史记录失败" });
  }
});

// AI 成绩分析接口（流式输出）
router.post("/analyze-scores-stream", authMiddleware, async (req, res) => {
  try {
    const { examList, userInfo } = req.body;
    const userId = req.userId;

    if (!examList || examList.length === 0) {
      return res.status(400).json({ message: "暂无考试记录，无法进行分析" });
    }

    console.log("📊 收到成绩分析请求（流式），考试数量：", examList.length);

    // 设置 SSE 响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // 构建成绩数据摘要
    const scoresSummary = examList.map(exam => {
      const scoresText = exam.scores.map(s => 
        `${s.subject}: ${s.score}/${s.fullScore || 150}分 (${((s.score / (s.fullScore || 150)) * 100).toFixed(1)}%)`
      ).join(', ');
      return `${exam.examName} (${exam.examDate}): ${scoresText}, 总分: ${exam.totalScore}`;
    }).join('\n');

    // 构建 AI 分析提示词
    const prompt = `你是一位专业的教育顾问，请根据学生的考试成绩进行简要分析。

学生信息：
- 年级：${userInfo.grade || '未设置'}
- 学习科目：${userInfo.subjects.join('、')}

考试成绩记录：
${scoresSummary}

请按照以下格式进行分析（使用 Markdown 格式，每部分保持简洁）：

## 📊 总体表现
（1-2句话总结整体成绩水平和平均得分率）

## ✅ 优势科目
（列出得分率最高的2-3个科目，简要说明）

## ⚠️ 需要加强的科目
（列出得分率较低的科目，给出1-2条改进建议）

## 📈 成绩趋势
（1句话分析最近的成绩变化趋势）

## 💡 学习建议
（给出3条具体的、可操作的学习建议）

注意：
1. 每个部分保持简洁，不要过于冗长
2. 重点关注得分率而不是绝对分数
3. 建议要具体、可操作`;

    // 调用 DeepSeek AI 流式接口
    await ai.chatStream(prompt, [], (chunk) => {
      // 实时发送每一块内容
      res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
    });

    // 发送完成标记
    res.write('data: [DONE]\n\n');
    res.end();

    console.log("✅ AI 成绩分析（流式）完成");
  } catch (error) {
    console.error("❌ AI 成绩分析（流式）失败：", error);
    
    // 如果还没有发送响应头，发送错误响应
    if (!res.headersSent) {
      res.status(500).json({ 
        message: error.message || "AI 成绩分析失败，请重试" 
      });
    } else {
      // 如果已经开始流式传输，发送错误事件
      res.write(`data: ${JSON.stringify({ error: error.message || "AI 成绩分析失败" })}\n\n`);
      res.end();
    }
  }
});

// 保存 AI 成绩分析记录
router.post("/save-score-analysis", authMiddleware, async (req, res) => {
  try {
    const { name, analysis, examSnapshot, userInfoSnapshot } = req.body;
    const userId = req.userId;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "请输入分析名称" });
    }

    if (!analysis) {
      return res.status(400).json({ message: "分析内容不能为空" });
    }

    console.log("💾 保存成绩分析记录:", name);

    const record = await ScoreAnalysis.create({
      userId,
      name: name.trim(),
      analysis,
      examSnapshot: examSnapshot || [],
      userInfoSnapshot: userInfoSnapshot || {},
    });

    console.log("✅ 成绩分析记录保存成功:", record._id);

    res.json({
      message: "保存成功",
      id: record._id,
      createTime: record.createTime,
    });
  } catch (error) {
    console.error("❌ 保存成绩分析记录失败：", error);
    res.status(500).json({ 
      message: error.message || "保存失败，请重试" 
    });
  }
});

// 获取 AI 成绩分析历史记录列表
router.get("/score-analysis-list", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const { page = 1, limit = 10 } = req.query;

    console.log("📋 获取成绩分析历史记录列表");

    const skip = (page - 1) * limit;
    const list = await ScoreAnalysis.find({ userId })
      .sort({ createTime: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select("_id name createTime")
      .lean();

    const total = await ScoreAnalysis.countDocuments({ userId });

    const formattedList = list.map(item => ({
      id: item._id,
      name: item.name,
      createTime: item.createTime,
      date: new Date(item.createTime).toISOString().split("T")[0],
    }));

    res.json({
      list: formattedList,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error("❌ 获取成绩分析历史记录失败：", error);
    res.status(500).json({ message: "获取历史记录失败" });
  }
});

// 获取 AI 成绩分析历史记录详情
router.get("/score-analysis/:id", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    console.log("📄 获取成绩分析详情:", id);

    const record = await ScoreAnalysis.findOne({ _id: id, userId }).lean();

    if (!record) {
      return res.status(404).json({ message: "记录不存在" });
    }

    res.json({
      id: record._id,
      name: record.name,
      analysis: record.analysis,
      examSnapshot: record.examSnapshot,
      userInfoSnapshot: record.userInfoSnapshot,
      createTime: record.createTime,
      date: new Date(record.createTime).toISOString().split("T")[0],
    });
  } catch (error) {
    console.error("❌ 获取成绩分析详情失败：", error);
    res.status(500).json({ message: "获取详情失败" });
  }
});

// 删除 AI 成绩分析历史记录
router.delete("/score-analysis/:id", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    console.log("🗑️ 删除成绩分析记录:", id);

    const result = await ScoreAnalysis.deleteOne({ _id: id, userId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "记录不存在或无权删除" });
    }

    res.json({ message: "删除成功" });
  } catch (error) {
    console.error("❌ 删除成绩分析记录失败：", error);
    res.status(500).json({ message: "删除失败" });
  }
});

module.exports = router;
