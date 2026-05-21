import request from '../utils/request';

const BASE_URL = 'http://localhost:3001/api/assistant';

// 创建助手
export const createAssistant = (data) => {
  return request.post(`${BASE_URL}/create`, data);
};

// 创建默认助手
export const createDefaultAssistant = (userId) => {
  return request.post(`${BASE_URL}/create-default`, { userId });
};

// 获取用户的所有助手
export const getAssistants = (userId) => {
  return request.get(`${BASE_URL}/list`, { params: { userId } });
};

// 获取单个助手详情
export const getAssistant = (id) => {
  return request.get(`${BASE_URL}/${id}`);
};

// 更新助手
export const updateAssistant = (id, data) => {
  return request.put(`${BASE_URL}/${id}`, data);
};

// 删除助手
export const deleteAssistant = (id) => {
  return request.delete(`${BASE_URL}/${id}`);
};
