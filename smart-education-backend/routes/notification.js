const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");

// 通知列表和操作
router.get("/list", notificationController.getNotificationList);
router.get("/unread-count", notificationController.getUnreadCount);
router.put("/read-all", notificationController.markAllAsRead);
router.delete("/clear-all", notificationController.clearAllNotifications);
router.put("/:id/read", notificationController.markAsRead);
router.delete("/:id", notificationController.deleteNotification);

// 通知设置
router.get("/settings", notificationController.getSettings);
router.put("/settings", notificationController.updateSettings);

module.exports = router;
