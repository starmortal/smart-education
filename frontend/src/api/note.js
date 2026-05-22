import request from '@/utils/request';

/**
 * 笔记相关 API
 */

// 获取笔记列表
export const getNoteList = (params) => {
  return request({
    url: '/api/note/list',
    method: 'get',
    params
  });
};

// 新增笔记
export const addNote = (data) => {
  return request({
    url: '/api/note/add',
    method: 'post',
    data
  });
};

// 更新笔记
export const updateNote = (id, data) => {
  return request({
    url: `/api/note/update/${id}`,
    method: 'put',
    data
  });
};

// 删除笔记
export const deleteNote = (id) => {
  return request({
    url: `/api/note/delete/${id}`,
    method: 'delete'
  });
};

// 获取所有标签
export const getNoteTags = (userId) => {
  return request({
    url: '/api/note/tags',
    method: 'get',
    params: { userId }
  });
};
