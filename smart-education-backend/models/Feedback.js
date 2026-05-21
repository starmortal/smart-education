const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  nickname: {
    type: String,
    default: "匿名用户",
  },
  type: {
    type: String,
    enum: ["suggestion", "bug", "question", "other"],
    required: true,
  },
  contact: {
    type: String,
    default: "",
  },
  content: {
    type: String,
    required: true,
  },
  screenshots: {
    type: [String],
    default: [],
  },
  status: {
    type: String,
    enum: ["submitted", "replied"],
    default: "submitted",
  },
  reply: {
    type: String,
    default: "",
  },
  replyTime: {
    type: Date,
  },
  adminId: {
    type: String,
  },
  createTime: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Feedback", feedbackSchema);
