const ai = require('../utils/ai');
const ErrorQuestion = require('../models/ErrorQuestion');
const { toSubjectName } = require('../utils/subjectMap');
const logger = require('../utils/logger');

function parseJsonArray(text) {
  if (!text) return [];
  const trimmed = text.trim();
  try {
    const parsed = JSON.parse(trimmed);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    const match = trimmed.match(/\[[\s\S]*\]/);
    if (match) {
      try {
        const parsed = JSON.parse(match[0]);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        return [];
      }
    }
    return [];
  }
}

function fallbackKnowledgePoints(questionTitle, subject) {
  const subjectName = toSubjectName(subject);
  const title = String(questionTitle || '').trim();
  if (!title) return [subjectName];

  const chunks = title
    .split(/[，,、；;。.!！?？\s]+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 2 && s.length <= 12);

  const points = [subjectName, ...chunks.slice(0, 2)];
  return [...new Set(points)].slice(0, 3);
}

/**
 * AI 提取错题知识点
 */
async function extractKnowledgePoints({ questionTitle, subject, wrongReason = '' }) {
  const fallback = fallbackKnowledgePoints(questionTitle, subject);

  try {
    const prompt = `请从以下错题信息中提取 1-3 个核心知识点标签（短语，2-8 字）。
科目：${toSubjectName(subject)}（${subject}）
题目：${questionTitle}
错因：${wrongReason || '未填写'}

只返回 JSON 数组，例如：["一元二次方程","因式分解"]`;

    const systemMsg = { role: 'system', content: '你是 K12 知识点标注助手，只输出 JSON 数组，不要其他文字。' };
    const text = await ai.chat(prompt, [systemMsg]);
    const points = parseJsonArray(text)
      .map((p) => String(p).trim())
      .filter((p) => p.length >= 2 && p.length <= 20);

    if (points.length > 0) {
      return [...new Set(points)].slice(0, 5);
    }
  } catch (error) {
    logger.warn('AI 知识点提取失败，使用兜底规则', error.message);
  }

  return fallback;
}

/**
 * 为错题保存知识点（异步）
 */
async function annotateErrorQuestion(errorId) {
  const doc = await ErrorQuestion.findById(errorId);
  if (!doc) return null;
  if (doc.knowledgePoints?.length > 0) return doc;

  const points = await extractKnowledgePoints({
    questionTitle: doc.questionTitle,
    subject: doc.subject,
    wrongReason: doc.wrongReason,
  });

  doc.knowledgePoints = points;
  doc.updateTime = new Date();
  await doc.save();
  return doc;
}

/**
 * 批量补标注无知识点的错题
 */
async function batchAnnotateUserErrors(userId, limit = 20) {
  const list = await ErrorQuestion.find({
    userId: String(userId),
    $or: [{ knowledgePoints: { $exists: false } }, { knowledgePoints: { $size: 0 } }],
  })
    .sort({ updateTime: -1 })
    .limit(limit)
    .select('_id');

  let count = 0;
  for (const item of list) {
    await annotateErrorQuestion(item._id);
    count += 1;
  }
  return count;
}

module.exports = {
  extractKnowledgePoints,
  annotateErrorQuestion,
  batchAnnotateUserErrors,
  fallbackKnowledgePoints,
};
