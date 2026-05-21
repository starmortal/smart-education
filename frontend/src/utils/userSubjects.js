// 用户科目管理工具
import axios from 'axios';

// 科目映射表（中文 -> 英文）
export const subjectMap = {
  '语文': 'chinese',
  '数学': 'math',
  '英语': 'english',
  '物理': 'physics',
  '化学': 'chemistry',
  '生物': 'biology',
  '历史': 'history',
  '地理': 'geography',
  '政治': 'politics'
};

// 科目映射表（英文 -> 中文）
export const subjectMapReverse = {
  'chinese': '语文',
  'math': '数学',
  'english': '英语',
  'physics': '物理',
  'chemistry': '化学',
  'biology': '生物',
  'history': '历史',
  'geography': '地理',
  'politics': '政治'
};

// 所有支持的科目列表（用于验证）
export const allSubjects = [
  '语文', '数学', '英语', '物理', '化学', '生物', '历史', '地理', '政治'
];

// 获取用户设置的科目列表
export async function getUserSubjects() {
  try {
    const userId = localStorage.getItem('edu-user-id');
    if (!userId) {
      console.warn('用户未登录');
      return [];
    }

    const response = await axios.get(`http://localhost:3001/api/user/profile/${userId}`);
    const subjects = response.data?.subjects || [];
    
    // 确保返回的是数组
    if (!Array.isArray(subjects)) {
      console.warn('科目数据格式错误，返回空数组');
      return [];
    }
    
    return subjects;
  } catch (error) {
    console.error('获取用户科目失败：', error);
    return [];
  }
}

// 将中文科目转换为英文代码
export function getSubjectCode(chineseName) {
  return subjectMap[chineseName] || chineseName;
}

// 将英文代码转换为中文科目
export function getSubjectName(code) {
  return subjectMapReverse[code] || code;
}

// 生成科目选项（用于 el-select）
export function generateSubjectOptions(userSubjects) {
  if (!Array.isArray(userSubjects) || userSubjects.length === 0) {
    return [];
  }
  
  return userSubjects.map(subject => ({
    label: subject,
    value: getSubjectCode(subject)
  }));
}

// 检查用户是否设置了科目
export function hasUserSubjects(userSubjects) {
  return Array.isArray(userSubjects) && userSubjects.length > 0;
}
