const mongoose = require('mongoose');

const knowledgeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  embeddingModel: {
    type: String,
    default: process.env.EMBEDDING_MODEL || 'text-embedding-ada-002'
  },
  fileCount: {
    type: Number,
    default: 0
  },
  vectorCount: {
    type: Number,
    default: 0
  },
  isSystem: {
    type: Boolean,
    default: false,
    index: true
  },
  subject: {
    type: String,
    enum: ['math', 'physics', 'history', 'chemistry', 'biology', 'english', 'geography', 'general'],
    default: 'general'
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

knowledgeSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Knowledge', knowledgeSchema);
