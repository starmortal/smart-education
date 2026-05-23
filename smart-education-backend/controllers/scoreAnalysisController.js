const ScoreAnalysis = require('../models/ScoreAnalysis');
const ai = require('../utils/ai');
const logger = require('../utils/logger');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

function formatExamListForPrompt(examList = []) {
  if (!examList.length) return '暂无考试记录';

  return examList
    .map((exam, index) => {
      const scoresText = (exam.scores || [])
        .map((s) => `${s.subject}: ${s.score}/${s.fullScore || 100}`)
        .join('、');
      return `${index + 1}. ${exam.examName || '考试'}（${exam.examDate || '未知日期'}）
   总分：${exam.totalScore ?? '-'}${exam.totalFullScore ? `/${exam.totalFullScore}` : ''}
   各科：${scoresText || '无'}`;
    })
    .join('\n\n');
}

function buildScoreAnalysisPrompt(examList, userInfo = {}) {
  const grade = userInfo.grade || '未设置';
  const subjects = (userInfo.subjects || []).join('、') || '未设置';
  const examsText = formatExamListForPrompt(examList);

  return `你是一位专业的 K12 学习分析师。请根据以下学生成绩数据，用中文 Markdown 格式输出详细分析报告。

## 学生信息
- 年级：${grade}
- 学习科目：${subjects}

## 考试记录
${examsText}

## 输出要求
请按以下结构输出，内容具体、可执行，适合学生和家长阅读：

### 📊 整体表现
用 2-3 句话总结整体水平与趋势

### 📈 优势科目
列出表现较好的科目及原因

### 📉 薄弱科目
列出需要加强的科目及可能原因

### 🔍 成绩趋势
分析多次考试的变化（若有多次记录）

### 💡 学习建议
给出 3-5 条具体可操作的建议

### 🎯 下一步计划
给出近期学习重点与目标

要求：使用 Markdown 标题与列表，语言亲切专业，不要输出 JSON。`;
}

/**
 * 流式 AI 成绩分析（硅基流动 DeepSeek，OpenAI 兼容接口）
 */
exports.analyzeScoresStream = asyncHandler(async (req, res) => {
  const { examList = [], userInfo = {} } = req.body;

  if (!Array.isArray(examList) || examList.length === 0) {
    throw new AppError('暂无考试记录，无法分析', 400);
  }

  if (!ai.client) {
    throw new AppError('AI 服务未配置，请检查 OPENAI_API_KEY 等环境变量', 503);
  }

  const prompt = buildScoreAnalysisPrompt(examList, userInfo);

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  const systemMsg = {
    role: 'system',
    content: '你是专业的学业分析助手，使用 Markdown 输出清晰、可执行的成绩分析报告。',
  };

  try {
    logger.info(`AI 成绩分析(流式): userId=${req.userId || 'unknown'}, exams=${examList.length}`);

    await ai.chatStream(prompt, [systemMsg], (chunk) => {
      res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
    });

    res.write('data: [DONE]\n\n');
    res.end();
    logger.info('AI 成绩分析流式完成');
  } catch (error) {
    logger.error('AI 成绩分析流式失败', error);
    res.write(`data: ${JSON.stringify({ content: `\n\n## ❌ 分析失败\n\n${error.message || '请稍后重试'}` })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
});

/**
 * 保存分析记录
 */
exports.saveScoreAnalysis = asyncHandler(async (req, res) => {
  const userId = req.userId;
  if (!userId) {
    throw new AppError('未授权访问', 401);
  }

  const { name, analysis, examSnapshot = [], userInfoSnapshot = {} } = req.body;
  if (!name?.trim() || !analysis?.trim()) {
    throw new AppError('分析名称和内容不能为空', 400);
  }

  const record = await ScoreAnalysis.create({
    userId,
    name: name.trim(),
    analysis: analysis.trim(),
    examSnapshot,
    userInfoSnapshot,
  });

  res.json({
    message: '保存成功',
    id: record._id.toString(),
  });
});

/**
 * 分析历史列表
 */
exports.getScoreAnalysisList = asyncHandler(async (req, res) => {
  const userId = req.userId;
  if (!userId) {
    throw new AppError('未授权访问', 401);
  }

  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
  const skip = (page - 1) * limit;

  const [records, total] = await Promise.all([
    ScoreAnalysis.find({ userId })
      .sort({ createTime: -1 })
      .skip(skip)
      .limit(limit)
      .select('name createTime'),
    ScoreAnalysis.countDocuments({ userId }),
  ]);

  const list = records.map((r) => ({
    id: r._id.toString(),
    name: r.name,
    date: r.createTime
      ? new Date(r.createTime).toLocaleString('zh-CN', { hour12: false })
      : '',
    createTime: r.createTime,
  }));

  res.json({ list, total, page, limit });
});

/**
 * 分析详情
 */
exports.getScoreAnalysisDetail = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { id } = req.params;

  const record = await ScoreAnalysis.findOne({ _id: id, userId });
  if (!record) {
    throw new AppError('记录不存在', 404);
  }

  res.json({
    id: record._id.toString(),
    name: record.name,
    analysis: record.analysis,
    examSnapshot: record.examSnapshot,
    userInfoSnapshot: record.userInfoSnapshot,
    date: record.createTime
      ? new Date(record.createTime).toLocaleString('zh-CN', { hour12: false })
      : '',
    createTime: record.createTime,
  });
});

/**
 * 删除分析记录
 */
exports.deleteScoreAnalysis = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { id } = req.params;

  const record = await ScoreAnalysis.findOneAndDelete({ _id: id, userId });
  if (!record) {
    throw new AppError('记录不存在', 404);
  }

  res.json({ message: '删除成功' });
});
