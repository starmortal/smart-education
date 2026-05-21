const mongoose = require("mongoose");

/**
 * AI 成绩分析记录模型
 * 用于保存用户的成绩分析历史记录
 */
const scoreAnalysisSchema = new mongoose.Schema({
  // 用户ID
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  
  // 分析名称/备注
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  
  // AI 分析内容（Markdown 格式）
  analysis: {
    type: String,
    required: true,
  },
  
  // 分析时使用的考试数据快照
  examSnapshot: {
    type: Array,
    default: [],
  },
  
  // 用户信息快照
  userInfoSnapshot: {
    grade: String,
    subjects: [String],
  },
  
  // 创建时间
  createTime: {
    type: Date,
    default: Date.now,
  },
});

// 创建索引
scoreAnalysisSchema.index({ userId: 1, createTime: -1 });

const ScoreAnalysis = mongoose.model("ScoreAnalysis", scoreAnalysisSchema);

module.exports = ScoreAnalysis;
