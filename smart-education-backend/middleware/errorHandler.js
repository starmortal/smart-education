const logger = require('../utils/logger');

/**
 * 全局错误处理中间件
 * 统一处理所有未捕获的错误
 */

class AppError extends Error {
  constructor(message, statusCode = 500, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// 错误处理中间件
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.stack = err.stack;

  // 记录错误日志
  logger.error(`${err.message} - ${req.method} ${req.originalUrl}`, {
    error: err.stack,
    body: req.body,
    user: req.userId || 'anonymous'
  });

  // Mongoose 验证错误
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(e => e.message).join(', ');
    error = new AppError(message, 400, 'VALIDATION_ERROR');
  }

  // Mongoose 重复键错误
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field} 已存在`;
    error = new AppError(message, 400, 'DUPLICATE_KEY');
  }

  // Mongoose 类型转换错误
  if (err.name === 'CastError') {
    const message = '无效的数据格式';
    error = new AppError(message, 400, 'INVALID_FORMAT');
  }

  // JWT 错误
  if (err.name === 'JsonWebTokenError') {
    error = new AppError('无效的令牌', 401, 'INVALID_TOKEN');
  }

  if (err.name === 'TokenExpiredError') {
    error = new AppError('令牌已过期', 401, 'TOKEN_EXPIRED');
  }

  // Multer 文件上传错误
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      error = new AppError('文件大小超出限制', 400, 'FILE_TOO_LARGE');
    } else {
      error = new AppError('文件上传失败', 400, 'UPLOAD_ERROR');
    }
  }

  // 返回错误响应
  const statusCode = error.statusCode || 500;
  const response = {
    code: statusCode,
    message: error.message || '服务器内部错误',
    data: null,
    timestamp: Date.now()
  };

  // 开发环境返回堆栈信息
  if (process.env.NODE_ENV !== 'production') {
    response.stack = error.stack;
  }

  res.status(statusCode).json(response);
};

// 404 错误处理
const notFoundHandler = (req, res, next) => {
  const error = new AppError(`路径 ${req.originalUrl} 不存在`, 404, 'NOT_FOUND');
  next(error);
};

// 异步错误包装器
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  AppError,
  errorHandler,
  notFoundHandler,
  asyncHandler
};
