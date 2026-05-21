const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  noteTitle: {
    type: String,
    required: true,
  },
  noteCategory: {
    type: String,
    required: true,
    enum: ["knowledge_summary", "exercise_analysis", "class_note", "review_experience"],
  },
  noteTag: {
    type: [String],
    default: [],
  },
  noteContent: {
    type: String,
    required: true,
  },
  createTime: {
    type: Date,
    default: Date.now,
  },
  updateTime: {
    type: Date,
    default: Date.now,
  },
});

// 添加索引优化查询性能
noteSchema.index({ userId: 1, createTime: -1 }); // 用户ID和创建时间复合索引
noteSchema.index({ noteCategory: 1 }); // 分类索引
noteSchema.index({ noteTag: 1 }); // 标签索引

module.exports = mongoose.model("Note", noteSchema);
