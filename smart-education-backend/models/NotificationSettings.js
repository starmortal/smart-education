const mongoose = require("mongoose");

const notificationSettingsSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  emailEnabled: {
    type: Boolean,
    default: true,
  },
  notificationTypes: {
    register: {
      type: Boolean,
      default: true,
    },
    login: {
      type: Boolean,
      default: true,
    },
    reply: {
      type: Boolean,
      default: true,
    },
    like: {
      type: Boolean,
      default: true,
    },
    follow: {
      type: Boolean,
      default: true,
    },
    system: {
      type: Boolean,
      default: true,
    },
  },
  createTime: {
    type: Date,
    default: Date.now,
  },
  updateTime: {
    type: Date,
    default: Date.now,
  },
});

// 更新时自动更新 updateTime
notificationSettingsSchema.pre("save", function (next) {
  this.updateTime = Date.now();
  next();
});

module.exports = mongoose.model("NotificationSettings", notificationSettingsSchema);
