const mongoose = require("mongoose");

const answerLikeSchema = new mongoose.Schema({
  answerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Answer",
    required: true,
    index: true,
  },
  userId: {
    type: String,
    required: true,
    index: true,
  },
  createTime: {
    type: Date,
    default: Date.now,
  },
});

answerLikeSchema.index({ answerId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model("AnswerLike", answerLikeSchema);
