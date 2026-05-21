const mongoose = require("mongoose");

const favoriteSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Question",
    required: true,
    index: true,
  },
  createTime: {
    type: Date,
    default: Date.now,
  },
});

favoriteSchema.index({ userId: 1, questionId: 1 }, { unique: true });

module.exports = mongoose.model("Favorite", favoriteSchema);
