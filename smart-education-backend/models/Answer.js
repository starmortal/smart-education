const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Question",
    required: true,
    index: true,
  },
  content: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    required: true,
    index: true,
  },
  userName: {
    type: String,
    default: "匿名用户",
  },
  userAvatar: {
    type: String,
    default: "https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png",
  },
  likeCount: {
    type: Number,
    default: 0,
  },
  isBest: {
    type: Boolean,
    default: false,
  },
  createTime: {
    type: Date,
    default: Date.now,
  },
});

answerSchema.index({ questionId: 1, createTime: -1 });
answerSchema.index({ userId: 1 });

module.exports = mongoose.model("Answer", answerSchema);
