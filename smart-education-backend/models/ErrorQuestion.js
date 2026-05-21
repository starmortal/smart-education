const mongoose = require("mongoose");

const errorQuestionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  questionTitle: {
    type: String,
    required: true,
    trim: true,
  },
  subject: {
    type: String,
    required: true,
    enum: ["math", "chinese", "english", "physics", "chemistry", "biology", "history", "geography", "politics"],
  },
  questionType: {
    type: String,
    enum: ["single_choice", "multiple_choice", "blank", "short_answer", "calculation"],
    default: "single_choice",
  },
  masteryStatus: {
    type: String,
    enum: ["unmastered", "mastering", "mastered"],
    default: "unmastered",
  },
  wrongReason: {
    type: String,
    default: "",
  },
  correctAnalysis: {
    type: String,
    default: "",
  },
  userAnswer: {
    type: String,
    default: "",
  },
  addTime: {
    type: Date,
    default: Date.now,
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

errorQuestionSchema.index({ userId: 1, masteryStatus: 1 });
errorQuestionSchema.index({ subject: 1 });
errorQuestionSchema.index({ createTime: -1 });

module.exports = mongoose.model("ErrorQuestion", errorQuestionSchema);
