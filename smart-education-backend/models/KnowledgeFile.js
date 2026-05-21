const mongoose = require('mongoose');

const knowledgeFileSchema = new mongoose.Schema({
  knowledgeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Knowledge',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['file', 'url', 'text', 'folder'],
    required: true
  },
  source: {
    type: String,
    required: true
  },
  content: {
    type: String,
    default: ''
  },
  vectors: [{
    text: String,
    embedding: [Number],
    metadata: {
      page: Number,
      section: String
    }
  }],
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  error: {
    type: String,
    default: ''
  },
  fileSize: {
    type: Number,
    default: 0
  },
  mimeType: {
    type: String,
    default: ''
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

knowledgeFileSchema.index({ knowledgeId: 1, createdAt: -1 });
knowledgeFileSchema.index({ status: 1 });

module.exports = mongoose.model('KnowledgeFile', knowledgeFileSchema);
