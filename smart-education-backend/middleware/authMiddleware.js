const jwt = require('jsonwebtoken');

/**
 * JWT认证中间件（支持x-user-id备用认证）
 * 验证请求头中的Token，并将用户ID添加到请求对象
 * 如果没有Token但有x-user-id，也允许通过（用于开发环境）
 */
const authMiddleware = (req, res, next) => {
  try {
    // 优先从请求头获取token
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      
      try {
        // 验证token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        return next();
      } catch (error) {
        if (error.name === 'TokenExpiredError') {
          return res.status(401).json({
            code: 401,
            message: 'Token已过期，请重新登录'
          });
        }
        
        if (error.name === 'JsonWebTokenError') {
          return res.status(401).json({
            code: 401,
            message: 'Token无效'
          });
        }
      }
    }
    
    // 备用方案：检查x-user-id头部（用于开发环境或特殊场景）
    const userId = req.headers['x-user-id'];
    if (userId) {
      req.userId = userId;
      return next();
    }
    
    // 既没有token也没有x-user-id
    return res.status(401).json({
      code: 401,
      message: '未授权访问，请先登录'
    });
  } catch (error) {
    return res.status(500).json({
      code: 500,
      message: '服务器错误'
    });
  }
};

/**
 * 可选认证中间件
 * Token存在时验证，不存在时也允许通过
 */
const optionalAuthMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.userId = decoded.userId;
    }
    
    next();
  } catch (error) {
    // Token无效时也允许通过，但不设置userId
    next();
  }
};

module.exports = {
  authMiddleware,
  optionalAuthMiddleware
};
