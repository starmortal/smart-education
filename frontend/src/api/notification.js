import request from '@/utils/request';

/**
 * 通知相关 API
 */

/**
 * 获取通知列表
 * @param {Object} params - 查询参数
 * @param {Number} params.page - 页码
 * @param {Number} params.pageSize - 每页数量
 * @param {Boolean} params.isRead - 是否已读（可选）
 */
export function getNotificationList(params) {
  return request({
    url: '/api/notification/list',
    method: 'get',
    params,
  });
}

/**
 * 获取未读通知数量
 */
export function getUnreadCount() {
  return request({
    url: '/api/notification/unread-count',
    method: 'get',
  });
}

/**
 * 标记通知为已读
 * @param {String} id - 通知ID
 */
export function markAsRead(id) {
  return request({
    url: `/api/notification/${id}/read`,
    method: 'put',
  });
}

/**
 * 标记所有通知为已读
 */
export function markAllAsRead() {
  return request({
    url: '/api/notification/read-all',
    method: 'put',
  });
}

/**
 * 删除通知
 * @param {String} id - 通知ID
 */
export function deleteNotification(id) {
  return request({
    url: `/api/notification/${id}`,
    method: 'delete',
  });
}

/**
 * 清空所有通知
 */
export function clearAllNotifications() {
  return request({
    url: '/api/notification/clear-all',
    method: 'delete',
  });
}

/**
 * 获取通知设置
 */
export function getNotificationSettings() {
  return request({
    url: '/api/notification/settings',
    method: 'get',
  });
}

/**
 * 更新通知设置
 * @param {Object} settings - 设置数据
 */
export function updateNotificationSettings(settings) {
  return request({
    url: '/api/notification/settings',
    method: 'put',
    data: settings,
  });
}
