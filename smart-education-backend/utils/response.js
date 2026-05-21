/**
 * 统一响应格式工具类
 * 确保所有API返回格式一致
 */
class ResponseUtil {
  /**
   * 成功响应
   * @param {Object} res - Express响应对象
   * @param {*} data - 返回数据
   * @param {String} message - 提示信息
   * @param {Number} code - 状态码
   */
  static success(res, data = null, message = '操作成功', code = 200) {
    return res.status(200).json({
      code,
      message,
      data,
      timestamp: Date.now()
    });
  }
  
  /**
   * 失败响应
   * @param {Object} res - Express响应对象
   * @param {String} message - 错误信息
   * @param {Number} code - 错误码
   * @param {Number} httpStatus - HTTP状态码
   */
  static error(res, message = '操作失败', code = 500, httpStatus = 500) {
    return res.status(httpStatus).json({
      code,
      message,
      data: null,
      timestamp: Date.now()
    });
  }
  
  /**
   * 参数错误响应
   * @param {Object} res - Express响应对象
   * @param {String} message - 错误信息
   */
  static badRequest(res, message = '参数错误') {
    return this.error(res, message, 400, 400);
  }
  
  /**
   * 未授权响应
   * @param {Object} res - Express响应对象
   * @param {String} message - 错误信息
   */
  static unauthorized(res, message = '未授权访问') {
    return this.error(res, message, 401, 401);
  }
  
  /**
   * 禁止访问响应
   * @param {Object} res - Express响应对象
   * @param {String} message - 错误信息
   */
  static forbidden(res, message = '禁止访问') {
    return this.error(res, message, 403, 403);
  }
  
  /**
   * 资源不存在响应
   * @param {Object} res - Express响应对象
   * @param {String} message - 错误信息
   */
  static notFound(res, message = '资源不存在') {
    return this.error(res, message, 404, 404);
  }
  
  /**
   * 分页响应
   * @param {Object} res - Express响应对象
   * @param {Array} list - 数据列表
   * @param {Number} total - 总数
   * @param {Number} page - 当前页
   * @param {Number} pageSize - 每页数量
   * @param {String} message - 提示信息
   */
  static page(res, list, total, page, pageSize, message = '查询成功') {
    return this.success(res, {
      list,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      }
    }, message);
  }
}

module.exports = ResponseUtil;
