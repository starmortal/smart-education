import request from '@/utils/request';

export function getPlatformDocList() {
  return request.get('/api/platform-docs/list');
}

export function getPlatformDocDetail(slug) {
  return request.get(`/api/platform-docs/${slug}`);
}
