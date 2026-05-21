const mongoose = require('mongoose');

// 学习小组模型
const studyGroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  creatorId: {
    type: String,
    required: true
  },
  members: [{
    type: String
  }],
  memberCount: {
    type: Number,
    default: 1
  },
  createTime: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('StudyGroup', studyGroupSchema);
