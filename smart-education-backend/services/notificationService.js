const Notification = require("../models/Notification");
const NotificationSettings = require("../models/NotificationSettings");
const socketManager = require("../utils/socketManager");
const emailNotificationService = require("./emailNotificationService");
const logger = require("../utils/logger");
const User = require("../models/User");

/**
 * 通知服务
 */
class NotificationService {
  /**
   * 创建通知
   * @param {Object} notificationData - 通知数据
   * @returns {Object} 创建的通知
   */
  async createNotification(notificationData) {
    try {
      const notification = new Notification(notificationData);
      await notification.save();
      logger.info(`创建通知成功: ${notification._id}, 用户: ${notification.userId}, 类型: ${notification.type}`);
      return notification;
    } catch (error) {
      logger.error("创建通知失败", error);
      throw error;
    }
  }

  /**
   * 发送通知（创建 + 实时推送 + 邮件）
   * @param {String} userId - 接收者用户ID
   * @param {String} type - 通知类型
   * @param {String} title - 通知标题
   * @param {String} content - 通知内容
   * @param {Object} options - 可选参数
   */
  async sendNotification(userId, type, title, content, options = {}) {
    try {
      // 1. 检查用户通知设置
      const settings = await this.getUserSettings(userId);
      if (!settings.notificationTypes[type]) {
        logger.info(`用户 ${userId} 已关闭 ${type} 类型通知`);
        return null;
      }

      // 2. 创建通知记录
      const notificationData = {
        userId,
        type,
        title,
        content,
        relatedId: options.relatedId || null,
        relatedType: options.relatedType || null,
        relatedData: options.relatedData || {},
      };

      const notification = await this.createNotification(notificationData);

      // 3. 实时推送通知
      socketManager.emitToUser(userId, "notification:new", {
        id: notification._id,
        type: notification.type,
        title: notification.title,
        content: notification.content,
        relatedData: notification.relatedData,
        createTime: notification.createTime,
      });

      // 4. 发送邮件通知（如果开启）
      if (settings.emailEnabled && this.shouldSendEmail(type)) {
        await this.sendEmailNotification(userId, type, title, content, options);
      }

      return notification;
    } catch (error) {
      logger.error("发送通知失败", error);
      throw error;
    }
  }

  /**
   * 判断是否应该发送邮件
   * @param {String} type - 通知类型
   */
  shouldSendEmail(type) {
    // 登录和点赞通知不发送邮件
    const noEmailTypes = ["login", "like"];
    return !noEmailTypes.includes(type);
  }

  /**
   * 发送邮件通知
   */
  async sendEmailNotification(userId, type, title, content, options) {
    try {
      // 获取用户邮箱
      const user = await User.findById(userId);
      if (!user || !user.email) {
        logger.warn(`用户 ${userId} 没有邮箱，跳过邮件发送`);
        return;
      }

      // 根据类型发送不同的邮件
      switch (type) {
        case "register":
          await emailNotificationService.sendRegisterEmail(user.email, user.nickname);
          break;
        case "reply":
          await emailNotificationService.sendReplyEmail(
            user.email,
            options.relatedData?.questionTitle || "您的问题",
            options.relatedData?.userName || "某位用户"
          );
          break;
        case "follow":
          await emailNotificationService.sendFollowEmail(
            user.email,
            options.relatedData?.userName || "某位用户"
          );
          break;
        case "system":
          await emailNotificationService.sendSystemEmail(user.email, title, content);
          break;
        default:
          logger.info(`通知类型 ${type} 不发送邮件`);
      }
    } catch (error) {
      logger.error("发送邮件通知失败", error);
    }
  }

  /**
   * 获取用户通知设置
   */
  async getUserSettings(userId) {
    try {
      let settings = await NotificationSettings.findOne({ userId });
      if (!settings) {
        // 创建默认设置
        settings = new NotificationSettings({ userId });
        await settings.save();
        logger.info(`为用户 ${userId} 创建默认通知设置`);
      }
      return settings;
    } catch (error) {
      logger.error("获取用户通知设置失败", error);
      throw error;
    }
  }

  /**
   * 更新用户通知设置
   */
  async updateUserSettings(userId, settingsData) {
    try {
      let settings = await NotificationSettings.findOne({ userId });
      if (!settings) {
        settings = new NotificationSettings({ userId, ...settingsData });
      } else {
        Object.assign(settings, settingsData);
      }
      await settings.save();
      logger.info(`更新用户 ${userId} 通知设置成功`);
      return settings;
    } catch (error) {
      logger.error("更新用户通知设置失败", error);
      throw error;
    }
  }

  /**
   * 获取用户通知列表
   */
  async getUserNotifications(userId, options = {}) {
    try {
      const { page = 1, pageSize = 20, isRead = null } = options;
      const query = { userId };
      if (isRead !== null) {
        query.isRead = isRead;
      }

      const total = await Notification.countDocuments(query);
      const notifications = await Notification.find(query)
        .sort({ createTime: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize);

      return {
        list: notifications,
        total,
        page,
        pageSize,
      };
    } catch (error) {
      logger.error("获取用户通知列表失败", error);
      throw error;
    }
  }

  /**
   * 获取未读通知数量
   */
  async getUnreadCount(userId) {
    try {
      const count = await Notification.countDocuments({ userId, isRead: false });
      return count;
    } catch (error) {
      logger.error("获取未读通知数量失败", error);
      throw error;
    }
  }

  /**
   * 标记通知为已读
   */
  async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, userId },
        { isRead: true },
        { new: true }
      );

      if (notification) {
        // 实时推送已读状态
        socketManager.emitToUser(userId, "notification:read", {
          id: notificationId,
        });
        logger.info(`标记通知 ${notificationId} 为已读`);
      }

      return notification;
    } catch (error) {
      logger.error("标记通知为已读失败", error);
      throw error;
    }
  }

  /**
   * 标记所有通知为已读
   */
  async markAllAsRead(userId) {
    try {
      const result = await Notification.updateMany({ userId, isRead: false }, { isRead: true });
      logger.info(`标记用户 ${userId} 的所有通知为已读，共 ${result.modifiedCount} 条`);
      return result.modifiedCount;
    } catch (error) {
      logger.error("标记所有通知为已读失败", error);
      throw error;
    }
  }

  /**
   * 删除通知
   */
  async deleteNotification(notificationId, userId) {
    try {
      const notification = await Notification.findOneAndDelete({ _id: notificationId, userId });
      if (notification) {
        logger.info(`删除通知 ${notificationId}`);
      }
      return notification;
    } catch (error) {
      logger.error("删除通知失败", error);
      throw error;
    }
  }

  /**
   * 清空所有通知
   */
  async clearAllNotifications(userId) {
    try {
      const result = await Notification.deleteMany({ userId });
      logger.info(`清空用户 ${userId} 的所有通知，共 ${result.deletedCount} 条`);
      return result.deletedCount;
    } catch (error) {
      logger.error("清空所有通知失败", error);
      throw error;
    }
  }
}

module.exports = new NotificationService();
