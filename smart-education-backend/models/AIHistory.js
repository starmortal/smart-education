// AI答题历史记录数据模型
const mongoose = require("mongoose");

const aiHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  // 对话标题（取第一个问题的前20个字符）
  title: {
    type: String,
    required: true,
  },
  // 对话类型
  type: {
    type: String,
    enum: ["text", "image", "file"],
    default: "text",
  },
  // 对话消息列表（支持多轮对话）
  messages: [{
    question: {
      type: String,
      required: true,
    },
    answer: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    }
  }],
  // 创建时间
  createTime: {
    type: Date,
    default: Date.now,
  },
  // 最后更新时间
  updateTime: {
    type: Date,
    default: Date.now,
  },
});

// 添加索引，优化查询速度
aiHistorySchema.index({ userId: 1, updateTime: -1 });

module.exports = mongoose.model("AIHistory", aiHistorySchema);
