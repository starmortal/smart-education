import request from "@/utils/request";

export const userApi = {
  register: (data) => request.post("/api/user/register", data),
  login: (data) => request.post("/api/user/login", data),
};

export const aiApi = {
  textAnswer: (data) => request.post("/api/ai/text-answer", data),
  imageAnswer: (data) => request.post("/api/ai/image-answer", data),
};

export const errorBookApi = {
  getList: (userId, params) => request.get(`/api/error-book/list/${userId}`, { params }),
  add: (data) => request.post("/api/error-book/add", data),
  update: (id, data) => request.put(`/api/error-book/update/${id}`, data),
  markMastered: (id) => request.put(`/api/error-book/mark-mastered/${id}`),
  delete: (id) => request.delete(`/api/error-book/delete/${id}`),
};

export const noteApi = {
  getList: (params) => request.get("/api/note/list", { params }),
  add: (data) => request.post("/api/note/add", data),
  update: (id, data) => request.put(`/api/note/update/${id}`, data),
  delete: (id) => request.delete(`/api/note/delete/${id}`),
  getCategories: (params) => request.get("/api/note/categories", { params }),
  getTags: (params) => request.get("/api/note/tags", { params }),
};

export const studyPlanApi = {
  getList: (params) => request.get("/api/study-plan/list", { params }),
  add: (data) => request.post("/api/study-plan/add", data),
  update: (id, data) => request.put(`/api/study-plan/update/${id}`, data),
  markCompleted: (id) => request.put(`/api/study-plan/mark-completed/${id}`),
  delete: (id) => request.delete(`/api/study-plan/delete/${id}`),
};

export const studyDataApi = {
  getList: (params) => request.get("/api/study-data/list", { params }),
};

export default {
  userApi,
  aiApi,
  errorBookApi,
  noteApi,
  studyPlanApi,
  studyDataApi,
};
