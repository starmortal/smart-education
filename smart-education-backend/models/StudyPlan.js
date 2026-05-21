const mongoose = require("mongoose");

const studyPlanSchema = new mongoose.Schema({
  planId: {
    type: Number,
    unique: true,
    index: true,
  },
  userId: {
    type: String,
    required: true,
    index: true,
  },
  planTitle: {
    type: String,
    required: true,
  },
  subject: {
    type: String,
    required: true,
    enum: ["math", "chinese", "english", "physics", "chemistry", "biology", "history", "geography", "politics"],
  },
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
  },
  description: {
    type: String,
    default: "",
  },
  planStatus: {
    type: String,
    enum: ["not_started", "in_progress", "completed"],
    default: "not_started",
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  targetProgress: {
    type: Number,
    default: 100,
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
studyPlanSchema.index({ userId: 1, planStatus: 1 });
studyPlanSchema.index({ subject: 1 });
studyPlanSchema.index({ startTime: 1, endTime: 1 });

module.exports = mongoose.model("StudyPlan", studyPlanSchema);
