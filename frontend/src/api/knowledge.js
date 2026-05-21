import request from '../utils/request';

export const getKnowledgeBases = (userId) => {
  return request.get(`/api/knowledge/user/${userId}`);
};

export const createKnowledgeBase = (data) => {
  return request.post('/api/knowledge', data);
};

export const updateKnowledgeBase = (id, data) => {
  return request.put(`/api/knowledge/${id}`, data);
};

export const deleteKnowledgeBase = (id) => {
  return request.delete(`/api/knowledge/${id}`);
};

export const getKnowledgeFiles = (knowledgeId) => {
  return request.get(`/api/knowledge/${knowledgeId}/files`);
};

export const uploadFile = (knowledgeId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  return request.post(`/api/knowledge/${knowledgeId}/files`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

export const addText = (knowledgeId, data) => {
  return request.post(`/api/knowledge/${knowledgeId}/text`, data);
};

export const addURL = (knowledgeId, data) => {
  return request.post(`/api/knowledge/${knowledgeId}/url`, data);
};

export const deleteFile = (fileId) => {
  return request.delete(`/api/knowledge/files/${fileId}`);
};

export const searchKnowledge = (knowledgeId, query, topK = 5) => {
  return request.post(`/api/knowledge/${knowledgeId}/search`, { query, topK });
};
