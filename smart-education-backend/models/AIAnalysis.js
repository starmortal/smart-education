const mongoose = require('mongoose');

const aiAnalysisSchema = new mongoose.Schema({
  questionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  difficulty: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  keywords: [{
    type: String
  }],
  knowledgePoints: [{
    type: String
  }],
  relatedQuestions: [{
    type: String
  }],
  suggestion: {
    type: String
  },
  quickAnswer: {
    type: String
  },
  learningPath: [{
    step: String,
    description: String,
    completed: Boolean
  }],
  createTime: {
    type: Date,
    default: Date.now
  },
  updateTime: {
    type: Date,
    default: Date.now
  }
});

// 更新时间自动更新
aiAnalysisSchema.pre('save', function(next) {
  this.updateTime = Date.now();
  next();
});

const AIAnalysis = mongoose.model('AIAnalysis', aiAnalysisSchema);

module.exports = AIAnalysis;
