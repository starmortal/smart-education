const User = require("../models/User");
const jwt = require("jsonwebtoken");

// 生成JWT Token（密钥可在.env中配置，这里先临时写）
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, "your-secret-key-123", {
    // 后续改到.env
    expiresIn: "7d", // Token有效期7天
  });
};

// 1. 用户注册
exports.register = async (req, res) => {
  try {
    const { username, password, email } = req.body;
    // 检查用户是否已存在
    const userExist = await User.findOne({ $or: [{ username }, { email }] });
    if (userExist) {
      return res.status(400).json({ message: "用户名或邮箱已存在" });
    }
    // 创建新用户
    const user = await User.create({ username, password, email });
    // 返回用户信息（隐藏密码）+ Token
    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: "注册失败", error: err.message });
  }
};

// 2. 用户登录
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    // 查找用户
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: "用户不存在" });
    }
    // 验证密码
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "密码错误" });
    }
    // 返回登录信息
    res.status(200).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: "登录失败", error: err.message });
  }
};

// 3. 获取当前登录用户信息
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password"); // 排除密码
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: "获取用户信息失败", error: err.message });
  }
};
