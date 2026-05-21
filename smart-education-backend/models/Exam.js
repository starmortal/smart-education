const mongoose = require("mongoose");

const examSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  examName: {
    type: String,
    required: true,
  },
  examDate: {
    type: String,
    required: true,
  },
  scores: [{
    subject: String,
    score: Number,
    fullScore: {
      type: Number,
      default: 150  // 默认满分150
    }
  }],
  totalScore: {
    type: Number,
    required: true,
  },
  totalFullScore: {
    type: Number,
    default: 0  // 总满分
  },
  createTime: {
    type: Date,
    default: Date.now,
  },
});

// 添加索引优化查询
examSchema.index({ userId: 1, examDate: -1 });

module.exports = mongoose.model("Exam", examSchema);
