const mongoose = require('mongoose');

// 消息子模式
const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    required: true,
    enum: ['user', 'assistant', 'system']
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

// 话题模型
const topicSchema = new mongoose.Schema({
  assistantId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Assistant',
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
    default: '新对话'
  },
  messages: {
    type: [messageSchema],
    default: []
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
topicSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// 索引
topicSchema.index({ assistantId: 1, updatedAt: -1 });
topicSchema.index({ userId: 1, updatedAt: -1 });

const Topic = mongoose.model('Topic', topicSchema);

module.exports = Topic;
