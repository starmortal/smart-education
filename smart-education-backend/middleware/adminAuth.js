const { AppError } = require('./errorHandler');

const ADMIN_TOKEN = 'admin-authenticated';

/**
 * 管理后台鉴权（与前端 localStorage admin-token 一致）
 */
function adminAuthMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : req.headers['x-admin-token'];

  if (token === ADMIN_TOKEN) {
    req.adminId = 'admin';
    return next();
  }

  throw new AppError('未授权访问管理后台', 401, 'ADMIN_UNAUTHORIZED');
}

module.exports = {
  adminAuthMiddleware,
  ADMIN_TOKEN,
};
