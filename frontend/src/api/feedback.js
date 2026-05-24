import { request } from '@/utils/request';

export function submitFeedback(data) {
  return request.post('/api/feedback/submit', data, { timeout: 60000 });
}

export function getFeedbackHistory(userId) {
  return request.get('/api/feedback/history', { userId });
}
