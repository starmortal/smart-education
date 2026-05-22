const mongoose = require('mongoose');

// 助手模型
const assistantSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  prompt: {
    type: String,
    default: '',
    maxlength: 5000
  },
  model: {
    type: String,
    default: 'deepseek-chat',
    trim: true
  },
  temperature: {
    type: Number,
    default: 0.7,
    min: 0,
    max: 2
  },
  topP: {
    type: Number,
    default: 1,
    min: 0,
    max: 1
  },
  maxTokens: {
    type: Number,
    default: 2048,
    min: 1,
    max: 32000
  },
  knowledgeBases: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Knowledge'
  }],
  isDefault: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 更新时间中间件
assistantSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// 索引
assistantSchema.index({ userId: 1, createdAt: -1 });

const Assistant = mongoose.model('Assistant', assistantSchema);

module.exports = Assistant;
