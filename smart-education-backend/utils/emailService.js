const nodemailer = require("nodemailer");

// 验证码存储（生产环境建议用Redis）
const verificationCodes = new Map();

// 创建邮件发送器
const createTransporter = () => {
  return nodemailer.createTransport({
    service: "qq", // 使用QQ邮箱服务
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER, // 发件人邮箱
      pass: process.env.EMAIL_PASS, // 邮箱授权码（不是密码）
    },
  });
};

// 生成6位随机验证码
const generateCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// 发送验证码邮件
exports.sendVerificationCode = async (email) => {
  try {
    const code = generateCode();
    const transporter = createTransporter();

    const mailOptions = {
      from: `"智慧教育平台" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "【智慧教育平台】邮箱验证码",
      html: `
        <div style="padding: 20px; background: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px;">
            <h2 style="color: #0969da; text-align: center;">智慧教育平台</h2>
            <p style="font-size: 16px; color: #333;">您好！</p>
            <p style="font-size: 14px; color: #666;">您正在注册智慧教育平台账号，验证码为：</p>
            <div style="text-align: center; margin: 30px 0;">
              <span style="font-size: 32px; font-weight: bold; color: #0969da; letter-spacing: 5px;">${code}</span>
            </div>
            <p style="font-size: 14px; color: #999;">验证码5分钟内有效，请勿泄露给他人。</p>
            <p style="font-size: 12px; color: #999; margin-top: 30px;">如非本人操作，请忽略此邮件。</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    // 存储验证码，5分钟过期
    verificationCodes.set(email, {
      code,
      expireTime: Date.now() + 5 * 60 * 1000,
    });

    return { success: true, message: "验证码已发送" };
  } catch (error) {
    console.error("发送邮件失败：", error);
    throw new Error("发送验证码失败，请检查邮箱配置");
  }
};

// 验证验证码
exports.verifyCode = (email, code) => {
  const stored = verificationCodes.get(email);

  if (!stored) {
    return { success: false, message: "验证码不存在或已过期" };
  }

  if (Date.now() > stored.expireTime) {
    verificationCodes.delete(email);
    return { success: false, message: "验证码已过期" };
  }

  if (stored.code !== code) {
    return { success: false, message: "验证码错误" };
  }

  // 验证成功后删除验证码
  verificationCodes.delete(email);
  return { success: true, message: "验证成功" };
};

// 发送反馈通知邮件给管理员
exports.sendFeedbackNotification = async (feedbackData) => {
  try {
    const { feedbackId, nickname, type, content, createTime } = feedbackData;
    
    // 指定的管理员邮箱
    const adminEmail = "2492592700@qq.com";
    
    const transporter = createTransporter();

    const typeMap = {
      suggestion: '💡 功能建议',
      bug: '🐛 Bug反馈',
      question: '❓ 使用问题',
      other: '💬 其他'
    };

    const mailOptions = {
      from: `"智慧教育平台" <${process.env.EMAIL_USER}>`,
      to: adminEmail,
      subject: `【新反馈】${typeMap[type] || '用户反馈'} - 智慧教育平台`,
      html: `
        <div style="padding: 20px; background: #f5f5f5;">
          <div style="max-width: 700px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px;">
            <h2 style="color: #0969da; text-align: center; border-bottom: 2px solid #0969da; padding-bottom: 15px;">
              📬 收到新的用户反馈
            </h2>
            
            <div style="margin: 25px 0;">
              <div style="margin-bottom: 20px;">
                <strong style="color: #666;">反馈类型：</strong>
                <span style="color: #0969da; font-weight: bold;">${typeMap[type] || '其他'}</span>
              </div>
              
              <div style="margin-bottom: 20px;">
                <strong style="color: #666;">用户昵称：</strong>
                <span style="color: #333;">${nickname}</span>
              </div>
              
              <div style="margin-bottom: 20px;">
                <strong style="color: #666;">提交时间：</strong>
                <span style="color: #333;">${new Date(createTime).toLocaleString('zh-CN')}</span>
              </div>
              
              <div style="margin-bottom: 20px;">
                <strong style="color: #666;">反馈内容：</strong>
                <div style="margin-top: 10px; padding: 15px; background: #f5f7fa; border-radius: 8px; border-left: 4px solid #0969da;">
                  <p style="color: #333; line-height: 1.8; white-space: pre-wrap; margin: 0;">${content}</p>
                </div>
              </div>
              
              <div style="margin-top: 30px; padding: 15px; background: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;">
                <p style="margin: 0; color: #856404; font-size: 14px;">
                  <strong>反馈ID：</strong>${feedbackId}
                </p>
                <p style="margin: 8px 0 0 0; color: #856404; font-size: 13px;">
                  请及时登录后台查看并回复用户反馈
                </p>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e4e7ed;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                智慧教育平台 - 用户反馈系统
              </p>
            </div>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return { success: true, message: "反馈通知已发送" };
  } catch (error) {
    console.error("发送反馈通知邮件失败：", error);
    throw new Error("发送反馈通知失败：" + error.message);
  }
};
