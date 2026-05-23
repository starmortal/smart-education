import request from '../utils/request';

const BASE_URL = 'http://localhost:3001/api/chat';

// 创建话题
export const createTopic = (data) => {
  return request.post(`${BASE_URL}/topic/create`, data);
};

// 获取助手下的所有话题
export const getTopics = (assistantId) => {
  return request.get(`${BASE_URL}/topic/list`, { params: { assistantId } });
};

// 获取话题详情
export const getTopic = (id) => {
  return request.get(`${BASE_URL}/topic/${id}`);
};

// 更新话题标题
export const updateTopic = (id, title) => {
  return request.put(`${BASE_URL}/topic/${id}`, { title });
};

// 删除话题
export const deleteTopic = (id) => {
  return request.delete(`${BASE_URL}/topic/${id}`);
};

// 发送消息
export const sendMessage = (topicId, message, attachments = [], temporaryKnowledgeBases = []) => {
  return request.post(`${BASE_URL}/message/send`, { 
    topicId, 
    message, 
    attachments,
    temporaryKnowledgeBases
  });
};

// 流式发送消息
export const sendMessageStream = (topicId, message, attachments = [], temporaryKnowledgeBases = []) => {
  return `${BASE_URL}/message/send-stream`;
};

// 上传文件
export const uploadFile = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return request.post(`${BASE_URL}/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

// 清空话题消息
export const clearMessages = (id) => {
  return request.delete(`${BASE_URL}/topic/${id}/messages`);
};
