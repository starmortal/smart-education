const mongoose = require("mongoose");

/**
 * 学习笔记数据模型
 * 功能：存储用户的学习笔记，支持Markdown格式
 */
const noteSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  noteTitle: {
    type: String,
    required: true,
    default: "无标题笔记",
  },
  noteContent: {
    type: String,
    default: "",
  },
  noteCategory: {
    type: String,
    default: "未分类",
  },
  noteTags: {
    type: [String],
    default: [],
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

// 更新时自动更新updateTime
noteSchema.pre("save", function (next) {
  this.updateTime = Date.now();
  next();
});

// 更新操作时自动更新updateTime
noteSchema.pre("findOneAndUpdate", function (next) {
  this.set({ updateTime: Date.now() });
  next();
});

module.exports = mongoose.model("Note", noteSchema);
