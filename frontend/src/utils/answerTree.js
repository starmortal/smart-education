/**
 * 将扁平回答列表构建为树（最多两级展示）
 */
export function buildAnswerTree(answers) {
  if (!Array.isArray(answers) || answers.length === 0) return [];

  const map = new Map();
  const roots = [];

  answers.forEach((item) => {
    map.set(item.id, { ...item, children: [] });
  });

  answers.forEach((item) => {
    const node = map.get(item.id);
    if (item.parentId && map.has(item.parentId)) {
      map.get(item.parentId).children.push(node);
    } else {
      roots.push(node);
    }
  });

  const sortByTimeAsc = (a, b) => new Date(a.createTime) - new Date(b.createTime);
  const sortByTimeDesc = (a, b) => new Date(b.createTime) - new Date(a.createTime);

  roots.sort(sortByTimeDesc);
  roots.forEach((root) => {
    if (root.children?.length) {
      root.children.sort(sortByTimeAsc);
    }
  });

  return roots;
}

export function countAllAnswers(answers) {
  return Array.isArray(answers) ? answers.length : 0;
}
