const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * 用户服务层
 * 处理用户相关的业务逻辑
 */
class UserService {
  /**
   * 用户注册
   * @param {Object} userData - 用户数据
   * @returns {Object} 注册结果
   */
  async register(userData) {
    // 检查用户是否已存在
    const existingUser = await User.findOne({
      $or: [
        { email: userData.email },
        { phone: userData.phone }
      ]
    });
    
    if (existingUser) {
      throw new Error('该手机号或邮箱已被注册');
    }
    
    // 加密密码
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    // 创建用户
    const user = new User({
      ...userData,
      password: hashedPassword,
      emailVerified: false
    });
    
    await user.save();
    
    // 生成token
    const token = this.generateToken(user._id);
    
    return {
      userId: user._id,
      nickname: user.nickname,
      avatar: user.avatar,
      email: user.email,
      phone: user.phone,
      token,
      message: '注册成功'
    };
  }
  
  /**
   * 用户登录
   * @param {Object} credentials - 登录凭证
   * @returns {Object} 登录结果
   */
  async login(credentials) {
    // 查找用户（支持手机号或邮箱登录）
    const user = await User.findOne({
      $or: [
        { email: credentials.account },
        { phone: credentials.account }
      ]
    });
    
    if (!user) {
      throw new Error('用户不存在');
    }
    
    // 验证密码
    const isValid = await bcrypt.compare(credentials.password, user.password);
    
    if (!isValid) {
      throw new Error('密码错误');
    }
    
    // 更新最后登录时间
    user.lastLoginTime = new Date();
    await user.save();
    
    // 生成token
    const token = this.generateToken(user._id);
    
    return {
      userId: user._id,
      nickname: user.nickname,
      avatar: user.avatar,
      email: user.email,
      phone: user.phone,
      token,
      message: '登录成功'
    };
  }
  
  /**
   * 获取用户信息
   * @param {String} userId - 用户ID
   * @returns {Object} 用户信息
   */
  async getUserInfo(userId) {
    const user = await User.findById(userId)
      .select('-password') // 不返回密码
      .lean();
    
    if (!user) {
      throw new Error('用户不存在');
    }
    
    return user;
  }
  
  /**
   * 更新用户信息
   * @param {String} userId - 用户ID
   * @param {Object} updateData - 更新数据
   * @returns {Object} 更新后的用户信息
   */
  async updateUserInfo(userId, updateData) {
    // 不允许直接更新密码和敏感字段
    const allowedFields = ['nickname', 'avatar'];
    const filteredData = {};
    
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        filteredData[field] = updateData[field];
      }
    });
    
    const user = await User.findByIdAndUpdate(
      userId,
      filteredData,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      throw new Error('用户不存在');
    }
    
    return user;
  }
  
  /**
   * 修改密码
   * @param {String} userId - 用户ID
   * @param {String} oldPassword - 旧密码
   * @param {String} newPassword - 新密码
   */
  async changePassword(userId, oldPassword, newPassword) {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('用户不存在');
    }
    
    // 验证旧密码
    const isValid = await bcrypt.compare(oldPassword, user.password);
    
    if (!isValid) {
      throw new Error('原密码错误');
    }
    
    // 加密新密码
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    
    return { message: '密码修改成功' };
  }
  
  /**
   * 生成JWT Token
   * @param {String} userId - 用户ID
   * @returns {String} JWT Token
   */
  generateToken(userId) {
    return jwt.sign(
      { userId },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
  }
  
  /**
   * 验证Token
   * @param {String} token - JWT Token
   * @returns {Object} 解码后的数据
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new Error('Token无效或已过期');
    }
  }
}

module.exports = new UserService();
