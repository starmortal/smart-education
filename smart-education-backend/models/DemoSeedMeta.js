const mongoose = require('mongoose');

const demoSeedMetaSchema = new mongoose.Schema({
  packId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  packName: String,
  version: String,
  importedAt: {
    type: Date,
    default: Date.now,
  },
  counts: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  ids: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
});

module.exports = mongoose.model('DemoSeedMeta', demoSeedMetaSchema);
