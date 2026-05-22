const mongoose = require('mongoose');

const followSchema = new mongoose.Schema({
  followerId: {
    type: String,
    required: true,
    index: true
  },
  followingId: {
    type: String,
    required: true,
    index: true
  },
  createTime: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'blocked'],
    default: 'active'
  }
});

// 复合索引，确保唯一性
followSchema.index({ followerId: 1, followingId: 1 }, { unique: true });

// 索引优化查询
followSchema.index({ followerId: 1, status: 1 });
followSchema.index({ followingId: 1, status: 1 });

const Follow = mongoose.model('Follow', followSchema);

module.exports = Follow;
