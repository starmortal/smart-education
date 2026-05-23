import request from '@/utils/request';

const BASE_URL = 'http://localhost:3001';

/**
 * 获取学习画像
 */
export function getLearningProfile(params = {}) {
  return request({
    url: '/api/study-plan/learning-profile',
    method: 'get',
    params,
  });
}

/**
 * AI 生成计划预览
 */
export function previewAiPlans(data) {
  return request({
    url: '/api/study-plan/ai-generate/preview',
    method: 'post',
    data,
  });
}

/**
 * AI 流式生成计划预览（SSE）
 */
export function previewAiPlansStream(data, onEvent) {
  const token = localStorage.getItem('edu-token');
  const userId = localStorage.getItem('edu-user-id');

  return fetch(`${BASE_URL}/api/study-plan/ai-generate/preview-stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
      'x-user-id': userId || data.userId || '',
    },
    body: JSON.stringify(data),
  }).then(async (response) => {
    if (!response.ok) {
      throw new Error(`请求失败 (${response.status})`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      lines.forEach((line) => {
        if (!line.startsWith('data: ')) return;
        try {
          const payload = JSON.parse(line.slice(6));
          onEvent?.(payload);
        } catch (e) {
          // ignore parse errors
        }
      });
    }
  });
}

/**
 * 确认导入 AI 计划
 */
export function confirmAiPlans(data) {
  return request({
    url: '/api/study-plan/ai-generate/confirm',
    method: 'post',
    data,
  });
}

/**
 * 根据进度智能调整计划
 */
export function adjustAiPlans(data) {
  return request({
    url: '/api/study-plan/ai-generate/adjust',
    method: 'post',
    data,
  });
}

/**
 * 获取 AI 计划偏好设置
 */
export function getAiPlanSettings(params = {}) {
  return request({
    url: '/api/study-plan/ai-settings',
    method: 'get',
    params,
  });
}

/**
 * 保存 AI 计划偏好设置
 */
export function saveAiPlanSettings(data) {
  return request({
    url: '/api/study-plan/ai-settings',
    method: 'put',
    data,
  });
}

/**
 * 立即执行定时生成（手动触发）
 */
export function runScheduleNow(data = {}) {
  return request({
    url: '/api/study-plan/ai-schedule/run-now',
    method: 'post',
    data,
  });
}
