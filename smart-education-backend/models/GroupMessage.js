const mongoose = require('mongoose');

// 学习小组聊天消息模型
const groupMessageSchema = new mongoose.Schema({
  groupId: {
    type: Number,
    required: true,
    index: true
  },
  userId: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  userAvatar: {
    type: String,
    default: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'
  },
  content: {
    type: String,
    required: true
  },
  createTime: {
    type: Date,
    default: Date.now,
    expires: 86400 // 24小时后自动删除（TTL索引）
  }
});

// 创建TTL索引，24小时后自动删除消息
groupMessageSchema.index({ createTime: 1 }, { expireAfterSeconds: 86400 });

module.exports = mongoose.model('GroupMessage', groupMessageSchema);
