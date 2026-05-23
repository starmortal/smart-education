/**
 * 科目中英文映射（与前端 userSubjects.js 保持一致）
 */

const SUBJECT_MAP = {
  语文: 'chinese',
  数学: 'math',
  英语: 'english',
  物理: 'physics',
  化学: 'chemistry',
  生物: 'biology',
  历史: 'history',
  地理: 'geography',
  政治: 'politics',
};

const SUBJECT_MAP_REVERSE = Object.fromEntries(
  Object.entries(SUBJECT_MAP).map(([cn, en]) => [en, cn])
);

const VALID_SUBJECT_CODES = Object.values(SUBJECT_MAP);

const GRADE_LABELS = {
  primary_1: '小学一年级',
  primary_2: '小学二年级',
  primary_3: '小学三年级',
  primary_4: '小学四年级',
  primary_5: '小学五年级',
  primary_6: '小学六年级',
  junior_1: '初一',
  junior_2: '初二',
  junior_3: '初三',
  senior_1: '高一',
  senior_2: '高二',
  senior_3: '高三',
};

function toSubjectCode(name) {
  if (!name) return '';
  if (VALID_SUBJECT_CODES.includes(name)) return name;
  return SUBJECT_MAP[name] || name;
}

function toSubjectName(code) {
  if (!code) return '';
  return SUBJECT_MAP_REVERSE[code] || code;
}

function getGradeLabel(grade) {
  return GRADE_LABELS[grade] || grade || '未设置';
}

module.exports = {
  SUBJECT_MAP,
  SUBJECT_MAP_REVERSE,
  VALID_SUBJECT_CODES,
  GRADE_LABELS,
  toSubjectCode,
  toSubjectName,
  getGradeLabel,
};
