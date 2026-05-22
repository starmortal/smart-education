const nodemailer = require("nodemailer");
const logger = require("../utils/logger");

/**
 * 邮件通知服务
 */
class EmailNotificationService {
  constructor() {
    this.transporter = null;
    this.initTransporter();
  }

  /**
   * 初始化邮件传输器
   */
  initTransporter() {
    try {
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || "smtp.qq.com",
        port: process.env.EMAIL_PORT || 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
      logger.info("邮件服务初始化成功");
    } catch (error) {
      logger.error("邮件服务初始化失败", error);
    }
  }

  /**
   * 发送通知邮件
   * @param {String} to - 收件人邮箱
   * @param {String} subject - 邮件主题
   * @param {String} html - 邮件HTML内容
   */
  async sendNotificationEmail(to, subject, html) {
    if (!this.transporter) {
      logger.warn("邮件服务未初始化，跳过发送");
      return false;
    }

    if (!to) {
      logger.warn("收件人邮箱为空，跳过发送");
      return false;
    }

    try {
      const info = await this.transporter.sendMail({
        from: `"智慧教育平台" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
      });

      logger.info(`邮件发送成功: ${to}, MessageID: ${info.messageId}`);
      return true;
    } catch (error) {
      logger.error(`邮件发送失败: ${to}`, error);
      return false;
    }
  }

  /**
   * 生成通知邮件HTML模板
   * @param {String} title - 通知标题
   * @param {String} content - 通知内容
   * @param {String} actionUrl - 操作链接（可选）
   * @param {String} actionText - 操作按钮文本（可选）
   */
  generateEmailTemplate(title, content, actionUrl = null, actionText = "查看详情") {
    const actionButton = actionUrl
      ? `<a href="${actionUrl}" style="display: inline-block; padding: 12px 24px; background-color: #0969da; color: #ffffff; text-decoration: none; border-radius: 6px; margin-top: 20px;">${actionText}</a>`
      : "";

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f7fa;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f7fa; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <!-- 头部 -->
                <tr>
                  <td style="background: linear-gradient(135deg, #0969da 0%, #0550ae 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">智慧教育平台</h1>
                  </td>
                </tr>
                <!-- 内容 -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 20px; font-weight: 600;">${title}</h2>
                    <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.6;">${content}</p>
                    ${actionButton}
                  </td>
                </tr>
                <!-- 底部 -->
                <tr>
                  <td style="padding: 20px 30px; background-color: #f5f7fa; border-radius: 0 0 12px 12px; text-align: center;">
                    <p style="margin: 0; color: #999999; font-size: 14px;">此邮件由系统自动发送，请勿回复</p>
                    <p style="margin: 10px 0 0 0; color: #999999; font-size: 14px;">© 2026 智慧教育平台 版权所有</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  /**
   * 发送注册欢迎邮件
   */
  async sendRegisterEmail(to, nickname) {
    const subject = "🎉 欢迎加入智慧教育平台";
    const content = `亲爱的 ${nickname}，<br><br>欢迎您加入智慧教育平台！我们很高兴能够陪伴您开启学习之旅。<br><br>在这里，您可以：<br>• 使用AI智能答题助手<br>• 管理错题本和学习笔记<br>• 制定个性化学习计划<br>• 与其他学习者交流互动<br><br>祝您学习愉快！`;
    const html = this.generateEmailTemplate(subject, content, "http://localhost:8080/ai-chat", "开始学习");
    return await this.sendNotificationEmail(to, subject, html);
  }

  /**
   * 发送回复通知邮件
   */
  async sendReplyEmail(to, questionTitle, replierName) {
    const subject = "💬 您的问题有新回复";
    const content = `您好，<br><br>用户 <strong>${replierName}</strong> 回复了您的问题 "<strong>${questionTitle}</strong>"。<br><br>快去查看吧！`;
    const html = this.generateEmailTemplate(subject, content, "http://localhost:8080/study-community", "查看回复");
    return await this.sendNotificationEmail(to, subject, html);
  }

  /**
   * 发送关注通知邮件
   */
  async sendFollowEmail(to, followerName) {
    const subject = "👥 您有新的粉丝";
    const content = `您好，<br><br>用户 <strong>${followerName}</strong> 关注了您！<br><br>快去看看吧！`;
    const html = this.generateEmailTemplate(subject, content, "http://localhost:8080/profile", "查看个人主页");
    return await this.sendNotificationEmail(to, subject, html);
  }

  /**
   * 发送系统公告邮件
   */
  async sendSystemEmail(to, title, content) {
    const subject = `📢 系统通知：${title}`;
    const html = this.generateEmailTemplate(title, content);
    return await this.sendNotificationEmail(to, subject, html);
  }
}

module.exports = new EmailNotificationService();
