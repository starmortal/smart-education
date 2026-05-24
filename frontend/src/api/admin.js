import axios from 'axios';
import { ElMessage } from 'element-plus';
import router from '@/router';

const adminService = axios.create({
  baseURL: 'http://localhost:3001',
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json;charset=utf-8',
  },
});

adminService.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

adminService.interceptors.response.use(
  (response) => {
    const res = response.data;
    if (res.code && res.code !== 200) {
      ElMessage.error(res.message || '请求失败');
      if (res.code === 401) {
        localStorage.removeItem('admin-token');
        localStorage.removeItem('admin-username');
        router.push('/admin/login');
      }
      return Promise.reject(new Error(res.message || '请求失败'));
    }
    return res;
  },
  (error) => {
    const data = error.response?.data;
    const msg = (typeof data?.message === 'string' && data.message)
      || error.message
      || '网络错误';
    ElMessage.error(msg);
    if (error.response?.status === 401) {
      localStorage.removeItem('admin-token');
      localStorage.removeItem('admin-username');
      router.push('/admin/login');
    }
    return Promise.reject(new Error(msg));
  }
);

export function adminLogin(username, password) {
  return adminService.post('/api/admin/login', { username, password });
}

export function getAdminOverview() {
  return adminService.get('/api/admin/stats/overview');
}

export function getAdminTrends(days = 30) {
  return adminService.get('/api/admin/stats/trends', { params: { days } });
}

export function getAdminDistribution() {
  return adminService.get('/api/admin/stats/distribution');
}

export function broadcastAnnouncement(title, content) {
  return adminService.post('/api/admin/broadcast', { title, content });
}

export function getAdminFeedbackList(params) {
  return adminService.get('/api/admin/feedback/list', { params });
}

export function replyAdminFeedback(feedbackId, reply) {
  return adminService.post('/api/admin/feedback/reply', { feedbackId, reply });
}

export default adminService;
