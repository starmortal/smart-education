const notificationService = require("../services/notificationService");
const Response = require("../utils/response");
const { asyncHandler } = require("../middleware/errorHandler");

/**
 * 获取通知列表
 */
exports.getNotificationList = asyncHandler(async (req, res) => {
  const userId = req.headers["x-user-id"];
  const { page = 1, pageSize = 20, isRead } = req.query;

  const options = {
    page: parseInt(page),
    pageSize: parseInt(pageSize),
  };

  if (isRead !== undefined) {
    options.isRead = isRead === "true";
  }

  const result = await notificationService.getUserNotifications(userId, options);
  Response.page(res, result.list, result.total, result.page, result.pageSize);
});

/**
 * 获取未读通知数量
 */
exports.getUnreadCount = asyncHandler(async (req, res) => {
  const userId = req.headers["x-user-id"];
  const count = await notificationService.getUnreadCount(userId);
  Response.success(res, { count }, "获取未读通知数量成功");
});

/**
 * 标记通知为已读
 */
exports.markAsRead = asyncHandler(async (req, res) => {
  const userId = req.headers["x-user-id"];
  const { id } = req.params;

  const notification = await notificationService.markAsRead(id, userId);
  if (!notification) {
    return Response.notFound(res, "通知不存在");
  }

  Response.success(res, notification, "标记已读成功");
});

/**
 * 标记所有通知为已读
 */
exports.markAllAsRead = asyncHandler(async (req, res) => {
  const userId = req.headers["x-user-id"];
  const count = await notificationService.markAllAsRead(userId);
  Response.success(res, { count }, `已标记 ${count} 条通知为已读`);
});

/**
 * 删除通知
 */
exports.deleteNotification = asyncHandler(async (req, res) => {
  const userId = req.headers["x-user-id"];
  const { id } = req.params;

  const notification = await notificationService.deleteNotification(id, userId);
  if (!notification) {
    return Response.notFound(res, "通知不存在");
  }

  Response.success(res, null, "删除成功");
});

/**
 * 清空所有通知
 */
exports.clearAllNotifications = asyncHandler(async (req, res) => {
  const userId = req.headers["x-user-id"];
  const count = await notificationService.clearAllNotifications(userId);
  Response.success(res, { count }, `已清空 ${count} 条通知`);
});

/**
 * 获取通知设置
 */
exports.getSettings = asyncHandler(async (req, res) => {
  const userId = req.headers["x-user-id"];
  const settings = await notificationService.getUserSettings(userId);
  Response.success(res, settings, "获取通知设置成功");
});

/**
 * 更新通知设置
 */
exports.updateSettings = asyncHandler(async (req, res) => {
  const userId = req.headers["x-user-id"];
  const settingsData = req.body;

  const settings = await notificationService.updateUserSettings(userId, settingsData);
  Response.success(res, settings, "更新通知设置成功");
});
