/**
 * 时间处理工具类
 * 统一处理北京时间（UTC+8）的格式化显示
 * 注意：数据库仍使用标准Date类型存储，此工具仅用于前端显示格式化
 */

/**
 * 将任意时间转换为北京时间并格式化
 * @param {Date|string|number} date - 输入的时间
 * @param {boolean} includeSeconds - 是否包含秒，默认true
 * @returns {string} 格式化后的北京时间字符串，如：2024年01月15日 14时30分25秒
 */
function formatBeijingTime(date = new Date(), includeSeconds = true) {
  if (!date) return '';
  
  const d = new Date(date);
  
  // 转换为北京时间（UTC+8）
  const beijingTime = new Date(d.getTime() + (8 * 60 * 60 * 1000));
  
  const year = beijingTime.getUTCFullYear();
  const month = String(beijingTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(beijingTime.getUTCDate()).padStart(2, '0');
  const hours = String(beijingTime.getUTCHours()).padStart(2, '0');
  const minutes = String(beijingTime.getUTCMinutes()).padStart(2, '0');
  const seconds = String(beijingTime.getUTCSeconds()).padStart(2, '0');
  
  if (includeSeconds) {
    return `${year}年${month}月${day}日 ${hours}时${minutes}分${seconds}秒`;
  } else {
    return `${year}年${month}月${day}日 ${hours}时${minutes}分`;
  }
}

/**
 * 格式化北京时间为简洁格式（YYYY-MM-DD HH:mm:ss）
 * @param {Date|string|number} date - 输入的时间
 * @param {boolean} includeSeconds - 是否包含秒，默认true
 * @returns {string} 格式化后的时间字符串
 */
function formatBeijingTimeSimple(date = new Date(), includeSeconds = true) {
  if (!date) return '';
  
  const d = new Date(date);
  
  // 转换为北京时间（UTC+8）
  const beijingTime = new Date(d.getTime() + (8 * 60 * 60 * 1000));
  
  const year = beijingTime.getUTCFullYear();
  const month = String(beijingTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(beijingTime.getUTCDate()).padStart(2, '0');
  const hours = String(beijingTime.getUTCHours()).padStart(2, '0');
  const minutes = String(beijingTime.getUTCMinutes()).padStart(2, '0');
  const seconds = String(beijingTime.getUTCSeconds()).padStart(2, '0');
  
  if (includeSeconds) {
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  } else {
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }
}

/**
 * 格式化北京时间为日期格式（YYYY-MM-DD）
 * @param {Date|string|number} date - 输入的时间
 * @returns {string} 格式化后的日期字符串
 */
function formatBeijingDate(date = new Date()) {
  if (!date) return '';
  
  const d = new Date(date);
  
  // 转换为北京时间（UTC+8）
  const beijingTime = new Date(d.getTime() + (8 * 60 * 60 * 1000));
  
  const year = beijingTime.getUTCFullYear();
  const month = String(beijingTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(beijingTime.getUTCDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

module.exports = {
  formatBeijingTime,
  formatBeijingTimeSimple,
  formatBeijingDate
};
