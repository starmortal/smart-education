const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  phone: {
    type: String,
    unique: true,
    sparse: true,
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  nickname: {
    type: String,
    default: "智慧学习者",
  },
  avatar: {
    type: String,
    default: "https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png",
  },
  createTime: {
    type: Date,
    default: Date.now,
  },
  lastLoginTime: {
    type: Date,
  },
  emailVerified: {
    type: Boolean,
    default: false,
  },
  grade: {
    type: String,
    default: "",
  },
  school: {
    type: String,
    default: "",
  },
  subjects: {
    type: [String],
    default: [],
  },
  subjectFullScores: {
    type: Map,
    of: Number,
    default: {},
  },
});

userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ createTime: -1 });

module.exports = mongoose.model("User", userSchema);
