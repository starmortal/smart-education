const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  type: {
    type: String,
    required: true,
    enum: ["register", "login", "reply", "like", "follow", "system", "aiPlan"],
    index: true,
  },
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
  relatedType: {
    type: String,
    enum: ["question", "answer", "user", null],
    default: null,
  },
  relatedData: {
    userName: String,
    userAvatar: String,
    questionTitle: String,
    questionId: String,
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true,
  },
  createTime: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

// 复合索引：用户ID + 是否已读 + 创建时间
notificationSchema.index({ userId: 1, isRead: 1, createTime: -1 });

// 复合索引：用户ID + 类型 + 创建时间
notificationSchema.index({ userId: 1, type: 1, createTime: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
