import { request } from '@/utils/request';

export function getChangelogList() {
  return request.get('/api/changelog/list');
}

export function getChangelogDetail(version) {
  return request.get(`/api/changelog/${version}`);
}
